const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/authMiddleware');
const User = require('../models/User');
const Course = require('../models/Course');
const Submission = require('../models/Submission');
const Progress = require('../models/Progress');
const Assignment = require('../models/Assignment');

const isTeacherOrAdmin = (role) => role === 'teacher' || role === 'admin';

const escapeCsv = (value) => {
  const safeValue = value === null || value === undefined ? '' : String(value);
  return `"${safeValue.replace(/"/g, '""')}"`;
};

const parseBoolean = (value) => {
  if (typeof value === 'boolean') return value;
  if (typeof value !== 'string') return false;
  return ['true', '1', 'yes', 'on'].includes(value.toLowerCase());
};

const buildTeacherRoster = async (teacherId, role, filters = {}) => {
  const baseCourseFilter = isTeacherOrAdmin(role) ? {} : { instructor: teacherId };
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

const buildTeacherAnalytics = async (teacherId, role) => {
  const courseFilter = isTeacherOrAdmin(role) ? {} : { instructor: teacherId };
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

    const courseFilter = isTeacherOrAdmin(req.user.role) ? {} : { instructor: req.user.userId };
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
        title: assignment.title,
        dueDate: assignment.dueDate,
        courseTitle: assignment.course?.title || 'Course',
        challengeTitle: assignment.challenge?.title || 'Challenge',
        status,
      };
    });

    const progressCourseIds = [...new Set(progressData.map(p => p.course.toString()))];
    const progressCourses = progressCourseIds.length
      ? await Course.find({ _id: { $in: progressCourseIds } }, 'title')
      : [];
    const progressCourseMap = new Map(
      progressCourses.map(course => [course._id.toString(), course.title])
    );

    const dashboardData = {
      user: user.toJSON(),
      enrolledCourses: enrolledCourses.map(c => ({
        id: c._id,
        title: c.title
      })),
      totalPoints: progressData.reduce((sum, p) => sum + p.totalPoints, 0),
      progressByCourse: progressData.map(p => ({
        courseId: p.course,
        courseTitle: progressCourseMap.get(p.course.toString()) || 'Course',
        completedChallenges: p.completedChallenges.length,
        totalPoints: p.totalPoints
      })),
      assignments: assignmentSummary
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
