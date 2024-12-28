// frontend/src/components/Signin.js
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import API from '../services/api';
import { setToken } from '../utils/auth';
import '../styles/Signin.css';

function Signin({ onSuccess }) {
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [error, setError] = useState('');

  // Handle input changes
  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const res = await API.post('/auth/signin', formData);
      setToken(res.data.token);
      // Pass the user object to onSuccess
      onSuccess(res.data.user);
    } catch (err) {
      setError(err.response?.data?.error || 'Login failed. Please try again.');
    }
  };

  return (
    <div className="signin-container">
      <form className="signin-form" onSubmit={handleSubmit}>
        <h2>Sign In</h2>
        {error && <div className="error" role="alert">{error}</div>}
        <div className="form-group">
          <input
            name="email"
            type="email"
            placeholder="Email"
            value={formData.email}
            onChange={handleChange}
            required
            aria-label="Email"
          />
        </div>
        <div className="form-group">
          <input
            name="password"
            type="password"
            placeholder="Password"
            value={formData.password}
            onChange={handleChange}
            required
            aria-label="Password"
          />
        </div>
        <button type="submit" className="signin-button">Sign In</button>

        <p className="signup-link">
          Don&apos;t have an account? <Link to="/signup">Sign Up</Link>
        </p>
      </form>
    </div>
  );
}

export default Signin;
