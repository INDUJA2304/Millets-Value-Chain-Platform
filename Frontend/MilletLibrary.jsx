import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiCall } from '../api';
import { useToast } from '../components/Toast';
import { useAuth } from '../context/Authcontext';

const P = '#4a7c2c', A = '#6b9b47';

const MILLET_EMOJIS = {
  'ragi':   '🌾', 'jowar': '🌽', 'bajra': '🌿', 'foxtail': '🌱',
  'kodo':   '🍃', 'little': '🌾', 'barnyard': '🌿', 'proso': '🌱',
};
function milletEmoji(name) {
  const key = Object.keys(MILLET_EMOJIS).find(k => name.toLowerCase().includes(k));
  return key ? MILLET_EMOJIS[key] : '🌾';
}

export default function MilletLibrary() {
  const { auth } = useAuth();
  const showToast = useToast();
  const navigate = useNavigate();
  const [millets, setMillets]       = useState([]);
  const [likedIds, setLikedIds]     = useState(new Set());
  const [selected, setSelected]     = useState(null);
  const [search, setSearch]         = useState('');
  const [loading, setLoading]       = useState(true);

  useEffect(() => {
  async function fetchAll() {
    const res = await apiCall('/millets');
    if (res.ok) {
      const data = res.data.map(m => ({
        ...m,
        nutrition: Array.isArray(m.nutrition) ? m.nutrition : []
      }));
      setMillets(data);
    }
    setLoading(false);

    // Now fetch liked IDs if logged in
    if (auth?.token) {
      const lr = await apiCall('/millets/user/likes');
      if (lr.ok) setLikedIds(new Set(lr.data));
    }
  }
  fetchAll();
}, [auth]);

  async function toggleLike(e, milletId) {
  e.stopPropagation();
  if (!auth?.token) {
    showToast('Please login to bookmark millets.', true);
    return;
  }
  const res = await apiCall(`/millets/${milletId}/like`, 'POST');
  if (res.ok) {
    setLikedIds(prev => {
      const next = new Set(prev);
      res.data.liked ? next.add(milletId) : next.delete(milletId);
      return next;
    });
    setMillets(ms => ms.map(m =>
      m.id === milletId
        ? { ...m, likes_count: m.likes_count + (res.data.liked ? 1 : -1) }
        : m
    ));
    if (selected?.id === milletId) {
      setSelected(s => ({ ...s, likes_count: s.likes_count + (res.data.liked ? 1 : -1) }));
    }
    showToast(res.data.message);
  } else {
    showToast(res.data.message, true);
  }
}

  const filtered = millets.filter(m =>
    m.name.toLowerCase().includes(search.toLowerCase()) ||
    (m.scientific_name || '').toLowerCase().includes(search.toLowerCase())
  );

  const inputFocus = e => e.target.style.borderColor = P;
  const inputBlur  = e => e.target.style.borderColor = '#e5e7eb';

  return (
    <div style={{ minHeight: '100vh', background: '#f9fafb' }}>

      {/* Hero banner */}
      <div style={{ background: `linear-gradient(135deg,${P},${A})`, padding: '48px 24px', textAlign: 'center' }}>
        <div style={{ fontSize: '3.5rem', marginBottom: 12 }}>🌾</div>
        <h1 style={{ color: '#fff', fontWeight: 700, fontSize: '2rem', marginBottom: 8 }}>
          Millet Health Library
        </h1>
        <p style={{ color: '#fff', opacity: 0.9, fontSize: 15, marginBottom: 28 }}>
          Official health benefits — verified &amp; sourced
        </p>

        {/* Search */}
        <div style={{ maxWidth: 420, margin: '0 auto', position: 'relative' }}>
          <span style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)', fontSize: '1rem' }}>🔍</span>
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search millets by name..."
            style={{ width: '100%', padding: '12px 16px 12px 44px', borderRadius: 30, border: 'none', fontSize: 14, fontFamily: 'Poppins,sans-serif', outline: 'none', boxSizing: 'border-box', boxShadow: '0 4px 16px rgba(0,0,0,0.15)' }}
          />
        </div>

        {/* Back button if logged in */}
        {auth?.token && (
  <button onClick={() => navigate(`/${auth.role}-dashboard`)}
    style={{ marginTop: 20, background: 'rgba(255,255,255,0.2)', color: '#fff', border: '2px solid rgba(255,255,255,0.4)', padding: '8px 20px', borderRadius: 20, fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'Poppins,sans-serif', backdropFilter: 'blur(4px)' }}>
    ← Back to Dashboard
  </button>
)}
      </div>

      {/* Stats bar */}
      <div style={{ background: '#fff', borderBottom: '1px solid #e8f5e0', padding: '12px 24px', display: 'flex', justifyContent: 'center', gap: 40 }}>
        {[['🌾', millets.length, 'Millets'], ['❤️', millets.reduce((s, m) => s + (m.likes_count || 0), 0), 'Bookmarks'], ['🧪', millets.reduce((s, m) => s + (m.nutrition?.length || 0), 0), 'Nutrients Tracked']].map(([icon, val, label]) => (
          <div key={label} style={{ textAlign: 'center' }}>
            <p style={{ fontWeight: 700, fontSize: '1.2rem', color: P }}>{icon} {val}</p>
            <p style={{ fontSize: 11, opacity: 0.6 }}>{label}</p>
          </div>
        ))}
      </div>

      {/* Grid */}
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '40px 20px' }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: 60, color: '#9ca3af' }}>
            <div style={{ fontSize: '2rem', marginBottom: 12, animation: 'spin 1s linear infinite' }}>⟳</div>
            Loading millet library...
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 60, color: '#9ca3af' }}>
            <div style={{ fontSize: '3rem', marginBottom: 12 }}>🌾</div>
            <p>{search ? `No millets matching "${search}"` : 'No millet entries yet. Check back soon!'}</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(270px,1fr))', gap: 22 }}>
            {filtered.map(m => (
              <MilletCard key={m.id} millet={m} liked={likedIds.has(m.id)}
                onSelect={() => setSelected(m)} onLike={e => toggleLike(e, m.id)} />
            ))}
          </div>
        )}
      </div>

      {/* Detail Modal */}
      {selected && (
        <MilletModal millet={selected} liked={likedIds.has(selected.id)}
          onClose={() => setSelected(null)} onLike={e => toggleLike(e, selected.id)} />
      )}
    </div>
  );
}

