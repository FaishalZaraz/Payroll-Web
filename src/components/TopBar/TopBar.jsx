import { Bell, Menu } from 'lucide-react';
import './TopBar.css';

export default function TopBar({ onMenuToggle }) {
  const today = new Date().toLocaleDateString('id-ID', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  return (
    <header className="topbar">
      <div className="topbar-left">
        <button className="topbar-hamburger" onClick={onMenuToggle}>
          <Menu size={24} />
        </button>

      </div>
      <div className="topbar-right">
        <span className="topbar-date">{today}</span>
        <button className="topbar-notification" id="notification-bell">
          <Bell size={20} />
          <span className="dot" />
        </button>
      </div>
    </header>
  );
}
