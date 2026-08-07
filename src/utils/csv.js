import { flattenTrades } from './calculations';

export const exportTradesToCSV = (allTrades) => {
  const flattened = flattenTrades(allTrades);
  
  if (flattened.length === 0) {
    alert("No trades to export.");
    return;
  }

  const headers = [
    'Date', 'Time', 'Ticker', 'Direction', 'Asset', 'Strategy',
    'Entry Price', 'Stop Price', 'Exit Price', 'Qty', 'Fees',
    'Gross P&L', 'Net P&L', 'Mistake', 'Notes'
  ];

  const escapeCSV = (str) => {
    if (str === null || str === undefined) return '';
    const s = String(str);
    if (s.includes(',') || s.includes('"') || s.includes('\n')) {
      return `"${s.replace(/"/g, '""')}"`;
    }
    return s;
  };

  const rows = flattened.map(t => [
    t.date,
    t.time || '',
    t.ticker,
    t.direction,
    t.assetClass,
    t.strategy || '',
    t.entryPrice,
    t.stopPrice || '',
    t.exitPrice || '',
    t.qty,
    t.fees || 0,
    t.grossPnl || 0,
    t.netPnl || 0,
    t.mistake || '',
    t.notes || ''
  ].map(escapeCSV).join(','));

  const csvContent = [headers.join(','), ...rows].join('\n');
  
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `trade_export_${new Date().toISOString().split('T')[0]}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};
