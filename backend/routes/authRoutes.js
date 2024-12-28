// backend/routes/authRoutes.js
const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');
const pool = require('../config/db');

const { signup, signin, dashboard } = require('../controllers/authController');
const { getAllRequests } = require('../controllers/requestsController');
const { getAllProjects, getProjectById } = require('../controllers/projectsController');
const { verifyToken } = require('../middleware/authMiddleware');
const { upload, moveUploadedFilesPreserveStructure } = require('../middleware/uploadMiddleware');

/** Admin-check helper */
function verifyAdmin(req, res, next) {
  if (req.user.role_id !== 1) {
    return res.status(403).json({ error: 'Only Admin can access this route.' });
  }
  next();
}

// -------------------- Basic Auth --------------------
router.post('/signup', signup);
router.post('/signin', signin);
router.get('/dashboard', verifyToken, dashboard);

// -------------------- Requests & Projects --------------------
router.get('/requests', verifyToken, getAllRequests);
router.get('/projects', verifyToken, getAllProjects);

// ---------- Create Request with Folder Upload ----------
router.post('/requests-with-upload', verifyToken, upload.array('files'), async (req, res) => {
  try {
    const userId = req.user.id;
    const { description, delivery_type, special_instructions, annotation_type } = req.body;

    // 1) Insert a new request row, default status: 'Pending'
    const insertResult = await pool.query(`
      INSERT INTO requests (client_id, description, delivery_type, status, special_requirements, annotation_type)
      VALUES ($1, $2, $3, 'Pending', $4, $5)
      RETURNING id
    `, [userId, description, delivery_type, special_instructions, annotation_type]);
    const newRequestId = insertResult.rows[0].id;

    // 2) Count files & total size
    const fileCount = req.files.length;
    const totalSize = req.files.reduce((acc, file) => acc + file.size, 0);

    // 3) Build file-type map
    const fileTypeMap = {};
    req.files.forEach((file) => {
      const ext = path.extname(file.originalname).toLowerCase().replace('.', '');
      fileTypeMap[ext] = (fileTypeMap[ext] || 0) + 1;
    });

    // 4) Update requests with file_count, total_size, file_type_counts
    await pool.query(`
      UPDATE requests
      SET file_count = $1,
          total_size = $2,
          file_type_counts = $3
      WHERE id = $4
    `, [fileCount, totalSize, fileTypeMap, newRequestId]);

    // 5) Move the uploaded files (preserving structure)
    let { paths } = req.body;
    if (!paths) {
      paths = [];
    } else if (!Array.isArray(paths)) {
      paths = [paths];
    }
    moveUploadedFilesPreserveStructure(newRequestId, req.files, paths);

    return res.json({
      message: 'Annotation request created successfully.',
      requestId: newRequestId,
      fileCount,
      totalSize
    });
  } catch (error) {
    console.error('[requests-with-upload] error:', error);
    return res.status(500).json({ error: 'Failed to create request and upload data' });
  }
});

// ---------- Admin Accept/Reject Routes ----------
router.patch('/admin/requests/:requestId/accept', verifyToken, verifyAdmin, async (req, res) => {
  try {
    const { requestId } = req.params;
    const { estimated_delivery_date, project_manager_id } = req.body;

    // Mark request as Accepted
    await pool.query(`
      UPDATE requests
      SET status = 'Accepted',
          estimated_delivery_date = $1,
          reason_for_rejection = NULL
      WHERE id = $2
    `, [estimated_delivery_date, requestId]);

    // Check if project already exists
    const existing = await pool.query(`SELECT id FROM projects WHERE request_id = $1`, [requestId]);
    let projectId;
    if (existing.rows.length === 0) {
      // Create new project
      const projInsert = await pool.query(`
        INSERT INTO projects (request_id, status)
        VALUES ($1, 'Annotation_Started')
        RETURNING id
      `, [requestId]);
      projectId = projInsert.rows[0].id;
    } else {
      projectId = existing.rows[0].id;
    }

    // Assign PM if provided
    if (project_manager_id) {
      await pool.query(`
        UPDATE projects
        SET project_manager_id = $1
        WHERE id = $2
      `, [project_manager_id, projectId]);
    }

    return res.json({ message: 'Request accepted successfully.', projectId });
  } catch (error) {
    console.error('[admin accept request error]', error);
    return res.status(500).json({ error: 'Failed to accept request' });
  }
});

router.patch('/admin/requests/:requestId/reject', verifyToken, verifyAdmin, async (req, res) => {
  try {
    const { requestId } = req.params;
    const { reason_for_rejection } = req.body;

    await pool.query(`
      UPDATE requests
      SET status = 'Rejected',
          reason_for_rejection = $1,
          estimated_delivery_date = NULL
      WHERE id = $2
    `, [reason_for_rejection, requestId]);

    return res.json({ message: 'Request rejected successfully.' });
  } catch (error) {
    console.error('[admin reject request error]', error);
    return res.status(500).json({ error: 'Failed to reject request' });
  }
});

