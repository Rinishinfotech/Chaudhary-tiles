import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import { useAuth } from '../context/AuthContext';
import { api, inr, fmtDate, todayStr, printDocument } from '../api';

export default function EmployeeWallet() {
  const { user, isAdmin } = useAuth();
  const [balances, setBalances] = useState([]);
  const [passbook, setPassbook] = useState([]);
  const [pending, setPending] = useState([]);
  const [query, setQuery] = useState('');
  const [empFilter, setEmpFilter] = useState('ALL');
  const [typeFilter, setTypeFilter] = useState('ALL');
  const [sortOrder, setSortOrder] = useState('new');

  const load = async () => {
    const w = await api.walletSummary();
    setBalances(w.balances); setPassbook(w.passbook);
    const exp = await api.getExpenses();
    setPending(exp.filter((e) => e.status === 'Pending'));
  };
  useEffect(() => { load(); }, []);

  const updateStatus = async (id, status) => { await api.updateExpenseStatus(id, status); load(); alert(`Transaction status updated to ${status}!`); };

  const me = balances.find((b) => b.name === user.name) || { name: user.name, role: user.role, walletLimit: 0, calculatedWallet: 0 };

  // Running balance per employee (chronological, oldest -> newest).
  // Applies credits (+) and approved debits (-); skips Pending/Rejected.
  const balMap = new Map();
  const runningByEmp = {};
  [...passbook].reverse().forEach((p) => {
    const active = !p.status || p.status === 'Approved';
    const prev = runningByEmp[p.empName] || 0;
    const delta = active ? (p.type === 'Credit' ? Number(p.amount || 0) : -Number(p.amount || 0)) : 0;
    const bal = prev + delta;
    runningByEmp[p.empName] = bal;
    balMap.set(p, bal);
  });

  const q = query.toLowerCase();
  const filtered = passbook.filter((p) => {
    const ms = (p.empName + p.particulars).toLowerCase().includes(q);
    const me2 = empFilter === 'ALL' || p.empName === empFilter;
    const mt = typeFilter === 'ALL' || p.type === typeFilter;
    return ms && me2 && mt;
  });
  filtered.sort((a, b) => {
    const da = new Date(a.date).getTime(), db = new Date(b.date).getTime();
    return sortOrder === 'new' ? db - da : da - db;
  });
  const statusClass = (s) => s === 'Pending' ? 'status-pending' : s === 'Rejected' ? 'status-rejected' : 'status-approved';

  const printSheet = () => {
    const rows = filtered.map((p, i) => `<tr><td>${i + 1}</td><td>${fmtDate(p.date)}</td><td>${p.empName}</td><td>${p.type}</td><td>${p.particulars}</td><td>${inr(p.amount)}</td><td>${inr(balMap.get(p) || 0)}</td><td>${p.status || 'Approved'}</td></tr>`).join('');
    const who = empFilter === 'ALL' ? 'All Employees' : empFilter;
    const body = `
      <div class="doc-head">
        <div><div class="firm-name">Chaudhary Tiles &amp; Pavers</div>
        <div class="firm-sub">Employee Wallet Passbook • ${who}</div></div>
        <div class="doc-title">WALLET PASSBOOK</div>
      </div>
      <table><thead><tr><th>S.No</th><th>Date</th><th>Employee</th><th>Type</th><th>Particulars</th><th>Amount</th><th>Balance</th><th>Status</th></tr></thead>
      <tbody>${rows || '<tr><td colspan="8" style="text-align:center">No records</td></tr>'}</tbody></table>
      <div class="foot"><div>Generated on ${fmtDate(todayStr())}</div><div class="sign">Authorised Signatory</div></div>`;
    printDocument('Wallet Passbook', body);
  };

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
          <select value={sortOrder} onChange={(e) => setSortOrder(e.target.value)}><option value="new">Date: New to Old</option><option value="old">Date: Old to New</option></select>
          <button className="btn-export" onClick={printSheet}><i className="fa fa-print"></i> Print Sheet</button>
        </div>
        <table>
          <thead><tr><th>S.No</th><th>Date</th><th>Employee Name</th><th>Type</th><th>Particulars / Source</th><th>Amount (Rs)</th><th>Balance (Rs)</th><th>Status</th></tr></thead>
          <tbody>
            {filtered.map((p, i) => (
              <tr key={i}>
                <td>{i + 1}</td><td>{p.date}</td><td><strong>{p.empName}</strong></td>
                <td><span className={p.type === 'Credit' ? 'type-credit' : 'type-debit'}>{p.type}</span></td>
                <td>{p.particulars}</td>
                <td><strong className={p.type === 'Credit' ? 'type-credit' : 'type-debit'}>{inr(p.amount)}</strong></td>
                <td><strong style={{ color: (balMap.get(p) || 0) >= 0 ? '#0b1f3a' : '#dc3545' }}>{inr(balMap.get(p) || 0)}</strong></td>
                <td><span className={`status-badge ${statusClass(p.status)}`}>{p.status || 'Approved'}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Layout>
  );
}
