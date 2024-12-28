// frontend/src/pages/SigninPage.js
import React from 'react';
import Signin from '../components/Signin';
import { useNavigate } from 'react-router-dom';

function SigninPage() {
  const navigate = useNavigate();

  const handleSuccess = (user) => {
    if (user.role_id === 1) {
      // Admin
      navigate('/admin-dashboard');
    } else if (user.role_id === 3) {
      // Project Manager
      navigate('/project-manager-dashboard');
    } else if (user.role_id === 4) {
      // Annotator
      navigate('/annotator-dashboard');
    } else {
      // Client (role_id=2) or other roles
      navigate('/dashboard');
    }
  };

  return <Signin onSuccess={handleSuccess} />;
}

export default SigninPage;
