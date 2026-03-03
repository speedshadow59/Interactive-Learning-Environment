import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { apiClient } from '../services/apiClient';
import { useAuthStore } from '../stores/authStore';
import BlockEditor from '../components/BlockEditor';
import '../styles/Challenge.css';

const tutorPromptSuggestions = [
  'Can you explain what this challenge is asking me to do?',
  'What should I test first before I submit?',
  'Why might this output not match expected output?',
  'Give me a hint without giving the final answer.',
];

const getApiErrorMessage = (err, fallbackMessage) => {
  return err.response?.data?.message || fallbackMessage;
};

const getStarterCodeByLanguage = (selectedLanguage) => {
  return selectedLanguage === 'python'
    ? '# Write your code here\n'
    : '// Write your code here\n';
};

const blockCodeTemplates = {
  javascript: {
    log: 'console.log(%text%);',
    var: 'let %var% = %value%;',
    if: 'if (%condition%) {\n  %body%\n}',
    for: 'for (let i = 0; i < %count%; i++) {\n  %body%\n}',
    function: 'function %name%(%params%) {\n  %body%\n}',
    return: 'return %value%;',
    add: '%a% + %b%',
  },
  python: {
    log: 'print(%text%)',
    var: '%var% = %value%',
    if: 'if %condition%:\n    %body%',
    for: 'for i in range(%count%):\n    %body%',
    function: 'def %name%(%params%):\n    %body%',
    return: 'return %value%',
    add: '%a% + %b%',
  },
};

/*
  Challenge page flow:
  1) fetch challenge metadata
  2) let student solve in block mode or code mode
  3) run code for quick feedback
  4) submit final solution and update progress
*/

