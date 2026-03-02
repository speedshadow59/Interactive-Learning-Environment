const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/authMiddleware');
const User = require('../models/User');
const Course = require('../models/Course');
const Submission = require('../models/Submission');
const Progress = require('../models/Progress');
const Assignment = require('../models/Assignment');
const Challenge = require('../models/Challenge');
const { calculateLevelFromExperience } = require('../utils/progression');
const { generateTeacherInterventionSummary } = require('../services/aiAssistantService');

/*
  Dashboard routes aggregate student/teacher insights:
  - teacher analytics + roster risk signals
  - student dashboard summary + leaderboard
  - CSV export for reporting
*/

// Shared authorization helper for analytics/reporting endpoints.
const isTeacherOrAdmin = (role) => role === 'teacher' || role === 'admin';
const isAdmin = (role) => role === 'admin';

const escapeCsv = (value) => {
  const safeValue = value === null || value === undefined ? '' : String(value);
  return `"${safeValue.replace(/"/g, '""')}"`;
};

const parseBoolean = (value) => {
  if (typeof value === 'boolean') return value;
  if (typeof value !== 'string') return false;
  return ['true', '1', 'yes', 'on'].includes(value.toLowerCase());
};

// Builds enriched roster rows (risk, activity, assignment state) for teacher UI filters.
const buildTeacherRoster = async (teacherId, role, filters = {}) => {
  const baseCourseFilter = isAdmin(role) ? {} : { instructor: teacherId };
  const allCourses = await Course.find(baseCourseFilter, 'title');

  const courseFilter = { ...baseCourseFilter };

  if (filters.courseId) {
    courseFilter._id = filters.courseId;
  }

  const courses = await Course.find(courseFilter)
    .populate('enrolledStudents', 'firstName lastName email grade');

  const courseIds = courses.map((course) => course._id);
  const courseIdSet = new Set(courseIds.map((courseId) => courseId.toString()));

  const studentMap = new Map();
  courses.forEach((course) => {
    const courseId = course._id.toString();
    course.enrolledStudents.forEach((student) => {
      const studentId = student._id.toString();
      const existing = studentMap.get(studentId);

      if (existing) {
        existing.courseIds.add(courseId);
      } else {
        studentMap.set(studentId, {
          id: student._id,
          firstName: student.firstName,
          lastName: student.lastName,
          email: student.email,
          grade: student.grade,
          courseIds: new Set([courseId]),
        });
      }
    });
  });

  const allStudentIds = Array.from(studentMap.keys());

  const assignments = courseIds.length
    ? await Assignment.find(
        { course: { $in: courseIds }, isPublished: true },
        'course assignedTo dueDate'
      )
    : [];

  const submissions = courseIds.length
    ? await Submission.find(
        { course: { $in: courseIds } },
        'course assignment student result submittedAt'
      )
    : [];

  const progressRows = allStudentIds.length && courseIds.length
    ? await Progress.find(
        {
          student: { $in: allStudentIds },
          course: { $in: courseIds },
        },
        'student course lastActivityAt totalPoints'
      )
    : [];

  const latestByAssignmentStudent = submissions.reduce((acc, submission) => {
    const assignmentId = submission.assignment?.toString();
    const studentId = submission.student?.toString();

    if (!assignmentId || !studentId) return acc;

    const key = `${assignmentId}:${studentId}`;
    const existing = acc[key];

    if (!existing || new Date(submission.submittedAt) > new Date(existing.submittedAt)) {
      acc[key] = submission;
    }

    return acc;
  }, {});

  const failedSubmissionCounts = submissions.reduce((acc, submission) => {
    if (submission.result !== 'failed') return acc;
    const studentId = submission.student?.toString();
    const courseId = submission.course?.toString();
    if (!studentId || !courseId || !courseIdSet.has(courseId)) return acc;

    acc[studentId] = (acc[studentId] || 0) + 1;
    return acc;
  }, {});

  const evaluatedSubmissionsByStudent = submissions.reduce((acc, submission) => {
    if (submission.result !== 'passed' && submission.result !== 'failed') return acc;

    const studentId = submission.student?.toString();
    if (!studentId) return acc;

    if (!acc[studentId]) {
      acc[studentId] = [];
    }

    acc[studentId].push(submission);
    return acc;
  }, {});

  const studentProgressMap = progressRows.reduce((acc, row) => {
    const studentId = row.student.toString();
    if (!acc[studentId]) {
      acc[studentId] = {
        totalPoints: 0,
        lastActivityAt: null,
      };
    }

    acc[studentId].totalPoints += row.totalPoints || 0;

    if (row.lastActivityAt) {
      const current = acc[studentId].lastActivityAt;
      if (!current || new Date(row.lastActivityAt) > new Date(current)) {
        acc[studentId].lastActivityAt = row.lastActivityAt;
      }
    }

    return acc;
  }, {});

  const assignmentStatusByStudent = assignments.reduce((acc, assignment) => {
    const dueDate = assignment.dueDate ? new Date(assignment.dueDate) : null;

    assignment.assignedTo.forEach((studentIdRef) => {
      const studentId = studentIdRef.toString();
      if (!studentMap.has(studentId)) return;

      if (!acc[studentId]) {
        acc[studentId] = {
          assigned: 0,
          completed: 0,
          overdue: 0,
          pending: 0,
        };
      }

      const key = `${assignment._id.toString()}:${studentId}`;
      const latestSubmission = latestByAssignmentStudent[key];
      const isCompleted = latestSubmission?.result === 'passed';
      const isOverdue = dueDate && dueDate < new Date() && !isCompleted;

      acc[studentId].assigned += 1;

      if (isCompleted) {
        acc[studentId].completed += 1;
      } else if (isOverdue) {
        acc[studentId].overdue += 1;
      } else {
        acc[studentId].pending += 1;
      }
    });

    return acc;
  }, {});

  const yearGroupFilter = Number(filters.yearGroup);
  const hasYearGroupFilter = Number.isFinite(yearGroupFilter) && yearGroupFilter > 0;
  const riskOnly = parseBoolean(filters.riskOnly);

  const roster = Array.from(studentMap.values())
    .map((student) => {
      const studentId = student.id.toString();
      const progress = studentProgressMap[studentId] || { totalPoints: 0, lastActivityAt: null };
      const assignmentStatus = assignmentStatusByStudent[studentId] || {
        assigned: 0,
        completed: 0,
        overdue: 0,
        pending: 0,
      };

      const lastActivityDate = progress.lastActivityAt ? new Date(progress.lastActivityAt) : null;
      const inactiveDays = lastActivityDate
        ? Math.floor((Date.now() - lastActivityDate.getTime()) / (1000 * 60 * 60 * 24))
        : null;

      const riskReasons = [];

      if (assignmentStatus.overdue > 0) {
        riskReasons.push('Overdue assignments');
      }

      if ((failedSubmissionCounts[studentId] || 0) >= 2) {
        riskReasons.push('Multiple failed submissions');
      }

      if (!lastActivityDate || (inactiveDays !== null && inactiveDays > 14)) {
        riskReasons.push('Low recent activity');
      }

      const recentEvaluated = (evaluatedSubmissionsByStudent[studentId] || [])
        .slice()
        .sort((a, b) => new Date(b.submittedAt) - new Date(a.submittedAt))
        .slice(0, 8);

      const passedCount = recentEvaluated.filter((submission) => submission.result === 'passed').length;
      const passRate = recentEvaluated.length > 0
        ? passedCount / recentEvaluated.length
        : null;

      let targetDifficulty = 'medium';
      let recommendationReason = 'Balanced progression based on current learning signals.';

      if (assignmentStatus.overdue > 0) {
        targetDifficulty = 'easy';
        recommendationReason = 'Overdue work detected, prioritise easier confidence-building tasks first.';
      } else if (passRate !== null && recentEvaluated.length >= 3) {
        if (passRate >= 0.75) {
          targetDifficulty = 'hard';
          recommendationReason = 'Strong pass trend, student is ready for stretch challenges.';
        } else if (passRate <= 0.45) {
          targetDifficulty = 'easy';
          recommendationReason = 'Recent failed attempts suggest consolidating fundamentals first.';
        }
      }

      let interventionHint = 'Monitor and continue standard progression.';
      if (assignmentStatus.overdue > 0 && passRate !== null && passRate < 0.5) {
        interventionHint = 'Schedule intervention: assign easy remediation challenge and provide targeted feedback.';
      } else if (assignmentStatus.overdue > 0) {
        interventionHint = 'Follow up on overdue tasks and set a short-term completion target.';
      } else if (passRate !== null && passRate < 0.5) {
        interventionHint = 'Review misconceptions and provide guided practice before new hard content.';
      } else if (passRate !== null && passRate >= 0.75) {
        interventionHint = 'Offer extension work to maintain challenge and engagement.';
      }

      return {
        id: student.id,
        name: `${student.firstName} ${student.lastName}`,
        email: student.email,
        grade: student.grade || null,
        enrolledCourseCount: student.courseIds.size,
        totalPoints: progress.totalPoints,
        lastActivityAt: progress.lastActivityAt,
        inactiveDays,
        assignmentSummary: assignmentStatus,
        failedSubmissions: failedSubmissionCounts[studentId] || 0,
        isAtRisk: riskReasons.length > 0,
        riskReasons,
        adaptiveProfile: {
          targetDifficulty,
          recommendationReason,
          recentPassRate: passRate !== null ? Math.round(passRate * 100) : null,
          recentEvaluatedAttempts: recentEvaluated.length,
        },
        interventionHint,
      };
    })
    .filter((student) => (hasYearGroupFilter ? student.grade === yearGroupFilter : true))
    .filter((student) => (riskOnly ? student.isAtRisk : true))
    .sort((a, b) => {
      if (a.isAtRisk !== b.isAtRisk) return a.isAtRisk ? -1 : 1;
      return a.name.localeCompare(b.name);
    });

  const yearGroups = Array.from(
    new Set(
      Array.from(studentMap.values())
        .map((student) => student.grade)
        .filter((grade) => Number.isFinite(grade))
    )
  ).sort((a, b) => a - b);

  return {
    roster,
    rosterSummary: {
      totalRosterStudents: allStudentIds.length,
      filteredStudents: roster.length,
      atRiskStudents: roster.filter((student) => student.isAtRisk).length,
    },
    rosterFilters: {
      courseId: filters.courseId || '',
      yearGroup: hasYearGroupFilter ? yearGroupFilter : '',
      riskOnly,
      courseOptions: allCourses.map((course) => ({
        id: course._id,
        title: course.title,
      })),
      yearGroupOptions: yearGroups,
    },
  };
};

