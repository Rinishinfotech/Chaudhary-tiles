import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import { useAuth } from '../context/AuthContext';
import { api } from '../api';

export default function Settings() {
  const [firm, setFirm] = useState({ name: '', phone: '', gst: '', address: '' });

  useEffect(() => { api.getFirm().then((f) => setFirm({ name: f.name || '', phone: f.phone || '', gst: f.gst || '', address: f.address || '' })).catch(() => {}); }, []);

  const saveFirm = async (e) => { e.preventDefault(); await api.updateFirm(firm); alert('Firm profile updated successfully!'); };

  return (
    <Layout searchPlaceholder="Search system preferences...">
      <div className="page-title"><h2><i className="fa fa-gear" style={{ color: '#ffc107' }}></i> System Preferences & Configuration</h2></div>

      <div className="settings-grid">
        <div className="card-box">
          <h3><i className="fa fa-building" style={{ color: '#0b1f3a' }}></i> Firm / Profile Details</h3>
          <form onSubmit={saveFirm}>
            <div className="form-group"><label>Company Name</label><input value={firm.name} onChange={(e) => setFirm({ ...firm, name: e.target.value })} required /></div>
            <div className="form-group"><label>Contact Phone</label><input value={firm.phone} onChange={(e) => setFirm({ ...firm, phone: e.target.value })} required /></div>
            <div className="form-group"><label>GSTIN Number (Optional)</label><input value={firm.gst} onChange={(e) => setFirm({ ...firm, gst: e.target.value })} /></div>
            <div className="form-group"><label>Registered Address</label><textarea rows="3" value={firm.address} onChange={(e) => setFirm({ ...firm, address: e.target.value })} /></div>
            <button type="submit" className="btn-save"><i className="fa fa-floppy-disk"></i> Save Firm Info</button>
          </form>
        </div>

        <div className="card-box">
          <h3><i className="fa fa-industry" style={{ color: '#d97706' }}></i> Manufacturing Plants</h3>
          <div className="form-group"><label>Primary Manufacturing Unit</label><input value="Sipara Plant, Patna" readOnly style={{ background: '#f8fafc', fontWeight: 600 }} /></div>
          <div className="form-group"><label>Secondary Manufacturing Unit</label><input value="Nandlal Chhapra Plant, Patna" readOnly style={{ background: '#f8fafc', fontWeight: 600 }} /></div>
          <p style={{ fontSize: 12, color: '#666', marginTop: 10 }}><i className="fa fa-circle-info"></i> Both units are integrated with Stock, Production & Dispatch workflows.</p>
        </div>
      </div>
    </Layout>
  );
}
