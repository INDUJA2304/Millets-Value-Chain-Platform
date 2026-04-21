import React, { useState, useEffect, useCallback } from 'react';
import DashboardShell from '../components/DashboardShell';
import StatCard from '../components/StatCard';
import StatusBadge from '../components/StatusBadge';
import { apiCall, formatCurrency, formatDate } from '../api';
import { useToast } from '../components/Toast';
import { useAuth } from '../context/Authcontext';

const P = '#4a7c2c', A = '#6b9b47';
const card = { background: '#fff', borderRadius: 16, padding: 24, boxShadow: '0 4px 12px rgba(0,0,0,0.08)', marginBottom: 24 };
const inputStyle = { width: '100%', padding: 11, border: '2px solid #e5e7eb', borderRadius: 8, fontSize: 13, fontFamily: 'Poppins, sans-serif', outline: 'none', boxSizing: 'border-box' };

const navItems = [
  { id: 'customer-stats',   icon: '📊', label: 'Overview' },
  { id: 'customer-shop',    icon: '🛒', label: 'Shop' },
  { id: 'customer-orders',  icon: '📋', label: 'My Orders' },
  { id: 'customer-recipes', icon: '👨‍🍳', label: 'Recipes', link: '/recipes' },
];

// function OrderModal({ product, onClose, onSuccess }) {
//   const showToast = useToast();
//   const [qty, setQty] = useState('');
//   const [loading, setLoading] = useState(false);

//   async function submit(e) {
//     e.preventDefault();
//     setLoading(true);
//     const res = await apiCall('/customer/orders', 'POST', {
//       product_id: product.id, quantity: qty,
//       delivery_address: e.target.delivery_address.value,
//     });
//     showToast(res.data.message, !res.ok);
//     setLoading(false);
//     if (res.ok) { onClose(); onSuccess(); }
//   }

//   return (
//     <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }} onClick={onClose}>
//       <div style={{ background: '#fff', borderRadius: 16, padding: 28, maxWidth: 440, width: '100%', boxShadow: '0 20px 60px rgba(0,0,0,0.2)' }} onClick={e => e.stopPropagation()}>
//         <h3 style={{ fontWeight: 700, fontSize: '1.2rem', marginBottom: 8 }}>🛒 Place Order</h3>
//         <p style={{ fontSize: 13, opacity: 0.7, marginBottom: 20 }}>Product: <strong>{product.name}</strong> @ {formatCurrency(product.price_per_unit)}/kg</p>
//         <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
//           <input style={inputStyle} type="number" name="quantity" value={qty} onChange={e => setQty(e.target.value)} required min="1" placeholder="Quantity (KG)" />
//           <textarea style={{ ...inputStyle, resize: 'vertical' }} name="delivery_address" required rows="2" placeholder="Full delivery address" />
//           <div style={{ background: `${A}10`, padding: 12, borderRadius: 8, fontSize: 13, fontWeight: 600, color: P }}>
//             Total: {formatCurrency((parseFloat(qty) || 0) * product.price_per_unit)}
//           </div>
//           <div style={{ display: 'flex', gap: 10 }}>
//             <button type="submit" disabled={loading} style={{ flex: 1, background: `linear-gradient(135deg,${P},#2d5016)`, color: '#fff', border: 'none', padding: 12, borderRadius: 10, fontWeight: 700, cursor: 'pointer', fontFamily: 'Poppins, sans-serif' }}>
//               {loading ? 'Placing...' : 'Confirm Order'}
//             </button>
//             <button type="button" onClick={onClose} style={{ flex: 1, background: '#fff', border: '2px solid #e5e7eb', padding: 12, borderRadius: 10, fontWeight: 600, cursor: 'pointer', fontFamily: 'Poppins, sans-serif' }}>Cancel</button>
//           </div>
//         </form>
//       </div>
//     </div>
//   );
// }

const UPLOADS = 'http://localhost:3000/uploads';

