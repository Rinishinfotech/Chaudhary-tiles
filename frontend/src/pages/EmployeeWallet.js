import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import { useAuth } from '../context/AuthContext';
import { api, inr } from '../api';

export default function EmployeeWallet() {
  const { user, isAdmin } = useAuth();
  const [balances, setBalances] = useState([]);
  const [passbook, setPassbook] = useState([]);
  const [pending, setPending] = useState([]);
  const [query, setQuery] = useState('');
  const [empFilter, setEmpFilter] = useState('ALL');
  const [typeFilter, setTypeFilter] = useState('ALL');

  const load = async () => {
    const w = await api.walletSummary();
    setBalances(w.balances); setPassbook(w.passbook);
    const exp = await api.getExpenses();
    setPending(exp.filter((e) => e.status === 'Pending'));
  };
  useEffect(() => { load(); }, []);

  const updateStatus = async (id, status) => { await api.updateExpenseStatus(id, status); load(); alert(`Transaction status updated to ${status}!`); };

  const me = balances.find((b) => b.name === user.name) || { name: user.name, role: user.role, walletLimit: 0, calculatedWallet: 0 };
  const q = query.toLowerCase();
  const filtered = passbook.filter((p) => {
    const ms = (p.empName + p.particulars).toLowerCase().includes(q);
    const me2 = empFilter === 'ALL' || p.empName === empFilter;
    const mt = typeFilter === 'ALL' || p.type === typeFilter;
    return ms && me2 && mt;
  });
  const statusClass = (s) => s === 'Pending' ? 'status-pending' : s === 'Rejected' ? 'status-rejected' : 'status-approved';

  return (
    <Layout searchPlaceholder="Search Passbook Logs by Employee or Particulars..." onSearch={setQuery}>
      <div className="page-title"><h2><i className="fa fa-briefcase" style={{ color: '#ffc107' }}></i> Employee Wallet Balances & Combined Passbook</h2></div>

      <div className="my-wallet-card">
        <div className="my-wallet-info"><h3>{me.name}</h3><h2>{inr(me.calculatedWallet)}</h2></div>
        <div className="my-limit-stats">
          <div className="stat-item"><span>Assigned Wallet Limit</span><strong>{inr(me.walletLimit)}</strong></div>
          <div className="stat-item"><span>Role</span><strong>{me.role}</strong></div>
        </div>
      </div>

      {isAdmin && pending.length > 0 && (
        <div className="approval-section">
          <div className="approval-header"><i className="fa fa-triangle-exclamation"></i><span>Pending Exceeded Wallet Limit Approval Requests</span></div>
          <div className="approval-grid">
            {pending.map((exp) => (
              <div className="approval-card" key={exp.id}>
                <div><strong style={{ color: '#0b1f3a', fontSize: 13 }}>{exp.spentBy}</strong><div style={{ fontSize: 11, color: '#666' }}>{exp.category} | {inr(exp.amount)}</div></div>
                <div style={{ display: 'flex', gap: 6 }}>
                  <button className="btn-approve" onClick={() => updateStatus(exp.id, 'Approved')}>Approve</button>
                  <button className="btn-reject" onClick={() => updateStatus(exp.id, 'Rejected')}>Reject</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="wallet-grid">
        {balances.map((t) => (
          <div className={`wallet-card ${t.calculatedWallet >= 0 ? '' : 'negative'}`} key={t.id}>
            <div className="wallet-info"><h4>{t.name}</h4><p>{t.role} | Limit: {inr(t.walletLimit)}</p></div>
            <div className="wallet-balance">{inr(t.calculatedWallet)}</div>
          </div>
        ))}
      </div>

      <div className="card-table">
        <div className="filter-bar">
          <select value={empFilter} onChange={(e) => setEmpFilter(e.target.value)}><option value="ALL">-- All Employees Passbook --</option>{balances.map((t) => <option key={t.id} value={t.name}>{t.name}</option>)}</select>
          <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}><option value="ALL">-- All Transaction Types --</option><option value="Credit">Credit (Receipts/Transfers In)</option><option value="Debit">Debit (Expenses/Transfers Out)</option></select>
        </div>
        <table>
          <thead><tr><th>S.No</th><th>Date</th><th>Employee Name</th><th>Type</th><th>Particulars / Source</th><th>Amount (Rs)</th><th>Status</th></tr></thead>
          <tbody>
            {filtered.map((p, i) => (
              <tr key={i}>
                <td>{i + 1}</td><td>{p.date}</td><td><strong>{p.empName}</strong></td>
                <td><span className={p.type === 'Credit' ? 'type-credit' : 'type-debit'}>{p.type}</span></td>
                <td>{p.particulars}</td>
                <td><strong className={p.type === 'Credit' ? 'type-credit' : 'type-debit'}>{inr(p.amount)}</strong></td>
                <td><span className={`status-badge ${statusClass(p.status)}`}>{p.status || 'Approved'}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Layout>
  );
}
