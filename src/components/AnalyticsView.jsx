import { useMemo } from 'react';
import { Target, TrendingUp, Activity, BarChart3, AlertTriangle } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine, BarChart, Bar, Cell } from 'recharts';
import { formatCurrency, formatPercent } from '../utils/calculations';

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    const val = payload[0].value;
    return (
      <div className="px-4 py-3 bg-[var(--bg-card)] border border-[var(--border-card)] rounded-lg shadow-xl backdrop-blur-md">
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

  return (
    <div className="h-full w-full overflow-y-auto bg-[var(--bg-app)] pb-12">
      
      {/* ── HEADER ── */}
      <div className="p-6 md:p-8 border-b border-[var(--border-card)]">
        <h1 className="text-2xl font-bold text-[var(--text-dark)] flex items-center gap-3 tracking-tight">
          <Activity className="text-[var(--text-accent)]" />
          Institutional Analytics
        </h1>
        <p className="text-sm text-[var(--text-secondary)] mt-1 font-medium">Advanced performance metrics and equity curve analysis.</p>
      </div>

      <div className="p-6 md:p-8 max-w-[1600px] mx-auto space-y-8">
        
        {!hasData ? (
          <div className="py-20 text-center flex flex-col items-center justify-center glass-panel">
            <BarChart3 size={48} className="text-[var(--text-secondary)] opacity-50 mb-4" />
            <p className="text-lg font-bold text-[var(--text-secondary)]">Insufficient Data</p>
            <p className="text-sm text-[var(--text-secondary)] mt-2">Log trades to generate equity curves and distributions.</p>
          </div>
        ) : (
          <>
            {/* ── KPI ROW ── */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4">
              <div className="glass-panel p-5 border border-[var(--border-card)]">
                <p className="text-[11px] font-bold text-[var(--text-secondary)] uppercase tracking-widest mb-2">Net Equity</p>
                <p className={`text-xl font-black font-mono-data ${currentEquity >= 0 ? 'text-[var(--color-profit)]' : 'text-[var(--color-loss)]'}`}>
                  {formatCurrency(currentEquity)}
                </p>
              </div>
              <div className="glass-panel p-5 border border-[var(--border-card)]">
                <p className="text-[11px] font-bold text-[var(--text-secondary)] uppercase tracking-widest mb-2">Max Drawdown</p>
                <p className="text-xl font-black font-mono-data text-[var(--color-loss)]">
                  {formatCurrency(maxHistoricalDrawdown)}
                </p>
              </div>
              <div className="glass-panel p-5 border border-[var(--border-card)]">
                <p className="text-[11px] font-bold text-[var(--text-secondary)] uppercase tracking-widest mb-2">Win Rate</p>
                <p className="text-xl font-black font-mono-data text-[var(--text-dark)]">
                  {formatPercent(statsSummary.winRate)}
                </p>
              </div>
              <div className="glass-panel p-5 border border-[var(--border-card)]">
                <p className="text-[11px] font-bold text-[var(--text-secondary)] uppercase tracking-widest mb-2">Profit Factor</p>
                <p className="text-xl font-black font-mono-data text-[var(--text-dark)]">
                  {statsSummary.profitFactor === Infinity ? '∞' : statsSummary.profitFactor.toFixed(2)}
                </p>
              </div>
              <div className="glass-panel p-5 border border-[var(--border-card)]">
                <p className="text-[11px] font-bold text-[var(--text-secondary)] uppercase tracking-widest mb-2">Trade Expectancy</p>
                <p className={`text-xl font-black font-mono-data ${statsSummary.expectancy >= 0 ? 'text-[var(--color-profit)]' : 'text-[var(--color-loss)]'}`}>
                  {formatCurrency(statsSummary.expectancy)}
                </p>
              </div>
              <div className="glass-panel p-5 border border-[var(--border-card)]">
                <p className="text-[11px] font-bold text-[var(--text-secondary)] uppercase tracking-widest mb-2">Total Trades</p>
                <p className="text-xl font-black font-mono-data text-[var(--text-dark)]">
                  {statsSummary.totalTrades}
                </p>
              </div>
            </div>

            {/* ── EQUITY CURVE CHART ── */}
            <div className="glass-panel rounded p-6 border border-[var(--border-card)]">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-sm font-bold uppercase tracking-widest text-[var(--text-dark)] flex items-center gap-2">
                  <TrendingUp size={16} className="text-[var(--color-cyan)]" />
                  Cumulative Equity Curve
                </h2>
                {currentDrawdown < 0 && (
                  <div className="flex items-center gap-1.5 px-3 py-1 rounded bg-[var(--bg-badge-loss)] border border-[var(--border-loss)]">
                    <AlertTriangle size={12} className="text-[var(--color-loss)]" />
                    <span className="text-[10px] font-bold uppercase tracking-widest text-[var(--color-loss)]">
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

            {/* ── DISTRIBUTIONS ── */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              
              {/* Size Distribution */}
              <div className="glass-panel rounded p-6 border border-[var(--border-card)]">
                <div className="flex items-center gap-2 mb-6">
                  <BarChart3 size={16} className="text-[var(--text-accent)]" />
                  <h2 className="text-sm font-bold uppercase tracking-widest text-[var(--text-dark)]">P&L Distribution</h2>
                </div>
                
                <div className="w-full h-[250px]">
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
                              <div className="px-3 py-2 bg-[var(--bg-card)] border border-[var(--border-card)] rounded shadow-lg backdrop-blur-md">
                                <p className="text-[10px] font-bold text-[var(--text-secondary)] uppercase">{payload[0].payload.name}</p>
                                <p className="text-sm font-bold font-mono-data text-[var(--text-dark)]">{payload[0].value} Trades</p>
                              </div>
                            );
                          }
                          return null;
                        }} 
                      />
                      <Bar dataKey="count" radius={[4, 4, 0, 0]} animationDuration={1500}>
                        {distributionData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.isProfit ? 'var(--color-profit)' : 'var(--color-loss)'} opacity={0.8} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Advanced Metrics Table */}
              <div className="glass-panel rounded p-6 border border-[var(--border-card)]">
                <div className="flex items-center gap-2 mb-6">
                  <Target size={16} className="text-[var(--text-accent)]" />
                  <h2 className="text-sm font-bold uppercase tracking-widest text-[var(--text-dark)]">Performance Matrix</h2>
                </div>
                
                <div className="space-y-4">
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
          </>
        )}
      </div>
    </div>
  );
}
