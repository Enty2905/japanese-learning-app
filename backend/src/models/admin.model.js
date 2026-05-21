const { pool } = require('../config/db');

function mapUserRow(row) {
  return {
    id: row.id,
    email: row.email,
    fullName: row.fullName,
    displayName: row.displayName,
    role: row.role,
    status: row.status,
    currentLevel: row.currentLevel,
    lastLoginAt: row.lastLoginAt,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

function mapVocabularyRow(row) {
  return {
    id: row.id,
    lessonNumber: row.lessonNumber,
    word: row.word,
    kana: row.kana,
    romaji: row.romaji,
    meaningVi: row.meaningVi,
    meaningEn: row.meaningEn,
    wordType: row.wordType,
    jlptLevel: row.jlptLevel,
    accent: row.accent,
    audioUrl: row.audioUrl,
    imageUrl: row.imageUrl,
    notes: row.notes,
    tags: row.tags || [],
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

function mapKanjiRow(row) {
  return {
    id: row.id,
    kanji: row.kanji,
    onyomi: row.onyomi,
    kunyomi: row.kunyomi,
    meaningVi: row.meaningVi,
    meaningEn: row.meaningEn,
    strokeCount: row.strokeCount,
    radical: row.radical,
    jlptLevel: row.jlptLevel,
    unicodeCode: row.unicodeCode,
    writingSvgUrl: row.writingSvgUrl,
    hanViet: row.hanViet,
    mnemonic: row.mnemonic,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

function mapGrammarRow(row) {
  return {
    id: row.id,
    lessonNumber: row.lessonNumber,
    position: row.position,
    title: row.title,
    pattern: row.pattern,
    meaningVi: row.meaningVi,
    formation: row.formation,
    explanation: row.explanation,
    usageNote: row.usageNote,
    restriction: row.restriction,
    nuance: row.nuance,
    jlptLevel: row.jlptLevel,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

const CONTENT_CONFIG = {
  vocabulary: {
    table: 'vocabulary',
    mapper: mapVocabularyRow,
    searchColumns: ['word', 'kana', 'romaji', 'meaning_vi', 'meaning_en', 'word_type'],
    select: `
      id,
      lesson_number AS "lessonNumber",
      word,
      kana,
      romaji,
      meaning_vi AS "meaningVi",
      meaning_en AS "meaningEn",
      word_type AS "wordType",
      jlpt_level AS "jlptLevel",
      accent,
      audio_url AS "audioUrl",
      image_url AS "imageUrl",
      notes,
      tags,
      created_at AS "createdAt",
      updated_at AS "updatedAt"
    `,
  },
  kanji: {
    table: 'kanji',
    mapper: mapKanjiRow,
    searchColumns: ['kanji', 'onyomi', 'kunyomi', 'meaning_vi', 'meaning_en', 'radical', 'han_viet'],
    select: `
      id,
      kanji,
      onyomi,
      kunyomi,
      meaning_vi AS "meaningVi",
      meaning_en AS "meaningEn",
      stroke_count AS "strokeCount",
      radical,
      jlpt_level AS "jlptLevel",
      unicode_code AS "unicodeCode",
      writing_svg_url AS "writingSvgUrl",
      han_viet AS "hanViet",
      mnemonic,
      created_at AS "createdAt",
      updated_at AS "updatedAt"
    `,
  },
  grammar: {
    table: 'grammar_points',
    mapper: mapGrammarRow,
    searchColumns: ['title', 'pattern', 'meaning_vi', 'formation', 'explanation', 'usage_note'],
    select: `
      grammar_points.id,
      (
        SELECT COALESCE((SUBSTRING(lessons.slug FROM '-l([0-9]+)$'))::int, NULL)
        FROM lesson_grammar_points
        INNER JOIN lessons
          ON lessons.id = lesson_grammar_points.lesson_id
        WHERE lesson_grammar_points.grammar_point_id = grammar_points.id
        ORDER BY lesson_grammar_points.position ASC NULLS LAST, lessons.id ASC
        LIMIT 1
      ) AS "lessonNumber",
      (
        SELECT lesson_grammar_points.position
        FROM lesson_grammar_points
        INNER JOIN lessons
          ON lessons.id = lesson_grammar_points.lesson_id
        WHERE lesson_grammar_points.grammar_point_id = grammar_points.id
        ORDER BY lesson_grammar_points.position ASC NULLS LAST, lessons.id ASC
        LIMIT 1
      ) AS position,
      grammar_points.title,
      grammar_points.pattern,
      grammar_points.meaning_vi AS "meaningVi",
      grammar_points.formation,
      grammar_points.explanation,
      grammar_points.usage_note AS "usageNote",
      grammar_points.restriction,
      grammar_points.nuance,
      grammar_points.jlpt_level AS "jlptLevel",
      grammar_points.created_at AS "createdAt",
      grammar_points.updated_at AS "updatedAt"
    `,
  },
};

const CONTENT_FIELD_COLUMNS = {
  vocabulary: {
    lessonNumber: 'lesson_number',
    word: 'word',
    kana: 'kana',
    romaji: 'romaji',
    meaningVi: 'meaning_vi',
    meaningEn: 'meaning_en',
    wordType: 'word_type',
    jlptLevel: 'jlpt_level',
    accent: 'accent',
    audioUrl: 'audio_url',
    imageUrl: 'image_url',
    notes: 'notes',
    tags: 'tags',
  },
  kanji: {
    kanji: 'kanji',
    onyomi: 'onyomi',
    kunyomi: 'kunyomi',
    meaningVi: 'meaning_vi',
    meaningEn: 'meaning_en',
    strokeCount: 'stroke_count',
    radical: 'radical',
    jlptLevel: 'jlpt_level',
    unicodeCode: 'unicode_code',
    writingSvgUrl: 'writing_svg_url',
    hanViet: 'han_viet',
    mnemonic: 'mnemonic',
  },
  grammar: {
    title: 'title',
    pattern: 'pattern',
    meaningVi: 'meaning_vi',
    formation: 'formation',
    explanation: 'explanation',
    usageNote: 'usage_note',
    restriction: 'restriction',
    nuance: 'nuance',
    jlptLevel: 'jlpt_level',
  },
};

function createLessonSlug(jlptLevel, lessonNumber) {
  return `${jlptLevel.toLowerCase()}-l${lessonNumber}`;
}

function buildContentFilters(config, { search, jlptLevel }) {
  const clauses = [];
  const values = [];

  if (search) {
    values.push(`%${search}%`);
    clauses.push(`(${config.searchColumns
      .map((column) => `${column} ILIKE $${values.length}`)
      .join(' OR ')})`);
  }

  if (jlptLevel) {
    values.push(jlptLevel);
    clauses.push(`jlpt_level = $${values.length}`);
  }

  return {
    whereClause: clauses.length > 0 ? `WHERE ${clauses.join(' AND ')}` : '',
    values,
  };
}

async function getAdminSummary() {
  const query = `
    SELECT
      (SELECT COUNT(*) FROM users)::int AS "totalUsers",
      (SELECT COUNT(*) FROM users WHERE status = 'active')::int AS "activeUsers",
      (SELECT COUNT(*) FROM lessons)::int AS "totalLessons",
      (SELECT COUNT(*) FROM lessons WHERE is_published = true)::int AS "publishedLessons",
      (SELECT COUNT(*) FROM vocabulary)::int AS "totalVocabulary",
      (SELECT COUNT(*) FROM kanji)::int AS "totalKanji",
      (SELECT COUNT(*) FROM grammar_points)::int AS "totalGrammar",
      (SELECT COUNT(*) FROM user_flashcard_sets)::int AS "totalFlashcardSets",
      (SELECT COUNT(*) FROM learning_logs)::int AS "totalLearningLogs"
  `;

  const { rows } = await pool.query(query);
  return rows[0];
}

async function getUserRoleCounts() {
  const query = `
    SELECT role, COUNT(*)::int AS count
    FROM users
    GROUP BY role
    ORDER BY role ASC
  `;

  const { rows } = await pool.query(query);
  return rows;
}

async function getUserStatusCounts() {
  const query = `
    SELECT status, COUNT(*)::int AS count
    FROM users
    GROUP BY status
    ORDER BY status ASC
  `;

  const { rows } = await pool.query(query);
  return rows;
}

async function getRecentUsers(limit) {
  const query = `
    SELECT
      id,
      email,
      full_name AS "fullName",
      display_name AS "displayName",
      role,
      status,
      current_level AS "currentLevel",
      last_login_at AS "lastLoginAt",
      created_at AS "createdAt",
      updated_at AS "updatedAt"
    FROM users
    ORDER BY created_at DESC
    LIMIT $1
  `;

  const { rows } = await pool.query(query, [limit]);
  return rows.map(mapUserRow);
}

function buildUserFilters({ search, role, status }) {
  const clauses = [];
  const values = [];

  if (search) {
    values.push(`%${search}%`);
    clauses.push(`(
      email ILIKE $${values.length}
      OR full_name ILIKE $${values.length}
      OR display_name ILIKE $${values.length}
    )`);
  }

  if (role) {
    values.push(role);
    clauses.push(`role = $${values.length}`);
  }

  if (status) {
    values.push(status);
    clauses.push(`status = $${values.length}`);
  }

  return {
    whereClause: clauses.length > 0 ? `WHERE ${clauses.join(' AND ')}` : '',
    values,
  };
}

async function countAdminUsers(filters) {
  const { whereClause, values } = buildUserFilters(filters);
  const query = `
    SELECT COUNT(*)::int AS total
    FROM users
    ${whereClause}
  `;

  const { rows } = await pool.query(query, values);
  return rows[0]?.total || 0;
}

async function findAdminUsers({ search, role, status, limit, offset }) {
  const { whereClause, values } = buildUserFilters({ search, role, status });
  const queryValues = [...values, limit, offset];
  const query = `
    SELECT
      id,
      email,
      full_name AS "fullName",
      display_name AS "displayName",
      role,
      status,
      current_level AS "currentLevel",
      last_login_at AS "lastLoginAt",
      created_at AS "createdAt",
      updated_at AS "updatedAt"
    FROM users
    ${whereClause}
    ORDER BY created_at DESC, id DESC
    LIMIT $${queryValues.length - 1}
    OFFSET $${queryValues.length}
  `;

  const { rows } = await pool.query(query, queryValues);
  return rows.map(mapUserRow);
}

async function updateAdminUser(userId, fields) {
  const updates = [];
  const values = [];

  if (fields.role) {
    values.push(fields.role);
    updates.push(`role = $${values.length}`);
  }

  if (fields.status) {
    values.push(fields.status);
    updates.push(`status = $${values.length}`);
  }

  values.push(userId);

  const query = `
    UPDATE users
    SET
      ${updates.join(',\n      ')},
      updated_at = NOW()
    WHERE id = $${values.length}
    RETURNING
      id,
      email,
      full_name AS "fullName",
      display_name AS "displayName",
      role,
      status,
      current_level AS "currentLevel",
      last_login_at AS "lastLoginAt",
      created_at AS "createdAt",
      updated_at AS "updatedAt"
  `;

  const { rows } = await pool.query(query, values);
  return rows[0] ? mapUserRow(rows[0]) : null;
}

function getContentConfig(contentType) {
  return CONTENT_CONFIG[contentType];
}

async function queryAdminContentItemById(queryable, contentType, itemId) {
  const config = getContentConfig(contentType);
  const query = `
    SELECT
      ${config.select}
    FROM ${config.table}
    WHERE ${config.table}.id = $1
    LIMIT 1
  `;

  const { rows } = await queryable.query(query, [itemId]);
  return rows[0] ? config.mapper(rows[0]) : null;
}

async function countAdminContentItems(contentType, filters) {
  const config = getContentConfig(contentType);
  const { whereClause, values } = buildContentFilters(config, filters);
  const query = `
    SELECT COUNT(*)::int AS total
    FROM ${config.table}
    ${whereClause}
  `;

  const { rows } = await pool.query(query, values);
  return rows[0]?.total || 0;
}

async function findAdminContentItems({ contentType, search, jlptLevel, limit, offset }) {
  const config = getContentConfig(contentType);
  const { whereClause, values } = buildContentFilters(config, { search, jlptLevel });
  const queryValues = [...values, limit, offset];
  const query = `
    SELECT
      ${config.select}
    FROM ${config.table}
    ${whereClause}
    ORDER BY updated_at DESC, id DESC
    LIMIT $${queryValues.length - 1}
    OFFSET $${queryValues.length}
  `;

  const { rows } = await pool.query(query, queryValues);
  return rows.map(config.mapper);
}

async function createAdminVocabulary(fields) {
  const query = `
    INSERT INTO vocabulary (
      lesson_number,
      word,
      kana,
      romaji,
      meaning_vi,
      meaning_en,
      word_type,
      jlpt_level,
      accent,
      audio_url,
      image_url,
      notes,
      tags,
      created_at,
      updated_at
    )
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, NOW(), NOW())
    RETURNING
      ${CONTENT_CONFIG.vocabulary.select}
  `;
  const values = [
    fields.lessonNumber,
    fields.word,
    fields.kana,
    fields.romaji,
    fields.meaningVi,
    fields.meaningEn,
    fields.wordType,
    fields.jlptLevel,
    fields.accent,
    fields.audioUrl,
    fields.imageUrl,
    fields.notes,
    fields.tags,
  ];
  const { rows } = await pool.query(query, values);
  return mapVocabularyRow(rows[0]);
}

async function createAdminKanji(fields) {
  const query = `
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
      writing_svg_url,
      han_viet,
      mnemonic,
      created_at,
      updated_at
    )
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, NOW(), NOW())
    RETURNING
      ${CONTENT_CONFIG.kanji.select}
  `;
  const values = [
    fields.kanji,
    fields.onyomi,
    fields.kunyomi,
    fields.meaningVi,
    fields.meaningEn,
    fields.strokeCount,
    fields.radical,
    fields.jlptLevel,
    fields.unicodeCode,
    fields.writingSvgUrl,
    fields.hanViet,
    fields.mnemonic,
  ];
  const { rows } = await pool.query(query, values);
  return mapKanjiRow(rows[0]);
}

async function createAdminGrammar(fields) {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    const query = `
      INSERT INTO grammar_points (
        title,
        pattern,
        meaning_vi,
        formation,
        explanation,
        usage_note,
        restriction,
        nuance,
        jlpt_level,
        created_at,
        updated_at
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW(), NOW())
      RETURNING id
    `;
    const values = [
      fields.title,
      fields.pattern,
      fields.meaningVi,
      fields.formation,
      fields.explanation,
      fields.usageNote,
      fields.restriction,
      fields.nuance,
      fields.jlptLevel,
    ];
    const { rows } = await client.query(query, values);
    const grammarPointId = rows[0].id;

    await syncGrammarLessonLink(client, grammarPointId, fields);
    const grammarPoint = await queryAdminContentItemById(client, 'grammar', grammarPointId);

    await client.query('COMMIT');
    return grammarPoint;
  } catch (error) {
    await client.query('ROLLBACK').catch(() => {});
    throw error;
  } finally {
    client.release();
  }
}

async function ensureLessonForGrammar(client, jlptLevel, lessonNumber) {
  const slug = createLessonSlug(jlptLevel, lessonNumber);
  const query = `
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
    VALUES ($1, $2, 'mixed', $3, $4, $5, 900, true, NOW(), NOW())
    ON CONFLICT (slug) DO UPDATE SET
      jlpt_level = EXCLUDED.jlpt_level,
      is_published = true,
      updated_at = NOW()
    RETURNING id
  `;
  const values = [
    `Bài ${lessonNumber}`,
    slug,
    jlptLevel,
    `Bài ${lessonNumber} cấp độ ${jlptLevel}.`,
    `# Bài ${lessonNumber}`,
  ];
  const { rows } = await client.query(query, values);
  return rows[0];
}

async function getNextGrammarPosition(client, lessonId) {
  const query = `
    SELECT COALESCE(MAX(position), 0)::int + 1 AS position
    FROM lesson_grammar_points
    WHERE lesson_id = $1
  `;

  const { rows } = await client.query(query, [lessonId]);
  return rows[0]?.position || 1;
}

async function syncGrammarLessonLink(client, grammarPointId, fields) {
  await client.query(
    'DELETE FROM lesson_grammar_points WHERE grammar_point_id = $1',
    [grammarPointId],
  );

  if (!fields.lessonNumber) {
    return;
  }

  const lesson = await ensureLessonForGrammar(client, fields.jlptLevel, fields.lessonNumber);
  const position = fields.position || await getNextGrammarPosition(client, lesson.id);

  await client.query(
    `
      INSERT INTO lesson_grammar_points (
        lesson_id,
        grammar_point_id,
        position
      )
      VALUES ($1, $2, $3)
      ON CONFLICT (lesson_id, grammar_point_id) DO UPDATE SET
        position = EXCLUDED.position
    `,
    [lesson.id, grammarPointId, position],
  );
}

async function createAdminContentItem(contentType, fields) {
  if (contentType === 'vocabulary') {
    return createAdminVocabulary(fields);
  }

  if (contentType === 'kanji') {
    return createAdminKanji(fields);
  }

  return createAdminGrammar(fields);
}

async function updateAdminContentItem(contentType, itemId, fields) {
  if (contentType === 'grammar') {
    return updateAdminGrammar(itemId, fields);
  }

  const config = getContentConfig(contentType);
  const fieldColumns = CONTENT_FIELD_COLUMNS[contentType];
  const updates = [];
  const values = [];

  for (const [fieldName, value] of Object.entries(fields)) {
    const columnName = fieldColumns[fieldName];

    if (!columnName) {
      continue;
    }

    values.push(value);
    updates.push(`${columnName} = $${values.length}`);
  }

  values.push(itemId);
  const query = `
    UPDATE ${config.table}
    SET
      ${updates.join(',\n      ')},
      updated_at = NOW()
    WHERE id = $${values.length}
    RETURNING
      ${config.select}
  `;

  const { rows } = await pool.query(query, values);
  return rows[0] ? config.mapper(rows[0]) : null;
}

async function updateAdminGrammar(itemId, fields) {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    const currentResult = await client.query(
      'SELECT id, jlpt_level AS "jlptLevel" FROM grammar_points WHERE id = $1 LIMIT 1',
      [itemId],
    );

    if (!currentResult.rows[0]) {
      await client.query('ROLLBACK');
      return null;
    }

    const fieldColumns = CONTENT_FIELD_COLUMNS.grammar;
    const updates = [];
    const values = [];

    for (const [fieldName, value] of Object.entries(fields)) {
      const columnName = fieldColumns[fieldName];

      if (!columnName) {
        continue;
      }

      values.push(value);
      updates.push(`${columnName} = $${values.length}`);
    }

    if (updates.length > 0) {
      values.push(itemId);
      await client.query(
        `
          UPDATE grammar_points
          SET
            ${updates.join(',\n            ')},
            updated_at = NOW()
          WHERE id = $${values.length}
        `,
        values,
      );
    }

    if (Object.prototype.hasOwnProperty.call(fields, 'lessonNumber')) {
      await syncGrammarLessonLink(client, itemId, {
        jlptLevel: fields.jlptLevel || currentResult.rows[0].jlptLevel,
        lessonNumber: fields.lessonNumber,
        position: fields.position,
      });
    }

    const grammarPoint = await queryAdminContentItemById(client, 'grammar', itemId);

    await client.query('COMMIT');
    return grammarPoint;
  } catch (error) {
    await client.query('ROLLBACK').catch(() => {});
    throw error;
  } finally {
    client.release();
  }
}

async function deleteAdminContentItem(contentType, itemId) {
  const config = getContentConfig(contentType);
  const query = `
    DELETE FROM ${config.table}
    WHERE id = $1
    RETURNING id
  `;

  const { rows } = await pool.query(query, [itemId]);
  return rows[0] || null;
}

module.exports = {
  countAdminContentItems,
  countAdminUsers,
  createAdminContentItem,
  deleteAdminContentItem,
  findAdminUsers,
  findAdminContentItems,
  getAdminSummary,
  getRecentUsers,
  getUserRoleCounts,
  getUserStatusCounts,
  updateAdminContentItem,
  updateAdminUser,
};
