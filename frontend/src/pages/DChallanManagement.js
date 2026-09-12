import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import { useAuth } from '../context/AuthContext';
import { api, fmtDate, todayStr, inr, printDocument } from '../api';

const COLORS = ['Red', 'Yellow', 'Grey', 'Black', 'White', 'General/NA'];

export default function DChallanManagement() {
  const { isAdmin } = useAuth();
  const [challans, setChallans] = useState([]);
  const [stock, setStock] = useState([]);
  const [parties, setParties] = useState([]);
  const [globalQ, setGlobalQ] = useState('');
  const [flt, setFlt] = useState({ from: '', to: '', plant: 'ALL', party: '', vehicle: '', driver: '', item: '', color: 'ALL' });
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState(null);
  const [imgView, setImgView] = useState(null);
  const [firm, setFirm] = useState({});

  const load = async () => { setChallans(await api.getChallans()); setStock(await api.getStock()); setParties(await api.getParties()); setFirm(await api.getFirm()); };
  useEffect(() => { load(); }, []);

  const printChallan = (ch) => {
    const rows = (ch.items || []).map((it) => `<tr><td>${it.itemName}</td><td>${it.color}</td><td>${it.qty.toLocaleString()} Pcs</td></tr>`).join('');
    const total = (ch.items || []).reduce((s, it) => s + (it.qty || 0), 0);
    const body = `
      <div class="doc-head">
        <div><div class="firm-name">${firm.name || 'Chaudhary Tiles'}</div>
        <div class="firm-sub">${firm.address || ''}<br/>Phone: ${firm.phone || ''} ${firm.gst ? '| GSTIN: ' + firm.gst : ''}</div></div>
        <div class="doc-title">DELIVERY CHALLAN</div>
      </div>
      <div class="meta">
        <div><span>Challan No</span>${ch.dcNumber}</div>
        <div><span>Date</span>${fmtDate(ch.date)}</div>
        <div><span>Party Name</span>${ch.party}</div>
        <div><span>Dispatch Plant</span>${ch.plant}</div>
        <div><span>Site Address</span>${ch.siteAddr || 'N/A'} (Mob: ${ch.siteMobile || 'N/A'})</div>
        <div><span>Vehicle / Driver</span>${ch.vehicle} - ${ch.driverName} (${ch.driverMobile || 'N/A'})</div>
      </div>
      <table><thead><tr><th>Item / Pattern</th><th>Color</th><th>Dispatched Qty</th></tr></thead><tbody>${rows}</tbody></table>
      <div class="total-row">Total Dispatched: ${total.toLocaleString()} Pcs</div>
      <div class="foot"><div>Received above goods in good condition.</div><div class="sign">Authorised Signatory</div></div>`;
    printDocument('Challan ' + ch.dcNumber, body);
  };

  const plantItems = (plant) => stock.filter((s) => s.plant === plant);
  const openAdd = () => { const plant = 'Sipara Plant'; const first = plantItems(plant)[0]; setForm({ date: todayStr(), dcNumber: 'DC-' + Math.floor(1000 + Math.random() * 9000), plant, party: '', siteAddr: '', siteMobile: '', vehicle: '', driverName: '', driverMobile: '', photo: '', items: [{ itemId: first?.id || '', color: 'Red', qty: '' }] }); setModal(true); };
  const openEdit = (ch) => { if (!isAdmin) { alert('Access Denied: Admin level required.'); return; } setForm({ id: ch.id, ...ch, items: ch.items.map((it) => ({ itemId: it.itemId, color: it.color, qty: it.qty })) }); setModal(true); };
  const changePlant = (plant) => { const first = plantItems(plant)[0]; setForm((f) => ({ ...f, plant, items: f.items.map((it) => ({ ...it, itemId: first?.id || '' })) })); };
  const setItem = (i, k, v) => setForm((f) => ({ ...f, items: f.items.map((it, idx) => idx === i ? { ...it, [k]: v } : it) }));
  const addRow = () => { const first = plantItems(form.plant)[0]; setForm((f) => ({ ...f, items: [...f.items, { itemId: first?.id || '', color: 'Red', qty: '' }] })); };
  const rmRow = (i) => setForm((f) => f.items.length > 1 ? { ...f, items: f.items.filter((_, idx) => idx !== i) } : f);
  const onFile = (e) => { const f = e.target.files[0]; if (f) { const r = new FileReader(); r.onload = (ev) => setForm((prev) => ({ ...prev, photo: ev.target.result })); r.readAsDataURL(f); } };

  const save = async (e) => {
    e.preventDefault();
    if (!form.party) { alert('Please select or enter Party Name.'); return; }
    const items = form.items.filter((it) => it.itemId && Number(it.qty) > 0).map((it) => { const st = stock.find((s) => s.id === it.itemId); return { itemId: it.itemId, itemName: st?.name || '', color: it.color, qty: parseInt(it.qty) }; });
    if (items.length === 0) { alert('Please enter valid item quantity.'); return; }
    const payload = { date: form.date, dcNumber: form.dcNumber, plant: form.plant, party: form.party, siteAddr: form.siteAddr, siteMobile: form.siteMobile, vehicle: form.vehicle, driverName: form.driverName, driverMobile: form.driverMobile, photo: form.photo || '', items, createdBy: 'admin' };
    if (form.id) await api.updateChallan(form.id, payload); else await api.addChallan(payload);
    setModal(false); load(); alert('Delivery Challan Saved & Plant Stock Updated!');
  };
  const del = async (id) => { if (!isAdmin) { alert('Access Denied: Admin level required.'); return; } if (window.confirm('Delete this D-Challan? Plant stock will be restored (+).')) { await api.deleteChallan(id); load(); alert('Challan deleted & stock restored!'); } };

  let totalTrips = 0, totalPcs = 0, vehicles = new Set();
  const gq = globalQ.toLowerCase();
  const visible = challans.filter((ch) => {
    if (flt.from && ch.date < flt.from) return false;
    if (flt.to && ch.date > flt.to) return false;
    if (flt.plant !== 'ALL' && ch.plant !== flt.plant) return false;
    if (flt.party && !ch.party.toLowerCase().includes(flt.party.toLowerCase())) return false;
    if (flt.vehicle && !ch.vehicle.toLowerCase().includes(flt.vehicle.toLowerCase())) return false;
    if (flt.driver && !ch.driverName.toLowerCase().includes(flt.driver.toLowerCase())) return false;
    let mi = ch.items || [];
    if (flt.item) mi = mi.filter((it) => it.itemName.toLowerCase().includes(flt.item.toLowerCase()));
    if (flt.color !== 'ALL') mi = mi.filter((it) => it.color === flt.color);
    if ((flt.item || flt.color !== 'ALL') && mi.length === 0) return false;
    const ss = `${ch.dcNumber} ${ch.party} ${ch.vehicle} ${ch.driverName} ${ch.plant} ${ch.siteAddr}`.toLowerCase();
    const hi = (ch.items || []).some((i) => i.itemName.toLowerCase().includes(gq) || i.color.toLowerCase().includes(gq));
    if (gq && !ss.includes(gq) && !hi) return false;
    return true;
  });
  visible.sort((a, b) => {
    const da = new Date(a.date).getTime(), db = new Date(b.date).getTime();
    if (db !== da) return db - da;
    return 0;
  });
  visible.forEach((ch) => { totalTrips++; if (ch.vehicle) vehicles.add(ch.vehicle.trim().toUpperCase()); (ch.items || []).forEach((it) => { const ok = (!flt.item || it.itemName.toLowerCase().includes(flt.item.toLowerCase())) && (flt.color === 'ALL' || it.color === flt.color); if (ok) totalPcs += (it.qty || 0); }); });

  return (
    <Layout searchPlaceholder="Search Challan No, Party, Vehicle, Driver, Item..." onSearch={setGlobalQ}>
      <div className="page-title">
        <h2><i className="fa fa-file-circle-check" style={{ color: '#ffc107' }}></i> Delivery Challan Master</h2>
        {isAdmin && <button className="btn-action" onClick={openAdd}><i className="fa fa-plus-circle"></i> Create New D-Challan</button>}
      </div>

      <div className="filter-box">
        <div className="filter-grid">
          <div className="filter-group"><label>From Date</label><input type="date" value={flt.from} onChange={(e) => setFlt({ ...flt, from: e.target.value })} /></div>
          <div className="filter-group"><label>To Date</label><input type="date" value={flt.to} onChange={(e) => setFlt({ ...flt, to: e.target.value })} /></div>
          <div className="filter-group"><label>Dispatch Plant</label><select value={flt.plant} onChange={(e) => setFlt({ ...flt, plant: e.target.value })}><option value="ALL">All Plants</option><option>Sipara Plant</option><option>Nandlal Chhapra Plant</option></select></div>
          <div className="filter-group"><label>Party Name</label><input list="pl" value={flt.party} onChange={(e) => setFlt({ ...flt, party: e.target.value })} placeholder="Select or Type..." /><datalist id="pl">{parties.map((p) => <option key={p.id} value={p.name} />)}</datalist></div>
          <div className="filter-group"><label>Vehicle No.</label><input value={flt.vehicle} onChange={(e) => setFlt({ ...flt, vehicle: e.target.value })} placeholder="BR01..." /></div>
          <div className="filter-group"><label>Driver Name</label><input value={flt.driver} onChange={(e) => setFlt({ ...flt, driver: e.target.value })} /></div>
          <div className="filter-group"><label>Item / Pattern</label><input value={flt.item} onChange={(e) => setFlt({ ...flt, item: e.target.value })} placeholder="Zig-Zag..." /></div>
          <div className="filter-group"><label>Color</label><select value={flt.color} onChange={(e) => setFlt({ ...flt, color: e.target.value })}><option value="ALL">All Colors</option>{COLORS.slice(0, 5).map((c) => <option key={c}>{c}</option>)}</select></div>
          <div className="filter-group" style={{ justifyContent: 'flex-end' }}><button onClick={() => { setFlt({ from: '', to: '', plant: 'ALL', party: '', vehicle: '', driver: '', item: '', color: 'ALL' }); setGlobalQ(''); }} style={{ padding: 8, background: '#64748b', color: 'white', border: 'none', borderRadius: 6, fontSize: 12, cursor: 'pointer', fontWeight: 600 }}><i className="fa fa-rotate-left"></i> Reset Filters</button></div>
        </div>
      </div>

      <div className="summary-bar dark">
        <div className="summary-stats">
          <span className="stat-pill">Total Trips: <strong>{totalTrips}</strong></span>
          <span className="stat-pill">Total Delivered Pcs: <strong>{totalPcs.toLocaleString()} Pcs</strong></span>
          <span className="stat-pill">Unique Vehicles: <strong>{vehicles.size}</strong></span>
          <span className="stat-pill">Filtered Challans: <strong>{totalTrips}</strong></span>
        </div>
      </div>

      <div className="challan-list">
        {visible.map((ch) => (
          <div className="challan-card" key={ch.id}>
            <div className="card-header">
              <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}><span className="dc-no-badge"><i className="fa fa-file-invoice"></i> {ch.dcNumber}</span><span className="dc-date-badge"><i className="fa fa-calendar-day"></i> {fmtDate(ch.date)}</span><span style={{ fontSize: 12, fontWeight: 700, color: '#0b1f3a' }}>{ch.plant}</span></div>
              {isAdmin ? <div style={{ display: 'flex', gap: 12 }}><i className="fa fa-print" style={{ color: '#0b1f3a', cursor: 'pointer' }} title="Print / PDF" onClick={() => printChallan(ch)}></i><i className="fa fa-pen-to-square" style={{ color: '#2563eb', cursor: 'pointer' }} onClick={() => openEdit(ch)}></i><i className="fa fa-trash" style={{ color: '#ef4444', cursor: 'pointer' }} onClick={() => del(ch.id)}></i></div> : <i className="fa fa-print" style={{ color: '#0b1f3a', cursor: 'pointer' }} title="Print / PDF" onClick={() => printChallan(ch)}></i>}
            </div>
            <div className="info-grid">
              <div className="info-item"><span>PARTY NAME:</span><strong>{ch.party}</strong></div>
              <div className="info-item"><span>VEHICLE / DRIVER:</span><strong>{ch.vehicle} ({ch.driverName} - {ch.driverMobile || 'N/A'})</strong></div>
              <div className="info-item"><span>SITE LOCATION:</span><strong>{ch.siteAddr || 'N/A'} (Mob: {ch.siteMobile || 'N/A'})</strong></div>
              <div className="info-item"><span>CHALLAN IMAGE:</span>{ch.photo ? <img src={ch.photo} className="challan-photo-thumb" alt="ch" onClick={() => setImgView(ch.photo)} /> : <span style={{ fontSize: 11, color: '#94a3b8' }}>No Photo</span>}</div>
            </div>
            <table className="items-table"><thead><tr><th>Item / Pattern</th><th>Color</th><th>Dispatched Qty</th></tr></thead><tbody>
              {(ch.items || []).map((it, i) => <tr key={i}><td><strong>{it.itemName}</strong></td><td>{it.color}</td><td><strong>{it.qty.toLocaleString()} Pcs</strong></td></tr>)}
            </tbody></table>
          </div>
        ))}
      </div>

      {modal && form && (
        <div className="modal-overlay" onClick={() => setModal(false)}>
          <div className="modal" style={{ maxWidth: 720 }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header"><h3><i className="fa fa-file-invoice" style={{ color: '#ffc107' }}></i> {form.id ? 'Edit' : 'Create'} Delivery Challan</h3><i className="fa fa-xmark modal-close" onClick={() => setModal(false)}></i></div>
            <form onSubmit={save}>
              <div className="form-grid">
                <div className="form-group"><label>Date</label><input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} required /></div>
                <div className="form-group"><label>D-Challan Number</label><input value={form.dcNumber} onChange={(e) => setForm({ ...form, dcNumber: e.target.value })} required /></div>
                <div className="form-group"><label>Dispatch Plant</label><select value={form.plant} onChange={(e) => changePlant(e.target.value)}><option>Sipara Plant</option><option>Nandlal Chhapra Plant</option></select></div>
                <div className="form-group"><label>Party Name</label><input list="plf" value={form.party} onChange={(e) => setForm({ ...form, party: e.target.value })} placeholder="Type or Select Party..." required /><datalist id="plf">{parties.map((p) => <option key={p.id} value={p.name} />)}</datalist></div>
                <div className="form-group"><label>Site Address</label><input value={form.siteAddr} onChange={(e) => setForm({ ...form, siteAddr: e.target.value })} /></div>
                <div className="form-group"><label>Site Mobile No.</label><input value={form.siteMobile} onChange={(e) => setForm({ ...form, siteMobile: e.target.value })} /></div>
                <div className="form-group"><label>Vehicle Number</label><input value={form.vehicle} onChange={(e) => setForm({ ...form, vehicle: e.target.value })} required /></div>
                <div className="form-group"><label>Driver Name</label><input value={form.driverName} onChange={(e) => setForm({ ...form, driverName: e.target.value })} required /></div>
                <div className="form-group"><label>Driver Mobile</label><input value={form.driverMobile} onChange={(e) => setForm({ ...form, driverMobile: e.target.value })} /></div>
                <div className="form-group"><label>Challan Photo (Optional)</label><input type="file" accept="image/*" onChange={onFile} /></div>
              </div>
              <div className="items-entry-box">
                <div className="items-entry-header"><h5 style={{ color: '#0b1f3a' }}><i className="fa fa-cubes"></i> Items Dispatched (Stock Auto-Deduct):</h5><button type="button" className="btn-add-row" onClick={addRow}><i className="fa fa-plus"></i> Add More Item</button></div>
                {form.items.map((it, i) => (
                  <div className="row-item" key={i}>
                    <select value={it.itemId} onChange={(e) => setItem(i, 'itemId', e.target.value)} required>{plantItems(form.plant).length ? plantItems(form.plant).map((s) => <option key={s.id} value={s.id}>{s.name}</option>) : <option value="">No Items available</option>}</select>
                    <select value={it.color} onChange={(e) => setItem(i, 'color', e.target.value)}>{COLORS.map((c) => <option key={c}>{c}</option>)}</select>
                    <input type="number" value={it.qty} onChange={(e) => setItem(i, 'qty', e.target.value)} placeholder="Qty Pcs" min="1" required />
                    <button type="button" className="btn-remove-row" onClick={() => rmRow(i)}><i className="fa fa-trash"></i></button>
                  </div>
                ))}
              </div>
              <button type="submit" className="btn-submit">Save & Minus Plant Stock</button>
            </form>
          </div>
        </div>
      )}

      {imgView && (
        <div className="modal-overlay" onClick={() => setImgView(null)}>
          <div className="modal" style={{ maxWidth: 500, textAlign: 'center' }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header"><h3>Challan Image</h3><i className="fa fa-xmark modal-close" onClick={() => setImgView(null)}></i></div>
            <img src={imgView} alt="challan" style={{ width: '100%', borderRadius: 8, border: '1px solid #cbd5e1' }} />
          </div>
        </div>
      )}
    </Layout>
  );
}
