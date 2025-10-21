const OpenAI = require('openai');

const OPENAI_MODEL = process.env.OPENAI_MODEL || 'gpt-4o-mini';

let openaiClient;
function getClient() {
  if (!openaiClient) {
    openaiClient = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  }
  return openaiClient;
}

function buildSystemPrompt({ roleTitle, jobDescription }) {
  const roleLine = roleTitle ? ` for the role: ${roleTitle}` : '';
  const jobBlock = jobDescription ? `\nRole context:\n${jobDescription}\n` : '';
  return [
    'You are a professional, fair, and concise technical interviewer' + roleLine + '.',
    'Conduct a structured interview. Ask exactly ONE question at a time.',
    'Keep questions focused, 1-2 sentences max. Prefer practical, real-world scenarios.',
    'Adapt difficulty dynamically based on the candidate\'s answers.',
    'Avoid giving away full solutions. Ask for clarification or deeper reasoning when needed.',
    'Be friendly, but do not chit-chat. Stay on topic and progress the interview.',
    'When the candidate says "end" or after ~8-10 Q&A turns, conclude with a brief closing and await evaluation. Do not self-evaluate unless asked by the system.',
    jobBlock,
  ].join('\n');
}

async function generateInterviewerReply({ messages, roleTitle, jobDescription }) {
  const client = getClient();
  const system = buildSystemPrompt({ roleTitle, jobDescription });

  // Ensure a system message at the beginning
  const fullMessages = [
    { role: 'system', content: system },
    ...messages.map((m) => ({ role: m.role, content: m.content })),
  ];

  const response = await client.chat.completions.create({
    model: OPENAI_MODEL,
    messages: fullMessages,
    temperature: 0.4,
  });

  const content = response.choices?.[0]?.message?.content?.trim() || 'Can you elaborate on that?';
  return { content };
}

async function generateOpeningQuestion({ roleTitle, jobDescription }) {
  const client = getClient();
  const system = buildSystemPrompt({ roleTitle, jobDescription });

  const response = await client.chat.completions.create({
    model: OPENAI_MODEL,
    messages: [
      { role: 'system', content: system },
      { role: 'user', content: 'Start the interview by asking your first question.' },
    ],
    temperature: 0.4,
  });

  const content = response.choices?.[0]?.message?.content?.trim() || 'Tell me about a recent project you worked on.';
  return { content };
}

async function generateEvaluation({ messages, roleTitle, jobDescription }) {
  const client = getClient();
  const system = buildSystemPrompt({ roleTitle, jobDescription });

  const response = await client.chat.completions.create({
    model: OPENAI_MODEL,
    messages: [
      { role: 'system', content: system },
      ...messages.map((m) => ({ role: m.role, content: m.content })),
      { role: 'system', content: 'Now, produce a concise (<=200 words) interview summary and numeric scores (1-10) for: Technical Depth, Communication, Problem Solving, and Overall. Return JSON with keys summary, scores.' },
    ],
    temperature: 0.2,
    response_format: { type: 'json_object' },
  });

  const json = response.choices?.[0]?.message?.content || '{}';
  try {
    return JSON.parse(json);
  } catch (e) {
    return { summary: json, scores: {} };
  }
}

module.exports = {
  generateOpeningQuestion,
  generateInterviewerReply,
  generateEvaluation,
};
