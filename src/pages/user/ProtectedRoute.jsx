import React from 'react';
import { Navigate } from 'react-router-dom';

const ProtectedRoute = ({ children }) => {
  // --- CORRECTED: Check for the "user" object in localStorage ---
  const user = JSON.parse(localStorage.getItem('user'));

  // You can also check for the token for more robust security
  const token = localStorage.getItem('jwtToken');

  if (!user || !token) {
    // If user or token is not found, redirect to the login page
    return <Navigate to="/login" replace />;
  }

  // If the user is authenticated, render the children components (the protected page)
  return children;
};

export default ProtectedRoute;
