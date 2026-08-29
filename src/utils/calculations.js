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

export const calcRR = (entry, stop, exit, direction) => {
  if (!entry || !stop || !exit) return null;
  const e = Number(entry);
  const s = Number(stop);
  const x = Number(exit);
  if (e === s) return null;
  
  let risk, profit;
  if (direction === 'Long') {
    risk = e - s;
    profit = x - e;
  } else {
    risk = s - e;
    profit = e - x;
  }
  
  if (risk <= 0) return null; // Invalid stop
  return (profit / risk).toFixed(2);
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

/* ═══════════════════════════════════════════════
   RISK-ADJUSTED METRICS
   ═══════════════════════════════════════════════ */

/**
 * R-multiple: P&L expressed in units of planned risk.
 * +2R means the trade made twice what it risked. Returns null when
 * the trade has no stop recorded (older trades) — callers must handle null.
 */
export const calcRMultiple = (trade) => {
  if (!trade || trade.isOpen) return null;
  if (trade.stopPrice === null || trade.stopPrice === undefined || trade.stopPrice === '') return null;
  const entry = Number(trade.entryPrice);
  const stop = Number(trade.stopPrice);
  const qty = Number(trade.qty);
  if (!Number.isFinite(entry) || !Number.isFinite(stop) || !Number.isFinite(qty)) return null;

  const riskPerShare = Math.abs(entry - stop);
  if (riskPerShare === 0 || qty === 0) return null;

  const assetMult = getAssetMultiplier(trade.assetClass, trade.tickMultiplier);
  const totalRisk = riskPerShare * qty * assetMult;
  if (totalRisk === 0) return null;

  return (trade.netPnl ?? 0) / totalRisk;
};

/** Planned dollar risk at entry. Null if no stop. */
export const calcPlannedRisk = (trade) => {
  if (!trade || trade.stopPrice === null || trade.stopPrice === undefined || trade.stopPrice === '') return null;
  const riskPerShare = Math.abs(Number(trade.entryPrice) - Number(trade.stopPrice));
  const assetMult = getAssetMultiplier(trade.assetClass, trade.tickMultiplier);
  const risk = riskPerShare * Number(trade.qty) * assetMult;
  return Number.isFinite(risk) ? risk : null;
};

/**
 * Validates a stop against direction. Returns an error string or null.
 * A long's stop must sit below entry; a short's above.
 */
export const validateStop = (entryPrice, stopPrice, direction) => {
  if (stopPrice === '' || stopPrice === null || stopPrice === undefined) return null;
  const e = Number(entryPrice), s = Number(stopPrice);
  if (!Number.isFinite(e) || !Number.isFinite(s)) return null;
  if (e === s) return 'Stop cannot equal entry';
  if (direction === 'Long' && s > e) return 'Long stop must be below entry';
  if (direction === 'Short' && s < e) return 'Short stop must be above entry';
  return null;
};

/* ═══════════════════════════════════════════════
   SESSION BUCKETING (US equities, exchange local time)
   ═══════════════════════════════════════════════ */

export const SESSIONS = [
  'Open 9:30–10:30',
  'Morning 10:30–12',
  'Midday 12–2',
  'Afternoon 2–3',
  'Power Hour 3–4',
  'Extended / Other',
];

/** Buckets an 'HH:MM' or 'HH:MM:SS' string into a trading session. */
export const getSession = (time) => {
  if (!time || typeof time !== 'string') return 'Extended / Other';
  const [h, m] = time.split(':').map(Number);
  if (!Number.isFinite(h) || !Number.isFinite(m)) return 'Extended / Other';
  const mins = h * 60 + m;
  if (mins < 570 || mins >= 960) return 'Extended / Other'; // outside 9:30–16:00
  if (mins < 630) return 'Open 9:30–10:30';
  if (mins < 720) return 'Morning 10:30–12';
  if (mins < 840) return 'Midday 12–2';
  if (mins < 900) return 'Afternoon 2–3';
  return 'Power Hour 3–4';
};

/* ═══════════════════════════════════════════════
   GROUPING
   ═══════════════════════════════════════════════ */

/**
 * Groups closed trades by a key function and computes stats per group.
 * Returns [{ name, count, totalPnl, winRate, avgR, avgPnl }]
 */
export const groupTradeStats = (trades, keyFn) => {
  const closed = trades.filter(t => !t.isOpen && t.netPnl !== null && t.netPnl !== undefined);
  const buckets = {};
  closed.forEach(t => {
    const keys = keyFn(t);
    (Array.isArray(keys) ? keys : [keys]).forEach(k => {
      if (k === null || k === undefined) return;
      (buckets[k] = buckets[k] || []).push(t);
    });
  });

  return Object.entries(buckets).map(([name, arr]) => {
    const wins = arr.filter(t => t.netPnl > 0);
    const totalPnl = arr.reduce((s, t) => s + t.netPnl, 0);
    const rs = arr.map(calcRMultiple).filter(r => r !== null);
    return {
      name,
      count: arr.length,
      totalPnl,
      avgPnl: arr.length ? totalPnl / arr.length : 0,
      winRate: arr.length ? (wins.length / arr.length) * 100 : 0,
      avgR: rs.length ? rs.reduce((a, b) => a + b, 0) / rs.length : null,
      rCount: rs.length,
    };
  });
};

/** Flattens the { date: Trade[] } map into a chronologically sorted array. */
export const flattenTrades = (allTrades) => {
  const list = [];
  Object.entries(allTrades || {}).forEach(([date, trades]) => {
    (trades || []).forEach(t => list.push({ ...t, date: t.date || date }));
  });
  return list.sort((a, b) =>
    `${a.date}T${a.time || '00:00:00'}`.localeCompare(`${b.date}T${b.time || '00:00:00'}`)
  );
};

/* ═══════════════════════════════════════════════
   POSITION SIZING
   ═══════════════════════════════════════════════ */

export const calcPositionSize = ({ accountSize, riskPercent, entryPrice, stopPrice, assetClass, tickMultiplier }) => {
  const acct = Number(accountSize), pct = Number(riskPercent);
  const entry = Number(entryPrice), stop = Number(stopPrice);
  if (![acct, pct, entry, stop].every(Number.isFinite)) return null;

  const riskAmount = acct * (pct / 100);
  const perShare = Math.abs(entry - stop) * getAssetMultiplier(assetClass, tickMultiplier);
  if (perShare <= 0) return null;

  const shares = Math.floor(riskAmount / perShare);
  return {
    riskAmount,
    riskPerShare: perShare,
    shares,
    positionValue: shares * entry * getAssetMultiplier(assetClass, tickMultiplier),
    percentOfAccount: acct ? (shares * entry * getAssetMultiplier(assetClass, tickMultiplier)) / acct * 100 : 0,
  };
};

/**
 * Kelly fraction from win rate and payoff ratio.
 * p = win probability (0–1), b = avg win / avg loss.
 * Returns 0 when the inputs imply no edge.
 */
export const calcKelly = (p, b) => {
  if (!Number.isFinite(p) || !Number.isFinite(b) || b <= 0) return 0;
  const k = p - (1 - p) / b;
  return k > 0 ? k : 0;
};

