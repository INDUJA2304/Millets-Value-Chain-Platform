import React, { useState, useEffect, useCallback } from 'react';
import DashboardShell from '../components/DashboardShell';
import StatCard from '../components/StatCard';
import StatusBadge from '../components/StatusBadge';
import { apiCall, formatCurrency, formatDate } from '../api';
import { useToast } from '../components/Toast';

const P = '#4a7c2c', A = '#6b9b47';
const card = { background: '#fff', borderRadius: 16, padding: 24, boxShadow: '0 4px 12px rgba(0,0,0,0.08)', marginBottom: 24 };
const inputStyle = { width: '100%', padding: 10, border: '2px solid #e5e7eb', borderRadius: 8, fontSize: 13, fontFamily: 'Poppins, sans-serif', outline: 'none', boxSizing: 'border-box' };
const thStyle = { padding: '10px 12px', textAlign: 'left', fontWeight: 600, fontSize: 13, background: '#f0faf0' };
const tdStyle = { padding: '10px 12px', borderBottom: '1px solid #f3f4f6', fontSize: 13 };

const navItems = [
  { id: 'startup-stats',     icon: '📊', label: 'Overview' },
  { id: 'startup-buy',       icon: '🛒', label: 'Buy Materials' },
  { id: 'startup-list',      icon: '📦', label: 'List Product' },
  { id: 'startup-sales',     icon: '📈', label: 'Sales' },
  { id: 'startup-purchases', icon: '🌾', label: 'Purchases' },
  { id: 'startup-customers', icon: '👥', label: 'Customer Orders' },
  { id: 'startup-reviews', icon: '💬', label: 'Reviews' },
{ id: 'startup-recipes', icon: '👨‍🍳', label: 'Recipes', link: '/recipes' },
];

