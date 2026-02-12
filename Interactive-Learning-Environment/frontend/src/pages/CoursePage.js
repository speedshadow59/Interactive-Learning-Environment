import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { apiClient } from '../services/apiClient';
import { useAuthStore } from '../stores/authStore';
import StudentAnalytics from '../components/StudentAnalytics';
import '../styles/Challenge.css';

const CoursePage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [course, setCourse] = useState(null);
  const [challenges, setChallenges] = useState([]);
  const [progress, setProgress] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('challenges');
  const [enrolling, setEnrolling] = useState(false);

  useEffect(() => {
    const fetchCourseData = async () => {
      try {
        const courseRes = await apiClient.get(`/courses/${id}`);
        setCourse(courseRes.data);

        const challengesRes = await apiClient.get(`/challenges/course/${id}`);
        setChallenges(challengesRes.data);

        if (user?.role === 'student') {
          try {
            const progressRes = await apiClient.get(`/progress/student/${user._id}/course/${id}`);
            setProgress(progressRes.data);
          } catch (err) {
            // No progress yet
          }
        }
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load course');
      } finally {
        setLoading(false);
      }
    };

    fetchCourseData();
  }, [id, user]);

  const handleEnroll = async () => {
    setEnrolling(true);
    setError('');
    try {
      await apiClient.post(`/courses/${id}/enroll`);
      const courseRes = await apiClient.get(`/courses/${id}`);
      setCourse(courseRes.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to enroll');
    } finally {
      setEnrolling(false);
    }
  };

  const isEnrolled = course?.enrolledStudents?.some(
    student => student._id?.toString() === user?._id?.toString() || student.toString() === user?._id?.toString()
  );

  const isChallengeCompleted = (challengeId) => {
    return progress?.completedChallenges?.some(
      c => c.challenge?.toString() === challengeId?.toString()
    );
  };

  if (loading) return <div className="loading">Loading course...</div>;
  if (error && !course) return <div className="error">{error}</div>;

  return (
    <div className="course-page">
      <div className="course-header">
        <h1>{course?.title}</h1>
        <p>{course?.description}</p>
        <div className="course-meta">
          <span className="badge">
            Difficulty: {course?.difficulty}
          </span>
          <span className="badge">
            Year {course?.targetGrades?.join(', ')}
          </span>
          <span className="badge">
            {challenges.length} Challenges
          </span>
          {progress && (
            <span className="badge">
              {progress.completedChallenges?.length || 0} Completed
            </span>
          )}
        </div>
        {user?.role === 'student' && !isEnrolled && (
          <button
            className="btn btn-primary"
            onClick={handleEnroll}
            disabled={enrolling}
            style={{ marginTop: '20px' }}
          >
            {enrolling ? 'Enrolling...' : 'Enroll in Course'}
          </button>
        )}
      </div>

      {error && <div className="error" style={{ marginBottom: '20px' }}>{error}</div>}

      <div className="course-nav">
        <button
          className={activeTab === 'challenges' ? 'active' : ''}
          onClick={() => setActiveTab('challenges')}
        >
          Challenges
        </button>
        {user?.role === 'teacher' && (
          <button
            className={activeTab === 'analytics' ? 'active' : ''}
            onClick={() => setActiveTab('analytics')}
          >
            Student Analytics
          </button>
        )}
        <button
          className={activeTab === 'about' ? 'active' : ''}
          onClick={() => setActiveTab('about')}
        >
          About
        </button>
      </div>

      {activeTab === 'challenges' && (
        <div className="challenges-list">
          {challenges.length === 0 ? (
            <p style={{ color: '#607080' }}>No challenges available yet.</p>
          ) : (
            challenges.map((challenge, index) => (
              <div
                key={challenge._id}
                className="challenge-item"
                onClick={() => navigate(`/challenges/${challenge._id}`)}
              >
                <div className="challenge-item-left">
                  <h3>
                    {index + 1}. {challenge.title}
                  </h3>
                  <p>{challenge.description}</p>
                  <div className="challenge-item-meta">
                    <span className={`badge difficulty-${challenge.difficulty}`}>
                      {challenge.difficulty}
                    </span>
                    <span className="badge">
                      {challenge.gamificationPoints} points
                    </span>
                    {isChallengeCompleted(challenge._id) && (
                      <span className="badge completed">✓ Completed</span>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {activeTab === 'analytics' && user?.role === 'teacher' && (
        <div className="section-card">
          <StudentAnalytics courseId={id} />
        </div>
      )}

      {activeTab === 'about' && (
        <div className="section-card">
          <h2>About This Course</h2>
          <p>{course?.description}</p>
          {course?.topics?.length > 0 && (
            <>
              <h3>Topics Covered</h3>
              <ul>
                {course.topics.map((topic, index) => (
                  <li key={index}>{topic}</li>
                ))}
              </ul>
            </>
          )}
          {course?.instructor && (
            <>
              <h3>Instructor</h3>
              <p>
                {course.instructor.firstName} {course.instructor.lastName}
              </p>
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default CoursePage;

