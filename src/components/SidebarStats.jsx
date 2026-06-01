import { Radio, DollarSign, Percent, TrendingUp, Layers, Activity, LayoutDashboard, BookOpen, BarChart3, Settings, Calendar } from 'lucide-react';
import { formatCurrency, formatPercent, formatNumber } from '../utils/calculations';

export default function SidebarStats({
  stats,
  activeTab,
  onTabChange,
  onOpenNewTrade,
  onSync,
  syncStatus,
  onLoadDemo,
  userEmail
}) {

  const tabs = [
    { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard size={14} /> },
    { id: 'trades', label: 'Trade Log', icon: <TrendingUp size={14} /> },
    { id: 'journal', label: 'Daily Journal', icon: <BookOpen size={14} /> },
    { id: 'calendar', label: 'Calendar', icon: <Calendar size={14} /> },
    { id: 'analytics', label: 'Analytics', icon: <BarChart3 size={14} /> },
    { id: 'settings', label: 'Settings', icon: <Settings size={14} /> },
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
      <div className="space-y-1 py-1 border-b border-[var(--border-card)] pb-3 mb-2">
        <div className="flex items-center gap-3 flex-nowrap whitespace-nowrap mb-1">
          <Radio size={16} className="text-[var(--text-accent)] pulse-cyan flex-shrink-0" />
          <div className="text-xs font-bold tracking-[0.2em] uppercase whitespace-nowrap" style={{ color: 'var(--text-dark)', fontFamily: "'Outfit', sans-serif" }}>
            PERSEVERANCE
          </div>
        </div>
        {userEmail && (
          <div className="text-[10px] font-medium tracking-wide truncate" style={{ color: 'var(--text-secondary)' }}>
            {userEmail}
          </div>
        )}
      </div>

      {/* ── Unified Vertical Tab Navigation Menu ── */}
      <nav className="flex flex-col gap-2 w-full">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className="px-4 py-3.5 text-[13px] font-semibold tracking-wide transition-all duration-200 cursor-pointer flex items-center gap-3 rounded-lg flex-nowrap whitespace-nowrap"
              style={{
                border: isActive ? '1px solid var(--border-active)' : '1px solid transparent',
                color: isActive ? 'var(--text-dark)' : 'var(--text-secondary)',
                background: isActive ? 'var(--bg-input)' : 'transparent',
                boxShadow: isActive ? '0 4px 12px rgba(0,0,0,0.1)' : 'none',
              }}
              onMouseEnter={(e) => {
                if (!isActive) {
                  e.currentTarget.style.background = 'rgba(255,255,255,0.02)';
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
              <span className={isActive ? 'text-[var(--text-accent)]' : 'text-[#64748b]'}>
                {tab.icon}
              </span>
              <span className="whitespace-nowrap font-medium" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>{tab.label}</span>
            </button>
          );
        })}
      </nav>

      {/* Divider */}
      <div className="h-px w-full bg-[var(--border-card)] my-2" />

      {/* ── High-Contrast Session Metrics (Numbers wrapped inside glowing container cards) ── */}
      <div className="flex-1 space-y-4 overflow-y-auto pr-1">
        <div className="text-[10px] font-bold text-[#64748b] tracking-widest uppercase mb-2 whitespace-nowrap font-sans">
          LIVE METRICS
        </div>

        {/* Net P&L card */}
        <div 
          className={stats.totalNetPnl >= 0 ? 'kpi-container-profit' : 'kpi-container-loss'}
          style={{ padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: '6px' }}
        >
          <div className="flex items-center justify-between text-[var(--text-secondary)]">
            <span className="text-[10px] font-medium uppercase tracking-wider flex items-center gap-1 whitespace-nowrap">
              <DollarSign size={11} className="flex-shrink-0" />
              Net Return
            </span>
          </div>
          <div 
            className="text-xl font-bold font-mono-data tracking-tight whitespace-nowrap"
            style={{ color: stats.totalNetPnl >= 0 ? 'var(--color-profit)' : 'var(--color-loss)' }}
          >
            {formatCurrency(stats.totalNetPnl)}
          </div>
        </div>

        {/* Win Rate with progress bar */}
        <div 
          className="kpi-container-cyan"
          style={{ padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: '8px' }}
        >
          <div className="flex items-center justify-between text-[var(--text-secondary)] border-none">
            <span className="text-[10px] font-medium uppercase tracking-wider flex items-center gap-1 whitespace-nowrap">
              <Percent size={11} className="flex-shrink-0" />
              Win Rate
            </span>
            <span className="font-bold text-xs font-mono-data text-[var(--text-dark)] whitespace-nowrap">
              {formatPercent(stats.winRate)}
            </span>
          </div>
          {/* Enhanced Progress Gauge */}
          <div className="w-full bg-[var(--scrollbar-thumb)]/50 h-1.5 border border-[var(--border-card)] overflow-hidden rounded-[9999px]">
            <div 
              className="h-full transition-all duration-500 ease-out"
              style={{ 
                width: `${stats.winRate}%`,
                background: stats.winRate >= 50 ? 'linear-gradient(90deg, var(--border-active), var(--color-profit))' : 'linear-gradient(90deg, var(--color-loss), var(--text-secondary))',
              }}
            />
          </div>
        </div>

        {/* Total Trades */}
        <div 
          className="kpi-container-slate"
          style={{ padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: '6px' }}
        >
          <div className="flex items-center justify-between text-[var(--text-secondary)]">
            <span className="text-[10px] font-medium uppercase tracking-wider flex items-center gap-1 whitespace-nowrap">
              <Layers size={11} className="flex-shrink-0" />
              Executions
            </span>
            <span className="font-bold text-sm font-mono-data text-[var(--text-accent)] whitespace-nowrap">
              {formatNumber(stats.totalTrades)}
            </span>
          </div>
        </div>

        {/* Profit Factor */}
        <div 
          className={stats.profitFactor >= 1.0 ? 'kpi-container-profit' : 'kpi-container-loss'}
          style={{ padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: '6px' }}
        >
          <div className="flex items-center justify-between text-[var(--text-secondary)]">
            <span className="text-[10px] font-medium uppercase tracking-wider flex items-center gap-1 whitespace-nowrap">
              <TrendingUp size={11} className="flex-shrink-0" />
              Profit Factor
            </span>
            <span 
              className="font-bold text-sm font-mono-data whitespace-nowrap"
              style={{ color: stats.profitFactor >= 1.0 ? 'var(--color-profit)' : stats.profitFactor > 0 ? 'var(--color-loss)' : 'var(--text-primary)' }}
            >
              {stats.profitFactor === Infinity ? '∞' : stats.profitFactor.toFixed(2)}
            </span>
          </div>
        </div>

      </div>

      {/* ── Actions Panel ── */}
      <div className="space-y-2 pt-2">
        <button
          onClick={onOpenNewTrade}
          className="w-full py-3 text-xs font-semibold uppercase tracking-widest cursor-pointer transition-all duration-200 border bg-[var(--border-active)] text-[var(--bg-sidebar)] hover:opacity-90 active:scale-[0.98]"
          style={{ borderColor: 'var(--border-active)' }}
        >
          LOG TRADE SESSION
        </button>

        <button
          onClick={onLoadDemo}
          className="w-full py-2 text-[9px] font-semibold uppercase tracking-widest border cursor-pointer bg-transparent text-[var(--text-secondary)] border-[var(--border-card)] hover:text-[var(--text-dark)] hover:border-[var(--border-active)] transition-all"
        >
          GENERATE FULL DENSE DEMO
        </button>
      </div>

      {/* ── Boxed Sync Status ── */}
      <div 
        className="flex items-center justify-between border px-2.5 py-2 bg-[var(--bg-card)]" 
        style={{ borderColor: 'var(--border-card)' }}
      >
        <span className="text-[9px] font-semibold text-[var(--text-secondary)] tracking-widest uppercase flex items-center gap-1">
          <Activity size={10} />
          SYNC ENGINE
        </span>
        <button 
          onClick={handleSync}
          className="flex items-center gap-1 px-2.5 py-1.5 text-[9px] font-semibold uppercase tracking-widest cursor-pointer bg-[var(--bg-sidebar)] border transition-colors hover:opacity-85"
          style={{ 
            borderColor: syncStatus === 'success' ? 'var(--color-profit)' : syncStatus === 'error' ? 'var(--color-loss)' : 'var(--border-card)',
            color: syncStatus === 'success' ? 'var(--color-profit)' : syncStatus === 'error' ? 'var(--color-loss)' : 'var(--text-accent)',
          }}
        >
          {syncStatus === 'pending' ? '■ PENDING' : syncStatus === 'success' ? '■ SUCCESS' : syncStatus === 'error' ? '■ ERROR' : '■ ACTIVE'}
        </button>
      </div>
    </div>
  );
}
