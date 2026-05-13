const fs = require('node:fs');
const path = require('node:path');
const { Client } = require('pg');
require('dotenv').config();

const SEED_LESSONS = [
  {
    level: 'N5',
    number: 1,
    title: 'Bài 1: Chào hỏi cơ bản',
    description: 'Làm quen với những cách chào hỏi và tự giới thiệu đầu tiên.',
    vocabulary: [
      ['私', 'わたし', 'watashi', 'tôi', 'I', 'pronoun'],
      ['名前', 'なまえ', 'namae', 'tên', 'name', 'noun'],
      ['学生', 'がくせい', 'gakusei', 'học sinh', 'student', 'noun'],
      ['先生', 'せんせい', 'sensei', 'giáo viên', 'teacher', 'noun'],
      ['こんにちは', 'こんにちは', 'konnichiwa', 'xin chào', 'hello', 'expression'],
    ],
  },
  {
    level: 'N5',
    number: 2,
    title: 'Bài 2: Số đếm cơ bản',
    description: 'Học các số thường gặp và cách hỏi số lượng đơn giản.',
    vocabulary: [
      ['一', 'いち', 'ichi', 'một', 'one', 'number'],
      ['二', 'に', 'ni', 'hai', 'two', 'number'],
      ['三', 'さん', 'san', 'ba', 'three', 'number'],
      ['十', 'じゅう', 'juu', 'mười', 'ten', 'number'],
      ['何', 'なん', 'nan', 'gì, bao nhiêu', 'what', 'question word'],
    ],
  },
  {
    level: 'N4',
    number: 1,
    title: 'Bài 1: Thể te',
    description: 'Dùng thể te để nối hành động và đưa ra yêu cầu.',
    vocabulary: [
      ['食べて', 'たべて', 'tabete', 'hãy ăn', 'eat', 'verb'],
      ['見て', 'みて', 'mite', 'hãy xem', 'look', 'verb'],
      ['読んで', 'よんで', 'yonde', 'hãy đọc', 'read', 'verb'],
      ['書いて', 'かいて', 'kaite', 'hãy viết', 'write', 'verb'],
      ['ください', 'ください', 'kudasai', 'làm ơn', 'please', 'expression'],
    ],
  },
  {
    level: 'N3',
    number: 1,
    title: 'Bài 1: Câu điều kiện',
    description: 'So sánh các mẫu điều kiện thông dụng qua ví dụ ngắn.',
    vocabulary: [
      ['雨', 'あめ', 'ame', 'mưa', 'rain', 'noun'],
      ['場合', 'ばあい', 'baai', 'trường hợp', 'case', 'noun'],
      ['もし', 'もし', 'moshi', 'nếu như', 'if', 'adverb'],
      ['できる', 'できる', 'dekiru', 'có thể làm', 'can do', 'verb'],
      ['必要', 'ひつよう', 'hitsuyou', 'cần thiết', 'necessary', 'na-adjective'],
    ],
  },
  {
    level: 'N2',
    number: 1,
    title: 'Bài 1: Từ nối trang trọng',
    description: 'Luyện các từ nối thường dùng trong văn viết và báo cáo.',
    vocabulary: [
      ['従って', 'したがって', 'shitagatte', 'do đó', 'therefore', 'conjunction'],
      ['一方', 'いっぽう', 'ippou', 'mặt khác', 'on the other hand', 'noun'],
      ['結果', 'けっか', 'kekka', 'kết quả', 'result', 'noun'],
      ['事実', 'じじつ', 'jijitsu', 'sự thật', 'fact', 'noun'],
      ['検討', 'けんとう', 'kentou', 'xem xét', 'consideration', 'noun'],
    ],
  },
  {
    level: 'N1',
    number: 1,
    title: 'Bài 1: Lập luận nâng cao',
    description: 'Xây dựng mạch lập luận rõ ràng trong ngữ cảnh học thuật.',
    vocabulary: [
      ['論理', 'ろんり', 'ronri', 'logic', 'logic', 'noun'],
      ['視点', 'してん', 'shiten', 'góc nhìn', 'viewpoint', 'noun'],
      ['指摘', 'してき', 'shiteki', 'chỉ ra', 'pointing out', 'noun'],
      ['提言', 'ていげん', 'teigen', 'đề xuất', 'proposal', 'noun'],
      ['根拠', 'こんきょ', 'konkyo', 'căn cứ', 'basis', 'noun'],
    ],
  },
];

