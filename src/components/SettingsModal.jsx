import { useState, useEffect } from 'react';
import { X, Settings, Database, Sliders, Shield, Info } from 'lucide-react';

/* ── Small reusable info tooltip ── */
const Tip = ({ text }) => (
  <span className="info-trigger" style={{ color: 'var(--text-secondary)', display: 'inline-flex', cursor: 'help' }}>
    <Info size={10} />
    <span className="info-tooltip font-sans" style={{ textTransform: 'none', letterSpacing: 'normal' }}>{text}</span>
  </span>
);

export default function SettingsModal({ settings, onSave, onClose }) {
  const [googleSheetId, setGoogleSheetId] = useState(settings.googleSheetId || '');
  const [quickEntry, setQuickEntry] = useState(settings.quickEntry || false);
  const [theme, setTheme] = useState(settings.theme || 'dark');

  useEffect(() => {
    const handleKey = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [onClose]);

  const handleSave = () => {
    onSave({ googleSheetId, quickEntry, theme });
    onClose();
  };

  const activeColor = 'var(--border-active)';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fade-in">
      <div
        className="w-full max-w-md border glass-panel"
        style={{
          borderColor: `${activeColor}44`,
          background: 'var(--bg-card)',
          boxShadow: `0 24px 60px rgba(0, 0, 0, 0.85), 0 0 40px ${activeColor}15`,
          position: 'relative',
          overflow: 'hidden',
          borderRadius: 16,
          padding: '0'
        }}
      >
        {/* Accent Top Border Bar */}
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '3px', background: `linear-gradient(90deg, transparent, ${activeColor}, transparent)` }} />

        {/* Ambient Top Glow */}
        <div style={{ position: 'absolute', top: '-50px', left: '50%', transform: 'translateX(-50%)', width: '200px', height: '100px', background: `radial-gradient(circle, ${activeColor}15 0%, transparent 70%)`, pointerEvents: 'none' }} />

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-[var(--border-card)] bg-[var(--bg-sidebar)]">
          <div className="flex items-center gap-2.5">
            <Settings size={15} className="text-[var(--text-accent)] animate-spin" style={{ animationDuration: '8s' }} />
            <span className="stat-label" style={{ fontSize: 11, color: 'var(--text-dark)', letterSpacing: '0.22em' }}>
              System Control Deck
            </span>
          </div>
          <button 
            onClick={onClose} 
            style={{ 
              borderRadius: '9999px',
              border: 'none',
              background: 'transparent',
              padding: '6px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              color: 'var(--text-secondary)'
            }}
            onMouseEnter={e => e.currentTarget.style.color = 'var(--color-loss)'}
            onMouseLeave={e => e.currentTarget.style.color = 'var(--text-secondary)'}
          >
            <X size={15} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">

          {/* Section 1: Sheet Integration */}
          <div className="space-y-3">
            <label className="stat-label" style={{ color: 'var(--text-secondary)' }}>
              <Database size={11} className="text-[var(--text-accent)]" />
              Google Sheet Database ID <Tip text="Synchronize all trade entries directly to a private Google Spreadsheet for secondary record keeping." />
            </label>
            <div style={{ position: 'relative' }}>
              <input
                type="text"
                value={googleSheetId}
                onChange={(e) => setGoogleSheetId(e.target.value)}
                placeholder="Spreadsheet ID (e.g. 1aBcDeFgHiJkLmNoP...)"
                className="w-full px-4 py-3 text-xs border outline-none font-mono-data transition-all duration-200"
                style={{
                  background: 'var(--bg-input)',
                  borderColor: 'var(--border-input)',
                  color: 'var(--text-input)',
                  borderRadius: 10,
                  height: '42px',
                  boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.5)'
                }}
              />
            </div>
            <div style={{ display: 'flex', gap: 6, alignItems: 'center', background: 'rgba(255,255,255,0.015)', padding: '10px 12px', borderRadius: 12, border: '1px solid var(--border-card)' }}>
              <Shield size={11} style={{ color: 'var(--text-accent)', flexShrink: 0 }} />
              <p className="text-[9px] text-[var(--text-secondary)] leading-relaxed uppercase tracking-wider font-bold">
                Leave blank to operate purely in high-speed offline local storage mode.
              </p>
            </div>
          </div>

          {/* Section 2: Quick Entry */}
          <div className="flex items-center justify-between py-4.5 border-t border-[var(--border-card)]">
            <div className="flex flex-col gap-1" style={{ minWidth: 0 }}>
              <label className="stat-label" style={{ color: 'var(--text-secondary)' }}>
                <Sliders size={11} className="text-[var(--text-accent)]" />
                Quick Entry HUD <Tip text="Activates simplified transaction input forms by omitting advanced metric logs like setups, plans, and emotional status checks." />
              </label>
              <span className="stat-sub" style={{ fontSize: 9, marginTop: 1, whiteSpace: 'normal' }}>Bypass emotional checks & setups</span>
            </div>
            <button
              onClick={() => setQuickEntry(!quickEntry)}
              style={{ 
                width: '48px',
                height: '24px',
                background: quickEntry ? 'var(--bg-kpi-profit)' : 'rgba(0,0,0,0.4)', 
                border: `1.5px solid ${quickEntry ? 'var(--border-active)' : 'var(--border-card)'}`,
                borderRadius: '9999px',
                cursor: 'pointer',
                position: 'relative',
                flexShrink: 0,
                boxShadow: quickEntry ? `0 0 12px ${activeColor}33` : 'none',
                transition: 'all 0.3s ease'
              }}
            >
              <span
                style={{ 
                  position: 'absolute',
                  top: '2px',
                  width: '16px',
                  height: '16px',
                  background: quickEntry ? 'var(--border-active)' : '#4b5563', 
                  left: quickEntry ? '26px' : '3px', 
                  borderRadius: '9999px',
                  boxShadow: quickEntry ? `0 0 8px ${activeColor}` : 'none',
                  transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)'
                }}
              />
            </button>
          </div>

          {/* Section 3: Interface Theme */}
          <div className="flex items-center justify-between py-4.5 border-t border-[var(--border-card)]">
            <div className="flex flex-col gap-1">
              <label className="stat-label" style={{ color: 'var(--text-secondary)' }}>
                🌓 Interface Theme
              </label>
              <span className="stat-sub" style={{ fontSize: 9, marginTop: 1 }}>Pitch Black Dark vs Feather Light Mint</span>
            </div>
            <div 
              style={{ 
                display: 'flex', 
                gap: '2px', 
                border: '1px solid var(--border-card)', 
                padding: '2px', 
                background: 'rgba(0,0,0,0.35)', 
                borderRadius: 12,
                flexShrink: 0
              }}
            >
              <button
                type="button"
                onClick={() => setTheme('dark')}
                style={{
                  width: '64px',
                  height: '26px',
                  border: 'none',
                  background: theme === 'dark' ? 'var(--border-active)' : 'transparent',
                  color: theme === 'dark' ? 'var(--bg-app)' : 'var(--text-secondary)',
                  fontSize: '9px',
                  fontWeight: '800',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  cursor: 'pointer',
                  borderRadius: 10,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: theme === 'dark' ? `0 0 8px ${activeColor}44` : 'none',
                  transition: 'all 0.2s ease'
                }}
              >
                DARK
              </button>
              <button
                type="button"
                onClick={() => setTheme('light')}
                style={{
                  width: '64px',
                  height: '26px',
                  border: 'none',
                  background: theme === 'light' ? 'var(--border-active)' : 'transparent',
                  color: theme === 'light' ? 'var(--bg-app)' : 'var(--text-secondary)',
                  fontSize: '9px',
                  fontWeight: '800',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  cursor: 'pointer',
                  borderRadius: 10,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: theme === 'light' ? `0 0 8px ${activeColor}44` : 'none',
                  transition: 'all 0.2s ease'
                }}
              >
                LIGHT
              </button>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3 px-6 pb-6 pt-2">
          <button
            onClick={handleSave}
            style={{ 
              flex: 1,
              height: '42px',
              border: 'none',
              background: 'var(--border-active)', 
              color: 'var(--bg-app)',
              fontFamily: "'Inter', sans-serif",
              fontSize: '11px',
              fontWeight: 'bold',
              textTransform: 'uppercase',
              letterSpacing: '0.12em',
              borderRadius: 10,
              boxShadow: `0 4px 14px ${activeColor}44`,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'opacity 0.2s ease'
            }}
            onMouseEnter={e => e.currentTarget.style.opacity = 0.9}
            onMouseLeave={e => e.currentTarget.style.opacity = 1}
          >
            Apply Configs
          </button>
          <button
            onClick={onClose}
            style={{ 
              flex: 1,
              height: '42px',
              border: '1px solid var(--border-card)',
              background: 'transparent', 
              color: 'var(--text-secondary)',
              fontFamily: "'Inter', sans-serif",
              fontSize: '11px',
              fontWeight: 'bold',
              textTransform: 'uppercase',
              letterSpacing: '0.12em',
              borderRadius: 10,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.2s ease'
            }}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.02)'; e.currentTarget.style.color = 'var(--text-dark)'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--text-secondary)'; }}
          >
            Cancel
          </button>
        </div>

        {/* ESC Key dismiss note */}
        <div className="pb-5">
          <p className="text-[8px] text-center text-[var(--text-secondary)] font-bold uppercase tracking-widest" style={{ letterSpacing: '0.15em' }}>
            Press ESC to terminate deck
          </p>
        </div>
      </div>
    </div>
  );
}
