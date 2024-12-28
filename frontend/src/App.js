// frontend/src/App.js
import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import SigninPage from './pages/SigninPage';
import SignupPage from './pages/SignupPage';
import ClientDashboardPage from './pages/ClientDashboardPage';
import AdminDashboardPage from './pages/AdminDashboardPage';
import ProjectManagerDashboardPage from './pages/ProjectManagerDashboardPage';
import ProjectManagerProjectDetailsPage from './pages/ProjectManagerProjectDetailsPage';
import ProtectedRoute from './components/ProtectedRoute';
import ProjectManagerAddTaskPage from './pages/ProjectManagerAddTaskPage';
import ProjectManagerTaskDetailsPage from './pages/ProjectManagerTaskDetailsPage';
import AnnotatorDashboardPage from './pages/AnnotatorDashboardPage';
import AnnotatorTaskDetailsPage from './pages/AnnotatorTaskDetailsPage';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/signin" element={<SigninPage />} />
        <Route path="/signup" element={<SignupPage />} />

        {/* Client Dashboard */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <ClientDashboardPage />
            </ProtectedRoute>
          }
        />

        {/* Admin Dashboard */}
        <Route
          path="/admin-dashboard"
          element={
            <ProtectedRoute>
              <AdminDashboardPage />
            </ProtectedRoute>
          }
        />

        {/* NEW: Project Manager Dashboard */}
        <Route
          path="/project-manager-dashboard"
          element={
            <ProtectedRoute>
              <ProjectManagerDashboardPage />
            </ProtectedRoute>
          }
        />

        {/* NEW: Project Manager's Project Details Page */}
        <Route
          path="/pm/projects/:projectId"
          element={
            <ProtectedRoute>
              <ProjectManagerProjectDetailsPage />
            </ProtectedRoute>
          }
        />

        {/* NEW: Project Manager's Add Tasks Page */}
        <Route
          path="/pm/projects/:projectId/tasks/new"
          element={
            <ProtectedRoute>
              <ProjectManagerAddTaskPage />
            </ProtectedRoute>
          }
        />

        {/* NEW: Project Manager Task Details Page */}
        <Route
          path="/pm/projects/:projectId/tasks/:taskId"
          element={
            <ProtectedRoute>
              <ProjectManagerTaskDetailsPage />
            </ProtectedRoute>
          }
        />

        {/* NEW: Annotator Dashboard Page */}
        <Route
          path="/annotator-dashboard"
          element={
            <ProtectedRoute>
              <AnnotatorDashboardPage />
            </ProtectedRoute>
          }
        />

        {/* NEW: Annotator Task Details Page */}
        <Route
          path="/annotator/projects/:projectId/tasks/:taskId"
          element={
            <ProtectedRoute>
              <AnnotatorTaskDetailsPage />
            </ProtectedRoute>
          }
        />

        {/* Default route */}
        <Route path="/" element={<SigninPage />} />
      </Routes>
    </Router>
  );
}

export default App;
