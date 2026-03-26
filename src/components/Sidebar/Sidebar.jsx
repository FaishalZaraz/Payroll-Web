import { useState } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, Users, Wallet, TrendingUp, TrendingDown,
  Store, FileText, BarChart3, ChevronDown, LogOut, Receipt, Building2
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import './Sidebar.css';

const navItems = [
  { label: 'Dashboard', icon: LayoutDashboard, path: '/dashboard', roles: ['admin', 'finance'] },
  { label: 'Karyawan', icon: Users, path: '/karyawan', roles: ['admin'] },
  { label: 'Payroll', icon: Wallet, path: '/payroll', roles: ['admin', 'finance'] },
  {
    label: 'Keuangan', icon: BarChart3, roles: ['admin', 'finance'],
    children: [
      { label: 'Pemasukan', icon: TrendingUp, path: '/keuangan/pemasukan' },
      { label: 'Pengeluaran', icon: TrendingDown, path: '/keuangan/pengeluaran' },
      { label: 'Vendor', icon: Store, path: '/keuangan/vendor' },
    ]
  },
  {
    label: 'Laporan', icon: FileText, roles: ['admin', 'finance'],
    children: [
      { label: 'Laba Rugi', icon: BarChart3, path: '/laporan/laba-rugi' },
      { label: 'Riwayat Payroll', icon: Receipt, path: '/laporan/riwayat-gaji' },
    ]
  },
  { label: 'Slip Gaji Saya', icon: Receipt, path: '/slip-gaji', roles: ['admin', 'finance', 'karyawan'] },
];

export default function Sidebar({ mobileOpen, onClose }) {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [openMenus, setOpenMenus] = useState({});

  const toggleMenu = (label) => {
    setOpenMenus(prev => ({ ...prev, [label]: !prev[label] }));
  };

  const isChildActive = (children) => {
    return children?.some(c => location.pathname.startsWith(c.path));
  };

  const filteredItems = navItems.filter(item =>
    item.roles.includes(user?.role)
  );

  const initials = user?.name?.split(' ').map(n => n[0]).join('').slice(0, 2) || 'U';

  return (
    <>
      <div className={`sidebar-overlay ${mobileOpen ? 'visible' : ''}`} onClick={onClose} />
      <aside className={`sidebar ${mobileOpen ? 'mobile-open' : ''}`}>
        <div className="sidebar-header">
          <div className="sidebar-logo">
            <Building2 size={20} />
          </div>
          <div className="sidebar-brand">
            <h1>PayrollPro</h1>
            <p>Manajemen Gaji</p>
          </div>
        </div>

        <nav className="sidebar-nav">
          <div className="nav-section-label">Menu Utama</div>
          {filteredItems.map(item => (
            item.children ? (
              <div key={item.label}>
                <div
                  className={`nav-item ${isChildActive(item.children) ? 'active' : ''}`}
                  onClick={() => toggleMenu(item.label)}
                >
                  <item.icon size={20} />
                  <span>{item.label}</span>
                  <button className={`nav-toggle-btn ${openMenus[item.label] || isChildActive(item.children) ? 'rotated' : ''}`}>
                    <ChevronDown size={16} />
                  </button>
                </div>
                <div className={`nav-submenu ${openMenus[item.label] || isChildActive(item.children) ? 'open' : ''}`}>
                  {item.children.map(child => (
                    <NavLink
                      key={child.path}
                      to={child.path}
                      className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
                      onClick={onClose}
                    >
                      <child.icon size={16} />
                      <span>{child.label}</span>
                    </NavLink>
                  ))}
                </div>
              </div>
            ) : (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
                onClick={onClose}
              >
                <item.icon size={20} />
                <span>{item.label}</span>
              </NavLink>
            )
          ))}
        </nav>

        <div className="sidebar-footer">
          <div className="sidebar-user">
            <div className="sidebar-avatar">{initials}</div>
            <div className="sidebar-user-info">
              <div className="name">{user?.name}</div>
              <div className="role">{user?.role}</div>
            </div>
            <button className="sidebar-logout" onClick={() => { logout(); navigate('/login'); }} title="Logout">
              <LogOut size={18} />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
