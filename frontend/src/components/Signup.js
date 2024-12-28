// frontend/src/components/Signup.js
import React, { useState } from 'react';
import API from '../services/api';
import '../styles/Signup.css';

function Signup({ onSuccess }) {
  const [formData, setFormData] = useState({ name: '', email: '', password: '' });
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
      await API.post('/auth/signup', formData);
      onSuccess();
    } catch (err) {
      setError(err.response?.data?.error || 'Signup failed. Please try again.');
    }
  };

  return (
    <div className="signup-container">
      <form className="signup-form" onSubmit={handleSubmit}>
        <h2>Sign Up</h2>
        {error && <div className="error" role="alert">{error}</div>}
        <div className="form-group">
          <input
            name="name"
            type="text"
            placeholder="Name"
            value={formData.name}
            onChange={handleChange}
            required
            aria-label="Name"
          />
        </div>
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
        <button type="submit" className="signup-button">Sign Up</button>
      </form>
    </div>
  );
}

export default Signup;
