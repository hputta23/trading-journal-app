import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Cell, ReferenceLine } from 'recharts';
import { TrendingUp, BarChart3 } from 'lucide-react';

const fontStyle = { fontFamily: "'JetBrains Mono', monospace" };

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="px-3 py-2 border text-xs" style={{ background: '#0f1117', borderColor: '#1e2433', ...fontStyle }}>
        <p className="text-[0.625rem] mb-0.5" style={{ color: '#3d4560' }}>Trade #{label}</p>
        <p className="font-bold" style={{ color: payload[0].value >= 0 ? '#00ff88' : '#ff3b5c' }}>
          {payload[0].value >= 0 ? '+' : ''}${payload[0].value.toFixed(2)}
        </p>
      </div>
    );
  }
  return null;
};

const BarTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    return (
      <div className="px-3 py-2 border text-xs" style={{ background: '#0f1117', borderColor: '#1e2433', ...fontStyle }}>
        <p className="text-[0.625rem] mb-0.5" style={{ color: '#c8d0e0' }}>{payload[0].payload.ticker}</p>
        <p className="font-bold" style={{ color: payload[0].value >= 0 ? '#00ff88' : '#ff3b5c' }}>
          {payload[0].value >= 0 ? '+' : ''}${payload[0].value.toFixed(2)}
        </p>
      </div>
    );
  }
  return null;
};

const EmptyState = ({ icon: Icon, text }) => (
  <div className="flex flex-col items-center justify-center h-full gap-3 py-16">
    <Icon size={20} style={{ color: '#1e2433' }} />
    <p className="text-[0.625rem] tracking-[0.2em] uppercase" style={{ color: '#2a3040', ...fontStyle }}>
      {text}
    </p>
  </div>
);

export default function DashboardCharts({ trades }) {
  const closedTrades = trades.filter(t => !t.isOpen && t.netPnl !== null);

  const equityData = closedTrades.reduce((acc, trade, idx) => {
    const prev = acc.length > 0 ? acc[acc.length - 1].cumPnl : 0;
    acc.push({ trade: idx + 1, cumPnl: Number((prev + trade.netPnl).toFixed(2)) });
    return acc;
  }, []);

  const tickerMap = {};
  closedTrades.forEach(t => {
    if (!tickerMap[t.ticker]) tickerMap[t.ticker] = 0;
    tickerMap[t.ticker] += t.netPnl;
  });
  const tickerData = Object.entries(tickerMap)
    .map(([ticker, pnl]) => ({ ticker, pnl: Number(pnl.toFixed(2)) }))
    .sort((a, b) => b.pnl - a.pnl);

  const tickFontStyle = { fill: '#3d4560', fontSize: 9, fontFamily: 'JetBrains Mono' };
  const axisStyle = { stroke: '#1e2433' };

  return (
    <div className="flex flex-col h-full p-4 gap-4" style={{ background: '#0f1117', ...fontStyle }}>
      {/* Equity Curve */}
      <div className="flex-1 min-h-[220px]">
        <div className="flex items-center gap-2 mb-2">
          <TrendingUp size={11} color="#00d4ff" />
          <span className="text-[0.625rem] uppercase tracking-widest font-medium" style={{ color: '#3d4560' }}>Equity Curve</span>
        </div>
        <div className="border p-2 h-[calc(100%-24px)]" style={{ borderColor: '#1e2433', background: '#0a0a0f' }}>
          {equityData.length === 0 ? (
            <EmptyState icon={TrendingUp} text="Awaiting first trade data..." />
          ) : (
            <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
              <LineChart data={equityData} margin={{ top: 8, right: 8, left: 0, bottom: 4 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#141822" />
                <XAxis dataKey="trade" tick={tickFontStyle} axisLine={axisStyle} tickLine={axisStyle} />
                <YAxis tick={tickFontStyle} axisLine={axisStyle} tickLine={axisStyle} width={50} />
                <Tooltip content={<CustomTooltip />} />
                <ReferenceLine y={0} stroke="#1e2433" strokeDasharray="3 3" />
                <Line
                  type="monotone"
                  dataKey="cumPnl"
                  stroke="#00d4ff"
                  strokeWidth={2}
                  dot={{ fill: '#00d4ff', r: 3, strokeWidth: 0 }}
                  activeDot={{ fill: '#00d4ff', r: 5, strokeWidth: 2, stroke: '#0a0a0f' }}
                />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* P&L by Ticker */}
      <div className="flex-1 min-h-[220px]">
        <div className="flex items-center gap-2 mb-2">
          <BarChart3 size={11} color="#00d4ff" />
          <span className="text-[0.625rem] uppercase tracking-widest font-medium" style={{ color: '#3d4560' }}>P&L by Ticker</span>
        </div>
        <div className="border p-2 h-[calc(100%-24px)]" style={{ borderColor: '#1e2433', background: '#0a0a0f' }}>
          {tickerData.length === 0 ? (
            <EmptyState icon={BarChart3} text="No ticker data yet..." />
          ) : (
            <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
              <BarChart data={tickerData} margin={{ top: 8, right: 8, left: 0, bottom: 4 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#141822" />
                <XAxis dataKey="ticker" tick={{ ...tickFontStyle, fill: '#c8d0e0' }} axisLine={axisStyle} tickLine={axisStyle} />
                <YAxis tick={tickFontStyle} axisLine={axisStyle} tickLine={axisStyle} width={50} />
                <Tooltip content={<BarTooltip />} />
                <ReferenceLine y={0} stroke="#1e2433" />
                <Bar dataKey="pnl" maxBarSize={36}>
                  {tickerData.map((entry, index) => (
                    <Cell key={index} fill={entry.pnl >= 0 ? '#00ff88' : '#ff3b5c'} opacity={0.85} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>
    </div>
  );
}
