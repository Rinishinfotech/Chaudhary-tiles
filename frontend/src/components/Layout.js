import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../api';

const NAV = [
  { path: '/dashboard', icon: 'fa-house', label: 'Dashboard' },
  { path: '/employees', icon: 'fa-users', label: 'Employee Management' },
  { path: '/parties', icon: 'fa-user-group', label: 'Party Management' },
  { path: '/receipts', icon: 'fa-wallet', label: 'Receipt Management' },
  { path: '/expenses', icon: 'fa-money-bill-wave', label: 'Expense Management' },
  { path: '/wallet', icon: 'fa-briefcase', label: 'Employee Wallet' },
  { path: '/dispatch', icon: 'fa-truck', label: 'Dispatch Management' },
  { path: '/stock', icon: 'fa-cubes', label: 'Stock Management' },
  { path: '/production', icon: 'fa-industry', label: 'Production' },
  { path: '/dchallan', icon: 'fa-file-lines', label: 'D Challan' },
  { path: '/reports', icon: 'fa-chart-column', label: 'Reports' },
  { path: '/settings', icon: 'fa-gear', label: 'Settings' },
];

export default function Layout({ children, searchPlaceholder = 'Search...', onSearch }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { logout, isAdmin } = useAuth();
  const [notifs, setNotifs] = useState([]);
  const [showNotif, setShowNotif] = useState(false);

  useEffect(() => {
    api.getNotifications().then(setNotifs).catch(() => {});
  }, []);

  const handleLogout = () => {
    if (window.confirm('Logout from CT Management Portal?')) {
      logout();
      navigate('/login');
    }
  };

  const openNotif = () => {
    const next = !showNotif;
    setShowNotif(next);
    if (next) api.getNotifications().then(setNotifs).catch(() => {});
  };

  return (
    <div>
      <div className="ct-header">
        <div className="ct-logo" onClick={() => navigate('/dashboard')}>CT Management</div>
        <div className="ct-search">
          <input type="text" placeholder={searchPlaceholder} onChange={(e) => onSearch && onSearch(e.target.value)} />
        </div>
        <div className="ct-icons">
          <i className="fa fa-bell" title="Notifications" onClick={openNotif}></i>
          <span className="notification-badge">{notifs.length}</span>
          <i className="fa fa-user-circle" title="Logout / Profile" onClick={handleLogout}></i>
          <div className={`notif-dropdown ${showNotif ? 'show' : ''}`} onClick={(e) => e.stopPropagation()}>
            <div className="notif-header">
              <span><i className="fa fa-bell" style={{ color: '#ffc107' }}></i> Broadcast Notifications</span>
            </div>
            <div className="notif-list">
              {notifs.length === 0 && <div className="notif-empty">No new notifications</div>}
              {notifs.map((n, i) => (
                <div className="notif-item" key={i}>
                  <i className={`fa ${n.type === 'low_stock' ? 'fa-triangle-exclamation' : 'fa-circle-info'}`} style={{ color: n.type === 'low_stock' ? '#dc3545' : '#ffc107', marginTop: 3 }}></i>
                  <div>
                    <h4>{n.title}</h4>
                    <p>{n.msg}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="ct-sidebar">
        <ul>
          {NAV.map((n) => (
            <li key={n.path} className={location.pathname === n.path ? 'active' : ''} onClick={() => navigate(n.path)}>
              <i className={`fa ${n.icon}`}></i> {n.label}
            </li>
          ))}
          <li onClick={handleLogout}><i className="fa fa-right-from-bracket"></i> Logout</li>
        </ul>
      </div>

      <div className="ct-main">{children}</div>

      <div className="bottomnav">
        <i className="fa fa-house" onClick={() => navigate('/dashboard')}></i>
        <i className="fa fa-users" onClick={() => navigate('/employees')}></i>
        <i className="fa fa-wallet" onClick={() => navigate('/receipts')}></i>
        <i className="fa fa-chart-column" onClick={() => navigate('/reports')}></i>
        {isAdmin && <i className="fa fa-gear" onClick={() => navigate('/settings')}></i>}
      </div>
    </div>
  );
}
