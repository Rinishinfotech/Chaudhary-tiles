import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import { useAuth } from '../context/AuthContext';
import { api, inr, fmtDate, todayStr } from '../api';

const STATUS_PRIORITY = { 'Under Working': 1, Pending: 2, Completed: 3, Cancel: 4 };
const statusClass = (s) => ({ Completed: 'st-completed', Pending: 'st-pending', Cancel: 'st-cancel' }[s] || 'st-working');

export default function PartyManagement() {
  const { isAdmin } = useAuth();
  const [parties, setParties] = useState([]);
  const [query, setQuery] = useState('');
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState(null);
  const [imgView, setImgView] = useState(null);
  const [statusSort, setStatusSort] = useState(null); // null | 'asc' | 'desc'

  const load = async () => setParties(await api.getParties());
  useEffect(() => { load(); }, []);

  const openAdd = () => {
    if (!isAdmin) { alert('Access Denied! Only Admins can add parties.'); return; }
    setForm({ date: todayStr(), name: '', contact: '', address: '', rateText: '', status: 'Under Working', paymentType: 'Due', amount: '', img: '' });
    setModal(true);
  };
  const openEdit = (p) => { setForm({ ...p }); setModal(true); };

  const onImg = (e) => {
    const file = e.target.files[0];
    if (file) { const r = new FileReader(); r.onloadend = () => setForm((f) => ({ ...f, img: r.result })); r.readAsDataURL(file); }
  };

  const save = async (e) => {
    e.preventDefault();
    const payload = { date: form.date, name: form.name, contact: form.contact, address: form.address, rateText: form.rateText, status: form.status, paymentType: form.paymentType, amount: Number(form.amount || 0), img: form.img || '' };
    if (form.id) await api.updateParty(form.id, payload); else await api.addParty(payload);
    setModal(false); load();
  };
  const del = async (id) => { if (window.confirm('Kya aap sach me is party entry ko delete karna chahte hain?')) { await api.deleteParty(id); load(); } };

  const q = query.toLowerCase();
  const CLICK_ORDER = { Completed: 1, Pending: 2, 'Under Working': 3, Cancel: 4 };
  const filtered = parties.filter((p) => (p.name || '').toLowerCase().includes(q) || (p.contact || '').includes(query) || (p.address || '').toLowerCase().includes(q))
    .sort((a, b) => {
      if (statusSort) {
        const diff = (CLICK_ORDER[a.status] || 99) - (CLICK_ORDER[b.status] || 99);
        return statusSort === 'asc' ? diff : -diff;
      }
      return (STATUS_PRIORITY[a.status] || 99) - (STATUS_PRIORITY[b.status] || 99);
    });
  const toggleStatusSort = () => setStatusSort((s) => (s === 'asc' ? 'desc' : 'asc'));
  const totalDue = parties.filter((p) => p.paymentType === 'Due').reduce((s, p) => s + Number(p.amount || 0), 0);
  const totalAdv = parties.filter((p) => p.paymentType === 'Advance').reduce((s, p) => s + Number(p.amount || 0), 0);

  return (
    <Layout searchPlaceholder="Search Party name, contact number, site address..." onSearch={setQuery}>
      <div className="summary-cards">
        <div className="summary-card due-card"><p><i className="fa fa-circle-exclamation" style={{ color: '#dc3545' }}></i> TOTAL DUE AMOUNT</p><h3>{inr(totalDue)}</h3></div>
        <div className="summary-card adv-card"><p><i className="fa fa-circle-check" style={{ color: '#059669' }}></i> TOTAL ADVANCE RECEIVED</p><h3>{inr(totalAdv)}</h3></div>
      </div>
      <div className="page-title">
        <h2><i className="fa fa-user-group" style={{ color: '#ffc107' }}></i> Party & Client Management</h2>
        {isAdmin && <button className="btn-add" onClick={openAdd}><i className="fa fa-plus"></i> Add New Party</button>}
      </div>

      <div className="card-table">
        <table>
          <thead><tr>
            <th>S.No</th><th>Date</th><th>Order Img</th><th>Party Name</th><th>Contact</th><th>Site Address</th>
            <th>Rate / Details</th>
            <th onClick={toggleStatusSort} style={{ cursor: 'pointer', userSelect: 'none' }} title="Click to sort by status (Completed → Pending → Under Working)">
              Site Status <i className={`fa ${statusSort === 'asc' ? 'fa-sort-down' : statusSort === 'desc' ? 'fa-sort-up' : 'fa-sort'}`} style={{ color: '#ffc107', marginLeft: 4 }}></i>
            </th>
            <th>Payment Balance</th>{isAdmin && <th>Action</th>}
          </tr></thead>
          <tbody>
            {filtered.length === 0 && <tr><td colSpan={isAdmin ? 10 : 9} style={{ textAlign: 'center', padding: 25, color: '#888' }}>No matching party records found.</td></tr>}
            {filtered.map((p, i) => (
              <tr key={p.id}>
                <td>{i + 1}</td>
                <td><small style={{ fontWeight: 600, color: '#444' }}>{fmtDate(p.date)}</small></td>
                <td>{p.img ? <img src={p.img} className="img-preview" alt="order" onClick={() => setImgView(p.img)} /> : <span style={{ fontSize: 11, color: '#aaa' }}>No Img</span>}</td>
                <td><strong>{p.name}</strong></td>
                <td>{p.contact}</td>
                <td>{p.address}</td>
                <td><small style={{ color: '#4b5563' }}>{p.rateText}</small></td>
                <td><span className={`status-badge ${statusClass(p.status)}`}>{p.status}</span></td>
                <td><span className={p.paymentType === 'Advance' ? 'pay-badge-adv' : 'pay-badge-due'}>{p.paymentType}</span><br /><strong>{inr(p.amount)}</strong></td>
                {isAdmin && <td>
                  <button className="action-btn" onClick={() => openEdit(p)}><i className="fa fa-pen-to-square"></i></button>
                  <button className="action-btn delete" onClick={() => del(p.id)}><i className="fa fa-trash"></i></button>
                </td>}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {modal && form && (
        <div className="modal-overlay" onClick={() => setModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3><i className="fa fa-user-plus" style={{ color: '#ffc107' }}></i> {form.id ? 'Edit Party Details' : 'Add New Party'}</h3>
              <i className="fa fa-xmark modal-close" onClick={() => setModal(false)}></i>
            </div>
            <form onSubmit={save}>
              <div className="form-grid">
                <div className="form-group"><label>Date *</label><input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} required /></div>
                <div className="form-group"><label>Party Name *</label><input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required /></div>
                <div className="form-group"><label>Contact Number *</label><input value={form.contact} onChange={(e) => setForm({ ...form, contact: e.target.value })} required /></div>
                <div className="form-group full"><label>Site Address *</label><input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} required /></div>
                <div className="form-group full"><label>Rate Details *</label><textarea rows="2" value={form.rateText} onChange={(e) => setForm({ ...form, rateText: e.target.value })} required /></div>
                <div className="form-group"><label>Site Status *</label><select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}><option>Under Working</option><option>Completed</option><option>Pending</option><option>Cancel</option></select></div>
                <div className="form-group"><label>Payment Type *</label><select value={form.paymentType} onChange={(e) => setForm({ ...form, paymentType: e.target.value })}><option value="Due">Due Amount</option><option value="Advance">Advance Received</option></select></div>
                <div className="form-group full"><label>Amount (Rs) *</label><input type="number" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} min="0" required /></div>
                <div className="form-group full"><label>Order Attachment / Image</label><input type="file" accept="image/*" onChange={onImg} />
                  {form.img && <img src={form.img} alt="preview" style={{ marginTop: 8, maxWidth: 140, maxHeight: 140, borderRadius: 8, border: '1px solid #cbd5e1', cursor: 'pointer' }} onClick={() => setImgView(form.img)} />}
                </div>
              </div>
              <button type="submit" className="btn-submit">Submit & Save Party</button>
            </form>
          </div>
        </div>
      )}

      {imgView && (
        <div className="modal-overlay" onClick={() => setImgView(null)}>
          <div className="modal" style={{ maxWidth: 620, textAlign: 'center' }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3><i className="fa fa-image" style={{ color: '#ffc107' }}></i> Order Image Preview</h3>
              <i className="fa fa-xmark modal-close" onClick={() => setImgView(null)}></i>
            </div>
            <img src={imgView} alt="order full" style={{ maxWidth: '100%', maxHeight: '65vh', borderRadius: 8, border: '1px solid #cbd5e1' }} />
            <a href={imgView} download="party_order_image.png" className="btn-submit" style={{ display: 'inline-block', textDecoration: 'none', marginTop: 15 }}><i className="fa fa-download"></i> Download Image</a>
          </div>
        </div>
      )}
    </Layout>
  );
}
