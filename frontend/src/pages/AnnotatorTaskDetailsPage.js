import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import API from '../services/api';
import '../styles/AnnotatorTaskDetails.css';

function AnnotatorTaskDetailsPage() {
    const { projectId, taskId } = useParams();
    const navigate = useNavigate();
    const [task, setTask] = useState(null);
    const [error, setError] = useState('');

    useEffect(() => {
        fetchTaskDetails();
    }, [projectId, taskId]);

    async function fetchTaskDetails() {
        try {
            const res = await API.get(`/auth/projects/${projectId}/tasks/${taskId}`);
            setTask(res.data.task);
        } catch (err) {
            console.error('[Annotator Task Details] error:', err);
            setError('Failed to load task details.');
        }
    }

    function handleBack() {
        navigate('/annotator-dashboard');
    }

    if (error) {
        return (
            <div className="annotator-task-details-container">
                <p className="error">{error}</p>
                <button onClick={handleBack}>Go Back</button>
            </div>
        );
    }

    if (!task) {
        return (
            <div className="annotator-task-details-container">
                Loading...
            </div>
        );
    }

    return (
        <div className="annotator-task-details-container">
            <h3>Task #{task.id} Detail</h3>
            <p><strong>Deadline:</strong> {task.deadline || 'N/A'}</p>
            <p><strong>Status:</strong> {task.status}</p>
            <p><strong>Instructions:</strong> {task.instructions || 'N/A'}</p>
            {/* etc. */}
            <button onClick={handleBack}>Go Back</button>
        </div>
    );
}

export default AnnotatorTaskDetailsPage;