// ---------- Single Project -----------
router.get('/projects/:projectId', verifyToken, getProjectById);

// ---------- File Tree (Hide "Tasks" folder) ----------
function readDirRecursively(dir, basePath) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  return entries
    .filter((entry) => entry.name !== 'Tasks') // <--- Hide the Tasks folder
    .map((entry) => {
      const fullPath = path.join(dir, entry.name);
      const relativePath = path.join(basePath, entry.name);
      if (entry.isDirectory()) {
        return {
          name: entry.name,
          type: 'directory',
          path: relativePath,
          children: readDirRecursively(fullPath, relativePath),
        };
      } else {
        return {
          name: entry.name,
          type: 'file',
          path: relativePath,
        };
      }
    });
}

router.get('/projects/:projectId/files-tree', verifyToken, async (req, res) => {
  try {
    const { projectId } = req.params;
    const projResult = await pool.query(`
      SELECT request_id
      FROM projects
      WHERE id = $1
      LIMIT 1
    `, [projectId]);

    if (projResult.rows.length === 0) {
      return res.status(404).json({ tree: [] });
    }

    const requestId = projResult.rows[0].request_id;
    const requestPath = path.join(__dirname, '..', '..', 'ClientDataUpload', String(requestId));
    if (!fs.existsSync(requestPath)) {
      return res.json({ tree: [] });
    }

    const tree = readDirRecursively(requestPath, '');
    return res.json({ tree });
  } catch (error) {
    console.error('[files-tree error]', error);
    return res.status(500).json({ error: 'Failed to read file tree.' });
  }
});

/**
 * GET /projects/:projectId/assigned-items
 * Return an array of all file paths that have been assigned to ANY task for this project
 */
router.get('/projects/:projectId/assigned-items', verifyToken, async (req, res) => {
  try {
    const { projectId } = req.params;
    const query = `
      SELECT ti.file_path
        FROM task_items ti
        JOIN annotation_tasks t ON ti.annotation_task_id = t.id
       WHERE t.project_id = $1
    `;
    const { rows } = await pool.query(query, [projectId]);
    const assignedPaths = rows.map((r) => r.file_path);
    return res.json({ assignedPaths });
  } catch (error) {
    console.error('[GET assigned-items error]', error);
    return res.status(500).json({ error: 'Failed to fetch assigned items.' });
  }
});

// ========== POST /projects/:projectId/tasks (Create new task) ==========
router.post('/projects/:projectId/tasks', verifyToken, async (req, res) => {
  const { projectId } = req.params;
  const { assigned_to, deadline, instructions } = req.body;

  try {
    // Check if project exists
    const projCheck = await pool.query('SELECT id FROM projects WHERE id = $1', [projectId]);
    if (projCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Project not found' });
    }

    // Insert a new row in annotation_tasks
    const insertTask = await pool.query(`
      INSERT INTO annotation_tasks (project_id, assigned_to, deadline, instructions, status)
      VALUES ($1, $2, $3, $4, 'Not_Started')
      RETURNING id
    `, [
      projectId,
      assigned_to || null,
      deadline || null,
      instructions || null
    ]);

    const newTaskId = insertTask.rows[0].id;

    // (Optional) If you want to also create a folder in ClientDataUpload/<requestId>/Tasks/<taskId> here, do so
    // But the key is the route returns success if the project exists.
    return res.json({ message: 'Task created', taskId: newTaskId });
  } catch (error) {
    console.error('[POST /projects/:projectId/tasks error]', error);
    return res.status(500).json({ error: 'Failed to create task' });
  }
});

// ========== GET /projects/:projectId/tasks (List tasks) ==========
router.get('/projects/:projectId/tasks', verifyToken, async (req, res) => {
  try {
    const { projectId } = req.params;
    // ensure project exists
    const projCheck = await pool.query('SELECT id FROM projects WHERE id=$1', [projectId]);
    if (projCheck.rows.length === 0) {
      return res.status(404).json({ tasks: [] });
    }

    // fetch tasks
    const tasksRes = await pool.query(`
      SELECT
        t.*,
        u.name AS annotator_name,
        u.email AS annotator_email
      FROM annotation_tasks t
      LEFT JOIN users u ON t.assigned_to = u.id
      WHERE t.project_id = $1
      ORDER BY t.id ASC
    `, [projectId]);

    return res.json({ tasks: tasksRes.rows });
  } catch (error) {
    console.error('[GET /projects/:projectId/tasks error]', error);
    return res.status(500).json({ error: 'Failed to fetch tasks.' });
  }
});

