import React from 'react';

const styles = {
  pending:   { background: '#fef3c7', color: '#d97706' },
  approved:  { background: '#d1fae5', color: '#059669' },
  delivered: { background: '#d1fae5', color: '#059669' },
  confirmed: { background: '#dbeafe', color: '#2563eb' },
  shipped:   { background: '#ede9fe', color: '#7c3aed' },
  cancelled: { background: '#fee2e2', color: '#dc2626' },
  rejected:  { background: '#fee2e2', color: '#dc2626' },
};

export default function StatusBadge({ status }) {
  const s = (status || 'pending').toLowerCase();
  return (
    <span style={{
      ...styles[s], display: 'inline-flex', alignItems: 'center',
      padding: '4px 12px', borderRadius: 20, fontSize: '0.75rem', fontWeight: 600
    }}>
      {status}
    </span>
  );
}