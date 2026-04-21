import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiCall } from '../api';
import TranslateButton from '../components/TranslateButton.jsx';

const P = '#4a7c2c', A = '#6b9b47';

const translations = {
  en: { platformName:'Shree Anna', heroTitle:'Empowering Farmers, Nourishing India', heroSubtitle:'Government-verified & sustainable platform', selectRole:'Select Your Role', farmer:'Farmer', startup:'Startup Owner', customer:'Customer', admin:'Admin', register:'Register', login:'Login', schemes:'Government & Business Schemes' },
  hi: { platformName:'श्री अन्न', heroTitle:'किसानों को सशक्त बनाना, भारत को पोषण देना', heroSubtitle:'सरकार द्वारा सत्यापित और टिकाऊ मंच', selectRole:'अपनी भूमिका चुनें', farmer:'किसान', startup:'स्टार्टअप मालिक', customer:'ग्राहक', admin:'प्रशासक', register:'पंजीकरण', login:'लॉगिन', schemes:'सरकारी और व्यावसायिक योजनाएं' },
  kn: { platformName:'ಶ್ರೀ ಅನ್ನ', heroTitle:'ರೈತರನ್ನು ಸಬಲೀಕರಣಗೊಳಿಸುವುದು', heroSubtitle:'ಸರ್ಕಾರದಿಂದ ಪರಿಶೀಲಿಸಲಾದ ವೇದಿಕೆ', selectRole:'ನಿಮ್ಮ ಪಾತ್ರವನ್ನು ಆಯ್ಕೆಮಾಡಿ', farmer:'ರೈತ', startup:'ಸ್ಟಾರ್ಟಪ್ ಮಾಲೀಕ', customer:'ಗ್ರಾಹಕ', admin:'ನಿರ್ವಾಹಕ', register:'ನೋಂದಣಿ', login:'ಲಾಗಿನ್', schemes:'ಸರ್ಕಾರಿ ಯೋಜನೆಗಳು' }
};

const heroSlides = [
  { title: 'Fresh from Farm', subtitle: 'Direct connection with farmers', emoji: '🌾' },
  { title: 'Organic Startups', subtitle: 'Premium ready-to-eat products', emoji: '🥗' },
  { title: 'Happy Customers', subtitle: 'Quality assured marketplace', emoji: '🛒' },
];

// const schemes = [
//   { category: 'Farmer',  name: 'National Millet Mission',     icon: '🌾' },
//   { category: 'Farmer',  name: 'PMFME Scheme',                icon: '💰' },
//   { category: 'Farmer',  name: 'Organic Farming Subsidy',     icon: '🌱' },
//   { category: 'Startup', name: 'Startup India Initiative',    icon: '🚀' },
//   { category: 'Startup', name: 'MSME Loans',                  icon: '💳' },
//   { category: 'Startup', name: 'Women Entrepreneur Scheme',   icon: '👩‍💼' },
// ];

const MILLET_EMOJIS = { ragi:'🌾', jowar:'🌽', bajra:'🌿', foxtail:'🌱', kodo:'🍃', little:'🌾', barnyard:'🌿', proso:'🌱' };
function milletEmoji(name) {
  const key = Object.keys(MILLET_EMOJIS).find(k => name.toLowerCase().includes(k));
  return key ? MILLET_EMOJIS[key] : '🌾';
}

