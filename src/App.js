import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/user/Login';
import Register from './pages/user/Register';
import Dashboard from './pages/user/Home';
import Transactions from './pages/user/Transactions';
import ProtectedRoute from './pages/user/ProtectedRoute';
import MyAccounts from './pages/user/MyAccounts';
import CardRequest from './pages/user/cards';
import Payment from './pages/user/Payments';
import OAuth2RedirectHandler from './pages/user/oauth';

function App(){
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="/login" element={<Login/>} />
        <Route path="/register" element={<Register/>} />
        <Route path="/oauth2/redirect" element={<OAuth2RedirectHandler />} />
        <Route path="/dashboard" element={
          <ProtectedRoute><Dashboard/></ProtectedRoute>
        } />
        <Route path="/services/transactions" element={
          <ProtectedRoute><Transactions/></ProtectedRoute>
        } />
        <Route path="/accounts" element={
          <ProtectedRoute><MyAccounts/></ProtectedRoute>
        } />
        <Route path="/services/cards" element={
          <ProtectedRoute><CardRequest/></ProtectedRoute>
        } />
        <Route path="/pay" element={
          <ProtectedRoute><Payment/></ProtectedRoute>
        } />
      </Routes>
    </BrowserRouter>
  );
}
export default App;