// ========== GET /projects/:projectId/tasks/:taskId (One task) ==========
router.get('/projects/:projectId/tasks/:taskId', verifyToken, async (req, res) => {
  try {
    const { projectId, taskId } = req.params;
    const taskResult = await pool.query(`
      SELECT t.*,
             u.name AS annotator_name
        FROM annotation_tasks t
        LEFT JOIN users u ON t.assigned_to = u.id
       WHERE t.id = $1 AND t.project_id = $2
       LIMIT 1
    `, [taskId, projectId]);

    if (taskResult.rows.length === 0) {
      return res.status(404).json({ error: 'Task not found for this project.' });
    }
    const task = taskResult.rows[0];

    // optional: get assigned items from task_items
    const itemsResult = await pool.query(`
      SELECT file_path
        FROM task_items
       WHERE annotation_task_id = $1
    `, [taskId]);
    const assignedPaths = itemsResult.rows.map(r => r.file_path);

    return res.json({ task, assignedPaths });
  } catch (error) {
    console.error('[GET task error]', error);
    return res.status(500).json({ error: 'Failed to retrieve task info.' });
  }
});

// ========== POST /projects/:projectId/tasks/:taskId/files (Assign files) ==========
router.post('/projects/:projectId/tasks/:taskId/files', verifyToken, async (req, res) => {
  try {
    const { projectId, taskId } = req.params;
    const { selectedPaths } = req.body;

    // check project
    const projRes = await pool.query('SELECT request_id FROM projects WHERE id=$1', [projectId]);
    if (projRes.rows.length === 0) {
      return res.status(404).json({ error: 'Project not found' });
    }
    const requestId = projRes.rows[0].request_id;

    // base dir => "ClientDataUpload/<requestId>"
    const projectDir = path.join(__dirname, '..', '..', 'ClientDataUpload', String(requestId));
    // tasks/<taskId>
    const taskDir = path.join(projectDir, 'Tasks', String(taskId));

    // copy each file/folder
    function copyItem(relPath) {
      const sourcePath = path.join(projectDir, relPath);
      const targetPath = path.join(taskDir, relPath);

      const stats = fs.statSync(sourcePath);
      if (stats.isDirectory()) {
        if (!fs.existsSync(targetPath)) {
          fs.mkdirSync(targetPath, { recursive: true });
        }
        const contents = fs.readdirSync(sourcePath);
        contents.forEach(item => {
          copyItem(path.join(relPath, item));
        });
      } else {
        // single file
        const parentDir = path.dirname(targetPath);
        if (!fs.existsSync(parentDir)) {
          fs.mkdirSync(parentDir, { recursive: true });
        }
        fs.copyFileSync(sourcePath, targetPath);
      }
    }

    for (const relPath of selectedPaths) {
      copyItem(relPath);
      // record in DB
      await pool.query(`
        INSERT INTO task_items (annotation_task_id, file_path)
        VALUES ($1, $2)
      `, [taskId, relPath]);
    }

    return res.json({ message: 'Files assigned to task successfully.' });
  } catch (error) {
    console.error('[POST task/files error]', error);
    return res.status(500).json({ error: 'Failed to assign files to task.' });
  }
});

/**
 * GET /auth/users?role_id=4 => returns all annotators
 */
router.get('/users', verifyToken, async (req, res) => {
  try {
    const { role_id } = req.query;
    let query = 'SELECT id, name, email, role_id FROM users';
    let params = [];
    if (role_id) {
      query += ' WHERE role_id = $1';
      params = [role_id];
    }
    const { rows } = await pool.query(query, params);
    return res.json({ users: rows });
  } catch (error) {
    console.error('[GET /users error]', error);
    return res.status(500).json({ error: 'Failed to fetch users.' });
  }
});

// GET /annotator/tasks
router.get('/annotator/tasks', verifyToken, async (req, res) => {
  try {
    // OPTIONAL: enforce role check if you want:
    // if (req.user.role_id !== 4) {
    //   return res.status(403).json({ error: 'Only Annotators can access this route.' });
    // }

    const userId = req.user.id;
    const query = `
      SELECT
        t.*,
        p.id AS project_id,
        p.status AS project_status,
        u.name AS assigned_to_name
      FROM annotation_tasks t
      JOIN projects p ON t.project_id = p.id
      LEFT JOIN users u ON t.assigned_to = u.id
      WHERE t.assigned_to = $1
      ORDER BY t.id ASC
    `;
    const { rows } = await pool.query(query, [userId]);

    return res.json({ tasks: rows });
  } catch (error) {
    console.error('[GET /annotator/tasks error]', error);
    return res.status(500).json({ error: 'Failed to fetch annotator tasks.' });
  }
});

module.exports = router;
