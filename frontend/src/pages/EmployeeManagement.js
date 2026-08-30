import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import { useAuth } from '../context/AuthContext';
import { api, inr } from '../api';

const PERMS = [
  ['dispatch', 'Dispatch'], ['production', 'Production'], ['stock', 'Stock View'],
  ['dchallan', 'D-Challan'], ['receipt', 'Receipt'], ['expense', 'Expense'],
  ['party', 'Party View'], ['reports', 'Reports'], ['edit', 'Master Edit'],
];
const ROLES = ['Super Admin', 'Admin', 'Manager', 'Planner', 'Optivision', 'Viewer'];
const roleClass = (r) => ({ 'Super Admin': 'role-super', Admin: 'role-admin', Manager: 'role-manager', Planner: 'role-planner', Optivision: 'role-optivision' }[r] || 'role-viewer');

function autoPerms(role) {
  const sa = role === 'Super Admin' || role === 'Admin';
  const mgr = role === 'Manager', pl = role === 'Planner', op = role === 'Optivision';
  return {
    dispatch: sa || mgr || pl || op, production: sa || mgr || pl || op, stock: true,
    dchallan: sa || mgr || pl || op, receipt: sa || mgr, expense: sa || mgr,
    party: sa || mgr || pl, reports: sa || mgr || pl, edit: sa,
  };
}

export default function EmployeeManagement() {
  const { user, isAdmin } = useAuth();
  const [team, setTeam] = useState([]);
  const [wallets, setWallets] = useState({});
  const [query, setQuery] = useState('');
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState(null);

  const load = async () => {
    const t = await api.getTeam();
    setTeam(t);
    try {
      const w = await api.walletSummary();
      const map = {}; w.balances.forEach((b) => { map[b.name] = b.calculatedWallet; });
      setWallets(map);
    } catch (e) { /* ignore */ }
  };
  useEffect(() => { load(); }, []);

  const openAdd = () => {
    if (!isAdmin) { alert('Access Denied! Only Admins can manage employees.'); return; }
    setForm({ name: '', username: '', password: '1234', role: 'Manager', plant: 'Both Plants', walletLimit: 500, permissions: autoPerms('Manager') });
    setModal(true);
  };
  const openEdit = (emp) => { setForm({ ...emp, permissions: { ...emp.permissions } }); setModal(true); };

  const changeRole = (role) => setForm((f) => ({ ...f, role, permissions: autoPerms(role) }));

  const save = async (e) => {
    e.preventDefault();
    const payload = { name: form.name, username: form.username, password: form.password, role: form.role, plant: form.plant, walletLimit: Number(form.walletLimit), permissions: form.permissions };
    if (form.id) await api.updateTeam(form.id, payload); else await api.addTeam(payload);
    setModal(false); load();
    alert('Employee Job Role & Daily Wallet Limit saved successfully!');
  };

  const del = async (id) => {
    if (window.confirm('Kya aap sach me is employee ko system se hatana chahte hain?')) { await api.deleteTeam(id); load(); }
  };

  const filtered = team.filter((e) => (e.name + e.role + (e.username || '')).toLowerCase().includes(query.toLowerCase()));

  return (
    <Layout searchPlaceholder="Search Employee by name or role..." onSearch={setQuery}>
      <div className="page-title">
        <h2><i className="fa fa-users" style={{ color: '#ffc107' }}></i> Employee Roles & Daily Wallet Limits</h2>
        {isAdmin && <button className="btn-add" onClick={openAdd}><i className="fa fa-plus"></i> Add New Employee</button>}
      </div>

      <div className="card-table">
        <table>
          <thead><tr>
            <th>S.No</th><th>Employee Name</th><th>Designated Role</th><th>Assigned Plant</th>
            <th>Daily Wallet Limit</th><th>Current Balance</th><th>Access Rights</th>{isAdmin && <th>Action</th>}
          </tr></thead>
          <tbody>
            {filtered.map((emp, i) => {
              const hide = emp.role === 'Super Admin' && !isAdmin;
              return (
                <tr key={emp.id}>
                  <td>{i + 1}</td>
                  <td><strong>{emp.name}</strong><br /><small style={{ color: '#666' }}>@{emp.username || 'user'}</small></td>
                  <td><span className={`role-badge ${roleClass(emp.role)}`}>{emp.role}</span></td>
                  <td>{emp.plant}</td>
                  <td><strong>{hide ? '******' : inr(emp.walletLimit) + '/Day'}</strong></td>
                  <td><span style={{ color: '#059669', fontWeight: 600 }}>{hide ? '******' : inr(wallets[emp.name] || 0)}</span></td>
                  <td><small style={{ color: '#059669' }}>Custom Access Active</small></td>
                  {isAdmin && <td>
                    <button className="action-btn" onClick={() => openEdit(emp)}><i className="fa fa-pen-to-square"></i> Edit</button>
                    <button className="action-btn delete" onClick={() => del(emp.id)}><i className="fa fa-trash"></i></button>
                  </td>}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {modal && form && (
        <div className="modal-overlay" onClick={() => setModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3><i className="fa fa-user-gear" style={{ color: '#ffc107' }}></i> {form.id ? 'Edit Employee Profile' : 'Add New Employee'}</h3>
              <i className="fa fa-xmark modal-close" onClick={() => setModal(false)}></i>
            </div>
            <form onSubmit={save}>
              <div className="form-grid">
                <div className="form-group"><label>Employee Name *</label><input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required /></div>
                <div className="form-group"><label>User Login ID / Phone *</label><input value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} required /></div>
                <div className="form-group"><label>Login Password *</label><input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required /></div>
                <div className="form-group"><label>Role Privilege *</label>
                  <select value={form.role} onChange={(e) => changeRole(e.target.value)}>{ROLES.map((r) => <option key={r}>{r}</option>)}</select>
                </div>
                <div className="form-group"><label>Assigned Plant Location *</label>
                  <select value={form.plant} onChange={(e) => setForm({ ...form, plant: e.target.value })}>
                    <option>Both Plants</option><option>Sipara</option><option>Nandlal Chhapra</option>
                  </select>
                </div>
                <div className="form-group"><label>Daily Wallet Limit (Rs/Day) *</label><input type="number" value={form.walletLimit} onChange={(e) => setForm({ ...form, walletLimit: e.target.value })} min="0" required /></div>
              </div>
              <div className="permissions-section">
                <h4>Granular Module Access Checklist</h4>
                <div className="perm-grid">
                  {PERMS.map(([key, label]) => (
                    <label className="perm-item" key={key}>
                      <input type="checkbox" checked={!!form.permissions[key]} onChange={(e) => setForm({ ...form, permissions: { ...form.permissions, [key]: e.target.checked } })} /> {label}
                    </label>
                  ))}
                </div>
              </div>
              <button type="submit" className="btn-submit">Save Employee Profile</button>
            </form>
          </div>
        </div>
      )}
    </Layout>
  );
}