export default function StartupDashboard() {
  const showToast = useToast();
  const [stats, setStats] = useState(null);
  const [sales, setSales] = useState([]);
  const [purchases, setPurchases] = useState([]);
  const [farmerProducts, setFarmerProducts] = useState([]);
  const [buyLoading, setBuyLoading] = useState(false);
  const [listLoading, setListLoading] = useState(false);
  const [customerOrders, setCustomerOrders] = useState([]);
  const [reviews, setReviews] = useState([]);

  const load = useCallback(async () => {
  const [s, o, fp, co, rv] = await Promise.all([
    apiCall('/startup/dashboard'),
    apiCall('/startup/orders'),
    apiCall('/farmer-products'),
    apiCall('/startup/orders/customers'),
    apiCall('/startup/reviews'),
  ]);
  if (s.ok) setStats(s.data);
  if (o.ok) { setSales(o.data.sales || []); setPurchases(o.data.purchases || []); }
  if (fp.ok) setFarmerProducts(fp.data);
  if (co.ok) setCustomerOrders(co.data);
  if (rv.ok) setReviews(rv.data);
}, []);

  useEffect(() => { load(); }, [load]);

  async function buyRawMaterial(e) {
    e.preventDefault();
    setBuyLoading(true);
    const res = await apiCall('/startup/buy-raw-material', 'POST', {
      product_id: e.target.product_id.value,
      quantity: e.target.quantity.value,
      delivery_address: e.target.delivery_address.value,
    });
    showToast(res.data.message, !res.ok);
    setBuyLoading(false);
    if (res.ok) { e.target.reset(); load(); }
  }

  async function listProduct(e) {
  e.preventDefault();
  setListLoading(true);
  const res = await apiCall('/startup/products', 'POST', {
    name: e.target.name.value,
    category: e.target.category.value,
    quantity: e.target.quantity.value,
    unit: e.target.unit.value,         // ← add this
    price_per_unit: e.target.price_per_unit.value,
    description: e.target.description.value,
  });
  showToast(res.data.message, !res.ok);
  setListLoading(false);
  if (res.ok) { e.target.reset(); load(); }
}

async function updateStatus(orderId, status) {
  const res = await apiCall(`/startup/orders/${orderId}/status`, 'PATCH', { status });
  showToast(res.data.message, !res.ok);
  if (res.ok) load();
}

  if (!stats) return <DashboardShell emoji="🏢" title="Startup Dashboard" navItems={navItems}><div style={{ textAlign: 'center', padding: 40, color: '#9ca3af' }}>Loading...</div></DashboardShell>;

  return (
    <DashboardShell emoji="🏢" title="Startup Dashboard" navItems={navItems}>

      <section id="startup-stats" style={{ scrollMarginTop: 20, marginBottom: 24 }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(160px,1fr))', gap: 16 }}>
          <StatCard icon="🛍️" label="Products Listed" value={stats.total_products} />
          <StatCard icon="📦" label="Customer Orders" value={stats.customer_orders} />
          <StatCard icon="🌾" label="Raw Material Orders" value={stats.raw_material_orders} />
          <StatCard icon="💰" label="Revenue" value={formatCurrency(stats.total_revenue)} />
        </div>
      </section>

      <section id="startup-customers" style={{ scrollMarginTop: 20, ...card }}>
  <h3 style={{ fontWeight: 700, fontSize: '1.1rem', marginBottom: 16 }}>
    👥 Customer Orders & Contact Details
  </h3>

  {customerOrders.length === 0
    ? <p style={{ textAlign: 'center', color: '#9ca3af', padding: 20 }}>No customer orders yet.</p>
    : customerOrders.map(o => {
        const borderColor =
          o.status === 'pending'   ? '#f59e0b' :
          o.status === 'confirmed' ? P :
          o.status === 'shipped'   ? '#7c3aed' :
          o.status === 'delivered' ? '#059669' : '#e5e7eb';
        return (
          <div key={o.id} style={{ background: `${A}10`, borderLeft: `4px solid ${borderColor}`,
            borderRadius: 8, padding: 14, marginBottom: 10 }}>

            {/* Top row */}
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
              <p style={{ fontWeight: 700, fontSize: 13, fontFamily: 'monospace' }}>{o.order_number}</p>
              <StatusBadge status={o.status} />
            </div>

            {/* Product + amount */}
            <p style={{ fontSize: 13, fontWeight: 500, marginBottom: 4 }}>{o.product_name}</p>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 10 }}>
              <span>{o.quantity} {o.unit || 'units'}</span>
              <span style={{ fontWeight: 700, color: P }}>{formatCurrency(o.total_amount)}</span>
            </div>

            {/* Customer contact card */}
            <div style={{ background: '#fff', borderRadius: 8, padding: 10, marginBottom: 10,
              border: '1px solid #e8f5e0', fontSize: 12 }}>
              <p style={{ fontWeight: 700, fontSize: 12, color: P, marginBottom: 6 }}>👤 Customer Details</p>
              <p style={{ marginBottom: 3 }}><strong>Name:</strong> {o.buyer_name}</p>
              <p style={{ marginBottom: 3 }}>
                <strong>Phone:</strong>{' '}
                <a href={`tel:${o.buyer_phone}`}
                  style={{ color: P, fontWeight: 600, textDecoration: 'none' }}>
                  📞 {o.buyer_phone}
                </a>
              </p>
              {o.buyer_email && (
                <p style={{ marginBottom: 3 }}>
                  <strong>Email:</strong>{' '}
                  <a href={`mailto:${o.buyer_email}`}
                    style={{ color: P, fontWeight: 600, textDecoration: 'none' }}>
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

            {/* Progressive action buttons */}

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
                  style={{ background: P, color: '#fff', border: 'none', padding: '6px 14px',
                    borderRadius: 6, fontSize: 12, fontWeight: 600, cursor: 'pointer',
                    fontFamily: 'Poppins, sans-serif' }}>
                  ✓ Confirm Order
                </button>
                <button onClick={() => updateStatus(o.id, 'cancelled')}
                  style={{ background: '#fee2e2', color: '#dc2626', border: 'none', padding: '6px 14px',
                    borderRadius: 6, fontSize: 12, fontWeight: 600, cursor: 'pointer',
                    fontFamily: 'Poppins, sans-serif' }}>
                  ✗ Cancel
                </button>
              </div>
            )}
            {o.status === 'confirmed' && (
              <button onClick={() => updateStatus(o.id, 'shipped')}
                style={{ background: '#7c3aed', color: '#fff', border: 'none', padding: '6px 14px',
                  borderRadius: 6, fontSize: 12, fontWeight: 600, cursor: 'pointer',
                  fontFamily: 'Poppins, sans-serif' }}>
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

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, marginBottom: 24 }}>
        <section id="startup-buy" style={{ scrollMarginTop: 20, ...card, marginBottom: 0 }}>
          <h3 style={{ fontWeight: 700, fontSize: '1.1rem', marginBottom: 16 }}>🛒 Buy Raw Materials</h3>
          {farmerProducts.length === 0 ? <p style={{ textAlign: 'center', color: '#9ca3af' }}>No farmer products available.</p> : (
            <form onSubmit={buyRawMaterial} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <select name="product_id" required style={inputStyle}>
                <option value="">Select Farmer Product</option>
                {farmerProducts.map(p => <option key={p.id} value={p.id}>{p.farmer_name} — {p.name} ({p.stock_available}kg @ {formatCurrency(p.price_per_unit)}/kg)</option>)}
              </select>
              <input style={inputStyle} type="number" name="quantity" required placeholder="Quantity (KG)" min="1" />
              <input style={inputStyle} type="text" name="delivery_address" required placeholder="Delivery address" />
              <button type="submit" disabled={buyLoading} style={{ background: P, color: '#fff', border: 'none', padding: 10, borderRadius: 8, fontWeight: 600, cursor: 'pointer', fontFamily: 'Poppins, sans-serif' }}>
                {buyLoading ? 'Placing...' : 'Place Order'}
              </button>
            </form>
          )}
        </section>

        <section id="startup-list" style={{ scrollMarginTop: 20, ...card, marginBottom: 0 }}>
          <h3 style={{ fontWeight: 700, fontSize: '1.1rem', marginBottom: 16 }}>📦 List Finished Product</h3>
          <form onSubmit={listProduct} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
  <input style={inputStyle} type="text" name="name" required placeholder="Product Name" />
  <select name="category" required style={inputStyle}>
    <option value="">Select Category</option>
    <option value="food">Organic Food</option>
    <option value="cosmetics">Organic Cosmetics</option>
  </select>
  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
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
  </div>
  <input style={inputStyle} type="number" name="price_per_unit" required placeholder="Price per unit (₹)" min="1" />
  <input style={inputStyle} type="text" name="description" placeholder="Description (optional)" />
  <button type="submit" disabled={listLoading} style={{ background: P, color: '#fff', border: 'none', padding: 10, borderRadius: 8, fontWeight: 600, cursor: 'pointer', fontFamily: 'Poppins, sans-serif' }}>
    {listLoading ? 'Listing...' : 'List Product'}
  </button>
</form>
        </section>
      </div>

      {[{ id: 'startup-sales', title: '📊 Sales to Customers', data: sales, cols: ['Order#','Customer','Product','Qty','Amount','Status','Date'], row: o => [o.order_number, o.buyer_name, o.product_name, o.quantity, formatCurrency(o.total_amount), <StatusBadge status={o.status}/>, formatDate(o.created_at)] },
        { id: 'startup-purchases', title: '🌾 Raw Material Purchases', data: purchases, cols: ['Order#','Farmer','Product','Qty','Amount','Status','Date'], row: o => [o.order_number, o.seller_name, o.product_name, o.quantity, formatCurrency(o.total_amount), <StatusBadge status={o.status}/>, formatDate(o.created_at)] }
      ].map(({ id, title, data, cols, row }) => (
        <section key={id} id={id} style={{ scrollMarginTop: 20, ...card }}>
          <h3 style={{ fontWeight: 700, fontSize: '1.1rem', marginBottom: 16 }}>{title}</h3>
          {data.length === 0 ? <p style={{ textAlign: 'center', color: '#9ca3af', padding: 20 }}>No data yet.</p> : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                <thead><tr style={{ background: '#f0faf0' }}>{cols.map(h => <th key={h} style={{ padding: '10px 12px', textAlign: 'left', fontWeight: 600 }}>{h}</th>)}</tr></thead>
                <tbody>{data.map((o, i) => <tr key={i} style={{ borderBottom: '1px solid #f3f4f6' }}>{row(o).map((v, j) => <td key={j} style={{ padding: '10px 12px', fontWeight: j === 4 ? 600 : 400, color: j === 4 ? P : 'inherit', fontFamily: j === 0 ? 'monospace' : 'inherit', fontSize: j === 0 ? 12 : 13 }}>{v}</td>)}</tr>)}</tbody>
              </table>
            </div>
          )}
        </section>
      ))}

      <section id="startup-reviews" style={{ scrollMarginTop: 20, ...card }}>
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

        {reviews.map(r => (
          <div key={r.id} style={{ background: `${A}10`, borderRadius: 8, padding: 14, marginBottom: 10 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
              <p style={{ fontWeight: 600, fontSize: 13 }}>{r.reviewer_name}</p>
              <span>{'⭐'.repeat(r.rating)}</span>
            </div>
            <p style={{ fontSize: 12, opacity: 0.7, marginBottom: 4 }}>{r.product_name}</p>
            <p style={{ fontSize: 13 }}>{r.comment || <em style={{ opacity: 0.5 }}>No comment</em>}</p>
            <p style={{ fontSize: 11, opacity: 0.5, marginTop: 4 }}>{formatDate(r.created_at)}</p>
          </div>
        ))}
      </>
  }
</section>
    </DashboardShell>
  );
}