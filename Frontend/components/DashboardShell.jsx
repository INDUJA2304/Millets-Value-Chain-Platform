import React from 'react';
import { useAuth } from '../context/Authcontext.js';
import { useNavigate } from 'react-router-dom';
import TranslateButton from './TranslateButton.jsx';

const P = '#4a7c2c';
// const A = '#6b9b47';

export default function DashboardShell({ emoji, title, navItems, children }) {
  const { auth, logout } = useAuth();
  const navigate = useNavigate();

  function doLogout() { logout(); navigate('/'); }

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#f9fafb' }}>

      {/* Sidebar */}
      <aside style={{
        width: 220, flexShrink: 0, position: 'sticky', top: 0, height: '100vh',
        overflowY: 'auto', background: '#fff', borderRight: '2px solid #e8f5e0',
        display: 'flex', flexDirection: 'column', boxShadow: '4px 0 12px rgba(0,0,0,0.04)'
      }}>
        <div style={{ padding: 16, borderBottom: '2px solid #e8f5e0', marginBottom: 8 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
            <span style={{ fontSize: '1.8rem' }}>🌾</span>
            <span style={{ fontWeight: 700, fontSize: 14, color: P }}>Shree Anna</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 12 }}>
            <div style={{
              width: 32, height: 32, borderRadius: '50%', display: 'flex', alignItems: 'center',
              justifyContent: 'center', fontWeight: 700, fontSize: 14,
              background: `${P}20`, color: P, flexShrink: 0
            }}>
              {(auth.name || 'U').charAt(0).toUpperCase()}
            </div>
            <div>
              <p style={{ fontWeight: 600, fontSize: 12, color: '#1f2937' }}>{auth.name}</p>
              <p style={{ fontSize: 11, opacity: 0.5, textTransform: 'capitalize' }}>{auth.role}</p>
            </div>
          </div>
        </div>

        <nav style={{ flex: 1, padding: '8px 0' }}>
  {navItems.map(item => (
    <a key={item.id}
      href={item.link ? item.link : `#${item.id}`}
      onClick={item.link ? undefined : e => {
        e.preventDefault();
        document.getElementById(item.id)?.scrollIntoView({ behavior: 'smooth' });
      }}
      style={{
        display: 'flex', alignItems: 'center', gap: 10,
        padding: '12px 16px', borderRadius: 10, margin: '2px 8px',
        fontSize: 13, fontWeight: 600, cursor: 'pointer',
        textDecoration: 'none', color: '#6b7280', transition: 'all 0.2s'
      }}
      onMouseEnter={e => { e.currentTarget.style.background = '#f0faf0'; e.currentTarget.style.color = P; }}
      onMouseLeave={e => { e.currentTarget.style.background = 'none'; e.currentTarget.style.color = '#6b7280'; }}
    >
      <span style={{ fontSize: '1.2rem', width: 24, textAlign: 'center' }}>{item.icon}</span>
      <span>{item.label}</span>
    </a>
  ))}
</nav>

{/* <a href="/millets" target="_blank" rel="noopener noreferrer"
  style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 16px',
    borderRadius: 10, margin: '2px 8px', fontSize: 13, fontWeight: 600,
    textDecoration: 'none', color: P, background: `${P}08`,
    border: `1px solid ${P}20` }}>
  <span style={{ fontSize: '1.1rem' }}>🌿</span>
  Millet Library
</a> */}
        <div style={{ padding: 12, borderTop: '2px solid #e8f5e0' }}>
          <button onClick={doLogout} style={{
            display: 'flex', alignItems: 'center', gap: 10,
            padding: '12px 16px', borderRadius: 10, width: '100%',
            fontSize: 13, fontWeight: 600, cursor: 'pointer',
            border: 'none', background: 'none', color: '#dc2626'
          }}>
            <span>🚪</span> Logout
          </button>
        </div>
      </aside>

      {/* Main */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <header style={{
          position: 'sticky', top: 0, zIndex: 40,
          background: '#fff', borderBottom: '2px solid #e8f5e0',
          padding: '12px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          boxShadow: '0 1px 4px rgba(0,0,0,0.06)'
        }}>
          <div>
            <h2 style={{ fontWeight: 700, fontSize: '1.1rem', color: '#1f2937' }}>{emoji} {title}</h2>
            <p style={{ fontSize: 12, opacity: 0.6 }}>Welcome back, {auth.name}!</p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
    <TranslateButton />

          <button onClick={doLogout} style={{
            padding: '8px 16px', borderRadius: 8, fontWeight: 600, fontSize: 13,
            background: P, color: '#fff', border: 'none', cursor: 'pointer'
          }}>Logout</button>
          </div>
        </header>

        <div style={{ padding: '24px', paddingBottom: 48 }}>
          {children}
        </div>
      </div>
    </div>
  );
}