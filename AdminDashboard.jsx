import React, { useState, useEffect, useCallback } from 'react';
import DashboardShell from '../components/DashboardShell';
import StatCard from '../components/StatCard';
import StatusBadge from '../components/StatusBadge';
import { apiCall, formatCurrency, formatDate } from '../api';
import { useToast } from '../components/Toast';

// ← ADD THESE THREE LINES RIGHT HERE
const P = '#4a7c2c';
const A = '#6b9b47';
const UPLOADS = 'http://localhost:3000/uploads';

const card = {
  background: '#fff',
  borderRadius: 16,
  padding: 24,
  boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
  marginBottom: 24
};

const inputStyle = {
  width: '100%',
  padding: 10,
  border: '2px solid #e5e7eb',
  borderRadius: 8,
  fontSize: 13,
  fontFamily: 'Poppins, sans-serif',
  outline: 'none',
  boxSizing: 'border-box'
};


const navItems = [
  { id: 'admin-stats',   icon: '📊', label: 'Overview' },
  { id: 'admin-pending', icon: '⏳', label: 'Approvals' },
  { id: 'admin-users',   icon: '👥', label: 'All Users' },
  { id: 'admin-flagged', icon: '🚨', label: 'Flagged' },
  { id: 'admin-millets', icon: '🌿', label: 'Millet Library' },
  { id: 'admin-schemes',  icon: '📋', label: 'Schemes' },
  { id: 'admin-recipes', icon: '👨‍🍳', label: 'Recipes', link: '/recipes' },
];

function DocLinks({ user }) {
  const docs = [
    { key: 'aadhaar_doc',   label: '📄 Aadhaar' },
    { key: 'profile_photo', label: '🖼 Photo'   },
    { key: 'upi_qr',        label: '📲 UPI QR'  },
  ];
  const available = docs.filter(d => user[d.key]);
  if (available.length === 0) return <span style={{ color: '#9ca3af', fontSize: 12 }}>—</span>;
  return (
    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
      {available.map(d => (
        <a key={d.key}
          href={`${UPLOADS}/${user[d.key]}`}
          target="_blank" rel="noreferrer" download
          style={{ color: '#4a7c2c', fontSize: 12, fontWeight: 600,
            background: '#4a7c2c12', padding: '2px 10px', borderRadius: 8,
            textDecoration: 'none', border: '1px solid #4a7c2c30' }}>
          {d.label}
        </a>
      ))}
    </div>
  );
}

