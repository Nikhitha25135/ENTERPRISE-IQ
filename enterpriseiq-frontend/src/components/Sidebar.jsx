import { NavLink, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import Logo from './Logo';
import { useAuth } from '../context/AuthContext';
import './Sidebar.css';

const icons = {
  dashboard: (
    <svg viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="2.5" y="2.5" width="6.5" height="6.5" rx="1.3" stroke="currentColor" strokeWidth="1.5" />
      <rect x="11" y="2.5" width="6.5" height="6.5" rx="1.3" stroke="currentColor" strokeWidth="1.5" />
      <rect x="2.5" y="11" width="6.5" height="6.5" rx="1.3" stroke="currentColor" strokeWidth="1.5" />
      <rect x="11" y="11" width="6.5" height="6.5" rx="1.3" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  ),
  documents: (
    <svg viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M5 2.5h6.5L15 6v11a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1v-13.5A1 1 0 0 1 5 2.5Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
      <path d="M11 2.5V6h4" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
      <path d="M6.5 10.5h6M6.5 13.5h6" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  ),
  ask: (
    <svg viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M3 4.5A1.5 1.5 0 0 1 4.5 3h11A1.5 1.5 0 0 1 17 4.5v7A1.5 1.5 0 0 1 15.5 13H9l-4 3.5V13H4.5A1.5 1.5 0 0 1 3 11.5v-7Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
      <circle cx="7" cy="8" r="0.9" fill="currentColor" />
      <circle cx="10" cy="8" r="0.9" fill="currentColor" />
      <circle cx="13" cy="8" r="0.9" fill="currentColor" />
    </svg>
  ),
  people: (
    <svg viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="7" cy="6.5" r="2.5" stroke="currentColor" strokeWidth="1.5" />
      <path d="M2.5 16c0-2.76 2.01-4.5 4.5-4.5s4.5 1.74 4.5 4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <circle cx="14" cy="6.5" r="2" stroke="currentColor" strokeWidth="1.5" />
      <path d="M12.8 11.6c1.98.28 3.2 1.86 3.2 4.4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  ),
  profile: (
    <svg viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="10" cy="6.5" r="3" stroke="currentColor" strokeWidth="1.5" />
      <path d="M3.5 17c0-3.59 2.91-6 6.5-6s6.5 2.41 6.5 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  ),
};

export default function Sidebar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  const links = [
    { to: '/dashboard', label: 'Dashboard', icon: 'dashboard' },
    { to: '/documents', label: 'Documents', icon: 'documents' },
    { to: '/chat', label: 'Ask', icon: 'ask' },
    ...(user?.role === 'admin' || user?.role === 'manager'
      ? [{ to: '/users', label: 'People', icon: 'people' }]
      : []),
    { to: '/profile', label: 'Profile', icon: 'profile' },
  ];

  return (
    <>
      <button
        className="sidebar-mobile-toggle md:hidden"
        onClick={() => setOpen(true)}
        aria-label="Open menu"
      >
        ≡
      </button>

      {open && <div className="sidebar-scrim md:hidden" onClick={() => setOpen(false)} />}

      <aside className={`app-sidebar ${open ? 'is-open' : ''}`}>
        <div className="px-6 pb-6 pt-7">
          <NavLink to="/dashboard" onClick={() => setOpen(false)}>
            <Logo tone="light" />
          </NavLink>
        </div>

        <nav className="flex-1 space-y-1 px-4">
          {links.map((l) => (
            <NavLink
              key={l.to}
              to={l.to}
              onClick={() => setOpen(false)}
              className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
            >
              <span className="sidebar-link-icon">{icons[l.icon]}</span>
              {l.label}
            </NavLink>
          ))}
        </nav>

        <div className="mt-auto p-4">
          <div className="sidebar-user-card">
            <div className="sidebar-user-avatar">
              {(user?.full_name || 'U').charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate font-body text-[13px] font-medium text-paper">
                {user?.full_name || 'Account'}
              </p>
              <p className="truncate font-mono text-[10.5px] uppercase tracking-[0.06em] text-paper/45">
                {user?.role}
              </p>
            </div>
            <button onClick={handleLogout} className="sidebar-signout" aria-label="Sign out" title="Sign out">
              <svg viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M8 3H4.5A1.5 1.5 0 0 0 3 4.5v11A1.5 1.5 0 0 0 4.5 17H8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M13 14l4-4-4-4M17 10H7.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
