import { useState, useMemo } from 'react';
import { Target, DollarSign, TrendingUp, Check, Save, BarChart3, ArrowUpRight, ArrowDownRight, Wallet } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, BarChart, Bar, Cell, CartesianGrid } from 'recharts';
import { formatCurrency } from '../utils/calculations';

/* ─────────────────────────────────────────────────
   Shared tooltip style used by both charts
   ───────────────────────────────────────────────── */
const tooltipStyle = {
  contentStyle: {
    backgroundColor: 'var(--bg-card)',
    borderColor: 'var(--border-card)',
    borderRadius: 14,
    padding: '14px 18px',
    boxShadow: '0 12px 40px rgba(0,0,0,0.12)',
    fontFamily: "'Inter', sans-serif",
  },
  itemStyle: { color: 'var(--text-primary)', fontWeight: '800', fontSize: '15px', fontFamily: "'JetBrains Mono', monospace" },
  labelStyle: { color: 'var(--text-secondary)', marginBottom: '6px', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '1.5px', fontWeight: 'bold' },
};

/* ─────────────────────────────────────────────────
   Summary stat card — mirrors Dashboard's style
   ───────────────────────────────────────────────── */
const SummaryCard = ({ icon, label, value, valueColor, sub }) => (
  <div
    style={{
      background: 'var(--bg-card)',
      border: '1px solid var(--border-card)',
      borderRadius: 16,
      padding: '22px 24px',
      display: 'flex',
      flexDirection: 'column',
      gap: 8,
    }}
  >
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--text-secondary)', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
      {icon}
      <span>{label}</span>
    </div>
    <div style={{ fontSize: 22, fontWeight: 900, color: valueColor || 'var(--text-primary)', fontFamily: "'JetBrains Mono', monospace", lineHeight: 1.2 }}>
      {value}
    </div>
    {sub && <div style={{ fontSize: 11, color: 'var(--text-secondary)', fontWeight: 500 }}>{sub}</div>}
  </div>
);

