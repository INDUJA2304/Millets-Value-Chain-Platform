import React, { createContext, useContext, useState, useCallback } from 'react';

const ToastContext = createContext(null);

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const showToast = useCallback((msg, isError = false) => {
    const id = Date.now();
    setToasts(t => [...t, { id, msg, isError }]);
    setTimeout(() => setToasts(t => t.filter(x => x.id !== id)), 3000);
  }, []);

  return (
    <ToastContext.Provider value={showToast}>
      {children}
      <div style={{ position: 'fixed', bottom: 24, right: 24, zIndex: 9999, display: 'flex', flexDirection: 'column', gap: 8 }}>
        {toasts.map(t => (
          <div key={t.id} style={{
            padding: '14px 22px', borderRadius: 12, fontWeight: 600, fontSize: 14,
            background: t.isError ? '#dc2626' : '#4a7c2c', color: '#fff',
            boxShadow: '0 8px 24px rgba(0,0,0,0.15)',
            animation: 'slideUp 0.3s ease'
          }}>
            {t.msg}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export const useToast = () => useContext(ToastContext);