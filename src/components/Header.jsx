import { Menu, TrendingUp, Sun, Moon, Activity } from 'lucide-react';
import { useState, useEffect } from 'react';

export default function Header({ activeTab, onTabChange, onToggleMobileMenu, theme = 'dark', onToggleTheme }) {
  const [now, setNow] = useState(new Date());

  // Keep clock ticking
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  const timeStr = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });
  const dateStr = now.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });

  return (
    <header
      className="flex items-center justify-between px-4 md:px-6 py-0 shrink-0 select-none"
      style={{
        height: '56px',
        borderBottom: '1px solid var(--border-card)',
        background: 'var(--bg-sidebar)',
      }}
    >
      {/* Brand left */}
      <div className="flex items-center gap-3">
        <div
          className="flex items-center justify-center w-8 h-8 rounded-lg"
          style={{ background: 'var(--border-active)' }}
        >
          <TrendingUp size={16} style={{ color: '#000' }} />
        </div>
        <div className="flex flex-col leading-none">
          <span
            className="text-[13px] font-extrabold tracking-[0.12em] uppercase"
            style={{ color: 'var(--text-dark)', fontFamily: "'Outfit', sans-serif" }}
          >
            TradeOS
          </span>
          <span
            className="text-[9px] font-semibold tracking-widest uppercase"
            style={{ color: 'var(--text-accent)' }}
          >
            Professional Trading Journal
          </span>
        </div>
      </div>

      {/* Right side: live clock + theme toggle + menu */}
      <div className="flex items-center gap-3">
        {/* Live Clock — hidden on very small screens */}
        <div
          className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg"
          style={{ background: 'var(--bg-card)', border: '1px solid var(--border-card)' }}
        >
          <Activity size={11} style={{ color: 'var(--text-accent)' }} />
          <span
            className="font-mono-data text-[11px] font-semibold"
            style={{ color: 'var(--text-primary)' }}
          >
            {timeStr}
          </span>
          <span
            className="text-[10px] font-medium"
            style={{ color: 'var(--text-secondary)' }}
          >
            {dateStr}
          </span>
        </div>

        {/* Theme Toggle */}
        <button
          onClick={onToggleTheme}
          title={theme === 'dark' ? 'Switch to Light Theme' : 'Switch to Dark Theme'}
          className="flex items-center justify-center w-9 h-9 rounded-lg transition-all duration-200 cursor-pointer"
          style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--border-card)',
            color: 'var(--text-secondary)',
          }}
        >
          {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
        </button>

        {/* Mobile Menu Toggle */}
        <button
          className="md:hidden flex items-center justify-center w-9 h-9 rounded-lg cursor-pointer transition-all duration-200"
          style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--border-card)',
            color: 'var(--text-secondary)',
          }}
          onClick={onToggleMobileMenu}
        >
          <Menu size={18} />
        </button>
      </div>
    </header>
  );
}
