// frontend/src/pages/ProjectManagerTaskDetailsPage.js
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import API from '../services/api';
import '../styles/ProjectManagerTaskDetails.css';

function ProjectManagerTaskDetailsPage() {
    const { projectId, taskId } = useParams();
    const navigate = useNavigate();

    const [task, setTask] = useState(null);
    const [assignedFiles, setAssignedFiles] = useState([]);
    const [error, setError] = useState('');

    useEffect(() => {
        fetchTaskDetails();
        // eslint-disable-next-line
    }, [projectId, taskId]);

    async function fetchTaskDetails() {
        try {
            const res = await API.get(`/auth/projects/${projectId}/tasks/${taskId}`);
            setTask(res.data.task);
            setAssignedFiles(res.data.assignedPaths || []);
        } catch (err) {
            console.error('[Task Details] error:', err);
            setError('Failed to load task details.');
        }
    }

    function handleBack() {
        // Go back to the Project Details
        navigate(`/pm/projects/${projectId}`);
    }

    if (error) {
        return (
            <div className="pm-task-details-container">
                <p className="error">{error}</p>
                <button onClick={handleBack}>Go Back</button>
            </div>
        );
    }

    if (!task) {
        return <div className="pm-task-details-container">Loading...</div>;
    }

    return (
        <div className="pm-task-details-container">
            <h3>Task #{task.id} Details</h3>
            <div className="task-info">
                <p><strong>Status:</strong> {task.status}</p>
                <p><strong>Deadline:</strong> {task.deadline || 'N/A'}</p>
                <p><strong>Assigned To:</strong> {task.annotator_name || 'Unassigned'}</p>
                <p><strong>Instructions:</strong> {task.instructions || 'N/A'}</p>
            </div>

            {assignedFiles.length > 0 ? (
                <div className="assigned-files">
                    <h4>Assigned Files</h4>
                    <ul>
                        {assignedFiles.map((f, idx) => (
                            <li key={idx}>{f}</li>
                        ))}
                    </ul>
                </div>
            ) : (
                <p>No files assigned yet.</p>
            )}

            <button onClick={handleBack}>Go Back</button>
        </div>
    );
}

export default ProjectManagerTaskDetailsPage;
