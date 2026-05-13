const {
  getAssistantSessionMessages,
  getAssistantSessions,
  sendAssistantMessage,
} = require('../services/assistant.service');

async function sendAssistantMessageController(req, res, next) {
  try {
    const result = await sendAssistantMessage(req.authUser.id, req.body || {});

    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
}

async function getAssistantSessionsController(req, res, next) {
  try {
    const sessions = await getAssistantSessions(req.authUser.id);

    res.status(200).json({
      sessions,
    });
  } catch (error) {
    next(error);
  }
}

async function getAssistantSessionMessagesController(req, res, next) {
  try {
    const result = await getAssistantSessionMessages(req.authUser.id, req.params.sessionId);

    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getAssistantSessionMessagesController,
  getAssistantSessionsController,
  sendAssistantMessageController,
};
