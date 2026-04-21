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

export default function CustomerLogin() {
  const navigate  = useNavigate();
  const { login } = useAuth();
  const showToast = useToast();

  // 'choose' → user picks OTP or Password
  // 'otp-phone' → enter phone for OTP
  // 'otp-verify' → enter OTP
  // 'password' → enter phone + password
  const [step, setStep]           = useState('choose');
  const [phone, setPhone]         = useState('');
  const [isNew, setIsNew]         = useState(false);
  const [hasPassword, setHasPassword] = useState(false);
  const [loading, setLoading]     = useState(false);
  const [name, setName]           = useState('');

  async function sendOtp(e) {
    e.preventDefault();
    setLoading(true);
    const res = await apiCall('/auth/customer/send-otp', 'POST', { phone, name });
    showToast(res.data.message, !res.ok);
    if (res.ok) {
      if (res.data.dev_otp) showToast(`DEV — OTP: ${res.data.dev_otp}`);
      setIsNew(res.data.is_new);
      setHasPassword(res.data.has_password);
      setStep('otp-verify');
    }
    setLoading(false);
  }

  async function verifyOtp(e) {
    e.preventDefault();
    setLoading(true);
    const res = await apiCall('/auth/customer/verify-otp', 'POST',
      { phone, otp: e.target.otp.value });
    if (res.ok) {
      login(res.data);
      showToast(`✓ Welcome${isNew ? '' : ' back'}, ${res.data.name}!`);
      navigate('/customer-dashboard');
    } else {
      showToast('✗ ' + res.data.message, true);
      setLoading(false);
    }
  }

  async function handlePasswordLogin(e) {
    e.preventDefault();
    setLoading(true);
    const res = await apiCall('/auth/customer/login-password', 'POST', {
      phone: e.target.phone.value,
      password: e.target.password.value,
    });
    if (res.ok) {
      login(res.data);
      showToast(`✓ Welcome back, ${res.data.name}!`);
      navigate('/customer-dashboard');
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

        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <div style={{ fontSize: '3.5rem', marginBottom: 8 }}>🛍️</div>
          <h2 style={{ fontWeight: 700, fontSize: '1.4rem', color: '#1f2937' }}>
            Customer Login
          </h2>
          <p style={{ fontSize: 13, opacity: 0.6, marginTop: 4 }}>
            {step === 'choose'     && 'How would you like to sign in?'}
            {step === 'otp-phone'  && 'Enter your phone number'}
            {step === 'otp-verify' && `OTP sent to ${phone}`}
            {step === 'password'   && 'Sign in with your password'}
          </p>
        </div>

        {/* Step: choose method */}
        {step === 'choose' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <button onClick={() => setStep('otp-phone')}
              style={{ ...btnPrimary, padding: 16, fontSize: 15 }}>
              📱 Continue with OTP
            </button>
            <button onClick={() => setStep('password')}
              style={{ ...btnPrimary, background: 'none', color: P,
                border: `2px solid ${P}`, padding: 14 }}>
              🔒 Sign in with Password
            </button>
            <p style={{ fontSize: 12, textAlign: 'center', opacity: 0.5, marginTop: 4 }}>
              New here? OTP will create your account automatically.
            </p>
          </div>
        )}

        {/* Step: enter phone for OTP */}
        {step === 'otp-phone' && (
  <form onSubmit={sendOtp} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
    <div>
      <label style={{ fontSize: 12, fontWeight: 600, display: 'block',
        marginBottom: 6, color: '#374151' }}>Your Name (for new accounts)</label>
      <input style={inputStyle} type="text" value={name} onChange={e => setName(e.target.value)}
        placeholder="Full name (optional)" />
    </div>
    <div>
      <label style={{ fontSize: 12, fontWeight: 600, display: 'block',
        marginBottom: 6, color: '#374151' }}>Phone Number</label>
      <input style={inputStyle} type="tel" value={phone}
        onChange={e => setPhone(e.target.value)}
        required pattern="[0-9]{10}" placeholder="10-digit phone number" />
    </div>
            <button type="submit" disabled={loading}
              style={{ ...btnPrimary, opacity: loading ? 0.7 : 1 }}>
              {loading ? 'Sending OTP...' : 'Send OTP'}
            </button>
            <button type="button" onClick={() => setStep('choose')}
              style={{ background: 'none', border: 'none', color: '#6b7280',
                fontSize: 13, cursor: 'pointer', fontFamily: 'Poppins, sans-serif',
                textAlign: 'center' }}>
              ← Back
            </button>
          </form>
        )}

        {/* Step: enter OTP */}
        {step === 'otp-verify' && (
          <form onSubmit={verifyOtp} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {isNew && (
              <div style={{ background: `${P}08`, border: `1px solid ${P}25`,
                borderRadius: 10, padding: '12px 16px', fontSize: 13, color: '#374151' }}>
                👋 Welcome! We've created your account. Verify the OTP to continue.
              </div>
            )}
            <p style={{ fontSize: 13, color: P, fontWeight: 600, textAlign: 'center',
              background: `${P}10`, padding: '10px 16px', borderRadius: 8 }}>
              📱 OTP sent to {phone}
            </p>
            <input style={{ ...inputStyle, fontSize: '1.8rem', letterSpacing: '0.4rem',
              textAlign: 'center', padding: '14px 12px' }}
              type="text" name="otp" required maxLength={6} placeholder="——————" />
            <button type="submit" disabled={loading}
              style={{ ...btnPrimary, opacity: loading ? 0.7 : 1 }}>
              {loading ? 'Verifying...' : isNew ? 'Create Account & Login' : 'Verify & Login'}
            </button>
            <button type="button" onClick={() => { setStep('otp-phone'); }}
              style={{ background: 'none', border: 'none', color: P, fontSize: 13,
                cursor: 'pointer', fontFamily: 'Poppins, sans-serif', textAlign: 'center' }}>
              ← Change number / Resend
            </button>
          </form>
        )}

        {/* Step: password login */}
        {step === 'password' && (
          <form onSubmit={handlePasswordLogin}
            style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, display: 'block',
                marginBottom: 6, color: '#374151' }}>Phone Number</label>
              <input style={inputStyle} type="tel" name="phone"
                required pattern="[0-9]{10}" placeholder="10-digit phone number" />
            </div>
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, display: 'block',
                marginBottom: 6, color: '#374151' }}>Password</label>
              <input style={inputStyle} type="password" name="password"
                required placeholder="Enter your password" />
            </div>
            <button type="submit" disabled={loading}
              style={{ ...btnPrimary, opacity: loading ? 0.7 : 1 }}>
              {loading ? 'Logging in...' : 'Login'}
            </button>
            <p style={{ fontSize: 12, textAlign: 'center', opacity: 0.6 }}>
              No password yet?{' '}
              <button type="button" onClick={() => setStep('otp-phone')}
                style={{ background: 'none', border: 'none', color: P,
                  fontSize: 12, fontWeight: 600, cursor: 'pointer',
                  fontFamily: 'Poppins, sans-serif' }}>
                Login with OTP instead
              </button>
            </p>
            <button type="button" onClick={() => setStep('choose')}
              style={{ background: 'none', border: 'none', color: '#6b7280',
                fontSize: 13, cursor: 'pointer', fontFamily: 'Poppins, sans-serif',
                textAlign: 'center' }}>
              ← Back
            </button>
          </form>
        )}

        <button onClick={() => navigate('/')}
          style={{ width: '100%', marginTop: 20, background: '#fff', color: P,
            border: `2px solid ${P}`, padding: 12, borderRadius: 10, fontWeight: 600,
            fontSize: 14, cursor: 'pointer', fontFamily: 'Poppins, sans-serif' }}>
          ← Back to Home
        </button>
      </div>
    </div>
  );
}