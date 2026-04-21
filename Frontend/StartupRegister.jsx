import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiCall } from '../api';
import { useToast } from '../components/Toast';

const P = '#4a7c2c';

export default function StartupRegister() {
  const navigate = useNavigate();
  const showToast = useToast();
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    const res = await apiCall('/auth/register/startup', 'POST', new FormData(e.target), true);
    showToast(res.data.message, !res.ok);
    setLoading(false);
    if (res.ok) setTimeout(() => navigate('/'), 2000);
  }

  const inputStyle = { width: '100%', padding: 12, border: '2px solid #e5e7eb', borderRadius: 8, fontSize: 14, fontFamily: 'Poppins, sans-serif', outline: 'none' };
  const labelStyle = { display: 'block', marginBottom: 8, fontWeight: 600, fontSize: 14 };

  return (
    <div style={{ minHeight: '100vh', padding: '48px 16px', background: `linear-gradient(135deg,${P}10,#fff)` }}>
      <div style={{ maxWidth: 600, margin: '0 auto', background: '#fff', borderRadius: 20, padding: 32, boxShadow: '0 8px 32px rgba(0,0,0,0.08)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{ fontSize: '2.5rem' }}>🏢</span>
            <h2 style={{ fontWeight: 700, fontSize: '1.5rem' }}>Startup Registration</h2>
          </div>
          <button onClick={() => navigate('/')} style={{ background: `${P}20`, color: P, border: 'none', padding: '8px 16px', borderRadius: 8, fontWeight: 600, fontSize: 13, cursor: 'pointer', fontFamily: 'Poppins, sans-serif' }}>← Back</button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div><label style={labelStyle}>Full Name (as per Aadhaar) *</label>
            <input style={inputStyle} type="text" name="full_name" required placeholder="Enter full name" /></div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div><label style={labelStyle}>Age *</label>
              <input style={inputStyle} type="number" name="age" required min="18" max="100" /></div>
            <div><label style={labelStyle}>Gender *</label>
              <select style={inputStyle} name="gender" required>
                <option value="">Select</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
              </select></div>
          </div>

          <div><label style={labelStyle}>Phone Number *</label>
            <input style={inputStyle} type="tel" name="phone" required pattern="[0-9]{10}" placeholder="10-digit mobile" /></div>

          <div><label style={labelStyle}>Email *</label>
            <input style={inputStyle} type="email" name="email" required placeholder="your.email@example.com" /></div>

          <div><label style={labelStyle}>Startup License Number *</label>
            <input style={inputStyle} type="text" name="license_number" required placeholder="Startup registration number" /></div>

          <div><label style={labelStyle}>Business Category *</label>
            <select style={inputStyle} name="business_category" required>
              <option value="">Select Category</option>
              <option value="food">Ready-to-Eat Organic Food</option>
              <option value="cosmetics">Organic Cosmetics</option>
            </select></div>

          <div><label style={labelStyle}>Upload Aadhaar Card *</label>
            <input style={inputStyle} type="file" name="aadhaar" accept="image/*,.pdf" required /></div>
          <div><label style={labelStyle}>Upload Passport Photo *</label>
            <input style={inputStyle} type="file" name="photo" accept="image/*" required /></div>
          <div><label style={labelStyle}>Upload UPI/QR Code *</label>
            <input style={inputStyle} type="file" name="upi_qr" accept="image/*" required /></div>

          <div><label style={labelStyle}>Set Password *</label>
            <input style={inputStyle} type="password" name="password" required minLength="8" placeholder="Minimum 8 characters" /></div>

          <button type="submit" disabled={loading} style={{ background: `linear-gradient(135deg,${P},#2d5016)`, color: '#fff', border: 'none', padding: 16, borderRadius: 10, fontWeight: 700, fontSize: 15, cursor: loading ? 'not-allowed' : 'pointer', fontFamily: 'Poppins, sans-serif' }}>
            {loading ? 'Submitting...' : 'Submit for Admin Approval'}
          </button>
        </form>
      </div>
    </div>
  );
}