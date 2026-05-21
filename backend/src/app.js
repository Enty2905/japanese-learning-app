const cors = require('cors');
const express = require('express');
const { pool } = require('./config/db');
const { authenticateToken, requireAdmin } = require('./middleware/auth.middleware');
const { errorHandler, notFoundHandler } = require('./middleware/error-handler');
const { adminRouter } = require('./routes/admin.routes');
const { assistantRouter } = require('./routes/assistant.routes');
const { authRouter } = require('./routes/auth.routes');
const { bookmarkRouter } = require('./routes/bookmark.routes');
const { dictionaryRouter } = require('./routes/dictionary.routes');
const { flashcardRouter } = require('./routes/flashcard.routes');
const { handwritingRouter } = require('./routes/handwriting.routes');
const { lessonRouter } = require('./routes/lesson.routes');
const { profileRouter } = require('./routes/profile.routes');
const { progressRouter } = require('./routes/progress.routes');

const app = express();

app.use(
  cors({
    origin: true,
  }),
);
app.use(express.json({ limit: '6mb' }));

app.get('/api/health', async (req, res, next) => {
  try {
    await pool.query('SELECT 1');

    res.status(200).json({
      status: 'ok',
    });
  } catch (error) {
    next(error);
  }
});

app.use('/api/auth', authRouter);
app.use('/api/admin', authenticateToken, requireAdmin, adminRouter);
app.use('/api/assistant', authenticateToken, assistantRouter);
app.use('/api/dictionary', dictionaryRouter);
app.use('/api/lessons', lessonRouter);
app.use('/api/profile', authenticateToken, profileRouter);
app.use('/api/progress', authenticateToken, progressRouter);
app.use('/api/bookmarks', authenticateToken, bookmarkRouter);
app.use('/api/flashcards', authenticateToken, flashcardRouter);
app.use('/api/handwriting', authenticateToken, handwritingRouter);

app.use(notFoundHandler);
app.use(errorHandler);

module.exports = {
  app,
};
