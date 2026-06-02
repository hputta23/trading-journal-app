import { useState, useMemo } from 'react';
import {
  Calendar, TrendingUp, Info, Activity, DollarSign,
  Percent, Layers, Award, Receipt, ArrowUpRight,
  ArrowDownRight, ChevronRight, Zap, Trophy, Flame, Lock
} from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import { formatCurrency, formatPercent, formatNumber, calcDailyStats } from '../utils/calculations';
import { calcTraderRank, calcXP, calcStreak, getAchievements } from '../utils/gamification';

const TAX_RATE = 0.30;

/* ── Small reusable info tooltip ── */
const Tip = ({ text }) => (
  <span className="info-trigger" style={{ color: 'var(--text-secondary)', display: 'inline-flex' }}>
    <Info size={10} />
    <span className="info-tooltip font-sans">{text}</span>
  </span>
);

const StatCard = ({ icon, label, value, sub, color, bg, border, tip }) => (
  <div style={{ background: bg, border: `1px solid ${border}`, borderRadius: 12, padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: 6, minWidth: 0 }}>
    <div className="stat-label" style={{ color: 'var(--text-secondary)', fontSize: 9 }}>
      {icon} <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{label}</span> {tip && <Tip text={tip} />}
    </div>
    <div className="stat-value" style={{ fontSize: 'clamp(14px, 3vw, 19px)', color, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
      {value}
    </div>
    {sub && <div className="stat-sub" style={{ fontSize: 9, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{sub}</div>}
  </div>
);

export default function DashboardView({ allTrades, onSelectDate, onNavigateTab }) {
  const [hoveredData, setHoveredData] = useState(null);

  /* ── Core data ── */
  const allClosedTrades = useMemo(() => {
    const list = [];
    Object.entries(allTrades).forEach(([date, trades]) =>
      trades.forEach(t => { if (!t.isOpen && t.netPnl !== null) list.push({ ...t, date }); })
    );
    return list.sort((a, b) =>
      new Date(`${a.date}T${a.time||'00:00:00'}`) - new Date(`${b.date}T${b.time||'00:00:00'}`)
    );
  }, [allTrades]);

  const stats = useMemo(() => calcDailyStats(allClosedTrades), [allClosedTrades]);

  /* ── Tax ── */
  const afterTaxPnl = stats.totalNetPnl > 0 ? stats.totalNetPnl * (1 - TAX_RATE) : stats.totalNetPnl;
  const taxOwed     = stats.totalNetPnl > 0 ? stats.totalNetPnl * TAX_RATE : 0;

  /* ── Daily P&L map ── */
  const dailyPnLMap = useMemo(() => {
    const map = {};
    Object.entries(allTrades).forEach(([date, trades]) => {
      const closed = trades.filter(t => !t.isOpen && t.netPnl !== null);
      if (closed.length) map[date] = { netPnl: closed.reduce((s, t) => s + t.netPnl, 0), tradesCount: trades.length };
    });
    return map;
  }, [allTrades]);

  /* ── Best / worst day ── */
  const { bestDay, worstDay } = useMemo(() => {
    let best = null, worst = null;
    Object.entries(dailyPnLMap).forEach(([date, d]) => {
      if (!best  || d.netPnl > best.netPnl)  best  = { date, ...d };
      if (!worst || d.netPnl < worst.netPnl) worst = { date, ...d };
    });
    return { bestDay: best, worstDay: worst };
  }, [dailyPnLMap]);

  /* ── Gamification ── */
  const rank         = useMemo(() => calcTraderRank(stats), [stats]);
  const xp           = useMemo(() => calcXP(stats), [stats]);
  const streak       = useMemo(() => calcStreak(allTrades), [allTrades]);
  const achievements = useMemo(() => getAchievements(stats, bestDay?.netPnl ?? 0, streak), [stats, bestDay, streak]);
  const xpPct        = Math.min(100, Math.round((xp / rank.xpTarget) * 100));
  const unlocked     = achievements.filter(a => a.unlocked).length;

  /* ── Equity curve ── */
  const equityCurveData = useMemo(() => {
    const daily = {};
    allClosedTrades.forEach(t => { if (!daily[t.date]) daily[t.date] = 0; daily[t.date] += t.netPnl; });
    const sorted = Object.keys(daily).sort((a, b) => new Date(a) - new Date(b));
    let eq = 0;
    const pts = sorted.map((date, i) => { eq += daily[date]; return { i: i+1, date, v: +eq.toFixed(2) }; });
    if (pts.length) {
      const d0 = new Date(sorted[0]); d0.setDate(d0.getDate()-1);
      return [{ i: 0, date: d0.toISOString().split('T')[0], v: 0 }, ...pts];
    }
    return pts;
  }, [allClosedTrades]);

  /* ── Heatmap ── */
  const heatmapDays = useMemo(() => {
    const days = [];
    const end = new Date();
    const start = new Date(end);
    start.setDate(end.getDate() - 153 + (6 - end.getDay()));
    for (let i = 0; i < 154; i++) {
      const d = new Date(start); d.setDate(start.getDate() - (153 - i));
      const ds = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
      days.push({ date: ds, isToday: ds === new Date().toISOString().split('T')[0], ...dailyPnLMap[ds] });
    }
    return days;
  }, [dailyPnLMap]);

  const heatScale = useMemo(() => {
    let maxP = 1, maxL = 1;
    Object.values(dailyPnLMap).forEach(d => {
      if (d.netPnl > maxP) maxP = d.netPnl;
      if (d.netPnl < -maxL) maxL = Math.abs(d.netPnl);
    });
    return { maxP, maxL };
  }, [dailyPnLMap]);

  const cellColor = (day) => {
    if (!day?.tradesCount) return 'var(--heatmap-empty)';
    if (!day.netPnl) return 'var(--border-active)';
    if (day.netPnl > 0) {
      const r = day.netPnl / (heatScale.maxP || 1);
      return r <= 0.35 ? 'rgba(0,200,5,0.28)' : r <= 0.7 ? 'rgba(0,200,5,0.58)' : 'var(--color-profit)';
    }
    const r = Math.abs(day.netPnl) / (heatScale.maxL || 1);
    return r <= 0.35 ? 'rgba(255,59,92,0.28)' : r <= 0.7 ? 'rgba(255,59,92,0.58)' : 'var(--color-loss)';
  };

  /* ── Recent trades ── */
  const recentTrades = useMemo(() => {
    const list = [];
    Object.entries(allTrades).forEach(([date, trades]) => trades.forEach(t => list.push({ ...t, date })));
    return list.sort((a, b) =>
      new Date(`${b.date}T${b.time||'00:00:00'}`) - new Date(`${a.date}T${a.time||'00:00:00'}`)
    ).slice(0, 7);
  }, [allTrades]);

  /* ── Strategy summary ── */
  const strategySummary = useMemo(() => {
    const map = {};
    allClosedTrades.forEach(t => {
      const s = t.strategy || 'Other';
      if (!map[s]) map[s] = { pnl: 0, wins: 0, count: 0 };
      map[s].pnl += t.netPnl; map[s].count++;
      if (t.netPnl > 0) map[s].wins++;
    });
    return Object.entries(map)
      .map(([name, d]) => ({ name, pnl: d.pnl, wr: d.count ? Math.round((d.wins/d.count)*100) : 0 }))
      .sort((a, b) => b.pnl - a.pnl).slice(0, 4);
  }, [allClosedTrades]);

  /* ── Chart helpers ── */
  const onMove  = (s) => { if (s?.activePayload?.length) setHoveredData(s.activePayload[0].payload); };
  const onLeave = () => setHoveredData(null);
  const tickSt  = { fill: 'var(--text-secondary)', fontSize: 10, fontFamily: 'JetBrains Mono', fontWeight: '600' };
  const yFmt    = (v) => Math.abs(v) >= 1e6 ? `$${(v/1e6).toFixed(1)}M` : Math.abs(v) >= 1000 ? `$${(v/1000).toFixed(0)}k` : `$${v}`;
  const activeVal  = hoveredData !== null ? hoveredData.v : stats.totalNetPnl;
  const activeDate = hoveredData?.date ?? null;
  const isPos      = activeVal >= 0;
  const chartClr   = isPos ? 'var(--color-profit)' : 'var(--color-loss)';
  const absStr     = (v) => `$${Math.abs(v).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  /* ─────────────────────────────────────────────────── */
  return (
    <div className="fade-in" style={{ padding: '18px', display: 'flex', flexDirection: 'column', gap: 14 }}>

      {/* ══ ROW 1 — TWIN HERO CARDS ══ */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(270px, 1fr))', gap: 14 }}>

        {/* Gross P&L */}
        <div className="glass-panel" style={{ padding: '20px 22px', position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', background: `radial-gradient(ellipse at top left, ${isPos ? 'rgba(0,230,118,0.05)' : 'rgba(255,59,92,0.05)'} 0%, transparent 70%)` }} />
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: isPos ? 'var(--color-profit)' : 'var(--color-loss)', borderRadius: '14px 14px 0 0' }} />
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, marginBottom: 12 }}>
            <div style={{ minWidth: 0 }}>
              <div className="stat-label" style={{ marginBottom: 6 }}>
                {activeDate ?? 'All-Time Net Return'} <Tip text="Cumulative net P&L across all closed trades." />
              </div>
              <div className="stat-value" style={{ fontSize: 'clamp(22px, 4vw, 34px)', color: isPos ? 'var(--color-profit)' : 'var(--color-loss)' }}>
                {isPos ? '+' : '−'}{absStr(activeVal)}
              </div>
            </div>
            <div style={{ width: 40, height: 40, borderRadius: 10, background: isPos ? 'var(--bg-kpi-profit)' : 'var(--bg-kpi-loss)', border: `1px solid ${isPos ? 'var(--border-kpi-profit)' : 'var(--border-kpi-loss)'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              {isPos ? <ArrowUpRight size={18} style={{ color: 'var(--color-profit)' }} /> : <ArrowDownRight size={18} style={{ color: 'var(--color-loss)' }} />}
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, paddingTop: 10, borderTop: '1px solid var(--border-card)', flexWrap: 'wrap' }}>
            <span className={stats.totalNetPnl >= 0 ? 'badge-profit' : 'badge-loss'} style={{ fontSize: 9, padding: '3px 9px' }}>
              {formatPercent(stats.winRate)} WIN
            </span>
            <span className="stat-sub">{formatNumber(stats.totalTrades)} trades · PF {stats.profitFactor === Infinity ? '∞' : stats.profitFactor.toFixed(2)}</span>
          </div>
        </div>

        {/* After Tax */}
        <div className="glass-panel" style={{ padding: '20px 22px', position: 'relative', overflow: 'hidden', border: '1px solid var(--border-kpi-loss)' }}>
          <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', background: 'radial-gradient(ellipse at top right, rgba(255,59,92,0.06) 0%, transparent 70%)' }} />
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: 'var(--color-loss)', borderRadius: '14px 14px 0 0' }} />
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, marginBottom: 12 }}>
            <div style={{ minWidth: 0 }}>
              <div className="stat-label" style={{ marginBottom: 6 }}>
                After Tax (30% Rate) <Tip text="Estimated take-home after 30% capital gains tax. Consult a tax advisor." />
              </div>
              <div className="stat-value" style={{ fontSize: 'clamp(22px, 4vw, 34px)', color: stats.totalNetPnl > 0 ? 'var(--color-profit)' : 'var(--text-secondary)' }}>
                {afterTaxPnl >= 0 ? '+' : '−'}{absStr(afterTaxPnl)}
              </div>
            </div>
            <div style={{ width: 40, height: 40, borderRadius: 10, background: 'rgba(255,59,92,0.08)', border: '1px solid var(--border-kpi-loss)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <Receipt size={18} style={{ color: 'var(--color-loss)' }} />
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, paddingTop: 10, borderTop: '1px solid rgba(255,59,92,0.2)', flexWrap: 'wrap' }}>
            {[['Tax Owed', taxOwed > 0 ? `−${absStr(taxOwed)}` : '—', 'var(--color-loss)'],
              ['You Keep', '70%', 'var(--color-profit)'],
              ['Tax Rate', '30%', 'var(--color-loss)']].map(([l, v, c]) => (
              <div key={l}>
                <div className="stat-label" style={{ marginBottom: 3 }}>{l}</div>
                <div className="stat-value" style={{ fontSize: 13, color: c }}>{v}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ══ ROW 2 — KPI RIBBON ══ */}
      <div className="kpi-r">
        <style>{`.kpi-r{display:grid;grid-template-columns:repeat(2,1fr);gap:10px}@media(min-width:600px){.kpi-r{grid-template-columns:repeat(3,1fr)}}@media(min-width:1024px){.kpi-r{grid-template-columns:repeat(5,1fr)}}`}</style>
        <StatCard icon={<DollarSign size={10}/>} label="Net Return" tip="Total closed net P&L." value={formatCurrency(stats.totalNetPnl)} color={stats.totalNetPnl >= 0 ? 'var(--color-profit)' : 'var(--color-loss)'} bg={stats.totalNetPnl >= 0 ? 'var(--bg-kpi-profit)' : 'var(--bg-kpi-loss)'} border={stats.totalNetPnl >= 0 ? 'var(--border-kpi-profit)' : 'var(--border-kpi-loss)'} />
        <StatCard icon={<Percent size={10}/>}     label="Win Rate"    tip="% of closed trades that were profitable." value={formatPercent(stats.winRate)} color="var(--color-cyan)" bg="var(--bg-kpi-cyan)" border="var(--border-kpi-cyan)" />
        <StatCard icon={<TrendingUp size={10}/>}  label="Profit Factor" tip="Gross profits / gross losses. >1.5 is excellent." value={stats.profitFactor === Infinity ? '∞' : stats.profitFactor.toFixed(2)} color={stats.profitFactor >= 1 ? 'var(--color-profit)' : 'var(--color-loss)'} bg={stats.profitFactor >= 1 ? 'var(--bg-kpi-profit)' : 'var(--bg-kpi-loss)'} border={stats.profitFactor >= 1 ? 'var(--border-kpi-profit)' : 'var(--border-kpi-loss)'} />
        <StatCard icon={<Zap size={10}/>}         label="Best Day"    tip="Your single highest net profit day." value={bestDay ? formatCurrency(bestDay.netPnl) : '—'} sub={bestDay?.date} color="var(--color-profit)" bg="var(--bg-kpi-profit)" border="var(--border-kpi-profit)" />
        <StatCard icon={<Activity size={10}/>}    label="Worst Day"   tip="Your single largest net loss day." value={worstDay ? formatCurrency(worstDay.netPnl) : '—'} sub={worstDay?.date} color="var(--color-loss)" bg="var(--bg-kpi-loss)" border="var(--border-kpi-loss)" />
      </div>

      {/* ══ ROW 3 — GAMIFICATION BAND ══ */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 14 }}>
        <style>{`@media(min-width:900px){.game-row{grid-template-columns:1fr 320px!important}}`}</style>
        <div className="game-row" style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 14 }}>

          {/* Rank + XP card */}
          <div
            className="glass-panel"
            style={{
              padding: '20px 24px',
              position: 'relative',
              overflow: 'hidden',
              border: `1px solid ${rank.color}44`,
              boxShadow: `0 0 28px ${rank.glow}`,
            }}
          >
            {/* Background radial glow */}
            <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', background: `radial-gradient(ellipse at 20% 50%, ${rank.glow} 0%, transparent 65%)` }} />
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: rank.color, borderRadius: '14px 14px 0 0' }} />

            <div style={{ display: 'flex', alignItems: 'center', gap: 18, flexWrap: 'wrap' }}>

              {/* Icon + Rank */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 14, flexShrink: 0 }}>
                <div style={{ fontSize: 36, lineHeight: 1, filter: `drop-shadow(0 0 8px ${rank.color}88)` }}>{rank.icon}</div>
                <div>
                  <div className="stat-label" style={{ marginBottom: 4 }}>Trader Rank</div>
                  <div style={{ fontSize: 22, fontWeight: 900, fontFamily: "'Outfit', sans-serif", color: rank.color, letterSpacing: '0.06em', textTransform: 'uppercase', lineHeight: 1 }}>
                    {rank.rank}
                  </div>
                  <div className="stat-sub" style={{ marginTop: 3 }}>Tier {rank.tier} of 5</div>
                </div>
              </div>

              {/* Divider */}
              <div style={{ width: 1, height: 52, background: 'var(--border-card)', flexShrink: 0 }} className="hidden sm:block" />

              {/* XP bar */}
              <div style={{ flex: 1, minWidth: 180 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                  <div className="stat-label">XP Progress</div>
                  <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, fontWeight: 700, color: rank.color }}>
                    {xp.toLocaleString()} / {rank.xpTarget === 999999 ? '∞' : rank.xpTarget.toLocaleString()} XP
                  </span>
                </div>
                <div style={{ height: 10, borderRadius: 9999, background: 'var(--border-card)', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.05)' }}>
                  <div
                    className="xp-bar-fill"
                    style={{
                      height: '100%',
                      width: `${xpPct}%`,
                      background: `linear-gradient(90deg, ${rank.color}88, ${rank.color}, ${rank.color}cc)`,
                      transition: 'width 1s cubic-bezier(0.16,1,0.3,1)',
                    }}
                  />
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 5 }}>
                  <span className="stat-sub">{xpPct}% to next rank</span>
                  {rank.tier < 5 && <span className="stat-sub">Next: {['ROOKIE','TRADER','PRO','ELITE','LEGEND'][rank.tier]}</span>}
                </div>
              </div>

              {/* Divider */}
              <div style={{ width: 1, height: 52, background: 'var(--border-card)', flexShrink: 0 }} className="hidden sm:block" />

              {/* Streak */}
              <div style={{ flexShrink: 0, textAlign: 'center' }}>
                <div className="stat-label" style={{ marginBottom: 4, justifyContent: 'center' }}>Win Streak</div>
                {streak > 0 ? (
                  <>
                    <div className="streak-fire" style={{ fontSize: 28, fontWeight: 900, fontFamily: "'JetBrains Mono', monospace", lineHeight: 1 }}>
                      🔥 {streak}
                    </div>
                    <div className="stat-sub" style={{ textAlign: 'center', marginTop: 4 }}>days straight</div>
                  </>
                ) : (
                  <>
                    <div style={{ fontSize: 24, lineHeight: 1, opacity: 0.3 }}>💤</div>
                    <div className="stat-sub" style={{ textAlign: 'center', marginTop: 4 }}>No streak</div>
                  </>
                )}
              </div>

            </div>
          </div>

          {/* Achievements card */}
          <div className="glass-panel" style={{ padding: '20px 22px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14, paddingBottom: 10, borderBottom: '1px solid var(--border-card)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                <Trophy size={13} style={{ color: '#facc15' }} />
                <span className="stat-label" style={{ fontSize: 11 }}>Achievements</span>
              </div>
              <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, fontWeight: 700, color: 'var(--color-profit)' }}>
                {unlocked} / {achievements.length}
              </span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
              {achievements.map((a, i) => (
                <div
                  key={a.id}
                  title={a.unlocked ? `${a.name}: ${a.desc}` : `🔒 Locked — ${a.desc}`}
                  className={a.unlocked ? 'achievement-badge' : 'achievement-badge-locked'}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: 4,
                    padding: '8px 4px',
                    borderRadius: 8,
                    background: a.unlocked ? 'rgba(0,200,5,0.08)' : 'var(--bg-input)',
                    border: `1px solid ${a.unlocked ? 'rgba(0,200,5,0.3)' : 'var(--border-card)'}`,
                    cursor: 'default',
                    animationDelay: `${i * 0.06}s`,
                    boxShadow: a.unlocked ? '0 0 12px rgba(0,200,5,0.12)' : 'none',
                  }}
                >
                  <span style={{ fontSize: 18, lineHeight: 1 }}>{a.unlocked ? a.icon : '🔒'}</span>
                  <span style={{ fontSize: 8, fontWeight: 700, textAlign: 'center', textTransform: 'uppercase', letterSpacing: '0.05em', color: a.unlocked ? 'var(--color-profit)' : 'var(--text-secondary)', fontFamily: "'Plus Jakarta Sans', sans-serif", lineHeight: 1.2 }}>
                    {a.name}
                  </span>
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>

      {/* ══ ROW 4 — EQUITY CURVE ══ */}
      <div className="glass-panel" style={{ padding: '18px 22px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14, paddingBottom: 10, borderBottom: '1px solid var(--border-card)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <TrendingUp size={13} style={{ color: 'var(--text-accent)' }} />
            <span className="stat-label" style={{ fontSize: 11, color: 'var(--text-dark)' }}>
              Portfolio Equity Curve <Tip text="Cumulative closed P&L plotted over time. Hover to inspect dates." />
            </span>
          </div>
          <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, fontWeight: 700, padding: '3px 10px', borderRadius: 6, background: 'var(--bg-kpi-cyan)', color: 'var(--color-cyan)', border: '1px solid var(--border-kpi-cyan)' }}>
            {equityCurveData.length > 1 ? `${equityCurveData.length - 1} days` : 'No data'}
          </span>
        </div>
        <div style={{ height: 190 }}>
          {equityCurveData.length === 0 ? (
            <div className="stat-label" style={{ height: '100%', justifyContent: 'center', display: 'flex', alignItems: 'center' }}>
              Log trades to build your equity curve
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={equityCurveData} margin={{ top: 6, right: 12, left: 4, bottom: 0 }} onMouseMove={onMove} onMouseLeave={onLeave}>
                <defs>
                  <linearGradient id="eqG" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor={chartClr} stopOpacity={0.22} />
                    <stop offset="95%" stopColor={chartClr} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="date" tick={tickSt} axisLine={false} tickLine={false} minTickGap={70} />
                <YAxis tick={tickSt} axisLine={false} tickLine={false} tickFormatter={yFmt} width={54} />
                <ReferenceLine y={0} stroke="var(--border-card)" strokeDasharray="4 3" />
                <Tooltip cursor={false} content={() => null} />
                <Area type="monotone" dataKey="v" stroke={chartClr} strokeWidth={2.5} fill="url(#eqG)" dot={false}
                  activeDot={{ fill: chartClr, r: 5, strokeWidth: 2, stroke: 'var(--bg-card)' }} />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* ══ ROW 5 — HEATMAP + SIDEBAR ══ */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 14 }}>
        <style>{`@media(min-width:1024px){.bottom-row{grid-template-columns:1fr 290px!important}}`}</style>
        <div className="bottom-row" style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 14 }}>

          {/* Heatmap */}
          <div className="glass-panel" style={{ padding: '18px 22px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12, paddingBottom: 10, borderBottom: '1px solid var(--border-card)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                <Calendar size={13} style={{ color: 'var(--text-accent)' }} />
                <span className="stat-label" style={{ fontSize: 11, color: 'var(--text-dark)' }}>
                  Session Heatmap <Tip text="154-day calendar. Green = profit, Red = loss. Click any cell to open that day's journal." />
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 9, fontWeight: 700, color: 'var(--text-secondary)', fontFamily: "'JetBrains Mono', monospace" }}>
                <span style={{ color: 'var(--color-loss)' }}>Loss</span>
                {['var(--color-loss)','rgba(255,59,92,0.45)','var(--heatmap-empty)','rgba(0,200,5,0.45)','var(--color-profit)'].map((bg, i) => (
                  <div key={i} style={{ width: 10, height: 10, borderRadius: 2, background: bg }} />
                ))}
                <span style={{ color: 'var(--color-profit)' }}>Profit</span>
              </div>
            </div>
            <div style={{ overflowX: 'auto', paddingBottom: 4 }}>
              <div style={{ display: 'flex', gap: 6, minWidth: 340 }}>
                <div style={{ display: 'grid', gridTemplateRows: 'repeat(7, 13px)', gap: '3.5px', fontSize: 9, fontWeight: 700, color: 'var(--text-secondary)', fontFamily: "'JetBrains Mono', monospace", paddingTop: 1, paddingRight: 4, flexShrink: 0, lineHeight: '13px' }}>
                  {['S','M','T','W','T','F','S'].map((d, i) => <span key={i}>{d}</span>)}
                </div>
                <div style={{ display: 'grid', gridTemplateRows: 'repeat(7, 13px)', gridAutoFlow: 'column', gap: '3.5px', flex: 1 }}>
                  {heatmapDays.map(day => (
                    <button
                      key={day.date}
                      onClick={() => { onSelectDate(day.date); onNavigateTab('journal'); }}
                      title={day.tradesCount ? `${day.date} — ${formatCurrency(day.netPnl)} (${day.tradesCount} trades)` : `${day.date} — No activity`}
                      className="heatmap-cell focus:outline-none"
                      style={{ width: 13, height: 13, background: cellColor(day), boxShadow: day.isToday ? '0 0 0 1.5px var(--border-active)' : 'none', borderRadius: 2, border: 'none', cursor: 'pointer', transition: 'transform 0.1s, opacity 0.1s' }}
                      onMouseEnter={e => { e.currentTarget.style.transform = 'scale(1.5)'; e.currentTarget.style.zIndex = 10; }}
                      onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.zIndex = 'auto'; }}
                    />
                  ))}
                </div>
              </div>
            </div>
            <p className="stat-sub" style={{ textAlign: 'center', marginTop: 10, fontStyle: 'italic' }}>
              ↑ Click any cell to open that day's journal
            </p>
          </div>

          {/* Right sidebar: strategies + recent trades */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>

            {/* Strategies */}
            <div className="glass-panel" style={{ padding: '16px 18px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10, paddingBottom: 8, borderBottom: '1px solid var(--border-card)' }}>
                <Award size={12} style={{ color: 'var(--text-accent)' }} />
                <span className="stat-label" style={{ fontSize: 10, color: 'var(--text-dark)' }}>Top Strategies</span>
              </div>
              {strategySummary.length === 0 ? (
                <p className="stat-sub" style={{ textAlign: 'center', padding: '10px 0' }}>No data yet</p>
              ) : strategySummary.map((s, i) => (
                <div key={s.name} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '7px 10px', borderRadius: 7, background: 'var(--bg-input)', border: '1px solid var(--border-card)', marginBottom: 6 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{ fontSize: 9, fontWeight: 700, fontFamily: "'JetBrains Mono', monospace", color: 'var(--text-secondary)' }}>#{i+1}</span>
                    <span style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', fontFamily: "'JetBrains Mono', monospace", color: 'var(--text-dark)' }}>{s.name}</span>
                    <span className="stat-sub" style={{ fontSize: 9 }}>{s.wr}%W</span>
                  </div>
                  <span style={{ fontSize: 10, fontWeight: 700, fontFamily: "'JetBrains Mono', monospace", color: s.pnl >= 0 ? 'var(--color-profit)' : 'var(--color-loss)' }}>
                    {formatCurrency(s.pnl)}
                  </span>
                </div>
              ))}
            </div>

            {/* Recent Trades */}
            <div className="glass-panel" style={{ padding: '16px 18px', flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10, paddingBottom: 8, borderBottom: '1px solid var(--border-card)' }}>
                <Layers size={12} style={{ color: 'var(--text-accent)' }} />
                <span className="stat-label" style={{ fontSize: 10, color: 'var(--text-dark)' }}>Recent Trades</span>
              </div>
              {recentTrades.map(t => (
                <div key={t.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '5px 7px', borderRadius: 6, background: 'var(--bg-input)', marginBottom: 5 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 5, minWidth: 0 }}>
                    <span style={{ fontSize: 10, fontWeight: 700, fontFamily: "'JetBrains Mono', monospace", color: 'var(--text-accent)', flexShrink: 0 }}>{t.ticker}</span>
                    <span style={{ fontSize: 10, fontWeight: 800, color: t.direction === 'Long' ? 'var(--color-profit)' : 'var(--color-loss)', flexShrink: 0 }}>
                      {t.direction === 'Long' ? '↗' : '↘'}
                    </span>
                    <span className="stat-sub" style={{ fontSize: 9, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {t.time?.substring(0,5)} · {t.date?.substring(5)}
                    </span>
                  </div>
                  {t.isOpen
                    ? <span className="badge-open" style={{ fontSize: 8, padding: '2px 6px' }}>OPEN</span>
                    : t.netPnl >= 0
                    ? <span className="badge-profit" style={{ fontSize: 8, padding: '2px 6px', fontFamily: "'JetBrains Mono', monospace" }}>{formatCurrency(t.netPnl)}</span>
                    : <span className="badge-loss"   style={{ fontSize: 8, padding: '2px 6px', fontFamily: "'JetBrains Mono', monospace" }}>{formatCurrency(t.netPnl)}</span>
                  }
                </div>
              ))}
              <button onClick={() => onNavigateTab('trades')} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4, width: '100%', marginTop: 8, paddingTop: 8, borderTop: '1px solid var(--border-card)', fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text-accent)', background: 'none', border: 'none', cursor: 'pointer' }}>
                View All Trades <ChevronRight size={10} />
              </button>
            </div>
          </div>
        </div>
      </div>

    </div>
  );
}
