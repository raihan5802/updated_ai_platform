const pool = require('../config/db');

async function findUserByEmail(email) {
  const { rows } = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
  return rows[0];
}

async function createUser(name, email, passwordHash, role_id) {
  const { rows } = await pool.query(
    'INSERT INTO users (name, email, password_hash, role_id) VALUES ($1, $2, $3, $4) RETURNING id, name, email, role_id',
    [name, email, passwordHash, role_id]
  );
  return rows[0];
}

module.exports = {
  findUserByEmail,
  createUser
};
