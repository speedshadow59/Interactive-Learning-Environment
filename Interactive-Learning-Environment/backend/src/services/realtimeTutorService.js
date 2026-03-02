const MAX_HISTORY_MESSAGES = 6;
const { generateStudentHint } = require('./aiAssistantService');

const getClient = () => {
  if (!process.env.OPENAI_API_KEY) {
    return null;
  }

  let OpenAI;

  try {
    OpenAI = require('openai');
  } catch (error) {
    return null;
  }

  return new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
};

const buildSystemPrompt = () => {
  return [
    'You are a real-time coding tutor for school students.',
    'Give short, helpful guidance and explain concepts clearly.',
    'Do not provide full final solutions unless explicitly asked by a teacher.',
    'Prefer hints, debugging steps, and one small code example when useful.',
    'Keep responses concise and actionable.',
  ].join(' ');
};

const buildContextMessage = ({ challenge, draftCode, language, latestResult }) => {
  const objectives = Array.isArray(challenge?.objectives) && challenge.objectives.length
    ? challenge.objectives.join('; ')
    : 'Not provided';

  const hint = Array.isArray(challenge?.hints) && challenge.hints.length
    ? challenge.hints[0]
    : 'Not provided';

  const expectedOutput = challenge?.expectedOutput || 'Not provided';

  return [
    `Challenge title: ${challenge?.title || 'Unknown challenge'}`,
    `Difficulty: ${challenge?.difficulty || 'medium'}`,
    `Description: ${challenge?.description || 'No description'}`,
    `Instructions: ${challenge?.instructions || 'No instructions'}`,
    `Objectives: ${objectives}`,
    `Expected output: ${expectedOutput}`,
    `Sample hint: ${hint}`,
    `Student language: ${language || 'javascript'}`,
    `Latest submission result: ${latestResult || 'none'}`,
    `Student draft code:\n${draftCode || '(empty draft)'}`,
  ].join('\n');
};

const normalizeHistory = (history = []) => {
  return history
    .filter((item) => item && (item.role === 'user' || item.role === 'assistant') && item.content)
    .slice(-MAX_HISTORY_MESSAGES)
    .map((item) => ({
      role: item.role,
      content: `${item.content}`.slice(0, 2000),
    }));
};

const buildFreeTutorResponse = ({ challenge, message, draftCode, latestResult }) => {
  const hintData = generateStudentHint({
    challenge,
    latestSubmission: latestResult ? { result: latestResult } : null,
    draftCode,
  });

  const responseParts = [
    `You asked: "${message}"`,
    hintData.suggestion,
    'Try this next:',
    ...hintData.nextSteps.map((step, index) => `${index + 1}. ${step}`),
  ];

  return {
    configured: true,
    provider: 'free',
    model: 'local-free-tutor',
    reply: responseParts.join(' '),
  };
};

const getRealtimeTutorResponse = async ({ challenge, message, draftCode, language, latestResult, history }) => {
  const tutorMode = `${process.env.AI_TUTOR_MODE || 'auto'}`.toLowerCase();
  const client = getClient();
  const safeMessage = `${message || ''}`.trim().slice(0, 1200);

  if (!safeMessage) {
    return {
      configured: true,
      provider: 'free',
      model: 'local-free-tutor',
      reply: 'Ask a specific question about your code, output, or challenge requirement.',
    };
  }

  if (tutorMode === 'free') {
    return buildFreeTutorResponse({
      challenge,
      message: safeMessage,
      draftCode,
      latestResult,
    });
  }

  if (!client) {
    return buildFreeTutorResponse({
      challenge,
      message: safeMessage,
      draftCode,
      latestResult,
    });
  }

  const model = process.env.OPENAI_MODEL || 'gpt-4o-mini';

  const messages = [
    { role: 'system', content: buildSystemPrompt() },
    { role: 'system', content: buildContextMessage({ challenge, draftCode, language, latestResult }) },
    ...normalizeHistory(history),
    { role: 'user', content: safeMessage },
  ];

  try {
    const completion = await client.chat.completions.create({
      model,
      temperature: 0.3,
      messages,
    });

    const reply = completion.choices?.[0]?.message?.content?.trim();

    return {
      configured: true,
      provider: 'openai',
      reply: reply || 'I could not generate a response just now. Please try rephrasing your question.',
      model,
    };
  } catch (error) {
    const fallback = buildFreeTutorResponse({
      challenge,
      message: safeMessage,
      draftCode,
      latestResult,
    });

    return {
      ...fallback,
      provider: 'free-fallback',
      fallbackReason: error.message,
    };
  }
};

module.exports = {
  getRealtimeTutorResponse,
};
