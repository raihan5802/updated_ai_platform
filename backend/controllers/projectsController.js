// controllers/projectsController.js

const pool = require('../config/db');

/**
 * Fetch all projects, optionally showing the project manager's name.
 */
async function getAllProjects(req, res) {
  try {
    const { rows } = await pool.query(`
      SELECT
        p.*,
        pm.name AS project_manager_name
      FROM projects p
      LEFT JOIN users pm ON p.project_manager_id = pm.id
      ORDER BY p.created_at DESC
    `);
    return res.json({ projects: rows });
  } catch (error) {
    console.error('[getAllProjects] error:', error);
    return res.status(500).json({ error: 'Failed to fetch projects' });
  }
}

/**
 * Get a single project by projectId.
 * Joins the 'requests' table to get request details (description, annotation_type, etc.),
 * plus the client user info (name, email).
 */
async function getProjectById(req, res) {
  const { projectId } = req.params;
  try {
    const projectQuery = `
      SELECT 
        p.*,
        r.description AS request_description,
        r.special_requirements,
        r.status AS request_status,
        r.annotation_type,
        r.delivery_type,
        r.reason_for_rejection,
        r.estimated_delivery_date,
        r.file_type_counts,
        u.name AS client_name,
        u.email AS client_email
      FROM projects p
      JOIN requests r ON p.request_id = r.id
      JOIN users u ON r.client_id = u.id
      WHERE p.id = $1
      LIMIT 1
    `;
    const { rows } = await pool.query(projectQuery, [projectId]);
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Project not found' });
    }
    // Return the project data as { project: {...} }
    return res.json({ project: rows[0] });
  } catch (error) {
    console.error('[getProjectById] error:', error);
    return res.status(500).json({ error: 'Failed to fetch project details' });
  }
}

module.exports = {
  getAllProjects,
  getProjectById, // Export the new function so it can be used in your routes
};