// Builds KPI-style analytics cards and course-level distribution data.
const buildTeacherAnalytics = async (teacherId, role) => {
  const courseFilter = isAdmin(role) ? {} : { instructor: teacherId };
  const courses = await Course.find(courseFilter)
    .populate('enrolledStudents', 'firstName lastName email');

  const courseIds = courses.map((course) => course._id);

  const submissions = courseIds.length
    ? await Submission.find({ course: { $in: courseIds } }, 'course result submittedAt')
    : [];

  const progressRows = courseIds.length
    ? await Progress.find({ course: { $in: courseIds } }, 'course totalPoints completedChallenges')
    : [];

  const assignments = isTeacherOrAdmin(role)
    ? await Assignment.find({}).populate('course', 'title')
    : await Assignment.find({ teacher: teacherId }).populate('course', 'title');

  const uniqueStudentIds = new Set();
  courses.forEach((course) => {
    course.enrolledStudents.forEach((student) => uniqueStudentIds.add(student._id.toString()));
  });

  const courseCompletionMap = progressRows.reduce((acc, row) => {
    const key = row.course.toString();
    if (!acc[key]) {
      acc[key] = { learners: 0, totalPoints: 0, completedChallenges: 0 };
    }
    acc[key].learners += 1;
    acc[key].totalPoints += row.totalPoints || 0;
    acc[key].completedChallenges += row.completedChallenges?.length || 0;
    return acc;
  }, {});

  const submissionMap = submissions.reduce((acc, submission) => {
    const key = submission.course.toString();
    if (!acc[key]) {
      acc[key] = { total: 0, passed: 0 };
    }
    acc[key].total += 1;
    if (submission.result === 'passed') {
      acc[key].passed += 1;
    }
    return acc;
  }, {});

  const now = new Date();
  const overdueAssignments = assignments.filter((assignment) => assignment.dueDate < now).length;

  const courseBreakdown = courses.map((course) => {
    const courseId = course._id.toString();
    const completion = courseCompletionMap[courseId] || {
      learners: 0,
      totalPoints: 0,
      completedChallenges: 0,
    };
    const submission = submissionMap[courseId] || { total: 0, passed: 0 };

    const avgPoints = completion.learners > 0
      ? Math.round(completion.totalPoints / completion.learners)
      : 0;

    const passRate = submission.total > 0
      ? Math.round((submission.passed / submission.total) * 100)
      : 0;

    return {
      id: course._id,
      title: course.title,
      enrolledCount: course.enrolledStudents.length,
      totalSubmissions: submission.total,
      passRate,
      averagePoints: avgPoints,
      completedChallenges: completion.completedChallenges,
      isPublished: course.isPublished,
    };
  });

  const totalSubmissions = submissions.length;
  const passedSubmissions = submissions.filter((submission) => submission.result === 'passed').length;

  return {
    summary: {
      totalCourses: courses.length,
      totalStudents: uniqueStudentIds.size,
      totalAssignments: assignments.length,
      overdueAssignments,
      totalSubmissions,
      passRate: totalSubmissions > 0 ? Math.round((passedSubmissions / totalSubmissions) * 100) : 0,
    },
    courseBreakdown,
  };
};

