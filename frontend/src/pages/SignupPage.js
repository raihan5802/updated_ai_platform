// frontend/src/pages/SignupPage.js
import React from 'react';
import Signup from '../components/Signup';
import { useNavigate } from 'react-router-dom';

function SignupPage() {
  const navigate = useNavigate();

  const handleSuccess = () => {
    navigate('/signin');
  };

  return <Signup onSuccess={handleSuccess} />;
}

export default SignupPage;
