import { useState } from 'react';
import { Outlet, Navigate } from 'react-router-dom';
import Sidebar from '../../components/Sidebar/Sidebar';
import TopBar from '../../components/TopBar/TopBar';
import ToastContainer from '../../components/Toast/ToastContainer';
import { useAuth } from '../../context/AuthContext';
import './DashboardLayout.css';

export default function DashboardLayout() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const { isAuthenticated } = useAuth();

  if (!isAuthenticated) return <Navigate to="/login" replace />;

  return (
    <div className="layout">
      <Sidebar mobileOpen={mobileOpen} onClose={() => setMobileOpen(false)} />
      <div className="layout-main">
        <TopBar onMenuToggle={() => setMobileOpen(prev => !prev)} />
        <main className="layout-content">
          <Outlet />
        </main>
      </div>
      <ToastContainer />
    </div>
  );
}
