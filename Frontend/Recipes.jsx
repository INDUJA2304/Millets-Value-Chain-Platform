import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiCall, formatDate } from '../api';
import { useAuth } from '../context/Authcontext';
import { useToast } from '../components/Toast';

const P = '#4a7c2c', A = '#6b9b47';
const inputStyle = {
  width: '100%', padding: 11, border: '2px solid #e5e7eb', borderRadius: 8,
  fontSize: 13, fontFamily: 'Poppins, sans-serif', outline: 'none', boxSizing: 'border-box',
};

// ── Recipe detail modal ───────────────────────────────────────
function RecipeModal({ recipe, onClose, onLike, onFlag }) {
  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)',
      zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
      <div onClick={e => e.stopPropagation()} style={{ background: '#fff', borderRadius: 16,
        padding: 28, maxWidth: 580, width: '100%', maxHeight: '85vh', overflowY: 'auto',
        boxShadow: '0 20px 60px rgba(0,0,0,0.2)' }}>

        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 40, height: 40, borderRadius: '50%', background: `${P}20`,
              color: P, display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontWeight: 700 }}>
              {recipe.author_name?.charAt(0).toUpperCase()}
            </div>
            <div>
              <p style={{ fontWeight: 600, fontSize: 14 }}>{recipe.author_name}</p>
              <p style={{ fontSize: 12, opacity: 0.5 }}>{formatDate(recipe.created_at)}</p>
            </div>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none',
            fontSize: '1.3rem', cursor: 'pointer', color: '#6b7280' }}>✕</button>
        </div>

        <div style={{ height: 4, borderRadius: 4,
          background: `linear-gradient(90deg,${P},${A})`, marginBottom: 16 }} />
        <h2 style={{ fontWeight: 700, fontSize: '1.3rem', marginBottom: 8 }}>{recipe.title}</h2>
        {recipe.short_description && (
          <p style={{ color: P, fontStyle: 'italic', fontSize: 14, marginBottom: 16 }}>
            {recipe.short_description}
          </p>
        )}

        <div style={{ background: `${A}08`, border: `1px solid ${A}30`, borderRadius: 12,
          padding: 16, fontSize: 14, lineHeight: 1.7, whiteSpace: 'pre-line',
          color: '#1f2937', marginBottom: 16 }}>
          {recipe.content}
        </div>

        {recipe.youtube_link?.startsWith('http') && (
          <a href={recipe.youtube_link} target="_blank" rel="noopener noreferrer"
            style={{ display: 'flex', alignItems: 'center', gap: 12, padding: 12,
              borderRadius: 10, background: '#ff000012', color: '#cc0000',
              border: '1px solid #ff000025', textDecoration: 'none', marginBottom: 16,
              fontSize: 14, fontWeight: 600 }}>
            <span style={{ fontSize: '1.4rem' }}>▶</span>
            <div>
              <p>Watch on YouTube</p>
              <p style={{ fontSize: 11, opacity: 0.7, fontWeight: 400 }}>{recipe.youtube_link}</p>
            </div>
          </a>
        )}

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          borderTop: `2px solid ${A}20`, paddingTop: 16 }}>
          <div style={{ display: 'flex', gap: 10 }}>
            <button onClick={onLike} style={{ background: P, color: '#fff', border: 'none',
              padding: '8px 16px', borderRadius: 8, fontWeight: 600, cursor: 'pointer',
              fontSize: 13, fontFamily: 'Poppins, sans-serif' }}>
              ❤️ Like ({recipe.likes_count || 0})
            </button>
            <button onClick={onFlag} style={{ background: '#fee2e2', color: '#dc2626',
              border: 'none', padding: '8px 16px', borderRadius: 8, fontWeight: 600,
              cursor: 'pointer', fontSize: 13, fontFamily: 'Poppins, sans-serif' }}>
              🚩 Report
            </button>
          </div>
          <button onClick={onClose} style={{ background: `${A}20`, color: P, border: 'none',
            padding: '8px 16px', borderRadius: 8, fontWeight: 600, cursor: 'pointer',
            fontFamily: 'Poppins, sans-serif' }}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────
