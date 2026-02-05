import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import '../styles/Auth.css';

const RegisterPage = () => {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    username: '',
    role: 'student',
    grade: ''
  });
  const [error, setError] = useState('');
  const { register } = useAuthStore();
  const navigate = useNavigate();

  const yearGroups = Array.from({ length: 13 }, (_, index) => index + 1);
  const formatYearLabel = (year) => {
    if (year <= 6) return `Year ${year} (Primary)`;
    if (year <= 11) return `Year ${year} (Secondary)`;
    return `Year ${year} (Sixth Form)`;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => {
      if (name === 'role' && value !== 'student') {
        return {
          ...prev,
          role: value,
          grade: ''
        };
      }

      return {
        ...prev,
        [name]: value
      };
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!formData.firstName || !formData.lastName || !formData.email || !formData.password || !formData.username) {
      setError('Please fill in all required fields');
      return;
    }

    const payload = { ...formData };
    if (payload.role !== 'student') {
      delete payload.grade;
    } else if (payload.grade === '') {
      delete payload.grade;
    } else {
      payload.grade = Number(payload.grade);
    }

    const result = await register(payload);
    if (result.success) {
      navigate('/');
    } else {
      setError(result.error);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-form">
        <h1>Interactive Learning Environment</h1>
        <h2>Register</h2>
        
        {error && <div className="error-message">{error}</div>}
        
        <form onSubmit={handleSubmit}>
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="firstName">First Name *</label>
              <input
                type="text"
                id="firstName"
                name="firstName"
                value={formData.firstName}
                onChange={handleChange}
                required
              />
            </div>
            <div className="form-group">
              <label htmlFor="lastName">Last Name *</label>
              <input
                type="text"
                id="lastName"
                name="lastName"
                value={formData.lastName}
                onChange={handleChange}
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="username">Username *</label>
            <input
              type="text"
              id="username"
              name="username"
              value={formData.username}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="email">Email *</label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Password *</label>
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="role">Role *</label>
              <select
                id="role"
                name="role"
                value={formData.role}
                onChange={handleChange}
              >
                <option value="student">Student</option>
                <option value="teacher">Teacher</option>
              </select>
            </div>

            {formData.role === 'student' && (
              <div className="form-group">
                <label htmlFor="grade">Year Group (Primary/Secondary)</label>
                <select
                  id="grade"
                  name="grade"
                  value={formData.grade}
                  onChange={handleChange}
                >
                  <option value="">Select year group</option>
                  {yearGroups.map((year) => (
                    <option key={year} value={year}>
                      {formatYearLabel(year)}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          <button type="submit" className="btn btn-primary">
            Register
          </button>
        </form>

        <p className="auth-link">
          Already have an account? <a href="/login">Login here</a>
        </p>
      </div>
    </div>
  );
};

export default RegisterPage;
