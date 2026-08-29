import { Radio, DollarSign, Percent, TrendingUp, Layers, Activity, LayoutDashboard, BookOpen, BarChart3, Settings, Calendar, LogOut, Target } from 'lucide-react';
import { formatCurrency, formatPercent, formatNumber } from '../utils/calculations';
import { supabase } from '../utils/supabaseClient';

// eslint-disable-next-line no-unused-vars
export default function SidebarStats({
  stats,
  activeTab,
  onTabChange,
  onOpenNewTrade,
  onSync,
  syncStatus,
  onLoadDemo,
  isDemo,
  userEmail
}) {

  const tabGroups = [
    {
      label: 'MAIN',
      items: [
        { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard size={16} /> },
        { id: 'journal', label: 'Daily Journal', icon: <BookOpen size={16} /> },
        { id: 'calendar', label: 'Calendar', icon: <Calendar size={16} /> },
        { id: 'capital', label: 'Capital & Targets', icon: <Target size={16} /> },
      ]
    },
    {
      label: 'ANALYSIS',
      items: [
        { id: 'trades', label: 'Trade Log', icon: <TrendingUp size={16} /> },
        { id: 'analytics', label: 'Analytics', icon: <BarChart3 size={16} /> },
      ]
    },
    {
      label: 'SYSTEM',
      items: [
        { id: 'settings', label: 'Settings', icon: <Settings size={16} /> },
      ]
    }
  ];

  const handleSync = async () => {
    if (onSync) await onSync();
  };

  return (
    <div
      className="flex flex-col h-full p-5 gap-5 select-none shrink-0"
      style={{ 
        background: 'var(--bg-sidebar)', 
        borderColor: 'var(--border-card)',
      }}
    >
      {/* ── Cockpit Navigation Header ── */}
      <div className="space-y-1 py-2 border-b border-[var(--border-card)] pb-4 mb-2">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-8 h-8 rounded-lg bg-[var(--border-active)] flex items-center justify-center text-[var(--bg-app)] flex-shrink-0">
            <Activity size={16} strokeWidth={3} />
          </div>
          <div className="text-sm font-black tracking-wide truncate" style={{ color: 'var(--text-dark)', fontFamily: "'Inter', sans-serif" }} title={userEmail}>
            {userEmail || 'TradeOS'}
          </div>
        </div>
      </div>

      {/* ── Unified Vertical Tab Navigation Menu ── */}
      <nav className="flex flex-col gap-6 w-full flex-1 overflow-y-auto pr-2 pb-4 scrollbar-hide">
        
        {tabGroups.map(group => (
          <div key={group.label} className="flex flex-col gap-1.5">
            <div className="text-[10px] font-bold text-[var(--text-secondary)] tracking-widest uppercase mb-1.5 px-3">
              {group.label}
            </div>
            {group.items.map(tab => {
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => onTabChange(tab.id)}
                  className="relative px-3 py-2.5 text-[13px] font-semibold tracking-wide transition-all duration-200 cursor-pointer flex items-center gap-3 flex-nowrap whitespace-nowrap rounded-lg group overflow-hidden"
                  style={{
                    color: isActive ? 'var(--text-dark)' : 'var(--text-secondary)',
                    background: isActive ? 'color-mix(in srgb, var(--border-active) 10%, transparent)' : 'transparent',
                  }}
                  onMouseEnter={(e) => {
                    if (!isActive) {
                      e.currentTarget.style.background = 'var(--bg-input)';
                      e.currentTarget.style.color = 'var(--text-primary)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isActive) {
                      e.currentTarget.style.background = 'transparent';
                      e.currentTarget.style.color = 'var(--text-secondary)';
                    }
                  }}
                >
                  {/* Glowing active indicator line */}
                  {isActive && (
                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-[var(--border-active)] rounded-r-full shadow-[0_0_8px_var(--border-active)]" />
                  )}
                  
                  <span className={isActive ? 'text-[var(--border-active)] ml-1 transition-all' : 'text-[var(--text-secondary)] transition-all group-hover:text-[var(--text-primary)]'}>
                    {tab.icon}
                  </span>
                  <span className="whitespace-nowrap font-medium" style={{ fontFamily: "'Inter', sans-serif" }}>{tab.label}</span>
                </button>
              );
            })}
          </div>
        ))}

        {/* ── Live Metrics ── */}
        <div className="mt-4 space-y-2">
          <div className="text-[10px] font-bold text-[var(--text-secondary)] tracking-widest uppercase mb-3 whitespace-nowrap px-2">
            LIVE METRICS
          </div>

          <div className="flex flex-col gap-2 px-1">
            {/* Net Return — full width */}
            <div className="glass-panel rounded-xl border border-[var(--border-card)]" style={{ padding: '14px 16px' }}>
              <span className="text-[9px] font-bold uppercase tracking-wider flex items-center gap-1 text-[var(--text-secondary)] mb-2">
                <DollarSign size={10} /> Net Return
              </span>
              <span className={`text-[18px] font-black font-mono-data block leading-none ${stats.totalNetPnl >= 0 ? 'text-[var(--color-profit)]' : 'text-[var(--color-loss)]'}`}>
                {formatCurrency(stats.totalNetPnl)}
              </span>
            </div>

            {/* Win Rate — full width */}
            <div className="glass-panel rounded-xl border border-[var(--border-card)]" style={{ padding: '14px 16px' }}>
              <span className="text-[9px] font-bold uppercase tracking-wider flex items-center gap-1 text-[var(--text-secondary)] mb-2">
                <Percent size={10} /> Win Rate
              </span>
              <span className="text-[18px] font-black font-mono-data block leading-none text-[var(--text-dark)]">
                {formatPercent(stats.winRate)}
              </span>
            </div>
          </div>
        </div>

        {/* ── Actions Panel ── */}
        <div className="mt-2 space-y-2 px-1">
          <button
            onClick={onOpenNewTrade}
            className="w-full py-3.5 text-[11px] font-bold uppercase tracking-widest cursor-pointer transition-all duration-200 border bg-[var(--border-active)] text-[var(--bg-app)] hover:opacity-90 active:scale-[0.98] rounded-xl flex items-center justify-center gap-2"
            style={{ borderColor: 'var(--border-active)' }}
          >
            <Layers size={14} /> LOG TRADE
          </button>
          
          {onLoadDemo && !isDemo && (
            <button
              onClick={onLoadDemo}
              className="w-full py-2.5 text-[10px] font-semibold uppercase tracking-widest cursor-pointer transition-all duration-200 border bg-transparent text-[var(--text-secondary)] hover:text-[var(--text-accent)] hover:border-[var(--border-active)] rounded-lg"
              style={{ borderColor: 'var(--border-card)' }}
            >
              Load Demo Data
            </button>
          )}
        </div>

      </nav>

      {/* ── User Profile Footer ── */}
      <div className="pt-4 border-t border-[var(--border-card)] mt-auto flex items-center justify-between">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 rounded-full bg-[var(--bg-input)] border border-[var(--border-card)] flex items-center justify-center flex-shrink-0 relative overflow-hidden">
             {/* Simple avatar placeholder */}
             <div className="text-[var(--text-secondary)] text-sm font-bold uppercase">
               {userEmail ? userEmail.charAt(0) : 'U'}
             </div>
             {/* Online status indicator */}
             <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-[var(--color-profit)] border-2 border-[var(--bg-sidebar)] rounded-full"></div>
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-[11px] font-bold text-[var(--text-dark)] truncate">
              {userEmail || 'Guest User'}
            </div>
            <div className="text-[9px] font-medium text-[var(--color-cyan)] uppercase tracking-wider mt-0.5">
              Pro Plan
            </div>
          </div>
        </div>
        
        <button 
          title="Sign Out"
          className="p-2 text-[var(--text-secondary)] hover:text-[var(--color-loss)] hover:bg-[var(--bg-input)] rounded-lg transition-colors cursor-pointer"
          onClick={async () => {
            await supabase.auth.signOut();
          }}
        >
          <LogOut size={16} />
        </button>
      </div>

    </div>
  );
}
