const {
  createChatMessage,
  createChatSession,
  findChatMessages,
  findChatSessionById,
  listChatSessions,
} = require('../models/assistant.model');
const {
  createJapaneseTutorCompletion,
  sanitizeAssistantOutput,
} = require('./groq.service');
const { buildRagContext } = require('./rag.service');
const { createHttpError } = require('../utils/http-error');

const MAX_MESSAGE_LENGTH = 1200;
const RECENT_MESSAGE_LIMIT = 8;
const SESSION_LIMIT = 20;

function normalizeMessage(messageInput) {
  const message = typeof messageInput === 'string' ? messageInput.trim() : '';

  if (!message) {
    throw createHttpError(400, 'Vui long nhap cau hoi cho AI Assistant.');
  }

  if (message.length > MAX_MESSAGE_LENGTH) {
    throw createHttpError(400, 'Cau hoi qua dai. Vui long rut gon noi dung.');
  }

  return message;
}

function normalizeSessionId(sessionIdInput) {
  if (sessionIdInput === null || sessionIdInput === undefined || sessionIdInput === '') {
    return null;
  }

  const sessionId = Number(sessionIdInput);

  if (!Number.isInteger(sessionId) || sessionId <= 0) {
    throw createHttpError(400, 'Ma phien chat khong hop le.');
  }

  return sessionId;
}

function createSessionTitle(message) {
  return message.length > 56 ? `${message.slice(0, 56)}...` : message;
}

function mapMessage(row) {
  const content = row.sender === 'assistant'
    ? sanitizeAssistantOutput(row.messageText)
    : row.messageText;

  return {
    id: row.id,
    sender: row.sender,
    content,
    metadata: row.metadata || null,
    createdAt: row.createdAt,
  };
}

function buildSystemPrompt({ level, contextText }) {
  return [
    'Bạn là AI Assistant cho app học tiếng Nhật của người Việt.',
    `Trình độ mục tiêu hiện tại của người học: ${level}.`,
    'Nhiệm vụ: giải thích từ vựng, kanji, ngữ pháp, ví dụ và cách dùng tiếng Nhật rõ ràng, đúng cấp độ JLPT.',
    'Luôn trả lời bằng tiếng Việt dễ hiểu. Giữ tiếng Nhật nguyên bản, thêm kana/romaji khi hữu ích.',
    'Khi người học hỏi ngữ pháp, hãy nêu: nghĩa, cấu trúc, cách dùng, 2 ví dụ Nhật-Việt và lỗi thường gặp nếu có.',
    'Khi có dữ liệu nội bộ bên dưới, ưu tiên dùng dữ liệu đó. Nếu dữ liệu không đủ, nói rõ là đang giải thích theo kiến thức chung.',
    'Không bịa nội dung từ database nếu ngữ cảnh không có.',
    contextText ? `\nNGỮ CẢNH RAG TỪ DATABASE:\n${contextText}` : '\nNGỮ CẢNH RAG TỪ DATABASE: Không tìm thấy mục trùng khớp rõ ràng.',
  ].join('\n');
}

function buildGroqMessages({ history, userMessage, ragContext }) {
  const messages = [
    {
      role: 'system',
      content: buildSystemPrompt({
        level: ragContext.level,
        contextText: ragContext.contextText,
      }),
    },
    {
      role: 'system',
      content: [
        'Output policy:',
        '- Do not include hidden reasoning.',
        '- Do not use <think> tags.',
        '- Do not use Markdown headings, bold markers, tables, or horizontal rules.',
        '- Return only the final learner-facing answer in clean Vietnamese.',
      ].join('\n'),
    },
  ];

  for (const item of history) {
    if (item.sender !== 'user' && item.sender !== 'assistant') {
      continue;
    }

    messages.push({
      role: item.sender,
      content: item.sender === 'assistant'
        ? sanitizeAssistantOutput(item.messageText)
        : item.messageText,
    });
  }

  messages.push({
    role: 'user',
    content: userMessage,
  });

  return messages;
}

async function getOrCreateSession(userId, sessionId, message) {
  if (!sessionId) {
    return createChatSession({
      userId,
      title: createSessionTitle(message),
    });
  }

  const session = await findChatSessionById(userId, sessionId);

  if (!session) {
    throw createHttpError(404, 'Khong tim thay phien chat.');
  }

  return session;
}

async function sendAssistantMessage(userId, body) {
  const message = normalizeMessage(body.message);
  const sessionId = normalizeSessionId(body.sessionId);
  const session = await getOrCreateSession(userId, sessionId, message);
  const [history, ragContext] = await Promise.all([
    findChatMessages(userId, session.id, RECENT_MESSAGE_LIMIT),
    buildRagContext({
      message,
      selectedLevel: body.level,
    }),
  ]);
  const completion = await createJapaneseTutorCompletion(
    buildGroqMessages({
      history,
      userMessage: message,
      ragContext,
    }),
  );
  const assistantContent = completion.content || 'Xin lỗi, AI chưa tạo được câu trả lời phù hợp.';

  await createChatMessage({
    sessionId: session.id,
    sender: 'user',
    messageText: message,
    metadata: {
      level: ragContext.level,
      ragTerms: ragContext.terms,
    },
  });
  const assistantMessage = await createChatMessage({
    sessionId: session.id,
    sender: 'assistant',
    messageText: assistantContent,
    metadata: {
      model: completion.model,
      sources: ragContext.sources,
      usage: completion.usage,
    },
  });

  return {
    session,
    message: mapMessage(assistantMessage),
    model: completion.model,
    sources: ragContext.sources,
  };
}

async function getAssistantSessions(userId) {
  return listChatSessions(userId, SESSION_LIMIT);
}

async function getAssistantSessionMessages(userId, sessionIdInput) {
  const sessionId = normalizeSessionId(sessionIdInput);
  const session = await findChatSessionById(userId, sessionId);

  if (!session) {
    throw createHttpError(404, 'Khong tim thay phien chat.');
  }

  const messages = await findChatMessages(userId, session.id, 50);

  return {
    session,
    messages: messages.map(mapMessage),
  };
}

module.exports = {
  getAssistantSessionMessages,
  getAssistantSessions,
  sendAssistantMessage,
};
