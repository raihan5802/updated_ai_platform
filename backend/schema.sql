-- ============================================================
-- ENUM Types
-- These define allowed values for various status fields.
-- ============================================================

-- Request status can be 'Pending', 'Accepted', or 'Rejected'.
CREATE TYPE request_status_type AS ENUM('Pending', 'Accepted', 'Rejected');

-- Project status reflects the lifecycle of a project.
CREATE TYPE project_status_type AS ENUM(
    'PM_Assigned',
    'Annotation_Started',
    'Annotating',
    'Finished_Annotating',
    'Evaluating',
    'Handover_Ready',
    'Handover_Complete'
);

-- Annotation task status values.
CREATE TYPE task_status_type AS ENUM('Not_Started', 'In_Progress', 'Completed', 'Evaluated');

-- ============================================================
-- ROLES Table
-- Stores different system roles, such as Admin, Client, etc.
-- ============================================================
CREATE TABLE roles (
    id SERIAL PRIMARY KEY,
    role_name VARCHAR(50) UNIQUE NOT NULL
);

-- Insert initial roles
INSERT INTO roles (role_name) VALUES ('Admin'), ('Client'), ('ProjectManager'), ('Annotator');

-- ============================================================
-- USERS Table
-- Stores user accounts, linked to a role.
-- 'password_hash' should be a secure hash of the user's password.
-- ============================================================
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role_id INT NOT NULL REFERENCES roles(id),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- ============================================================
-- REQUESTS Table
-- A 'request' is created by a Client to initiate a project.
-- status: 'Pending', 'Accepted', or 'Rejected'.
-- Once accepted, it leads to a 'project'.
-- ============================================================
CREATE TABLE requests (
    id SERIAL PRIMARY KEY,
    client_id INT NOT NULL REFERENCES users(id),
    description TEXT,
    special_requirements TEXT,
    delivery_type VARCHAR(50) CHECK (delivery_type IN ('Regular','Express')),
    status request_status_type DEFAULT 'Pending' NOT NULL,
    reason_for_rejection TEXT,
    estimated_delivery_date DATE,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- ============================================================
-- PROJECTS Table
-- Created when a request is accepted by an Admin.
-- Managed by a Project Manager.
-- status: Tracks the annotation progress and lifecycle.
-- completion_percentage: Tracks how much annotation work is done.
-- ============================================================
CREATE TABLE projects (
    id SERIAL PRIMARY KEY,
    request_id INT UNIQUE NOT NULL REFERENCES requests(id),
    project_manager_id INT REFERENCES users(id),
    status project_status_type DEFAULT 'PM_Assigned' NOT NULL,
    completion_percentage NUMERIC(5,2) DEFAULT 0.00 NOT NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- ============================================================
-- DATA_ITEMS Table
-- Represents individual data files or units that need annotation.
-- Linked to requests. Each request can have multiple data items.
-- ============================================================
CREATE TABLE data_items (
    id SERIAL PRIMARY KEY,
    request_id INT NOT NULL REFERENCES requests(id),
    file_name VARCHAR(255),
    file_path TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

-- ============================================================
-- ANNOTATION_TASKS Table
-- Each project is split into tasks assigned to Annotators.
-- 'assigned_to' must reference a user with the Annotator role.
-- However, this role enforcement is not done at DB-level, only logically.
-- ============================================================
CREATE TABLE annotation_tasks (
    id SERIAL PRIMARY KEY,
    project_id INT NOT NULL REFERENCES projects(id),
    assigned_to INT NOT NULL REFERENCES users(id),
    task_description TEXT,
    deadline DATE,
    status task_status_type DEFAULT 'Not_Started' NOT NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- ============================================================
-- TASK_ITEMS Table
-- Links annotation tasks with the specific data_items they cover.
-- A single task could involve multiple data items, and each data item
-- could potentially be assigned to different tasks (if splitting by subsets).
-- ============================================================
CREATE TABLE task_items (
    id SERIAL PRIMARY KEY,
    annotation_task_id INT NOT NULL REFERENCES annotation_tasks(id),
    data_item_id INT NOT NULL REFERENCES data_items(id)
);

-- ============================================================
-- STATUS_HISTORY Table
-- Logs every status change for requests, projects, or tasks.
-- Useful for auditing and tracking workflow changes over time.
-- ============================================================
CREATE TABLE status_history (
    id SERIAL PRIMARY KEY,
    entity_type VARCHAR(50) NOT NULL,  -- e.g. 'request', 'project', 'task'
    entity_id INT NOT NULL,
    old_status VARCHAR(50),
    new_status VARCHAR(50),
    changed_by INT REFERENCES users(id),
    changed_at TIMESTAMP DEFAULT NOW()
);

-- ============================================================
-- INDEXES
-- For performance and quicker lookups.
-- ============================================================
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_requests_client_id ON requests(client_id);
CREATE INDEX idx_projects_request_id ON projects(request_id);
CREATE INDEX idx_annotation_tasks_project_id ON annotation_tasks(project_id);
CREATE INDEX idx_annotation_tasks_assigned_to ON annotation_tasks(assigned_to);
CREATE INDEX idx_task_items_annotation_task_id ON task_items(annotation_task_id);
CREATE INDEX idx_task_items_data_item_id ON task_items(data_item_id);
