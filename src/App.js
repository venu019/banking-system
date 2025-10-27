import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';

// User Pages
import Login from './pages/user/Login';
import Register from './pages/user/Register';
import Dashboard from './pages/user/Home';
import Transactions from './pages/user/Transactions';
import MyAccounts from './pages/user/MyAccounts';
import Cardapplication from './pages/user/cards';
import Payment from './pages/user/Payments';
import KycProfile from './pages/user/profile';
import OAuth2RedirectHandler from './pages/user/oauth';
import ProtectedRoute from './pages/user/ProtectedRoute';
import BankDashboard from './pages/admin/bankDashboard';

// Admin Pages
import BranchManagement from './pages/admin/BranchMangement';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/oauth2/redirect" element={<OAuth2RedirectHandler />} />
        
        {/* User Protected Routes */}
        <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
        <Route path="/services/transactions" element={<ProtectedRoute><Transactions /></ProtectedRoute>} />
        <Route path="/accounts" element={<ProtectedRoute><MyAccounts /></ProtectedRoute>} />
        <Route path="/services/cards" element={<ProtectedRoute><Cardapplication /></ProtectedRoute>} />
        <Route path="/pay" element={<ProtectedRoute><Payment /></ProtectedRoute>} />
        <Route path="/profile/kyc" element={<ProtectedRoute><KycProfile /></ProtectedRoute>} />

        {/* Admin Protected Route */}
        <Route path="/admin/branches" element={<ProtectedRoute><BranchManagement /></ProtectedRoute>} />
        <Route path="/admin/bank-dashboard" element={<ProtectedRoute><BankDashboard /></ProtectedRoute>} />

        {/* Fallback Route for any unknown paths */}
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
