import React, { useEffect, useState } from 'react';
import { apiClient } from '../services/apiClient';
import '../styles/Dashboard.css';

const StudentDashboard = () => {
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const response = await apiClient.get('/dashboard/student');
        setDashboardData(response.data);
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load dashboard');
      } finally {
        setLoading(false);
      }
    };

    fetchDashboard();
  }, []);

  if (loading) return <div className="loading">Loading dashboard...</div>;
  if (error) return <div className="error">{error}</div>;

  return (
    <div className="dashboard student-dashboard">
      <div className="dashboard-header">
        <h1>Student Dashboard</h1>
        <p>Welcome back, {dashboardData?.user?.firstName}!</p>
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
      </div>

      <div className="courses-section">
        <h2>Your Courses</h2>
        {dashboardData?.enrolledCourses?.length > 0 ? (
          <div className="courses-grid">
            {dashboardData.enrolledCourses.map(course => (
              <div key={course.id} className="course-card">
                <h3>{course.title}</h3>
                <a href={`/courses/${course.id}`} className="btn btn-secondary">
                  Continue
                </a>
              </div>
            ))}
          </div>
        ) : (
          <p>No courses enrolled yet.</p>
        )}
      </div>

      <div className="progress-section">
        <h2>Progress Summary</h2>
        {dashboardData?.progressByCourse?.length > 0 ? (
          <ul>
            {dashboardData.progressByCourse.map((prog, idx) => (
              <li key={idx}>
                <span>Course {prog.courseId}: {prog.completedChallenges} challenges completed</span>
                <span>{prog.totalPoints} points</span>
              </li>
            ))}
          </ul>
        ) : (
          <p>No progress yet. Start a course to earn points!</p>
        )}
      </div>
    </div>
  );
};

export default StudentDashboard;
