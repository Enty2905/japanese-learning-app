CREATE EXTENSION IF NOT EXISTS citext;

CREATE TABLE IF NOT EXISTS users (
  id BIGSERIAL PRIMARY KEY,
  email CITEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  full_name VARCHAR(255) NOT NULL,
  display_name VARCHAR(255),
  avatar_url TEXT,
  role VARCHAR(20) NOT NULL DEFAULT 'student',
  status VARCHAR(20) NOT NULL DEFAULT 'active',
  current_level VARCHAR(10),
  timezone VARCHAR(100) NOT NULL DEFAULT 'Asia/Ho_Chi_Minh',
  last_login_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT users_role_check CHECK (role IN ('student', 'teacher', 'admin')),
  CONSTRAINT users_status_check CHECK (status IN ('active', 'inactive', 'banned')),
  CONSTRAINT users_current_level_check CHECK (
    current_level IS NULL OR current_level IN ('N5', 'N4', 'N3', 'N2', 'N1')
  )
);

CREATE TABLE IF NOT EXISTS vocabulary (
  id BIGSERIAL PRIMARY KEY,
  word VARCHAR(255) NOT NULL,
  kana VARCHAR(255),
  romaji VARCHAR(255),
  meaning_vi TEXT NOT NULL,
  meaning_en TEXT,
  word_type VARCHAR(50),
  jlpt_level VARCHAR(10),
  accent VARCHAR(50),
  audio_url TEXT,
  image_url TEXT,
  notes TEXT,
  tags TEXT[],
  lesson_number INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT vocabulary_jlpt_level_check CHECK (
    jlpt_level IS NULL OR jlpt_level IN ('N5', 'N4', 'N3', 'N2', 'N1')
  )
);

