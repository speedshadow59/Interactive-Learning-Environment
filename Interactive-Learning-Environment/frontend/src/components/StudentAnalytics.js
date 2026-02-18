import React, { useEffect, useState } from 'react';
import { apiClient } from '../services/apiClient';
import '../styles/Analytics.css';

const StudentAnalytics = ({ courseId }) => {
  const [students, setStudents] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCourseStudents = async () => {
      try {
        const courseRes = await apiClient.get(`/courses/${courseId}`);
        const course = courseRes.data;

        const enrolledStudents = course.enrolledStudents || [];

        const studentPromises = enrolledStudents.map(async (student) => {
          const studentId = typeof student === 'string' ? student : student?._id;

          if (!studentId) {
            return null;
          }

          try {
            const progressRes = await apiClient.get(
              `/progress/student/${studentId}/course/${courseId}`
            );

            return {
              _id: studentId,
              studentId,
              ...progressRes.data,
              studentInfo: {
                firstName:
                  progressRes.data?.student?.firstName ||
                  student?.firstName ||
                  'Student',
                lastName:
                  progressRes.data?.student?.lastName ||
                  student?.lastName ||
                  '',
                email:
                  progressRes.data?.student?.email ||
                  student?.email ||
                  '',
              }
            };
          } catch (err) {
            return {
              _id: studentId,
              studentId,
              studentInfo: {
                firstName: student?.firstName || 'Student',
                lastName: student?.lastName || '',
                email: student?.email || '',
              },
              completedChallenges: [],
              totalPoints: 0,
              currentLevel: 1,
              badges: [],
              lastActivityAt: null,
            };
          }
        });

        const studentsData = await Promise.all(studentPromises);
        setStudents(studentsData.filter(s => s !== null));
      } catch (err) {
        console.error('Failed to load students:', err);
      } finally {
        setLoading(false);
      }
    };

    if (courseId) {
      fetchCourseStudents();
    }
  }, [courseId]);

  const handleStudentClick = async (studentProgress) => {
    setSelectedStudent(studentProgress);
    try {
      const studentId = studentProgress.studentId || studentProgress.student?._id || studentProgress.student;
      if (!studentId) {
        return;
      }

      const analyticsRes = await apiClient.get(
        `/dashboard/student/${studentId}`
      );
      setAnalytics(analyticsRes.data);
    } catch (err) {
      console.error('Failed to load analytics:', err);
    }
  };

  if (loading) return <div>Loading student data...</div>;

  return (
    <div className="analytics-container">
      <div className="students-list">
        <h3>Enrolled Students ({students.length})</h3>
        {students.length === 0 ? (
          <p className="empty-state">No students enrolled yet.</p>
        ) : (
          <div className="student-list-items">
            {students.map((student) => (
              <div
                key={student._id}
                className={`student-item ${selectedStudent?._id === student._id ? 'active' : ''}`}
                onClick={() => handleStudentClick(student)}
              >
                <div className="student-info">
                  <h4>{student.studentInfo?.firstName} {student.studentInfo?.lastName}</h4>
                  <p>{student.completedChallenges?.length || 0} challenges completed</p>
                </div>
                <div className="student-points">
                  {student.totalPoints || 0} pts
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {selectedStudent && (
        <div className="student-details">
          <h3>
            {selectedStudent.studentInfo?.firstName} {selectedStudent.studentInfo?.lastName}
          </h3>

          <div className="analytics-stats">
            <div className="stat-box">
              <div className="stat-label">Challenges Completed</div>
              <div className="stat-value">{selectedStudent.completedChallenges?.length || 0}</div>
            </div>
            <div className="stat-box">
              <div className="stat-label">Total Points</div>
              <div className="stat-value">{selectedStudent.totalPoints || 0}</div>
            </div>
            <div className="stat-box">
              <div className="stat-label">Current Level</div>
              <div className="stat-value">{selectedStudent.currentLevel || 1}</div>
            </div>
            <div className="stat-box">
              <div className="stat-label">Badges Earned</div>
              <div className="stat-value">{selectedStudent.badges?.length || 0}</div>
            </div>
          </div>

          <div className="analytics-section">
            <h4>Badges & Achievements</h4>
            {selectedStudent.badges && selectedStudent.badges.length > 0 ? (
              <div className="badges-mini-list">
                {selectedStudent.badges.map((badge, index) => (
                  <div key={index} className="badge-mini">
                    🏆 {badge.name}
                  </div>
                ))}
              </div>
            ) : (
              <p className="empty-state">No badges earned yet.</p>
            )}
          </div>

          <div className="analytics-section">
            <h4>Completed Challenges</h4>
            {selectedStudent.completedChallenges && selectedStudent.completedChallenges.length > 0 ? (
              <div className="challenges-progress-list">
                {selectedStudent.completedChallenges.map((item, index) => (
                  <div key={index} className="progress-item">
                    <span>Challenge {index + 1}</span>
                    <span>{item.pointsEarned} points</span>
                    <span className="date">
                      {new Date(item.completedAt).toLocaleDateString()}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="empty-state">No challenges completed yet.</p>
            )}
          </div>

          {selectedStudent.lastActivityAt && (
            <div className="analytics-section">
              <h4>Last Activity</h4>
              <p>{new Date(selectedStudent.lastActivityAt).toLocaleString()}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default StudentAnalytics;
