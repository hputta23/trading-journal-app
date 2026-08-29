import { useMemo } from 'react';
import { Target, TrendingUp, Activity, BarChart3, AlertTriangle, Clock } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine, BarChart, Bar, Cell } from 'recharts';
import { formatCurrency, formatPercent, groupTradeStats, SESSIONS, getSession, calcRMultiple } from '../utils/calculations';

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    const val = payload[0].value;
    return (
      <div className="px-4 py-3 bg-[var(--bg-card)] border border-[var(--border-card)] rounded-2xl shadow-xl backdrop-blur-md">
        <p className="text-[11px] font-bold text-[var(--text-secondary)] uppercase tracking-widest mb-1.5">{label}</p>
        <p className="text-lg font-bold font-mono-data" style={{ color: val >= 0 ? 'var(--color-profit)' : 'var(--color-loss)' }}>
          {formatCurrency(val)}
        </p>
      </div>
    );
  }
  return null;
};

export default function AnalyticsView({ allTrades }) {
  const closedTrades = useMemo(() => {
    const list = [];
    Object.entries(allTrades).sort(([a], [b]) => a.localeCompare(b)).forEach(([date, trades]) => {
      trades.forEach(t => {
        if (!t.isOpen && t.netPnl !== null) {
          list.push({ ...t, date });
        }
      });
    });
    // Sort chronologically (assuming trades within a day are in order, or sort by time)
    return list.sort((a, b) => {
      if (a.date === b.date) return a.time.localeCompare(b.time);
      return a.date.localeCompare(b.date);
    });
  }, [allTrades]);

  const hasData = closedTrades.length > 0;

  // Calculate Equity Curve and Drawdowns
  const equityCurveData = useMemo(() => {
    let cumulative = 0;
    let peak = 0;
    let maxDrawdown = 0;
    
    const pts = [];
    for (let i = 0; i < closedTrades.length; i++) {
      const t = closedTrades[i];
      cumulative += t.netPnl;
      if (cumulative > peak) peak = cumulative;
      
      const currentDrawdown = cumulative - peak;
      if (currentDrawdown < maxDrawdown) maxDrawdown = currentDrawdown;

      pts.push({
        tradeNumber: i + 1,
        date: t.date,
        ticker: t.ticker,
        pnl: t.netPnl,
        cumulative: Number(cumulative.toFixed(2)),
        drawdown: Number(currentDrawdown.toFixed(2))
      });
    }
    return pts;
  }, [closedTrades]);

  const currentEquity = equityCurveData.length > 0 ? equityCurveData[equityCurveData.length - 1].cumulative : 0;
  const peakEquity = equityCurveData.reduce((max, d) => Math.max(max, d.cumulative), 0);
  const currentDrawdown = currentEquity - peakEquity;
  const maxHistoricalDrawdown = equityCurveData.reduce((min, d) => Math.min(min, d.drawdown), 0);

  // Win/Loss Size Distribution (Histogram bins)
  const distributionData = useMemo(() => {
    if (!hasData) return [];
    const bins = {
      '<-$500': 0, '-$500 to -$100': 0, '-$100 to $0': 0,
      '$0 to $100': 0, '$100 to $500': 0, '>$500': 0
    };
    
    closedTrades.forEach(t => {
      if (t.netPnl < -500) bins['<-$500']++;
      else if (t.netPnl < -100) bins['-$500 to -$100']++;
      else if (t.netPnl < 0) bins['-$100 to $0']++;
      else if (t.netPnl <= 100) bins['$0 to $100']++;
      else if (t.netPnl <= 500) bins['$100 to $500']++;
      else bins['>$500']++;
    });

    return Object.entries(bins).map(([name, count]) => ({
      name,
      count,
      isProfit: !name.includes('-')
    }));
  }, [closedTrades, hasData]);

  const statsSummary = useMemo(() => {
    const winners = closedTrades.filter(t => t.netPnl > 0);
    const losers = closedTrades.filter(t => t.netPnl < 0);
    
    const grossProfit = winners.reduce((s, t) => s + t.netPnl, 0);
    const grossLoss = Math.abs(losers.reduce((s, t) => s + t.netPnl, 0));
    const profitFactor = grossLoss > 0 ? (grossProfit / grossLoss) : grossProfit > 0 ? Infinity : 0;
    
    const avgWin = winners.length > 0 ? grossProfit / winners.length : 0;
    const avgLoss = losers.length > 0 ? grossLoss / losers.length : 0;

    return {
      winRate: closedTrades.length > 0 ? (winners.length / closedTrades.length) * 100 : 0,
      profitFactor,
      avgWin,
      avgLoss,
      totalTrades: closedTrades.length,
      expectancy: closedTrades.length > 0 ? ((winners.length / closedTrades.length) * avgWin) - ((losers.length / closedTrades.length) * avgLoss) : 0
    };
  }, [closedTrades]);

  // Task 5: Mistake Tax Stats
  const mistakeStats = useMemo(() => groupTradeStats(closedTrades, t => t.mistake || 'None / Plan Followed'), [closedTrades]);
  const mistakeTax = mistakeStats.filter(m => m.name !== 'None / Plan Followed' && m.totalPnl < 0).reduce((s, m) => s + m.totalPnl, 0);
  const planFollowedStats = mistakeStats.find(m => m.name === 'None / Plan Followed') || { totalPnl: 0, winRate: 0, count: 0 };
  const sortedMistakes = mistakeStats.filter(m => m.name !== 'None / Plan Followed').sort((a, b) => a.totalPnl - b.totalPnl);
  const maxMistakePnl = sortedMistakes.length > 0 ? Math.max(...sortedMistakes.map(m => Math.abs(m.totalPnl))) : 1;

  // Task 6: Session Stats
  const sessionStats = useMemo(() => {
    const stats = groupTradeStats(closedTrades, t => getSession(t.time));
    const order = SESSIONS.reduce((acc, s, i) => ({ ...acc, [s]: i }), {});
    return stats.filter(s => s.count > 0).sort((a, b) => (order[a.name] ?? 99) - (order[b.name] ?? 99));
  }, [closedTrades]);

  // Task 6: R-Multiple Distribution
  const rDistributionData = useMemo(() => {
    const bins = { '<-2R': 0, '-2 to -1R': 0, '-1 to 0R': 0, '0 to 1R': 0, '1 to 2R': 0, '>2R': 0 };
    const rStats = { expectancy: 0, avgWinR: 0, avgLossR: 0, rCount: 0, badLossCount: 0, totalLossCount: 0 };
    const rValues = closedTrades.map(calcRMultiple).filter(r => r !== null);
    
    if (rValues.length === 0) return { bins: [], stats: rStats };
    
    rStats.rCount = rValues.length;
    
    const winners = rValues.filter(r => r > 0);
    const losers = rValues.filter(r => r < 0);
    rStats.totalLossCount = losers.length;
    rStats.expectancy = rValues.reduce((a, b) => a + b, 0) / rValues.length;
    rStats.avgWinR = winners.length > 0 ? winners.reduce((a, b) => a + b, 0) / winners.length : 0;
    rStats.avgLossR = losers.length > 0 ? losers.reduce((a, b) => a + b, 0) / losers.length : 0;
    rStats.badLossCount = losers.filter(r => r < -1).length;
    
    rValues.forEach(r => {
      if (r < -2) bins['<-2R']++;
      else if (r < -1) bins['-2 to -1R']++;
      else if (r <= 0) bins['-1 to 0R']++;
      else if (r <= 1) bins['0 to 1R']++;
      else if (r <= 2) bins['1 to 2R']++;
      else bins['>2R']++;
    });
    
    const binArr = Object.entries(bins).map(([name, count]) => ({
      name,
      count,
      isProfit: name === '0 to 1R' || name === '1 to 2R' || name === '>2R'
    }));
    
    return { bins: binArr, stats: rStats };
  }, [closedTrades]);

  // ── NEW: Advanced Ratios (Sharpe, Sortino, Payoff, Recovery) ──
  const advancedRatios = useMemo(() => {
    if (closedTrades.length < 2) return { sharpe: null, sortino: null, payoff: null, recovery: null };

    // Group trades by date for daily returns
    const dailyMap = {};
    closedTrades.forEach(t => {
      if (!dailyMap[t.date]) dailyMap[t.date] = 0;
      dailyMap[t.date] += t.netPnl;
    });
    const dailyReturns = Object.values(dailyMap);

    const avgReturn = dailyReturns.reduce((s, r) => s + r, 0) / dailyReturns.length;

    // Std dev of daily returns
    const variance = dailyReturns.reduce((s, r) => s + (r - avgReturn) ** 2, 0) / dailyReturns.length;
    const stdDev = Math.sqrt(variance);

    // Downside deviation (only negative returns)
    const downsideVariance = dailyReturns.reduce((s, r) => s + (r < 0 ? r ** 2 : 0), 0) / dailyReturns.length;
    const downsideDev = Math.sqrt(downsideVariance);

    const sharpe = stdDev > 0 ? (avgReturn / stdDev) * Math.sqrt(252) : null; // Annualized
    const sortino = downsideDev > 0 ? (avgReturn / downsideDev) * Math.sqrt(252) : null;

    // Payoff ratio
    const ws = closedTrades.filter(t => t.netPnl > 0);
    const ls = closedTrades.filter(t => t.netPnl < 0);
    const avgWin = ws.length > 0 ? ws.reduce((s, t) => s + t.netPnl, 0) / ws.length : 0;
    const avgLoss = ls.length > 0 ? Math.abs(ls.reduce((s, t) => s + t.netPnl, 0) / ls.length) : 0;
    const payoff = avgLoss > 0 ? avgWin / avgLoss : avgWin > 0 ? Infinity : 0;

    // Recovery factor = net profit / max drawdown
    const netProfit = closedTrades.reduce((s, t) => s + t.netPnl, 0);
    const recovery = Math.abs(maxHistoricalDrawdown) > 0 ? netProfit / Math.abs(maxHistoricalDrawdown) : null;

    return { sharpe, sortino, payoff, recovery };
  }, [closedTrades, maxHistoricalDrawdown]);

  // ── NEW: Consecutive Win/Loss Streaks ──
  const streaks = useMemo(() => {
    let currentWinStreak = 0, currentLossStreak = 0;
    let maxWinStreak = 0, maxLossStreak = 0;

    closedTrades.forEach(t => {
      if (t.netPnl >= 0) {
        currentWinStreak++;
        currentLossStreak = 0;
        if (currentWinStreak > maxWinStreak) maxWinStreak = currentWinStreak;
      } else {
        currentLossStreak++;
        currentWinStreak = 0;
        if (currentLossStreak > maxLossStreak) maxLossStreak = currentLossStreak;
      }
    });

    return { currentWinStreak, currentLossStreak, maxWinStreak, maxLossStreak };
  }, [closedTrades]);

  // ── NEW: Performance by Day of Week ──
  const dayOfWeekData = useMemo(() => {
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const dayStats = days.map(d => ({ day: d, pnl: 0, count: 0, wins: 0 }));

    closedTrades.forEach(t => {
      const dow = new Date(t.date + 'T12:00:00').getDay();
      dayStats[dow].pnl += t.netPnl;
      dayStats[dow].count++;
      if (t.netPnl > 0) dayStats[dow].wins++;
    });

    // Only return days that have trades
    return dayStats.filter(d => d.count > 0);
  }, [closedTrades]);

  // ── NEW: Performance by Ticker (Top 5 Best / Worst) ──
  const tickerPerformance = useMemo(() => {
    const tickerMap = {};
    closedTrades.forEach(t => {
      if (!tickerMap[t.ticker]) tickerMap[t.ticker] = { ticker: t.ticker, pnl: 0, count: 0, wins: 0 };
      tickerMap[t.ticker].pnl += t.netPnl;
      tickerMap[t.ticker].count++;
      if (t.netPnl > 0) tickerMap[t.ticker].wins++;
    });
    const all = Object.values(tickerMap).sort((a, b) => b.pnl - a.pnl);
    return { best: all.slice(0, 5), worst: all.slice(-5).reverse() };
  }, [closedTrades]);

  // ── NEW: Performance by Strategy ──
  const strategyPerformance = useMemo(() => {
    return groupTradeStats(closedTrades, t => t.strategy || 'Untagged');
  }, [closedTrades]);

  // ── NEW: Monthly P&L Grid (Year × Month) ──
  const monthlyPnlGrid = useMemo(() => {
    const map = {}; // { "2026": { 0: 123, 1: -456, ... } }
    closedTrades.forEach(t => {
      const d = new Date(t.date);
      const y = d.getFullYear();
      const m = d.getMonth();
      if (!map[y]) map[y] = {};
      if (!map[y][m]) map[y][m] = 0;
      map[y][m] += t.netPnl;
    });

    const years = Object.keys(map).sort();
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

    return { map, years, months };
  }, [closedTrades]);

  return (
    <div className="h-full w-full fade-in overflow-y-auto bg-[var(--bg-app)] pb-16">
      
      {/* ── HEADER ── */}
      <div className="p-6 md:p-8 border-b border-[var(--border-card)] bg-[var(--bg-card)]/40 backdrop-blur-sm">
        <div className="max-w-[1600px] mx-auto flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl flex items-center justify-center bg-[var(--bg-card)] border border-[var(--border-card)] shrink-0 shadow-sm">
            <Activity className="text-[var(--text-accent)]" size={24} />
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-black text-[var(--text-dark)] tracking-tight">
              Institutional Analytics
            </h1>
            <p className="text-sm text-[var(--text-secondary)] mt-1 font-medium">Advanced performance metrics, equity curve trajectory, and trade distributions.</p>
          </div>
        </div>
      </div>

      <div className="p-6 md:p-8 max-w-[1600px] mx-auto space-y-8">
        
        {!hasData ? (
          <div className="py-24 text-center flex flex-col items-center justify-center glass-panel rounded-2xl p-8 border border-[var(--border-card)]">
            <BarChart3 size={48} className="text-[var(--text-secondary)] opacity-50 mb-4" />
            <p className="text-xl font-bold text-[var(--text-secondary)]">Insufficient Data</p>
            <p className="text-sm text-[var(--text-secondary)] mt-2">Log trades to generate equity curves and distributions.</p>
          </div>
        ) : (
          <>
            {/* ── MISTAKE TAX ROW ── */}
            {closedTrades.length < 5 ? (
              <div className="glass-panel p-8 rounded-2xl border" style={{ borderColor: 'color-mix(in srgb, var(--color-loss) 35%, transparent)' }}>
                <p className="text-center text-[var(--text-secondary)] font-bold">Log at least 5 trades to see where your P&L leaks.</p>
              </div>
            ) : (
              <div className="glass-panel p-6 md:p-8 rounded-2xl border" style={{ borderColor: 'color-mix(in srgb, var(--color-loss) 35%, transparent)' }}>
                <p className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider mb-2">MISTAKE TAX</p>
                <p className="font-mono-data font-black text-[var(--color-loss)] leading-none" style={{ fontSize: 'clamp(32px, 6vw, 48px)' }}>
                  {formatCurrency(mistakeTax)}
                </p>
                <p className="text-sm mt-3 font-bold text-[var(--text-secondary)]">
                  Plan-followed trades made <span className="text-[var(--color-profit)] font-mono-data">{formatCurrency(planFollowedStats.totalPnl)}</span> at a <span className="text-[var(--color-profit)] font-mono-data">{planFollowedStats.winRate.toFixed(1)}%</span> win rate.
                </p>
                
                {sortedMistakes.length > 0 && (
                  <div className="mt-8 space-y-4">
                    {sortedMistakes.map(m => {
                      const widthPct = Math.min((Math.abs(m.totalPnl) / maxMistakePnl) * 100, 100);
                      const isProfit = m.totalPnl >= 0;
                      return (
                        <div key={m.name} className="flex flex-col gap-2">
                          <div className="flex justify-between items-center text-xs md:text-sm font-bold uppercase tracking-wider text-[var(--text-secondary)]">
                            <div className="flex items-center gap-2">
                              <span className="text-[var(--text-dark)] truncate max-w-[200px] sm:max-w-xs md:max-w-md">{m.name}</span>
                              <span className="opacity-50 font-normal">({m.count})</span>
                            </div>
                            <span className={`font-mono-data ${isProfit ? 'text-[var(--color-profit)]' : 'text-[var(--color-loss)]'}`}>
                              {formatCurrency(m.totalPnl)}
                            </span>
                          </div>
                          <div className="h-2 w-full bg-[var(--bg-card)] rounded-full overflow-hidden">
                            <div 
                              className="h-full transition-all duration-500 ease-out rounded-full"
                              style={{ 
                                width: `${widthPct}%`, 
                                backgroundColor: isProfit ? 'var(--color-profit)' : 'var(--color-loss)',
                              }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* ── KPI ROW ── */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              <div className="glass-panel p-6 rounded-2xl border border-[var(--border-card)] flex flex-col justify-between">
                <p className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider mb-2">Net Equity</p>
                <p className={`text-2xl font-black font-mono-data truncate ${currentEquity >= 0 ? 'text-[var(--color-profit)]' : 'text-[var(--color-loss)]'}`} title={formatCurrency(currentEquity)}>
                  {formatCurrency(currentEquity)}
                </p>
              </div>
              <div className="glass-panel p-6 rounded-2xl border border-[var(--border-card)] flex flex-col justify-between">
                <p className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider mb-2">Win Rate</p>
                <p className="text-2xl font-black font-mono-data text-[var(--text-dark)] truncate">
                  {formatPercent(statsSummary.winRate)}
                </p>
              </div>
              <div className="glass-panel p-6 rounded-2xl border border-[var(--border-card)] flex flex-col justify-between">
                <p className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider mb-2">Profit Factor</p>
                <p className="text-2xl font-black font-mono-data text-[var(--text-dark)] truncate">
                  {statsSummary.profitFactor === Infinity ? '∞' : statsSummary.profitFactor.toFixed(2)}
                </p>
              </div>
              <div className="glass-panel p-6 rounded-2xl border border-[var(--border-card)] flex flex-col justify-between">
                <p className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider mb-2">Payoff Ratio</p>
                <p className="text-2xl font-black font-mono-data text-[var(--text-dark)] truncate">
                  {advancedRatios.payoff === Infinity ? '∞' : advancedRatios.payoff !== null ? advancedRatios.payoff.toFixed(2) : '—'}
                </p>
              </div>
              <div className="glass-panel p-6 rounded-2xl border border-[var(--border-card)] flex flex-col justify-between">
                <p className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider mb-2">Sharpe Ratio</p>
                <p className="text-2xl font-black font-mono-data text-[var(--text-dark)] truncate">
                  {advancedRatios.sharpe !== null ? advancedRatios.sharpe.toFixed(2) : '—'}
                </p>
              </div>
              <div className="glass-panel p-6 rounded-2xl border border-[var(--border-card)] flex flex-col justify-between">
                <p className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider mb-2">Sortino</p>
                <p className="text-2xl font-black font-mono-data text-[var(--text-dark)] truncate">
                  {advancedRatios.sortino !== null ? advancedRatios.sortino.toFixed(2) : '—'}
                </p>
              </div>
              <div className="glass-panel p-6 rounded-2xl border border-[var(--border-card)] flex flex-col justify-between">
                <p className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider mb-2">Recovery</p>
                <p className="text-2xl font-black font-mono-data text-[var(--text-dark)] truncate">
                  {advancedRatios.recovery !== null ? advancedRatios.recovery.toFixed(2) : '—'}
                </p>
              </div>
              <div className="glass-panel p-6 rounded-2xl border border-[var(--border-card)] flex flex-col justify-between">
                <p className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider mb-2">Max Drawdown</p>
                <p className="text-2xl font-black font-mono-data text-[var(--color-loss)] truncate" title={formatCurrency(maxHistoricalDrawdown)}>
                  {formatCurrency(maxHistoricalDrawdown)}
                </p>
              </div>
            </div>

            {/* ── EQUITY CURVE CHART ── */}
            <div className="glass-panel rounded-2xl p-6 md:p-8 border border-[var(--border-card)]">
              <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
                <h2 className="text-base font-bold uppercase tracking-wider text-[var(--text-dark)] flex items-center gap-2.5">
                  <TrendingUp size={18} className="text-[var(--color-cyan)]" />
                  Cumulative Equity Curve
                </h2>
                {currentDrawdown < 0 && (
                  <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-[var(--bg-badge-loss)] border border-[var(--border-loss)]">
                    <AlertTriangle size={14} className="text-[var(--color-loss)] shrink-0" />
                    <span className="text-xs font-bold uppercase tracking-wider text-[var(--color-loss)]">
                      In Drawdown: {formatCurrency(currentDrawdown)}
                    </span>
                  </div>
                )}
              </div>
              
              <div className="w-full h-[400px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={equityCurveData} margin={{ top: 10, right: 20, left: 40, bottom: 10 }}>
                    <defs>
                      <linearGradient id="colorEq" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="var(--color-cyan)" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="var(--color-cyan)" stopOpacity={0}/>
                      </linearGradient>
                      <linearGradient id="colorDd" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="var(--color-loss)" stopOpacity={0.2}/>
                        <stop offset="95%" stopColor="var(--color-loss)" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border-card)" vertical={false} />
                    <XAxis 
                      dataKey="tradeNumber" 
                      tick={{ fill: 'var(--text-secondary)', fontSize: 11, fontFamily: "'JetBrains Mono', monospace" }}
                      axisLine={false}
                      tickLine={false}
                      dy={10}
                    />
                    <YAxis 
                      tick={{ fill: 'var(--text-secondary)', fontSize: 11, fontFamily: "'JetBrains Mono', monospace" }}
                      axisLine={false}
                      tickLine={false}
                      tickFormatter={(val) => `$${val}`}
                      dx={-5}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <ReferenceLine y={0} stroke="var(--text-secondary)" strokeDasharray="3 3" opacity={0.5} />
                    
                    {/* Drawdown Area (invisible if >= 0, plotted below the peak) */}
                    {/* Simplified for now: just plotting Cumulative Equity */}
                    <Area 
                      type="monotone" 
                      dataKey="cumulative" 
                      stroke="var(--color-cyan)" 
                      strokeWidth={3}
                      fillOpacity={1} 
                      fill="url(#colorEq)" 
                      animationDuration={1500}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* ── STREAKS & STATS ROW ── */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              <div className="glass-panel p-6 rounded-2xl border border-[var(--border-card)] flex flex-col justify-between">
                <p className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider mb-2">Current Streak</p>
                <p className={`text-2xl font-black font-mono-data truncate ${streaks.currentWinStreak > 0 ? 'text-[var(--color-profit)]' : streaks.currentLossStreak > 0 ? 'text-[var(--color-loss)]' : 'text-[var(--text-dark)]'}`}>
                  {streaks.currentWinStreak > 0 ? `${streaks.currentWinStreak} Wins` : streaks.currentLossStreak > 0 ? `${streaks.currentLossStreak} Losses` : '0'}
                </p>
              </div>
              <div className="glass-panel p-6 rounded-2xl border border-[var(--border-card)] flex flex-col justify-between">
                <p className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider mb-2">Max Win Streak</p>
                <p className="text-2xl font-black font-mono-data text-[var(--color-profit)] truncate">{streaks.maxWinStreak} Trades</p>
              </div>
              <div className="glass-panel p-6 rounded-2xl border border-[var(--border-card)] flex flex-col justify-between">
                <p className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider mb-2">Max Loss Streak</p>
                <p className="text-2xl font-black font-mono-data text-[var(--color-loss)] truncate">{streaks.maxLossStreak} Trades</p>
              </div>
              <div className="glass-panel p-6 rounded-2xl border border-[var(--border-card)] flex flex-col justify-between">
                <p className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider mb-2">Total Trades</p>
                <p className="text-2xl font-black font-mono-data text-[var(--text-dark)] truncate">{statsSummary.totalTrades}</p>
              </div>
            </div>

            {/* ── DAY OF WEEK & MONTHLY P&L ── */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              
              {/* Day of Week */}
              <div className="glass-panel rounded-2xl p-6 md:p-8 border border-[var(--border-card)] flex flex-col">
                <div className="flex items-center gap-2.5 mb-6">
                  <BarChart3 size={18} className="text-[var(--text-accent)]" />
                  <h2 className="text-base font-bold uppercase tracking-wider text-[var(--text-dark)]">Performance by Day</h2>
                </div>
                
                <div className="w-full h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={dayOfWeekData} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--border-card)" vertical={false} />
                      <XAxis 
                        dataKey="day" 
                        tick={{ fill: 'var(--text-secondary)', fontSize: 11, fontFamily: "'Inter', sans-serif", fontWeight: 'bold' }}
                        axisLine={false}
                        tickLine={false}
                        dy={10}
                      />
                      <YAxis hide domain={['auto', 'auto']} />
                      <Tooltip 
                        cursor={{ fill: 'var(--border-card)', opacity: 0.5 }}
                        content={({ active, payload }) => {
                          if (active && payload && payload.length) {
                            const d = payload[0].payload;
                            return (
                              <div className="px-4 py-3 bg-[var(--bg-card)] border border-[var(--border-card)] rounded-xl shadow-xl backdrop-blur-md">
                                <p className="text-[11px] font-bold text-[var(--text-secondary)] uppercase tracking-widest">{d.day} ({d.count} Trades)</p>
                                <p className={`text-base font-bold font-mono-data mt-1 ${d.pnl >= 0 ? 'text-[var(--color-profit)]' : 'text-[var(--color-loss)]'}`}>
                                  {formatCurrency(d.pnl)}
                                </p>
                              </div>
                            );
                          }
                          return null;
                        }} 
                      />
                      <Bar dataKey="pnl" radius={[6, 6, 6, 6]} animationDuration={1500} barSize={44}>
                        {dayOfWeekData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.pnl >= 0 ? 'var(--color-profit)' : 'var(--color-loss)'} opacity={0.85} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Monthly P&L Grid */}
              <div className="glass-panel rounded-2xl p-6 md:p-8 border border-[var(--border-card)] flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-2.5 mb-6">
                    <Target size={18} className="text-[var(--text-accent)]" />
                    <h2 className="text-base font-bold uppercase tracking-wider text-[var(--text-dark)]">Monthly Returns</h2>
                  </div>
                  
                  <div className="overflow-x-auto w-full">
                    <table className="w-full text-left border-collapse min-w-[560px]">
                      <thead>
                        <tr>
                          <th className="text-[11px] font-bold uppercase tracking-wider text-[var(--text-secondary)] pb-3 border-b border-[var(--border-card)]">Year</th>
                          {monthlyPnlGrid.months.map(m => (
                            <th key={m} className="text-[11px] font-bold uppercase tracking-wider text-[var(--text-secondary)] pb-3 border-b border-[var(--border-card)] text-right px-1.5">{m}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="text-xs md:text-sm font-bold font-mono-data">
                        {monthlyPnlGrid.years.map(y => {
                          let yTotal = 0;
                          return (
                            <tr key={y} className="border-b border-[var(--border-card)] last:border-0 hover:bg-white/[0.02] transition-colors">
                              <td className="py-3 text-[var(--text-dark)] font-sans">{y}</td>
                              {monthlyPnlGrid.months.map((m, i) => {
                                const pnl = monthlyPnlGrid.map[y][i];
                                if (pnl) yTotal += pnl;
                                return (
                                  <td key={i} className={`py-3 text-right px-1.5 ${!pnl ? 'text-[var(--text-secondary)] opacity-30' : pnl > 0 ? 'text-[var(--color-profit)]' : 'text-[var(--color-loss)]'}`}>
                                    {pnl ? formatCurrency(pnl) : '—'}
                                  </td>
                                );
                              })}
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>

            {/* ── TICKER & STRATEGY ROW ── */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Tickers */}
              <div className="glass-panel rounded-2xl p-6 md:p-8 border border-[var(--border-card)]">
                <div className="flex items-center gap-2.5 mb-6">
                  <Activity size={18} className="text-[var(--text-accent)]" />
                  <h2 className="text-base font-bold uppercase tracking-wider text-[var(--text-dark)]">Edge by Ticker</h2>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div>
                    <p className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider mb-3 border-b border-[var(--border-card)] pb-2">Top 5 Best</p>
                    <div className="space-y-1">
                      {tickerPerformance.best.map(t => (
                        <div key={t.ticker} className="flex justify-between items-center py-2 text-xs md:text-sm font-mono-data font-bold border-b border-[var(--border-card)]/40 last:border-0">
                          <span className="text-[var(--text-dark)] font-sans">{t.ticker}</span>
                          <span className="text-[var(--color-profit)]">{formatCurrency(t.pnl)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div>
                    <p className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider mb-3 border-b border-[var(--border-card)] pb-2">Top 5 Worst</p>
                    <div className="space-y-1">
                      {tickerPerformance.worst.map(t => (
                        <div key={t.ticker} className="flex justify-between items-center py-2 text-xs md:text-sm font-mono-data font-bold border-b border-[var(--border-card)]/40 last:border-0">
                          <span className="text-[var(--text-dark)] font-sans">{t.ticker}</span>
                          <span className="text-[var(--color-loss)]">{formatCurrency(t.pnl)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Strategies */}
              <div className="glass-panel rounded-2xl p-6 md:p-8 border border-[var(--border-card)]">
                <div className="flex items-center gap-2.5 mb-6">
                  <Target size={18} className="text-[var(--text-accent)]" />
                  <h2 className="text-base font-bold uppercase tracking-wider text-[var(--text-dark)]">Edge by Strategy</h2>
                </div>
                <div className="space-y-2">
                  {strategyPerformance.slice(0, 5).map(s => (
                    <div key={s.name} className="flex justify-between items-center py-2.5 border-b border-[var(--border-card)] last:border-0 hover:bg-white/[0.02] transition-colors">
                      <div className="flex items-center gap-2">
                        <span className="text-xs md:text-sm font-bold text-[var(--text-dark)]">{s.name}</span>
                        <span className="text-[11px] text-[var(--text-secondary)] font-bold">({s.count}T, {s.winRate.toFixed(0)}% W)</span>
                      </div>
                      <span className={`text-xs md:text-sm font-mono-data font-bold ${s.totalPnl >= 0 ? 'text-[var(--color-profit)]' : 'text-[var(--color-loss)]'}`}>
                        {formatCurrency(s.totalPnl)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* ── DISTRIBUTIONS ── */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              
              {/* Size Distribution */}
              <div className="glass-panel rounded-2xl p-6 md:p-8 border border-[var(--border-card)]">
                <div className="flex items-center gap-2.5 mb-6">
                  <BarChart3 size={18} className="text-[var(--text-accent)]" />
                  <h2 className="text-base font-bold uppercase tracking-wider text-[var(--text-dark)]">P&L Distribution</h2>
                </div>
                
                <div className="w-full h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={distributionData} margin={{ top: 10, right: 20, left: 0, bottom: 40 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--border-card)" vertical={false} />
                      <XAxis 
                        dataKey="name" 
                        tick={{ fill: 'var(--text-secondary)', fontSize: 10, fontFamily: "'Inter', sans-serif" }}
                        axisLine={false}
                        tickLine={false}
                        angle={-45}
                        textAnchor="end"
                        dy={15}
                        dx={-5}
                      />
                      <YAxis 
                        tick={{ fill: 'var(--text-secondary)', fontSize: 11, fontFamily: "'JetBrains Mono', monospace" }}
                        axisLine={false}
                        tickLine={false}
                        dx={-5}
                      />
                      <Tooltip 
                        cursor={{ fill: 'var(--border-card)', opacity: 0.5 }}
                        content={({ active, payload }) => {
                          if (active && payload && payload.length) {
                            return (
                              <div className="px-4 py-3 bg-[var(--bg-card)] border border-[var(--border-card)] rounded-xl shadow-xl backdrop-blur-md">
                                <p className="text-[11px] font-bold text-[var(--text-secondary)] uppercase tracking-widest">{payload[0].payload.name}</p>
                                <p className="text-base font-bold font-mono-data text-[var(--text-dark)] mt-1">{payload[0].value} Trades</p>
                              </div>
                            );
                          }
                          return null;
                        }} 
                      />
                      <Bar dataKey="count" radius={[6, 6, 0, 0]} animationDuration={1500}>
                        {distributionData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.isProfit ? 'var(--color-profit)' : 'var(--color-loss)'} opacity={0.85} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Advanced Metrics Table */}
              <div className="glass-panel rounded-2xl p-6 md:p-8 border border-[var(--border-card)]">
                <div className="flex items-center gap-2.5 mb-6">
                  <Target size={18} className="text-[var(--text-accent)]" />
                  <h2 className="text-base font-bold uppercase tracking-wider text-[var(--text-dark)]">Performance Matrix</h2>
                </div>
                
                <div className="space-y-3">
                  {[
                    ['Average Winning Trade', formatCurrency(statsSummary.avgWin), 'text-[var(--color-profit)]'],
                    ['Average Losing Trade', formatCurrency(-statsSummary.avgLoss), 'text-[var(--color-loss)]'],
                    ['Reward / Risk Ratio', statsSummary.avgLoss > 0 ? (statsSummary.avgWin / statsSummary.avgLoss).toFixed(2) : '∞', 'text-[var(--text-dark)]'],
                    ['Largest Winner', formatCurrency(Math.max(...closedTrades.map(t => t.netPnl), 0)), 'text-[var(--color-profit)]'],
                    ['Largest Loser', formatCurrency(Math.min(...closedTrades.map(t => t.netPnl), 0)), 'text-[var(--color-loss)]'],
                  ].map(([label, val, colorClass]) => (
                    <div key={label} className="flex justify-between items-center py-3 border-b border-[var(--border-card)] last:border-0">
                      <span className="text-sm font-medium text-[var(--text-secondary)]">{label}</span>
                      <span className={`text-base font-bold font-mono-data ${colorClass}`}>{val}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* ── SESSION BREAKDOWN & R-MULTIPLE ── */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              
              {/* Session Breakdown */}
              <div className="glass-panel rounded-2xl p-6 md:p-8 border border-[var(--border-card)] flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-2.5 mb-6">
                    <Clock size={18} className="text-[var(--text-accent)]" />
                    <h2 className="text-base font-bold uppercase tracking-wider text-[var(--text-dark)]">Performance by Session</h2>
                  </div>
                  <div className="overflow-x-auto w-full">
                    <table className="w-full text-left border-collapse min-w-[500px]">
                      <thead>
                        <tr>
                          <th className="text-[11px] font-bold uppercase tracking-wider text-[var(--text-secondary)] pb-3 border-b border-[var(--border-card)]">Session</th>
                          <th className="text-[11px] font-bold uppercase tracking-wider text-[var(--text-secondary)] pb-3 border-b border-[var(--border-card)] text-right">Trades</th>
                          <th className="text-[11px] font-bold uppercase tracking-wider text-[var(--text-secondary)] pb-3 border-b border-[var(--border-card)] text-right">Win %</th>
                          <th className="text-[11px] font-bold uppercase tracking-wider text-[var(--text-secondary)] pb-3 border-b border-[var(--border-card)] text-right">Avg R</th>
                          <th className="text-[11px] font-bold uppercase tracking-wider text-[var(--text-secondary)] pb-3 border-b border-[var(--border-card)] text-right">Net P&L</th>
                        </tr>
                      </thead>
                      <tbody className="text-sm font-bold font-mono-data">
                        {sessionStats.map(s => (
                          <tr key={s.name} className="border-b border-[var(--border-card)] last:border-0 hover:bg-white/[0.02] transition-colors">
                            <td className="py-3 font-sans text-[var(--text-dark)] truncate">{s.name}</td>
                            <td className="py-3 text-right text-[var(--text-secondary)]">{s.count}</td>
                            <td className="py-3 text-right text-[var(--text-dark)]">{s.winRate.toFixed(1)}%</td>
                            <td className="py-3 text-right text-[var(--text-secondary)]">{s.avgR !== null ? `${s.avgR > 0 ? '+' : ''}${s.avgR.toFixed(2)}R` : '—'}</td>
                            <td className={`py-3 text-right ${s.totalPnl >= 0 ? 'text-[var(--color-profit)]' : 'text-[var(--color-loss)]'}`}>{formatCurrency(s.totalPnl)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
                <p className="text-xs text-[var(--text-secondary)] mt-6 font-medium">Sessions use trade entry time. A consistently negative session is usually worth cutting entirely.</p>
              </div>

              {/* R-Multiple Distribution */}
              <div className="glass-panel rounded-2xl p-6 md:p-8 border border-[var(--border-card)] flex flex-col">
                <div className="flex items-center gap-2.5 mb-6">
                  <Target size={18} className="text-[var(--text-accent)]" />
                  <h2 className="text-base font-bold uppercase tracking-wider text-[var(--text-dark)]">R-Multiple Distribution</h2>
                </div>
                
                {rDistributionData.stats.rCount > 0 ? (
                  <>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6 pb-6 border-b border-[var(--border-card)]">
                      <div>
                        <p className="text-[11px] font-bold uppercase tracking-wider text-[var(--text-secondary)] mb-1">Expectancy</p>
                        <p className={`text-base font-bold font-mono-data ${rDistributionData.stats.expectancy >= 0 ? 'text-[var(--color-profit)]' : 'text-[var(--color-loss)]'}`}>
                          {rDistributionData.stats.expectancy > 0 ? '+' : ''}{rDistributionData.stats.expectancy.toFixed(2)}R
                        </p>
                      </div>
                      <div>
                        <p className="text-[11px] font-bold uppercase tracking-wider text-[var(--text-secondary)] mb-1">Avg Winner</p>
                        <p className="text-base font-bold font-mono-data text-[var(--color-profit)]">+{rDistributionData.stats.avgWinR.toFixed(2)}R</p>
                      </div>
                      <div>
                        <p className="text-[11px] font-bold uppercase tracking-wider text-[var(--text-secondary)] mb-1">Avg Loser</p>
                        <p className="text-base font-bold font-mono-data text-[var(--color-loss)]">{rDistributionData.stats.avgLossR.toFixed(2)}R</p>
                      </div>
                      <div>
                        <p className="text-[11px] font-bold uppercase tracking-wider text-[var(--text-secondary)] mb-1">Has Stops</p>
                        <p className="text-base font-bold font-mono-data text-[var(--text-dark)]">
                          {((rDistributionData.stats.rCount / closedTrades.length) * 100).toFixed(0)}%
                        </p>
                      </div>
                    </div>
                    
                    {(rDistributionData.stats.totalLossCount > 0 && (rDistributionData.stats.badLossCount / rDistributionData.stats.totalLossCount) > 0.20) && (
                      <div className="mb-6 flex items-center gap-3 p-4 rounded-xl bg-[var(--bg-badge-loss)] border border-[var(--border-loss)] text-[var(--color-loss)] text-xs font-bold">
                        <AlertTriangle size={16} className="shrink-0" />
                        <p>{rDistributionData.stats.badLossCount} losses exceeded their planned stop. Cross-reference the "Ignored Stop Loss" tag.</p>
                      </div>
                    )}
                    
                    <div className="w-full h-[300px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={rDistributionData.bins} margin={{ top: 10, right: 20, left: 0, bottom: 40 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="var(--border-card)" vertical={false} />
                          <XAxis 
                            dataKey="name" 
                            tick={{ fill: 'var(--text-secondary)', fontSize: 10, fontFamily: "'Inter', sans-serif", fontWeight: 'bold' }}
                            axisLine={false}
                            tickLine={false}
                            angle={-45}
                            textAnchor="end"
                            dy={15}
                            dx={-5}
                          />
                          <YAxis 
                            tick={{ fill: 'var(--text-secondary)', fontSize: 11, fontFamily: "'JetBrains Mono', monospace", fontWeight: 'bold' }}
                            axisLine={false}
                            tickLine={false}
                            dx={-5}
                          />
                          <Tooltip 
                            cursor={{ fill: 'var(--border-card)', opacity: 0.5 }}
                            content={({ active, payload }) => {
                              if (active && payload && payload.length) {
                                return (
                                  <div className="px-4 py-3 bg-[var(--bg-card)] border border-[var(--border-card)] rounded-xl shadow-xl backdrop-blur-md">
                                    <p className="text-[11px] font-bold text-[var(--text-secondary)] uppercase tracking-widest">{payload[0].payload.name}</p>
                                    <p className="text-base font-bold font-mono-data text-[var(--text-dark)] mt-1">{payload[0].value} Trades</p>
                                  </div>
                                );
                              }
                              return null;
                            }} 
                          />
                          <Bar dataKey="count" radius={[6, 6, 0, 0]} animationDuration={1500}>
                            {rDistributionData.bins.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.isProfit ? 'var(--color-profit)' : 'var(--color-loss)'} opacity={0.85} />
                            ))}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </>
                ) : (
                  <div className="flex-1 flex flex-col items-center justify-center text-center py-16">
                    <Target size={36} className="text-[var(--text-secondary)] opacity-50 mb-3" />
                    <p className="text-sm font-bold text-[var(--text-secondary)]">Add stop prices to your trades<br/>to unlock risk-adjusted stats.</p>
                  </div>
                )}
              </div>
            </div>

          </>
        )}
      </div>
    </div>
  );
}
