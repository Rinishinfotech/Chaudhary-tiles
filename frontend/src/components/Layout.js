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
  const [term, setTerm] = useState('');
  const [showRes, setShowRes] = useState(false);
  const [dataset, setDataset] = useState({ parties: [], team: [], receipts: [], dispatches: [], challans: [], stock: [], expenses: [] });

  useEffect(() => {
    api.getNotifications().then(setNotifs).catch(() => {});
    Promise.all([
      api.getParties().catch(() => []),
      api.getTeam().catch(() => []),
      api.getReceipts().catch(() => []),
      api.getDispatches().catch(() => []),
      api.getChallans().catch(() => []),
      api.getStock().catch(() => []),
      api.getExpenses().catch(() => []),
    ]).then(([parties, team, receipts, dispatches, challans, stock, expenses]) => {
      setDataset({ parties, team, receipts, dispatches, challans, stock, expenses });
    });
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

  const onSearchChange = (val) => {
    setTerm(val);
    if (onSearch) onSearch(val);
    setShowRes(val.trim().length >= 2);
  };

  const q = term.trim().toLowerCase();
  let results = [];
  if (q.length >= 2) {
    const push = (arr) => { results = results.concat(arr); };
    push(dataset.parties.filter((p) => `${p.name} ${p.contact || ''} ${p.address || ''}`.toLowerCase().includes(q)).slice(0, 5).map((p) => ({ icon: 'fa-user-group', label: p.name, sub: `Party • ${p.contact || 'No contact'}`, route: '/parties' })));
    push(dataset.team.filter((t) => `${t.name} ${t.role} ${t.username || ''}`.toLowerCase().includes(q)).slice(0, 5).map((t) => ({ icon: 'fa-users', label: t.name, sub: `Employee • ${t.role}`, route: '/employees' })));
    push(dataset.receipts.filter((r) => `${r.srNo} ${r.party} ${r.receiver}`.toLowerCase().includes(q)).slice(0, 5).map((r) => ({ icon: 'fa-wallet', label: `${r.srNo} — ${r.party}`, sub: `Receipt • Rs ${Number(r.amount || 0).toLocaleString('en-IN')}`, route: '/receipts' })));
    push(dataset.stock.filter((s) => `${s.name} ${s.plant}`.toLowerCase().includes(q)).slice(0, 5).map((s) => ({ icon: 'fa-cubes', label: s.name, sub: `Stock • ${s.plant}`, route: '/stock' })));
    push(dataset.dispatches.filter((d) => `${d.party} ${d.vehicle} ${d.challanNo || ''}`.toLowerCase().includes(q)).slice(0, 5).map((d) => ({ icon: 'fa-truck', label: d.party, sub: `Dispatch • ${d.vehicle}`, route: '/dispatch' })));
    push(dataset.challans.filter((c) => `${c.dcNumber} ${c.party} ${c.vehicle}`.toLowerCase().includes(q)).slice(0, 5).map((c) => ({ icon: 'fa-file-lines', label: `${c.dcNumber} — ${c.party}`, sub: `D-Challan • ${c.vehicle}`, route: '/dchallan' })));
    push(dataset.expenses.filter((e) => `${e.spentBy} ${e.category} ${e.remarks || ''}`.toLowerCase().includes(q)).slice(0, 5).map((e) => ({ icon: 'fa-money-bill-wave', label: e.category, sub: `Expense • ${e.spentBy}`, route: '/expenses' })));
    results = results.slice(0, 12);
  }

  const goResult = (route) => {
    setShowRes(false);
    setTerm('');
    if (onSearch) onSearch('');
    navigate(route);
  };

  return (
    <div>
      <div className="ct-header">
        <div className="ct-logo" onClick={() => navigate('/dashboard')}>CT Management</div>
        <div className="ct-search" style={{ position: 'relative' }}>
          <input type="text" value={term} placeholder={searchPlaceholder}
            onChange={(e) => onSearchChange(e.target.value)}
            onFocus={() => term.trim().length >= 2 && setShowRes(true)}
            onBlur={() => setTimeout(() => setShowRes(false), 200)} />
          {showRes && (
            <div className="search-results">
              {results.length === 0 && <div className="notif-empty">No matches found for "{term}"</div>}
              {results.map((r, i) => (
                <div className="search-item" key={i} onMouseDown={() => goResult(r.route)}>
                  <i className={`fa ${r.icon}`}></i>
                  <div><h4>{r.label}</h4><p>{r.sub}</p></div>
                </div>
              ))}
            </div>
          )}
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
          {NAV.filter((n) => n.path !== '/settings' || isAdmin).map((n) => (
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
        <i className="fa fa-wallet" onClick={() => navigate('/wallet')}></i>
        <i className="fa fa-chart-column" onClick={() => navigate('/reports')}></i>
        {isAdmin && <i className="fa fa-gear" onClick={() => navigate('/settings')}></i>}
      </div>
    </div>
  );
}