const SEED_KANJI = [
  ['日', 'ニチ、ジツ', 'ひ、か', 'ngày, mặt trời', 'day, sun', 4, '日', 'N5', 'NHẬT', 'Mặt trời mọc mỗi ngày.'],
  ['本', 'ホン', 'もと', 'sách, gốc', 'book, origin', 5, '木', 'N5', 'BẢN', 'Cây thêm một nét ở gốc thành bản.'],
  ['学', 'ガク', 'まなぶ', 'học', 'study', 8, '子', 'N5', 'HỌC', 'Đứa trẻ dưới mái nhà đang học.'],
  ['語', 'ゴ', 'かたる', 'ngôn ngữ', 'language', 14, '言', 'N5', 'NGỮ', 'Lời nói tạo thành ngôn ngữ.'],
  ['論', 'ロン', null, 'luận', 'argument', 15, '言', 'N1', 'LUẬN', 'Nhiều lời nói được sắp xếp thành lập luận.'],
];

async function queryOne(client, query, values) {
  const { rows } = await client.query(query, values);
  return rows[0] || null;
}

function createLessonSlug(level, lessonNumber) {
  return `${level.toLowerCase()}-l${lessonNumber}`;
}

function createLessonContent(lesson) {
  const sampleWords = lesson.vocabulary
    .slice(0, 5)
    .map(([word, kana, romaji, meaningVi]) => `- ${word} (${kana}, ${romaji}): ${meaningVi}`)
    .join('\n');

  return `# ${lesson.title}\n${lesson.description}\n\n## Từ vựng\n${sampleWords}`;
}

async function seedLesson(client, lesson) {
  const slug = createLessonSlug(lesson.level, lesson.number);
  const dbLesson = await queryOne(
    client,
    `
      INSERT INTO lessons (
        title,
        slug,
        lesson_type,
        jlpt_level,
        description,
        content,
        duration_seconds,
        is_published,
        created_at,
        updated_at
      )
      VALUES ($1, $2, 'vocabulary', $3, $4, $5, 900, true, NOW(), NOW())
      ON CONFLICT (slug) DO UPDATE SET
        title = EXCLUDED.title,
        jlpt_level = EXCLUDED.jlpt_level,
        description = EXCLUDED.description,
        content = EXCLUDED.content,
        is_published = true,
        updated_at = NOW()
      RETURNING id
    `,
    [
      lesson.title,
      slug,
      lesson.level,
      lesson.description,
      createLessonContent(lesson),
    ],
  );

  for (const [word, kana, romaji, meaningVi, meaningEn, wordType] of lesson.vocabulary) {
    const existingVocabulary = await queryOne(
      client,
      `
        SELECT id
        FROM vocabulary
        WHERE word = $1
          AND COALESCE(kana, '') = COALESCE($2, '')
          AND jlpt_level = $3
          AND lesson_number = $4
        LIMIT 1
      `,
      [word, kana, lesson.level, lesson.number],
    );

    if (existingVocabulary) {
      await client.query(
        `
          UPDATE vocabulary
          SET
            romaji = $1,
            meaning_vi = $2,
            meaning_en = $3,
            word_type = $4,
            updated_at = NOW()
          WHERE id = $5
        `,
        [romaji, meaningVi, meaningEn, wordType, existingVocabulary.id],
      );
    } else {
      await client.query(
        `
          INSERT INTO vocabulary (
            word,
            kana,
            romaji,
            meaning_vi,
            meaning_en,
            word_type,
            jlpt_level,
            lesson_number,
            created_at,
            updated_at
          )
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW(), NOW())
        `,
        [word, kana, romaji, meaningVi, meaningEn, wordType, lesson.level, lesson.number],
      );
    }
  }

  return dbLesson;
}

