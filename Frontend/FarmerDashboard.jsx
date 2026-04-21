import React, { useState, useEffect, useCallback } from 'react';
import DashboardShell from '../components/DashboardShell';
import StatCard from '../components/StatCard';
import StatusBadge from '../components/StatusBadge';
import { apiCall, formatCurrency, formatDate } from '../api';
import { useToast } from '../components/Toast';

const P = '#4a7c2c', A = '#6b9b47';

const card = { background: '#fff', borderRadius: 16, padding: 24, boxShadow: '0 4px 12px rgba(0,0,0,0.08)', marginBottom: 24 };
const inputStyle = { padding: 10, border: '2px solid #e5e7eb', borderRadius: 8, fontSize: 13, fontFamily: 'Poppins, sans-serif', outline: 'none' };

const navItems = [
  { id: 'farmer-stats',    icon: '📊', label: 'Overview' },
  { id: 'farmer-sell',     icon: '🌾', label: 'Sell Products' },
  { id: 'farmer-products', icon: '📦', label: 'My Products' },
  { id: 'farmer-orders',   icon: '📋', label: 'Orders' },
  { id: 'farmer-reviews',  icon: '💬', label: 'Reviews' },
  { id: 'farmer-recipes', icon: '👨‍🍳', label: 'Recipes', link: '/recipes' },
];

function ReviewCard({ review }) {
  const showToast = useToast();
  async function flag() {
    if (!window.confirm('Report this review to admin?')) return;
    const res = await apiCall(`/reviews/${review.id}/flag`, 'POST');
    showToast(res.data.message, !res.ok);
  }
  return (
    <div style={{ background: `#6b9b4710`, borderRadius: 8, padding: 14, marginBottom: 10 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
        <p style={{ fontWeight: 600, fontSize: 13 }}>{review.reviewer_name}</p>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 13 }}>{'⭐'.repeat(review.rating)}</span>
          <button onClick={flag}
            style={{ background: 'none', border: 'none', cursor: 'pointer',
              fontSize: 11, color: '#9ca3af', fontFamily: 'Poppins, sans-serif' }}>
            🚩
          </button>
        </div>
      </div>
      <p style={{ fontSize: 12, opacity: 0.7, marginBottom: 4 }}>{review.product_name}</p>
      <p style={{ fontSize: 13 }}>{review.comment || <em style={{ opacity: 0.5 }}>No comment</em>}</p>
      <p style={{ fontSize: 11, opacity: 0.5, marginTop: 4 }}>{formatDate(review.created_at)}</p>
    </div>
  );
}

