import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { apiClient } from '../services/apiClient';
import { useAuthStore } from '../stores/authStore';
import '../styles/Challenge.css';

const ChallengePage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [challenge, setChallenge] = useState(null);
  const [code, setCode] = useState('');
  const [language, setLanguage] = useState('javascript');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [showHints, setShowHints] = useState(false);

  useEffect(() => {
    const fetchChallenge = async () => {
      try {
        const response = await apiClient.get(`/challenges/${id}`);
        setChallenge(response.data);
        setCode(response.data.initialCode || '// Write your code here\n');
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load challenge');
      } finally {
        setLoading(false);
      }
    };

    fetchChallenge();
  }, [id]);

  const handleSubmit = async () => {
    setSubmitting(true);
    setResult(null);
    setError('');

    try {
      const response = await apiClient.post('/submissions', {
        challenge: id,
        course: challenge.course,
        code,
        language
      });

      setResult({
        success: true,
        message: 'Code submitted successfully!',
        submission: response.data.submission
      });

      // Update progress if challenge is completed
      if (response.data.submission?.result === 'passed') {
        try {
          await apiClient.put(`/progress/student/${user._id}/course/${challenge.course}`, {
            challengeId: id,
            pointsEarned: challenge.gamificationPoints
          });
        } catch (progressErr) {
          console.error('Failed to update progress:', progressErr);
        }
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Submission failed');
      setResult({
        success: false,
        message: err.response?.data?.message || 'Submission failed'
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleRunCode = () => {
    setResult({
      success: true,
      message: 'Code execution simulation (actual execution would require a sandboxed environment)',
      output: 'This is a simulated output. In production, code would run in a secure sandbox.'
    });
  };

  if (loading) return <div className="loading">Loading challenge...</div>;
  if (error && !challenge) return <div className="error">{error}</div>;

  return (
    <div className="challenge-page">
      <div className="challenge-instructions">
        <button
          className="btn btn-secondary"
          onClick={() => navigate(`/courses/${challenge.course}`)}
          style={{ marginBottom: '20px' }}
        >
          ← Back to Course
        </button>

        <h1>{challenge.title}</h1>
        <p className="description">{challenge.description}</p>

        <div className="challenge-meta">
          <span className={`badge difficulty-${challenge.difficulty}`}>
            {challenge.difficulty}
          </span>
          <span className="badge">
            {challenge.gamificationPoints} points
          </span>
        </div>

        {challenge.objectives && challenge.objectives.length > 0 && (
          <div className="challenge-section">
            <h2>Objectives</h2>
            <ul>
              {challenge.objectives.map((objective, index) => (
                <li key={index}>{objective}</li>
              ))}
            </ul>
          </div>
        )}

        {challenge.instructions && (
          <div className="challenge-section">
            <h2>Instructions</h2>
            <p>{challenge.instructions}</p>
          </div>
        )}

        {challenge.testCases && challenge.testCases.length > 0 && (
          <div className="challenge-section">
            <h2>Test Cases</h2>
            {challenge.testCases.map((testCase, index) => (
              <div key={index} className="test-case">
                <div className="label">Test {index + 1}:</div>
                {testCase.description && <div>{testCase.description}</div>}
                {testCase.input && (
                  <div>
                    <strong>Input:</strong> {testCase.input}
                  </div>
                )}
                <div>
                  <strong>Expected Output:</strong> {testCase.expectedOutput}
                </div>
              </div>
            ))}
          </div>
        )}

        {challenge.hints && challenge.hints.length > 0 && (
          <div className="challenge-section">
            <h2>
              Hints
              <button
                className="btn btn-secondary"
                onClick={() => setShowHints(!showHints)}
                style={{ marginLeft: '10px', fontSize: '14px', padding: '5px 10px' }}
              >
                {showHints ? 'Hide' : 'Show'}
              </button>
            </h2>
            {showHints && (
              <>
                {challenge.hints.map((hint, index) => (
                  <div key={index} className="hint-box">
                    <strong>Hint {index + 1}:</strong> {hint}
                  </div>
                ))}
              </>
            )}
          </div>
        )}
      </div>

      <div className="challenge-editor">
        <div className="editor-header">
          <h3>Code Editor</h3>
          <select
            className="language-selector"
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
          >
            <option value="javascript">JavaScript</option>
            <option value="python">Python</option>
          </select>
        </div>

        <div className="code-editor-wrapper">
          <textarea
            className="code-editor"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder="Write your code here..."
            spellCheck={false}
          />
        </div>

        <div className="editor-actions">
          <button
            className="btn btn-secondary"
            onClick={handleRunCode}
            disabled={submitting}
          >
            Run Code
          </button>
          <button
            className="btn btn-primary"
            onClick={handleSubmit}
            disabled={submitting}
          >
            {submitting ? 'Submitting...' : 'Submit Solution'}
          </button>
        </div>

        {result && (
          <div className={`submission-result ${result.success ? 'success' : 'error'}`}>
            <h4>{result.message}</h4>
            {result.output && <pre>{result.output}</pre>}
            {result.submission && (
              <p>
                Status: <strong>{result.submission.result || 'Pending'}</strong>
              </p>
            )}
          </div>
        )}

        {error && (
          <div className="submission-result error">
            <h4>Error</h4>
            <p>{error}</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ChallengePage;

