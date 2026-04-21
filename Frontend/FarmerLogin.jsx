import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiCall } from '../api';
import { useAuth } from '../context/Authcontext';
import { useToast } from '../components/Toast';

const P = '#4a7c2c';
const inputStyle = {
  width: '100%', padding: 12, border: '2px solid #e5e7eb', borderRadius: 8,
  fontSize: 14, fontFamily: 'Poppins, sans-serif', outline: 'none', boxSizing: 'border-box',
};
const btnPrimary = {
  background: 'linear-gradient(135deg,#4a7c2c,#2d5016)', color: '#fff', border: 'none',
  padding: 14, borderRadius: 10, fontWeight: 700, cursor: 'pointer',
  fontFamily: 'Poppins, sans-serif', width: '100%',
};

function ForgotPassword({ onBack }) {
  const showToast = useToast();
  const [step, setStep]       = useState('email');
  const [email, setEmail]     = useState('');
  const [otp, setOtp]         = useState('');
  const [newPass, setNewPass] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const steps = ['email', 'otp', 'newpass'];

  async function sendOtp(e) {
    e.preventDefault();
    setLoading(true);
    const res = await apiCall('/auth/farmer/forgot-password', 'POST', { email });
    showToast(res.data.message, !res.ok);
    if (res.ok) {
      if (res.data.dev_otp) showToast(`DEV — OTP: ${res.data.dev_otp}`);
      setStep('otp');
    }
    setLoading(false);
  }

  async function resetPass(e) {
    e.preventDefault();
    if (newPass !== confirm) { showToast('Passwords do not match.', true); return; }
    setLoading(true);
    const res = await apiCall('/auth/farmer/reset-password', 'POST',
      { email, otp, new_password: newPass });
    showToast(res.data.message, !res.ok);
    setLoading(false);
    if (res.ok) setTimeout(onBack, 1500);
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ textAlign: 'center', paddingBottom: 4 }}>
        <div style={{ fontSize: '2.5rem', marginBottom: 8 }}>🔑</div>
        <h3 style={{ fontWeight: 700, fontSize: '1.2rem', marginBottom: 4 }}>Reset Password</h3>
        <p style={{ fontSize: 13, opacity: 0.6 }}>
          {step === 'email'   && 'Enter your registered email address'}
          {step === 'otp'     && `OTP sent to ${email}`}
          {step === 'newpass' && 'Set your new password'}
        </p>
      </div>

      <div style={{ display: 'flex', justifyContent: 'center', gap: 8 }}>
        {steps.map(s => (
          <div key={s} style={{ height: 6, borderRadius: 3, transition: 'all 0.3s',
            width: step === s ? 32 : 10,
            background: steps.indexOf(s) <= steps.indexOf(step) ? P : '#e5e7eb' }} />
        ))}
      </div>

      {step === 'email' && (
        <form onSubmit={sendOtp} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <input style={inputStyle} type="email" value={email}
            onChange={e => setEmail(e.target.value)}
            required placeholder="your@email.com" />
          <button type="submit" disabled={loading}
            style={{ ...btnPrimary, opacity: loading ? 0.7 : 1 }}>
            {loading ? 'Sending OTP...' : 'Send OTP to Email'}
          </button>
        </form>
      )}

      {step === 'otp' && (
        <form onSubmit={e => { e.preventDefault(); setStep('newpass'); }}
          style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <p style={{ fontSize: 13, color: P, fontWeight: 600, textAlign: 'center',
            background: `${P}10`, padding: '10px 16px', borderRadius: 8 }}>
            📧 OTP sent to {email}
          </p>
          <input style={{ ...inputStyle, fontSize: '1.8rem', letterSpacing: '0.4rem',
            textAlign: 'center', padding: '14px 12px' }}
            type="text" value={otp} onChange={e => setOtp(e.target.value)}
            required maxLength={6} placeholder="——————" />
          <button type="submit" style={btnPrimary}>Verify OTP</button>
          <button type="button" onClick={() => { setStep('email'); setOtp(''); }}
            style={{ background: 'none', border: 'none', color: P, fontSize: 13,
              cursor: 'pointer', fontFamily: 'Poppins, sans-serif', textAlign: 'center' }}>
            ← Resend OTP
          </button>
        </form>
      )}

      {step === 'newpass' && (
        <form onSubmit={resetPass} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <input style={inputStyle} type="password" value={newPass}
            onChange={e => setNewPass(e.target.value)}
            required minLength={8} placeholder="New password (min 8 characters)" />
          <input style={inputStyle} type="password" value={confirm}
            onChange={e => setConfirm(e.target.value)}
            required placeholder="Confirm new password" />
          {confirm && (
            <p style={{ fontSize: 12, marginTop: -4,
              color: newPass === confirm ? '#059669' : '#dc2626' }}>
              {newPass === confirm ? '✓ Passwords match' : '✗ Passwords do not match'}
            </p>
          )}
          <button type="submit" disabled={loading}
            style={{ ...btnPrimary, opacity: loading ? 0.7 : 1 }}>
            {loading ? 'Resetting...' : 'Reset Password'}
          </button>
        </form>
      )}

      <button onClick={onBack} style={{ background: 'none', border: 'none',
        color: '#6b7280', fontSize: 13, cursor: 'pointer',
        fontFamily: 'Poppins, sans-serif', textAlign: 'center' }}>
        ← Back to Login
      </button>
    </div>
  );
}

