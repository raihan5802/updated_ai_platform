// frontend/src/components/AnnotatorDashboard.js
import React, { useState, useEffect } from 'react';
import API from '../services/api';
import { removeToken } from '../utils/auth';
import { useNavigate } from 'react-router-dom';
import '../styles/AnnotatorDashboard.css';

function AnnotatorDashboard() {
    const [tasks, setTasks] = useState([]);
    const [user, setUser] = useState(null);
    const navigate = useNavigate();

    useEffect(() => {
        fetchUser();
        fetchTasks();
    }, []);

    async function fetchUser() {
        try {
            const res = await API.get('/auth/dashboard');
            setUser(res.data.user);
        } catch (err) {
            console.error('[AnnotatorDashboard] fetchUser error:', err);
            navigate('/signin');
        }
    }

    async function fetchTasks() {
        try {
            // GET /auth/annotator/tasks
            const res = await API.get('/auth/annotator/tasks');
            setTasks(res.data.tasks || []);
        } catch (error) {
            console.error('[AnnotatorDashboard] fetchTasks error:', error);
        }
    }

    function handleLogout() {
        removeToken();
        navigate('/signin');
    }

    function handleView(taskId, projectId) {
        navigate(`/annotator/projects/${projectId}/tasks/${taskId}`);
    }

    return (
        <div className="annotator-dashboard-container">
            <div className="annotator-navbar">
                <h2>Annotator Dashboard</h2>
                <div className="navbar-right">
                    {user && <span>Welcome, {user.name}</span>}
                    <button onClick={handleLogout}>Logout</button>
                </div>
            </div>

            <div className="annotator-content">
                <h3>My Assigned Tasks</h3>
                {tasks.length === 0 ? (
                    <p>No tasks assigned yet.</p>
                ) : (
                    <table className="annotator-tasks-table">
                        <thead>
                            <tr>
                                <th>Task ID</th>
                                <th>Project ID</th>
                                <th>Deadline</th>
                                <th>Status</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {tasks.map((task) => (
                                <tr key={task.id}>
                                    <td>{task.id}</td>
                                    <td>{task.project_id}</td>
                                    <td>{task.deadline || 'N/A'}</td>
                                    <td>{task.status}</td>
                                    <td>
                                        <button onClick={() => handleView(task.id, task.project_id)}>
                                            View
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    );
}

export default AnnotatorDashboard;
