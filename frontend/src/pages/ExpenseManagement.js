import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import { useAuth } from '../context/AuthContext';
import { api, inr, todayStr, printDocument, fmtDate } from '../api';

export default function ExpenseManagement() {
  const { user, isAdmin } = useAuth();
  const [expenses, setExpenses] = useState([]);
  const [team, setTeam] = useState([]);
  const [categories, setCategories] = useState([]);
  const [query, setQuery] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [sortOrder, setSortOrder] = useState('new');
  const [expModal, setExpModal] = useState(false);
  const [trModal, setTrModal] = useState(false);
  const [catModal, setCatModal] = useState(false);
  const [form, setForm] = useState({ date: todayStr(), spentBy: '', category: '', amount: '', remarks: '' });
  const [tr, setTr] = useState({ fromEmp: '', toEmp: '', amount: '', note: '' });
  const [newCat, setNewCat] = useState('');

  const load = async () => {
    setExpenses(await api.getExpenses());
    setTeam(await api.getTeam());
    setCategories(await api.getCategories());
  };
  useEffect(() => { load(); }, []);

  const openExp = () => {
    setForm({ date: todayStr(), spentBy: isAdmin ? (team[0]?.name || '') : user.name, category: categories[0]?.name || '', amount: '', remarks: '' });
    setExpModal(true);
  };
  const openTr = () => { setTr({ fromEmp: isAdmin ? (team[0]?.name || '') : user.name, toEmp: team[1]?.name || '', amount: '', note: '' }); setTrModal(true); };

  const saveExp = async (e) => {
    e.preventDefault();
    await api.addExpense({ date: form.date, spentBy: form.spentBy, category: form.category, amount: Number(form.amount), remarks: form.remarks, status: 'Approved' });
    setExpModal(false); load(); alert('Expense recorded successfully!');
  };
  const saveTr = async (e) => {
    e.preventDefault();
    if (tr.fromEmp === tr.toEmp) { alert('Sender and Receiver cannot be the same person!'); return; }
    await api.transfer({ fromEmp: tr.fromEmp, toEmp: tr.toEmp, amount: Number(tr.amount), note: tr.note });
    setTrModal(false); load(); alert(`${inr(tr.amount)} transferred successfully!`);
  };
  const addCat = async (e) => { e.preventDefault(); try { await api.addCategory(newCat); setNewCat(''); load(); } catch (err) { alert(err?.response?.data?.detail || 'Error'); } };
  const delCat = async (id) => { if (window.confirm('Delete this category?')) { await api.deleteCategory(id); load(); } };

  const q = query.toLowerCase();
  const filtered = expenses.filter((e) => {
    const mq = (e.spentBy + e.category + (e.remarks || '')).toLowerCase().includes(q);
    let md = true; if (fromDate) md = md && e.date >= fromDate; if (toDate) md = md && e.date <= toDate;
    return mq && md;
  });
  filtered.sort((a, b) => {
    const da = new Date(a.date).getTime(), db = new Date(b.date).getTime();
    return sortOrder === 'new' ? db - da : da - db;
  });
  const total = filtered.reduce((s, e) => s + Number(e.amount || 0), 0);

  const printSheet = () => {
    const rows = filtered.map((e, i) => `<tr><td>${i + 1}</td><td>${fmtDate(e.date)}</td><td>${e.spentBy}</td><td>${e.category === 'Wallet Fund Transfer' ? 'Transfer to: ' + (e.paidTo || '-') : e.category}</td><td>${inr(e.amount)}</td><td>${e.remarks || '-'}</td></tr>`).join('');
    const range = (fromDate || toDate) ? `${fromDate ? fmtDate(fromDate) : 'Start'} to ${toDate ? fmtDate(toDate) : 'Today'}` : 'All Dates';
    const body = `
      <div class="doc-head">
        <div><div class="firm-name">Chaudhary Tiles & Pavers</div>
        <div class="firm-sub">Expense Sheet Report • Period: ${range}</div></div>
        <div class="doc-title">EXPENSE SHEET</div>
      </div>
      <table><thead><tr><th>S.No</th><th>Date</th><th>Spent By / Sender</th><th>Category / Recipient</th><th>Amount</th><th>Remarks</th></tr></thead>
      <tbody>${rows || '<tr><td colspan="6" style="text-align:center">No records</td></tr>'}</tbody></table>
      <div class="total-row">Total Expense: ${inr(total)}</div>
      <div class="foot"><div>Generated on ${fmtDate(todayStr())}</div><div class="sign">Authorised Signatory</div></div>`;
    printDocument('Expense Sheet', body);
  };

  return (
    <Layout searchPlaceholder="Search Expense by Employee, Category or Remarks..." onSearch={setQuery}>
      <div className="page-title">
        <h2><i className="fa fa-money-bill-wave" style={{ color: '#ffc107' }}></i> Expense Logs & Transfers</h2>
        <div className="btn-group-head">
          {isAdmin && <button className="btn-add btn-secondary" onClick={() => setCatModal(true)}><i className="fa fa-list-check"></i> Categories</button>}
          <button className="btn-add btn-transfer" onClick={openTr}><i className="fa fa-arrow-right-arrow-left"></i> Inter-Wallet Transfer</button>
          <button className="btn-add" onClick={openExp}><i className="fa fa-plus"></i> Record Expense</button>
        </div>
      </div>

      <div className="filter-card">
        <div className="filter-group"><label>From:</label><input type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} /></div>
        <div className="filter-group"><label>To:</label><input type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} /></div>
        <button className="btn-filter-reset" onClick={() => { setFromDate(''); setToDate(''); }}><i className="fa fa-rotate"></i> Reset</button>
        <div className="filter-group"><label><i className="fa fa-arrow-down-wide-short" style={{ color: '#0b1f3a' }}></i> Sort By:</label>
          <select value={sortOrder} onChange={(e) => setSortOrder(e.target.value)}>
            <option value="new">Date: New to Old</option>
            <option value="old">Date: Old to New</option>
          </select>
        </div>
        <button className="btn-export" onClick={printSheet}><i className="fa fa-print"></i> Print Sheet</button>
        <div className="summary-badge">Total Expense: {inr(total)}</div>
      </div>

      <div className="card-table">
        <table>
          <thead><tr><th>S.No</th><th>Date</th><th>Spent By / Sender</th><th>Category / Recipient</th><th>Amount Spent</th><th>Remarks</th></tr></thead>
          <tbody>
            {filtered.map((e, i) => (
              <tr key={e.id}>
                <td>{i + 1}</td><td>{fmtDate(e.date)}</td><td><strong>{e.spentBy}</strong></td>
                <td><span className="cat-badge">{e.category === 'Wallet Fund Transfer' ? `Transfer to: ${e.paidTo || '-'}` : e.category}</span></td>
                <td><strong style={{ color: '#dc3545' }}>{inr(e.amount)}</strong></td><td>{e.remarks || '-'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {expModal && (
        <div className="modal-overlay" onClick={() => setExpModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header"><h3><i className="fa fa-receipt" style={{ color: '#ffc107' }}></i> Record Expense</h3><i className="fa fa-xmark modal-close" onClick={() => setExpModal(false)}></i></div>
            <form onSubmit={saveExp}>
              <div className="form-grid">
                <div className="form-group"><label>Date</label><input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} required disabled={!isAdmin} /></div>
                <div className="form-group"><label>Paid From Wallet (Employee)</label><select value={form.spentBy} onChange={(e) => setForm({ ...form, spentBy: e.target.value })} disabled={!isAdmin} required>{team.map((t) => <option key={t.id} value={t.name}>{t.name}</option>)}</select></div>
                <div className="form-group"><label>Expense Category</label><select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} required>{categories.map((c) => <option key={c.id} value={c.name}>{c.name}</option>)}</select></div>
                <div className="form-group"><label>Amount Spent (Rs)</label><input type="number" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} required min="1" /></div>
                <div className="form-group full"><label>Remarks / Detail Note</label><input value={form.remarks} onChange={(e) => setForm({ ...form, remarks: e.target.value })} /></div>
              </div>
              <button type="submit" className="btn-submit">Deduct & Save Expense</button>
            </form>
          </div>
        </div>
      )}

      {trModal && (
        <div className="modal-overlay" onClick={() => setTrModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header"><h3><i className="fa fa-arrow-right-arrow-left" style={{ color: '#059669' }}></i> Inter-Employee Wallet Transfer</h3><i className="fa fa-xmark modal-close" onClick={() => setTrModal(false)}></i></div>
            <form onSubmit={saveTr}>
              <div className="form-grid">
                <div className="form-group"><label>Sender (From Wallet)</label><select value={tr.fromEmp} onChange={(e) => setTr({ ...tr, fromEmp: e.target.value })} disabled={!isAdmin} required>{team.map((t) => <option key={t.id} value={t.name}>{t.name}</option>)}</select></div>
                <div className="form-group"><label>Receiver (To Wallet)</label><select value={tr.toEmp} onChange={(e) => setTr({ ...tr, toEmp: e.target.value })} required>{team.map((t) => <option key={t.id} value={t.name}>{t.name}</option>)}</select></div>
                <div className="form-group"><label>Transfer Amount (Rs)</label><input type="number" value={tr.amount} onChange={(e) => setTr({ ...tr, amount: e.target.value })} required min="1" /></div>
                <div className="form-group"><label>Transfer Note</label><input value={tr.note} onChange={(e) => setTr({ ...tr, note: e.target.value })} required /></div>
              </div>
              <button type="submit" className="btn-submit" style={{ background: '#059669', color: 'white' }}>Transfer Wallet Funds</button>
            </form>
          </div>
        </div>
      )}

      {catModal && (
        <div className="modal-overlay" onClick={() => setCatModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header"><h3><i className="fa fa-list-check" style={{ color: '#2563eb' }}></i> Manage Expense Categories</h3><i className="fa fa-xmark modal-close" onClick={() => setCatModal(false)}></i></div>
            <form onSubmit={addCat}>
              <div style={{ display: 'flex', gap: 10, marginBottom: 15 }}>
                <input placeholder="Enter New Category Name" value={newCat} onChange={(e) => setNewCat(e.target.value)} required style={{ flex: 1, padding: 10, border: '1px solid #dcdfe6', borderRadius: 8 }} />
                <button type="submit" style={{ background: '#2563eb', color: 'white', border: 'none', padding: '10px 16px', borderRadius: 8, fontWeight: 600, cursor: 'pointer' }}>Add</button>
              </div>
            </form>
            <ul style={{ listStyle: 'none' }}>
              {categories.map((c) => (
                <li key={c.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', borderBottom: '1px solid #f3f4f6', fontSize: 13 }}>
                  <span>{c.name}</span>
                  <button onClick={() => delCat(c.id)} style={{ color: '#ef4444', cursor: 'pointer', padding: '4px 8px', border: 'none', background: '#fee2e2', borderRadius: 4 }}><i className="fa fa-trash"></i> Delete</button>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </Layout>
  );
}
