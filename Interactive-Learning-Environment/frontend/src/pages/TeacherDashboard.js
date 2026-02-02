import React, { useEffect, useState } from 'react';
import { apiClient } from '../services/apiClient';
import '../styles/Dashboard.css';

const TeacherDashboard = () => {
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const response = await apiClient.get('/dashboard/teacher');
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
    <div className="dashboard teacher-dashboard">
      <div className="dashboard-header">
        <h1>Teacher Dashboard</h1>
        <button className="btn btn-primary">Create New Course</button>
      </div>

      <div className="dashboard-stats">
        <div className="stat-card">
          <h3>Total Courses</h3>
          <p className="stat-value">{dashboardData?.totalCourses || 0}</p>
        </div>
        <div className="stat-card">
          <h3>Total Students</h3>
          <p className="stat-value">{dashboardData?.totalStudents || 0}</p>
        </div>
      </div>

      <div className="courses-section">
        <h2>Your Courses</h2>
        {dashboardData?.courses?.length > 0 ? (
          <div className="courses-grid">
            {dashboardData.courses.map(course => (
              <div key={course.id} className="course-card">
                <h3>{course.title}</h3>
                <p>{course.enrolledCount} students enrolled</p>
                <a href={`/courses/${course.id}`} className="btn btn-secondary">
                  Manage Course
                </a>
              </div>
            ))}
          </div>
        ) : (
          <p>No courses created yet.</p>
        )}
      </div>
    </div>
  );
};

export default TeacherDashboard;