export default function Home() {
  // const [lang, setLang] = useState('en');
  const [lang] = useState('en');
  const [slide, setSlide] = useState(0);
  const navigate = useNavigate();
  const t = k => translations[lang][k] || translations.en[k];
  
// Add state inside Home():
const [millets, setMillets] = useState([]);
useEffect(() => {
  apiCall('/millets').then(res => { if (res.ok) setMillets(res.data.slice(0, 4)); });
}, []);

  useEffect(() => {
    const timer = setInterval(() => setSlide(s => (s + 1) % heroSlides.length), 4000);
    return () => clearInterval(timer);
  }, []);

  const [schemes, setSchemes] = useState([]);
useEffect(() => {
  apiCall('/schemes').then(res => { if (res.ok) setSchemes(res.data); });
}, []);

  const roles = [
    { id: 'farmer',   image: 'https://tse2.mm.bing.net/th/id/OIP._pTUnoAajtzhyX87v6FW2gHaHa?pid=ImgDet&w=184&h=184&c=7&dpr=1.3&o=7&rm=3', desc: 'Direct farm produce selling' },
    { id: 'startup',  image: 'https://images.template.net/47993/Startup-Logo-Template-jpg-01-1.jpg',  desc: 'Organic food & cosmetics' },
    { id: 'customer', image: 'https://cdn-icons-png.flaticon.com/256/10798/10798504.png', desc: 'Fresh & healthy products' },
    { id: 'admin',    image: 'https://tse4.mm.bing.net/th/id/OIP.XKdZgJT9MaVBqYDg-5JlvgAAAA?rs=1&pid=ImgDetMain&o=7&rm=3',  desc: 'Platform management' },
  ];

  const registerPaths = { farmer: '/farmer-register', startup: '/startup-register', customer: '/customer-login', admin: '/admin-login' };
  const loginPaths    = { farmer: '/farmer-login',    startup: '/startup-login',    customer: '/customer-login', admin: '/admin-login' };

  return (
    <div style={{ background: '#f9fafb' }}>
      {/* Header */}
      <header style={{ background: '#fff', boxShadow: '0 2px 8px rgba(0,0,0,0.08)', padding: '16px 40px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ fontSize: '2.5rem' }}>🌾</span>
          <div>
            <h1 style={{ fontWeight: 700, fontSize: '1.5rem', color: P }}>{t('platformName')}</h1>
            <p style={{ fontSize: 12, opacity: 0.7 }}>Farm to Consumer Platform</p>
          </div>
        </div>
        {/* <select value={lang} onChange={e => setLang(e.target.value)}
          style={{ padding: '8px 12px', border: `2px solid ${P}`, borderRadius: 8, fontSize: 14, fontFamily: 'Poppins, sans-serif' }}>
          <option value="en">English</option>
          <option value="hi">हिंदी</option>
          <option value="kn">ಕನ್ನಡ</option>
        </select> */}
        <TranslateButton />
      </header>

      {/* Hero */}
      <div style={{ height: 500, background: `linear-gradient(135deg,${P}dd,${A}dd)`, display: 'flex', alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: 20 }}>
        <div>
          <div style={{ fontSize: '6rem', marginBottom: 16 }}>{heroSlides[slide].emoji}</div>
          <h2 style={{ color: '#fff', fontSize: '2.5rem', fontWeight: 700, marginBottom: 12 }}>{t('heroTitle')}</h2>
          <p style={{ color: '#fff', fontSize: '1.1rem', marginBottom: 24 }}>{t('heroSubtitle')}</p>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
            {['✓ Government Verified', '🌱 100% Organic', '🚀 Startup Friendly'].map(b => (
              <span key={b} style={{ background: '#fff', color: P, padding: '6px 16px', borderRadius: 20, fontSize: 13, fontWeight: 600 }}>{b}</span>
            ))}
          </div>
          <div style={{ display: 'flex', gap: 8, justifyContent: 'center', marginTop: 20 }}>
            {heroSlides.map((_, i) => (
              <div key={i} onClick={() => setSlide(i)} style={{
                width: i === slide ? 32 : 12, height: 12, borderRadius: 6,
                background: '#fff', opacity: i === slide ? 1 : 0.5, cursor: 'pointer', transition: 'all 0.3s'
              }} />
            ))}
          </div>
        </div>
      </div>

      {/* Role Cards */}
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '60px 24px' }}>
        <h2 style={{ textAlign: 'center', fontSize: '2rem', fontWeight: 700, color: '#1f2937', marginBottom: 40 }}>{t('selectRole')}</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(220px,1fr))', gap: 24 }}>
          {roles.map(r => (
  <div key={r.id} style={{ background: '#fff', border: `2px solid ${A}20`, borderRadius: 16, padding: 32, textAlign: 'center', transition: 'transform 0.3s,box-shadow 0.3s' }}
    onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-8px)'; e.currentTarget.style.boxShadow = '0 20px 40px rgba(0,0,0,0.12)'; }}
    onMouseLeave={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = ''; }}>
    <img src={r.image} alt={r.id}
      style={{ width: 80, height: 80, borderRadius: '50%', objectFit: 'cover', border: `3px solid ${A}`, marginBottom: 12 }} />
    <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: '#1f2937', marginBottom: 8 }}>{t(r.id)}</h3>
    <p style={{ fontSize: 13, opacity: 0.7, marginBottom: 20 }}>{r.desc}</p>
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <button onClick={() => navigate(registerPaths[r.id])} style={{ background: `linear-gradient(135deg,${P},#2d5016)`, color: '#fff', border: 'none', padding: '12px 0', borderRadius: 8, fontWeight: 600, fontSize: 14, cursor: 'pointer', fontFamily: 'Poppins, sans-serif' }}>
        {t('register')}
      </button>
      <button onClick={() => navigate(loginPaths[r.id])} style={{ background: '#fff', color: P, border: `2px solid ${P}`, padding: '10px 0', borderRadius: 8, fontWeight: 600, fontSize: 14, cursor: 'pointer', fontFamily: 'Poppins, sans-serif' }}>
        {t('login')}
      </button>
    </div>
  </div>
))}
        </div>
      </div>



