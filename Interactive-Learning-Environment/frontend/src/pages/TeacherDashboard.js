import React, { useEffect, useState } from 'react';
import { apiClient } from '../services/apiClient';
import '../styles/Dashboard.css';

const TeacherDashboard = () => {
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [formError, setFormError] = useState('');
  const [formSuccess, setFormSuccess] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    targetGrades: [],
    difficulty: 'beginner',
    topics: '',
    isPublished: true
  });
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

  const refreshDashboard = async () => {
    const response = await apiClient.get('/dashboard/teacher');
    setDashboardData(response.data);
  };

  const handleInputChange = (event) => {
    const { name, value, type, checked } = event.target;

    if (name === 'isPublished') {
      setFormData(prev => ({ ...prev, isPublished: checked }));
      return;
    }

    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleGradeToggle = (grade) => {
    setFormData(prev => {
      const current = new Set(prev.targetGrades);
      if (current.has(grade)) {
        current.delete(grade);
      } else {
        current.add(grade);
      }
      return { ...prev, targetGrades: Array.from(current).sort((a, b) => a - b) };
    });
  };

  const handleCreateCourse = async (event) => {
    event.preventDefault();
    setFormError('');
    setFormSuccess('');

    if (!formData.title || !formData.description || formData.targetGrades.length === 0) {
      setFormError('Title, description, and at least one year group are required.');
      return;
    }

    const payload = {
      title: formData.title,
      description: formData.description,
      targetGrades: formData.targetGrades,
      difficulty: formData.difficulty,
      topics: formData.topics
        .split(',')
        .map(topic => topic.trim())
        .filter(Boolean),
      isPublished: formData.isPublished
    };

    setSubmitting(true);
    try {
      await apiClient.post('/courses', payload);
      setFormSuccess('Course created successfully.');
      setFormData({
        title: '',
        description: '',
        targetGrades: [],
        difficulty: 'beginner',
        topics: '',
        isPublished: true
      });
      setShowCreateForm(false);
      await refreshDashboard();
    } catch (err) {
      setFormError(err.response?.data?.message || 'Unable to create course');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="loading">Loading dashboard...</div>;
  if (error) return <div className="error">{error}</div>;

  return (
    <div className="dashboard teacher-dashboard">
      <div className="dashboard-header">
        <div>
          <h1>Teacher Dashboard</h1>
          <p>Manage courses and track student progress.</p>
        </div>
        <button
          className="btn btn-primary"
          onClick={() => setShowCreateForm(prev => !prev)}
        >
          {showCreateForm ? 'Close' : 'Create New Course'}
        </button>
      </div>

      {showCreateForm && (
        <div className="section-card">
          <div className="section-header">
            <h2>Create a Course</h2>
          </div>
          {formError && <div className="error">{formError}</div>}
          {formSuccess && <div className="success">{formSuccess}</div>}
          <form className="dashboard-form" onSubmit={handleCreateCourse}>
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="title">Title *</label>
                <input
                  id="title"
                  name="title"
                  type="text"
                  value={formData.title}
                  onChange={handleInputChange}
                  required
                />
              </div>
              <div className="form-group">
                <label htmlFor="difficulty">Difficulty</label>
                <select
                  id="difficulty"
                  name="difficulty"
                  value={formData.difficulty}
                  onChange={handleInputChange}
                >
                  <option value="beginner">Beginner</option>
                  <option value="intermediate">Intermediate</option>
                  <option value="advanced">Advanced</option>
                </select>
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="description">Description *</label>
              <textarea
                id="description"
                name="description"
                rows="3"
                value={formData.description}
                onChange={handleInputChange}
                required
              />
            </div>

            <div className="form-group">
              <label>Target Year Groups *</label>
              <div className="checkbox-grid">
                {yearGroups.map((year) => (
                  <label key={year} className="checkbox-item">
                    <input
                      type="checkbox"
                      checked={formData.targetGrades.includes(year)}
                      onChange={() => handleGradeToggle(year)}
                    />
                    <span>{formatYearLabel(year)}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="topics">Topics (comma-separated)</label>
                <input
                  id="topics"
                  name="topics"
                  type="text"
                  value={formData.topics}
                  onChange={handleInputChange}
                />
              </div>
              <div className="form-group form-toggle">
                <label className="toggle-label">
                  <input
                    type="checkbox"
                    name="isPublished"
                    checked={formData.isPublished}
                    onChange={handleInputChange}
                  />
                  <span>Publish immediately</span>
                </label>
              </div>
            </div>

            <div className="form-actions">
              <button className="btn btn-primary" type="submit" disabled={submitting}>
                {submitting ? 'Creating...' : 'Create Course'}
              </button>
            </div>
          </form>
        </div>
      )}

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

      <div className="section-card">
        <div className="section-header">
          <h2>Your Courses</h2>
        </div>
        {dashboardData?.courses?.length > 0 ? (
          <div className="courses-grid">
            {dashboardData.courses.map(course => (
              <div key={course.id} className="course-card">
                <div>
                  <h3>{course.title}</h3>
                  <p>{course.enrolledCount} students enrolled</p>
                  <div className="course-meta">
                    <span className="badge">{course.difficulty}</span>
                    <span className="badge">
                      {formatYearList(course.targetGrades)}
                    </span>
                    <span className="badge badge-muted">
                      {course.isPublished ? 'Published' : 'Draft'}
                    </span>
                  </div>
                </div>
                <a href={`/courses/${course.id}`} className="btn btn-secondary">
                  Manage Course
                </a>
              </div>
            ))}
          </div>
        ) : (
          <p className="empty-state">No courses created yet.</p>
        )}
      </div>
    </div>
  );
};

export default TeacherDashboard;
