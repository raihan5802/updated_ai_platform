// backend/controllers/requestsController.js
const pool = require('../config/db');

async function getAllRequests(req, res) {
  try {
    // If Admin, show all requests
    if (req.user.role_id === 1) {
      const { rows } = await pool.query(`
        SELECT r.*, u.name as client_name
        FROM requests r
        JOIN users u ON r.client_id = u.id
        ORDER BY r.created_at DESC
      `);
      return res.json({ requests: rows });
    }

    // Otherwise (Client), show only that user's requests
    else {
      const { rows } = await pool.query(`
        SELECT r.*, u.name as client_name
        FROM requests r
        JOIN users u ON r.client_id = u.id
        WHERE r.client_id = $1
        ORDER BY r.created_at DESC
      `, [req.user.id]);
      return res.json({ requests: rows });
    }
  } catch (error) {
    console.error('[getAllRequests] error:', error);
    return res.status(500).json({ error: 'Failed to fetch requests' });
  }
}

module.exports = {
  getAllRequests
};