{/* // Add this JSX block just before the schemes section: */}
{millets.length > 0 && (
  <div style={{ background: 'linear-gradient(135deg,#f0faf0,#e8f5e0)', padding: '60px 24px' }}>
    <div style={{ maxWidth: 1200, margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h2 style={{ fontSize: '1.8rem', fontWeight: 700, color: '#1f2937' }}>🌿 Millet Health Benefits</h2>
          <p style={{ opacity: 0.65, marginTop: 4, fontSize: 14 }}>Evidence-based nutrition information</p>
        </div>
        <button onClick={() => navigate('/millets')}
          style={{ background: P, color: '#fff', border: 'none', padding: '10px 24px', borderRadius: 10, fontWeight: 600, cursor: 'pointer', fontSize: 14, fontFamily: 'Poppins,sans-serif' }}>
          View All →
        </button>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(240px,1fr))', gap: 18 }}>
        {millets.map(m => (
          <div key={m.id} onClick={() => navigate('/millets')}
            style={{ background: '#fff', borderRadius: 16, padding: 20, cursor: 'pointer',
              boxShadow: '0 4px 12px rgba(0,0,0,0.06)', border: `2px solid ${A}20`,
              transition: 'transform 0.2s,box-shadow 0.2s' }}
            onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = '0 12px 28px rgba(0,0,0,0.1)'; }}
            onMouseLeave={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.06)'; }}>
            <div style={{ fontSize: '2.5rem', marginBottom: 10 }}>{milletEmoji(m.name)}</div>
            <h3 style={{ fontWeight: 700, fontSize: '0.95rem', marginBottom: 4, color: '#1f2937' }}>{m.name}</h3>
            {m.scientific_name && <p style={{ fontSize: 11, color: A, fontStyle: 'italic', marginBottom: 8 }}>{m.scientific_name}</p>}
            <p style={{ fontSize: 12, opacity: 0.65, lineHeight: 1.6,
              display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
              {m.description}
            </p>
            {m.nutrition?.length > 0 && (
              <div style={{ marginTop: 10, display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                {m.nutrition.slice(0, 2).map((n, i) => (
                  <span key={i} style={{ background: '#f0faf0', color: P, fontSize: 10, fontWeight: 600, padding: '2px 8px', borderRadius: 20 }}>
                    {n.nutrient_name}: {n.value_per_100g}
                  </span>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  </div>
)}
      {/* Schemes */}
<div style={{ background: '#fff', padding: '60px 24px' }}>
  <div style={{ maxWidth: 1200, margin: '0 auto' }}>
    <h2 style={{ textAlign: 'center', fontSize: '2rem', fontWeight: 700, color: '#1f2937', marginBottom: 8 }}>
      {t('schemes')}
    </h2>
    <p style={{ textAlign: 'center', opacity: 0.6, fontSize: 14, marginBottom: 40 }}>
      Click any scheme to visit the official government page
    </p>

    {schemes.length === 0
      ? <p style={{ textAlign: 'center', color: '#9ca3af' }}>No schemes listed yet.</p>
      : (
        <>
          {/* Filter tabs */}
          {['all','farmer','startup','both'].some(role =>
            schemes.find(s => s.target_role === role || role === 'all')) && (
            <div style={{ display: 'flex', justifyContent: 'center', gap: 10, marginBottom: 32, flexWrap: 'wrap' }}>
              {[['all','🌐 All'],['farmer','👨‍🌾 Farmers'],['startup','🏢 Startups'],['both','🤝 Everyone']].map(([val, label]) => {
                const hasItems = val === 'all' || schemes.some(s => s.target_role === val || s.target_role === 'both');
                if (!hasItems) return null;
                return (
                  <span key={val} style={{ background: `${P}15`, color: P, padding: '6px 18px',
                    borderRadius: 20, fontSize: 13, fontWeight: 600, cursor: 'default',
                    border: `1px solid ${P}30` }}>
                    {label}
                  </span>
                );
              })}
            </div>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(300px,1fr))', gap: 20 }}>
            {schemes.map(s => {
              const roleLabel = s.target_role === 'farmer' ? '👨‍🌾 Farmers'
                              : s.target_role === 'startup' ? '🏢 Startups'
                              : '🤝 Everyone';
              const roleColor = s.target_role === 'farmer' ? '#065f46'
                              : s.target_role === 'startup' ? '#1e40af'
                              : '#7c3aed';
              const roleBg    = s.target_role === 'farmer' ? '#d1fae5'
                              : s.target_role === 'startup' ? '#dbeafe'
                              : '#ede9fe';

              const card = (
                <div style={{ background: '#fff', borderLeft: `4px solid ${P}`,
                  borderRadius: 16, padding: 24, boxShadow: '0 4px 12px rgba(0,0,0,0.06)',
                  display: 'flex', flexDirection: 'column', gap: 10,
                  transition: 'transform 0.2s, box-shadow 0.2s',
                  cursor: s.official_url ? 'pointer' : 'default' }}
                  onMouseEnter={e => {
                    e.currentTarget.style.transform = 'translateY(-4px)';
                    e.currentTarget.style.boxShadow = '0 12px 28px rgba(0,0,0,0.1)';
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.transform = '';
                    e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.06)';
                  }}>

                  {/* Top row */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                    <span style={{ fontSize: '2rem' }}>{s.icon || '📋'}</span>
                    <div style={{ flex: 1 }}>
                      <span style={{ background: roleBg, color: roleColor,
                        padding: '2px 10px', borderRadius: 20, fontSize: 11, fontWeight: 600 }}>
                        {roleLabel}
                      </span>
                      <p style={{ fontWeight: 700, color: '#1f2937', marginTop: 4, fontSize: 14 }}>
                        {s.name}
                      </p>
                    </div>
                  </div>

                  {/* Description */}
                  <p style={{ fontSize: 13, opacity: 0.7, lineHeight: 1.6 }}>{s.description}</p>

                  {/* Eligibility */}
                  {s.eligibility && (
                    <div style={{ background: '#f8fdf5', borderRadius: 8, padding: '8px 12px',
                      fontSize: 12, color: '#374151', border: '1px solid #e8f5e0' }}>
                      <strong style={{ color: P }}>Eligibility:</strong> {s.eligibility}
                    </div>
                  )}

                  {/* Bottom row */}
                  <div style={{ display: 'flex', justifyContent: 'space-between',
                    alignItems: 'center', marginTop: 4 }}>
                    {s.deadline
                      ? <span style={{ fontSize: 11, color: '#f59e0b', fontWeight: 600 }}>
                          ⏰ Deadline: {new Date(s.deadline).toLocaleDateString('en-IN')}
                        </span>
                      : <span />
                    }
                    {s.official_url && (
                      <span style={{ fontSize: 12, color: P, fontWeight: 600 }}>
                        Visit →
                      </span>
                    )}
                  </div>
                </div>
              );

              return s.official_url
                ? <a key={s.id} href={s.official_url} target="_blank" rel="noopener noreferrer"
                    style={{ textDecoration: 'none' }}>{card}</a>
                : <div key={s.id}>{card}</div>;
            })}
          </div>
        </>
      )
    }
  </div>
</div>

      {/* Footer */}
      <footer style={{ background: P, color: '#fff', textAlign: 'center', padding: '40px 20px' }}>
        <div style={{ fontSize: '2.5rem', marginBottom: 12 }}>🌾</div>
        <p style={{ fontWeight: 600, fontSize: '1.1rem' }}>Shree Anna</p>
        <p style={{ opacity: 0.85, fontSize: 14 }}>Connecting Farmers, Startups & Customers</p>
        <p style={{ opacity: 0.6, fontSize: 12, marginTop: 12 }}>© 2024 All Rights Reserved | Government of India Initiative</p>
      </footer>
    </div>
  );
}