const { pool } = require('../config/db');

const STUDY_ACTIVITY_TYPES = ['complete_lesson', 'submit_quiz', 'review_vocabulary'];

function createLessonSlug(level, lessonNumber) {
  return `${level.toLowerCase()}-l${lessonNumber}`;
}

async function getLessonProgressSummary(userId) {
  const query = `
    SELECT
      COUNT(*)::int AS "totalLessons",
      COUNT(*) FILTER (WHERE status = 'completed')::int AS "completedLessons",
      COALESCE(AVG(progress_percent), 0)::numeric(5,2) AS "averageProgress"
    FROM user_lesson_progress
    WHERE user_id = $1
  `;

  const { rows } = await pool.query(query, [userId]);
  return rows[0];
}

async function getCompletedLessonSlugs(userId) {
  const query = `
    SELECT lessons.slug
    FROM user_lesson_progress progress
    INNER JOIN lessons
      ON lessons.id = progress.lesson_id
    WHERE progress.user_id = $1
      AND progress.status = 'completed'
    ORDER BY lessons.jlpt_level ASC, lessons.slug ASC
  `;

  const { rows } = await pool.query(query, [userId]);
  return rows.map((row) => row.slug);
}

async function getVocabularyProgressSummary(userId) {
  const query = `
    SELECT
      COUNT(*)::int AS "trackedVocabulary",
      COUNT(*) FILTER (WHERE mastery_level >= 3)::int AS "masteredVocabulary"
    FROM user_vocab_progress
    WHERE user_id = $1
  `;

  const { rows } = await pool.query(query, [userId]);
  return rows[0];
}

async function getKanjiProgressSummary(userId) {
  const query = `
    SELECT
      COUNT(*)::int AS "trackedKanji",
      COUNT(*) FILTER (WHERE mastery_level >= 3)::int AS "masteredKanji"
    FROM user_kanji_progress
    WHERE user_id = $1
  `;

  const { rows } = await pool.query(query, [userId]);
  return rows[0];
}

async function createLearningLog(
  client,
  {
    userId,
    lessonId = null,
    vocabularyId = null,
    kanjiId = null,
    grammarPointId = null,
    activityType,
    details = {},
  },
) {
  const queryExecutor = client || pool;
  const query = `
    INSERT INTO learning_logs (
      user_id,
      lesson_id,
      vocabulary_id,
      kanji_id,
      grammar_point_id,
      activity_type,
      details,
      created_at
    )
    VALUES ($1, $2, $3, $4, $5, $6, $7::jsonb, NOW())
    RETURNING
      id,
      activity_type AS "activityType",
      created_at AS "createdAt"
  `;

  const { rows } = await queryExecutor.query(query, [
    userId,
    lessonId,
    vocabularyId,
    kanjiId,
    grammarPointId,
    activityType,
    JSON.stringify(details),
  ]);

  return rows[0] || null;
}

async function getLearningActivityDates(userId) {
  const query = `
    SELECT DISTINCT
      ((logs.created_at AT TIME ZONE users.timezone)::date)::text AS "activityDate"
    FROM learning_logs logs
    INNER JOIN users
      ON users.id = logs.user_id
    WHERE logs.user_id = $1
      AND logs.activity_type = ANY($2::text[])
    ORDER BY "activityDate" DESC
    LIMIT 370
  `;

  const { rows } = await pool.query(query, [userId, STUDY_ACTIVITY_TYPES]);
  return rows.map((row) => row.activityDate);
}

async function getUserLocalToday(userId) {
  const query = `
    SELECT ((NOW() AT TIME ZONE timezone)::date)::text AS "today"
    FROM users
    WHERE id = $1
    LIMIT 1
  `;

  const { rows } = await pool.query(query, [userId]);
  return rows[0]?.today || null;
}

async function getRecentLearningLogs(userId, limit) {
  const query = `
    SELECT
      logs.id,
      logs.activity_type AS "activityType",
      logs.details,
      logs.created_at AS "createdAt",
      lessons.title AS "lessonTitle",
      lessons.slug AS "lessonSlug",
      lessons.jlpt_level AS "lessonLevel"
    FROM learning_logs logs
    LEFT JOIN lessons
      ON lessons.id = logs.lesson_id
    WHERE logs.user_id = $1
      AND logs.activity_type = ANY($2::text[])
    ORDER BY logs.created_at DESC
    LIMIT $3
  `;

  const { rows } = await pool.query(query, [userId, STUDY_ACTIVITY_TYPES, limit]);
  return rows;
}

async function getWeeklyCompletedLessonCount(userId) {
  const query = `
    SELECT COUNT(DISTINCT progress.lesson_id)::int AS "completedThisWeek"
    FROM user_lesson_progress progress
    INNER JOIN users
      ON users.id = progress.user_id
    WHERE progress.user_id = $1
      AND progress.status = 'completed'
      AND progress.completed_at IS NOT NULL
      AND (progress.completed_at AT TIME ZONE users.timezone)::date >=
        DATE_TRUNC('week', NOW() AT TIME ZONE users.timezone)::date
  `;

  const { rows } = await pool.query(query, [userId]);
  return rows[0] || { completedThisWeek: 0 };
}

