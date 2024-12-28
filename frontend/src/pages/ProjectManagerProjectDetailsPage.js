import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import API from '../services/api';
import FileTree from '../components/FileTree';
import '../styles/ProjectManagerProjectDetails.css';

function ProjectManagerProjectDetailsPage() {
    const { projectId } = useParams();
    const navigate = useNavigate();

    const [project, setProject] = useState(null);
    const [fileTree, setFileTree] = useState([]);
    const [assignedPaths, setAssignedPaths] = useState(new Set());
    const [error, setError] = useState('');
    const [tasks, setTasks] = useState([]);

    useEffect(() => {
        fetchProjectDetails();
        // eslint-disable-next-line
    }, [projectId]);

    async function fetchProjectDetails() {
        try {
            const res = await API.get(`/auth/projects/${projectId}`);
            setProject(res.data.project);

            // fetch tasks
            const taskRes = await API.get(`/auth/projects/${projectId}/tasks`);
            setTasks(taskRes.data.tasks || []);
        } catch (err) {
            console.error('[Project Details] error:', err);
            setError('Failed to load project details.');
        }
    }

    useEffect(() => {
        if (project) {
            fetchFileTreeByProjectId(project.id);
            fetchAssignedItems(project.id);
        }
    }, [project]);

    async function fetchFileTreeByProjectId(pid) {
        try {
            const res = await API.get(`/auth/projects/${pid}/files-tree`);
            setFileTree(res.data.tree || []);
        } catch (err) {
            console.error('[PM Project Details] fetchFileTree error:', err);
        }
    }

    async function fetchAssignedItems(pid) {
        try {
            const res = await API.get(`/auth/projects/${pid}/assigned-items`);
            const assigned = res.data.assignedPaths || [];
            setAssignedPaths(new Set(assigned));
        } catch (err) {
            console.error('[PM Project Details] fetchAssignedItems error:', err);
        }
    }

    // Always go to PM Dashboard
    function handleBack() {
        navigate('/project-manager-dashboard');
    }

    if (error) {
        return (
            <div className="pm-project-details-container">
                <p className="error">{error}</p>
                <button onClick={handleBack}>Go Back</button>
            </div>
        );
    }

    if (!project) {
        return <div className="pm-project-details-container">Loading...</div>;
    }

    const fileTypeCounts = project.file_type_counts || {};

    return (
        <div className="pm-project-details-container">
            <h2>Project #{project.id} Details</h2>

            {/* Project Info */}
            <div className="details-section">
                <h4>Project Info</h4>
                <p><strong>Status:</strong> {project.status}</p>
                <p><strong>Completion %:</strong> {project.completion_percentage}</p>
            </div>

            {/* Request Info */}
            <div className="details-section">
                <h4>Request Info</h4>
                <p><strong>Description:</strong> {project.request_description}</p>
                <p><strong>Special Requirements:</strong> {project.special_requirements || 'N/A'}</p>
                <p><strong>Request Status:</strong> {project.request_status}</p>
                <p><strong>Annotation Type:</strong> {project.annotation_type}</p>
                <p><strong>Delivery Type:</strong> {project.delivery_type}</p>
                <p><strong>Reason for Rejection:</strong> {project.reason_for_rejection || 'N/A'}</p>
                <p><strong>Estimated Delivery Date:</strong> {project.estimated_delivery_date || 'N/A'}</p>
            </div>

            {/* File Types */}
            <div className="details-section">
                <h4>File Types</h4>
                {Object.keys(fileTypeCounts).length > 0 ? (
                    <ul>
                        {Object.entries(fileTypeCounts).map(([ext, count]) => (
                            <li key={ext}>
                                <strong>{ext.toUpperCase()}:</strong> {count}
                            </li>
                        ))}
                    </ul>
                ) : (
                    <p>No file type data available.</p>
                )}
            </div>

            {/* Folder Tree */}
            <div className="details-section">
                <h4>Uploaded Files</h4>
                <FileTree treeData={fileTree} highlightPaths={assignedPaths} />
            </div>

            {/* Tasks */}
            <div className="details-section">
                <h4>Tasks</h4>
                <button onClick={() => navigate(`/pm/projects/${projectId}/tasks/new`)}>
                    Add New Task
                </button>
                <ul style={{ marginTop: '10px' }}>
                    {tasks.map((t) => (
                        <li key={t.id} style={{ marginBottom: '8px' }}>
                            Task #{t.id}
                            {t.deadline ? ` (Deadline: ${t.deadline}) ` : ''}
                            {t.assigned_to ? ` Assigned to: ${t.annotator_name}` : ' Unassigned'}
                            {' '}
                            {/* "View" button → new route */}
                            <Link to={`/pm/projects/${projectId}/tasks/${t.id}`}>
                                View
                            </Link>
                        </li>
                    ))}
                </ul>
            </div>

            <button onClick={handleBack}>Go Back</button>
        </div>
    );
}

export default ProjectManagerProjectDetailsPage;