// Teacher dashboard
router.get('/teacher', authenticate, async (req, res) => {
  try {
    if (!isTeacherOrAdmin(req.user.role)) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const courseFilter = isAdmin(req.user.role) ? {} : { instructor: req.user.userId };
    if (req.query.courseId) {
      courseFilter._id = req.query.courseId;
    }

    const courses = await Course.find(courseFilter)
      .populate('enrolledStudents');

    const rosterData = await buildTeacherRoster(req.user.userId, req.user.role, {
      courseId: req.query.courseId,
      yearGroup: req.query.yearGroup,
      riskOnly: req.query.riskOnly,
    });

    const uniqueStudentIds = new Set();
    courses.forEach((course) => {
      course.enrolledStudents.forEach((student) => uniqueStudentIds.add(student._id.toString()));
    });

    const dashboardData = {
      totalCourses: courses.length,
      totalStudents: courses.reduce((sum, c) => sum + c.enrolledStudents.length, 0),
      uniqueStudents: uniqueStudentIds.size,
      courses: courses.map(course => ({
        id: course._id,
        title: course.title,
        enrolledCount: course.enrolledStudents.length,
        targetGrades: course.targetGrades,
        difficulty: course.difficulty,
        isPublished: course.isPublished,
        createdAt: course.createdAt
      })),
      roster: rosterData.roster,
      rosterSummary: rosterData.rosterSummary,
      rosterFilters: rosterData.rosterFilters,
    };

    res.json(dashboardData);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Teacher analytics summary
router.get('/teacher/analytics', authenticate, async (req, res) => {
  try {
    if (!isTeacherOrAdmin(req.user.role)) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const analytics = await buildTeacherAnalytics(req.user.userId, req.user.role);
    return res.json(analytics);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});

router.get('/teacher/ai-summary', authenticate, async (req, res) => {
  try {
    if (!isTeacherOrAdmin(req.user.role)) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const rosterData = await buildTeacherRoster(req.user.userId, req.user.role, {
      courseId: req.query.courseId,
      yearGroup: req.query.yearGroup,
      riskOnly: req.query.riskOnly,
    });

    const summary = generateTeacherInterventionSummary({
      roster: rosterData.roster,
    });

    return res.json(summary);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});

// Teacher analytics CSV export
router.get('/teacher/export.csv', authenticate, async (req, res) => {
  try {
    if (!isTeacherOrAdmin(req.user.role)) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const analytics = await buildTeacherAnalytics(req.user.userId, req.user.role);
    const rows = [
      [
        'Course Title',
        'Students Enrolled',
        'Submissions',
        'Pass Rate (%)',
        'Average Points',
        'Completed Challenges',
        'Published',
      ],
      ...analytics.courseBreakdown.map((course) => [
        course.title,
        course.enrolledCount,
        course.totalSubmissions,
        course.passRate,
        course.averagePoints,
        course.completedChallenges,
        course.isPublished ? 'Yes' : 'No',
      ]),
      [],
      ['Summary', '', '', '', '', '', ''],
      ['Total Courses', analytics.summary.totalCourses, '', '', '', '', ''],
      ['Total Students', analytics.summary.totalStudents, '', '', '', '', ''],
      ['Total Assignments', analytics.summary.totalAssignments, '', '', '', '', ''],
      ['Overdue Assignments', analytics.summary.overdueAssignments, '', '', '', '', ''],
      ['Overall Pass Rate (%)', analytics.summary.passRate, '', '', '', '', ''],
    ];

    const csv = rows.map((row) => row.map(escapeCsv).join(',')).join('\n');
    const fileName = `teacher-analytics-${new Date().toISOString().slice(0, 10)}.csv`;

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename=${fileName}`);
    return res.status(200).send(csv);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});

// Student dashboard
router.get('/student', authenticate, async (req, res) => {
  try {
    if (req.user.role !== 'student') {
      return res.status(403).json({ message: 'Access denied' });
    }

    const user = await User.findById(req.user.userId);
    const enrolledCourses = await Course.find({
      enrolledStudents: req.user.userId
    });

    const progressData = await Progress.find({
      student: req.user.userId
    });

    const assignments = await Assignment.find({
      assignedTo: req.user.userId,
      isPublished: true,
    })
      .sort({ dueDate: 1 })
      .populate('course', 'title')
      .populate('challenge', 'title');

    const assignmentIds = assignments.map((assignment) => assignment._id);
    const assignmentSubmissions = assignmentIds.length
      ? await Submission.find(
          {
            assignment: { $in: assignmentIds },
            student: req.user.userId,
          },
          'assignment result submittedAt'
        )
      : [];

    const latestByAssignment = assignmentSubmissions.reduce((acc, submission) => {
      const key = submission.assignment?.toString();
      if (!key) return acc;
      const existing = acc[key];
      if (!existing || new Date(submission.submittedAt) > new Date(existing.submittedAt)) {
        acc[key] = submission;
      }
      return acc;
    }, {});

    const now = new Date();
    const assignmentSummary = assignments.map((assignment) => {
      const latest = latestByAssignment[assignment._id.toString()];
      const passed = latest?.result === 'passed';
      const submittedAt = latest?.submittedAt ? new Date(latest.submittedAt) : null;

      let status = 'pending';
      if (passed && submittedAt && submittedAt > new Date(assignment.dueDate)) {
        status = 'completed_late';
      } else if (passed) {
        status = 'completed';
      } else if (new Date(assignment.dueDate) < now) {
        status = 'overdue';
      }

      return {
        id: assignment._id,
        challengeId: assignment.challenge?._id || null,
        title: assignment.title,
        dueDate: assignment.dueDate,
        courseTitle: assignment.course?.title || 'Course',
        challengeTitle: assignment.challenge?.title || 'Challenge',
        status,
      };
    });

    const overdueChallengeIds = new Set(
      assignmentSummary
        .filter((assignment) => assignment.status === 'overdue' && assignment.challengeId)
        .map((assignment) => assignment.challengeId.toString())
    );

    const pendingChallengeIds = new Set(
      assignmentSummary
        .filter((assignment) => assignment.status === 'pending' && assignment.challengeId)
        .map((assignment) => assignment.challengeId.toString())
    );

    const progressCourseIds = [...new Set(progressData.map(p => p.course.toString()))];
    const progressCourses = progressCourseIds.length
      ? await Course.find({ _id: { $in: progressCourseIds } }, 'title')
      : [];
    const progressCourseMap = new Map(
      progressCourses.map(course => [course._id.toString(), course.title])
    );

    const leaderboardRows = await Progress.aggregate([
      {
        $group: {
          _id: '$student',
          totalPoints: { $sum: '$totalPoints' },
          totalExperience: { $sum: '$experiencePoints' },
          coursesTracked: { $sum: 1 },
        },
      },
      { $sort: { totalPoints: -1 } },
    ]);

    const rankedIds = leaderboardRows.map((row) => row._id);
    const rankedUsers = rankedIds.length
      ? await User.find({ _id: { $in: rankedIds } }, 'firstName lastName')
      : [];

    const rankedUserMap = new Map(
      rankedUsers.map((student) => [student._id.toString(), student])
    );

    const leaderboard = leaderboardRows.slice(0, 10).map((row, index) => {
      const student = rankedUserMap.get(row._id.toString());
      return {
        rank: index + 1,
        studentId: row._id,
        name: student ? `${student.firstName} ${student.lastName}` : 'Student',
        totalPoints: row.totalPoints || 0,
        coursesTracked: row.coursesTracked || 0,
        level: calculateLevelFromExperience(row.totalExperience || 0),
      };
    });

    const studentLeaderboardIndex = leaderboardRows.findIndex(
      (row) => row._id.toString() === req.user.userId
    );

    const totalExperience = progressData.reduce((sum, p) => sum + (p.experiencePoints || 0), 0);

    const recentSubmissions = await Submission.find(
      { student: req.user.userId },
      'result submittedAt'
    )
      .sort({ submittedAt: -1 })
      .limit(12);

    const recentEvaluated = recentSubmissions.filter((submission) =>
      submission.result === 'passed' || submission.result === 'failed'
    );

    const passedCount = recentEvaluated.filter((submission) => submission.result === 'passed').length;
    const passRate = recentEvaluated.length > 0
      ? passedCount / recentEvaluated.length
      : null;

    const overdueCount = assignmentSummary.filter((assignment) => assignment.status === 'overdue').length;

    let targetDifficulty = 'medium';
    let recommendationReason = 'Balanced progression based on current activity.';

    if (overdueCount > 0) {
      targetDifficulty = 'easy';
      recommendationReason = 'Recent overdue work detected, so easier challenges are prioritised first.';
    } else if (passRate !== null && recentEvaluated.length >= 3) {
      if (passRate >= 0.75) {
        targetDifficulty = 'hard';
        recommendationReason = 'Strong recent performance, so harder challenges are recommended.';
      } else if (passRate <= 0.45) {
        targetDifficulty = 'easy';
        recommendationReason = 'Recent attempts show difficulty, so foundational challenges are recommended.';
      }
    }

    const completedChallengeIds = new Set(
      progressData.flatMap((progress) =>
        (progress.completedChallenges || []).map((item) => item.challenge?.toString()).filter(Boolean)
      )
    );

    const enrolledCourseIds = enrolledCourses.map((course) => course._id);
    const enrolledCourseTitleMap = new Map(
      enrolledCourses.map((course) => [course._id.toString(), course.title])
    );

    const candidateChallenges = enrolledCourseIds.length
      ? await Challenge.find({
          course: { $in: enrolledCourseIds },
          isPublished: true,
          _id: { $nin: Array.from(completedChallengeIds) },
        }, 'title difficulty course gamificationPoints')
      : [];

    const difficultyWeight = { easy: 1, medium: 2, hard: 3 };
    const targetWeight = difficultyWeight[targetDifficulty] || 2;

    const adaptiveRecommendations = candidateChallenges
      .map((challenge) => {
        const challengeId = challenge._id.toString();
        const challengeWeight = difficultyWeight[challenge.difficulty] || 2;
        const diffDistance = Math.abs(challengeWeight - targetWeight);

        let score = 40 - diffDistance * 15;
        const reasons = [];

        if (challenge.difficulty === targetDifficulty) {
          reasons.push(`Matches your current target difficulty (${targetDifficulty}).`);
        }

        if (overdueChallengeIds.has(challengeId)) {
          score += 30;
          reasons.push('Linked to overdue work and should be prioritised.');
        } else if (pendingChallengeIds.has(challengeId)) {
          score += 20;
          reasons.push('Linked to pending assigned work.');
        }

        if ((challenge.gamificationPoints || 0) >= 150 && targetDifficulty === 'hard') {
          score += 8;
          reasons.push('High-value challenge aligned with your recent progress.');
        }

        if (!reasons.length) {
          reasons.push('Recommended to keep your learning path moving forward.');
        }

        return {
          id: challenge._id,
          title: challenge.title,
          difficulty: challenge.difficulty,
          courseId: challenge.course,
          courseTitle: enrolledCourseTitleMap.get(challenge.course.toString()) || 'Course',
          reason: reasons.join(' '),
          score,
        };
      })
      .sort((a, b) => b.score - a.score)
      .slice(0, 5);

    const learningPathVotes = progressData.reduce(
      (acc, progress) => {
        const path = progress.learningPath || 'visual';
        acc[path] = (acc[path] || 0) + 1;
        return acc;
      },
      { visual: 0, 'text-based': 0, mixed: 0 }
    );

    const recommendedPath = Object.entries(learningPathVotes)
      .sort((a, b) => b[1] - a[1])[0]?.[0] || 'visual';

    const dashboardData = {
      user: user.toJSON(),
      enrolledCourses: enrolledCourses.map(c => ({
        id: c._id,
        title: c.title
      })),
      totalPoints: progressData.reduce((sum, p) => sum + p.totalPoints, 0),
      totalExperience,
      currentLevel: calculateLevelFromExperience(totalExperience),
      progressByCourse: progressData.map(p => ({
        courseId: p.course,
        courseTitle: progressCourseMap.get(p.course.toString()) || 'Course',
        completedChallenges: p.completedChallenges.length,
        totalPoints: p.totalPoints
      })),
      assignments: assignmentSummary,
      leaderboard,
      myLeaderboardRank: studentLeaderboardIndex >= 0 ? studentLeaderboardIndex + 1 : null,
      adaptiveProfile: {
        targetDifficulty,
        recommendationReason,
        recentPassRate: passRate !== null ? Math.round(passRate * 100) : null,
        recentEvaluatedAttempts: recentEvaluated.length,
        recommendedLearningPath: recommendedPath,
      },
      adaptiveRecommendations,
    };

    res.json(dashboardData);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Student analytics (for teacher)
router.get('/student/:studentId', authenticate, async (req, res) => {
  try {
    if (!isTeacherOrAdmin(req.user.role)) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const student = await User.findById(req.params.studentId);
    const submissions = await Submission.find({
      student: req.params.studentId
    }).populate('challenge course');

    const progressData = await Progress.find({
      student: req.params.studentId
    });

    const analytics = {
      student: student.toJSON(),
      totalSubmissions: submissions.length,
      passedSubmissions: submissions.filter(s => s.result === 'passed').length,
      averageScore: submissions.length > 0
        ? submissions.reduce((sum, s) => sum + (s.testsPassed / s.totalTests || 0), 0) / submissions.length * 100
        : 0,
      progress: progressData
    };

    res.json(analytics);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
