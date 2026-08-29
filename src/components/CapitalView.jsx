import { useState, useMemo } from 'react';
import { Target, DollarSign, TrendingUp, Calendar, Check, Save, BarChart3 } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, BarChart, Bar, Cell } from 'recharts';
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

  // Generate weekly PnL data for the Bar Chart (Last 4 weeks)
  const weeklyData = useMemo(() => {
    const data = [];
    const now = new Date();
    for (let i = 3; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - (i * 7));
      const day = d.getDay() || 7;
      
      const startOfWeek = new Date(d);
      startOfWeek.setHours(0,0,0,0);
      startOfWeek.setDate(d.getDate() - day + 1);
      
      const endOfWeek = new Date(startOfWeek);
      endOfWeek.setDate(endOfWeek.getDate() + 6);
      endOfWeek.setHours(23,59,59,999);
      
      let pnl = 0;
      Object.values(allTrades).flat().forEach(t => {
        if (!t || t.isOpen || !t.netPnl) return;
        const td = new Date(t.date);
        if (td >= startOfWeek && td <= endOfWeek) {
          pnl += t.netPnl;
        }
      });
      
      data.push({
        weekLabel: i === 0 ? 'This Week' : `${i}w ago`,
        dateStr: `${startOfWeek.getMonth()+1}/${startOfWeek.getDate()}`,
        pnl
      });
    }
    return data;
  }, [allTrades]);

  const weeklyProgress = weeklyTarget > 0 ? Math.max(0, Math.min(100, (currentWeekPnl / weeklyTarget) * 100)) : 0;
  const monthlyProgress = monthlyTarget > 0 ? Math.max(0, Math.min(100, (currentMonthPnl / monthlyTarget) * 100)) : 0;

  return (
    <div className="h-full w-full fade-in p-6 md:p-8 overflow-y-auto" style={{ fontFamily: "'Inter', sans-serif" }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '32px' }}>
        
        {/* Header */}
        <div className="glass-panel flex flex-col md:flex-row md:items-center justify-between gap-4 p-8" style={{ borderRadius: 16 }}>
          <div className="flex items-center gap-5">
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg" style={{ background: 'var(--bg-card)', border: '1px solid var(--border-active)' }}>
              <Target size={28} style={{ color: 'var(--text-accent)' }} />
            </div>
            <div>
              <h1 className="text-3xl font-black tracking-tight text-[var(--text-dark)]">Capital & Targets</h1>
              <p className="text-sm text-[var(--text-secondary)] mt-1 font-medium">Track your equity curve and manage profit objectives.</p>
            </div>
          </div>
        </div>

        {/* ── Targets Section ── */}
        <div className="glass-panel p-8" style={{ borderRadius: 16 }}>
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <TrendingUp size={22} className="text-[var(--text-accent)]" />
              <h2 className="text-xl font-bold text-[var(--text-dark)] tracking-tight">Profit Targets</h2>
            </div>
            <button
              onClick={handleSaveTargets}
              className="flex items-center gap-2 px-6 py-2.5 rounded-lg text-xs font-bold uppercase tracking-widest transition-all cursor-pointer shadow-sm hover:scale-105"
              style={{
                background: saveStatus === 'targets' ? 'var(--color-profit)' : 'var(--bg-card)',
                color: saveStatus === 'targets' ? '#fff' : 'var(--text-primary)',
                border: saveStatus === 'targets' ? 'none' : '1px solid var(--border-card)'
              }}
            >
              {saveStatus === 'targets' ? <><Check size={16} /> Saved</> : <><Save size={16} /> Save Targets</>}
            </button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '24px' }}>
            {/* Weekly Target */}
            <div className="p-6 bg-[var(--bg-card)] rounded-2xl border border-[var(--border-card)] shadow-sm hover:shadow-md transition-shadow">
              <div className="flex justify-between items-center mb-6">
                <span className="font-bold text-[var(--text-primary)] text-lg tracking-tight">Weekly</span>
                <span className="text-[var(--text-secondary)] font-mono-data font-bold bg-[var(--bg-sidebar)] px-3 py-1 rounded-full text-xs">
                  <span className={currentWeekPnl >= 0 ? 'text-[var(--color-profit)]' : 'text-[var(--color-loss)]'}>{formatCurrency(currentWeekPnl)}</span>
                </span>
              </div>
              <div className="relative mb-5">
                <DollarSign size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-secondary)]" />
                <input
                  type="number"
                  value={weeklyTarget}
                  onChange={(e) => setWeeklyTarget(e.target.value)}
                  className="w-full bg-[var(--bg-input)] border border-[var(--border-input)] rounded-xl pl-11 pr-4 py-3 text-[var(--text-primary)] font-mono-data font-bold outline-none focus:border-[var(--color-profit)] transition-colors"
                />
              </div>
              <div className="h-2.5 w-full bg-[var(--bg-input)] rounded-full overflow-hidden shadow-inner">
                <div className="h-full bg-[var(--color-profit)] transition-all duration-1000 ease-out" style={{ width: `${weeklyProgress}%` }} />
              </div>
            </div>

            {/* Bi-Weekly Target */}
            <div className="p-6 bg-[var(--bg-card)] rounded-2xl border border-[var(--border-card)] shadow-sm hover:shadow-md transition-shadow">
              <div className="flex justify-between items-center mb-6">
                <span className="font-bold text-[var(--text-primary)] text-lg tracking-tight">Bi-Weekly</span>
              </div>
              <div className="relative mb-5">
                <DollarSign size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-secondary)]" />
                <input
                  type="number"
                  value={biWeeklyTarget}
                  onChange={(e) => setBiWeeklyTarget(e.target.value)}
                  className="w-full bg-[var(--bg-input)] border border-[var(--border-input)] rounded-xl pl-11 pr-4 py-3 text-[var(--text-primary)] font-mono-data font-bold outline-none focus:border-[var(--color-profit)] transition-colors"
                />
              </div>
            </div>

            {/* Monthly Target */}
            <div className="p-6 bg-[var(--bg-card)] rounded-2xl border border-[var(--border-card)] shadow-sm hover:shadow-md transition-shadow">
              <div className="flex justify-between items-center mb-6">
                <span className="font-bold text-[var(--text-primary)] text-lg tracking-tight">Monthly</span>
                <span className="text-[var(--text-secondary)] font-mono-data font-bold bg-[var(--bg-sidebar)] px-3 py-1 rounded-full text-xs">
                  <span className={currentMonthPnl >= 0 ? 'text-[var(--color-profit)]' : 'text-[var(--color-loss)]'}>{formatCurrency(currentMonthPnl)}</span>
                </span>
              </div>
              <div className="relative mb-5">
                <DollarSign size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-secondary)]" />
                <input
                  type="number"
                  value={monthlyTarget}
                  onChange={(e) => setMonthlyTarget(e.target.value)}
                  className="w-full bg-[var(--bg-input)] border border-[var(--border-input)] rounded-xl pl-11 pr-4 py-3 text-[var(--text-primary)] font-mono-data font-bold outline-none focus:border-[var(--color-profit)] transition-colors"
                />
              </div>
              <div className="h-2.5 w-full bg-[var(--bg-input)] rounded-full overflow-hidden shadow-inner">
                <div className="h-full bg-[var(--text-accent)] transition-all duration-1000 ease-out" style={{ width: `${monthlyProgress}%` }} />
              </div>
            </div>
          </div>
        </div>

        {/* ── Charts Grid ── */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '32px' }}>
          
          {/* Equity Curve (Area Chart) */}
          <div className="glass-panel p-8 flex flex-col" style={{ borderRadius: 16 }}>
            <div className="flex items-center gap-3 mb-2">
              <TrendingUp size={22} className="text-[var(--text-accent)]" />
              <h2 className="text-xl font-bold text-[var(--text-dark)] tracking-tight">Capital Growth</h2>
            </div>
            <p className="text-xs text-[var(--text-secondary)] mb-6 font-medium">Historical account balance trajectory.</p>

            <div className="h-[280px] w-full mt-2">
              {history.length === 0 ? (
                <div className="h-full flex items-center justify-center text-[var(--text-secondary)] text-sm font-medium bg-[var(--bg-sidebar)]/30 rounded-xl border border-dashed border-[var(--border-card)]">
                  Log your first balance below to generate graph!
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={history} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorBalance" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="var(--text-accent)" stopOpacity={0.4}/>
                        <stop offset="95%" stopColor="var(--text-accent)" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <XAxis 
                      dataKey="date" 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fill: 'var(--text-secondary)', fontSize: 11, fontWeight: 600 }}
                      dy={15}
                    />
                    <YAxis hide domain={['auto', 'auto']} />
                    <Tooltip 
                      contentStyle={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-card)', borderRadius: 12, padding: '12px 16px', boxShadow: '0 8px 30px rgba(0,0,0,0.1)' }}
                      itemStyle={{ color: 'var(--text-primary)', fontWeight: '900', fontSize: '16px' }}
                      formatter={(value) => [formatCurrency(value), '']}
                      labelStyle={{ color: 'var(--text-secondary)', marginBottom: '4px', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 'bold' }}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="balance" 
                      stroke="var(--text-accent)" 
                      strokeWidth={4}
                      fillOpacity={1} 
                      fill="url(#colorBalance)" 
                    />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          {/* Weekly Performance (Bar Chart) */}
          <div className="glass-panel p-8 flex flex-col" style={{ borderRadius: 16 }}>
            <div className="flex items-center gap-3 mb-2">
              <BarChart3 size={22} className="text-[var(--text-accent)]" />
              <h2 className="text-xl font-bold text-[var(--text-dark)] tracking-tight">Weekly Performance</h2>
            </div>
            <p className="text-xs text-[var(--text-secondary)] mb-6 font-medium">Net P&L over the last 4 weeks.</p>

            <div className="h-[280px] w-full mt-2">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={weeklyData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <XAxis 
                    dataKey="weekLabel" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fill: 'var(--text-secondary)', fontSize: 11, fontWeight: 600 }}
                    dy={15}
                  />
                  <YAxis hide domain={['auto', 'auto']} />
                  <Tooltip 
                    cursor={{ fill: 'var(--bg-sidebar)', opacity: 0.5 }}
                    contentStyle={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-card)', borderRadius: 12, padding: '12px 16px', boxShadow: '0 8px 30px rgba(0,0,0,0.1)' }}
                    itemStyle={{ fontWeight: '900', fontSize: '16px' }}
                    formatter={(value) => [formatCurrency(value), 'Net P&L']}
                    labelStyle={{ color: 'var(--text-secondary)', marginBottom: '4px', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 'bold' }}
                  />
                  <Bar dataKey="pnl" radius={[6, 6, 6, 6]} barSize={40}>
                    {weeklyData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.pnl >= 0 ? 'var(--color-profit)' : 'var(--color-loss)'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

        </div>

        {/* ── Daily Balance Logger ── */}
        <div className="glass-panel p-8 flex flex-col" style={{ borderRadius: 16 }}>
          <div className="flex items-center gap-3 mb-2">
            <DollarSign size={22} className="text-[var(--text-accent)]" />
            <h2 className="text-xl font-bold text-[var(--text-dark)] tracking-tight">Log Capital Balance</h2>
          </div>
          <p className="text-xs text-[var(--text-secondary)] mb-6 font-medium">
            Update your account balance manually. This updates the Equity Curve above.
          </p>

          <div className="flex flex-col md:flex-row items-end gap-6 bg-[var(--bg-sidebar)]/30 p-6 rounded-2xl border border-[var(--border-card)] shadow-inner">
            <div className="w-full md:flex-1">
              <label className="block text-[10px] font-bold uppercase tracking-widest text-[var(--text-secondary)] mb-3">Record Date</label>
              <div className="relative">
                <input
                  type="date"
                  value={selectedDate}
                  onChange={handleDateChange}
                  className="w-full bg-[var(--bg-input)] border border-[var(--border-input)] rounded-xl px-5 py-3.5 text-[var(--text-primary)] font-mono-data text-sm font-bold outline-none focus:border-[var(--color-profit)] transition-colors shadow-sm"
                />
              </div>
            </div>
            <div className="w-full md:flex-1">
              <label className="block text-[10px] font-bold uppercase tracking-widest text-[var(--text-secondary)] mb-3">Total Account Balance</label>
              <div className="relative">
                <DollarSign size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-secondary)]" />
                <input
                  type="number"
                  value={balanceInput}
                  onChange={(e) => setBalanceInput(e.target.value)}
                  placeholder="150000"
                  className="w-full bg-[var(--bg-input)] border border-[var(--border-input)] rounded-xl pl-12 pr-5 py-3.5 text-[var(--text-primary)] font-mono-data text-sm font-bold outline-none focus:border-[var(--color-profit)] transition-colors shadow-sm"
                />
              </div>
            </div>
            <button
              onClick={handleSaveBalance}
              className="w-full md:w-auto flex items-center justify-center gap-2 px-10 py-3.5 rounded-xl text-xs font-bold uppercase tracking-widest transition-all shadow-md hover:scale-105 hover:shadow-lg cursor-pointer h-[50px]"
              style={{
                background: saveStatus === 'balance' ? 'var(--color-profit)' : 'var(--border-active)',
                color: saveStatus === 'balance' ? '#fff' : 'var(--bg-app)',
                border: 'none'
              }}
            >
              {saveStatus === 'balance' ? 'SAVED' : 'PLOT ON GRAPH'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