function OrderModal({ product, onClose, onSuccess }) {
  const showToast = useToast();
  const [qty, setQty]                   = useState('');
  const [loading, setLoading]           = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('cod');
  const [deliveryMethod, setDeliveryMethod] = useState('speedpost');
  const [placedOrder, setPlacedOrder]   = useState(null); // after success, show payment info

  async function submit(e) {
    e.preventDefault();
    setLoading(true);
    const res = await apiCall('/customer/orders', 'POST', {
      product_id:      product.id,
      quantity:        qty,
      delivery_address: e.target.delivery_address.value,
      payment_method:  paymentMethod,
      delivery_method: deliveryMethod,
    });
    showToast(res.data.message, !res.ok);
    setLoading(false);
    if (res.ok) {
      if (paymentMethod === 'upi') {
        // Fetch seller UPI QR to show
        const upiRes = await apiCall(`/orders/${res.data.order_id}/seller-upi`);
        if (upiRes.ok) { setPlacedOrder(upiRes.data); return; }
      }
      onClose(); onSuccess();
    }
  }

  // UPI payment screen shown after order is placed
  if (placedOrder) return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000,
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
      <div style={{ background: '#fff', borderRadius: 16, padding: 28, maxWidth: 400,
        width: '100%', boxShadow: '0 20px 60px rgba(0,0,0,0.2)', textAlign: 'center' }}>
        <div style={{ fontSize: '2.5rem', marginBottom: 8 }}>📲</div>
        <h3 style={{ fontWeight: 700, fontSize: '1.1rem', marginBottom: 4 }}>Pay via UPI</h3>
        <p style={{ fontSize: 13, opacity: 0.6, marginBottom: 4 }}>Order placed! Complete payment to confirm.</p>

        {/* Safety notice */}
        <div style={{ background: '#fef3c7', border: '1px solid #f59e0b', borderRadius: 10,
          padding: 12, marginBottom: 16, textAlign: 'left' }}>
          <p style={{ fontSize: 12, fontWeight: 700, color: '#92400e', marginBottom: 4 }}>
            🔒 Payment Safety Tips
          </p>
          <p style={{ fontSize: 12, color: '#78350f', lineHeight: 1.6 }}>
            • Pay <strong>exactly ₹{placedOrder.total_amount}</strong> — no more, no less<br/>
            • Screenshot your payment confirmation<br/>
            • Never pay to a different number or account<br/>
            • Contact support if seller asks for extra payment
          </p>
        </div>

        <p style={{ fontSize: 13, fontWeight: 600, marginBottom: 12 }}>
          Pay <span style={{ color: P, fontSize: '1.1rem' }}>₹{placedOrder.total_amount}</span> to {placedOrder.seller_name}
        </p>

        {placedOrder.upi_qr ? (
          <img src={`${UPLOADS}/${placedOrder.upi_qr}`} alt="UPI QR"
            style={{ width: 180, height: 180, borderRadius: 12, border: '3px solid #e8f5e0',
              marginBottom: 12, objectFit: 'contain' }} />
        ) : (
          <div style={{ background: '#f3f4f6', borderRadius: 12, padding: 20, marginBottom: 12 }}>
            <p style={{ fontSize: 13, opacity: 0.6 }}>QR not available.</p>
            <p style={{ fontSize: 13, fontWeight: 600 }}>Call seller: {placedOrder.seller_phone}</p>
          </div>
        )}

        <p style={{ fontSize: 11, opacity: 0.5, marginBottom: 16 }}>
          Scan with any UPI app — GPay, PhonePe, Paytm, BHIM
        </p>

        <button onClick={() => { onClose(); onSuccess(); }}
          style={{ width: '100%', background: `linear-gradient(135deg,${P},#2d5016)`,
            color: '#fff', border: 'none', padding: 12, borderRadius: 10,
            fontWeight: 700, cursor: 'pointer', fontFamily: 'Poppins, sans-serif' }}>
          ✅ Done — I've Paid
        </button>
        <p style={{ fontSize: 11, opacity: 0.5, marginTop: 8 }}>
          Seller will confirm receipt and process your order.
        </p>
      </div>
    </div>
  );

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000,
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }} onClick={onClose}>
      <div style={{ background: '#fff', borderRadius: 16, padding: 28, maxWidth: 460,
        width: '100%', boxShadow: '0 20px 60px rgba(0,0,0,0.2)', maxHeight: '90vh', overflowY: 'auto' }}
        onClick={e => e.stopPropagation()}>
        <h3 style={{ fontWeight: 700, fontSize: '1.2rem', marginBottom: 4 }}>🛒 Place Order</h3>
        <p style={{ fontSize: 13, opacity: 0.7, marginBottom: 20 }}>
          <strong>{product.name}</strong> @ {formatCurrency(product.price_per_unit)}/{product.unit || 'kg'}
        </p>

        <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <input style={inputStyle} type="number" name="quantity" value={qty}
            onChange={e => setQty(e.target.value)} required min="1"
            placeholder={`Quantity (${product.unit || 'kg'})`} />

          <textarea style={{ ...inputStyle, resize: 'vertical' }} name="delivery_address"
            required rows="2" placeholder="Full delivery address" />

          {/* Delivery method */}
          <div>
            <p style={{ fontSize: 12, fontWeight: 600, marginBottom: 8, color: '#374151' }}>
              🚚 Delivery Method
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {[
                ['speedpost', '📮 India Post Speed Post', 'Recommended for rural — reliable & affordable'],
                ['courier',   '📦 Private Courier',       'Delhivery, Blue Dart etc. — faster, urban areas'],
                ['pickup',    '🤝 Self Pickup',            'Collect directly from seller'],
              ].map(([val, label, desc]) => (
                <label key={val} style={{ display: 'flex', alignItems: 'flex-start', gap: 10,
                  background: deliveryMethod === val ? `${P}10` : '#f9fafb',
                  border: `2px solid ${deliveryMethod === val ? P : '#e5e7eb'}`,
                  borderRadius: 8, padding: '10px 12px', cursor: 'pointer' }}>
                  <input type="radio" name="delivery_method" value={val}
                    checked={deliveryMethod === val}
                    onChange={() => setDeliveryMethod(val)}
                    style={{ marginTop: 2, accentColor: P }} />
                  <div>
                    <p style={{ fontSize: 13, fontWeight: 600 }}>{label}</p>
                    <p style={{ fontSize: 11, opacity: 0.6 }}>{desc}</p>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Payment method */}
          <div>
            <p style={{ fontSize: 12, fontWeight: 600, marginBottom: 8, color: '#374151' }}>
              💳 Payment Method
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {[
                ['cod', '💵 Cash on Delivery', 'Pay when you receive the goods'],
                ['upi', '📲 Pay Now via UPI',  'Scan seller\'s QR code after placing order'],
              ].map(([val, label, desc]) => (
                <label key={val} style={{ display: 'flex', alignItems: 'flex-start', gap: 10,
                  background: paymentMethod === val ? `${P}10` : '#f9fafb',
                  border: `2px solid ${paymentMethod === val ? P : '#e5e7eb'}`,
                  borderRadius: 8, padding: '10px 12px', cursor: 'pointer' }}>
                  <input type="radio" name="payment_method" value={val}
                    checked={paymentMethod === val}
                    onChange={() => setPaymentMethod(val)}
                    style={{ marginTop: 2, accentColor: P }} />
                  <div>
                    <p style={{ fontSize: 13, fontWeight: 600 }}>{label}</p>
                    <p style={{ fontSize: 11, opacity: 0.6 }}>{desc}</p>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Total */}
          <div style={{ background: `${A}10`, padding: 12, borderRadius: 8,
            fontSize: 13, fontWeight: 600, color: P, display: 'flex',
            justifyContent: 'space-between' }}>
            <span>Total Amount</span>
            <span>{formatCurrency((parseFloat(qty) || 0) * product.price_per_unit)}</span>
          </div>

          <div style={{ display: 'flex', gap: 10 }}>
            <button type="submit" disabled={loading}
              style={{ flex: 1, background: `linear-gradient(135deg,${P},#2d5016)`,
                color: '#fff', border: 'none', padding: 12, borderRadius: 10,
                fontWeight: 700, cursor: 'pointer', fontFamily: 'Poppins, sans-serif',
                opacity: loading ? 0.7 : 1 }}>
              {loading ? 'Placing...' : paymentMethod === 'upi' ? 'Place & Pay via UPI 📲' : 'Place Order 💵'}
            </button>
            <button type="button" onClick={onClose}
              style={{ flex: 1, background: '#fff', border: '2px solid #e5e7eb',
                padding: 12, borderRadius: 10, fontWeight: 600,
                cursor: 'pointer', fontFamily: 'Poppins, sans-serif' }}>
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function RecipeModal({ recipe, onClose, onLike, onFlag }) {
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }} onClick={onClose}>
      <div style={{ background: '#fff', borderRadius: 16, padding: 28, maxWidth: 580, width: '100%', maxHeight: '85vh', overflowY: 'auto', boxShadow: '0 20px 60px rgba(0,0,0,0.2)' }} onClick={e => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 40, height: 40, borderRadius: '50%', background: `${P}20`, color: P, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700 }}>
              {recipe.author_name?.charAt(0).toUpperCase()}
            </div>
            <div>
              <p style={{ fontWeight: 600, fontSize: 14 }}>{recipe.author_name}</p>
              <p style={{ fontSize: 12, opacity: 0.5 }}>{formatDate(recipe.created_at)}</p>
            </div>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: '1.3rem', cursor: 'pointer', color: '#6b7280' }}>✕</button>
        </div>

        <div style={{ height: 4, borderRadius: 4, background: `linear-gradient(90deg,${P},${A})`, marginBottom: 16 }} />
        <h2 style={{ fontWeight: 700, fontSize: '1.3rem', marginBottom: 8 }}>{recipe.title}</h2>
        {recipe.short_description && <p style={{ color: P, fontStyle: 'italic', fontSize: 14, marginBottom: 16 }}>{recipe.short_description}</p>}

        <div style={{ background: `${A}08`, border: `1px solid ${A}30`, borderRadius: 12, padding: 16, fontSize: 14, lineHeight: 1.7, whiteSpace: 'pre-line', color: '#1f2937', marginBottom: 16 }}>
          {recipe.content}
        </div>

        {recipe.youtube_link?.startsWith('http') && (
          <a href={recipe.youtube_link} target="_blank" rel="noopener noreferrer"
            style={{ display: 'flex', alignItems: 'center', gap: 12, padding: 12, borderRadius: 10, background: '#ff000012', color: '#cc0000', border: '1px solid #ff000025', textDecoration: 'none', marginBottom: 16, fontSize: 14, fontWeight: 600 }}>
            <span style={{ fontSize: '1.4rem' }}>▶</span>
            <div><p>Watch on YouTube</p><p style={{ fontSize: 11, opacity: 0.7, fontWeight: 400 }}>{recipe.youtube_link}</p></div>
          </a>
        )}

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: `2px solid ${A}20`, paddingTop: 16 }}>
          <div style={{ display: 'flex', gap: 10 }}>
            <button onClick={onLike} style={{ background: P, color: '#fff', border: 'none', padding: '8px 16px', borderRadius: 8, fontWeight: 600, cursor: 'pointer', fontSize: 13, fontFamily: 'Poppins, sans-serif' }}>
              ❤️ Like ({recipe.likes_count || 0})
            </button>
            <button onClick={onFlag} style={{ background: '#fee2e2', color: '#dc2626', border: 'none', padding: '8px 16px', borderRadius: 8, fontWeight: 600, cursor: 'pointer', fontSize: 13, fontFamily: 'Poppins, sans-serif' }}>
              🚩 Report
            </button>
          </div>
          <button onClick={onClose} style={{ background: `${A}20`, color: P, border: 'none', padding: '8px 16px', borderRadius: 8, fontWeight: 600, cursor: 'pointer', fontFamily: 'Poppins, sans-serif' }}>Close</button>
        </div>
      </div>
    </div>
  );
}

