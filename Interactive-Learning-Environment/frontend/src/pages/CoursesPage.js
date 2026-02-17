import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiClient } from '../services/apiClient';
import { useAuthStore } from '../stores/authStore';
import '../styles/Dashboard.css';

const CoursesPage = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [courses, setCourses] = useState([]);
  const [enrolledCourseIds, setEnrolledCourseIds] = useState(new Set());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [enrollingId, setEnrollingId] = useState(null);
  const [filters, setFilters] = useState({
    difficulty: '',
    targetGrade: ''
  });

  const yearGroups = Array.from({ length: 13 }, (_, index) => index + 1);
  const formatYearLabel = (year) => {
    if (year <= 6) return `Year ${year} (Primary)`;
    if (year <= 11) return `Year ${year} (Secondary)`;
    return `Year ${year} (Sixth Form)`;
  };

  const formatYearList = (years = []) => years.map(formatYearLabel).join(', ');

  useEffect(() => {
    fetchCourses();
    if (user?.role === 'student') {
      fetchEnrolledCourses();
    }
  }, [filters, user]);

  const fetchCourses = async () => {
    try {
      const params = {};
      if (filters.difficulty) params.difficulty = filters.difficulty;
      if (filters.targetGrade) params.targetGrade = filters.targetGrade;

      const response = await apiClient.get('/courses', { params });
      setCourses(response.data || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load courses');
    } finally {
      setLoading(false);
    }
  };

  const fetchEnrolledCourses = async () => {
    try {
      const response = await apiClient.get('/dashboard/student');
      const enrolledIds = new Set(
        (response.data?.enrolledCourses || []).map(course => course.id?.toString())
      );
      setEnrolledCourseIds(enrolledIds);
    } catch (err) {
      console.error('Failed to fetch enrolled courses:', err);
    }
  };

  const handleEnroll = async (courseId) => {
    setEnrollingId(courseId);
    try {
      await apiClient.post(`/courses/${courseId}/enroll`);
      setEnrolledCourseIds(prev => new Set([...prev, courseId]));
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to enroll');
    } finally {
      setEnrollingId(null);
    }
  };

  const handleFilterChange = (e) => {
    setFilters({
      ...filters,
      [e.target.name]: e.target.value
    });
  };

  if (loading) return <div className="loading">Loading courses...</div>;

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <div>
          <h1>Browse Courses</h1>
          <p>Discover and enroll in courses to start learning</p>
        </div>
      </div>

      <div className="filters-section">
        <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap', alignItems: 'flex-end' }}>
          <div className="form-group" style={{ flex: '1', minWidth: '200px', marginBottom: 0 }}>
            <label htmlFor="difficulty">Difficulty</label>
            <select
              id="difficulty"
              name="difficulty"
              value={filters.difficulty}
              onChange={handleFilterChange}
            >
              <option value="">All Levels</option>
              <option value="beginner">Beginner</option>
              <option value="intermediate">Intermediate</option>
              <option value="advanced">Advanced</option>
            </select>
          </div>

          <div className="form-group" style={{ flex: '1', minWidth: '200px', marginBottom: 0 }}>
            <label htmlFor="targetGrade">Year Group</label>
            <select
              id="targetGrade"
              name="targetGrade"
              value={filters.targetGrade}
              onChange={handleFilterChange}
            >
              <option value="">All Years</option>
              {yearGroups.map(year => (
                <option key={year} value={year}>
                  {formatYearLabel(year)}
                </option>
              ))}
            </select>
          </div>

          {(filters.difficulty || filters.targetGrade) && (
            <button
              className="btn"
              onClick={() => setFilters({ difficulty: '', targetGrade: '' })}
              style={{ padding: '10px 20px' }}
            >
              Clear Filters
            </button>
          )}
        </div>
      </div>

      {error && <div className="error-message" style={{ marginBottom: '20px' }}>{error}</div>}

      <div className="courses-grid">
        {courses.length === 0 ? (
          <div style={{
            gridColumn: '1 / -1',
            textAlign: 'center',
            padding: '60px 20px',
            color: '#607080'
          }}>
            <h3>No courses found</h3>
            <p>Try adjusting your filters</p>
          </div>
        ) : (
          courses.map((course) => {
            const isEnrolled = enrolledCourseIds.has(course._id);
            const isEnrolling = enrollingId === course._id;

            return (
              <div
                key={course._id}
                className="course-card"
                onClick={() => navigate(`/courses/${course._id}`)}
              >
                <h3>{course.title}</h3>
                <p>{course.description}</p>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '16px' }}>
                  <span className="badge">{course.difficulty}</span>
                  <span className="badge">
                    {formatYearList(course.targetGrades)}
                  </span>
                  <span className="badge">
                    {course.challenges?.length || 0} challenges
                  </span>
                </div>
                {user?.role === 'student' && (
                  <button
                    className={`btn ${isEnrolled ? 'btn-secondary' : 'btn-primary'}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      if (!isEnrolled && !isEnrolling) {
                        handleEnroll(course._id);
                      }
                    }}
                    disabled={isEnrolled || isEnrolling}
                  >
                    {isEnrolling ? 'Enrolling...' : isEnrolled ? '✓ Enrolled' : 'Enroll'}
                  </button>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default CoursesPage;