const ChallengePage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [challenge, setChallenge] = useState(null);
  const [code, setCode] = useState('');
  const [blocks, setBlocks] = useState([]);
  const [language, setLanguage] = useState('javascript');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState(null);
  const [aiHint, setAiHint] = useState(null);
  const [aiHintLoading, setAiHintLoading] = useState(false);
  const [aiHintError, setAiHintError] = useState('');
  const [aiTutorMessages, setAiTutorMessages] = useState([]);
  const [aiTutorInput, setAiTutorInput] = useState('');
  const [aiTutorLoading, setAiTutorLoading] = useState(false);
  const [aiTutorError, setAiTutorError] = useState('');
  const [aiTutorUsage, setAiTutorUsage] = useState(null);
  const [error, setError] = useState('');
  const [showHints, setShowHints] = useState(false);
  const [useBlockMode, setUseBlockMode] = useState(true);
  const lastAutoBlockCodeRef = useRef('');
  const prevLanguageRef = useRef(language);

  const canAskTutor = aiTutorInput.trim().length > 0 && !aiTutorLoading;

  // Converts visual blocks into executable source code.
  const buildCodeFromBlocks = useCallback((sourceBlocks = blocks, selectedLanguage = language) => {
    if (!Array.isArray(sourceBlocks) || sourceBlocks.length === 0) return '';

    const languageTemplates = blockCodeTemplates[selectedLanguage] || blockCodeTemplates.javascript;

    return sourceBlocks
      .map((block) => {
        let blockCode = languageTemplates[block.type] || block.code;
        Object.entries(block.params).forEach(([param, value]) => {
          let resolved = value || `<${param}>`;
          if (block.type === 'log' && param === 'text') {
            const trimmed = (value || '').trim();
            if (!trimmed) {
              resolved = '""';
            } else if (
              (trimmed.startsWith('"') && trimmed.endsWith('"')) ||
              (trimmed.startsWith("'") && trimmed.endsWith("'")) ||
              !Number.isNaN(Number(trimmed))
            ) {
              resolved = trimmed;
            } else {
              resolved = JSON.stringify(trimmed);
            }
          }
          blockCode = blockCode.replace(new RegExp(`%${param}%`, 'g'), resolved);
        });
        return blockCode;
      })
      .join('\n');
  }, [blocks, language]);

  // Chooses the authoritative code payload depending on current editor mode.
  const buildSubmissionCode = () => {
    if (!useBlockMode || blocks.length === 0) return code;
    return buildCodeFromBlocks();
  };

  const switchToCodeMode = () => {
    setCode(buildCodeFromBlocks());
    setUseBlockMode(false);
  };

  const switchToBlockMode = () => {
    setUseBlockMode(true);
  };

  useEffect(() => {
    const fetchChallenge = async () => {
      try {
        const response = await apiClient.get(`/challenges/${id}`);
        setChallenge(response.data);
        setCode(response.data.initialCode || getStarterCodeByLanguage('javascript'));
        
        // Initialize blocks if this is a block-based challenge
        if (response.data.isBlockBased) {
          setUseBlockMode(true);
          // Parse blocklyXml or create empty starter blocks
          setBlocks([]);
        }
      } catch (err) {
        setError(getApiErrorMessage(err, 'Failed to load challenge'));
      } finally {
        setLoading(false);
      }
    };

    fetchChallenge();
  }, [id]);

  useEffect(() => {
    setCode((previousCode) => {
      const jsStarter = getStarterCodeByLanguage('javascript');
      const pyStarter = getStarterCodeByLanguage('python');
      const normalized = (previousCode || '').trim();

      const isStarterLike =
        normalized.length === 0 ||
        normalized === jsStarter.trim() ||
        normalized === pyStarter.trim();

      if (!isStarterLike) {
        return previousCode;
      }

      return getStarterCodeByLanguage(language);
    });
  }, [language]);

  useEffect(() => {
    if (!Array.isArray(blocks) || blocks.length === 0) {
      prevLanguageRef.current = language;
      return;
    }

    const generatedBlockCode = buildCodeFromBlocks();
    const currentCode = code || '';
    const languageChanged = prevLanguageRef.current !== language;
    const shouldAutoSync =
      languageChanged ||
      useBlockMode ||
      currentCode.trim().length === 0 ||
      currentCode === lastAutoBlockCodeRef.current;

    if (shouldAutoSync && currentCode !== generatedBlockCode) {
      setCode(generatedBlockCode);
    }

    lastAutoBlockCodeRef.current = generatedBlockCode;
    prevLanguageRef.current = language;
  }, [blocks, language, useBlockMode, code, buildCodeFromBlocks]);

  // Persists student submission and syncs progress when challenge is passed.
  const handleSubmit = async () => {
    setSubmitting(true);
    setResult(null);
    setError('');

    try {
      // Convert blocks to code if in block mode
      const submissionCode = buildSubmissionCode();

      const response = await apiClient.post('/submissions', {
        challenge: id,
        course: challenge.course,
        code: submissionCode,
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
      const message = getApiErrorMessage(err, 'Submission failed');
      setError(message);
      setResult({
        success: false,
        message
      });
    } finally {
      setSubmitting(false);
    }
  };

  // Executes code without final submission to provide fast iteration feedback.
  const handleRunCode = async () => {
    setSubmitting(true);
    setError('');

    try {
      const codeToRun = buildSubmissionCode();

      const response = await apiClient.post('/execute', {
        code: codeToRun,
        language,
      });

      const rawOutput = (response.data?.output || '').trim();
      const expected = (challenge?.testCases || []).map((tc) => `${tc.expectedOutput || ''}`.trim()).filter(Boolean);
      const matched = expected.length > 0
        ? expected.some((exp) => rawOutput.includes(exp))
        : true;

      setResult({
        success: matched,
        message: matched
          ? 'Code executed successfully'
          : 'Code executed, but output does not match expected test output yet',
        output: response.data?.output || '(no output)',
        expectedOutput: expected[0] || null,
      });
    } catch (err) {
      const executionError = err.response?.data?.error || err.response?.data?.message || 'Code execution failed';
      setResult({
        success: false,
        message: 'Execution failed',
        output: executionError,
      });
      setError(executionError);
    } finally {
      setSubmitting(false);
    }
  };

  const handleGetAiHint = async () => {
    setAiHintLoading(true);
    setAiHintError('');

    try {
      const response = await apiClient.post(`/challenges/${id}/ai-hint`, {
        draftCode: buildSubmissionCode(),
      });

      setAiHint({
        suggestion: response.data?.suggestion || '',
        nextSteps: response.data?.nextSteps || [],
      });
    } catch (err) {
      setAiHintError(getApiErrorMessage(err, 'Unable to generate AI hint right now.'));
    } finally {
      setAiHintLoading(false);
    }
  };

  const handleAskAiTutor = async () => {
    const userMessage = aiTutorInput.trim();
    if (!userMessage) return;

    const nextMessages = [...aiTutorMessages, { role: 'user', content: userMessage }];
    setAiTutorMessages(nextMessages);
    setAiTutorInput('');
    setAiTutorLoading(true);
    setAiTutorError('');

    try {
      const response = await apiClient.post('/ai/tutor-assist', {
        challengeId: id,
        message: userMessage,
        draftCode: buildSubmissionCode(),
        language,
        history: nextMessages.slice(-6),
      });

      const assistantMessage = {
        role: 'assistant',
        content: response.data?.reply || 'No response from tutor.',
        model: response.data?.model || null,
      };

      setAiTutorMessages((prev) => [...prev, assistantMessage]);
      if (response.data?.usage) {
        setAiTutorUsage(response.data.usage);
      }
    } catch (err) {
      if (err.response?.data?.usage) {
        setAiTutorUsage(err.response.data.usage);
      }
      setAiTutorError(getApiErrorMessage(err, 'Failed to get AI tutor response.'));
    } finally {
      setAiTutorLoading(false);
    }
  };

  const handleTutorInputKeyDown = (event) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      if (!aiTutorLoading) {
        handleAskAiTutor();
      }
    }
  };

  const handleTutorQuickPrompt = (promptText) => {
    setAiTutorInput(promptText);
  };

  const handleClearTutorChat = () => {
    setAiTutorMessages([]);
    setAiTutorError('');
  };

  const handleExportTutorChat = () => {
    if (!aiTutorMessages.length) return;

    const content = aiTutorMessages
      .map((msg) => `${msg.role === 'user' ? 'Student' : 'Tutor'}: ${msg.content}`)
      .join('\n\n');

    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `tutor-chat-${id}-${new Date().toISOString().slice(0, 10)}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  if (loading) return <div className="loading">Loading challenge...</div>;
  if (error && !challenge) return <div className="error">{error}</div>;

  return (
    <div className="challenge-page">
      <div className="challenge-instructions">
        <button
          className="btn btn-secondary challenge-back-btn"
          onClick={() => navigate(`/courses/${challenge.course}`)}
          type="button"
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
                className="btn btn-secondary hint-toggle-btn"
                onClick={() => setShowHints(!showHints)}
                type="button"
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
          <div>
            <h3>Code Editor</h3>
            <div className="editor-mode-toggle">
              <button
                className={`toggle-btn ${useBlockMode ? 'active' : ''}`}
                onClick={switchToBlockMode}
              >
                🧩 Block Mode
              </button>
              <button
                className={`toggle-btn ${!useBlockMode ? 'active' : ''}`}
                onClick={switchToCodeMode}
              >
                {'<>'} Code Mode
              </button>
            </div>
          </div>
          <select
            className="language-selector"
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
          >
            <option value="javascript">JavaScript</option>
            <option value="python">Python</option>
          </select>
        </div>

        {useBlockMode ? (
          <BlockEditor
            initialBlocks={blocks}
            onChange={setBlocks}
            language={language}
          />
        ) : (
          <div className="code-editor-wrapper">
            <textarea
              className="code-editor"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="Write your code here..."
              spellCheck={false}
            />
          </div>
        )}

        <div className="editor-actions">
          <button
            className="btn btn-secondary"
            onClick={handleRunCode}
            disabled={submitting}
          >
            Run Code
          </button>
          <button
            className="btn btn-secondary"
            onClick={handleGetAiHint}
            disabled={submitting || aiHintLoading}
            type="button"
          >
            {aiHintLoading ? 'Generating Hint...' : 'Get AI Hint'}
          </button>
          <button
            className="btn btn-primary"
            onClick={handleSubmit}
            disabled={submitting}
          >
            {submitting ? 'Submitting...' : 'Submit Solution'}
          </button>
        </div>

        {aiHintError && <div className="error">{aiHintError}</div>}

        {aiHint?.suggestion && (
          <div className="challenge-section challenge-ai-panel">
            <h2>AI Tutor Suggestion</h2>
            <div className="hint-box">{aiHint.suggestion}</div>
            {Array.isArray(aiHint.nextSteps) && aiHint.nextSteps.length > 0 && (
              <>
                <h2>Suggested Next Steps</h2>
                <ul>
                  {aiHint.nextSteps.map((step, index) => (
                    <li key={`${step}-${index}`}>{step}</li>
                  ))}
                </ul>
              </>
            )}
          </div>
        )}

        <div className="challenge-section challenge-ai-panel">
          <h2>Real-time AI Tutor</h2>
          <p>Ask questions about your current code and challenge requirements.</p>

          {aiTutorUsage && (
            <div className="section-subtitle ai-tutor-usage">
              AI tutor requests left today: {aiTutorUsage.remainingToday}/{aiTutorUsage.dailyLimit}
            </div>
          )}

          <div className="ai-tutor-prompt-row">
            {tutorPromptSuggestions.map((prompt) => (
              <button
                key={prompt}
                className="btn btn-secondary ai-prompt-chip"
                type="button"
                onClick={() => handleTutorQuickPrompt(prompt)}
                disabled={aiTutorLoading}
              >
                {prompt}
              </button>
            ))}
          </div>

          <div className="ai-tutor-chat-log">
            {aiTutorMessages.length > 0 ? (
              aiTutorMessages.map((msg, index) => (
                <div key={`${msg.role}-${index}`} className={`ai-tutor-message ai-tutor-message--${msg.role}`}>
                  <strong>{msg.role === 'user' ? 'You' : 'Tutor'}:</strong> {msg.content}
                  {msg.role === 'assistant' && msg.model && (
                    <div className="section-subtitle">Model: {msg.model}</div>
                  )}
                </div>
              ))
            ) : (
              <p className="empty-state">No conversation yet. Ask your first question.</p>
            )}
          </div>

          <div className="ai-tutor-input-row">
            <input
              type="text"
              value={aiTutorInput}
              onChange={(event) => setAiTutorInput(event.target.value)}
              onKeyDown={handleTutorInputKeyDown}
              placeholder="e.g. Why does my loop miss the last item?"
            />
            <button
              className="btn btn-primary"
              type="button"
              onClick={handleAskAiTutor}
              disabled={!canAskTutor}
            >
              {aiTutorLoading ? 'Thinking...' : 'Ask Tutor'}
            </button>
          </div>

          <div className="ai-tutor-actions-row">
            <button
              className="btn btn-secondary"
              type="button"
              onClick={handleClearTutorChat}
              disabled={aiTutorLoading || aiTutorMessages.length === 0}
            >
              Clear Chat
            </button>
            <button
              className="btn btn-secondary"
              type="button"
              onClick={handleExportTutorChat}
              disabled={aiTutorMessages.length === 0}
            >
              Export Chat
            </button>
          </div>

          {aiTutorError && <div className="error">{aiTutorError}</div>}
        </div>

        {result && (
          <div className={`submission-result ${result.success ? 'success' : 'error'}`}>
            <h4>{result.message}</h4>
            {result.output && <pre>{result.output}</pre>}
            {result.expectedOutput && !result.success && (
              <p>
                Expected (example): <strong>{result.expectedOutput}</strong>
              </p>
            )}
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

