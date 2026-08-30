import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import { useAuth } from '../context/AuthContext';
import { fmtDate } from '../api';
import { api } from '../api';

const dotClass = (c) => ({ Red: 'dot-red', Yellow: 'dot-yellow', White: 'dot-white', Grey: 'dot-grey', Black: 'dot-black' }[c] || 'dot-other');

export default function StockManagement() {
  const { isAdmin } = useAuth();
  const [stock, setStock] = useState([]);
  const [tab, setTab] = useState('ALL');
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState({});
  const [newModal, setNewModal] = useState(false);
  const [adjModal, setAdjModal] = useState(false);
  const [nf, setNf] = useState({ name: '', plant: 'Sipara Plant', unit: 'Pcs', minLimit: '', Red: 0, Yellow: 0, White: 0, Grey: 0, Black: 0 });
  const [adj, setAdj] = useState({ itemId: '', color: 'Red', action: 'ADD', qty: '' });

  const load = async () => setStock(await api.getStock());
  useEffect(() => { load(); }, []);

  const totalQty = (it) => Object.values(it.colors || {}).reduce((s, v) => s + v, 0);
  const q = query.toLowerCase();
  const visible = stock.filter((it) => (tab === 'ALL' || it.plant === tab) && (it.name.toLowerCase().includes(q) || it.plant.toLowerCase().includes(q)));
  const lowCount = visible.filter((it) => totalQty(it) <= it.minLimit).length;

  const saveNew = async (e) => {
    e.preventDefault();
    const colors = {};
    ['Red', 'Yellow', 'White', 'Grey', 'Black'].forEach((c) => { if (Number(nf[c]) > 0) colors[c] = Number(nf[c]); });
    if (Object.keys(colors).length === 0) colors['General/NA'] = 0;
    await api.addStock({ name: nf.name, plant: nf.plant, unit: nf.unit, minLimit: Number(nf.minLimit || 0), colors });
    setNewModal(false); setNf({ name: '', plant: 'Sipara Plant', unit: 'Pcs', minLimit: '', Red: 0, Yellow: 0, White: 0, Grey: 0, Black: 0 }); load();
    alert('New Item created successfully!');
  };
  const saveAdj = async (e) => {
    e.preventDefault();
    await api.adjustStock({ itemId: adj.itemId, color: adj.color, action: adj.action, qty: Number(adj.qty) });
    setAdjModal(false); load(); alert('Stock adjusted successfully!');
  };
  const del = async (id, e) => { e.stopPropagation(); if (window.confirm('Delete this stock item?')) { await api.deleteStock(id); load(); } };

  return (
    <Layout searchPlaceholder="Search Item, Pattern, Color or Plant..." onSearch={setQuery}>
      <div className="page-title">
        <h2><i className="fa fa-cubes" style={{ color: '#ffc107' }}></i> Live Stock & Inventory Master</h2>
        {isAdmin && <div className="action-bar">
          <button className="btn-action btn-secondary" onClick={() => { setAdj({ itemId: stock[0]?.id || '', color: 'Red', action: 'ADD', qty: '' }); setAdjModal(true); }}><i className="fa fa-pen-to-square"></i> Adjust Stock Qty</button>
          <button className="btn-action" onClick={() => setNewModal(true)}><i className="fa fa-plus-circle"></i> Add New Item Master</button>
        </div>}
      </div>

      <div className="plant-tabs">
        <button className={`tab-btn ${tab === 'ALL' ? 'active' : ''}`} onClick={() => setTab('ALL')}><i className="fa fa-warehouse"></i> All Plants Combined</button>
        <button className={`tab-btn ${tab === 'Sipara Plant' ? 'active' : ''}`} onClick={() => setTab('Sipara Plant')}><i className="fa fa-industry"></i> Sipara Plant</button>
        <button className={`tab-btn ${tab === 'Nandlal Chhapra Plant' ? 'active' : ''}`} onClick={() => setTab('Nandlal Chhapra Plant')}><i className="fa fa-industry"></i> Nandlal Chhapra Plant</button>
      </div>

      <div className="summary-bar">
        <div className="summary-stats">
          <span className="stat-pill">Total Items: <strong>{visible.length}</strong></span>
          <span className="stat-pill" style={{ color: '#dc3545' }}>Low Stock Warning: <strong>{lowCount}</strong></span>
        </div>
      </div>

      <div className="stock-grid">
        {visible.map((it) => {
          const tq = totalQty(it); const low = tq <= it.minLimit;
          return (
            <div className="stock-card" key={it.id}>
              <div className="card-header-banner"><span className="company-title"><i className="fa fa-industry"></i> Chaudhary Tiles</span><span className="timestamp">{fmtDate(new Date().toISOString().split('T')[0])}</span></div>
              <div className="card-main-info">
                <div className="item-title-row"><span className="item-name">{it.name}</span><span className="plant-tag">{it.plant}</span></div>
                <div className="stock-count-box"><span className="stock-num">{tq.toLocaleString()}</span><span className="stock-unit">{it.unit} Total</span></div>
                {low && <div className="low-stock-badge"><i className="fa fa-triangle-exclamation"></i> Low Stock (Limit: {it.minLimit.toLocaleString()} {it.unit})</div>}
                <div className="dropdown-trigger" onClick={() => setOpen({ ...open, [it.id]: !open[it.id] })}>
                  <span><i className="fa fa-palette"></i> View Color / Stock Breakdown</span>
                  <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>{isAdmin && <i className="fa fa-trash" style={{ color: '#ef4444' }} onClick={(e) => del(it.id, e)}></i>}<i className="fa fa-chevron-down"></i></div>
                </div>
              </div>
              <div className={`color-breakdown-panel ${open[it.id] ? 'show' : ''}`}>
                <h5 style={{ fontSize: 11, color: '#64748b', textTransform: 'uppercase', marginBottom: 8 }}>Stock Breakdown:</h5>
                {Object.entries(it.colors || {}).map(([c, v]) => (
                  <div className="color-item" key={c}><span className="color-name"><span className={`color-dot ${dotClass(c)}`}></span> {c}</span><strong>{v.toLocaleString()} {it.unit}</strong></div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {newModal && (
        <div className="modal-overlay" onClick={() => setNewModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header"><h3><i className="fa fa-box-archive" style={{ color: '#ffc107' }}></i> Create New Item Master <span className="admin-only-tag">ADMIN</span></h3><i className="fa fa-xmark modal-close" onClick={() => setNewModal(false)}></i></div>
            <form onSubmit={saveNew}>
              <div className="form-grid">
                <div className="form-group full"><label>Item / Pattern Name</label><input value={nf.name} onChange={(e) => setNf({ ...nf, name: e.target.value })} required /></div>
                <div className="form-group"><label>Plant Location</label><select value={nf.plant} onChange={(e) => setNf({ ...nf, plant: e.target.value })}><option>Sipara Plant</option><option>Nandlal Chhapra Plant</option></select></div>
                <div className="form-group"><label>Unit Measurement</label><select value={nf.unit} onChange={(e) => setNf({ ...nf, unit: e.target.value })}><option>Pcs</option><option>Bags</option><option>CFT</option><option>KG</option></select></div>
                <div className="form-group full"><label>Low Stock Warning Limit</label><input type="number" value={nf.minLimit} onChange={(e) => setNf({ ...nf, minLimit: e.target.value })} required /></div>
              </div>
              <div className="color-inputs-box">
                <h5>Initial Color Quantity Setup (Optional):</h5>
                <div className="form-grid">
                  {['Red', 'Yellow', 'White', 'Grey', 'Black'].map((c) => <div className="form-group" key={c}><label>{c} (Pcs)</label><input type="number" value={nf[c]} onChange={(e) => setNf({ ...nf, [c]: e.target.value })} min="0" /></div>)}
                </div>
              </div>
              <button type="submit" className="btn-submit">Save Item Master</button>
            </form>
          </div>
        </div>
      )}

      {adjModal && (
        <div className="modal-overlay" onClick={() => setAdjModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header"><h3><i className="fa fa-sliders" style={{ color: '#ffc107' }}></i> Adjust Stock Quantity <span className="admin-only-tag">ADMIN</span></h3><i className="fa fa-xmark modal-close" onClick={() => setAdjModal(false)}></i></div>
            <form onSubmit={saveAdj}>
              <div className="form-grid">
                <div className="form-group full"><label>Select Item Master</label><select value={adj.itemId} onChange={(e) => setAdj({ ...adj, itemId: e.target.value })} required>{stock.map((it) => <option key={it.id} value={it.id}>{it.name} ({it.plant})</option>)}</select></div>
                <div className="form-group"><label>Color Specification</label><select value={adj.color} onChange={(e) => setAdj({ ...adj, color: e.target.value })}><option>Red</option><option>Yellow</option><option>White</option><option>Grey</option><option>Black</option><option value="General/NA">General / NA</option></select></div>
                <div className="form-group"><label>Action</label><select value={adj.action} onChange={(e) => setAdj({ ...adj, action: e.target.value })}><option value="ADD">Add (+) Stock</option><option value="DEDUCT">Deduct (-) Stock</option></select></div>
                <div className="form-group full"><label>Quantity to Adjust</label><input type="number" value={adj.qty} onChange={(e) => setAdj({ ...adj, qty: e.target.value })} required min="1" /></div>
              </div>
              <button type="submit" className="btn-submit">Update Balance Now</button>
            </form>
          </div>
        </div>
      )}
    </Layout>
  );
}
