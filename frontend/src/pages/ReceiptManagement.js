import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import { useAuth } from '../context/AuthContext';
import { api, inr, todayStr, printDocument, fmtDate } from '../api';

const modeClass = (m) => m === 'Cash' ? 'mode-cash' : (m || '').includes('Cheque') ? 'mode-cheque' : 'mode-upi';
const CONTRACTORS = ['Sipara Contractor Ledger', 'Nandlal Chhapra Contractor Ledger', 'Cement / Raw Material Supplier', 'Transport / Freight Contractor'];
const EXPENSE_HEADS = ['Plant Maintenance Expense', 'Diesel & Generator Fuel', 'Electricity & Utility Bills', 'Office & Miscellaneous Expense'];

export default function ReceiptManagement() {
  const { isAdmin } = useAuth();
  const [receipts, setReceipts] = useState([]);
  const [parties, setParties] = useState([]);
  const [team, setTeam] = useState([]);
  const [query, setQuery] = useState('');
  const [timePeriod, setTimePeriod] = useState('all');
  const [route, setRoute] = useState('all');
  const [sortOrder, setSortOrder] = useState('new');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState(null);
  const [partySearch, setPartySearch] = useState('');

  const [firm, setFirm] = useState({});

  const load = async () => {
    setReceipts(await api.getReceipts());
    setParties(await api.getParties());
    setTeam(await api.getTeam());
    setFirm(await api.getFirm());
  };
  useEffect(() => { load(); }, []);

  const printReceipt = (r) => {
    const body = `
      <div class="doc-head">
        <div><div class="firm-name">${firm.name || 'Chaudhary Tiles'}</div>
        <div class="firm-sub">${firm.address || ''}<br/>Phone: ${firm.phone || ''} ${firm.gst ? '| GSTIN: ' + firm.gst : ''}</div></div>
        <div class="doc-title">RECEIPT VOUCHER</div>
      </div>
      <div class="meta">
        <div><span>Voucher No</span>${r.srNo}</div>
        <div><span>Date</span>${fmtDate(r.date)}</div>
        <div><span>Received From (Party)</span>${r.party}</div>
        <div><span>Payment Mode</span>${r.mode}</div>
        <div><span>Routed To</span>${r.receiver}</div>
        <div><span>Category</span>${r.receiverType}</div>
      </div>
      <table><thead><tr><th>Description</th><th>Amount</th></tr></thead>
      <tbody><tr><td>Payment received from ${r.party}${r.remarks ? ' — ' + r.remarks : ''}</td><td>${inr(r.amount)}</td></tr></tbody></table>
      <div class="total-row">Total Received: ${inr(r.amount)}</div>
      <div class="foot"><div>Thank you for your business.</div><div class="sign">Authorised Signatory</div></div>`;
    printDocument('Receipt ' + r.srNo, body);
  };

  const receiverOptions = (type) => type === 'Employee' ? team.map((t) => `${t.name}`)
    : type === 'Supplier / Creditor / Contractor' ? CONTRACTORS : EXPENSE_HEADS;

  const openAdd = () => {
    const firstParty = parties[0]?.name || '';
    setForm({ date: todayStr(), party: firstParty, amount: '', mode: 'UPI / Online', receiverType: 'Employee', receiver: team[0]?.name || '', remarks: '' });
    setPartySearch('');
    setModal(true);
  };
  const openEdit = (r) => { setForm({ ...r }); setPartySearch(''); setModal(true); };
  const changeType = (type) => setForm((f) => ({ ...f, receiverType: type, receiver: receiverOptions(type)[0] || '' }));

  const save = async (e) => {
    e.preventDefault();
    if (!form.party) { alert('Kripya ek party choose karein!'); return; }
    const payload = { date: form.date, party: form.party, amount: Number(form.amount), mode: form.mode, receiverType: form.receiverType, receiver: form.receiver, remarks: form.remarks };
    if (form.id) await api.updateReceipt(form.id, payload); else await api.addReceipt(payload);
    setModal(false); load();
    alert('Receipt Voucher successfully saved and ledgers updated!');
  };
  const del = async (id) => { if (window.confirm('Kya aap is Receipt entry ko remove karna chahte hain?')) { await api.deleteReceipt(id); load(); } };

  const now = new Date();
  const filtered = receipts.filter((r) => {
    const mq = (r.srNo + r.party + r.receiver).toLowerCase().includes(query.toLowerCase());
    const mr = route === 'all' || r.receiverType === route;
    let mt = true; const rd = new Date(r.date);
    if (timePeriod === 'today') mt = r.date === todayStr();
    else if (timePeriod === 'week') { const w = new Date(now); w.setDate(now.getDate() - 7); mt = rd >= w && rd <= now; }
    else if (timePeriod === 'month') mt = rd.getMonth() === now.getMonth() && rd.getFullYear() === now.getFullYear();
    else if (timePeriod === 'year') mt = rd.getFullYear() === now.getFullYear();
    else if (timePeriod === 'custom' && fromDate && toDate) mt = r.date >= fromDate && r.date <= toDate;
    return mq && mr && mt;
  });
  filtered.sort((a, b) => {
    const da = new Date(a.date).getTime(), db = new Date(b.date).getTime();
    return sortOrder === 'new' ? db - da : da - db;
  });
  const periodTotal = filtered.reduce((s, r) => s + Number(r.amount || 0), 0);
  const visibleParties = parties.filter((p) => p.name.toLowerCase().includes(partySearch.toLowerCase()));

  return (
    <Layout searchPlaceholder="Search Voucher, Party or Receiver..." onSearch={setQuery}>
      <div className="page-title">
        <h2><i className="fa fa-wallet" style={{ color: '#ffc107' }}></i> Receipt Voucher Register</h2>
        {isAdmin && <button className="btn-add" onClick={openAdd}><i className="fa fa-plus"></i> Create Receipt</button>}
      </div>

      <div className="filter-card">
        <div className="filter-group"><label><i className="fa fa-filter" style={{ color: '#0b1f3a' }}></i> Time Period:</label>
          <select value={timePeriod} onChange={(e) => setTimePeriod(e.target.value)}>
            <option value="all">All Time</option><option value="today">Today</option><option value="week">This Week</option><option value="month">This Month</option><option value="year">This Year</option><option value="custom">Custom Date Range</option>
          </select>
        </div>
        {timePeriod === 'custom' && <div className="filter-group">
          <label>From:</label><input type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} />
          <label>To:</label><input type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} />
        </div>}
        <div className="filter-group"><label>Receiver Route:</label>
          <select value={route} onChange={(e) => setRoute(e.target.value)}>
            <option value="all">All Routes</option><option value="Employee">Employee Wallet</option><option value="Supplier / Creditor / Contractor">Supplier / Contractor</option><option value="Direct Expense">Direct Expenses</option>
          </select>
        </div>
        <div className="filter-group"><label><i className="fa fa-arrow-down-wide-short" style={{ color: '#0b1f3a' }}></i> Sort By:</label>
          <select value={sortOrder} onChange={(e) => setSortOrder(e.target.value)}>
            <option value="new">Date: New to Old</option>
            <option value="old">Date: Old to New</option>
          </select>
        </div>
        <div className="summary-badge">Total Received: {inr(periodTotal)}</div>
      </div>

      <div className="card-table">
        <table>
          <thead><tr><th>S.R. No</th><th>Date</th><th>Party Name</th><th>Received Amount</th><th>Payment Mode</th><th>Received By</th><th>Category Route</th><th>Remarks</th>{isAdmin && <th>Action</th>}</tr></thead>
          <tbody>
            {filtered.map((r) => (
              <tr key={r.id}>
                <td><strong>{r.srNo}</strong></td><td>{fmtDate(r.date)}</td><td><strong>{r.party}</strong></td>
                <td><strong style={{ color: '#059669' }}>{inr(r.amount)}</strong></td>
                <td><span className={`mode-badge ${modeClass(r.mode)}`}>{r.mode}</span></td>
                <td>{r.receiver}</td><td><small className="cat-badge">{r.receiverType}</small></td><td>{r.remarks || '-'}</td>
                {isAdmin && <td>
                  <button className="action-btn" onClick={() => printReceipt(r)} title="Print / PDF"><i className="fa fa-print"></i></button>
                  <button className="action-btn" onClick={() => openEdit(r)}><i className="fa fa-pen-to-square"></i></button>
                  <button className="action-btn delete" onClick={() => del(r.id)}><i className="fa fa-trash"></i></button>
                </td>}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {modal && form && (
        <div className="modal-overlay" onClick={() => setModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header"><h3><i className="fa fa-receipt" style={{ color: '#ffc107' }}></i> {form.id ? 'Edit Receipt Voucher' : 'Create New Receipt Voucher'}</h3><i className="fa fa-xmark modal-close" onClick={() => setModal(false)}></i></div>
            <form onSubmit={save}>
              <div className="form-grid">
                <div className="form-group"><label>Date (Back-Date Supported)</label><input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} required /></div>
                <div className="form-group full"><label>Search & Select Party *</label>
                  <input placeholder="Type party name..." value={partySearch} onChange={(e) => setPartySearch(e.target.value)} style={{ marginBottom: 5 }} />
                  <select size="4" value={form.party} onChange={(e) => setForm({ ...form, party: e.target.value })} style={{ height: 100 }} required>
                    {visibleParties.map((p) => <option key={p.id} value={p.name}>{p.name} ({p.address || 'Patna'}) - Dues: {inr(p.dues || 0)}</option>)}
                  </select>
                </div>
                <div className="form-group"><label>Amount Received (Rs) *</label><input type="number" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} required min="1" /></div>
                <div className="form-group"><label>Payment Mode *</label><select value={form.mode} onChange={(e) => setForm({ ...form, mode: e.target.value })}><option value="UPI / Online">UPI / Online Transfer</option><option value="Cash">Cash</option><option value="Cheque / Bank">Cheque / Bank Transfer</option></select></div>
                <div className="form-group"><label>Receiver Type (Flow Route) *</label><select value={form.receiverType} onChange={(e) => changeType(e.target.value)}><option value="Employee">Employee (Credit to Wallet)</option><option value="Supplier / Creditor / Contractor">Supplier / Contractor (Auto Expense)</option><option value="Direct Expense">Expenses (Direct Costs)</option></select></div>
                <div className="form-group"><label>Receiver Name / Head *</label><select value={form.receiver} onChange={(e) => setForm({ ...form, receiver: e.target.value })} required>
                  {form.receiverType === 'Employee' ? team.map((t) => <option key={t.id} value={t.name}>{t.name} ({t.role})</option>) : receiverOptions(form.receiverType).map((o) => <option key={o} value={o}>{o}</option>)}
                </select></div>
                <div className="form-group full"><label>Remarks / Notes</label><input value={form.remarks} onChange={(e) => setForm({ ...form, remarks: e.target.value })} /></div>
              </div>
              <button type="submit" className="btn-submit">{form.id ? 'Update' : 'Submit'} Receipt Voucher</button>
            </form>
          </div>
        </div>
      )}
    </Layout>
  );
}