export default function AdminDashboard() {
  const showToast = useToast();
const [stats, setStats]               = useState(null);
  const [pending, setPending]           = useState([]);
  const [users, setUsers]               = useState([]);
  const [flaggedRecipes, setFlaggedRecipes] = useState([]);
  const [flaggedReviews, setFlaggedReviews] = useState([]);
  const [millets, setMillets]           = useState([]);
  const [nutritionRows, setNutritionRows] = useState([
    { nutrient: 'Protein',       value: '' },
    { nutrient: 'Carbohydrates', value: '' },
    { nutrient: 'Fiber',         value: '' },
    { nutrient: 'Iron',          value: '' },
  ]);
  const [schemes, setSchemes]     = useState([]);
const [editingScheme, setEditingScheme] = useState(null); // null = add mode, object = edit mode
const [schemeForm, setSchemeForm] = useState({
  name: '', target_role: 'both', description: '',
  eligibility: '', official_url: '', deadline: '', icon: '📋'
});
  const [milletLoading, setMilletLoading] = useState(false);

  const load = useCallback(async () => {
  const [s, p, u, f, ml, sc] = await Promise.all([
  apiCall('/admin/analytics'),
  apiCall('/admin/pending'),
  apiCall('/admin/users'),
  apiCall('/admin/flagged'),
  apiCall('/admin/millets'),
  apiCall('/admin/schemes'),
]);
if (sc.ok) setSchemes(sc.data);
  if (s.ok)  setStats(s.data);
  if (p.ok)  setPending(p.data);
  if (u.ok)  setUsers(u.data);
  if (f.ok)  { setFlaggedRecipes(f.data.flagged_recipes || []); setFlaggedReviews(f.data.flagged_reviews || []); }
  if (ml.ok) setMillets(ml.data);
}, []);

  useEffect(() => { load(); }, [load]);

  async function approveUser(id, status) {
    if (!window.confirm(`Are you sure you want to ${status === 'approved' ? 'approve' : 'reject'} this user?`)) return;
    const res = await apiCall(`/admin/users/${id}/status`, 'PATCH', { status });
    showToast(res.data.message, !res.ok);
    if (res.ok) load();
  }

  async function deleteRecipe(id) {
    if (!window.confirm('Permanently remove this recipe?')) return;
    const res = await apiCall(`/admin/recipes/${id}`, 'DELETE');
    showToast(res.data.message, !res.ok);
    if (res.ok) load();
  }

// Handlers:
function addNutritionRow() {
  setNutritionRows(r => [...r, { nutrient: '', value: '' }]);
}
function removeNutritionRow(i) {
  setNutritionRows(r => r.filter((_, idx) => idx !== i));
}
function updateNutritionRow(i, field, val) {
  setNutritionRows(r => r.map((row, idx) => idx === i ? { ...row, [field]: val } : row));
}
async function addMillet(e) {
  e.preventDefault();
  const fd = new FormData(e.target);
  fd.append('nutrition', JSON.stringify(
    nutritionRows.filter(r => r.nutrient && r.value)
  ));
  const res = await apiCall('/admin/millets', 'POST', fd, true);
  showToast(res.data.message, !res.ok);
  if (res.ok) {
    e.target.reset();
    setNutritionRows([{ nutrient: '', value: '' }]);
    load();
  }
}
async function deleteMillet(id) {
  if (!window.confirm('Delete this millet entry permanently?')) return;
  const res = await apiCall(`/admin/millets/${id}`, 'DELETE');
  showToast(res.data.message, !res.ok);
  if (res.ok) load();
}

function exportUsers(users) {
  const headers = ['ID','Name','Role','Email','Phone','Status','Joined'];
  const rows = users.map(u => [
    u.id, u.full_name, u.role, u.email || '—',
    u.phone, u.status, formatDate(u.created_at)
  ]);
  const csv = [headers, ...rows].map(r => r.join(',')).join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `ShreeAnna_Users_${new Date().toISOString().slice(0,10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

function startEditScheme(s) {
  setEditingScheme(s);
  setSchemeForm({
    name: s.name, target_role: s.target_role,
    description: s.description, eligibility: s.eligibility || '',
    official_url: s.official_url || '', deadline: s.deadline?.slice(0,10) || '',
    icon: s.icon || '📋', is_active: s.is_active,
  });
}

function resetSchemeForm() {
  setEditingScheme(null);
  setSchemeForm({ name: '', target_role: 'both', description: '',
    eligibility: '', official_url: '', deadline: '', icon: '📋' });
}

async function saveScheme(e) {
  e.preventDefault();
  const res = editingScheme
    ? await apiCall(`/admin/schemes/${editingScheme.id}`, 'PUT', { ...schemeForm, is_active: schemeForm.is_active ?? 1 })
    : await apiCall('/admin/schemes', 'POST', schemeForm);
  showToast(res.data.message, !res.ok);
  if (res.ok) { resetSchemeForm(); load(); }
}

async function deleteScheme(id) {
  if (!window.confirm('Delete this scheme permanently?')) return;
  const res = await apiCall(`/admin/schemes/${id}`, 'DELETE');
  showToast(res.data.message, !res.ok);
  if (res.ok) load();
}

async function toggleSchemeActive(s) {
  const res = await apiCall(`/admin/schemes/${s.id}`, 'PUT', { ...s, is_active: s.is_active ? 0 : 1 });
  showToast(res.data.message, !res.ok);
  if (res.ok) load();
}

  if (!stats) return <DashboardShell emoji="⚙️" title="Admin Dashboard" navItems={navItems}><div style={{ textAlign: 'center', padding: 40, color: '#9ca3af' }}>Loading...</div></DashboardShell>;

  const thStyle = { padding: '10px 12px', textAlign: 'left', fontWeight: 600, fontSize: 13, background: '#f0faf0' };
  const tdStyle = { padding: '10px 12px', borderBottom: '1px solid #f3f4f6', fontSize: 13 };

  return (
    <DashboardShell emoji="⚙️" title="Admin Dashboard" navItems={navItems}>

      <section id="admin-stats" style={{ scrollMarginTop: 20, marginBottom: 24 }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(140px,1fr))', gap: 16 }}>
          <StatCard icon="👨‍🌾" label="Farmers" value={stats.total_farmers} />
          <StatCard icon="🏢" label="Startups" value={stats.active_startups} />
          <StatCard icon="🛍️" label="Customers" value={stats.total_customers} />
          <StatCard icon="⏳" label="Pending" value={stats.pending_approvals} highlight />
          <StatCard icon="📦" label="Orders" value={stats.total_orders} />
          <StatCard icon="💰" label="Revenue" value={formatCurrency(stats.total_revenue)} />
        </div>
      </section>

      <section id="admin-pending" style={{ scrollMarginTop: 20, ...card }}>
        <h3 style={{ fontWeight: 700, fontSize: '1.1rem', marginBottom: 16 }}>
          ✅ Pending Approvals {pending.length > 0 && <span style={{ background: '#fef3c7', color: '#d97706', padding: '2px 10px', borderRadius: 12, fontSize: 12, fontWeight: 600, marginLeft: 8 }}>{pending.length}</span>}
        </h3>
        {pending.length === 0 ? <p style={{ textAlign: 'center', color: '#9ca3af', padding: 20 }}>No pending approvals 🎉</p> : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead><tr>{['Name','Role','Phone','License','Category','Docs','Applied','Actions'].map(h => <th key={h} style={thStyle}>{h}</th>)}</tr></thead>
              <tbody>
                {pending.map(u => (
                  <tr key={u.id}>
                    <td style={tdStyle}><span style={{ fontWeight: 500 }}>{u.full_name}</span></td>
                    <td style={tdStyle}><span style={{ background: `${P}20`, color: P, padding: '2px 10px', borderRadius: 12, fontSize: 11, fontWeight: 600 }}>{u.role}</span></td>
                    <td style={tdStyle}>{u.phone}</td>
                    <td style={{ ...tdStyle, fontFamily: 'monospace', fontSize: 12 }}>{u.license || '—'}</td>
                    <td style={tdStyle}>{u.category || '—'}</td>
                    {/* <td style={tdStyle}>
                      {u.aadhaar_doc && <a href={`http://localhost:5000/uploads/${u.aadhaar_doc}`} target="_blank" rel="noreferrer" style={{ color: P, fontSize: 12, marginRight: 8 }}>Aadhaar</a>}
                      {u.profile_photo && <a href={`http://localhost:5000/uploads/${u.profile_photo}`} target="_blank" rel="noreferrer" style={{ color: P, fontSize: 12 }}>Photo</a>}
                    </td> */}
                    <td style={tdStyle}><DocLinks user={u} /></td>
                    <td style={tdStyle}>{formatDate(u.created_at)}</td>
                    <td style={tdStyle}>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <button onClick={() => approveUser(u.id, 'approved')} style={{ background: P, color: '#fff', border: 'none', padding: '4px 12px', borderRadius: 6, fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'Poppins, sans-serif' }}>✓ Approve</button>
                        <button onClick={() => approveUser(u.id, 'rejected')} style={{ background: '#dc2626', color: '#fff', border: 'none', padding: '4px 12px', borderRadius: 6, fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'Poppins, sans-serif' }}>✗ Reject</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section id="admin-users" style={{ scrollMarginTop: 20, ...card }}>
        {/* <h3 style={{ fontWeight: 700, fontSize: '1.1rem', marginBottom: 16 }}>👥 All Registered Users</h3> */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
  <h3 style={{ fontWeight: 700, fontSize: '1.1rem', margin: 0 }}>👥 All Registered Users</h3>
  <button onClick={() => exportUsers(users)}
    style={{ background: 'linear-gradient(135deg,#166534,#15803d)', color: '#fff',
      border: 'none', padding: '8px 18px', borderRadius: 9, fontWeight: 700,
      fontSize: 13, cursor: 'pointer', fontFamily: 'Poppins, sans-serif' }}>
    📥 Export to Excel
  </button>
</div>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead><tr>{['Name','Role','Email','Phone','Status','Documents','Joined'].map(h => <th key={h} style={thStyle}>{h}</th>)}</tr></thead>
            <tbody>
              {users.map(u => (
                <tr key={u.id}>
                  <td style={{ ...tdStyle, fontWeight: 500 }}>{u.full_name}</td>
                  <td style={tdStyle}><span style={{ background: `${P}20`, color: P, padding: '2px 10px', borderRadius: 12, fontSize: 11, fontWeight: 600 }}>{u.role}</span></td>
                  <td style={tdStyle}>{u.email || '—'}</td>
                  <td style={tdStyle}>{u.phone}</td>
                  <td style={tdStyle}><StatusBadge status={u.status} /></td>
                  <td style={tdStyle}><DocLinks user={u} /></td>
                  <td style={tdStyle}>{formatDate(u.created_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section id="admin-flagged" style={{ scrollMarginTop: 20 }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
          <div style={card}>
            <h3 style={{ fontWeight: 700, fontSize: '1.1rem', marginBottom: 16 }}>🚨 Flagged Recipes</h3>
            {flaggedRecipes.length === 0 ? <p style={{ textAlign: 'center', color: '#9ca3af', padding: 20 }}>No flagged recipes.</p> :
              flaggedRecipes.map(r => (
                <div key={r.id} style={{ background: '#fef3c7', borderLeft: '4px solid #f59e0b', borderRadius: 8, padding: 14, marginBottom: 10 }}>
                  <p style={{ fontWeight: 600, fontSize: 13 }}>{r.title}</p>
                  <p style={{ fontSize: 12, opacity: 0.7, marginBottom: 8 }}>by {r.author_name}</p>
                  <p style={{ fontSize: 13, marginBottom: 10 }}>{r.content?.slice(0, 120)}…</p>
                  <button onClick={() => deleteRecipe(r.id)} style={{ background: '#dc2626', color: '#fff', border: 'none', padding: '4px 12px', borderRadius: 6, fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'Poppins, sans-serif' }}>🗑 Remove</button>
                </div>
              ))
            }
          </div>
          <div style={card}>
            <h3 style={{ fontWeight: 700, fontSize: '1.1rem', marginBottom: 16 }}>⚠️ Flagged Reviews</h3>
            {flaggedReviews.length === 0 ? <p style={{ textAlign: 'center', color: '#9ca3af', padding: 20 }}>No flagged reviews.</p> :
              flaggedReviews.map(r => (
  <div key={r.id} style={{ background: '#fef3c7', borderLeft: '4px solid #f59e0b', borderRadius: 8, padding: 14, marginBottom: 10 }}>
    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
      <p style={{ fontWeight: 600, fontSize: 13 }}>{'⭐'.repeat(r.rating)} by {r.reviewer_name}</p>
      <button onClick={async () => {
        if (!window.confirm('Delete this review?')) return;
        const res = await apiCall(`/reviews/${r.id}`, 'DELETE');
        showToast(res.data.message, !res.ok);
        if (res.ok) load();
      }} style={{ background: '#dc2626', color: '#fff', border: 'none', padding: '3px 10px',
        borderRadius: 6, fontSize: 11, fontWeight: 600, cursor: 'pointer',
        fontFamily: 'Poppins, sans-serif' }}>
        🗑 Delete
      </button>
    </div>
    <p style={{ fontSize: 13 }}>{r.comment || '—'}</p>
  </div>
))
            }
          </div>
        </div>
      </section>

      <section id="admin-millets" style={{ scrollMarginTop: 20, ...card }}>
  <h3 style={{ fontWeight: 700, fontSize: '1.1rem', marginBottom: 20 }}>
    🌿 Millet Health Library
    <span style={{ fontSize: 12, fontWeight: 400, opacity: 0.6, marginLeft: 10 }}>
      {millets.length} entries published
    </span>
  </h3>

  {/* Add form */}
  <form onSubmit={addMillet} style={{ background: '#f8fdf5', borderRadius: 14, padding: 22, marginBottom: 24, border: '1px solid #e8f5e0' }}>
    <p style={{ fontWeight: 700, fontSize: 14, marginBottom: 14, color: P }}>➕ Add New Millet Entry</p>

    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
      <input style={inputStyle} name="name" required placeholder="Millet Name (e.g. Ragi / Finger Millet)" />
      <input style={inputStyle} name="scientific_name" placeholder="Scientific Name (e.g. Eleusine coracana)" />
    </div>

    <textarea style={{ ...inputStyle, resize: 'vertical', marginBottom: 12 }} name="description"
      required rows="3" placeholder="General description of this millet..." />

    <textarea style={{ ...inputStyle, resize: 'vertical', marginBottom: 16 }} name="benefits"
      required rows="6"
      placeholder={"Health benefits — one per line:\n- Rich in calcium and iron\n- Helps manage blood sugar\n- Gluten-free grain\n- Boosts bone health"} />

    {/* Nutrition rows */}
    <p style={{ fontWeight: 600, fontSize: 13, marginBottom: 10, color: '#374151' }}>
      🧪 Nutritional Info <span style={{ fontWeight: 400, opacity: 0.5 }}>(per 100g)</span>
    </p>
    {nutritionRows.map((row, i) => (
      <div key={i} style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
        <input style={{ ...inputStyle, flex: 1 }} placeholder="Nutrient (e.g. Protein)"
          value={row.nutrient} onChange={e => updateNutritionRow(i, 'nutrient', e.target.value)} />
        <input style={{ ...inputStyle, flex: 1 }} placeholder="Value (e.g. 7.3g)"
          value={row.value} onChange={e => updateNutritionRow(i, 'value', e.target.value)} />
        <button type="button" onClick={() => removeNutritionRow(i)}
          style={{ background: '#fee2e2', color: '#dc2626', border: 'none', padding: '0 14px',
            borderRadius: 8, cursor: 'pointer', fontWeight: 700, fontSize: '1.1rem' }}>×</button>
      </div>
    ))}
    <button type="button" onClick={addNutritionRow}
      style={{ fontSize: 13, color: P, background: `${P}12`, border: `1px dashed ${P}50`,
        padding: '7px 16px', borderRadius: 8, cursor: 'pointer', fontWeight: 600,
        fontFamily: 'Poppins,sans-serif', marginBottom: 16 }}>
      + Add Nutrient Row
    </button>

    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
      <div>
        <label style={{ fontSize: 12, fontWeight: 600, display: 'block', marginBottom: 6, color: '#374151' }}>
          📸 Millet Image
        </label>
        <input style={inputStyle} type="file" name="image" accept="image/*" />
      </div>
      <div>
        <label style={{ fontSize: 12, fontWeight: 600, display: 'block', marginBottom: 6, color: '#374151' }}>
          🔗 Official Source URL
        </label>
        <input style={inputStyle} name="source_url" type="url" placeholder="https://nhb.gov.in/..." />
      </div>
    </div>

    <button type="submit" disabled={milletLoading}
      style={{ background: `linear-gradient(135deg,${P},#2d5016)`, color: '#fff', border: 'none',
        padding: '12px 28px', borderRadius: 10, fontWeight: 700, fontSize: 14,
        cursor: milletLoading ? 'not-allowed' : 'pointer', fontFamily: 'Poppins,sans-serif',
        opacity: milletLoading ? 0.7 : 1 }}>
      {milletLoading ? 'Saving...' : '💾 Save Millet Entry'}
    </button>
  </form>

  {/* Existing entries */}
  {millets.length === 0
    ? <p style={{ textAlign: 'center', color: '#9ca3af', padding: 24 }}>No entries yet. Add your first millet above.</p>
    : millets.map(m => (
      <div key={m.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        padding: '14px 18px', background: '#fff', borderRadius: 12, marginBottom: 8,
        border: '2px solid #e8f5e0', boxShadow: '0 2px 6px rgba(0,0,0,0.04)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{ width: 44, height: 44, borderRadius: 10, background: `linear-gradient(135deg,${P},${A})`,
            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem',
            flexShrink: 0, overflow: 'hidden' }}>
            {m.image_filename
              ? <img src={`http://localhost:5000/uploads/${m.image_filename}`} alt={m.name} style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 10 }} />
              : '🌾'}
          </div>
          <div>
            <p style={{ fontWeight: 700, fontSize: 14, color: '#1f2937' }}>{m.name}</p>
            <p style={{ fontSize: 12, opacity: 0.55 }}>
              {m.scientific_name || 'No scientific name'} · {m.nutrition_count} nutrients · ❤️ {m.likes_count} bookmarks
              {!m.is_published && <span style={{ color: '#f59e0b', marginLeft: 6, fontWeight: 600 }}>● Draft</span>}
            </p>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <a href="/millets" target="_blank"
            style={{ background: `${P}15`, color: P, border: 'none', padding: '6px 14px', borderRadius: 8, fontSize: 12, fontWeight: 600, textDecoration: 'none', display: 'flex', alignItems: 'center' }}>
            👁 Preview
          </a>
          <button onClick={() => deleteMillet(m.id)}
            style={{ background: '#fee2e2', color: '#dc2626', border: 'none', padding: '6px 14px',
              borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'Poppins,sans-serif' }}>
            🗑 Delete
          </button>
        </div>
      </div>
    ))
  }
</section>

<section id="admin-schemes" style={{ scrollMarginTop: 20, ...card }}>
  <h3 style={{ fontWeight: 700, fontSize: '1.1rem', marginBottom: 20 }}>
    📋 Government & Business Schemes
    <span style={{ fontSize: 12, fontWeight: 400, opacity: 0.6, marginLeft: 10 }}>
      {schemes.filter(s => s.is_active).length} active
    </span>
  </h3>

  {/* Add / Edit form */}
  <form onSubmit={saveScheme} style={{ background: '#f8fdf5', borderRadius: 14,
    padding: 22, marginBottom: 24, border: '1px solid #e8f5e0' }}>
    <p style={{ fontWeight: 700, fontSize: 14, marginBottom: 14, color: P }}>
      {editingScheme ? '✏️ Edit Scheme' : '➕ Add New Scheme'}
    </p>

    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
      <input style={inputStyle} required placeholder="Scheme Name"
        value={schemeForm.name} onChange={e => setSchemeForm(f => ({ ...f, name: e.target.value }))} />
      <div style={{ display: 'flex', gap: 8 }}>
        <input style={{ ...inputStyle, width: 70 }} placeholder="Icon"
          value={schemeForm.icon} onChange={e => setSchemeForm(f => ({ ...f, icon: e.target.value }))} />
        <select style={{ ...inputStyle, flex: 1 }}
          value={schemeForm.target_role}
          onChange={e => setSchemeForm(f => ({ ...f, target_role: e.target.value }))}>
          <option value="both">🤝 Everyone</option>
          <option value="farmer">👨‍🌾 Farmers only</option>
          <option value="startup">🏢 Startups only</option>
        </select>
      </div>
    </div>

    <textarea style={{ ...inputStyle, resize: 'vertical', marginBottom: 12 }}
      required rows="2" placeholder="Short description..."
      value={schemeForm.description}
      onChange={e => setSchemeForm(f => ({ ...f, description: e.target.value }))} />

    <textarea style={{ ...inputStyle, resize: 'vertical', marginBottom: 12 }}
      rows="2" placeholder="Eligibility criteria (optional)..."
      value={schemeForm.eligibility}
      onChange={e => setSchemeForm(f => ({ ...f, eligibility: e.target.value }))} />

    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
      <input style={inputStyle} type="url" placeholder="Official URL (https://...)"
        value={schemeForm.official_url}
        onChange={e => setSchemeForm(f => ({ ...f, official_url: e.target.value }))} />
      <div>
        <label style={{ fontSize: 11, opacity: 0.6, display: 'block', marginBottom: 4 }}>
          Deadline (optional)
        </label>
        <input style={inputStyle} type="date"
          value={schemeForm.deadline}
          onChange={e => setSchemeForm(f => ({ ...f, deadline: e.target.value }))} />
      </div>
    </div>

    <div style={{ display: 'flex', gap: 10 }}>
      <button type="submit"
        style={{ background: `linear-gradient(135deg,${P},#2d5016)`, color: '#fff',
          border: 'none', padding: '10px 24px', borderRadius: 9, fontWeight: 700,
          fontSize: 13, cursor: 'pointer', fontFamily: 'Poppins,sans-serif' }}>
        {editingScheme ? '💾 Save Changes' : '➕ Add Scheme'}
      </button>
      {editingScheme && (
        <button type="button" onClick={resetSchemeForm}
          style={{ background: '#f3f4f6', color: '#374151', border: 'none',
            padding: '10px 20px', borderRadius: 9, fontWeight: 600,
            fontSize: 13, cursor: 'pointer', fontFamily: 'Poppins,sans-serif' }}>
          Cancel
        </button>
      )}
    </div>
  </form>

  {/* Existing schemes */}
  {schemes.length === 0
    ? <p style={{ textAlign: 'center', color: '#9ca3af', padding: 20 }}>No schemes yet.</p>
    : schemes.map(s => (
      <div key={s.id} style={{ display: 'flex', justifyContent: 'space-between',
        alignItems: 'flex-start', padding: '14px 18px', background: '#fff',
        borderRadius: 12, marginBottom: 8, border: `2px solid ${s.is_active ? '#e8f5e0' : '#f3f4f6'}`,
        opacity: s.is_active ? 1 : 0.5, boxShadow: '0 2px 6px rgba(0,0,0,0.04)' }}>

        <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start', flex: 1 }}>
          <span style={{ fontSize: '1.8rem' }}>{s.icon || '📋'}</span>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
              <p style={{ fontWeight: 700, fontSize: 14, color: '#1f2937' }}>{s.name}</p>
              <span style={{ fontSize: 10, fontWeight: 600, padding: '2px 8px', borderRadius: 10,
                background: s.target_role === 'farmer' ? '#d1fae5'
                          : s.target_role === 'startup' ? '#dbeafe' : '#ede9fe',
                color: s.target_role === 'farmer' ? '#065f46'
                     : s.target_role === 'startup' ? '#1e40af' : '#7c3aed' }}>
                {s.target_role === 'farmer' ? '👨‍🌾 Farmers'
                : s.target_role === 'startup' ? '🏢 Startups' : '🤝 Everyone'}
              </span>
              {!s.is_active && (
                <span style={{ fontSize: 10, fontWeight: 600, padding: '2px 8px',
                  borderRadius: 10, background: '#fee2e2', color: '#dc2626' }}>
                  Inactive
                </span>
              )}
            </div>
            <p style={{ fontSize: 12, opacity: 0.65 }}>{s.description}</p>
            {s.deadline && (
              <p style={{ fontSize: 11, color: '#f59e0b', fontWeight: 600, marginTop: 4 }}>
                ⏰ Deadline: {new Date(s.deadline).toLocaleDateString('en-IN')}
              </p>
            )}
            {s.official_url && (
              <a href={s.official_url} target="_blank" rel="noreferrer"
                style={{ fontSize: 11, color: P, fontWeight: 600, marginTop: 4, display: 'block' }}>
                🔗 {s.official_url.slice(0, 50)}{s.official_url.length > 50 ? '...' : ''}
              </a>
            )}
          </div>
        </div>

        <div style={{ display: 'flex', gap: 6, flexShrink: 0, marginLeft: 12 }}>
          <button onClick={() => toggleSchemeActive(s)}
            style={{ background: s.is_active ? '#fef3c7' : '#d1fae5',
              color: s.is_active ? '#92400e' : '#065f46',
              border: 'none', padding: '5px 12px', borderRadius: 7,
              fontSize: 11, fontWeight: 600, cursor: 'pointer',
              fontFamily: 'Poppins,sans-serif' }}>
            {s.is_active ? '⏸ Deactivate' : '▶ Activate'}
          </button>
          <button onClick={() => startEditScheme(s)}
            style={{ background: `${P}15`, color: P, border: 'none',
              padding: '5px 12px', borderRadius: 7, fontSize: 11,
              fontWeight: 600, cursor: 'pointer', fontFamily: 'Poppins,sans-serif' }}>
            ✏️ Edit
          </button>
          <button onClick={() => deleteScheme(s.id)}
            style={{ background: '#fee2e2', color: '#dc2626', border: 'none',
              padding: '5px 12px', borderRadius: 7, fontSize: 11,
              fontWeight: 600, cursor: 'pointer', fontFamily: 'Poppins,sans-serif' }}>
            🗑
          </button>
        </div>
      </div>
    ))
  }
</section>


    </DashboardShell>
  );
}