async function seedKanji(client) {
  for (const [
    kanji,
    onyomi,
    kunyomi,
    meaningVi,
    meaningEn,
    strokeCount,
    radical,
    jlptLevel,
    hanViet,
    mnemonic,
  ] of SEED_KANJI) {
    await client.query(
      `
        INSERT INTO kanji (
          kanji,
          onyomi,
          kunyomi,
          meaning_vi,
          meaning_en,
          stroke_count,
          radical,
          jlpt_level,
          unicode_code,
          han_viet,
          mnemonic,
          created_at,
          updated_at
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, NOW(), NOW())
        ON CONFLICT (kanji) DO UPDATE SET
          onyomi = EXCLUDED.onyomi,
          kunyomi = EXCLUDED.kunyomi,
          meaning_vi = EXCLUDED.meaning_vi,
          meaning_en = EXCLUDED.meaning_en,
          stroke_count = EXCLUDED.stroke_count,
          radical = EXCLUDED.radical,
          jlpt_level = EXCLUDED.jlpt_level,
          unicode_code = EXCLUDED.unicode_code,
          han_viet = EXCLUDED.han_viet,
          mnemonic = EXCLUDED.mnemonic,
          updated_at = NOW()
      `,
      [
        kanji,
        onyomi,
        kunyomi,
        meaningVi,
        meaningEn,
        strokeCount,
        radical,
        jlptLevel,
        `U+${kanji.codePointAt(0).toString(16).toUpperCase()}`,
        hanViet,
        mnemonic,
      ],
    );
  }
}

async function seedLessonsFromVocabulary(client) {
  await client.query(
    `
      INSERT INTO lessons (
        title,
        slug,
        lesson_type,
        jlpt_level,
        description,
        content,
        duration_seconds,
        is_published,
        created_at,
        updated_at
      )
      SELECT
        'Bài ' || lesson_number,
        LOWER(jlpt_level) || '-l' || lesson_number,
        'mixed',
        jlpt_level,
        'Bài ' || lesson_number || ' cấp độ ' || jlpt_level || '.',
        '# Bài ' || lesson_number,
        900,
        true,
        NOW(),
        NOW()
      FROM (
        SELECT DISTINCT jlpt_level, lesson_number
        FROM vocabulary
        WHERE lesson_number IS NOT NULL
          AND jlpt_level IS NOT NULL
      ) vocabulary_lessons
      ON CONFLICT (slug) DO UPDATE SET
        jlpt_level = EXCLUDED.jlpt_level,
        is_published = true,
        updated_at = NOW()
    `,
  );
}

async function seedLessonVocabularyLinks(client) {
  await client.query(
    `
      INSERT INTO lesson_vocabularies (
        lesson_id,
        vocabulary_id,
        position,
        is_main
      )
      SELECT
        lessons.id,
        ranked_vocabulary.id,
        ranked_vocabulary.position,
        true
      FROM (
        SELECT
          vocabulary.id,
          vocabulary.jlpt_level,
          vocabulary.lesson_number,
          ROW_NUMBER() OVER (
            PARTITION BY vocabulary.jlpt_level, vocabulary.lesson_number
            ORDER BY vocabulary.id
          ) AS position
        FROM vocabulary
        WHERE vocabulary.lesson_number IS NOT NULL
          AND vocabulary.jlpt_level IS NOT NULL
      ) ranked_vocabulary
      INNER JOIN lessons
        ON lessons.slug = LOWER(ranked_vocabulary.jlpt_level) || '-l' || ranked_vocabulary.lesson_number
      ON CONFLICT (lesson_id, vocabulary_id) DO UPDATE SET
        position = EXCLUDED.position,
        is_main = true
    `,
  );
}

