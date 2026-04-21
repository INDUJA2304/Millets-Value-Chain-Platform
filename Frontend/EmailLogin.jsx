import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiCall } from '../api';
import { useAuth } from '../context/Authcontext';
import { useToast } from '../components/Toast';

const P = '#4a7c2c';

export default function EmailLogin({ role }) {
  const navigate = useNavigate();
  const { login } = useAuth();
  const showToast = useToast();
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    const res = await apiCall('/auth/login', 'POST', {
      email: e.target.email.value,
      password: e.target.password.value,
    });
    if (res.ok) {
      login(res.data);
      showToast(`✓ Welcome back, ${res.data.name}!`);
      navigate(`/${role}-dashboard`);
    } else {
      showToast('✗ ' + res.data.message, true);
    }
    setLoading(false);
  }

  const inputStyle = { width: '100%', padding: 12, border: '2px solid #e5e7eb', borderRadius: 8, fontSize: 14, fontFamily: 'Poppins, sans-serif', outline: 'none' };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16, background: `linear-gradient(135deg,${P}10,#fff)` }}>
      <div style={{ width: '100%', maxWidth: 420, background: '#fff', borderRadius: 20, padding: 32, boxShadow: '0 8px 32px rgba(0,0,0,0.08)', textAlign: 'center' }}>
        <div style={{ fontSize: '4rem', marginBottom: 12 }}>{role === 'farmer' ? '👨‍🌾' : '🏢'}</div>
        <h2 style={{ fontWeight: 700, fontSize: '1.5rem', marginBottom: 8 }}>{role === 'farmer' ? 'Farmer' : 'Startup'} Login</h2>
        <p style={{ opacity: 0.6, fontSize: 13, marginBottom: 24 }}>Email & password access</p>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <input style={inputStyle} type="email" name="email" required placeholder="your.email@example.com" />
          <input style={inputStyle} type="password" name="password" required placeholder="Enter password" />
          <button type="submit" disabled={loading} style={{ background: `linear-gradient(135deg,${P},#2d5016)`, color: '#fff', border: 'none', padding: 14, borderRadius: 10, fontWeight: 700, fontSize: 15, cursor: 'pointer', fontFamily: 'Poppins, sans-serif' }}>
            {loading ? 'Logging in...' : 'Login'}
          </button>
          <button type="button" onClick={() => navigate('/')} style={{ background: '#fff', color: P, border: `2px solid ${P}`, padding: 12, borderRadius: 10, fontWeight: 600, fontSize: 14, cursor: 'pointer', fontFamily: 'Poppins, sans-serif' }}>
            ← Back to Home
          </button>
        </form>
      </div>
    </div>
  );
}