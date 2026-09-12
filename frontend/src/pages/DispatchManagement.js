import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import { useAuth } from '../context/AuthContext';
import { api, todayStr } from '../api';

export default function DispatchManagement() {
  const { isAdmin } = useAuth();
  const [dispatches, setDispatches] = useState([]);
  const [parties, setParties] = useState([]);
  const [stock, setStock] = useState([]);
  const [query, setQuery] = useState('');
  const [modal, setModal] = useState(false);
  const [fulfill, setFulfill] = useState(null);
  const [view, setView] = useState(null);
  const [search, setSearch] = useState(null);
  const [searchQ, setSearchQ] = useState('');
  const [form, setForm] = useState(null);
  const [challanImg, setChallanImg] = useState('');
  const [challanNo, setChallanNo] = useState('');

  const itemNames = () => { const n = stock.map((s) => s.name); return n.length ? [...new Set(n)] : ['I-Shape (60mm)', 'Zig-Zag (80mm)', 'Hexagonal (60mm)', 'Cover Block', '3D Star Pattern']; };

  const load = async () => { setDispatches(await api.getDispatches()); setParties(await api.getParties()); setStock(await api.getStock()); };
  useEffect(() => { load(); }, []);

  const openAdd = () => { setForm({ date: todayStr(), plant: 'Sipara Plant', party: parties[0]?.name || 'General Party', vehicle: '', driver: '', items: [{ pattern: '', color: 'Red', qty: '' }] }); setModal(true); };
  const setItem = (i, k, v) => setForm((f) => ({ ...f, items: f.items.map((it, idx) => idx === i ? { ...it, [k]: v } : it) }));
  const addRow = () => setForm((f) => ({ ...f, items: [...f.items, { pattern: '', color: 'Red', qty: '' }] }));
  const rmRow = (i) => setForm((f) => f.items.length > 1 ? { ...f, items: f.items.filter((_, idx) => idx !== i) } : f);

  const save = async (e) => {
    e.preventDefault();
    const items = form.items.map((it) => ({ pattern: it.pattern, color: it.color, qty: parseInt(it.qty || 0) }));
    const totalQty = items.reduce((s, it) => s + it.qty, 0);
    await api.addDispatch({ date: form.date, plant: form.plant, party: form.party, vehicle: form.vehicle, driver: form.driver, items, totalQty, status: 'Pending Dispatch', challanNo: '', challanImg: '' });
    setModal(false); load(); alert('Loading Order saved!');
  };

  const onFile = (e) => { const f = e.target.files[0]; if (f) { const r = new FileReader(); r.onload = (ev) => setChallanImg(ev.target.result); r.readAsDataURL(f); } };
  const submitFulfill = async (e) => {
    e.preventDefault();
    if (!challanImg) { alert('Please upload the D-Challan photo copy!'); return; }
    await api.fulfillDispatch(fulfill, { challanNo, challanImg });
    setFulfill(null); setChallanImg(''); setChallanNo(''); load(); alert('Order marked DISPATCHED!');
  };
  const del = async (id) => { if (window.confirm('Delete this order?')) { await api.deleteDispatch(id); load(); } };

  const q = query.toLowerCase();
  const filtered = dispatches.filter((d) => (d.id + d.party + (d.challanNo || '') + d.vehicle).toLowerCase().includes(q));
  const searchResults = dispatches.filter((d) => d.challanImg && (d.party.toLowerCase().includes(searchQ.toLowerCase()) || (d.challanNo || '').toLowerCase().includes(searchQ.toLowerCase())));

  return (
    <Layout searchPlaceholder="Search Dispatch / Challan / Vehicle..." onSearch={setQuery}>
      <div className="page-title">
        <h2><i className="fa fa-truck" style={{ color: '#ffc107' }}></i> Tile Dispatch & D-Challan Portal</h2>
        <div className="btn-group">
          <button className="btn-add btn-secondary" onClick={() => { setSearch(true); setSearchQ(''); }}><i className="fa fa-file-invoice"></i> Search Party / Challan Photo</button>
          <button className="btn-add" onClick={openAdd}><i className="fa fa-plus"></i> Create Loading Order</button>
        </div>
      </div>

      <div className="card-table">
        <table>
          <thead><tr><th>Order / Date</th><th>Plant / Party</th><th>Vehicle & Driver</th><th>Tile Items</th><th>Total Pcs</th><th>D-Challan No</th><th>Status</th><th>Actions</th></tr></thead>
          <tbody>
            {filtered.map((d) => (
              <tr key={d.id}>
                <td><strong>{d.id.split('-').slice(0, 2).join('-')}</strong><br /><small>{d.date}</small></td>
                <td><strong>{d.party}</strong><br /><small style={{ color: '#666' }}>{d.plant}</small></td>
                <td>{d.vehicle}<br /><small style={{ color: '#666' }}>{d.driver}</small></td>
                <td>{d.items.map((it, i) => <small key={i}>&bull; {it.pattern} ({it.color}): <strong>{it.qty} Pcs</strong><br /></small>)}</td>
                <td><strong>{d.totalQty.toLocaleString()} Pcs</strong></td>
                <td><strong>{d.challanNo || '-'}</strong></td>
                <td><span className={`status-badge ${d.status === 'Dispatched' ? 'status-dispatched' : 'status-pending'}`}>{d.status}</span></td>
                <td>
                  {d.status === 'Pending Dispatch' && <button className="action-btn" onClick={() => { setFulfill(d.id); setChallanImg(''); setChallanNo(''); }}><i className="fa fa-truck-fast"></i> Dispatch</button>}
                  {d.challanImg && <button className="action-btn" onClick={() => setView(d)}><i className="fa fa-image"></i> Challan</button>}
                  {isAdmin && <button className="action-btn delete" onClick={() => del(d.id)}><i className="fa fa-trash"></i></button>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {modal && form && (
        <div className="modal-overlay" onClick={() => setModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header"><h3><i className="fa fa-truck-ramp-box" style={{ color: '#ffc107' }}></i> Create Loading & Dispatch Order</h3><i className="fa fa-xmark modal-close" onClick={() => setModal(false)}></i></div>
            <form onSubmit={save}>
              <div className="form-grid">
                <div className="form-group"><label>Order Date</label><input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} required /></div>
                <div className="form-group"><label>Plant Unit</label><select value={form.plant} onChange={(e) => setForm({ ...form, plant: e.target.value })}><option>Sipara Plant</option><option>Nandlal Chhapra Plant</option></select></div>
                <div className="form-group"><label>Select Party</label><select value={form.party} onChange={(e) => setForm({ ...form, party: e.target.value })} required>{parties.length ? parties.map((p) => <option key={p.id} value={p.name}>{p.name}</option>) : <option>General Party</option>}</select></div>
                <div className="form-group"><label>Vehicle Number</label><input value={form.vehicle} onChange={(e) => setForm({ ...form, vehicle: e.target.value })} placeholder="BR-01-GB-4512" required /></div>
                <div className="form-group"><label>Driver Name & Contact</label><input value={form.driver} onChange={(e) => setForm({ ...form, driver: e.target.value })} placeholder="Rajesh (9876543210)" required /></div>
              </div>
              <div className="items-entry-box">
                <div className="items-entry-header"><h5><i className="fa fa-cubes"></i> Tile Items & Color</h5><button type="button" className="btn-add-row" onClick={addRow}><i className="fa fa-plus"></i> Add Item</button></div>
                {form.items.map((it, i) => (
                  <div className="row-item" key={i}>
                    <input list="itemList" value={it.pattern} onChange={(e) => setItem(i, 'pattern', e.target.value)} placeholder="Search & Select Item..." required />
                    <select value={it.color} onChange={(e) => setItem(i, 'color', e.target.value)}><option>Red</option><option>Yellow</option><option>Grey</option><option>Black</option></select>
                    <input type="number" value={it.qty} onChange={(e) => setItem(i, 'qty', e.target.value)} placeholder="Pcs Qty" required min="1" />
                    <button type="button" className="btn-remove-row" onClick={() => rmRow(i)}><i className="fa fa-trash"></i></button>
                  </div>
                ))}
                <datalist id="itemList">{itemNames().map((n) => <option key={n} value={n} />)}</datalist>
              </div>
              <button type="submit" className="btn-submit">Save Order (Pending Dispatch)</button>
            </form>
          </div>
        </div>
      )}

      {fulfill && (
        <div className="modal-overlay" onClick={() => setFulfill(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header"><h3><i className="fa fa-file-circle-check" style={{ color: '#059669' }}></i> Complete Dispatch & D-Challan</h3><i className="fa fa-xmark modal-close" onClick={() => setFulfill(null)}></i></div>
            <form onSubmit={submitFulfill}>
              <div className="form-grid">
                <div className="form-group full"><label>Enter D-Challan Number</label><input value={challanNo} onChange={(e) => setChallanNo(e.target.value)} placeholder="CH-2026-998" required /></div>
                <div className="form-group full"><label>Upload D-Challan Photo / Copy</label><input type="file" accept="image/*" onChange={onFile} required />{challanImg && <img src={challanImg} alt="challan" style={{ maxWidth: '100%', maxHeight: 200, borderRadius: 8, marginTop: 10 }} />}</div>
              </div>
              <button type="submit" className="btn-submit" style={{ background: '#059669', color: 'white' }}>Submit & Mark Dispatched</button>
            </form>
          </div>
        </div>
      )}

      {view && (
        <div className="modal-overlay" onClick={() => setView(null)}>
          <div className="modal" style={{ textAlign: 'center' }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header"><h3><i className="fa fa-file-invoice" style={{ color: '#0b1f3a' }}></i> D-Challan Document View</h3><i className="fa fa-xmark modal-close" onClick={() => setView(null)}></i></div>
            <div style={{ textAlign: 'left', marginBottom: 15 }}><h4 style={{ color: '#0b1f3a' }}>{view.party}</h4><p style={{ fontSize: 12, color: '#666' }}>Challan No: {view.challanNo} | Vehicle: {view.vehicle}</p></div>
            <img src={view.challanImg} alt="challan" style={{ maxWidth: '100%', maxHeight: 400, borderRadius: 8 }} />
            <a href={view.challanImg} download={`D_Challan_${view.challanNo}.png`} className="btn-submit" style={{ display: 'inline-block', textDecoration: 'none', marginTop: 15 }}><i className="fa fa-download"></i> Download D-Challan Photo</a>
          </div>
        </div>
      )}

      {search && (
        <div className="modal-overlay" onClick={() => setSearch(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header"><h3><i className="fa fa-magnifying-glass" style={{ color: '#2563eb' }}></i> View & Download Party D-Challan</h3><i className="fa fa-xmark modal-close" onClick={() => setSearch(null)}></i></div>
            <div className="form-group" style={{ marginBottom: 15 }}><label>Type Party Name or Challan No.</label><input value={searchQ} onChange={(e) => setSearchQ(e.target.value)} placeholder="Patna Infra or CH-2026-101" /></div>
            <div style={{ maxHeight: 350, overflowY: 'auto' }}>
              {searchResults.length === 0 && <p style={{ textAlign: 'center', color: '#888', fontSize: 13, padding: 20 }}>No D-Challan documents found.</p>}
              {searchResults.map((r) => (
                <div key={r.id} style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 10, padding: 12, marginBottom: 10, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div><strong style={{ color: '#0b1f3a', fontSize: 14 }}>{r.party}</strong><p style={{ fontSize: 12, color: '#666' }}>Challan: <strong>{r.challanNo}</strong> | Date: {r.date}</p></div>
                  <button className="action-btn" onClick={() => { setView(r); setSearch(null); }}><i className="fa fa-eye"></i> View / Download</button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}
