const MAX_HISTORY_MESSAGES = 6;

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

const getRealtimeTutorResponse = async ({ challenge, message, draftCode, language, latestResult, history }) => {
  const client = getClient();

  if (!client) {
    return {
      configured: false,
      reply: 'Real AI tutor is not configured yet. Add OPENAI_API_KEY (and optional OPENAI_MODEL) in backend environment variables.',
      model: null,
    };
  }

  const model = process.env.OPENAI_MODEL || 'gpt-4o-mini';
  const safeMessage = `${message || ''}`.trim().slice(0, 1200);

  if (!safeMessage) {
    return {
      configured: true,
      reply: 'Ask a specific question about your code, output, or challenge requirement.',
      model,
    };
  }

  const messages = [
    { role: 'system', content: buildSystemPrompt() },
    { role: 'system', content: buildContextMessage({ challenge, draftCode, language, latestResult }) },
    ...normalizeHistory(history),
    { role: 'user', content: safeMessage },
  ];

  const completion = await client.chat.completions.create({
    model,
    temperature: 0.3,
    messages,
  });

  const reply = completion.choices?.[0]?.message?.content?.trim();

  return {
    configured: true,
    reply: reply || 'I could not generate a response just now. Please try rephrasing your question.',
    model,
  };
};

module.exports = {
  getRealtimeTutorResponse,
};