export default function FarmerLogin() {
  const navigate  = useNavigate();
  const { login } = useAuth();
  const showToast = useToast();
  const [tab, setTab]         = useState('password'); // 'password' | 'otp'
  const [mode, setMode]       = useState('login');    // 'login' | 'forgot'
  const [loading, setLoading] = useState(false);
  const [phone, setPhone]     = useState('');
  const [otpSent, setOtpSent] = useState(false);

  async function handlePasswordLogin(e) {
    e.preventDefault();
    setLoading(true);
    const res = await apiCall('/auth/login', 'POST', {
      identifier: e.target.email.value,
      password:   e.target.password.value,
    });
    if (res.ok) {
      login(res.data);
      showToast(`✓ Welcome back, ${res.data.name}!`);
      navigate('/farmer-dashboard');
    } else {
      showToast('✗ ' + res.data.message, true);
      setLoading(false);
    }
  }

  async function sendOtp(e) {
    e.preventDefault();
    setLoading(true);
    const res = await apiCall('/auth/farmer/send-otp', 'POST', { phone });
    showToast(res.data.message, !res.ok);
    if (res.ok) {
      if (res.data.dev_otp) showToast(`DEV — OTP: ${res.data.dev_otp}`);
      setOtpSent(true);
    }
    setLoading(false);
  }

  async function verifyOtp(e) {
    e.preventDefault();
    setLoading(true);
    const res = await apiCall('/auth/farmer/verify-otp', 'POST',
      { phone, otp: e.target.otp.value });
    if (res.ok) {
      login(res.data);
      showToast(`✓ Welcome back, ${res.data.name}!`);
      navigate('/farmer-dashboard');
    } else {
      showToast('✗ ' + res.data.message, true);
      setLoading(false);
    }
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center',
      justifyContent: 'center', padding: 16,
      background: `linear-gradient(135deg,${P}10,#fff)` }}>
      <div style={{ width: '100%', maxWidth: 420, background: '#fff', borderRadius: 20,
        padding: 32, boxShadow: '0 8px 32px rgba(0,0,0,0.08)' }}>

        {mode === 'forgot' ? (
          <ForgotPassword onBack={() => { setMode('login'); setLoading(false); }} />
        ) : (
          <>
            <div style={{ textAlign: 'center', marginBottom: 24 }}>
              <div style={{ fontSize: '3.5rem', marginBottom: 8 }}>👨‍🌾</div>
              <h2 style={{ fontWeight: 700, fontSize: '1.4rem', color: '#1f2937' }}>Farmer Login</h2>
              <p style={{ fontSize: 13, opacity: 0.6, marginTop: 4 }}>Sign in to your farm account</p>
            </div>

            {/* Tabs */}
            <div style={{ display: 'flex', background: '#f3f4f6', borderRadius: 12,
              padding: 4, marginBottom: 24, gap: 4 }}>
              {[['password','🔒 Email & Password'],['otp','📱 Phone OTP']].map(([t, label]) => (
                <button key={t} onClick={() => { setTab(t); setOtpSent(false); setPhone(''); }}
                  style={{ flex: 1, padding: '10px 0', borderRadius: 9, border: 'none',
                    fontWeight: 600, fontSize: 13, cursor: 'pointer',
                    fontFamily: 'Poppins, sans-serif', transition: 'all 0.2s',
                    background: tab === t ? '#fff' : 'transparent',
                    color: tab === t ? P : '#6b7280',
                    boxShadow: tab === t ? '0 2px 8px rgba(0,0,0,0.1)' : 'none' }}>
                  {label}
                </button>
              ))}
            </div>

            {tab === 'password' && (
              <form onSubmit={handlePasswordLogin}
                style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, display: 'block',
                    marginBottom: 6, color: '#374151' }}>Email Address</label>
                  <input style={inputStyle} type="email" name="email"
                    required placeholder="your@email.com" />
                </div>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, display: 'block',
                    marginBottom: 6, color: '#374151' }}>Password</label>
                  <input style={inputStyle} type="password" name="password"
                    required placeholder="Enter your password" />
                </div>
                <button type="submit" disabled={loading}
                  style={{ ...btnPrimary, opacity: loading ? 0.7 : 1, marginTop: 4 }}>
                  {loading ? 'Logging in...' : 'Login'}
                </button>
                <button type="button" onClick={() => setMode('forgot')}
                  style={{ background: 'none', border: 'none', color: P, fontSize: 13,
                    fontWeight: 600, cursor: 'pointer',
                    fontFamily: 'Poppins, sans-serif', textAlign: 'center' }}>
                  Forgot password?
                </button>
              </form>
            )}

            {tab === 'otp' && !otpSent && (
              <form onSubmit={sendOtp}
                style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, display: 'block',
                    marginBottom: 6, color: '#374151' }}>Registered Phone Number</label>
                  <input style={inputStyle} type="tel" value={phone}
                    onChange={e => setPhone(e.target.value)}
                    required pattern="[0-9]{10}" placeholder="10-digit phone number" />
                </div>
                <button type="submit" disabled={loading}
                  style={{ ...btnPrimary, opacity: loading ? 0.7 : 1 }}>
                  {loading ? 'Sending OTP...' : 'Send OTP'}
                </button>
              </form>
            )}

            {tab === 'otp' && otpSent && (
              <form onSubmit={verifyOtp}
                style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <p style={{ fontSize: 13, color: P, fontWeight: 600, textAlign: 'center',
                  background: `${P}10`, padding: '10px 16px', borderRadius: 8 }}>
                  📱 OTP sent to {phone}
                </p>
                <input style={{ ...inputStyle, fontSize: '1.8rem', letterSpacing: '0.4rem',
                  textAlign: 'center', padding: '14px 12px' }}
                  type="text" name="otp" required maxLength={6} placeholder="——————" />
                <button type="submit" disabled={loading}
                  style={{ ...btnPrimary, opacity: loading ? 0.7 : 1 }}>
                  {loading ? 'Verifying...' : 'Verify & Login'}
                </button>
                <button type="button" onClick={() => { setOtpSent(false); setPhone(''); }}
                  style={{ background: 'none', border: 'none', color: P, fontSize: 13,
                    cursor: 'pointer', fontFamily: 'Poppins, sans-serif', textAlign: 'center' }}>
                  ← Change number / Resend
                </button>
              </form>
            )}

            <button onClick={() => navigate('/')}
              style={{ width: '100%', marginTop: 20, background: '#fff', color: P,
                border: `2px solid ${P}`, padding: 12, borderRadius: 10, fontWeight: 600,
                fontSize: 14, cursor: 'pointer', fontFamily: 'Poppins, sans-serif' }}>
              ← Back to Home
            </button>
          </>
        )}
      </div>
    </div>
  );
}