// ── Millet Card ───────────────────────────────────────────────
function MilletCard({ millet: m, liked, onSelect, onLike }) {
  const [hovered, setHovered] = useState(false);
  return (
    <div onClick={onSelect}
      onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)}
      style={{ background: '#fff', borderRadius: 18, overflow: 'hidden', cursor: 'pointer',
        boxShadow: hovered ? '0 16px 40px rgba(0,0,0,0.13)' : '0 4px 14px rgba(0,0,0,0.07)',
        transform: hovered ? 'translateY(-6px)' : 'none',
        transition: 'all 0.25s ease', border: `2px solid ${hovered ? '#4a7c2c30' : '#e8f5e0'}` }}>

      {/* Image / placeholder */}
      <div style={{ height: 150, background: `linear-gradient(135deg,#2d5016,${A})`, position: 'relative', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        {m.image_filename
          ? <img src={`http://localhost:5000/uploads/${m.image_filename}`} alt={m.name}
              style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          : <span style={{ fontSize: '4rem', filter: 'drop-shadow(0 2px 8px rgba(0,0,0,0.3))' }}>{milletEmoji(m.name)}</span>
        }
        {/* Like button overlay */}
        <button onClick={onLike}
          style={{ position: 'absolute', top: 12, right: 12, background: liked ? '#ef4444' : 'rgba(255,255,255,0.2)',
            border: liked ? 'none' : '2px solid rgba(255,255,255,0.5)', width: 36, height: 36,
            borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer', fontSize: '1rem', backdropFilter: 'blur(4px)',
            transition: 'all 0.2s', transform: liked ? 'scale(1.1)' : 'scale(1)' }}>
          {liked ? '❤️' : '🤍'}
        </button>
      </div>

      <div style={{ padding: '18px 18px 14px' }}>
        <h3 style={{ fontWeight: 700, fontSize: '1rem', color: '#1f2937', marginBottom: 3 }}>{m.name}</h3>
        {m.scientific_name && (
          <p style={{ fontSize: 11, color: A, fontStyle: 'italic', marginBottom: 8 }}>{m.scientific_name}</p>
        )}
        <p style={{ fontSize: 13, opacity: 0.65, lineHeight: 1.6, marginBottom: 14,
          display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
          {m.description}
        </p>

        {/* Nutrition pills */}
        {m.nutrition?.length > 0 && (
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 14 }}>
            {m.nutrition.slice(0, 3).map((n, i) => (
              <span key={i} style={{ background: '#f0faf0', color: '#2d5016', fontSize: 11, fontWeight: 600, padding: '3px 10px', borderRadius: 20, border: '1px solid #c8e6c9' }}>
                {n.nutrient_name}: {n.value_per_100g}
              </span>
            ))}
            {m.nutrition.length > 3 && (
              <span style={{ background: '#f0faf0', color: '#2d5016', fontSize: 11, fontWeight: 600, padding: '3px 10px', borderRadius: 20 }}>+{m.nutrition.length - 3} more</span>
            )}
          </div>
        )}

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: 10, borderTop: '1px solid #f0faf0' }}>
          <span style={{ fontSize: 12, color: '#9ca3af' }}>❤️ {m.likes_count || 0} bookmarks</span>
          <span style={{ fontSize: 12, fontWeight: 600, color: '#4a7c2c' }}>Read more →</span>
        </div>
      </div>
    </div>
  );
}

