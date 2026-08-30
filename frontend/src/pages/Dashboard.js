import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import { useAuth } from '../context/AuthContext';
import { api, inr } from '../api';

const MODULES = [
  { path: '/employees', icon: 'fa-users', label: 'Employee' },
  { path: '/parties', icon: 'fa-user-group', label: 'Party' },
  { path: '/receipts', icon: 'fa-wallet', label: 'Receipt' },
  { path: '/expenses', icon: 'fa-money-bill-wave', label: 'Expense' },
  { path: '/stock', icon: 'fa-cubes', label: 'Stock' },
  { path: '/dispatch', icon: 'fa-truck', label: 'Dispatch' },
  { path: '/production', icon: 'fa-industry', label: 'Production' },
  { path: '/dchallan', icon: 'fa-file-lines', label: 'D Challan' },
];

export default function Dashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [summary, setSummary] = useState({ todayReceipt: 0, todayExpense: 0, dispatchCount: 0, pendingCount: 0 });
  const [approvals, setApprovals] = useState([]);
  const [showPending, setShowPending] = useState(false);

  const load = () => {
    api.dashboardSummary().then(setSummary).catch(() => {});
    api.getApprovals().then(setApprovals).catch(() => {});
  };
  useEffect(() => { load(); }, []);

  const actionApproval = async (id) => {
    await api.deleteApproval(id);
    load();
  };

  if (!user) return null;

  return (
    <Layout searchPlaceholder="Search Party / Employee / Vouchers...">
      <div className="user-welcome">
        <div>
          <h3>Welcome, {user.name}</h3>
          <small style={{ color: '#666' }}>Assigned Plant: {user.plant}</small>
        </div>
        <span className="role-tag">{user.role}</span>
      </div>

      <div className="summary">
        <div className="box"><h4>Today's Receipt</h4><h2>{inr(summary.todayReceipt)}</h2></div>
        <div className="box"><h4>Today's Expense</h4><h2>{inr(summary.todayExpense)}</h2></div>
        <div className="box"><h4>Dispatch Count</h4><h2>{summary.dispatchCount}</h2></div>
        <div className="box clickable" onClick={() => setShowPending(true)}>
          <h4>Pending Approval <i className="fa fa-arrow-up-right-from-square" style={{ fontSize: 12, color: '#ffc107' }}></i></h4>
          <h2>{approvals.length}</h2>
        </div>
      </div>

      <div className="modules">
        {MODULES.map((m) => (
          <div className="module" key={m.path} onClick={() => navigate(m.path)}>
            <i className={`fa ${m.icon}`}></i>
            <h3>{m.label}</h3>
          </div>
        ))}
      </div>

      {showPending && (
        <div className="modal-overlay" onClick={() => setShowPending(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3><i className="fa fa-clock" style={{ color: '#ffc107' }}></i> Pending Approvals</h3>
              <i className="fa fa-xmark modal-close" onClick={() => setShowPending(false)}></i>
            </div>
            <ul className="approval-list">
              {approvals.length === 0 && <p style={{ textAlign: 'center', padding: 15, color: '#777' }}>No pending approvals!</p>}
              {approvals.map((a) => (
                <li className="approval-item" key={a.id}>
                  <div className="approval-info">
                    <h4>{a.title}</h4>
                    <p>{a.desc}</p>
                  </div>
                  <div className="approval-btns">
                    <button className="btn-approve" onClick={() => actionApproval(a.id)}>Approve</button>
                    <button className="btn-reject" onClick={() => actionApproval(a.id)}>Reject</button>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </Layout>
  );
}
