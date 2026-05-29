import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Navbar from './components/Navbar';
import ProtectedRoute from './components/ProtectedRoute';

import Home from './pages/Home';
import IITRecommendation from './pages/IITRecommendation';
import IITCutoffLookup from './pages/IITCutoffLookup';
import CollegeRecommendation from './pages/CollegeRecommendation';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Dashboard from './pages/Dashboard';

export default function App() {
  return (
    <AuthProvider>
      <Router>
        <Navbar />
        <Routes>
          <Route path="/"           element={<Home />} />
          <Route path="/login"      element={<Login />} />
          <Route path="/signup"     element={<Signup />} />

          <Route path="/dashboard"  element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
          <Route path="/iit"        element={<ProtectedRoute><IITRecommendation /></ProtectedRoute>} />
          <Route path="/iit-cutoff" element={<ProtectedRoute><IITCutoffLookup /></ProtectedRoute>} />
          <Route path="/college"    element={<ProtectedRoute><CollegeRecommendation /></ProtectedRoute>} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}