// ── Detail Modal ──────────────────────────────────────────────
function MilletModal({ millet: m, liked, onClose, onLike }) {
  const P = '#4a7c2c', A = '#6b9b47';
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 1000,
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}
      onClick={onClose}>
      <div style={{ background: '#fff', borderRadius: 22, maxWidth: 640, width: '100%',
        maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 32px 80px rgba(0,0,0,0.25)' }}
        onClick={e => e.stopPropagation()}>

        {/* Header image */}
        <div style={{ height: 200, background: `linear-gradient(135deg,#2d5016,${A})`, position: 'relative',
          display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '22px 22px 0 0', overflow: 'hidden' }}>
          {m.image_filename
            ? <img src={`http://localhost:5000/uploads/${m.image_filename}`} alt={m.name}
                style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            : <span style={{ fontSize: '5rem' }}>{milletEmoji(m.name)}</span>
          }
          <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top,rgba(0,0,0,0.5),transparent)' }} />
          <div style={{ position: 'absolute', bottom: 20, left: 24, color: '#fff' }}>
            <h2 style={{ fontWeight: 700, fontSize: '1.5rem', marginBottom: 2 }}>{m.name}</h2>
            {m.scientific_name && <p style={{ fontSize: 13, opacity: 0.85, fontStyle: 'italic' }}>{m.scientific_name}</p>}
          </div>
          <button onClick={onClose}
            style={{ position: 'absolute', top: 16, right: 16, background: 'rgba(0,0,0,0.3)',
              border: 'none', color: '#fff', width: 36, height: 36, borderRadius: '50%',
              fontSize: '1rem', cursor: 'pointer', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✕</button>
        </div>

        <div style={{ padding: 28 }}>

          {/* About */}
          <h4 style={{ fontWeight: 700, fontSize: 14, color: '#1f2937', marginBottom: 8 }}>📖 About</h4>
          <p style={{ fontSize: 14, lineHeight: 1.8, opacity: 0.8, marginBottom: 24 }}>{m.description}</p>

          {/* Health Benefits */}
          <h4 style={{ fontWeight: 700, fontSize: 14, color: '#1f2937', marginBottom: 10 }}>✅ Health Benefits</h4>
          <div style={{ background: 'linear-gradient(135deg,#f0faf0,#e8f5e0)', borderRadius: 14, padding: 18, marginBottom: 24 }}>
            {m.benefits.split('\n').filter(Boolean).map((b, i) => (
              <div key={i} style={{ display: 'flex', gap: 10, marginBottom: i < m.benefits.split('\n').filter(Boolean).length - 1 ? 10 : 0, alignItems: 'flex-start' }}>
                <div style={{ width: 22, height: 22, borderRadius: '50%', background: P, color: '#fff',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, flexShrink: 0, marginTop: 1 }}>✓</div>
                <span style={{ fontSize: 14, lineHeight: 1.6, color: '#1f2937' }}>{b.replace(/^[-•*]\s*/, '')}</span>
              </div>
            ))}
          </div>

          {/* Nutrition Table */}
          {m.nutrition?.length > 0 && (
            <>
              <h4 style={{ fontWeight: 700, fontSize: 14, color: '#1f2937', marginBottom: 12 }}>🧪 Nutritional Value <span style={{ fontWeight: 400, opacity: 0.5, fontSize: 12 }}>(per 100g)</span></h4>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(130px,1fr))', gap: 10, marginBottom: 24 }}>
                {m.nutrition.map((n, i) => (
                  <div key={i} style={{ background: '#f9fafb', border: `2px solid #e8f5e0`,
                    borderRadius: 12, padding: '12px 14px', textAlign: 'center',
                    transition: 'border-color 0.2s' }}>
                    <p style={{ fontSize: 11, opacity: 0.55, marginBottom: 6, textTransform: 'capitalize' }}>{n.nutrient_name}</p>
                    <p style={{ fontWeight: 700, fontSize: '1.1rem', color: P }}>{n.value_per_100g}</p>
                  </div>
                ))}
              </div>
            </>
          )}

          {/* Footer actions */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            paddingTop: 16, borderTop: `2px solid #e8f5e0`, gap: 12, flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={onLike}
                style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 20px',
                  borderRadius: 10, border: 'none', fontWeight: 600, fontSize: 14, cursor: 'pointer',
                  fontFamily: 'Poppins,sans-serif', transition: 'all 0.2s',
                  background: liked ? '#fef2f2' : `${P}15`,
                  color: liked ? '#ef4444' : P }}>
                {liked ? '❤️ Bookmarked' : '🤍 Bookmark'}
                <span style={{ opacity: 0.6, fontSize: 12 }}>({m.likes_count || 0})</span>
              </button>
              {m.source_url && (
                <a href={m.source_url} target="_blank" rel="noopener noreferrer"
                  style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '10px 18px',
                    borderRadius: 10, background: '#f0faf0', color: P, fontWeight: 600,
                    fontSize: 14, textDecoration: 'none', border: `1px solid ${A}40` }}>
                  🔗 Official Source
                </a>
              )}
            </div>
            <button onClick={onClose}
              style={{ padding: '10px 20px', borderRadius: 10, background: '#f3f4f6',
                border: 'none', fontWeight: 600, cursor: 'pointer', fontFamily: 'Poppins,sans-serif' }}>Close</button>
          </div>
        </div>
      </div>
    </div>
  );
}