async function seedLessonGrammarLinks(client) {
  await client.query(
    `
      WITH lesson_counts AS (
        SELECT
          jlpt_level,
          COUNT(*)::int AS lesson_count
        FROM lessons
        WHERE jlpt_level IS NOT NULL
        GROUP BY jlpt_level
      ),
      ranked_lessons AS (
        SELECT
          lessons.id,
          lessons.jlpt_level,
          ROW_NUMBER() OVER (
            PARTITION BY lessons.jlpt_level
            ORDER BY COALESCE((SUBSTRING(lessons.slug FROM '-l([0-9]+)$'))::int, lessons.id::int), lessons.id
          ) AS lesson_rank
        FROM lessons
        INNER JOIN lesson_counts
          ON lesson_counts.jlpt_level = lessons.jlpt_level
      ),
      ranked_grammar AS (
        SELECT
          grammar_points.id,
          grammar_points.jlpt_level,
          ROW_NUMBER() OVER (
            PARTITION BY grammar_points.jlpt_level
            ORDER BY grammar_points.id
          ) AS grammar_rank,
          COUNT(*) OVER (
            PARTITION BY grammar_points.jlpt_level
          ) AS grammar_count
        FROM grammar_points
        WHERE grammar_points.jlpt_level IS NOT NULL
      ),
      assigned_grammar AS (
        SELECT
          ranked_grammar.id AS grammar_point_id,
          ranked_grammar.jlpt_level,
          FLOOR(
            ((ranked_grammar.grammar_rank - 1) * lesson_counts.lesson_count)::numeric
            / ranked_grammar.grammar_count
          )::int + 1 AS lesson_rank,
          ranked_grammar.grammar_rank AS position
        FROM ranked_grammar
        INNER JOIN lesson_counts
          ON lesson_counts.jlpt_level = ranked_grammar.jlpt_level
      )
      INSERT INTO lesson_grammar_points (
        lesson_id,
        grammar_point_id,
        position
      )
      SELECT
        ranked_lessons.id,
        assigned_grammar.grammar_point_id,
        assigned_grammar.position
      FROM assigned_grammar
      INNER JOIN ranked_lessons
        ON ranked_lessons.jlpt_level = assigned_grammar.jlpt_level
        AND ranked_lessons.lesson_rank = assigned_grammar.lesson_rank
      ON CONFLICT (lesson_id, grammar_point_id) DO UPDATE SET
        position = EXCLUDED.position
    `,
  );
}

async function main() {
  const requiredEnvVars = ['DB_HOST', 'DB_PORT', 'DB_NAME', 'DB_USER', 'DB_PASSWORD'];
  const missingEnvVars = requiredEnvVars.filter((key) => !process.env[key]);

  if (missingEnvVars.length > 0) {
    throw new Error(`Missing env vars: ${missingEnvVars.join(', ')}`);
  }

  const client = new Client({
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT),
    database: process.env.DB_NAME,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
  });

  await client.connect();

  try {
    const schemaPath = path.join(__dirname, 'schema.sql');
    const schemaSql = fs.readFileSync(schemaPath, 'utf8');

    await client.query('BEGIN');
    await client.query(schemaSql);

    for (const lesson of SEED_LESSONS) {
      await seedLesson(client, lesson);
    }

    await seedKanji(client);
    await seedLessonsFromVocabulary(client);
    await seedLessonVocabularyLinks(client);
    await seedLessonGrammarLinks(client);
    await client.query('COMMIT');

    console.log('[DB SETUP] Schema and seed data are ready.');
  } catch (error) {
    await client.query('ROLLBACK').catch(() => {});
    throw error;
  } finally {
    await client.end().catch(() => {});
  }
}

main().catch((error) => {
  console.error('[DB SETUP] Failed:', error.message);
  process.exitCode = 1;
});
