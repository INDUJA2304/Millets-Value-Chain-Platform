import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/Authcontext.js';
import { ToastProvider } from './components/Toast';
import MilletLibrary from './pages/MilletLibrary';
import FarmerLogin  from './pages/FarmerLogin';
import StartupLogin from './pages/StartupLogin';

import Home              from './pages/Home';
import FarmerRegister    from './pages/FarmerRegister';
import StartupRegister   from './pages/StartupRegister';
import CustomerLogin     from './pages/CustomerLogin';
// import EmailLogin        from './pages/EmailLogin';
import AdminLogin        from './pages/AdminLogin';
import FarmerDashboard   from './pages/FarmerDashboard';
import StartupDashboard  from './pages/StartupDashboard';
import CustomerDashboard from './pages/CustomerDashboard';
import AdminDashboard    from './pages/AdminDashboard';
import Recipes from './pages/Recipes';

function ProtectedRoute({ role, children }) {
  const { auth } = useAuth();
  if (!auth.token) return <Navigate to="/" replace />;
  if (role && auth.role !== role) return <Navigate to="/" replace />;
  return children;
}

function AppRoutes() {
  const { auth } = useAuth();

  // Auto-redirect if already logged in
  const dashPath = auth.role ? `/${auth.role}-dashboard` : '/';

  return (
    <Routes>
      <Route path="/" element={auth.token ? <Navigate to={dashPath} replace /> : <Home />} />
      <Route path="/farmer-register"   element={<FarmerRegister />} />
      <Route path="/startup-register"  element={<StartupRegister />} />
      <Route path="/customer-login"    element={<CustomerLogin />} />
      <Route path="/farmer-login"      element={<FarmerLogin role="farmer" />} />
      <Route path="/startup-login"     element={<StartupLogin role="startup" />} />
      <Route path="/admin-login"       element={<AdminLogin />} />
      <Route path="/millets" element={<MilletLibrary />} />
      <Route path="/farmer-login"   element={<FarmerLogin />} />
      <Route path="/startup-login"  element={<StartupLogin />} />
      <Route path="/customer-login" element={<CustomerLogin />} />

      <Route path="/farmer-dashboard" element={
        <ProtectedRoute role="farmer"><FarmerDashboard /></ProtectedRoute>
      }/>
      <Route path="/startup-dashboard" element={
        <ProtectedRoute role="startup"><StartupDashboard /></ProtectedRoute>
      }/>
      <Route path="/customer-dashboard" element={
        <ProtectedRoute role="customer"><CustomerDashboard /></ProtectedRoute>
      }/>
      <Route path="/admin-dashboard" element={
        <ProtectedRoute role="admin"><AdminDashboard /></ProtectedRoute>
      }/>

      <Route path="*" element={<Navigate to="/" replace />} />
      <Route path="/recipes" element={<Recipes />} />
    </Routes>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <BrowserRouter>
          <AppRoutes />
        </BrowserRouter>
      </ToastProvider>
    </AuthProvider>
  );
}