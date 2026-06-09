export const getDirectionMultiplier = (direction) => direction === 'Long' ? 1 : -1;

export const getAssetMultiplier = (assetClass, tickMultiplier) => {
  switch (assetClass) {
    case 'Option': return 100;
    case 'Future': return Number(tickMultiplier) || 1;
    default: return 1;
  }
};

export const calcGrossPnl = (entry, exit, qty, direction, assetClass, tickMultiplier) => {
  if (exit === null || exit === undefined || exit === '') return null;
  const e = Number(entry);
  const x = Number(exit);
  const q = Number(qty);
  const dirMult = getDirectionMultiplier(direction);
  const assetMult = getAssetMultiplier(assetClass, tickMultiplier);
  return (x - e) * q * dirMult * assetMult;
};

export const calcNetPnl = (grossPnl, fees) => {
  if (grossPnl === null) return null;
  return grossPnl - Number(fees || 0);
};

export const calcDailyStats = (trades) => {
  const closedTrades = trades.filter(t => !t.isOpen && t.netPnl !== null);
  if (closedTrades.length === 0) {
    return {
      totalNetPnl: 0,
      winRate: 0,
      totalTrades: 0,
      avgWin: 0,
      avgLoss: 0,
      largestWin: 0,
      largestLoss: 0,
      profitFactor: 0,
    };
  }
  const winners = closedTrades.filter(t => t.netPnl > 0);
  const losers = closedTrades.filter(t => t.netPnl < 0);
  const totalNetPnl = closedTrades.reduce((s, t) => s + t.netPnl, 0);
  const winRate = closedTrades.length > 0 ? (winners.length / closedTrades.length) * 100 : 0;
  const avgWin = winners.length > 0 ? winners.reduce((s, t) => s + t.netPnl, 0) / winners.length : 0;
  const avgLoss = losers.length > 0 ? losers.reduce((s, t) => s + t.netPnl, 0) / losers.length : 0;
  const largestWin = winners.length > 0 ? Math.max(...winners.map(t => t.netPnl)) : 0;
  const largestLoss = losers.length > 0 ? Math.min(...losers.map(t => t.netPnl)) : 0;
  const grossWins = winners.reduce((s, t) => s + t.netPnl, 0);
  const grossLosses = Math.abs(losers.reduce((s, t) => s + t.netPnl, 0));
  const profitFactor = grossLosses > 0 ? grossWins / grossLosses : grossWins > 0 ? Infinity : 0;
  return { totalNetPnl, winRate, totalTrades: closedTrades.length, avgWin, avgLoss, largestWin, largestLoss, profitFactor };
};

export const calcMaxDrawdown = (closedTrades) => {
  if (closedTrades.length === 0) return 0;
  let peak = 0;
  let maxDD = 0;
  let currentEquity = 0;
  
  // Sort trades by date + time to make sure they are chronological
  const sorted = [...closedTrades].sort((a, b) => {
    const dateTimeA = `${a.date}T${a.time || '00:00:00'}`;
    const dateTimeB = `${b.date}T${b.time || '00:00:00'}`;
    return new Date(dateTimeA) - new Date(dateTimeB);
  });

  for (const t of sorted) {
    currentEquity += (t.netPnl || 0);
    if (currentEquity > peak) {
      peak = currentEquity;
    }
    const dd = peak - currentEquity;
    if (dd > maxDD) {
      maxDD = dd;
    }
  }
  return maxDD;
};

export const formatCurrency = (val) => {
  if (val === null || val === undefined) return '—';
  if (val === 0) return '$0.00';
  const isNeg = val < 0;
  const numStr = Math.abs(val).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  return isNeg ? `-$${numStr}` : `+$${numStr}`;
};

export const formatPercent = (val) => {
  if (val === null || val === undefined) return '—';
  return `${val.toFixed(1)}%`;
};

export const formatNumber = (val) => {
  if (val === null || val === undefined) return '—';
  return Number(val).toLocaleString('en-US');
};

