const { pool } = require('../config/db');

async function findUserByEmail(email) {
  const query = `
    SELECT
      id,
      email,
      password_hash AS "passwordHash",
      full_name AS "fullName",
      display_name AS "displayName",
      role,
      status,
      timezone
    FROM users
    WHERE LOWER(email) = LOWER($1)
    LIMIT 1
  `;

  const { rows } = await pool.query(query, [email]);
  return rows[0] || null;
}

async function createUser({ email, passwordHash, fullName }) {
  const query = `
    INSERT INTO users (
      email,
      password_hash,
      full_name,
      display_name,
      role,
      status,
      timezone,
      created_at,
      updated_at
    )
    VALUES ($1, $2, $3, $4, 'student', 'active', 'Asia/Ho_Chi_Minh', NOW(), NOW())
    RETURNING
      id,
      email,
      full_name AS "fullName",
      display_name AS "displayName",
      role,
      status,
      timezone
  `;

  const values = [email, passwordHash, fullName, fullName];
  const { rows } = await pool.query(query, values);

  return rows[0];
}

async function findUserById(userId) {
  const query = `
    SELECT
      id,
      email,
      full_name AS "fullName",
      display_name AS "displayName",
      role,
      status,
      timezone,
      current_level AS "currentLevel",
      avatar_url AS "avatarUrl",
      last_login_at AS "lastLoginAt"
    FROM users
    WHERE id = $1
    LIMIT 1
  `;

  const { rows } = await pool.query(query, [userId]);
  return rows[0] || null;
}

module.exports = {
  findUserByEmail,
  createUser,
  findUserById,
};