export default function FarmerDashboard() {
  const showToast = useToast();
  const [stats, setStats] = useState(null);
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [addLoading, setAddLoading] = useState(false);

  const load = useCallback(async () => {
    const [s, o, r, p] = await Promise.all([
      apiCall('/farmer/dashboard'),
      apiCall('/farmer/orders'),
      apiCall('/farmer/reviews'),
      apiCall('/farmer/products'),
    ]);
    if (s.ok) setStats(s.data);
    if (o.ok) setOrders(o.data);
    if (r.ok) setReviews(r.data);
    if (p.ok) setProducts(p.data);
  }, []);

  useEffect(() => { load(); }, [load]);

  async function addProduct(e) {
  e.preventDefault();
  setAddLoading(true);
  const res = await apiCall('/farmer/products', 'POST', {
    name: e.target.name.value,
    category: e.target.category.value,
    quantity: e.target.quantity.value,
    unit: e.target.unit.value,         // ← add this
    price_per_unit: e.target.price_per_unit.value,
    description: e.target.description.value,
  });
  showToast(res.data.message, !res.ok);
  setAddLoading(false);
  if (res.ok) { e.target.reset(); load(); }
}

  async function updateStatus(orderId, status) {
    const res = await apiCall(`/farmer/orders/${orderId}/status`, 'PATCH', { status });
    showToast(res.data.message, !res.ok);
    if (res.ok) load();
  }

  if (!stats) return <DashboardShell emoji="👨‍🌾" title="Farmer Dashboard" navItems={navItems}><div style={{ textAlign: 'center', padding: 40, color: '#9ca3af' }}>Loading...</div></DashboardShell>;

  return (
    <DashboardShell emoji="👨‍🌾" title="Farmer Dashboard" navItems={navItems}>

      {/* Stats */}
      <section id="farmer-stats" style={{ scrollMarginTop: 20, marginBottom: 24 }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(160px,1fr))', gap: 16 }}>
          <StatCard icon="📦" label="Total Products" value={stats.total_products} />
          <StatCard icon="🛒" label="Pending Orders" value={stats.pending_orders} />
          <StatCard icon="⭐" label="Avg Rating" value={stats.avg_rating + '/5'} />
          <StatCard icon="💰" label="This Month" value={formatCurrency(stats.monthly_revenue)} />
        </div>
      </section>

      {/* Add Product */}
      <section id="farmer-sell" style={{ scrollMarginTop: 20, ...card }}>
        <h3 style={{ fontWeight: 700, fontSize: '1.1rem', marginBottom: 20 }}>🌾 Sell Your Products</h3>
        <form onSubmit={addProduct} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(180px,1fr))', gap: 12 }}>
  <select name="name" required style={inputStyle}>
    <option value="">Select Product</option>
    {['Millets','Organic Rice','Wheat','Vegetables','Cosmetic Herbs'].map(p => 
      <option key={p} value={p}>{p}</option>
    )}
  </select>
  <input style={inputStyle} type="text" name="category" required placeholder="Category (e.g. millets)" />
  <input style={inputStyle} type="number" name="quantity" required placeholder="Stock Quantity" min="1" />
  <select name="unit" required style={inputStyle}>
    <option value="kg">kg — Kilograms</option>
    <option value="g">g — Grams</option>
    <option value="litre">litre — Litres</option>
    <option value="ml">ml — Millilitres</option>
    <option value="pack">pack — Packs</option>
    <option value="piece">piece — Pieces</option>
    <option value="dozen">dozen — Dozen</option>
    <option value="bundle">bundle — Bundle</option>
  </select>
  <input style={inputStyle} type="number" name="price_per_unit" required placeholder="Price per unit (₹)" min="1" />
  <input style={{ ...inputStyle, gridColumn: 'span 2' }} type="text" name="description" placeholder="Description (optional)" />
  <button type="submit" disabled={addLoading} style={{ background: `linear-gradient(135deg,${P},#2d5016)`, color: '#fff', border: 'none', padding: 10, borderRadius: 8, fontWeight: 600, cursor: 'pointer', fontFamily: 'Poppins, sans-serif' }}>
    {addLoading ? 'Adding...' : '➕ Add Product'}
  </button>
</form>
      </section>

      {/* Products Table */}
      <section id="farmer-products" style={{ scrollMarginTop: 20, ...card }}>
        <h3 style={{ fontWeight: 700, fontSize: '1.1rem', marginBottom: 16 }}>📦 My Products</h3>
        {products.length === 0 ? <p style={{ textAlign: 'center', color: '#9ca3af', padding: 20 }}>No products listed yet.</p> : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead><tr style={{ background: '#f0faf0' }}>
                {['Product','Category','Stock','Price/KG','Listed On'].map(h => <th key={h} style={{ padding: '10px 12px', textAlign: 'left', fontWeight: 600 }}>{h}</th>)}
              </tr></thead>
              <tbody>
                {products.map(p => (
                  <tr key={p.id} style={{ borderBottom: '1px solid #f3f4f6' }}>
                    <td style={{ padding: '10px 12px', fontWeight: 500 }}>{p.name}</td>
                    <td style={{ padding: '10px 12px' }}>{p.category}</td>
                    <td style={{ padding: '10px 12px' }}>{p.stock_available} {p.unit}</td>
                    <td style={{ padding: '10px 12px', fontWeight: 600, color: P }}>{formatCurrency(p.price_per_unit)}</td>
                    <td style={{ padding: '10px 12px' }}>{formatDate(p.created_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Orders & Reviews */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
        <section id="farmer-orders" style={{ scrollMarginTop: 20, ...card, marginBottom: 0 }}>
  <h3 style={{ fontWeight: 700, fontSize: '1.1rem', marginBottom: 16 }}>📋 Orders Received</h3>
  {orders.length === 0
    ? <p style={{ textAlign: 'center', color: '#9ca3af' }}>No orders yet.</p>
    : orders.slice(0, 10).map(o => {
      const borderColor =
        o.status === 'pending'   ? '#f59e0b' :
        o.status === 'confirmed' ? P :
        o.status === 'shipped'   ? '#7c3aed' :
        o.status === 'delivered' ? '#059669' : '#e5e7eb';
      return (
        <div key={o.id} style={{ background: `${A}10`, borderLeft: `4px solid ${borderColor}`, borderRadius: 8, padding: 14, marginBottom: 10 }}>

          {/* Top row — order number + status */}
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
            <p style={{ fontWeight: 700, fontSize: 13 }}>{o.order_number}</p>
            <StatusBadge status={o.status} />
          </div>

          {/* Product + amount */}
          <p style={{ fontSize: 13, fontWeight: 500, marginBottom: 4 }}>{o.product_name}</p>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 10 }}>
            <span>{o.quantity} {o.unit || 'kg'}</span>
            <span style={{ fontWeight: 700, color: P }}>{formatCurrency(o.total_amount)}</span>
          </div>

          {/* Customer contact card */}
          <div style={{ background: '#fff', borderRadius: 8, padding: 10, marginBottom: 10, border: '1px solid #e8f5e0', fontSize: 12 }}>
            <p style={{ fontWeight: 700, fontSize: 12, color: P, marginBottom: 6 }}>👤 Customer Details</p>
            <p style={{ marginBottom: 3 }}><strong>Name:</strong> {o.buyer_name} <span style={{ opacity: 0.5 }}>({o.buyer_role})</span></p>
            <p style={{ marginBottom: 3 }}>
              <strong>Phone:</strong>{' '}
              <a href={`tel:${o.buyer_phone}`} style={{ color: P, fontWeight: 600, textDecoration: 'none' }}>
                📞 {o.buyer_phone}
              </a>
            </p>
            {o.buyer_email && (
              <p style={{ marginBottom: 3 }}>
                <strong>Email:</strong>{' '}
                <a href={`mailto:${o.buyer_email}`} style={{ color: P, fontWeight: 600, textDecoration: 'none' }}>
                  ✉️ {o.buyer_email}
                </a>
              </p>
            )}
            {o.delivery_address && (
              <p style={{ marginBottom: 0 }}>
                <strong>Address:</strong> {o.delivery_address}
              </p>
            )}
          </div>

          {/* Action buttons — progressive based on status */}
          {/* Payment status banner */}
{o.payment_method === 'upi' && (
  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    background: o.payment_status === 'paid' ? '#dcfce7' : '#fef3c7',
    borderRadius: 8, padding: '8px 12px', marginBottom: 8, fontSize: 12 }}>
    <span style={{ fontWeight: 600, color: o.payment_status === 'paid' ? '#166534' : '#92400e' }}>
      {o.payment_status === 'paid' ? '✅ UPI Payment Received' : '⏳ Awaiting UPI Payment'}
    </span>
    {o.payment_status === 'pending' && o.status === 'pending' && (
      <button onClick={async () => {
        const res = await apiCall(`/orders/${o.id}/mark-paid`, 'PATCH');
        showToast(res.data.message, !res.ok);
        if (res.ok) load();
      }} style={{ background: '#166534', color: '#fff', border: 'none',
        padding: '4px 12px', borderRadius: 6, fontSize: 11, fontWeight: 600,
        cursor: 'pointer', fontFamily: 'Poppins, sans-serif' }}>
        ✓ Mark as Paid
      </button>
    )}
  </div>
)}
{o.payment_method === 'cod' && (
  <div style={{ background: '#f0f9ff', borderRadius: 8, padding: '6px 12px',
    marginBottom: 8, fontSize: 12, color: '#0369a1', fontWeight: 600 }}>
    💵 Cash on Delivery
  </div>
)}


          {o.status === 'pending' && (
            <div style={{ display: 'flex', gap: 6 }}>
              <button onClick={() => updateStatus(o.id, 'confirmed')}
                style={{ background: P, color: '#fff', border: 'none', padding: '6px 14px', borderRadius: 6, fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'Poppins, sans-serif' }}>
                ✓ Confirm Order
              </button>
              <button onClick={() => updateStatus(o.id, 'cancelled')}
                style={{ background: '#fee2e2', color: '#dc2626', border: 'none', padding: '6px 14px', borderRadius: 6, fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'Poppins, sans-serif' }}>
                ✗ Cancel
              </button>
            </div>
          )}
          {o.status === 'confirmed' && (
            <button onClick={() => updateStatus(o.id, 'shipped')}
              style={{ background: '#7c3aed', color: '#fff', border: 'none', padding: '6px 14px', borderRadius: 6, fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'Poppins, sans-serif' }}>
              📦 Mark as Shipped
            </button>
          )}
          {o.status === 'shipped' && (
            <p style={{ fontSize: 12, color: '#7c3aed', fontWeight: 600, fontStyle: 'italic' }}>
              ⏳ Awaiting customer confirmation...
            </p>
          )}
          {o.status === 'delivered' && (
            <p style={{ fontSize: 12, color: '#059669', fontWeight: 600 }}>
              ✅ Delivered & confirmed by customer
            </p>
          )}
          {o.status === 'cancelled' && (
            <p style={{ fontSize: 12, color: '#dc2626', fontWeight: 600 }}>
              ✗ Order cancelled
            </p>
          )}
        </div>
      );
    })
  }
</section>

        <section id="farmer-reviews" style={{ scrollMarginTop: 20, ...card, marginBottom: 0 }}>
  <h3 style={{ fontWeight: 700, fontSize: '1.1rem', marginBottom: 4 }}>💬 Customer Reviews</h3>

  {reviews.length === 0
    ? <p style={{ textAlign: 'center', color: '#9ca3af', padding: 20 }}>No reviews yet.</p>
    : <>
        {/* Star breakdown */}
        <div style={{ background: '#f8fdf5', borderRadius: 10, padding: 14, marginBottom: 16, border: '1px solid #e8f5e0' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 10 }}>
            <div style={{ textAlign: 'center' }}>
              <p style={{ fontSize: '2rem', fontWeight: 800, color: P, lineHeight: 1 }}>
                {(reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1)}
              </p>
              <p style={{ fontSize: 11, opacity: 0.6 }}>out of 5</p>
            </div>
            <div style={{ flex: 1 }}>
              {[5,4,3,2,1].map(star => {
                const count = reviews.filter(r => r.rating === star).length;
                const pct = reviews.length ? (count / reviews.length) * 100 : 0;
                return (
                  <div key={star} style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 3 }}>
                    <span style={{ fontSize: 11, width: 14, textAlign: 'right' }}>{star}</span>
                    <span style={{ fontSize: 10 }}>⭐</span>
                    <div style={{ flex: 1, height: 6, background: '#e5e7eb', borderRadius: 3, overflow: 'hidden' }}>
                      <div style={{ width: `${pct}%`, height: '100%', background: P, borderRadius: 3 }} />
                    </div>
                    <span style={{ fontSize: 11, opacity: 0.5, width: 20 }}>{count}</span>
                  </div>
                );
              })}
            </div>
          </div>
          <p style={{ fontSize: 12, opacity: 0.5, textAlign: 'center' }}>{reviews.length} total reviews</p>
        </div>

        {/* Individual reviews */}
        {reviews.slice(0, 5).map(r => (
          <ReviewCard key={r.id} review={r} />
        ))}
      </>
  }
</section>
      </div>
    </DashboardShell>
  );
}