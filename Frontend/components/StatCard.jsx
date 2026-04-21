import React from 'react';
const P = '#4a7c2c';

export default function StatCard({ icon, label, value, highlight }) {
  return (
    <div style={{
      background: 'linear-gradient(135deg,#f8fdf5,#e8f5e0)',
      borderLeft: `4px solid ${highlight ? '#f59e0b' : P}`,
      borderRadius: 16, padding: 24, boxShadow: '0 4px 12px rgba(0,0,0,0.08)'
    }}>
      <div style={{ fontSize: '2rem', marginBottom: 8 }}>{icon}</div>
      <p style={{ fontSize: 12, opacity: 0.75, marginBottom: 4 }}>{label}</p>
      <p style={{ fontWeight: 700, fontSize: '1.5rem', color: highlight ? '#f59e0b' : P }}>{value}</p>
    </div>
  );
}