export default function Recipes() {
  const navigate = useNavigate();
  const { auth } = useAuth();
  const showToast = useToast();

  const [recipes, setRecipes] = useState([]);
  const [recipeModal, setRecipeModal] = useState(null);
  const [shareLoading, setShareLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);

  const load = useCallback(async () => {
    const res = await apiCall('/recipes');
    if (res.ok) setRecipes(res.data);
  }, []);

  useEffect(() => { load(); }, [load]);

  async function shareRecipe(e) {
    e.preventDefault();
    setShareLoading(true);
    const res = await apiCall('/recipes', 'POST', {
      title:             e.target.title.value,
      short_description: e.target.short_description.value,
      content:           e.target.content.value,
      youtube_link:      e.target.youtube_link.value || null,
    });
    showToast(res.data.message, !res.ok);
    setShareLoading(false);
    if (res.ok) { e.target.reset(); setShowForm(false); load(); }
  }

  async function likeRecipe(id) {
    const res = await apiCall(`/recipes/${id}/like`, 'POST');
    showToast(res.data.message, !res.ok);
    if (res.ok) load();
  }

  async function flagRecipe(id) {
    if (!window.confirm('Report this recipe to admin?')) return;
    const res = await apiCall(`/recipes/${id}/flag`, 'POST');
    showToast(res.data.message, !res.ok);
  }

  // Back button goes to the right dashboard based on role
  function goBack() {
    if (auth?.role) navigate(`/${auth.role}-dashboard`);
    else navigate('/');
  }

  return (
    <div style={{ minHeight: '100vh', background: `linear-gradient(135deg,${P}08,#fff)`,
      fontFamily: 'Poppins, sans-serif' }}>

      {/* Header */}
      <div style={{ background: '#fff', borderBottom: '2px solid #e8f5e0',
        padding: '16px 24px', display: 'flex', justifyContent: 'space-between',
        alignItems: 'center', position: 'sticky', top: 0, zIndex: 100,
        boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button onClick={goBack} style={{ background: `${P}15`, color: P, border: 'none',
            padding: '8px 14px', borderRadius: 8, fontWeight: 600, fontSize: 13,
            cursor: 'pointer', fontFamily: 'Poppins, sans-serif' }}>
            ← Back
          </button>
          <div>
            <h1 style={{ fontWeight: 800, fontSize: '1.3rem', color: '#1f2937', margin: 0 }}>
              👨‍🍳 Recipe Community
            </h1>
            <p style={{ fontSize: 12, opacity: 0.5, margin: 0 }}>
              {recipes.length} recipes shared by the community
            </p>
          </div>
        </div>
        <button onClick={() => setShowForm(s => !s)}
          style={{ background: `linear-gradient(135deg,${P},#2d5016)`, color: '#fff',
            border: 'none', padding: '10px 20px', borderRadius: 10, fontWeight: 700,
            fontSize: 13, cursor: 'pointer', fontFamily: 'Poppins, sans-serif' }}>
          {showForm ? '✕ Cancel' : '✍️ Share a Recipe'}
        </button>
      </div>

      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '28px 20px' }}>

        {/* Share form */}
        {showForm && (
          <div style={{ background: '#fff', borderRadius: 16, padding: 28,
            boxShadow: '0 4px 20px rgba(0,0,0,0.08)', marginBottom: 28,
            border: `2px solid ${A}30` }}>
            <h3 style={{ fontWeight: 700, fontSize: '1.1rem', marginBottom: 18, color: P }}>
              ✍️ Share Your Recipe
            </h3>
            <form onSubmit={shareRecipe} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <input style={inputStyle} type="text" name="title" required
                placeholder="Recipe Title (e.g. Ragi Chocolate Cake)" />
              <input style={inputStyle} type="text" name="short_description" required
                maxLength="300" placeholder="One-line summary" />
              <textarea style={{ ...inputStyle, resize: 'vertical' }} name="content"
                required rows="6" placeholder="Ingredients, steps, tips..." />
              <input style={inputStyle} type="url" name="youtube_link"
                placeholder="YouTube Link (optional)" />
              <button type="submit" disabled={shareLoading}
                style={{ alignSelf: 'flex-start', background: `linear-gradient(135deg,${P},#2d5016)`,
                  color: '#fff', border: 'none', padding: '11px 24px', borderRadius: 9,
                  fontWeight: 700, fontSize: 14, cursor: 'pointer',
                  fontFamily: 'Poppins, sans-serif', opacity: shareLoading ? 0.7 : 1 }}>
                {shareLoading ? 'Sharing...' : '🍽️ Share Recipe'}
              </button>
            </form>
          </div>
        )}

        {/* Recipe grid */}
        {recipes.length === 0
          ? (
            <div style={{ textAlign: 'center', padding: '60px 20px', color: '#9ca3af' }}>
              <div style={{ fontSize: '3rem', marginBottom: 12 }}>🍽️</div>
              <p style={{ fontWeight: 600, fontSize: 16 }}>No recipes yet.</p>
              <p style={{ fontSize: 13 }}>Be the first to share one!</p>
            </div>
          )
          : (
            <div style={{ display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill,minmax(280px,1fr))', gap: 20 }}>
              {recipes.map(r => (
                <div key={r.id} onClick={() => setRecipeModal(r)}
                  style={{ background: '#fff', border: `2px solid ${A}20`, borderRadius: 14,
                    overflow: 'hidden', cursor: 'pointer', transition: 'transform 0.2s,box-shadow 0.2s' }}
                  onMouseEnter={e => {
                    e.currentTarget.style.transform = 'translateY(-4px)';
                    e.currentTarget.style.boxShadow = '0 12px 28px rgba(0,0,0,0.1)';
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.transform = '';
                    e.currentTarget.style.boxShadow = '';
                  }}>
                  <div style={{ height: 6, background: `linear-gradient(90deg,${P},${A})` }} />
                  <div style={{ padding: 18 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                      <div style={{ width: 34, height: 34, borderRadius: '50%',
                        background: `${P}20`, color: P, display: 'flex', alignItems: 'center',
                        justifyContent: 'center', fontWeight: 700, fontSize: 13, flexShrink: 0 }}>
                        {r.author_name?.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p style={{ fontSize: 12, fontWeight: 600 }}>{r.author_name}</p>
                        <p style={{ fontSize: 11, opacity: 0.5 }}>{formatDate(r.created_at)}</p>
                      </div>
                    </div>
                    <h4 style={{ fontWeight: 700, fontSize: 14, marginBottom: 6 }}>{r.title}</h4>
                    {r.short_description && (
                      <p style={{ fontSize: 12, color: P, fontStyle: 'italic', marginBottom: 8,
                        display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical',
                        overflow: 'hidden' }}>
                        {r.short_description}
                      </p>
                    )}
                    <p style={{ fontSize: 12, opacity: 0.6, display: '-webkit-box',
                      WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden',
                      whiteSpace: 'pre-line' }}>
                      {r.content}
                    </p>
                    <div style={{ display: 'flex', justifyContent: 'space-between',
                      alignItems: 'center', marginTop: 14, paddingTop: 12,
                      borderTop: `1px solid ${A}20` }}>
                      <div style={{ display: 'flex', gap: 12, fontSize: 12 }}>
                        <span style={{ color: P }}>❤️ {r.likes_count || 0}</span>
                        <span style={{ opacity: 0.6 }}>💬 {r.comments_count || 0}</span>
                        {r.youtube_link && <span style={{ color: '#cc0000' }}>▶</span>}
                      </div>
                      <span style={{ fontSize: 12, fontWeight: 600, color: P }}>Read more →</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )
        }
      </div>

      {recipeModal && (
        <RecipeModal
          recipe={recipeModal}
          onClose={() => setRecipeModal(null)}
          onLike={() => { likeRecipe(recipeModal.id); setRecipeModal(null); }}
          onFlag={() => { flagRecipe(recipeModal.id); setRecipeModal(null); }}
        />
      )}
    </div>
  );
}