// frontend/src/components/ProjectManagerDashboard.js
import React, { useEffect, useState } from 'react';
import API from '../services/api';
import { removeToken } from '../utils/auth';
import { useNavigate } from 'react-router-dom';
import '../styles/ProjectManagerDashboard.css';

function ProjectManagerDashboard() {
    const [projects, setProjects] = useState([]);
    const [user, setUser] = useState(null);
    const navigate = useNavigate();

    useEffect(() => {
        fetchUser();
        fetchAssignedProjects();
    }, []);

    async function fetchUser() {
        try {
            const res = await API.get('/auth/dashboard');
            setUser(res.data.user);
        } catch (error) {
            console.error('[PM Dashboard] fetchUser error:', error);
            navigate('/signin');
        }
    }

    async function fetchAssignedProjects() {
        try {
            const res = await API.get('/auth/projects');
            setProjects(res.data.projects || []);
        } catch (error) {
            console.error('[PM Dashboard] fetchAssignedProjects error:', error);
        }
    }

    function handleLogout() {
        removeToken();
        navigate('/signin');
    }

    // Filter projects to only those assigned to the current PM
    const assignedProjects = user
        ? projects.filter((p) => p.project_manager_id === user.id)
        : [];

    // Helper to navigate on row click
    function handleRowClick(projectId) {
        navigate(`/pm/projects/${projectId}`);
    }

    return (
        <div className="pm-dashboard-container">
            {/* Navbar */}
            <div className="pm-navbar">
                <h2>Project Manager Dashboard</h2>
                <div className="pm-nav-right">
                    {user && <span>Welcome, {user.name}</span>}
                    <button onClick={handleLogout}>Logout</button>
                </div>
            </div>

            {/* Projects Table */}
            <div className="pm-content">
                <h3>All Assigned Projects</h3>
                <table className="styled-table">
                    <thead>
                        <tr>
                            <th>Project ID</th>
                            <th>Request ID</th>
                            <th>Status</th>
                            <th>Completion (%)</th>
                        </tr>
                    </thead>
                    <tbody>
                        {assignedProjects.map((proj) => (
                            // Entire <tr> is clickable
                            <tr
                                key={proj.id}
                                onClick={() => handleRowClick(proj.id)}
                                style={{ cursor: 'pointer' }}
                            >
                                <td>{proj.id}</td>
                                <td>{proj.request_id}</td>
                                <td>{proj.status}</td>
                                <td>{proj.completion_percentage}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

export default ProjectManagerDashboard;
