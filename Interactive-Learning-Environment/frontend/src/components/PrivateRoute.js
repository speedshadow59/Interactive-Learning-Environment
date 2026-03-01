import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';

const PrivateRoute = ({ children, requiredRole }) => {
  const { user, loading } = useAuthStore();

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!user) {
    return <Navigate to="/login" />;
  }

  const roleAllowed = !requiredRole
    || user.role === requiredRole
    || (requiredRole === 'teacher' && user.role === 'admin');

  if (!roleAllowed) {
    return <Navigate to="/" />;
  }

  return children;
};

export default PrivateRoute;
