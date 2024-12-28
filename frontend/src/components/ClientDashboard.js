// frontend/src/components/ClientDashboard.js
import React, { useEffect, useState } from 'react';
import API from '../services/api';
import { removeToken } from '../utils/auth';
import { useNavigate } from 'react-router-dom';
import RequestAnnotationForm from './RequestAnnotationForm';
import '../styles/ClientDashboard.css';

function ClientDashboard() {
  const [user, setUser] = useState(null);
  const [requests, setRequests] = useState([]);
  const [projects, setProjects] = useState([]);
  const [showRequestForm, setShowRequestForm] = useState(false);

  // State for showing a rejection reason modal
  const [showRejectionModal, setShowRejectionModal] = useState(false);
  const [selectedRejectionReason, setSelectedRejectionReason] = useState('');

  const navigate = useNavigate();

  useEffect(() => {
    fetchDashboard();
    fetchRequests();
    fetchProjects();
  }, []);

  // Fetch user dashboard data
  async function fetchDashboard() {
    try {
      const res = await API.get('/auth/dashboard');
      setUser(res.data.user);
    } catch (err) {
      console.error('Error fetching dashboard user info:', err);
      // Handle unauthorized access by redirecting to Sign In
      navigate('/signin');
    }
  }

  // Fetch user requests
  async function fetchRequests() {
    try {
      const res = await API.get('/auth/requests');
      setRequests(res.data.requests || []);
    } catch (err) {
      console.error('Error fetching requests:', err);
    }
  }

  // Fetch user projects
  async function fetchProjects() {
    try {
      const res = await API.get('/auth/projects');
      setProjects(res.data.projects || []);
    } catch (err) {
      console.error('Error fetching projects:', err);
    }
  }

  // Handle user logout
  function handleLogout() {
    removeToken();
    navigate('/signin');
  }

  // Open Request Annotation Form
  function openRequestForm() {
    setShowRequestForm(true);
  }

  // Close Request Annotation Form and refresh data
  function closeRequestForm() {
    setShowRequestForm(false);
    fetchRequests();
    fetchProjects();
  }

  // Show the rejection reason in a modal
  function handleShowReason(reason) {
    setSelectedRejectionReason(reason);
    setShowRejectionModal(true);
  }

  // Close Rejection Reason Modal
  function closeRejectionModal() {
    setShowRejectionModal(false);
  }

  return (
    <div className="client-dashboard">
      {/* Navbar */}
      <nav className="client-navbar">
        <div className="navbar-left">
          <h2>Client Dashboard</h2>
        </div>
        <div className="navbar-right">
          {user && (
            <span className="user-info">
              {user.name} ({user.email})
            </span>
          )}
          <button className="request-button" onClick={openRequestForm}>
            Request Annotation
          </button>
          <button className="logout-button" onClick={handleLogout}>
            Logout
          </button>
        </div>
      </nav>

      {/* Main Content */}
      <main className="dashboard-content">
        {/* My Requests Section */}
        <section className="section">
          <h3>My Requests</h3>
          <table className="styled-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Description</th>
                <th>Status</th>
                <th>Delivery Type</th>
                <th>Annotation Type</th>
                <th>Created At</th>
              </tr>
            </thead>
            <tbody>
              {requests.map((r) => {
                // If status is "Rejected", show icon with onClick
                const statusCell =
                  r.status === 'Rejected' ? (
                    <span className="status-rejected" aria-label="Rejected">
                      {r.status}
                      {/* Icon to show rejection reason */}
                      <span
                        className="rejection-reason-icon"
                        onClick={() => handleShowReason(r.reason_for_rejection)}
                        title="View rejection reason"
                        role="button"
                        tabIndex="0"
                        onKeyPress={(e) => {
                          if (e.key === 'Enter') handleShowReason(r.reason_for_rejection);
                        }}
                      >
                        💬
                      </span>
                    </span>
                  ) : (
                    <span className={`status-${r.status.toLowerCase()}`}>{r.status}</span>
                  );

                return (
                  <tr key={r.id}>
                    <td>{r.id}</td>
                    <td>{r.description}</td>
                    <td>{statusCell}</td>
                    <td>{r.delivery_type}</td>
                    <td>{r.annotation_type}</td>
                    <td>{new Date(r.created_at).toLocaleDateString()}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </section>

        {/* My Projects Section */}
        <section className="section">
          <h3>My Projects</h3>
          <table className="styled-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Request ID</th>
                <th>Status</th>
                <th>Completion (%)</th>
              </tr>
            </thead>
            <tbody>
              {projects.map((p) => (
                <tr key={p.id}>
                  <td>{p.id}</td>
                  <td>{p.request_id}</td>
                  <td>{p.status}</td>
                  <td>{p.completion_percentage}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      </main>

      {/* Modal for Rejection Reason */}
      {showRejectionModal && (
        <div className="modal-overlay" onClick={closeRejectionModal}>
          <div
            className="modal-content"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="rejection-reason-title"
          >
            <h4 id="rejection-reason-title">Rejection Reason</h4>
            <p>{selectedRejectionReason || 'No reason provided.'}</p>
            <button className="close-modal-button" onClick={closeRejectionModal}>Close</button>
          </div>
        </div>
      )}

      {/* Request Annotation Form Modal */}
      {showRequestForm && <RequestAnnotationForm onClose={closeRequestForm} />}
    </div>
  );
}

export default ClientDashboard;
