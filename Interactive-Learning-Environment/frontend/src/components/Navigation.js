import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import '../styles/Navigation.css';

const Navigation = () => {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav className="navigation">
      <div className="nav-container">
        <Link to="/" className="nav-logo">
          <span className="logo-icon">🎓</span> ILE
        </Link>
        
        <ul className="nav-menu">
          <li className="nav-item">
            <Link to={user?.role === 'student' ? '/student/dashboard' : '/teacher/dashboard'} className="nav-link">
              Dashboard
            </Link>
          </li>
          {user?.role === 'student' && (
            <li className="nav-item">
              <Link to="/courses" className="nav-link">
                Courses
              </Link>
            </li>
          )}
          <li className="nav-item">
            <Link to="/profile" className="nav-link">
              {user?.firstName || 'Profile'}
            </Link>
          </li>
          <li className="nav-item">
            <button onClick={handleLogout} className="nav-link logout-btn">
              Logout
            </button>
          </li>
        </ul>
      </div>
    </nav>
  );
};

export default Navigation;
