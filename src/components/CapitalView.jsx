import { useState, useMemo } from 'react';
import { Target, DollarSign, TrendingUp, Calendar, Check, Save } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { formatCurrency } from '../utils/calculations';

export default function CapitalView({ allTrades, allJournals, onSaveJournal, settings, onSaveSettings }) {
  const [weeklyTarget, setWeeklyTarget] = useState(settings.weeklyTarget || 0);
  const [biWeeklyTarget, setBiWeeklyTarget] = useState(settings.biWeeklyTarget || 0);
  const [monthlyTarget, setMonthlyTarget] = useState(settings.monthlyTarget || 0);

  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [balanceInput, setBalanceInput] = useState(
    allJournals[selectedDate]?.accountBalance || ''
  );
  const [saveStatus, setSaveStatus] = useState(null);

  // Handle changing the date for the manual balance
  const handleDateChange = (e) => {
    const d = e.target.value;
    setSelectedDate(d);
    setBalanceInput(allJournals[d]?.accountBalance || '');
  };

  // Save the manual balance to the journals object
  const handleSaveBalance = () => {
    const parsed = parseFloat(balanceInput);
    const valueToSave = isNaN(parsed) ? null : parsed;
    
    // Merge the existing journal entry for this date with the new accountBalance
    const existingEntry = allJournals[selectedDate] || {};
    onSaveJournal(selectedDate, { ...existingEntry, accountBalance: valueToSave });
    
    setSaveStatus('balance');
    setTimeout(() => setSaveStatus(null), 2000);
  };

  // Save targets to settings
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

  // Calculate actual PnL for the time periods to compare against targets
  const { currentWeekPnl, currentMonthPnl } = useMemo(() => {
    const now = new Date();
    
    // Get start of current week (Monday)
    const day = now.getDay() || 7; // Convert Sunday (0) to 7
    const startOfWeek = new Date(now);
    startOfWeek.setHours(0, 0, 0, 0);
    startOfWeek.setDate(now.getDate() - day + 1);
    
    // Get start of current month
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

  // Extract all historical balances for the chart
  const history = useMemo(() => {
    const entries = Object.keys(allJournals)
      .filter(date => allJournals[date].accountBalance != null)
      .map(date => ({
        date,
        balance: allJournals[date].accountBalance
      }))
      .sort((a, b) => new Date(a.date) - new Date(b.date)); // Oldest first for chart
    return entries;
  }, [allJournals]);

  const weeklyProgress = weeklyTarget > 0 ? Math.max(0, Math.min(100, (currentWeekPnl / weeklyTarget) * 100)) : 0;
  const monthlyProgress = monthlyTarget > 0 ? Math.max(0, Math.min(100, (currentMonthPnl / monthlyTarget) * 100)) : 0;

  return (
    <div className="h-full w-full fade-in p-4 md:p-6 overflow-y-auto" style={{ fontFamily: "'Inter', sans-serif" }}>
      <div style={{ maxWidth: '1000px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '24px' }}>
        
        {/* Header */}
        <div className="glass-panel flex items-center gap-4 p-6" style={{ borderRadius: 14 }}>
          <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ background: 'var(--accent-glow)', border: '1px solid var(--border-active)' }}>
            <Target size={24} style={{ color: 'var(--text-accent)' }} />
          </div>
          <div>
            <h1 className="text-2xl font-extrabold tracking-tight text-[var(--text-dark)]">Capital & Targets</h1>
            <p className="text-sm text-[var(--text-secondary)] mt-1">Track manual account balances and set profit goals</p>
          </div>
        </div>

        {/* ── Targets Section ── */}
        <div className="glass-panel p-6" style={{ borderRadius: 14 }}>
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <TrendingUp size={20} className="text-[var(--text-accent)]" />
              <h2 className="text-lg font-bold text-[var(--text-dark)]">Profit Targets</h2>
            </div>
            <button
              onClick={handleSaveTargets}
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all cursor-pointer"
              style={{
                background: saveStatus === 'targets' ? 'var(--color-profit)' : 'var(--border-active)',
                color: 'var(--bg-app)',
                border: 'none'
              }}
            >
              {saveStatus === 'targets' ? <><Check size={14} /> Saved</> : <><Save size={14} /> Save Targets</>}
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Weekly Target */}
            <div className="p-4 bg-[var(--bg-card)] rounded-xl border border-[var(--border-card)]">
              <div className="flex justify-between text-sm mb-4">
                <span className="font-bold text-[var(--text-primary)]">Weekly</span>
                <span className="text-[var(--text-secondary)]">
                  <span className={currentWeekPnl >= 0 ? 'text-[var(--color-profit)]' : 'text-[var(--color-loss)]'}>{formatCurrency(currentWeekPnl)}</span>
                </span>
              </div>
              <div className="relative mb-4">
                <DollarSign size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-secondary)]" />
                <input
                  type="number"
                  value={weeklyTarget}
                  onChange={(e) => setWeeklyTarget(e.target.value)}
                  className="w-full bg-[var(--bg-input)] border border-[var(--border-input)] rounded-lg pl-9 pr-4 py-2 text-[var(--text-primary)] outline-none focus:border-[var(--color-profit)] transition-colors"
                />
              </div>
              <div className="h-2 w-full bg-[var(--bg-input)] rounded-full overflow-hidden">
                <div className="h-full bg-[var(--color-profit)] transition-all" style={{ width: `${weeklyProgress}%` }} />
              </div>
            </div>

            {/* Bi-Weekly Target */}
            <div className="p-4 bg-[var(--bg-card)] rounded-xl border border-[var(--border-card)]">
              <div className="flex justify-between text-sm mb-4">
                <span className="font-bold text-[var(--text-primary)]">Bi-Weekly</span>
              </div>
              <div className="relative mb-4">
                <DollarSign size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-secondary)]" />
                <input
                  type="number"
                  value={biWeeklyTarget}
                  onChange={(e) => setBiWeeklyTarget(e.target.value)}
                  className="w-full bg-[var(--bg-input)] border border-[var(--border-input)] rounded-lg pl-9 pr-4 py-2 text-[var(--text-primary)] outline-none focus:border-[var(--color-profit)] transition-colors"
                />
              </div>
            </div>

            {/* Monthly Target */}
            <div className="p-4 bg-[var(--bg-card)] rounded-xl border border-[var(--border-card)]">
              <div className="flex justify-between text-sm mb-4">
                <span className="font-bold text-[var(--text-primary)]">Monthly</span>
                <span className="text-[var(--text-secondary)]">
                  <span className={currentMonthPnl >= 0 ? 'text-[var(--color-profit)]' : 'text-[var(--color-loss)]'}>{formatCurrency(currentMonthPnl)}</span>
                </span>
              </div>
              <div className="relative mb-4">
                <DollarSign size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-secondary)]" />
                <input
                  type="number"
                  value={monthlyTarget}
                  onChange={(e) => setMonthlyTarget(e.target.value)}
                  className="w-full bg-[var(--bg-input)] border border-[var(--border-input)] rounded-lg pl-9 pr-4 py-2 text-[var(--text-primary)] outline-none focus:border-[var(--color-profit)] transition-colors"
                />
              </div>
              <div className="h-2 w-full bg-[var(--bg-input)] rounded-full overflow-hidden">
                <div className="h-full bg-[var(--text-accent)] transition-all" style={{ width: `${monthlyProgress}%` }} />
              </div>
            </div>
          </div>
        </div>

        {/* ── Daily Balance Tracker ── */}
        <div className="glass-panel p-6 flex flex-col" style={{ borderRadius: 14 }}>
          <div className="flex items-center gap-3 mb-6">
            <DollarSign size={20} className="text-[var(--color-profit)]" />
            <h2 className="text-lg font-bold text-[var(--text-dark)]">Capital Growth Graph</h2>
          </div>
          
          <p className="text-xs text-[var(--text-secondary)] mb-6 leading-relaxed">
            Record your daily or weekly account balance to visualize your capital growth over time.
          </p>

          <div className="flex flex-col md:flex-row items-end gap-4 mb-8 p-4 bg-[var(--bg-card)] rounded-xl border border-[var(--border-card)]">
            <div className="w-full md:flex-1">
              <label className="block text-[10px] font-bold uppercase tracking-wider text-[var(--text-secondary)] mb-2">Record Date</label>
              <div className="relative">
                <input
                  type="date"
                  value={selectedDate}
                  onChange={handleDateChange}
                  className="w-full bg-[var(--bg-input)] border border-[var(--border-input)] rounded-lg px-4 py-3 text-[var(--text-primary)] font-mono-data text-sm outline-none focus:border-[var(--color-profit)] transition-colors"
                />
              </div>
            </div>
            <div className="w-full md:flex-1">
              <label className="block text-[10px] font-bold uppercase tracking-wider text-[var(--text-secondary)] mb-2">Total Account Balance</label>
              <div className="relative">
                <DollarSign size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-secondary)]" />
                <input
                  type="number"
                  value={balanceInput}
                  onChange={(e) => setBalanceInput(e.target.value)}
                  placeholder="150000"
                  className="w-full bg-[var(--bg-input)] border border-[var(--border-input)] rounded-lg pl-9 pr-4 py-3 text-[var(--text-primary)] font-mono-data text-sm outline-none focus:border-[var(--color-profit)] transition-colors"
                />
              </div>
            </div>
            <button
              onClick={handleSaveBalance}
              className="w-full md:w-auto flex items-center justify-center gap-2 px-8 py-3 rounded-lg text-xs font-bold uppercase tracking-wider transition-all h-[46px] cursor-pointer"
              style={{
                background: saveStatus === 'balance' ? 'var(--color-profit)' : 'var(--text-primary)',
                color: 'var(--bg-app)',
                border: 'none'
              }}
            >
              {saveStatus === 'balance' ? 'SAVED' : 'PLOT ON GRAPH'}
            </button>
          </div>

          {/* Chart */}
          <div className="mt-4 bg-[var(--bg-card)] p-4 rounded-xl border border-[var(--border-card)] min-h-[300px]">
            {history.length === 0 ? (
              <div className="h-[250px] flex items-center justify-center text-[var(--text-secondary)] text-sm">
                Enter your first balance above to start the graph!
              </div>
            ) : (
              <div className="h-[250px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={history} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorBalance" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="var(--text-accent)" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="var(--text-accent)" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <XAxis 
                      dataKey="date" 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fill: 'var(--text-secondary)', fontSize: 10 }}
                      dy={10}
                    />
                    <YAxis 
                      hide
                      domain={['auto', 'auto']}
                    />
                    <Tooltip 
                      contentStyle={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-card)', borderRadius: 8, fontSize: '12px' }}
                      itemStyle={{ color: 'var(--text-primary)', fontWeight: 'bold' }}
                      formatter={(value) => [formatCurrency(value), 'Balance']}
                      labelStyle={{ color: 'var(--text-secondary)', marginBottom: '4px' }}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="balance" 
                      stroke="var(--text-accent)" 
                      strokeWidth={3}
                      fillOpacity={1} 
                      fill="url(#colorBalance)" 
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}
