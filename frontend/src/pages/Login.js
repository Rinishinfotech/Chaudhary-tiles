import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../api';

export default function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [team, setTeam] = useState([]);
  const [selected, setSelected] = useState('');
  const [role, setRole] = useState('');
  const [pin, setPin] = useState('1234');

  useEffect(() => {
    api.getTeam().then((t) => setTeam(t)).catch(() => {});
  }, []);

  const autoFillRole = (val) => {
    setSelected(val);
    const u = team.find((x) => x.id === val);
    setRole(u ? u.role : '');
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!selected) { alert('Kripya profile select karein!'); return; }
    try {
      const user = await api.login(selected, pin);
      login(user);
      navigate('/dashboard');
    } catch (err) {
      alert(err?.response?.data?.detail || 'Login failed');
    }
  };

  const quickSelect = (idx) => {
    if (team[idx]) autoFillRole(team[idx].id);
  };

  return (
    <div style={{ background: 'linear-gradient(135deg, #0b1f3a 0%, #132c4f 100%)', minHeight: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center', padding: 20 }}>
      <div style={{ background: '#fff', width: '100%', maxWidth: 420, borderRadius: 18, padding: 30, boxShadow: '0 15px 35px rgba(0,0,0,0.3)' }}>
        <div style={{ textAlign: 'center', marginBottom: 25 }}>
          <h1 style={{ color: '#0b1f3a', fontSize: 24, fontWeight: 700 }}>Chaudhary Tiles</h1>
          <p style={{ color: '#777', fontSize: 13, marginTop: 4 }}>Factory ERP & Team Operations Portal</p>
        </div>

        <form onSubmit={handleLogin}>
          <div className="form-group" style={{ marginBottom: 18 }}>
            <label>Select Team Member Profile</label>
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
              <i className="fa fa-user" style={{ position: 'absolute', left: 14, color: '#0b1f3a' }}></i>
              <select value={selected} onChange={(e) => autoFillRole(e.target.value)} required style={{ width: '100%', padding: '12px 14px 12px 42px', border: '1px solid #dcdfe6', borderRadius: 10, fontSize: 14 }}>
                <option value="">-- Choose Profile --</option>
                {team.map((u) => (
                  <option key={u.id} value={u.id}>{u.name} ({u.role})</option>
                ))}
              </select>
            </div>
          </div>

          <div className="form-group" style={{ marginBottom: 18 }}>
            <label>Role Privilege Tag</label>
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
              <i className="fa fa-shield-halved" style={{ position: 'absolute', left: 14, color: '#0b1f3a' }}></i>
              <input type="text" value={role} placeholder="Select profile first" readOnly style={{ width: '100%', padding: '12px 14px 12px 42px', border: '1px solid #dcdfe6', borderRadius: 10, fontSize: 14, background: '#f8fafc' }} />
            </div>
          </div>

          <div className="form-group" style={{ marginBottom: 18 }}>
            <label>Security PIN / Password</label>
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
              <i className="fa fa-key" style={{ position: 'absolute', left: 14, color: '#0b1f3a' }}></i>
              <input type="password" value={pin} onChange={(e) => setPin(e.target.value)} placeholder="Enter PIN (Default: 1234)" required style={{ width: '100%', padding: '12px 14px 12px 42px', border: '1px solid #dcdfe6', borderRadius: 10, fontSize: 14 }} />
            </div>
          </div>

          <button type="submit" style={{ width: '100%', background: '#0b1f3a', color: '#ffc107', border: 'none', padding: 13, borderRadius: 10, fontSize: 16, fontWeight: 600, cursor: 'pointer', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 10, marginTop: 10 }}>
            <span>Login To Portal</span><i className="fa fa-arrow-right"></i>
          </button>
        </form>
      </div>
    </div>
  );
}
