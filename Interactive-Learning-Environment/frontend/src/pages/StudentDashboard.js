import React, { useEffect, useState } from 'react';
import { apiClient } from '../services/apiClient';
import '../styles/Dashboard.css';

const StudentDashboard = () => {
  const [dashboardData, setDashboardData] = useState(null);
  const [availableCourses, setAvailableCourses] = useState([]);
  const [enrollingId, setEnrollingId] = useState(null);
  const [enrollError, setEnrollError] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const yearGroups = Array.from({ length: 13 }, (_, index) => index + 1);
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

        const params = {};
        if (data?.user?.grade) {
          params.targetGrade = data.user.grade;
        }

        const coursesResponse = await apiClient.get('/courses', { params });
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

  if (loading) return <div className="loading">Loading dashboard...</div>;
  if (error) return <div className="error">{error}</div>;

  const enrolledCourseIds = new Set(
    (dashboardData?.enrolledCourses || []).map(course => course.id?.toString())
  );
  const filteredAvailableCourses = availableCourses.filter(
    course => !enrolledCourseIds.has(course._id.toString())
  );

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
          <h3>Recommended Year Groups</h3>
          <p className="stat-value">
            {dashboardData?.user?.grade
              ? formatYearLabel(dashboardData.user.grade)
              : `Years ${yearGroups[0]}-${yearGroups[yearGroups.length - 1]} (Primary/Secondary)`}
          </p>
        </div>
      </div>

      <div className="section-card">
        <div className="section-header">
          <h2>Your Courses</h2>
        </div>
        {dashboardData?.enrolledCourses?.length > 0 ? (
          <div className="courses-grid">
            {dashboardData.enrolledCourses.map(course => (
              <div key={course.id} className="course-card">
                <div>
                  <h3>{course.title}</h3>
                </div>
                <a href={`/courses/${course.id}`} className="btn btn-secondary">
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
          <h2>Available Courses</h2>
          {dashboardData?.user?.grade && (
            <span className="section-subtitle">
              Recommended for {formatYearLabel(dashboardData.user.grade)}
            </span>
          )}
        </div>
        {enrollError && <div className="error">{enrollError}</div>}
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
    </div>
  );
};

export default StudentDashboard;
