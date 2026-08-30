import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import { useAuth } from '../context/AuthContext';
import { api, fmtDate, todayStr } from '../api';

export default function ProductionManagement() {
  const { isAdmin } = useAuth();
  const [logs, setLogs] = useState([]);
  const [stock, setStock] = useState([]);
  const [tab, setTab] = useState('ALL');
  const [query, setQuery] = useState('');
  const [filterDate, setFilterDate] = useState(todayStr());
  const [modal, setModal] = useState(false);
  const [inward, setInward] = useState(false);
  const [form, setForm] = useState(null);
  const [inw, setInw] = useState({ date: todayStr(), plant: 'Sipara Plant', cementName: 'OPC 53 Grade Cement', bags: '' });

  const load = async () => { setLogs(await api.getProduction()); setStock(await api.getStock()); };
  useEffect(() => { load(); }, []);

  const plantItems = (plant) => stock.filter((s) => s.plant === plant && s.unit !== 'Bags');

  const openAdd = () => {
    const plant = 'Sipara Plant';
    const first = plantItems(plant)[0];
    setForm({ date: todayStr(), plant, isOff: false, ppcBags: 0, opcBags: 0, items: [{ itemId: first?.id || '', color: 'Red', qty: '' }] });
    setModal(true);
  };
  const openEdit = (log) => {
    if (!isAdmin) { alert('Permission Denied: Only Admin can edit records.'); return; }
    setForm({ id: log.id, date: log.date, plant: log.plant, isOff: log.isOff, ppcBags: log.ppcBags || 0, opcBags: log.opcBags || 0, items: log.isOff ? [{ itemId: '', color: 'Red', qty: '' }] : log.items.map((it) => ({ itemId: it.itemId, color: it.color, qty: it.qty })) });
    setModal(true);
  };
  const changePlant = (plant) => { const first = plantItems(plant)[0]; setForm((f) => ({ ...f, plant, items: f.items.map((it) => ({ ...it, itemId: it.itemId || first?.id || '' })) })); };
  const setItem = (i, k, v) => setForm((f) => ({ ...f, items: f.items.map((it, idx) => idx === i ? { ...it, [k]: v } : it) }));
  const addRow = () => { const first = plantItems(form.plant)[0]; setForm((f) => ({ ...f, items: [...f.items, { itemId: first?.id || '', color: 'Red', qty: '' }] })); };
  const rmRow = (i) => setForm((f) => ({ ...f, items: f.items.filter((_, idx) => idx !== i) }));

  const save = async (e) => {
    e.preventDefault();
    const items = form.isOff ? [] : form.items.filter((it) => it.itemId && Number(it.qty) > 0).map((it) => { const st = stock.find((s) => s.id === it.itemId); return { itemId: it.itemId, itemName: st?.name || '', color: it.color, qty: parseInt(it.qty) }; });
    const payload = { date: form.date, plant: form.plant, isOff: form.isOff, items, ppcBags: Number(form.ppcBags || 0), opcBags: Number(form.opcBags || 0), createdBy: 'admin' };
    if (form.id) await api.updateProduction(form.id, payload); else await api.addProduction(payload);
    setModal(false); load(); alert('Production record saved! Live Stock Updated.');
  };
  const del = async (id) => { if (!isAdmin) { alert('Permission Denied: Only Admin can delete records.'); return; } if (window.confirm('Delete this record? Stock will be reverted.')) { await api.deleteProduction(id); load(); alert('Record deleted & stock reverted!'); } };

  const saveInward = async (e) => { e.preventDefault(); await api.inwardCement({ plant: inw.plant, cementName: inw.cementName, bags: Number(inw.bags) }); setInward(false); setInw({ ...inw, bags: '' }); load(); alert(`${inw.bags} Bags added to ${inw.plant} Stock!`); };

  const q = query.toLowerCase();
  const visible = logs.filter((l) => (tab === 'ALL' || l.plant === tab) && (!filterDate || l.date === filterDate) && (l.plant.toLowerCase().includes(q) || l.date.includes(q) || (l.items || []).some((i) => (i.itemName || '').toLowerCase().includes(q))));
  let todayPcs = 0, todayCement = 0;
  logs.forEach((l) => { if (l.date === todayStr()) { (l.items || []).forEach((it) => todayPcs += (it.qty || 0)); todayCement += (l.ppcBags || 0) + (l.opcBags || 0); } });

  return (
    <Layout searchPlaceholder="Search Item, Plant or Date..." onSearch={setQuery}>
      <div className="page-title">
        <h2><i className="fa fa-industry" style={{ color: '#ffc107' }}></i> Daily Production Register</h2>
        <div className="action-bar">
          <button className="btn-action btn-cement" onClick={() => setInward(true)}><i className="fa fa-truck-ramp-box"></i> Add Cement Supply (Inward)</button>
          <button className="btn-action" onClick={openAdd}><i className="fa fa-plus-circle"></i> Daily Production Entry</button>
        </div>
      </div>

      <div className="plant-tabs">
        <button className={`tab-btn ${tab === 'ALL' ? 'active' : ''}`} onClick={() => setTab('ALL')}><i className="fa fa-warehouse"></i> All Plants</button>
        <button className={`tab-btn ${tab === 'Sipara Plant' ? 'active' : ''}`} onClick={() => setTab('Sipara Plant')}><i className="fa fa-industry"></i> Sipara Plant</button>
        <button className={`tab-btn ${tab === 'Nandlal Chhapra Plant' ? 'active' : ''}`} onClick={() => setTab('Nandlal Chhapra Plant')}><i className="fa fa-industry"></i> Nandlal Chhapra Plant</button>
      </div>

      <div className="summary-bar">
        <div className="summary-stats"><span className="stat-pill">Total Production Pcs Today: <strong>{todayPcs.toLocaleString()}</strong></span><span className="stat-pill">Cement Consumed Today: <strong>{todayCement.toLocaleString()} Bags</strong></span></div>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <label style={{ fontSize: 12, fontWeight: 600, color: '#0b1f3a' }}><i className="fa fa-calendar-days"></i> Select Date: </label>
          <input type="date" value={filterDate} onChange={(e) => setFilterDate(e.target.value)} style={{ padding: '5px 10px', borderRadius: 6, border: '1px solid #cbd5e1' }} />
          <button onClick={() => setFilterDate('')} style={{ padding: '5px 10px', background: '#64748b', color: 'white', border: 'none', borderRadius: 6, fontSize: 12, cursor: 'pointer' }}>Show All Dates</button>
        </div>
      </div>

      <div className="production-list">
        {visible.map((log) => (
          <div className="prod-card" key={log.id}>
            <div className="prod-card-header">
              <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}><span className="prod-date-badge"><i className="fa fa-calendar"></i> {fmtDate(log.date)}</span><span className="prod-plant-badge"><i className="fa fa-industry"></i> {log.plant}</span></div>
              {isAdmin && <div style={{ display: 'flex', gap: 10 }}><i className="fa fa-pen-to-square" style={{ color: '#2563eb', cursor: 'pointer' }} onClick={() => openEdit(log)}></i><i className="fa fa-trash" style={{ color: '#ef4444', cursor: 'pointer' }} onClick={() => del(log.id)}></i></div>}
            </div>
            {log.isOff ? <div className="off-badge"><i className="fa fa-circle-pause"></i> Production Off (Chhutti / Kaam Band)</div> : (
              <table className="prod-items-table"><thead><tr><th>Item / Pattern</th><th>Color</th><th>Quantity Produced</th></tr></thead><tbody>
                {log.items.map((it, i) => <tr key={i}><td><strong>{it.itemName}</strong></td><td><span className={`color-dot dot-${(it.color || '').toLowerCase()}`}></span> {it.color}</td><td><strong>{it.qty.toLocaleString()} Pcs</strong></td></tr>)}
              </tbody></table>
            )}
            {!log.isOff && ((log.ppcBags || 0) > 0 || (log.opcBags || 0) > 0) && <div className="cement-usage-tag"><i className="fa fa-cubes-stacked"></i> Cement Consumed: OPC 53: {log.opcBags || 0} Bags | PPC: {log.ppcBags || 0} Bags</div>}
          </div>
        ))}
      </div>

      {modal && form && (
        <div className="modal-overlay" onClick={() => setModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header"><h3><i className="fa fa-square-plus" style={{ color: '#ffc107' }}></i> {form.id ? 'Edit' : 'Daily'} Production Entry</h3><i className="fa fa-xmark modal-close" onClick={() => setModal(false)}></i></div>
            <form onSubmit={save}>
              <div className="form-grid">
                <div className="form-group"><label>Production Date</label><input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} required readOnly={!isAdmin} /></div>
                <div className="form-group"><label>Plant Location</label><select value={form.plant} onChange={(e) => changePlant(e.target.value)}><option>Sipara Plant</option><option>Nandlal Chhapra Plant</option></select></div>
              </div>
              <div className="off-toggle-box"><input type="checkbox" checked={form.isOff} onChange={(e) => setForm({ ...form, isOff: e.target.checked })} /><label>Production Off Today (Utpaadan Band / Chhutti)</label></div>
              {!form.isOff && <>
                <div className="items-entry-box">
                  <div className="items-entry-header"><h5><i className="fa fa-cubes"></i> Items Manufactured Today:</h5><button type="button" className="btn-add-row" onClick={addRow}><i className="fa fa-plus"></i> Add Item</button></div>
                  {form.items.map((it, i) => (
                    <div className="row-item" key={i}>
                      <select value={it.itemId} onChange={(e) => setItem(i, 'itemId', e.target.value)} required>{plantItems(form.plant).length ? plantItems(form.plant).map((s) => <option key={s.id} value={s.id}>{s.name}</option>) : <option value="">No Items Available</option>}</select>
                      <select value={it.color} onChange={(e) => setItem(i, 'color', e.target.value)}><option>Red</option><option>Yellow</option><option>White</option><option>Grey</option><option>Black</option></select>
                      <input type="number" value={it.qty} onChange={(e) => setItem(i, 'qty', e.target.value)} placeholder="Qty Pcs" min="1" required />
                      <button type="button" className="btn-remove-row" onClick={() => rmRow(i)}><i className="fa fa-trash"></i></button>
                    </div>
                  ))}
                </div>
                <div className="items-entry-box">
                  <h5><i className="fa fa-cubes-stacked"></i> Daily Cement Used (Consumption):</h5>
                  <div className="form-grid" style={{ marginBottom: 0, marginTop: 8 }}>
                    <div className="form-group"><label>OPC 53 Used (Bags -)</label><input type="number" value={form.opcBags} onChange={(e) => setForm({ ...form, opcBags: e.target.value })} min="0" /></div>
                    <div className="form-group"><label>PPC Used (Bags -)</label><input type="number" value={form.ppcBags} onChange={(e) => setForm({ ...form, ppcBags: e.target.value })} min="0" /></div>
                  </div>
                </div>
              </>}
              <button type="submit" className="btn-submit">Save & Update Live Stock</button>
            </form>
          </div>
        </div>
      )}

      {inward && (
        <div className="modal-overlay" onClick={() => setInward(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header"><h3><i className="fa fa-truck-moving" style={{ color: '#059669' }}></i> Add Cement Supply Inward (+)</h3><i className="fa fa-xmark modal-close" onClick={() => setInward(false)}></i></div>
            <form onSubmit={saveInward}>
              <div className="form-grid">
                <div className="form-group"><label>Inward Date</label><input type="date" value={inw.date} onChange={(e) => setInw({ ...inw, date: e.target.value })} required /></div>
                <div className="form-group"><label>Plant Location</label><select value={inw.plant} onChange={(e) => setInw({ ...inw, plant: e.target.value })}><option>Sipara Plant</option><option>Nandlal Chhapra Plant</option></select></div>
                <div className="form-group"><label>Cement Grade / Type</label><select value={inw.cementName} onChange={(e) => setInw({ ...inw, cementName: e.target.value })}><option>OPC 53 Grade Cement</option><option>PPC Cement</option></select></div>
                <div className="form-group"><label>Received Bags Qty (+)</label><input type="number" value={inw.bags} onChange={(e) => setInw({ ...inw, bags: e.target.value })} required min="1" /></div>
              </div>
              <button type="submit" className="btn-submit" style={{ background: '#059669', color: 'white' }}>Add to Cement Stock</button>
            </form>
          </div>
        </div>
      )}
    </Layout>
  );
}
