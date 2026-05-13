const { Groq } = require('groq-sdk');
const { createHttpError } = require('../utils/http-error');

const DEFAULT_GROQ_MODEL = 'llama-3.3-70b-versatile';
const MAX_COMPLETION_TOKENS = 900;

let groqClient = null;

function getGroqClient() {
  if (!process.env.GROQ_API_KEY) {
    throw createHttpError(503, 'Chua cau hinh GROQ_API_KEY cho AI Assistant.');
  }

  if (!groqClient) {
    groqClient = new Groq({
      apiKey: process.env.GROQ_API_KEY,
    });
  }

  return groqClient;
}

function getGroqModel() {
  return process.env.GROQ_MODEL || DEFAULT_GROQ_MODEL;
}

function sanitizeAssistantOutput(content) {
  return String(content || '')
    .replace(/<think>[\s\S]*?<\/think>/gi, '')
    .replace(/<\/?think>/gi, '')
    .replace(/^#{1,6}\s+/gm, '')
    .replace(/\*\*([^*]+)\*\*/g, '$1')
    .replace(/^\s*---+\s*$/gm, '')
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

async function createJapaneseTutorCompletion(messages) {
  const completion = await getGroqClient().chat.completions.create({
    model: getGroqModel(),
    messages,
    temperature: 0.35,
    max_completion_tokens: MAX_COMPLETION_TOKENS,
  });

  return {
    model: completion.model || getGroqModel(),
    content: sanitizeAssistantOutput(completion.choices?.[0]?.message?.content),
    usage: completion.usage || null,
  };
}

module.exports = {
  createJapaneseTutorCompletion,
  getGroqModel,
  sanitizeAssistantOutput,
};
