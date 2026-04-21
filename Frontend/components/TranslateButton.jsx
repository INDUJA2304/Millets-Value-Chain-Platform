import React, { useState, useEffect } from 'react';

const LANGUAGES = [
  { code: 'en', label: 'English',   native: 'English'  },
  { code: 'hi', label: 'Hindi',     native: 'हिंदी'     },
  { code: 'kn', label: 'Kannada',   native: 'ಕನ್ನಡ'     },
  { code: 'ta', label: 'Tamil',     native: 'தமிழ்'     },
  { code: 'te', label: 'Telugu',    native: 'తెలుగు'    },
  { code: 'ml', label: 'Malayalam', native: 'മലയാളം'    },
  { code: 'mr', label: 'Marathi',   native: 'मराठी'     },
  { code: 'gu', label: 'Gujarati',  native: 'ગુજરાતી'   },
  { code: 'pa', label: 'Punjabi',   native: 'ਪੰਜਾਬੀ'    },
  { code: 'bn', label: 'Bengali',   native: 'বাংলা'     },
  { code: 'or', label: 'Odia',      native: 'ଓଡ଼ିଆ'     },
  { code: 'ur', label: 'Urdu',      native: 'اردو'      },
];

const P = '#4a7c2c';

// Set the Google Translate cookie and reload — most reliable method
function setCookieAndReload(langCode) {
  if (langCode === 'en') {
    // Clear cookie — no domain attribute for localhost
    document.cookie = 'googtrans=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
  } else {
    const val = `/en/${langCode}`;
    // On localhost, never set domain attribute — it breaks the cookie
    document.cookie = `googtrans=${val}; path=/`;
  }
  localStorage.setItem('preferred_lang', langCode);
  window.location.reload();
}

// Read current language from cookie
function getLangFromCookie() {
  const match = document.cookie.match(/googtrans=\/en\/([a-z]+)/);
  return match ? match[1] : 'en';
}

export default function TranslateButton() {
  const [open, setOpen]       = useState(false);
  const [current, setCurrent] = useState('en');

  useEffect(() => {
    // Read from cookie on mount
    const fromCookie = getLangFromCookie();
    if (fromCookie) setCurrent(fromCookie);
  }, []);

  // Close on outside click
  useEffect(() => {
    function handler(e) {
      if (!e.target.closest('#translate-btn-wrapper')) setOpen(false);
    }
    document.addEventListener('click', handler);
    return () => document.removeEventListener('click', handler);
  }, []);

  const currentLang = LANGUAGES.find(l => l.code === current) || LANGUAGES[0];

  return (
    <div id="translate-btn-wrapper" style={{ position: 'relative', zIndex: 9999 }}>
      <button
        onClick={() => setOpen(o => !o)}
        style={{ display: 'flex', alignItems: 'center', gap: 6,
          background: '#fff', border: `2px solid ${P}`, borderRadius: 8,
          padding: '7px 12px', cursor: 'pointer', fontFamily: 'Poppins, sans-serif',
          fontSize: 13, fontWeight: 600, color: P }}>
        🌐 {currentLang.native}
        <span style={{ fontSize: 10, opacity: 0.7 }}>{open ? '▲' : '▼'}</span>
      </button>

      {open && (
        <div style={{ position: 'absolute', top: '110%', right: 0,
          background: '#fff', border: '2px solid #e8f5e0', borderRadius: 12,
          boxShadow: '0 8px 24px rgba(0,0,0,0.12)', minWidth: 190,
          maxHeight: 320, overflowY: 'auto' }}>
          {LANGUAGES.map(lang => (
            <button key={lang.code}
              onClick={() => { setCurrent(lang.code); setOpen(false); setCookieAndReload(lang.code); }}
              style={{ display: 'flex', justifyContent: 'space-between',
                alignItems: 'center', width: '100%', padding: '10px 16px',
                background: current === lang.code ? `${P}10` : 'none',
                border: 'none', cursor: 'pointer', fontFamily: 'Poppins, sans-serif',
                fontSize: 13, color: current === lang.code ? P : '#374151',
                fontWeight: current === lang.code ? 700 : 400,
                borderBottom: '1px solid #f3f4f6', textAlign: 'left' }}>
              <span>{lang.native}</span>
              <span style={{ fontSize: 11, opacity: 0.5 }}>{lang.label}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}