CREATE TABLE IF NOT EXISTS vocabulary_examples (
  id BIGSERIAL PRIMARY KEY,
  vocabulary_id BIGINT NOT NULL REFERENCES vocabulary(id) ON DELETE CASCADE,
  example_jp TEXT NOT NULL,
  example_kana TEXT,
  example_vi TEXT NOT NULL,
  audio_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS kanji (
  id BIGSERIAL PRIMARY KEY,
  kanji VARCHAR(10) NOT NULL UNIQUE,
  onyomi TEXT,
  kunyomi TEXT,
  meaning_vi TEXT NOT NULL,
  meaning_en TEXT,
  stroke_count INTEGER,
  radical VARCHAR(50),
  jlpt_level VARCHAR(10),
  unicode_code VARCHAR(20),
  writing_svg_url TEXT,
  han_viet VARCHAR(100),
  mnemonic TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT kanji_jlpt_level_check CHECK (
    jlpt_level IS NULL OR jlpt_level IN ('N5', 'N4', 'N3', 'N2', 'N1')
  ),
  CONSTRAINT kanji_stroke_count_check CHECK (stroke_count IS NULL OR stroke_count > 0)
);

CREATE TABLE IF NOT EXISTS kanji_examples (
  id BIGSERIAL PRIMARY KEY,
  kanji_id BIGINT NOT NULL REFERENCES kanji(id) ON DELETE CASCADE,
  example_jp TEXT NOT NULL,
  example_kana TEXT,
  example_vi TEXT NOT NULL,
  audio_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS grammar_points (
  id BIGSERIAL PRIMARY KEY,
  title VARCHAR(255),
  pattern VARCHAR(255) NOT NULL,
  meaning_vi TEXT NOT NULL,
  explanation TEXT,
  usage_note TEXT,
  restriction TEXT,
  nuance TEXT,
  formation TEXT,
  jlpt_level VARCHAR(10),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT grammar_points_jlpt_level_check CHECK (
    jlpt_level IS NULL OR jlpt_level IN ('N5', 'N4', 'N3', 'N2', 'N1')
  )
);

CREATE TABLE IF NOT EXISTS grammar_examples (
  id BIGSERIAL PRIMARY KEY,
  grammar_point_id BIGINT NOT NULL REFERENCES grammar_points(id) ON DELETE CASCADE,
  example_jp TEXT NOT NULL,
  example_kana TEXT,
  example_vi TEXT NOT NULL,
  audio_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS lessons (
  id BIGSERIAL PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  slug VARCHAR(255) NOT NULL UNIQUE,
  lesson_type VARCHAR(30) NOT NULL,
  jlpt_level VARCHAR(10),
  description TEXT,
  content TEXT,
  video_url TEXT,
  audio_url TEXT,
  thumbnail_url TEXT,
  duration_seconds INTEGER,
  is_published BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT lessons_jlpt_level_check CHECK (
    jlpt_level IS NULL OR jlpt_level IN ('N5', 'N4', 'N3', 'N2', 'N1')
  )
);

CREATE TABLE IF NOT EXISTS lesson_vocabularies (
  lesson_id BIGINT NOT NULL REFERENCES lessons(id) ON DELETE CASCADE,
  vocabulary_id BIGINT NOT NULL REFERENCES vocabulary(id) ON DELETE CASCADE,
  position INTEGER,
  is_main BOOLEAN NOT NULL DEFAULT true,
  PRIMARY KEY (lesson_id, vocabulary_id)
);

CREATE TABLE IF NOT EXISTS lesson_kanjis (
  lesson_id BIGINT NOT NULL REFERENCES lessons(id) ON DELETE CASCADE,
  kanji_id BIGINT NOT NULL REFERENCES kanji(id) ON DELETE CASCADE,
  position INTEGER,
  PRIMARY KEY (lesson_id, kanji_id)
);

CREATE TABLE IF NOT EXISTS lesson_grammar_points (
  lesson_id BIGINT NOT NULL REFERENCES lessons(id) ON DELETE CASCADE,
  grammar_point_id BIGINT NOT NULL REFERENCES grammar_points(id) ON DELETE CASCADE,
  position INTEGER,
  PRIMARY KEY (lesson_id, grammar_point_id)
);

CREATE TABLE IF NOT EXISTS user_lesson_progress (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  lesson_id BIGINT NOT NULL REFERENCES lessons(id) ON DELETE CASCADE,
  status VARCHAR(20) NOT NULL DEFAULT 'not_started',
  progress_percent NUMERIC NOT NULL DEFAULT 0,
  quiz_score INTEGER,
  quiz_correct_count INTEGER NOT NULL DEFAULT 0,
  quiz_question_count INTEGER NOT NULL DEFAULT 0,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  quiz_completed_at TIMESTAMPTZ,
  last_accessed_at TIMESTAMPTZ,
  UNIQUE (user_id, lesson_id),
  CONSTRAINT user_lesson_progress_status_check CHECK (
    status IN ('not_started', 'in_progress', 'completed')
  ),
  CONSTRAINT user_lesson_progress_percent_check CHECK (
    progress_percent >= 0 AND progress_percent <= 100
  )
);

CREATE TABLE IF NOT EXISTS user_vocab_progress (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  vocabulary_id BIGINT NOT NULL REFERENCES vocabulary(id) ON DELETE CASCADE,
  mastery_level INTEGER NOT NULL DEFAULT 0,
  last_reviewed_at TIMESTAMPTZ,
  next_review_at TIMESTAMPTZ,
  correct_count INTEGER NOT NULL DEFAULT 0,
  wrong_count INTEGER NOT NULL DEFAULT 0,
  ease_factor NUMERIC DEFAULT 2.50,
  UNIQUE (user_id, vocabulary_id)
);

CREATE TABLE IF NOT EXISTS user_kanji_progress (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  kanji_id BIGINT NOT NULL REFERENCES kanji(id) ON DELETE CASCADE,
  mastery_level INTEGER NOT NULL DEFAULT 0,
  last_reviewed_at TIMESTAMPTZ,
  next_review_at TIMESTAMPTZ,
  correct_count INTEGER NOT NULL DEFAULT 0,
  wrong_count INTEGER NOT NULL DEFAULT 0,
  ease_factor NUMERIC DEFAULT 2.50,
  UNIQUE (user_id, kanji_id)
);

CREATE TABLE IF NOT EXISTS learning_logs (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  lesson_id BIGINT REFERENCES lessons(id) ON DELETE SET NULL,
  vocabulary_id BIGINT REFERENCES vocabulary(id) ON DELETE SET NULL,
  kanji_id BIGINT REFERENCES kanji(id) ON DELETE SET NULL,
  grammar_point_id BIGINT REFERENCES grammar_points(id) ON DELETE SET NULL,
  activity_type VARCHAR(50) NOT NULL,
  details JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS dictionary_search_history (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  query_text VARCHAR(80) NOT NULL,
  search_type VARCHAR(20) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS user_flashcard_sets (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS user_flashcards (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  set_id BIGINT NOT NULL REFERENCES user_flashcard_sets(id) ON DELETE CASCADE,
  vocabulary_id BIGINT REFERENCES vocabulary(id) ON DELETE SET NULL,
  front_text VARCHAR(255) NOT NULL,
  back_text TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE user_lesson_progress
ADD COLUMN IF NOT EXISTS quiz_score INTEGER,
ADD COLUMN IF NOT EXISTS quiz_correct_count INTEGER NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS quiz_question_count INTEGER NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS quiz_completed_at TIMESTAMPTZ;

ALTER TABLE user_flashcards
ADD COLUMN IF NOT EXISTS vocabulary_id BIGINT REFERENCES vocabulary(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_vocabulary_jlpt_level ON vocabulary(jlpt_level);
CREATE INDEX IF NOT EXISTS idx_vocabulary_lesson_level ON vocabulary(lesson_number, jlpt_level);
CREATE INDEX IF NOT EXISTS idx_vocabulary_word ON vocabulary(word);
CREATE INDEX IF NOT EXISTS idx_kanji_jlpt_level ON kanji(jlpt_level);
CREATE INDEX IF NOT EXISTS idx_kanji_kanji ON kanji(kanji);
CREATE INDEX IF NOT EXISTS idx_grammar_points_jlpt_level ON grammar_points(jlpt_level);
CREATE INDEX IF NOT EXISTS idx_grammar_examples_grammar_point_id ON grammar_examples(grammar_point_id);
CREATE INDEX IF NOT EXISTS idx_lessons_slug ON lessons(slug);
CREATE INDEX IF NOT EXISTS idx_lessons_jlpt_level ON lessons(jlpt_level);
CREATE INDEX IF NOT EXISTS idx_lesson_vocabularies_lesson_id ON lesson_vocabularies(lesson_id);
CREATE INDEX IF NOT EXISTS idx_lesson_kanjis_lesson_id ON lesson_kanjis(lesson_id);
CREATE INDEX IF NOT EXISTS idx_lesson_grammar_points_lesson_id ON lesson_grammar_points(lesson_id);
CREATE INDEX IF NOT EXISTS idx_learning_logs_user_id ON learning_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_learning_logs_activity_type ON learning_logs(activity_type);
CREATE INDEX IF NOT EXISTS idx_learning_logs_user_created_at ON learning_logs(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_user_lesson_progress_user_lesson ON user_lesson_progress(user_id, lesson_id);
CREATE INDEX IF NOT EXISTS idx_user_vocab_progress_user_vocab ON user_vocab_progress(user_id, vocabulary_id);
CREATE INDEX IF NOT EXISTS idx_user_kanji_progress_user_kanji ON user_kanji_progress(user_id, kanji_id);
CREATE INDEX IF NOT EXISTS idx_user_flashcards_vocabulary_id ON user_flashcards(vocabulary_id);