export default function CapitalView({ allTrades, allJournals, onSaveJournal, settings, onSaveSettings }) {
  const [weeklyTarget, setWeeklyTarget] = useState(settings.weeklyTarget || '');
  const [biWeeklyTarget, setBiWeeklyTarget] = useState(settings.biWeeklyTarget || '');
  const [monthlyTarget, setMonthlyTarget] = useState(settings.monthlyTarget || '');

  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [balanceInput, setBalanceInput] = useState(
    allJournals[selectedDate]?.accountBalance || ''
  );
  const [saveStatus, setSaveStatus] = useState(null);

  const handleDateChange = (e) => {
    const d = e.target.value;
    setSelectedDate(d);
    setBalanceInput(allJournals[d]?.accountBalance || '');
  };

  const handleSaveBalance = () => {
    const parsed = parseFloat(balanceInput);
    const valueToSave = isNaN(parsed) ? null : parsed;
    const existingEntry = allJournals[selectedDate] || {};
    onSaveJournal(selectedDate, { ...existingEntry, accountBalance: valueToSave });
    setSaveStatus('balance');
    setTimeout(() => setSaveStatus(null), 2000);
  };

  const handleSaveTargets = () => {
    onSaveSettings({
      ...settings,
      weeklyTarget: parseFloat(weeklyTarget) || 0,
      biWeeklyTarget: parseFloat(biWeeklyTarget) || 0,
      monthlyTarget: parseFloat(monthlyTarget) || 0,
    });
    setSaveStatus('targets');
    setTimeout(() => setSaveStatus(null), 2000);
  };

  /* ── Computed data ── */
  const { currentWeekPnl, currentMonthPnl } = useMemo(() => {
    const now = new Date();
    const day = now.getDay() || 7;
    const startOfWeek = new Date(now);
    startOfWeek.setHours(0, 0, 0, 0);
    startOfWeek.setDate(now.getDate() - day + 1);
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    let weekPnl = 0;
    let monthPnl = 0;
    Object.values(allTrades).flat().forEach(trade => {
      if (!trade || trade.isOpen || !trade.netPnl) return;
      const tradeDate = new Date(trade.date);
      if (tradeDate >= startOfWeek) weekPnl += trade.netPnl;
      if (tradeDate >= startOfMonth) monthPnl += trade.netPnl;
    });
    return { currentWeekPnl: weekPnl, currentMonthPnl: monthPnl };
  }, [allTrades]);

  const history = useMemo(() => {
    return Object.keys(allJournals)
      .filter(date => allJournals[date].accountBalance != null)
      .map(date => ({
        date: date.substring(5), // "MM-DD" for shorter axis labels
        fullDate: date,
        balance: allJournals[date].accountBalance,
      }))
      .sort((a, b) => new Date(a.fullDate) - new Date(b.fullDate));
  }, [allJournals]);

  const latestBalance = history.length > 0 ? history[history.length - 1].balance : null;
  const firstBalance = history.length > 1 ? history[0].balance : null;
  const totalGrowth = latestBalance && firstBalance ? latestBalance - firstBalance : null;

  const weeklyData = useMemo(() => {
    const data = [];
    const now = new Date();
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - (i * 7));
      const dow = d.getDay() || 7;
      const startOfWeek = new Date(d);
      startOfWeek.setHours(0, 0, 0, 0);
      startOfWeek.setDate(d.getDate() - dow + 1);
      const endOfWeek = new Date(startOfWeek);
      endOfWeek.setDate(endOfWeek.getDate() + 6);
      endOfWeek.setHours(23, 59, 59, 999);

      let pnl = 0;
      Object.values(allTrades).flat().forEach(t => {
        if (!t || t.isOpen || !t.netPnl) return;
        const td = new Date(t.date);
        if (td >= startOfWeek && td <= endOfWeek) pnl += t.netPnl;
      });

      const label = `${startOfWeek.getMonth() + 1}/${startOfWeek.getDate()}`;
      data.push({ weekLabel: i === 0 ? 'This Wk' : label, pnl });
    }
    return data;
  }, [allTrades]);

  const weeklyProgress = weeklyTarget > 0 ? Math.max(0, Math.min(100, (currentWeekPnl / weeklyTarget) * 100)) : 0;
  const monthlyProgress = monthlyTarget > 0 ? Math.max(0, Math.min(100, (currentMonthPnl / monthlyTarget) * 100)) : 0;

  return (
    <div className="h-full w-full fade-in overflow-y-auto" style={{ fontFamily: "'Inter', sans-serif" }}>
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '28px 24px 48px', display: 'flex', flexDirection: 'column', gap: 28 }}>

        {/* ══════════════════════════════════════════════
            PAGE HEADER
            ══════════════════════════════════════════════ */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{ width: 48, height: 48, borderRadius: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-card)', border: '1px solid var(--border-active)', flexShrink: 0 }}>
            <Target size={24} style={{ color: 'var(--text-accent)' }} />
          </div>
          <div>
            <h1 style={{ fontSize: 26, fontWeight: 900, color: 'var(--text-dark)', letterSpacing: '-0.02em', margin: 0, lineHeight: 1.2 }}>Capital & Targets</h1>
            <p style={{ fontSize: 13, color: 'var(--text-secondary)', margin: '4px 0 0', fontWeight: 500 }}>Equity curve, weekly performance & profit objectives.</p>
          </div>
        </div>

        {/* ══════════════════════════════════════════════
            SUMMARY STATS — 4 cards (inspired by Dashboard KPIs)
            ══════════════════════════════════════════════ */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16 }}>
          <SummaryCard
            icon={<Wallet size={14} />}
            label="Account Balance"
            value={latestBalance != null ? formatCurrency(latestBalance) : '—'}
            valueColor="var(--text-primary)"
            sub={latestBalance != null ? `as of ${history[history.length - 1].fullDate}` : 'No data yet'}
          />
          <SummaryCard
            icon={<TrendingUp size={14} />}
            label="Total Growth"
            value={totalGrowth != null ? formatCurrency(totalGrowth) : '—'}
            valueColor={totalGrowth >= 0 ? 'var(--color-profit)' : 'var(--color-loss)'}
            sub={totalGrowth != null ? `from ${history[0].fullDate}` : 'Need 2+ entries'}
          />
          <SummaryCard
            icon={currentWeekPnl >= 0 ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
            label="This Week P&L"
            value={formatCurrency(currentWeekPnl)}
            valueColor={currentWeekPnl >= 0 ? 'var(--color-profit)' : 'var(--color-loss)'}
          />
          <SummaryCard
            icon={currentMonthPnl >= 0 ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
            label="This Month P&L"
            value={formatCurrency(currentMonthPnl)}
            valueColor={currentMonthPnl >= 0 ? 'var(--color-profit)' : 'var(--color-loss)'}
          />
        </div>

        {/* ══════════════════════════════════════════════
            CHARTS — side by side
            ══════════════════════════════════════════════ */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(380px, 1fr))', gap: 20 }}>

          {/* Equity Curve */}
          <div className="glass-panel" style={{ borderRadius: 16, padding: '24px 24px 16px', display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
              <TrendingUp size={18} style={{ color: 'var(--text-accent)' }} />
              <span style={{ fontSize: 15, fontWeight: 800, color: 'var(--text-dark)', letterSpacing: '-0.01em' }}>Capital Growth</span>
            </div>
            <p style={{ fontSize: 11, color: 'var(--text-secondary)', margin: '0 0 20px', fontWeight: 500 }}>Historical account balance trajectory.</p>

            <div style={{ height: 260, width: '100%' }}>
              {history.length === 0 ? (
                <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-secondary)', fontSize: 13, fontWeight: 500, background: 'var(--bg-sidebar)', borderRadius: 12, border: '1px dashed var(--border-card)' }}>
                  Log your first balance below to see the graph.
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={history} margin={{ top: 5, right: 5, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorBalance" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="var(--text-accent)" stopOpacity={0.35} />
                        <stop offset="95%" stopColor="var(--text-accent)" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border-card)" vertical={false} />
                    <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fill: 'var(--text-secondary)', fontSize: 10, fontWeight: 600 }} dy={12} />
                    <YAxis hide domain={['auto', 'auto']} />
                    <Tooltip {...tooltipStyle} formatter={(value) => [formatCurrency(value), 'Balance']} />
                    <Area type="monotone" dataKey="balance" stroke="var(--text-accent)" strokeWidth={3} fillOpacity={1} fill="url(#colorBalance)" dot={history.length < 20 ? { r: 3, fill: 'var(--text-accent)', strokeWidth: 0 } : false} activeDot={{ r: 5, fill: 'var(--text-accent)', stroke: 'var(--bg-card)', strokeWidth: 2 }} />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          {/* Weekly Bar Chart */}
          <div className="glass-panel" style={{ borderRadius: 16, padding: '24px 24px 16px', display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
              <BarChart3 size={18} style={{ color: 'var(--text-accent)' }} />
              <span style={{ fontSize: 15, fontWeight: 800, color: 'var(--text-dark)', letterSpacing: '-0.01em' }}>Weekly Performance</span>
            </div>
            <p style={{ fontSize: 11, color: 'var(--text-secondary)', margin: '0 0 20px', fontWeight: 500 }}>Net P&L by week (last 6 weeks).</p>

            <div style={{ height: 260, width: '100%' }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={weeklyData} margin={{ top: 5, right: 5, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border-card)" vertical={false} />
                  <XAxis dataKey="weekLabel" axisLine={false} tickLine={false} tick={{ fill: 'var(--text-secondary)', fontSize: 10, fontWeight: 600 }} dy={12} />
                  <YAxis hide domain={['auto', 'auto']} />
                  <Tooltip {...tooltipStyle} cursor={{ fill: 'var(--bg-sidebar)', opacity: 0.4, radius: 6 }} formatter={(value) => [formatCurrency(value), 'Net P&L']} />
                  <Bar dataKey="pnl" radius={[8, 8, 8, 8]} barSize={32}>
                    {weeklyData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.pnl >= 0 ? 'var(--color-profit)' : 'var(--color-loss)'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* ══════════════════════════════════════════════
            PROFIT TARGETS
            ══════════════════════════════════════════════ */}
        <div className="glass-panel" style={{ borderRadius: 16, padding: '28px 28px 24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <Target size={18} style={{ color: 'var(--text-accent)' }} />
              <span style={{ fontSize: 15, fontWeight: 800, color: 'var(--text-dark)', letterSpacing: '-0.01em' }}>Profit Targets</span>
            </div>
            <button
              onClick={handleSaveTargets}
              style={{
                display: 'flex', alignItems: 'center', gap: 8, padding: '8px 20px', borderRadius: 10,
                fontSize: 11, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.06em', cursor: 'pointer',
                background: saveStatus === 'targets' ? 'var(--color-profit)' : 'var(--bg-card)',
                color: saveStatus === 'targets' ? '#fff' : 'var(--text-primary)',
                border: saveStatus === 'targets' ? 'none' : '1px solid var(--border-card)',
                transition: 'all 0.2s',
              }}
            >
              {saveStatus === 'targets' ? <><Check size={14} /> Saved</> : <><Save size={14} /> Save Targets</>}
            </button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 20 }}>
            {/* Weekly Target Card */}
            <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-card)', borderRadius: 14, padding: '24px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
                <span style={{ fontSize: 14, fontWeight: 800, color: 'var(--text-primary)' }}>Weekly Target</span>
                <span style={{ fontSize: 12, fontWeight: 700, color: currentWeekPnl >= 0 ? 'var(--color-profit)' : 'var(--color-loss)', fontFamily: "'JetBrains Mono', monospace" }}>
                  {formatCurrency(currentWeekPnl)}
                </span>
              </div>
              <div style={{ position: 'relative', marginBottom: 18 }}>
                <DollarSign size={16} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
                <input
                  type="number"
                  value={weeklyTarget}
                  onChange={(e) => setWeeklyTarget(e.target.value)}
                  placeholder="e.g. 2500"
                  style={{ width: '100%', background: 'var(--bg-input)', border: '1px solid var(--border-input)', borderRadius: 10, padding: '12px 16px 12px 40px', color: 'var(--text-primary)', fontFamily: "'JetBrains Mono', monospace", fontWeight: 700, fontSize: 14, outline: 'none', boxSizing: 'border-box' }}
                />
              </div>
              <div style={{ height: 8, width: '100%', background: 'var(--bg-input)', borderRadius: 6, overflow: 'hidden' }}>
                <div style={{ height: '100%', background: 'var(--color-profit)', borderRadius: 6, width: `${weeklyProgress}%`, transition: 'width 1s ease-out' }} />
              </div>
              {weeklyTarget > 0 && <div style={{ fontSize: 10, color: 'var(--text-secondary)', marginTop: 8, fontWeight: 600 }}>{Math.round(weeklyProgress)}% of target reached</div>}
            </div>

            {/* Bi-Weekly Target Card */}
            <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-card)', borderRadius: 14, padding: '24px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
                <span style={{ fontSize: 14, fontWeight: 800, color: 'var(--text-primary)' }}>Bi-Weekly Target</span>
              </div>
              <div style={{ position: 'relative', marginBottom: 18 }}>
                <DollarSign size={16} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
                <input
                  type="number"
                  value={biWeeklyTarget}
                  onChange={(e) => setBiWeeklyTarget(e.target.value)}
                  placeholder="e.g. 5000"
                  style={{ width: '100%', background: 'var(--bg-input)', border: '1px solid var(--border-input)', borderRadius: 10, padding: '12px 16px 12px 40px', color: 'var(--text-primary)', fontFamily: "'JetBrains Mono', monospace", fontWeight: 700, fontSize: 14, outline: 'none', boxSizing: 'border-box' }}
                />
              </div>
            </div>

            {/* Monthly Target Card */}
            <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-card)', borderRadius: 14, padding: '24px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
                <span style={{ fontSize: 14, fontWeight: 800, color: 'var(--text-primary)' }}>Monthly Target</span>
                <span style={{ fontSize: 12, fontWeight: 700, color: currentMonthPnl >= 0 ? 'var(--color-profit)' : 'var(--color-loss)', fontFamily: "'JetBrains Mono', monospace" }}>
                  {formatCurrency(currentMonthPnl)}
                </span>
              </div>
              <div style={{ position: 'relative', marginBottom: 18 }}>
                <DollarSign size={16} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
                <input
                  type="number"
                  value={monthlyTarget}
                  onChange={(e) => setMonthlyTarget(e.target.value)}
                  placeholder="e.g. 10000"
                  style={{ width: '100%', background: 'var(--bg-input)', border: '1px solid var(--border-input)', borderRadius: 10, padding: '12px 16px 12px 40px', color: 'var(--text-primary)', fontFamily: "'JetBrains Mono', monospace", fontWeight: 700, fontSize: 14, outline: 'none', boxSizing: 'border-box' }}
                />
              </div>
              <div style={{ height: 8, width: '100%', background: 'var(--bg-input)', borderRadius: 6, overflow: 'hidden' }}>
                <div style={{ height: '100%', background: 'var(--text-accent)', borderRadius: 6, width: `${monthlyProgress}%`, transition: 'width 1s ease-out' }} />
              </div>
              {monthlyTarget > 0 && <div style={{ fontSize: 10, color: 'var(--text-secondary)', marginTop: 8, fontWeight: 600 }}>{Math.round(monthlyProgress)}% of target reached</div>}
            </div>
          </div>
        </div>

        {/* ══════════════════════════════════════════════
            BALANCE LOGGER
            ══════════════════════════════════════════════ */}
        <div className="glass-panel" style={{ borderRadius: 16, padding: '28px 28px 24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
            <DollarSign size={18} style={{ color: 'var(--text-accent)' }} />
            <span style={{ fontSize: 15, fontWeight: 800, color: 'var(--text-dark)', letterSpacing: '-0.01em' }}>Log Capital Balance</span>
          </div>
          <p style={{ fontSize: 11, color: 'var(--text-secondary)', margin: '0 0 22px', fontWeight: 500 }}>
            Manually record your broker account balance. This does not affect trade P&L.
          </p>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16, alignItems: 'flex-end' }}>
            <div style={{ flex: '1 1 200px', minWidth: 0 }}>
              <label style={{ display: 'block', fontSize: 10, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text-secondary)', marginBottom: 8 }}>Date</label>
              <input
                type="date"
                value={selectedDate}
                onChange={handleDateChange}
                style={{ width: '100%', background: 'var(--bg-input)', border: '1px solid var(--border-input)', borderRadius: 10, padding: '13px 16px', color: 'var(--text-primary)', fontFamily: "'JetBrains Mono', monospace", fontSize: 13, fontWeight: 600, outline: 'none', boxSizing: 'border-box' }}
              />
            </div>
            <div style={{ flex: '1 1 240px', minWidth: 0 }}>
              <label style={{ display: 'block', fontSize: 10, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text-secondary)', marginBottom: 8 }}>Account Balance</label>
              <div style={{ position: 'relative' }}>
                <DollarSign size={16} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
                <input
                  type="number"
                  value={balanceInput}
                  onChange={(e) => setBalanceInput(e.target.value)}
                  placeholder="e.g. 150000"
                  style={{ width: '100%', background: 'var(--bg-input)', border: '1px solid var(--border-input)', borderRadius: 10, padding: '13px 16px 13px 40px', color: 'var(--text-primary)', fontFamily: "'JetBrains Mono', monospace", fontSize: 13, fontWeight: 600, outline: 'none', boxSizing: 'border-box' }}
                />
              </div>
            </div>
            <button
              onClick={handleSaveBalance}
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                padding: '13px 28px', borderRadius: 10,
                fontSize: 11, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.06em', cursor: 'pointer',
                background: saveStatus === 'balance' ? 'var(--color-profit)' : 'var(--border-active)',
                color: saveStatus === 'balance' ? '#fff' : 'var(--bg-app)',
                border: 'none', transition: 'all 0.2s', whiteSpace: 'nowrap',
                flex: '0 0 auto',
              }}
            >
              {saveStatus === 'balance' ? '✓ SAVED' : 'PLOT ON GRAPH'}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