async function getLevelProgressRows(userId) {
  const query = `
    WITH levels(level, position) AS (
      VALUES
        ('N5', 1),
        ('N4', 2),
        ('N3', 3),
        ('N2', 4),
        ('N1', 5)
    )
    SELECT
      levels.level,
      COALESCE(COUNT(DISTINCT lessons.id), 0)::int AS "totalLessons",
      COALESCE(
        COUNT(DISTINCT lessons.id) FILTER (
          WHERE progress.status = 'completed'
        ),
        0
      )::int AS "completedLessons"
    FROM levels
    LEFT JOIN lessons
      ON lessons.jlpt_level = levels.level
      AND lessons.is_published = true
    LEFT JOIN user_lesson_progress progress
      ON progress.lesson_id = lessons.id
      AND progress.user_id = $1
    GROUP BY levels.level, levels.position
    ORDER BY levels.position ASC
  `;

  const { rows } = await pool.query(query, [userId]);
  return rows;
}

async function findOrCreateLesson(level, lessonNumber) {
  const slug = createLessonSlug(level, lessonNumber);
  const title = `Bai ${lessonNumber}`;
  const description = `Bai ${lessonNumber} cap do ${level.toUpperCase()}.`;

  const lessonQuery = `
    INSERT INTO lessons (
      title,
      slug,
      lesson_type,
      jlpt_level,
      description,
      is_published,
      created_at,
      updated_at
    )
    SELECT $1, $2, 'vocabulary', $3::varchar, $4, true, NOW(), NOW()
    WHERE EXISTS (
      SELECT 1
      FROM vocabulary
      WHERE lesson_number = $5
        AND LOWER(jlpt_level) = LOWER($3::text)
    )
    ON CONFLICT (slug) DO UPDATE SET
      jlpt_level = EXCLUDED.jlpt_level,
      description = COALESCE(lessons.description, EXCLUDED.description),
      is_published = true,
      updated_at = NOW()
    RETURNING id, slug
  `;

  const lessonResult = await pool.query(lessonQuery, [
    title,
    slug,
    level.toUpperCase(),
    description,
    lessonNumber,
  ]);

  return lessonResult.rows[0] || null;
}

async function ensureQuizProgressColumns() {
  const query = `
    ALTER TABLE user_lesson_progress
    ADD COLUMN IF NOT EXISTS quiz_score INTEGER,
    ADD COLUMN IF NOT EXISTS quiz_correct_count INTEGER NOT NULL DEFAULT 0,
    ADD COLUMN IF NOT EXISTS quiz_question_count INTEGER NOT NULL DEFAULT 0,
    ADD COLUMN IF NOT EXISTS quiz_completed_at TIMESTAMPTZ
  `;

  await pool.query(query);
}

async function saveVocabularyReviewResults(client, userId, reviewResults) {
  const resultsByVocabularyId = new Map();

  for (const result of reviewResults) {
    if (!Number.isInteger(result.vocabularyId) || result.vocabularyId <= 0) {
      continue;
    }

    const hasPreviousResult = resultsByVocabularyId.has(result.vocabularyId);
    const previousResult = resultsByVocabularyId.get(result.vocabularyId);
    resultsByVocabularyId.set(
      result.vocabularyId,
      hasPreviousResult ? previousResult && Boolean(result.isCorrect) : Boolean(result.isCorrect),
    );
  }

  const normalizedResults = [...resultsByVocabularyId.entries()].map(([vocabularyId, isCorrect]) => ({
    vocabularyId,
    isCorrect,
  }));

  if (normalizedResults.length === 0) {
    return {
      reviewedCount: 0,
      trackedCount: 0,
    };
  }

  let trackedCount = 0;

  for (const result of normalizedResults) {
    const reviewQuery = `
      INSERT INTO user_vocab_progress (
        user_id,
        vocabulary_id,
        mastery_level,
        last_reviewed_at,
        next_review_at,
        correct_count,
        wrong_count,
        ease_factor
      )
      VALUES (
        $1,
        $2,
        CASE WHEN $3::boolean THEN 1 ELSE 0 END,
        NOW(),
        CASE WHEN $3::boolean THEN NOW() + INTERVAL '1 day' ELSE NOW() + INTERVAL '30 minutes' END,
        CASE WHEN $3::boolean THEN 1 ELSE 0 END,
        CASE WHEN $3::boolean THEN 0 ELSE 1 END,
        2.50
      )
      ON CONFLICT (user_id, vocabulary_id) DO UPDATE SET
        mastery_level = CASE
          WHEN $3::boolean THEN LEAST(user_vocab_progress.mastery_level + 1, 5)
          ELSE GREATEST(user_vocab_progress.mastery_level - 1, 0)
        END,
        last_reviewed_at = NOW(),
        next_review_at = CASE
          WHEN $3::boolean THEN NOW() + (
            CASE LEAST(user_vocab_progress.mastery_level + 1, 5)
              WHEN 1 THEN INTERVAL '1 day'
              WHEN 2 THEN INTERVAL '3 days'
              WHEN 3 THEN INTERVAL '7 days'
              WHEN 4 THEN INTERVAL '14 days'
              ELSE INTERVAL '30 days'
            END
          )
          ELSE NOW() + INTERVAL '30 minutes'
        END,
        correct_count = user_vocab_progress.correct_count + CASE WHEN $3::boolean THEN 1 ELSE 0 END,
        wrong_count = user_vocab_progress.wrong_count + CASE WHEN $3::boolean THEN 0 ELSE 1 END,
        ease_factor = CASE
          WHEN $3::boolean THEN LEAST(user_vocab_progress.ease_factor + 0.10, 3.00)
          ELSE GREATEST(user_vocab_progress.ease_factor - 0.20, 1.30)
        END
      RETURNING id
    `;

    const { rows } = await client.query(reviewQuery, [
      userId,
      result.vocabularyId,
      result.isCorrect,
    ]);

    if (rows[0]) {
      trackedCount += 1;
    }
  }

  return {
    reviewedCount: normalizedResults.length,
    trackedCount,
  };
}

