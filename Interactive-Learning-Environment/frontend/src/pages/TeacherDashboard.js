import React, { useEffect, useState } from 'react';
import { apiClient } from '../services/apiClient';
import '../styles/Dashboard.css';

const TeacherDashboard = () => {
  const [dashboardData, setDashboardData] = useState(null);
  const [teacherAnalytics, setTeacherAnalytics] = useState(null);
  const [assignmentData, setAssignmentData] = useState([]);
  const [assignmentOptions, setAssignmentOptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showAssignmentForm, setShowAssignmentForm] = useState(false);
  const [formError, setFormError] = useState('');
  const [formSuccess, setFormSuccess] = useState('');
  const [assignmentError, setAssignmentError] = useState('');
  const [assignmentSuccess, setAssignmentSuccess] = useState('');
  const [reviewCourseId, setReviewCourseId] = useState('');
  const [reviewSubmissions, setReviewSubmissions] = useState([]);
  const [reviewFilter, setReviewFilter] = useState('all');
  const [reviewLoading, setReviewLoading] = useState(false);
  const [reviewError, setReviewError] = useState('');
  const [reviewSuccess, setReviewSuccess] = useState('');
  const [feedbackDrafts, setFeedbackDrafts] = useState({});
  const [markDrafts, setMarkDrafts] = useState({});
  const [savingFeedbackId, setSavingFeedbackId] = useState(null);
  const [savingMarkId, setSavingMarkId] = useState(null);
  const [rosterFilterCourseId, setRosterFilterCourseId] = useState('');
  const [rosterFilterYearGroup, setRosterFilterYearGroup] = useState('');
  const [rosterRiskOnly, setRosterRiskOnly] = useState(false);
  const [assignmentFilter, setAssignmentFilter] = useState('all');
  const [rosterLoading, setRosterLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submittingAssignment, setSubmittingAssignment] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    targetGrades: [],
    difficulty: 'beginner',
    topics: '',
    isPublished: true
  });
  const [assignmentForm, setAssignmentForm] = useState({
    title: '',
    description: '',
    courseId: '',
    challengeId: '',
    dueDate: '',
    assignedTo: []
  });
  const yearGroups = Array.from({ length: 13 }, (_, index) => index + 1);
  const formatYearLabel = (year) => {
    if (year <= 6) return `Year ${year} (Primary)`;
    if (year <= 11) return `Year ${year} (Secondary)`;
    return `Year ${year} (Sixth Form)`;
  };
  const formatYearList = (years = []) => years.map(formatYearLabel).join(', ');

  const buildDashboardUrl = ({ courseId = '', yearGroup = '', riskOnly = false } = {}) => {
    const params = new URLSearchParams();
    if (courseId) params.set('courseId', courseId);
    if (yearGroup) params.set('yearGroup', yearGroup);
    if (riskOnly) params.set('riskOnly', 'true');

    const query = params.toString();
    return query ? `/dashboard/teacher?${query}` : '/dashboard/teacher';
  };

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const [dashboardResponse, assignmentsResponse, optionsResponse, analyticsResponse] = await Promise.all([
          apiClient.get(buildDashboardUrl()),
          apiClient.get('/assignments/teacher'),
          apiClient.get('/assignments/teacher/options'),
          apiClient.get('/dashboard/teacher/analytics')
        ]);
        setDashboardData(dashboardResponse.data);
        setAssignmentData(assignmentsResponse.data?.assignments || []);
        setAssignmentOptions(optionsResponse.data?.courses || []);
        setTeacherAnalytics(analyticsResponse.data);
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load dashboard');
      } finally {
        setLoading(false);
      }
    };

    fetchDashboard();
  }, []);

  const refreshDashboard = async () => {
    const [dashboardResponse, assignmentsResponse, optionsResponse, analyticsResponse] = await Promise.all([
      apiClient.get(
        buildDashboardUrl({
          courseId: rosterFilterCourseId,
          yearGroup: rosterFilterYearGroup,
          riskOnly: rosterRiskOnly,
        })
      ),
      apiClient.get('/assignments/teacher'),
      apiClient.get('/assignments/teacher/options'),
      apiClient.get('/dashboard/teacher/analytics')
    ]);

    setDashboardData(dashboardResponse.data);
    setAssignmentData(assignmentsResponse.data?.assignments || []);
    setAssignmentOptions(optionsResponse.data?.courses || []);
    setTeacherAnalytics(analyticsResponse.data);
  };

  const handleApplyRosterFilters = async () => {
    setRosterLoading(true);
    setError('');

    try {
      const response = await apiClient.get(
        buildDashboardUrl({
          courseId: rosterFilterCourseId,
          yearGroup: rosterFilterYearGroup,
          riskOnly: rosterRiskOnly,
        })
      );
      setDashboardData(response.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to apply roster filters');
    } finally {
      setRosterLoading(false);
    }
  };

  const handleResetRosterFilters = async () => {
    setRosterFilterCourseId('');
    setRosterFilterYearGroup('');
    setRosterRiskOnly(false);
    setRosterLoading(true);
    setError('');

    try {
      const response = await apiClient.get('/dashboard/teacher');
      setDashboardData(response.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to reset roster filters');
    } finally {
      setRosterLoading(false);
    }
  };

  const selectedCourseOption = assignmentOptions.find((course) => course.id === assignmentForm.courseId);

  const assignmentCounts = assignmentData.reduce(
    (acc, assignment) => {
      const hasMissing = (assignment.missingCount || 0) > 0;
      const isOverdue = Boolean(assignment.isOverdue && assignment.pendingCount > 0);

      acc.all += 1;
      if (isOverdue) acc.overdue += 1;
      if (hasMissing) acc.missing += 1;
      if (!isOverdue) acc.active += 1;
      return acc;
    },
    { all: 0, overdue: 0, missing: 0, active: 0 }
  );

  const filteredAssignments = assignmentData.filter((assignment) => {
    if (assignmentFilter === 'all') return true;
    if (assignmentFilter === 'overdue') return Boolean(assignment.isOverdue && assignment.pendingCount > 0);
    if (assignmentFilter === 'missing') return (assignment.missingCount || 0) > 0;
    if (assignmentFilter === 'active') return !(assignment.isOverdue && assignment.pendingCount > 0);
    return true;
  });

  const loadCourseSubmissions = async (courseId) => {
    if (!courseId) {
      setReviewSubmissions([]);
      setFeedbackDrafts({});
      setMarkDrafts({});
      return;
    }

    setReviewLoading(true);
    setReviewError('');
    setReviewSuccess('');

    try {
      const response = await apiClient.get(`/submissions/course/${courseId}`);
      const submissions = response.data?.submissions || [];
      setReviewSubmissions(submissions);
      setFeedbackDrafts(
        submissions.reduce((acc, submission) => {
          acc[submission._id] = submission.feedback || '';
          return acc;
        }, {})
      );
      setMarkDrafts(
        submissions.reduce((acc, submission) => {
          acc[submission._id] = {
            result: submission.result || 'pending',
            pointsEarned: submission.pointsEarned || 0,
          };
          return acc;
        }, {})
      );
    } catch (err) {
      setReviewError(err.response?.data?.message || 'Unable to load submissions for this course');
    } finally {
      setReviewLoading(false);
    }
  };

  const handleReviewCourseChange = async (event) => {
    const courseId = event.target.value;
    setReviewCourseId(courseId);
    await loadCourseSubmissions(courseId);
  };

  const handleFeedbackDraftChange = (submissionId, value) => {
    setFeedbackDrafts((prev) => ({
      ...prev,
      [submissionId]: value,
    }));
  };

  const handleMarkDraftChange = (submissionId, field, value) => {
    setMarkDrafts((prev) => ({
      ...prev,
      [submissionId]: {
        ...(prev[submissionId] || { result: 'pending', pointsEarned: 0 }),
        [field]: field === 'pointsEarned' ? Number(value) : value,
      },
    }));
  };

  const filteredReviewSubmissions = reviewSubmissions.filter((submission) => {
    if (reviewFilter === 'all') return true;
    return (submission.result || 'pending') === reviewFilter;
  });

  const reviewCounts = reviewSubmissions.reduce(
    (acc, submission) => {
      const status = submission.result || 'pending';
      if (status === 'passed') acc.passed += 1;
      if (status === 'failed') acc.failed += 1;
      if (status === 'pending') acc.pending += 1;
      acc.all += 1;
      return acc;
    },
    { all: 0, passed: 0, failed: 0, pending: 0 }
  );

  const handleSaveFeedback = async (submissionId) => {
    const feedback = (feedbackDrafts[submissionId] || '').trim();
    if (!feedback) {
      setReviewError('Feedback cannot be empty.');
      return;
    }

    setSavingFeedbackId(submissionId);
    setReviewError('');
    setReviewSuccess('');

    try {
      await apiClient.patch(`/submissions/${submissionId}/feedback`, { feedback });
      setReviewSuccess('Feedback saved successfully.');
      setReviewSubmissions((prev) => prev.map((submission) => (
        submission._id === submissionId
          ? { ...submission, feedback }
          : submission
      )));
    } catch (err) {
      setReviewError(err.response?.data?.message || 'Unable to save feedback');
    } finally {
      setSavingFeedbackId(null);
    }
  };

  const handleSaveMark = async (submissionId) => {
    const draft = markDrafts[submissionId] || { result: 'pending', pointsEarned: 0 };

    setSavingMarkId(submissionId);
    setReviewError('');
    setReviewSuccess('');

    try {
      const response = await apiClient.patch(`/submissions/${submissionId}/mark`, {
        result: draft.result,
        pointsEarned: draft.pointsEarned,
        feedback: feedbackDrafts[submissionId] || '',
      });

      const updatedSubmission = response.data?.submission;
      setReviewSubmissions((prev) => prev.map((submission) => (
        submission._id === submissionId
          ? {
              ...submission,
              result: updatedSubmission?.result || draft.result,
              pointsEarned: updatedSubmission?.pointsEarned ?? draft.pointsEarned,
              feedback: updatedSubmission?.feedback ?? (feedbackDrafts[submissionId] || ''),
            }
          : submission
      )));

      const badgeMsg = (response.data?.newBadges || []).length
        ? ` New badges: ${response.data.newBadges.join(', ')}`
        : '';
      setReviewSuccess(`${response.data?.message || 'Mark saved'}${badgeMsg}`);
    } catch (err) {
      setReviewError(err.response?.data?.message || 'Unable to save mark');
    } finally {
      setSavingMarkId(null);
    }
  };

  const handleAssignmentInputChange = (event) => {
    const { name, value } = event.target;

    if (name === 'courseId') {
      setAssignmentForm(prev => ({
        ...prev,
        courseId: value,
        challengeId: '',
        assignedTo: []
      }));
      return;
    }

    setAssignmentForm(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleAssignToToggle = (studentId) => {
    setAssignmentForm(prev => {
      const current = new Set(prev.assignedTo);
      if (current.has(studentId)) {
        current.delete(studentId);
      } else {
        current.add(studentId);
      }
      return {
        ...prev,
        assignedTo: Array.from(current)
      };
    });
  };

  const handleCreateAssignment = async (event) => {
    event.preventDefault();
    setAssignmentError('');
    setAssignmentSuccess('');

    if (
      !assignmentForm.title ||
      !assignmentForm.description ||
      !assignmentForm.courseId ||
      !assignmentForm.challengeId ||
      !assignmentForm.dueDate
    ) {
      setAssignmentError('Title, description, course, challenge, and due date are required.');
      return;
    }

    setSubmittingAssignment(true);
    try {
      await apiClient.post('/assignments', assignmentForm);
      setAssignmentSuccess('Assignment created successfully.');
      setAssignmentForm({
        title: '',
        description: '',
        courseId: '',
        challengeId: '',
        dueDate: '',
        assignedTo: []
      });
      setShowAssignmentForm(false);
      await refreshDashboard();
    } catch (err) {
      setAssignmentError(err.response?.data?.message || 'Unable to create assignment');
    } finally {
      setSubmittingAssignment(false);
    }
  };

  const handleInputChange = (event) => {
    const { name, value, checked } = event.target;

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

  const handleExportCsv = async () => {
    try {
      const response = await apiClient.get('/dashboard/teacher/export.csv', {
        responseType: 'blob'
      });

      const blob = new Blob([response.data], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `teacher-analytics-${new Date().toISOString().slice(0, 10)}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to export analytics report');
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
        <div className="dashboard-header-actions">
          <button
            className="btn btn-secondary"
            onClick={handleExportCsv}
          >
            Export CSV Report
          </button>
          <button
            className="btn btn-secondary"
            onClick={() => setShowAssignmentForm(prev => !prev)}
          >
            {showAssignmentForm ? 'Close Assignment Form' : 'Create Assignment'}
          </button>
          <button
            className="btn btn-primary"
            onClick={() => setShowCreateForm(prev => !prev)}
          >
            {showCreateForm ? 'Close' : 'Create New Course'}
          </button>
        </div>
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

      {showAssignmentForm && (
        <div className="section-card">
          <div className="section-header">
            <h2>Create Assignment</h2>
          </div>
          {assignmentError && <div className="error">{assignmentError}</div>}
          {assignmentSuccess && <div className="success">{assignmentSuccess}</div>}
          <form className="dashboard-form" onSubmit={handleCreateAssignment}>
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="assignmentTitle">Assignment Title *</label>
                <input
                  id="assignmentTitle"
                  name="title"
                  type="text"
                  value={assignmentForm.title}
                  onChange={handleAssignmentInputChange}
                  required
                />
              </div>
              <div className="form-group">
                <label htmlFor="dueDate">Due Date *</label>
                <input
                  id="dueDate"
                  name="dueDate"
                  type="datetime-local"
                  value={assignmentForm.dueDate}
                  onChange={handleAssignmentInputChange}
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="assignmentDescription">Description *</label>
              <textarea
                id="assignmentDescription"
                name="description"
                rows="3"
                value={assignmentForm.description}
                onChange={handleAssignmentInputChange}
                required
              />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="assignmentCourse">Course *</label>
                <select
                  id="assignmentCourse"
                  name="courseId"
                  value={assignmentForm.courseId}
                  onChange={handleAssignmentInputChange}
                  required
                >
                  <option value="">Select course</option>
                  {assignmentOptions.map(course => (
                    <option key={course.id} value={course.id}>{course.title}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label htmlFor="assignmentChallenge">Challenge *</label>
                <select
                  id="assignmentChallenge"
                  name="challengeId"
                  value={assignmentForm.challengeId}
                  onChange={handleAssignmentInputChange}
                  required
                  disabled={!selectedCourseOption}
                >
                  <option value="">Select challenge</option>
                  {selectedCourseOption?.challenges?.map(challenge => (
                    <option key={challenge.id} value={challenge.id}>{challenge.title}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="form-group">
              <label>Assign To Students (leave empty to assign all enrolled students)</label>
              <div className="checkbox-grid">
                {selectedCourseOption?.students?.length ? selectedCourseOption.students.map(student => (
                  <label key={student.id} className="checkbox-item">
                    <input
                      type="checkbox"
                      checked={assignmentForm.assignedTo.includes(student.id)}
                      onChange={() => handleAssignToToggle(student.id)}
                    />
                    <span>{student.name}</span>
                  </label>
                )) : (
                  <span className="empty-state">Select a course to view enrolled students.</span>
                )}
              </div>
            </div>

            <div className="form-actions">
              <button className="btn btn-primary" type="submit" disabled={submittingAssignment}>
                {submittingAssignment ? 'Creating...' : 'Create Assignment'}
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
          <p className="stat-value">{dashboardData?.uniqueStudents || dashboardData?.totalStudents || 0}</p>
        </div>
        <div className="stat-card">
          <h3>Assignments</h3>
          <p className="stat-value">{teacherAnalytics?.summary?.totalAssignments || 0}</p>
        </div>
        <div className="stat-card">
          <h3>Overall Pass Rate</h3>
          <p className="stat-value">{teacherAnalytics?.summary?.passRate || 0}%</p>
        </div>
      </div>

      <div className="section-card">
        <div className="section-header">
          <h2>Analytics Snapshot</h2>
          <span className="section-subtitle">Class performance and risk overview</span>
        </div>
        <ul className="progress-list">
          <li>
            <span>Total Submissions</span>
            <strong>{teacherAnalytics?.summary?.totalSubmissions || 0}</strong>
          </li>
          <li>
            <span>Overdue Assignments</span>
            <strong>{teacherAnalytics?.summary?.overdueAssignments || 0}</strong>
          </li>
        </ul>
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

      <div className="section-card">
        <div className="section-header">
          <h2>Student Roster</h2>
          <span className="section-subtitle">Filter by course and year group, with at-risk highlighting</span>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label htmlFor="rosterCourse">Course</label>
            <select
              id="rosterCourse"
              value={rosterFilterCourseId}
              onChange={(event) => setRosterFilterCourseId(event.target.value)}
            >
              <option value="">All courses</option>
              {(dashboardData?.rosterFilters?.courseOptions || []).map((course) => (
                <option key={course.id} value={course.id}>{course.title}</option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="rosterYear">Year Group</label>
            <select
              id="rosterYear"
              value={rosterFilterYearGroup}
              onChange={(event) => setRosterFilterYearGroup(event.target.value)}
            >
              <option value="">All year groups</option>
              {(dashboardData?.rosterFilters?.yearGroupOptions || []).map((year) => (
                <option key={year} value={year}>{formatYearLabel(year)}</option>
              ))}
            </select>
          </div>

          <div className="form-group form-toggle">
            <label className="toggle-label" style={{ marginTop: '24px' }}>
              <input
                type="checkbox"
                checked={rosterRiskOnly}
                onChange={(event) => setRosterRiskOnly(event.target.checked)}
              />
              <span>At-risk only</span>
            </label>
          </div>
        </div>

        <div className="form-actions form-actions--spaced">
          <button
            className="btn btn-primary"
            type="button"
            onClick={handleApplyRosterFilters}
            disabled={rosterLoading}
          >
            {rosterLoading ? 'Applying...' : 'Apply Filters'}
          </button>
          <button
            className="btn btn-secondary"
            type="button"
            onClick={handleResetRosterFilters}
            disabled={rosterLoading}
          >
            Reset
          </button>
        </div>

        <ul className="progress-list progress-list--compact">
          <li>
            <span>Visible Students</span>
            <strong>{dashboardData?.rosterSummary?.filteredStudents || 0}</strong>
          </li>
          <li>
            <span>At-risk Students</span>
            <strong>{dashboardData?.rosterSummary?.atRiskStudents || 0}</strong>
          </li>
        </ul>

        {rosterLoading ? (
          <p className="empty-state">Loading roster...</p>
        ) : (dashboardData?.roster || []).length > 0 ? (
          <ul className="progress-list">
            {dashboardData.roster.map((student) => (
              <li key={student.id}>
                <div>
                  <strong>{student.name}</strong>
                  <div>{student.email}</div>
                  <div>
                    Year {student.grade || 'N/A'} • {student.enrolledCourseCount} course(s) • {student.totalPoints || 0} points
                  </div>
                  <div>
                    Assignments: {student.assignmentSummary?.completed || 0} completed, {student.assignmentSummary?.pending || 0} pending, {student.assignmentSummary?.overdue || 0} overdue
                  </div>
                  <div>
                    Last active: {student.lastActivityAt ? new Date(student.lastActivityAt).toLocaleDateString() : 'No activity yet'}
                  </div>
                  {student.riskReasons?.length > 0 && (
                    <div className="section-subtitle">{student.riskReasons.join(' • ')}</div>
                  )}
                </div>
                <div>
                  <span className={`badge ${student.isAtRisk ? '' : 'badge-muted'}`}>
                    {student.isAtRisk ? 'At Risk' : 'On Track'}
                  </span>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <p className="empty-state">No students match the selected filters.</p>
        )}
      </div>

      <div className="section-card">
        <div className="section-header">
          <h2>Submission Review</h2>
          <span className="section-subtitle">Review student work and leave feedback</span>
        </div>

        <div className="form-group">
          <label htmlFor="reviewCourse">Select Course</label>
          <select
            id="reviewCourse"
            value={reviewCourseId}
            onChange={handleReviewCourseChange}
          >
            <option value="">Choose a course</option>
            {(dashboardData?.courses || []).map((course) => (
              <option key={course.id} value={course.id}>{course.title}</option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label htmlFor="reviewFilter">Filter Submissions</label>
          <select
            id="reviewFilter"
            value={reviewFilter}
            onChange={(event) => setReviewFilter(event.target.value)}
          >
            <option value="all">All ({reviewCounts.all})</option>
            <option value="passed">Passed ({reviewCounts.passed})</option>
            <option value="failed">Failed ({reviewCounts.failed})</option>
            <option value="pending">Pending ({reviewCounts.pending})</option>
          </select>
        </div>

        {reviewError && <div className="error">{reviewError}</div>}
        {reviewSuccess && <div className="success">{reviewSuccess}</div>}

        {reviewLoading ? (
          <p className="empty-state">Loading submissions...</p>
        ) : reviewCourseId ? (
          filteredReviewSubmissions.length > 0 ? (
            <ul className="progress-list">
              {filteredReviewSubmissions.map((submission) => (
                <li key={submission._id}>
                  <div>
                    <strong>
                      {(submission.student?.firstName || 'Student')} {(submission.student?.lastName || '')}
                    </strong>
                    <div>{submission.challenge?.title || 'Challenge'} • {submission.result || 'pending'}</div>
                    <div>
                      Submitted: {submission.submittedAt ? new Date(submission.submittedAt).toLocaleString() : 'N/A'}
                    </div>
                    <div className="form-row" style={{ marginTop: '8px' }}>
                      <div className="form-group">
                        <label htmlFor={`result-${submission._id}`}>Mark Result</label>
                        <select
                          id={`result-${submission._id}`}
                          value={markDrafts[submission._id]?.result || 'pending'}
                          onChange={(event) => handleMarkDraftChange(submission._id, 'result', event.target.value)}
                        >
                          <option value="pending">Pending</option>
                          <option value="passed">Passed</option>
                          <option value="failed">Failed</option>
                        </select>
                      </div>
                      <div className="form-group">
                        <label htmlFor={`points-${submission._id}`}>Points</label>
                        <input
                          id={`points-${submission._id}`}
                          type="number"
                          min="0"
                          value={markDrafts[submission._id]?.pointsEarned ?? 0}
                          onChange={(event) => handleMarkDraftChange(submission._id, 'pointsEarned', event.target.value)}
                        />
                      </div>
                    </div>
                    <div className="form-group" style={{ marginTop: '8px' }}>
                      <label htmlFor={`feedback-${submission._id}`}>Feedback</label>
                      <textarea
                        id={`feedback-${submission._id}`}
                        rows="2"
                        value={feedbackDrafts[submission._id] || ''}
                        onChange={(event) => handleFeedbackDraftChange(submission._id, event.target.value)}
                      />
                    </div>
                  </div>
                  <div>
                    <button
                      className="btn btn-secondary"
                      onClick={() => handleSaveMark(submission._id)}
                      disabled={savingMarkId === submission._id}
                      style={{ marginBottom: '8px' }}
                    >
                      {savingMarkId === submission._id ? 'Saving Mark...' : 'Save Mark'}
                    </button>
                  </div>
                  <div>
                    <button
                      className="btn btn-primary"
                      onClick={() => handleSaveFeedback(submission._id)}
                      disabled={savingFeedbackId === submission._id}
                    >
                      {savingFeedbackId === submission._id ? 'Saving...' : 'Save Feedback'}
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p className="empty-state">No submissions match this filter.</p>
          )
        ) : (
          <p className="empty-state">Choose a course to review submissions.</p>
        )}
      </div>

      <div className="section-card">
        <div className="section-header">
          <h2>Assignments</h2>
          <div className="section-header-controls">
            <span className="section-subtitle">Deadline and completion tracking</span>
            <select
              className="filter-select"
              value={assignmentFilter}
              onChange={(event) => setAssignmentFilter(event.target.value)}
            >
              <option value="all">All ({assignmentCounts.all})</option>
              <option value="overdue">Overdue ({assignmentCounts.overdue})</option>
              <option value="missing">With Missing ({assignmentCounts.missing})</option>
              <option value="active">Active ({assignmentCounts.active})</option>
            </select>
          </div>
        </div>
        {filteredAssignments.length > 0 ? (
          <ul className="progress-list">
            {filteredAssignments.map((assignment) => (
              <li key={assignment.id}>
                <div>
                  <strong>{assignment.title}</strong>
                  <div>{assignment.courseTitle} • {assignment.challengeTitle}</div>
                  <div>Due: {new Date(assignment.dueDate).toLocaleString()}</div>
                  {assignment.missingStudentNames?.length > 0 && (
                    <div className="section-subtitle">
                      Missing: {assignment.missingStudentNames.join(', ')}
                    </div>
                  )}
                  {assignment.pendingStudentNames?.length > 0 && (
                    <div className="section-subtitle">
                      Pending: {assignment.pendingStudentNames.join(', ')}
                    </div>
                  )}
                </div>
                <div className="assignment-badges">
                  <span className="badge">{assignment.submittedCount}/{assignment.assignedCount} submitted</span>
                  <span className="badge">Late: {assignment.lateCount || 0}</span>
                  <span className="badge">Missing: {assignment.missingCount || 0}</span>
                  <span className="badge badge-muted">
                    {assignment.isOverdue && assignment.pendingCount > 0 ? 'Overdue' : 'Active'}
                  </span>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <p className="empty-state">No assignments match this filter.</p>
        )}
      </div>
    </div>
  );
};

export default TeacherDashboard;
