/**
 * createAdmin.js
 *
 * This script creates an Admin user in the "users" table.
 * Usage:
 *   node createAdmin.js "AdminName" "admin@example.com" "superSecretPassword"
 */

const { Pool } = require('pg');
const bcrypt = require('bcryptjs');

// Adjust these credentials as needed or load from .env
const pool = new Pool({
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'test_db1',
  password: process.env.DB_PASSWORD || 'raihanDB1',
  port: process.env.DB_PORT || 5432
});

(async function createAdmin() {
  try {
    // Grab args from CLI
    const name = process.argv[2];
    const email = process.argv[3];
    const plainPassword = process.argv[4];

    if (!name || !email || !plainPassword) {
      console.error('Usage: node createAdmin.js "<name>" "<email>" "<password>"');
      process.exit(1);
    }

    console.log('Creating admin with:', { name, email });

    // Hash the password
    const passwordHash = await bcrypt.hash(plainPassword, 10);

    // role_id=1 is assumed to be 'Admin' based on your initial "roles" insert
    const roleId = 4;

    // Insert the admin user
    const queryText = `
      INSERT INTO users (name, email, password_hash, role_id)
      VALUES ($1, $2, $3, $4)
      RETURNING id, name, email, role_id
    `;
    const values = [name, email, passwordHash, roleId];

    const { rows } = await pool.query(queryText, values);
    const newAdmin = rows[0];

    console.log('Admin created successfully:', newAdmin);

  } catch (error) {
    console.error('Error creating admin:', error);
  } finally {
    pool.end();
  }
})();