async function completeLessonProgress({ userId, level, lessonNumber }) {
  const lesson = await findOrCreateLesson(level, lessonNumber);

  if (!lesson) {
    return null;
  }

  const progressQuery = `
    INSERT INTO user_lesson_progress (
      user_id,
      lesson_id,
      status,
      progress_percent,
      started_at,
      completed_at,
      last_accessed_at
    )
    VALUES ($1, $2, 'completed', 100, NOW(), NOW(), NOW())
    ON CONFLICT (user_id, lesson_id) DO UPDATE SET
      status = 'completed',
      progress_percent = 100,
      started_at = COALESCE(user_lesson_progress.started_at, NOW()),
      completed_at = COALESCE(user_lesson_progress.completed_at, NOW()),
      last_accessed_at = NOW()
    RETURNING
      id,
      status,
      progress_percent AS "progressPercent",
      completed_at AS "completedAt"
  `;

  const { rows } = await pool.query(progressQuery, [userId, lesson.id]);
  const progress = rows[0];

  await createLearningLog(null, {
    userId,
    lessonId: lesson.id,
    activityType: 'complete_lesson',
    details: {
      lessonSlug: lesson.slug,
      progressId: progress.id,
    },
  });

  return {
    ...progress,
    lessonId: lesson.slug,
  };
}

async function saveLessonQuizProgress({
  userId,
  level,
  lessonNumber,
  score,
  correctCount,
  questionCount,
  vocabularyResults,
}) {
  await ensureQuizProgressColumns();

  const lesson = await findOrCreateLesson(level, lessonNumber);

  if (!lesson) {
    return null;
  }

  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    const progressQuery = `
      INSERT INTO user_lesson_progress (
        user_id,
        lesson_id,
        status,
        progress_percent,
        started_at,
        completed_at,
        last_accessed_at,
        quiz_score,
        quiz_correct_count,
        quiz_question_count,
        quiz_completed_at
      )
      VALUES ($1, $2, 'completed', 100, NOW(), NOW(), NOW(), $3, $4, $5, NOW())
      ON CONFLICT (user_id, lesson_id) DO UPDATE SET
        status = 'completed',
        progress_percent = 100,
        started_at = COALESCE(user_lesson_progress.started_at, NOW()),
        completed_at = COALESCE(user_lesson_progress.completed_at, NOW()),
        last_accessed_at = NOW(),
        quiz_score = GREATEST(COALESCE(user_lesson_progress.quiz_score, 0), EXCLUDED.quiz_score),
        quiz_correct_count = EXCLUDED.quiz_correct_count,
        quiz_question_count = EXCLUDED.quiz_question_count,
        quiz_completed_at = NOW()
      RETURNING
        id,
        status,
        progress_percent AS "progressPercent",
        completed_at AS "completedAt",
        quiz_score AS "quizScore",
        quiz_correct_count AS "quizCorrectCount",
        quiz_question_count AS "quizQuestionCount",
        quiz_completed_at AS "quizCompletedAt"
    `;

    const { rows } = await client.query(progressQuery, [
      userId,
      lesson.id,
      score,
      correctCount,
      questionCount,
    ]);
    const vocabularyProgress = await saveVocabularyReviewResults(
      client,
      userId,
      vocabularyResults,
    );
    await createLearningLog(client, {
      userId,
      lessonId: lesson.id,
      activityType: 'submit_quiz',
      details: {
        lessonSlug: lesson.slug,
        score,
        correctCount,
        questionCount,
        trackedVocabulary: vocabularyProgress.trackedCount,
      },
    });

    await client.query('COMMIT');

    return {
      ...rows[0],
      lessonId: lesson.slug,
      vocabularyProgress,
    };
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

module.exports = {
  completeLessonProgress,
  createLearningLog,
  getCompletedLessonSlugs,
  getLearningActivityDates,
  getLessonProgressSummary,
  getLevelProgressRows,
  getRecentLearningLogs,
  getUserLocalToday,
  getWeeklyCompletedLessonCount,
  getVocabularyProgressSummary,
  getKanjiProgressSummary,
  saveLessonQuizProgress,
  saveVocabularyReviewResults,
};
