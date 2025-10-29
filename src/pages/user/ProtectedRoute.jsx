import React from 'react';
import { Navigate } from 'react-router-dom';

const ProtectedRoute = ({ children }) => {
  // Check for the token first
  const token = localStorage.getItem('jwtToken');
  
  // Optionally, check for the user object as well
  const user = localStorage.getItem('user');

  console.log("ProtectedRoute Check:");
  console.log("Token found:", token ? "Yes" : "No");
  console.log("User found:", user ? "Yes" : "No");

  // The condition to check if the user is authenticated
  const isAuthenticated = token && user;

  if (!isAuthenticated) {
    console.log("Redirecting to /login");
    // If not authenticated, redirect to the login page
    return <Navigate to="/login" replace />;
  }

  // If authenticated, render the children components (the protected page)
  console.log("Access Granted. Rendering protected component.");
  return children;
};

export default ProtectedRoute;
