import React, { useEffect, useMemo, useState } from 'react';
import { apiClient } from '../services/apiClient';
import BadgesDisplay from '../components/BadgesDisplay';
import '../styles/Dashboard.css';

const assignmentStatusOrder = (status) => {
  if (status === 'overdue') return 0;
  if (status === 'pending') return 1;
  if (status === 'completed_late') return 2;
  if (status === 'completed') return 3;
  return 4;
};

const getAssignmentStatusLabel = (status) => {
  if (status === 'completed') return 'Completed';
  if (status === 'completed_late') return 'Completed Late';
  if (status === 'overdue') return 'Overdue';
  return 'Pending';
};

const difficultyRank = { beginner: 1, intermediate: 2, advanced: 3 };

const StudentDashboard = () => {
  const [dashboardData, setDashboardData] = useState(null);
  const [availableCourses, setAvailableCourses] = useState([]);
  const [assignmentFilter, setAssignmentFilter] = useState('all');
  const [enrollingId, setEnrollingId] = useState(null);
  const [enrollError, setEnrollError] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const formatYearLabel = (year) => {
    if (year <= 6) return `Year ${year} (Primary)`;
    if (year <= 11) return `Year ${year} (Secondary)`;
    return `Year ${year} (Sixth Form)`;
  };
  const formatYearList = (years = []) => years.map(formatYearLabel).join(', ');

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const response = await apiClient.get('/dashboard/student');
        const data = response.data;
        setDashboardData(data);

        const coursesResponse = await apiClient.get('/courses');
        setAvailableCourses(coursesResponse.data || []);
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load dashboard');
      } finally {
        setLoading(false);
      }
    };

    fetchDashboard();
  }, []);

  const handleEnroll = async (courseId) => {
    setEnrollError('');
    setEnrollingId(courseId);

    try {
      await apiClient.post(`/courses/${courseId}/enroll`);
      const enrolledCourse = availableCourses.find(course => course._id === courseId);

      if (enrolledCourse) {
        setDashboardData(prev => ({
          ...prev,
          enrolledCourses: [
            ...prev.enrolledCourses,
            { id: enrolledCourse._id, title: enrolledCourse.title }
          ]
        }));
      }

      setAvailableCourses(prev => prev.filter(course => course._id !== courseId));
    } catch (err) {
      setEnrollError(err.response?.data?.message || 'Unable to enroll in course');
    } finally {
      setEnrollingId(null);
    }
  };

  const enrolledCourseIds = useMemo(
    () => new Set((dashboardData?.enrolledCourses || []).map((course) => course.id?.toString())),
    [dashboardData?.enrolledCourses]
  );

  const filteredAvailableCourses = useMemo(
    () => availableCourses.filter((course) => !enrolledCourseIds.has(course._id.toString())),
    [availableCourses, enrolledCourseIds]
  );

  const studentGrade = dashboardData?.user?.grade;
  const adaptiveProfile = dashboardData?.adaptiveProfile || null;

  const targetCourseDifficulty = adaptiveProfile?.targetDifficulty === 'easy'
    ? 'beginner'
    : adaptiveProfile?.targetDifficulty === 'hard'
      ? 'advanced'
      : 'intermediate';

  const recommendedCourses = useMemo(
    () => filteredAvailableCourses
      .filter((course) => (
        studentGrade && Array.isArray(course.targetGrades)
          ? course.targetGrades.includes(studentGrade)
          : false
      ))
      .sort((a, b) => {
        const aDiff = Math.abs((difficultyRank[a.difficulty] || 2) - (difficultyRank[targetCourseDifficulty] || 2));
        const bDiff = Math.abs((difficultyRank[b.difficulty] || 2) - (difficultyRank[targetCourseDifficulty] || 2));
        return aDiff - bDiff;
      }),
    [filteredAvailableCourses, studentGrade, targetCourseDifficulty]
  );

  const adaptiveRecommendations = useMemo(
    () => dashboardData?.adaptiveRecommendations || [],
    [dashboardData?.adaptiveRecommendations]
  );

  const allAssignments = useMemo(
    () => dashboardData?.assignments || [],
    [dashboardData?.assignments]
  );

  const assignmentCounts = useMemo(
    () => allAssignments.reduce(
      (acc, assignment) => {
        const status = assignment.status || 'pending';
        acc.all += 1;
        if (status === 'overdue') acc.overdue += 1;
        if (status === 'pending') acc.pending += 1;
        if (status === 'completed' || status === 'completed_late') acc.completed += 1;
        return acc;
      },
      { all: 0, overdue: 0, pending: 0, completed: 0 }
    ),
    [allAssignments]
  );

  const visibleAssignments = useMemo(() => {
    const filteredAssignments = allAssignments.filter((assignment) => {
      if (assignmentFilter === 'all') return true;
      if (assignmentFilter === 'completed') {
        return assignment.status === 'completed' || assignment.status === 'completed_late';
      }
      return (assignment.status || 'pending') === assignmentFilter;
    });

    return filteredAssignments
      .slice()
      .sort((a, b) => {
        const statusDiff = assignmentStatusOrder(a.status) - assignmentStatusOrder(b.status);
        if (statusDiff !== 0) return statusDiff;

        return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
      });
  }, [allAssignments, assignmentFilter]);

  if (loading) return <div className="loading">Loading dashboard...</div>;
  if (error) return <div className="error">{error}</div>;

  return (
    <div className="dashboard student-dashboard">
      <div className="dashboard-header">
        <div>
          <h1>Student Dashboard</h1>
          <p>Welcome back, {dashboardData?.user?.firstName}!</p>
        </div>
        <div className="dashboard-header-meta">
          <span className="meta-label">Year Group</span>
          <span className="meta-value">
            {dashboardData?.user?.grade
              ? formatYearLabel(dashboardData.user.grade)
              : 'Not set'}
          </span>
        </div>
      </div>

      <div className="dashboard-stats">
        <div className="stat-card">
          <h3>Total Points</h3>
          <p className="stat-value">{dashboardData?.totalPoints || 0}</p>
        </div>
        <div className="stat-card">
          <h3>Courses Enrolled</h3>
          <p className="stat-value">{dashboardData?.enrolledCourses?.length || 0}</p>
        </div>
        <div className="stat-card">
          <h3>Current Level</h3>
          <p className="stat-value">
            Lv {dashboardData?.currentLevel || 1}
          </p>
        </div>
        <div className="stat-card">
          <h3>Overdue Assignments</h3>
          <p className="stat-value">{assignmentCounts.overdue}</p>
        </div>
      </div>

      <div className="section-card">
        <div className="section-header">
          <h2>Leaderboard</h2>
          <span className="section-subtitle">
            {dashboardData?.myLeaderboardRank
              ? `Your rank: #${dashboardData.myLeaderboardRank}`
              : 'Complete challenges to appear on the leaderboard'}
          </span>
        </div>
        {(dashboardData?.leaderboard || []).length > 0 ? (
          <ul className="progress-list">
            {dashboardData.leaderboard.map((entry) => (
              <li key={entry.studentId}>
                <div>
                  <strong>#{entry.rank} {entry.name}</strong>
                  <div>Level {entry.level} • {entry.coursesTracked} tracked course(s)</div>
                </div>
                <span>{entry.totalPoints} points</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="empty-state">Leaderboard is empty right now.</p>
        )}
      </div>

      <div className="section-card">
        <div className="section-header">
          <h2>Your Courses</h2>
        </div>
        {dashboardData?.enrolledCourses?.length > 0 ? (
          <div className="courses-grid">
            {dashboardData.enrolledCourses.map(course => (
              <div key={course.id} className="course-card course-card--primary">
                <div>
                  <h3>{course.title}</h3>
                </div>
                <a href={`/courses/${course.id}`} className="btn">
                  Continue
                </a>
              </div>
            ))}
          </div>
        ) : (
          <p className="empty-state">No courses enrolled yet.</p>
        )}
      </div>

      <div className="section-card">
        <div className="section-header">
          <h2>Progress Summary</h2>
        </div>
        {dashboardData?.progressByCourse?.length > 0 ? (
          <ul className="progress-list">
            {dashboardData.progressByCourse.map((prog, idx) => (
              <li key={idx}>
                <span>{prog.courseTitle}: {prog.completedChallenges} challenges completed</span>
                <span>{prog.totalPoints} points</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="empty-state">No progress yet. Start a course to earn points!</p>
        )}
      </div>

      <div className="section-card">
        <div className="section-header">
          <h2>Assigned Work</h2>
          <div className="section-header-controls">
            <span className="section-subtitle">Track deadlines and completion status</span>
            <select
              className="filter-select"
              value={assignmentFilter}
              onChange={(event) => setAssignmentFilter(event.target.value)}
            >
              <option value="all">All ({assignmentCounts.all})</option>
              <option value="overdue">Overdue ({assignmentCounts.overdue})</option>
              <option value="pending">Pending ({assignmentCounts.pending})</option>
              <option value="completed">Completed ({assignmentCounts.completed})</option>
            </select>
          </div>
        </div>
        {visibleAssignments.length > 0 ? (
          <ul className="progress-list">
            {visibleAssignments.map((assignment) => (
              <li key={assignment.id}>
                <div>
                  <strong>{assignment.title}</strong>
                  <div>{assignment.courseTitle} • {assignment.challengeTitle}</div>
                  <div>Due: {new Date(assignment.dueDate).toLocaleString()}</div>
                </div>
                <div className="course-meta">
                  <span className="badge">{getAssignmentStatusLabel(assignment.status)}</span>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <p className="empty-state">
            {assignmentFilter === 'all'
              ? 'No assignments yet.'
              : `No assignments in ${assignmentFilter.replace('_', ' ')} state.`}
          </p>
        )}
      </div>

      <div className="section-card">
        <div className="section-header">
          <h2>Recommended Courses</h2>
          {dashboardData?.user?.grade && (
            <span className="section-subtitle">
              Recommended for {formatYearLabel(dashboardData.user.grade)}
              {adaptiveProfile?.targetDifficulty ? ` • Target difficulty: ${adaptiveProfile.targetDifficulty}` : ''}
            </span>
          )}
        </div>
        {adaptiveProfile?.recommendationReason && (
          <p className="section-subtitle">{adaptiveProfile.recommendationReason}</p>
        )}
        {enrollError && <div className="error">{enrollError}</div>}
        {recommendedCourses.length > 0 ? (
          <div className="courses-grid">
            {recommendedCourses.map(course => (
              <div key={course._id} className="course-card course-card--light">
                <div>
                  <h3>{course.title}</h3>
                  <p>{course.description}</p>
                  <div className="course-meta">
                    <span className="badge">{course.difficulty}</span>
                    <span className="badge">
                      {formatYearList(course.targetGrades)}
                    </span>
                  </div>
                </div>
                <button
                  className="btn btn-primary"
                  onClick={() => handleEnroll(course._id)}
                  disabled={enrollingId === course._id}
                >
                  {enrollingId === course._id ? 'Enrolling...' : 'Enroll'}
                </button>
              </div>
            ))}
          </div>
        ) : (
          <p className="empty-state">No recommended courses yet for your year group.</p>
        )}
      </div>

      <div className="section-card">
        <div className="section-header">
          <h2>Recommended Challenges</h2>
          {adaptiveProfile && (
            <span className="section-subtitle">
              Learning path: {adaptiveProfile.recommendedLearningPath || 'visual'}
              {adaptiveProfile.recentPassRate !== null
                ? ` • Recent pass rate: ${adaptiveProfile.recentPassRate}%`
                : ''}
            </span>
          )}
        </div>
        {adaptiveRecommendations.length > 0 ? (
          <ul className="progress-list">
            {adaptiveRecommendations.map((recommendation) => (
              <li key={recommendation.id}>
                <div>
                  <strong>{recommendation.title}</strong>
                  <div>{recommendation.courseTitle} • {recommendation.difficulty}</div>
                  <div className="section-subtitle">{recommendation.reason}</div>
                </div>
                <a href={`/challenges/${recommendation.id}`} className="btn btn-secondary">
                  Open
                </a>
              </li>
            ))}
          </ul>
        ) : (
          <p className="empty-state">No challenge recommendations yet. Keep submitting solutions to build your adaptive profile.</p>
        )}
      </div>

      <div className="section-card">
        <div className="section-header">
          <h2>All Available Courses</h2>
        </div>
        {filteredAvailableCourses.length > 0 ? (
          <div className="courses-grid">
            {filteredAvailableCourses.map(course => (
              <div key={course._id} className="course-card course-card--light">
                <div>
                  <h3>{course.title}</h3>
                  <p>{course.description}</p>
                  <div className="course-meta">
                    <span className="badge">{course.difficulty}</span>
                    <span className="badge">
                      {formatYearList(course.targetGrades)}
                    </span>
                  </div>
                </div>
                <button
                  className="btn btn-primary"
                  onClick={() => handleEnroll(course._id)}
                  disabled={enrollingId === course._id}
                >
                  {enrollingId === course._id ? 'Enrolling...' : 'Enroll'}
                </button>
              </div>
            ))}
          </div>
        ) : (
          <p className="empty-state">No available courses right now.</p>
        )}
      </div>

      <div className="section-card">
        <BadgesDisplay studentId={dashboardData?.user?._id} />
      </div>
    </div>
  );
};

export default StudentDashboard;
