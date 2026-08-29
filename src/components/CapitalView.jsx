import { useState, useMemo } from 'react';
import { Target, DollarSign, TrendingUp, Calendar, Check, Save } from 'lucide-react';
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
      if (trade.isOpen || !trade.netPnl) return;
      const tradeDate = new Date(trade.date);
      if (tradeDate >= startOfWeek) weekPnl += trade.netPnl;
      if (tradeDate >= startOfMonth) monthPnl += trade.netPnl;
    });

    return { currentWeekPnl: weekPnl, currentMonthPnl: monthPnl };
  }, [allTrades]);

  // Extract all historical balances for the chart/list
  const history = useMemo(() => {
    const entries = Object.keys(allJournals)
      .filter(date => allJournals[date].accountBalance != null)
      .map(date => ({
        date,
        balance: allJournals[date].accountBalance
      }))
      .sort((a, b) => new Date(b.date) - new Date(a.date)); // Newest first
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

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
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

            <div className="space-y-6">
              {/* Weekly Target */}
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span className="font-bold text-[var(--text-primary)]">Weekly Target</span>
                  <span className="text-[var(--text-secondary)]">
                    Current: <span className={currentWeekPnl >= 0 ? 'text-[var(--color-profit)]' : 'text-[var(--color-loss)]'}>{formatCurrency(currentWeekPnl)}</span>
                  </span>
                </div>
                <div className="flex items-center gap-4 mb-3">
                  <span className="text-[var(--text-secondary)] font-bold">$</span>
                  <input
                    type="number"
                    value={weeklyTarget}
                    onChange={(e) => setWeeklyTarget(e.target.value)}
                    className="flex-1 bg-[var(--bg-input)] border border-[var(--border-input)] rounded-lg px-4 py-2 text-[var(--text-primary)]"
                  />
                </div>
                <div className="h-2 w-full bg-[var(--bg-input)] rounded-full overflow-hidden">
                  <div className="h-full bg-[var(--color-profit)] transition-all" style={{ width: `${weeklyProgress}%` }} />
                </div>
              </div>

              {/* Bi-Weekly Target */}
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span className="font-bold text-[var(--text-primary)]">Bi-Weekly Target</span>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-[var(--text-secondary)] font-bold">$</span>
                  <input
                    type="number"
                    value={biWeeklyTarget}
                    onChange={(e) => setBiWeeklyTarget(e.target.value)}
                    className="flex-1 bg-[var(--bg-input)] border border-[var(--border-input)] rounded-lg px-4 py-2 text-[var(--text-primary)]"
                  />
                </div>
              </div>

              {/* Monthly Target */}
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span className="font-bold text-[var(--text-primary)]">Monthly Target</span>
                  <span className="text-[var(--text-secondary)]">
                    Current: <span className={currentMonthPnl >= 0 ? 'text-[var(--color-profit)]' : 'text-[var(--color-loss)]'}>{formatCurrency(currentMonthPnl)}</span>
                  </span>
                </div>
                <div className="flex items-center gap-4 mb-3">
                  <span className="text-[var(--text-secondary)] font-bold">$</span>
                  <input
                    type="number"
                    value={monthlyTarget}
                    onChange={(e) => setMonthlyTarget(e.target.value)}
                    className="flex-1 bg-[var(--bg-input)] border border-[var(--border-input)] rounded-lg px-4 py-2 text-[var(--text-primary)]"
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
              <h2 className="text-lg font-bold text-[var(--text-dark)]">Daily Capital Tracker</h2>
            </div>
            
            <p className="text-xs text-[var(--text-secondary)] mb-6 leading-relaxed">
              Manually enter the actual amount of money held in your account. This is strictly isolated and does NOT interfere with trade PnL calculations.
            </p>

            <div className="flex items-end gap-4 mb-8">
              <div className="flex-1">
                <label className="block text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)] mb-2">Date</label>
                <div className="relative">
                  <Calendar size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-secondary)]" />
                  <input
                    type="date"
                    value={selectedDate}
                    onChange={handleDateChange}
                    className="w-full bg-[var(--bg-input)] border border-[var(--border-input)] rounded-lg pl-10 pr-4 py-3 text-[var(--text-primary)] font-mono-data text-sm"
                  />
                </div>
              </div>
              <div className="flex-1">
                <label className="block text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)] mb-2">Account Balance</label>
                <input
                  type="number"
                  value={balanceInput}
                  onChange={(e) => setBalanceInput(e.target.value)}
                  placeholder="e.g. 150000"
                  className="w-full bg-[var(--bg-input)] border border-[var(--border-input)] rounded-lg px-4 py-3 text-[var(--text-primary)] font-mono-data text-sm"
                />
              </div>
              <button
                onClick={handleSaveBalance}
                className="flex items-center gap-2 px-6 py-3 rounded-lg text-xs font-bold uppercase tracking-wider transition-all h-[46px] cursor-pointer"
                style={{
                  background: saveStatus === 'balance' ? 'var(--color-profit)' : 'var(--bg-sidebar)',
                  color: saveStatus === 'balance' ? 'var(--bg-app)' : 'var(--text-primary)',
                  border: `1px solid ${saveStatus === 'balance' ? 'var(--color-profit)' : 'var(--border-card)'}`
                }}
              >
                {saveStatus === 'balance' ? 'Saved' : 'Save'}
              </button>
            </div>

            {/* History List */}
            <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)] mb-4">Historical Balances</h3>
            <div className="flex-1 overflow-y-auto bg-[var(--bg-input)] rounded-xl border border-[var(--border-input)]">
              {history.length === 0 ? (
                <div className="p-8 text-center text-[var(--text-secondary)] text-sm">
                  No account balances recorded yet.
                </div>
              ) : (
                <div className="divide-y divide-[var(--border-input)]">
                  {history.map((entry) => (
                    <div key={entry.date} className="flex justify-between items-center p-4 hover:bg-[var(--bg-sidebar)] transition-colors">
                      <span className="text-sm text-[var(--text-secondary)] font-mono-data">{entry.date}</span>
                      <span className="text-sm font-bold text-[var(--text-primary)] font-mono-data">
                        {formatCurrency(entry.balance)}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
