// frontend/src/components/AdminDashboard.js
import React, { useEffect, useState } from 'react';
import API from '../services/api';
import { removeToken } from '../utils/auth';
import { useNavigate } from 'react-router-dom';
import '../styles/AdminDashboard.css';

// Helper function to format bytes into KB, MB, etc.
function formatBytes(bytes) {
  if (!bytes || bytes < 0) return '0 B';
  const KB = 1024;
  const MB = KB * 1024;
  const GB = MB * 1024;

  if (bytes < KB) return bytes + ' B';
  else if (bytes < MB) return (bytes / KB).toFixed(2) + ' KB';
  else if (bytes < GB) return (bytes / MB).toFixed(2) + ' MB';
  return (bytes / GB).toFixed(2) + ' GB';
}

function AdminDashboard() {
  const [requests, setRequests] = useState([]);
  const [projects, setProjects] = useState([]);

  // For reviewing a selected request
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [estimatedDate, setEstimatedDate] = useState('');
  const [pmId, setPmId] = useState('');
  const [rejectReason, setRejectReason] = useState('');

  const navigate = useNavigate();

  useEffect(() => {
    fetchRequests();
    fetchProjects();
  }, []);

  async function fetchRequests() {
    try {
      const res = await API.get('/auth/requests');
      setRequests(res.data.requests);
    } catch (err) {
      console.error('[AdminDashboard] fetchRequests error:', err);
    }
  }

  async function fetchProjects() {
    try {
      const res = await API.get('/auth/projects');
      setProjects(res.data.projects);
    } catch (err) {
      console.error('[AdminDashboard] fetchProjects error:', err);
    }
  }

  function handleReview(req) {
    setSelectedRequest(req);
    setEstimatedDate('');
    setPmId('');
    setRejectReason('');
  }

  async function handleAccept() {
    if (!estimatedDate) {
      alert('Please provide an estimated delivery date.');
      return;
    }
    try {
      await API.patch(`/auth/admin/requests/${selectedRequest.id}/accept`, {
        estimated_delivery_date: estimatedDate,
        project_manager_id: pmId || null,
      });
      alert('Request accepted.');
      setSelectedRequest(null);
      fetchRequests();
      fetchProjects();
    } catch (err) {
      console.error('[AdminDashboard] handleAccept error:', err);
      alert('Failed to accept request');
    }
  }

  async function handleReject() {
    if (!rejectReason) {
      alert('Please provide a reason for rejection.');
      return;
    }
    try {
      await API.patch(`/auth/admin/requests/${selectedRequest.id}/reject`, {
        reason_for_rejection: rejectReason,
      });
      alert('Request rejected.');
      setSelectedRequest(null);
      fetchRequests();
      fetchProjects();
    } catch (err) {
      console.error('[AdminDashboard] handleReject error:', err);
      alert('Failed to reject request');
    }
  }

  function handleLogout() {
    removeToken();
    navigate('/signin');
  }

  // Helper to render file types
  function renderFileTypes(fileTypeCounts) {
    if (!fileTypeCounts) return 'N/A';
    // If stored as JSONB, it should come in as an object.
    // If stored as TEXT, you'd need to parse it: e.g., JSON.parse(fileTypeCounts)
    return Object.entries(fileTypeCounts).map(([ext, count]) => {
      return (
        <div key={ext}>{ext.toUpperCase()} = {count}</div>
      );
    });
  }

  return (
    <div className="admin-dashboard">
      {/* Navbar */}
      <div className="admin-navbar">
        <h2>Admin Dashboard</h2>
        <button className="logout-button" onClick={handleLogout}>Logout</button>
      </div>

      <div className="admin-content">
        {/* Requests Table */}
        <div className="admin-section">
          <h3>All Requests</h3>
          <table className="styled-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Client</th>
                <th>Description</th>
                <th>Annotation Type</th>
                <th>Status</th>
                <th>Files</th>
                <th>Total Size</th>
                <th>File Types</th> {/* NEW column */}
                <th>Reason</th>
                <th>Delivery Date</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {requests.map((req) => (
                <tr key={req.id}>
                  <td>{req.id}</td>
                  <td>{req.client_name}</td>
                  <td>{req.description}</td>
                  <td>{req.annotation_type}</td>
                  <td>{req.status}</td>
                  <td>{req.file_count ?? 0}</td>
                  <td>{formatBytes(req.total_size)}</td>
                  <td>
                    {/* Render file types object */}
                    {renderFileTypes(req.file_type_counts)}
                  </td>
                  <td>{req.reason_for_rejection || 'N/A'}</td>
                  <td>{req.estimated_delivery_date || 'N/A'}</td>
                  <td>
                    {req.status === 'Pending' && (
                      <button className="review-button" onClick={() => handleReview(req)}>
                        Review
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Projects Table */}
        <div className="admin-section">
          <h3>All Projects</h3>
          <table className="styled-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Request ID</th>
                <th>Project Manager ID</th>
                <th>Status</th>
                <th>Completion (%)</th>
              </tr>
            </thead>
            <tbody>
              {projects.map((proj) => (
                <tr key={proj.id}>
                  <td>{proj.id}</td>
                  <td>{proj.request_id}</td>
                  <td>{proj.project_manager_id || 'None'}</td>
                  <td>{proj.status}</td>
                  <td>{proj.completion_percentage}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal for Accept/Reject */}
      {selectedRequest && (
        <div className="admin-modal-overlay" onClick={() => setSelectedRequest(null)}>
          <div
            className="admin-modal"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="review-request-title"
          >
            <h3 id="review-request-title">Review Request #{selectedRequest.id}</h3>
            <p><strong>Description:</strong> {selectedRequest.description}</p>
            <p>
              <strong>Special Requirements:</strong>{' '}
              {selectedRequest.special_requirements || 'N/A'}
            </p>
            <p><strong>Annotation Type:</strong> {selectedRequest.annotation_type}</p>
            <p><strong>Number of Files:</strong> {selectedRequest.file_count ?? 0}</p>
            <p><strong>Total Size:</strong> {formatBytes(selectedRequest.total_size)}</p>
            <p><strong>File Types:</strong></p>
            <div className="file-types-modal">
              {selectedRequest.file_type_counts
                ? Object.entries(selectedRequest.file_type_counts).map(([ext, count]) => (
                  <div key={ext}>{ext.toUpperCase()} = {count}</div>
                ))
                : 'N/A'}
            </div>

            <div className="modal-actions">
              <div className="accept-box">
                <h4>Accept</h4>
                <label htmlFor="estimatedDate">Estimated Delivery Date:</label>
                <input
                  type="date"
                  id="estimatedDate"
                  value={estimatedDate}
                  onChange={(e) => setEstimatedDate(e.target.value)}
                  required
                />

                <label htmlFor="pmId">Project Manager ID:</label>
                <input
                  type="text"
                  id="pmId"
                  value={pmId}
                  onChange={(e) => setPmId(e.target.value)}
                  placeholder="e.g., 5"
                />
                <button className="accept-btn" onClick={handleAccept}>Accept</button>
              </div>

              <div className="reject-box">
                <h4>Reject</h4>
                <label htmlFor="rejectReason">Reason for Rejection:</label>
                <textarea
                  id="rejectReason"
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  required
                />
                <button className="reject-btn" onClick={handleReject}>Reject</button>
              </div>
            </div>

            <button className="close-modal" onClick={() => setSelectedRequest(null)}>Close</button>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminDashboard;