function ReviewModal({ order, onClose, onSuccess }) {
  const showToast = useToast();
  const [rating, setRating]   = useState(0);
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(false);

  async function submit(e) {
    e.preventDefault();
    if (rating === 0) { showToast('Please select a star rating.', true); return; }
    setLoading(true);
    const res = await apiCall('/customer/reviews', 'POST', {
      order_id:   order.id,
      product_id: order.product_id,
      seller_id:  order.seller_id,
      rating,
      comment,
    });
    showToast(res.data.message, !res.ok);
    setLoading(false);
    if (res.ok) { onClose(); onSuccess(); }
  }

  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)',
      zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
      <div onClick={e => e.stopPropagation()} style={{ background: '#fff', borderRadius: 16,
        padding: 28, maxWidth: 420, width: '100%', boxShadow: '0 20px 60px rgba(0,0,0,0.2)' }}>
        <h3 style={{ fontWeight: 700, fontSize: '1.1rem', marginBottom: 4 }}>⭐ Write a Review</h3>
        <p style={{ fontSize: 13, opacity: 0.6, marginBottom: 20 }}>
          {order.product_name} — from {order.seller_name}
        </p>

        {/* Star selector */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 20, justifyContent: 'center' }}>
          {[1,2,3,4,5].map(s => (
            <span key={s} onClick={() => setRating(s)}
              style={{ fontSize: '2rem', cursor: 'pointer', transition: 'transform 0.1s',
                transform: rating >= s ? 'scale(1.2)' : 'scale(1)',
                filter: rating >= s ? 'none' : 'grayscale(1)' }}>
              ⭐
            </span>
          ))}
        </div>
        {rating > 0 && (
          <p style={{ textAlign: 'center', fontSize: 13, color: '#4a7c2c', fontWeight: 600, marginBottom: 16 }}>
            {['','Very Poor','Poor','Average','Good','Excellent'][rating]}
          </p>
        )}

        <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <textarea
            style={{ width: '100%', padding: 11, border: '2px solid #e5e7eb', borderRadius: 8,
              fontSize: 13, fontFamily: 'Poppins, sans-serif', outline: 'none',
              boxSizing: 'border-box', resize: 'vertical' }}
            rows="3" value={comment} onChange={e => setComment(e.target.value)}
            placeholder="Share your experience (optional)..." />
          <div style={{ display: 'flex', gap: 10 }}>
            <button type="submit" disabled={loading}
              style={{ flex: 1, background: 'linear-gradient(135deg,#4a7c2c,#2d5016)',
                color: '#fff', border: 'none', padding: 12, borderRadius: 10,
                fontWeight: 700, cursor: 'pointer', fontFamily: 'Poppins, sans-serif',
                opacity: loading ? 0.7 : 1 }}>
              {loading ? 'Submitting...' : '⭐ Submit Review'}
            </button>
            <button type="button" onClick={onClose}
              style={{ flex: 1, background: '#fff', border: '2px solid #e5e7eb',
                padding: 12, borderRadius: 10, fontWeight: 600,
                cursor: 'pointer', fontFamily: 'Poppins, sans-serif' }}>
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function CustomerDashboard() {
  const showToast = useToast();
  const { auth } = useAuth();
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [recipes, setRecipes] = useState([]);
  const [filter, setFilter] = useState('');
  const [orderModal, setOrderModal] = useState(null);
  const [recipeModal, setRecipeModal] = useState(null);
  const [recipeLoading, setRecipeLoading] = useState(false);
  const [showSetPassword, setShowSetPassword] = useState(false);
  const [newPass, setNewPass]   = useState('');
  const [confirmPass, setConfirmPass] = useState('');
  const [passLoading, setPassLoading] = useState(false);
  const [reviewModal, setReviewModal]     = useState(null); // holds the order object
  const [reviewedOrders, setReviewedOrders] = useState([]);

  async function handleSetPassword(e) {
  e.preventDefault();
  if (newPass !== confirmPass) { showToast('Passwords do not match.', true); return; }
  setPassLoading(true);
  const res = await apiCall('/auth/customer/set-password', 'POST', { new_password: newPass });
  showToast(res.data.message, !res.ok);
  setPassLoading(false);
  if (res.ok) { setShowSetPassword(false); setNewPass(''); setConfirmPass(''); }
}

  const load = useCallback(async (f = filter) => {
  const [pr, or, re, rv] = await Promise.all([
    apiCall('/customer/products' + (f ? `?seller_type=${f}` : '')),
    apiCall('/customer/orders'),
    apiCall('/recipes'),
    apiCall('/customer/reviewed-orders'),
  ]);
  if (pr.ok) setProducts(pr.data);
  if (or.ok) setOrders(or.data);
  if (re.ok) setRecipes(re.data);
  if (rv.ok) setReviewedOrders(rv.data);
}, [filter]);

  useEffect(() => { load(); }, [load]);

  async function shareRecipe(e) {
    e.preventDefault();
    setRecipeLoading(true);
    const res = await apiCall('/recipes', 'POST', {
      title: e.target.title.value,
      short_description: e.target.short_description.value,
      content: e.target.content.value,
      youtube_link: e.target.youtube_link.value || null,
    });
    showToast(res.data.message, !res.ok);
    setRecipeLoading(false);
    if (res.ok) { e.target.reset(); load(); }
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

  async function confirmDelivery(orderId) {
  if (!window.confirm('Confirm that you have received this order?')) return;
  const res = await apiCall(`/customer/orders/${orderId}/confirm-delivery`, 'PATCH');
  showToast(res.data.message, !res.ok);
  if (res.ok) load();
}

  const totalSpent = orders.reduce((s, o) => o.status !== 'cancelled' ? s + Number(o.total_amount) : s, 0);

  return (
    <DashboardShell emoji="🛍️" title="Customer Dashboard" navItems={navItems}>

      {/* Stats */}
      <section id="customer-stats" style={{ scrollMarginTop: 20, marginBottom: 24 }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(160px,1fr))', gap: 16 }}>
          <StatCard icon="🛒" label="Total Orders" value={orders.length} />
          <StatCard icon="✅" label="Delivered" value={orders.filter(o => o.status === 'delivered').length} />
          <StatCard icon="📝" label="My Recipes" value={recipes.filter(r => r.author_id == auth.id).length} />
          <StatCard icon="💰" label="Total Spent" value={formatCurrency(totalSpent)} />
        </div>
        <div style={{ ...card, background: 'linear-gradient(135deg,#f0faf0,#fff)', border: '1px solid #e8f5e0' }}>
  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: showSetPassword ? 16 : 0 }}>
    <div>
      <p style={{ fontWeight: 700, fontSize: 14 }}>🔒 Password Login</p>
      <p style={{ fontSize: 12, opacity: 0.6 }}>Set a password so you can log in without OTP</p>
    </div>
    <button onClick={() => setShowSetPassword(s => !s)}
      style={{ background: P, color: '#fff', border: 'none', padding: '8px 16px',
        borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer',
        fontFamily: 'Poppins, sans-serif' }}>
      {showSetPassword ? 'Cancel' : 'Set Password'}
    </button>
  </div>
  {showSetPassword && (
    <form onSubmit={handleSetPassword} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <input style={inputStyle} type="password" value={newPass}
        onChange={e => setNewPass(e.target.value)}
        required minLength={8} placeholder="New password (min 8 characters)" />
      <input style={inputStyle} type="password" value={confirmPass}
        onChange={e => setConfirmPass(e.target.value)}
        required placeholder="Confirm password" />
      {confirmPass && (
        <p style={{ fontSize: 12, color: newPass === confirmPass ? '#059669' : '#dc2626' }}>
          {newPass === confirmPass ? '✓ Passwords match' : '✗ Passwords do not match'}
        </p>
      )}
      <button type="submit" disabled={passLoading}
        style={{ background: P, color: '#fff', border: 'none', padding: '10px 20px',
          borderRadius: 8, fontWeight: 600, cursor: 'pointer',
          fontFamily: 'Poppins, sans-serif', alignSelf: 'flex-start',
          opacity: passLoading ? 0.7 : 1 }}>
        {passLoading ? 'Saving...' : '💾 Save Password'}
      </button>
    </form>
  )}
</div>
      </section>

      {/* Shop */}
      <section id="customer-shop" style={{ scrollMarginTop: 20, ...card }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, flexWrap: 'wrap', gap: 10 }}>
          <h3 style={{ fontWeight: 700, fontSize: '1.1rem' }}>🛒 Shop Products</h3>
          <div style={{ display: 'flex', gap: 8 }}>
            {[['', 'All'], ['farmer', 'Farmers'], ['startup', 'Startups']].map(([v, l]) => (
              <button key={v} onClick={() => { setFilter(v); load(v); }} style={{ padding: '8px 16px', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'Poppins, sans-serif', background: filter === v ? P : `${A}20`, color: filter === v ? '#fff' : P, border: 'none' }}>{l}</button>
            ))}
          </div>
        </div>
        {products.length === 0 ? <p style={{ textAlign: 'center', color: '#9ca3af', padding: 20 }}>No products available.</p> : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(240px,1fr))', gap: 16 }}>
            {products.map(p => (
              <div key={p.id} style={{ background: `${A}10`, border: `2px solid ${A}20`, borderRadius: 12, padding: 16 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                  <div>
                    <p style={{ fontWeight: 600, fontSize: 14 }}>{p.name}</p>
                    <p style={{ fontSize: 12, opacity: 0.7 }}>by {p.seller_name}</p>
                  </div>
                  <span style={{ background: `${P}20`, color: P, padding: '2px 8px', borderRadius: 12, fontSize: 11, fontWeight: 600, height: 'fit-content' }}>{p.seller_type}</span>
                </div>
                <p style={{ fontSize: 12, marginBottom: 8 }}>{'⭐'.repeat(Math.round(p.avg_rating || 0))} ({p.review_count || 0})</p>
                <p style={{ fontSize: 12, opacity: 0.7, marginBottom: 12 }}>Stock: {p.stock_available} {p.unit}</p>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontWeight: 700, color: P }}>{formatCurrency(p.price_per_unit)}/{p.unit || 'kg'}</span>
                  <button onClick={() => setOrderModal(p)} style={{ background: P, color: '#fff', border: 'none', padding: '8px 14px', borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'Poppins, sans-serif' }}>Add to Cart 🛒</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Orders */}
      <section id="customer-orders" style={{ scrollMarginTop: 20, ...card }}>
        <h3 style={{ fontWeight: 700, fontSize: '1.1rem', marginBottom: 16 }}>📋 My Orders</h3>
        {orders.length === 0 ? <p style={{ textAlign: 'center', color: '#9ca3af', padding: 20 }}>No orders placed yet.</p> : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead><tr style={{ background: '#f0faf0' }}>
                {['Order#','Product','Seller','Qty','Amount','Payment','Status','Action','Date'].map(h => <th key={h} style={{ padding: '10px 12px', textAlign: 'left', fontWeight: 600 }}>{h}</th>)}
              </tr></thead>
              <tbody>
                {orders.map(o => (
                  <tr key={o.id} style={{ borderBottom: '1px solid #f3f4f6' }}>
                    <td style={{ padding: '10px 12px', fontFamily: 'monospace', fontSize: 12 }}>{o.order_number}</td>
                    <td style={{ padding: '10px 12px' }}>{o.product_name}</td>
                    <td style={{ padding: '10px 12px' }}>{o.seller_name}</td>
                    <td style={{ padding: '10px 12px' }}>{o.quantity}</td>
                    <td style={{ padding: '10px 12px', fontWeight: 600, color: P }}>{formatCurrency(o.total_amount)}</td>
                    <td style={{ padding: '10px 12px' }}>
  <span style={{
    fontSize: 11, fontWeight: 600, padding: '3px 8px', borderRadius: 10,
    background: o.payment_status === 'paid' ? '#dcfce7' : '#fef3c7',
    color: o.payment_status === 'paid' ? '#166534' : '#92400e'
  }}>
    {o.payment_method === 'upi' ? '📲' : '💵'} {o.payment_status === 'paid' ? 'Paid' : 'Pending'}
  </span>
</td>
                    <td style={{ padding: '10px 12px' }}><StatusBadge status={o.status} /></td>
<td style={{ padding: '10px 12px' }}>
  <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
    {o.status === 'shipped' && (
      <button onClick={() => confirmDelivery(o.id)}
        style={{ background: '#059669', color: '#fff', border: 'none',
          padding: '5px 12px', borderRadius: 6, fontSize: 12, fontWeight: 600,
          cursor: 'pointer', fontFamily: 'Poppins, sans-serif', whiteSpace: 'nowrap' }}>
        ✅ Confirm Delivery
      </button>
    )}
    {o.status === 'delivered' && !reviewedOrders.map(Number).includes(Number(o.id)) && (
      <button onClick={() => setReviewModal(o)}
        style={{ background: '#f59e0b', color: '#fff', border: 'none',
          padding: '5px 12px', borderRadius: 6, fontSize: 12, fontWeight: 600,
          cursor: 'pointer', fontFamily: 'Poppins, sans-serif', whiteSpace: 'nowrap' }}>
        ⭐ Write Review
      </button>
    )}
    {o.status === 'delivered' && reviewedOrders.map(Number).includes(Number(o.id)) && (
      <span style={{ fontSize: 12, color: '#059669', fontWeight: 600 }}>✓ Reviewed</span>
    )}
  </div>
</td>
<td style={{ padding: '10px 12px' }}>{formatDate(o.created_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Recipes */}
      <section id="customer-recipes" style={{ scrollMarginTop: 20, ...card }}>
        <h3 style={{ fontWeight: 700, fontSize: '1.1rem', marginBottom: 20 }}>👨‍🍳 Recipe Community</h3>
        <form onSubmit={shareRecipe} style={{ background: `${A}10`, borderRadius: 12, padding: 20, marginBottom: 24, display: 'flex', flexDirection: 'column', gap: 12 }}>
          <input style={inputStyle} type="text" name="title" required placeholder="Recipe Title (e.g. Ragi Chocolate Cake)" />
          <input style={inputStyle} type="text" name="short_description" required maxLength="300" placeholder="One-line summary" />
          <textarea style={{ ...inputStyle, resize: 'vertical' }} name="content" required rows="5" placeholder="Ingredients, steps, tips..." />
          <input style={inputStyle} type="url" name="youtube_link" placeholder="YouTube Link (optional)" />
          <button type="submit" disabled={recipeLoading} style={{ alignSelf: 'flex-start', background: P, color: '#fff', border: 'none', padding: '10px 20px', borderRadius: 8, fontWeight: 600, cursor: 'pointer', fontFamily: 'Poppins, sans-serif' }}>
            {recipeLoading ? 'Sharing...' : 'Share Recipe 🍽️'}
          </button>
        </form>

        {recipes.length === 0 ? <p style={{ textAlign: 'center', color: '#9ca3af', padding: 20 }}>No recipes yet. Be the first!</p> : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(260px,1fr))', gap: 16 }}>
            {recipes.map(r => (
              <div key={r.id} onClick={() => setRecipeModal(r)} style={{ background: '#fff', border: `2px solid ${A}20`, borderRadius: 12, overflow: 'hidden', cursor: 'pointer', transition: 'transform 0.2s,box-shadow 0.2s' }}
                onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = '0 12px 28px rgba(0,0,0,0.1)'; }}
                onMouseLeave={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = ''; }}>
                <div style={{ height: 6, background: `linear-gradient(90deg,${P},${A})` }} />
                <div style={{ padding: 16 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                    <div style={{ width: 32, height: 32, borderRadius: '50%', background: `${P}20`, color: P, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 13 }}>
                      {r.author_name?.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p style={{ fontSize: 12, fontWeight: 600 }}>{r.author_name}</p>
                      <p style={{ fontSize: 11, opacity: 0.5 }}>{formatDate(r.created_at)}</p>
                    </div>
                  </div>
                  <h4 style={{ fontWeight: 700, fontSize: 14, marginBottom: 6 }}>{r.title}</h4>
                  {r.short_description && <p style={{ fontSize: 12, color: P, fontStyle: 'italic', marginBottom: 8, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{r.short_description}</p>}
                  <p style={{ fontSize: 12, opacity: 0.6, display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden', whiteSpace: 'pre-line' }}>{r.content}</p>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 12, paddingTop: 12, borderTop: `1px solid ${A}20` }}>
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
        )}
      </section>

      {orderModal && <OrderModal product={orderModal} onClose={() => setOrderModal(null)} onSuccess={() => load()} />}
      {recipeModal && <RecipeModal recipe={recipeModal} onClose={() => setRecipeModal(null)}
        onLike={() => { likeRecipe(recipeModal.id); setRecipeModal(null); }}
        onFlag={() => { flagRecipe(recipeModal.id); setRecipeModal(null); }} />}

        {reviewModal && (
  <ReviewModal
    order={reviewModal}
    onClose={() => setReviewModal(null)}
    onSuccess={() => { setReviewModal(null); load(); }}
  />
)}
    </DashboardShell>
  );
}