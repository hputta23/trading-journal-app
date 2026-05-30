// ═══════════════════════════════════════════════
//  TradeOS Gamification Engine
// ═══════════════════════════════════════════════

const RANKS = [
  { rank: 'ROOKIE',  tier: 1, min: 0,    pfMin: 0,   wrMin: 0,  color: '#94a3b8', glow: 'rgba(148,163,184,0.25)', icon: '🎯', xpTarget: 5000  },
  { rank: 'TRADER',  tier: 2, min: 50,   pfMin: 0,   wrMin: 0,  color: '#64d2ff', glow: 'rgba(100,210,255,0.25)', icon: '📈', xpTarget: 15000 },
  { rank: 'PRO',     tier: 3, min: 200,  pfMin: 1.5, wrMin: 52, color: '#00e676', glow: 'rgba(0,230,118,0.3)',    icon: '⚡', xpTarget: 40000 },
  { rank: 'ELITE',   tier: 4, min: 500,  pfMin: 2.0, wrMin: 57, color: '#facc15', glow: 'rgba(250,204,21,0.3)',   icon: '🏆', xpTarget: 100000},
  { rank: 'LEGEND',  tier: 5, min: 1000, pfMin: 2.5, wrMin: 62, color: '#ff6b35', glow: 'rgba(255,107,53,0.35)', icon: '🔥', xpTarget: 999999},
];

export const calcTraderRank = (stats) => {
  const { totalTrades = 0, profitFactor = 0, winRate = 0 } = stats;
  let current = RANKS[0];
  for (const r of RANKS) {
    if (totalTrades >= r.min && profitFactor >= r.pfMin && winRate >= r.wrMin) {
      current = r;
    }
  }
  return current;
};

export const calcXP = (stats) => {
  const { totalTrades = 0, winRate = 0 } = stats;
  const wins = Math.round((winRate / 100) * totalTrades);
  const losses = totalTrades - wins;
  return wins * 150 + losses * 50;
};

export const calcStreak = (allTrades) => {
  // Build daily P&L map
  const dailyMap = {};
  Object.entries(allTrades).forEach(([date, trades]) => {
    const closed = trades.filter(t => !t.isOpen && t.netPnl !== null);
    if (closed.length > 0) {
      dailyMap[date] = closed.reduce((s, t) => s + t.netPnl, 0);
    }
  });

  const today = new Date();
  let streak = 0;
  for (let i = 0; i <= 365; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    const ds = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
    if (dailyMap[ds] !== undefined) {
      if (dailyMap[ds] > 0) {
        streak++;
      } else {
        break; // loss day breaks streak
      }
    }
    // Skip days with no activity (weekends etc.) only if streak hasn't started yet
    if (streak === 0 && i > 3) break;
  }
  return streak;
};

export const getAchievements = (stats, bestDayPnl, streak) => {
  const { totalTrades = 0, winRate = 0, profitFactor = 0, totalNetPnl = 0 } = stats;
  return [
    {
      id: 'first_trade',
      name: 'First Blood',
      desc: 'Executed your first trade',
      icon: '🩸',
      unlocked: totalTrades >= 1,
    },
    {
      id: 'ten_trades',
      name: 'Getting Started',
      desc: '10 trades completed',
      icon: '🚀',
      unlocked: totalTrades >= 10,
    },
    {
      id: 'century',
      name: 'Century Club',
      desc: '100 trades milestone',
      icon: '💯',
      unlocked: totalTrades >= 100,
    },
    {
      id: 'win_streak_5',
      name: 'Hot Streak',
      desc: '5 consecutive profit days',
      icon: '🔥',
      unlocked: streak >= 5,
    },
    {
      id: 'win_rate_60',
      name: 'Sharp Shooter',
      desc: 'Win rate above 60%',
      icon: '🎯',
      unlocked: winRate >= 60,
    },
    {
      id: 'profit_factor_2',
      name: 'Alpha Trader',
      desc: 'Profit factor above 2.0',
      icon: '⚡',
      unlocked: profitFactor >= 2.0,
    },
    {
      id: 'profitable',
      name: 'In The Green',
      desc: 'Overall profitable account',
      icon: '💚',
      unlocked: totalNetPnl > 0,
    },
    {
      id: 'big_day',
      name: 'Big Day',
      desc: 'Single day profit over $1,000',
      icon: '💰',
      unlocked: bestDayPnl >= 1000,
    },
  ];
};
