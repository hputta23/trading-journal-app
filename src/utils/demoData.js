import { v4 as uuidv4 } from 'uuid';

export const generateDemoTrades = () => {
  const trades = {};
  const today = new Date();
  
  const assets = ['Stock', 'Option', 'Future'];
  const directions = ['Long', 'Short'];
  const strategies = ['Breakout', 'Mean Reversion', 'Trend Following'];
  const mistakes = [
    'None / Plan Followed',
    'None / Plan Followed', // weight it heavily
    'None / Plan Followed',
    'FOMO / Chasing',
    'Sloppy Entry / Bad Fill',
    'Early Exit / Panicked',
    'Held Too Long / Hoped',
    'Ignored Stop Loss',
  ];

  for (let i = 0; i < 45; i++) {
    // Generate dates over the last 30 days
    const d = new Date(today.getTime() - Math.floor(Math.random() * 30) * 24 * 60 * 60 * 1000);
    const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    
    if (!trades[dateStr]) trades[dateStr] = [];

    const isWin = Math.random() > 0.45; // ~55% win rate
    const assetClass = assets[Math.floor(Math.random() * assets.length)];
    const direction = directions[Math.floor(Math.random() * directions.length)];
    
    const entryPrice = Number((Math.random() * 200 + 10).toFixed(2));
    const qty = Math.floor(Math.random() * 200) + 50;
    
    // Simulate R-multiples and stop losses
    const riskAmount = entryPrice * 0.05; // 5% risk per trade roughly
    let stopPrice = direction === 'Long' ? entryPrice - riskAmount : entryPrice + riskAmount;
    
    let exitPrice;
    let mistake = mistakes[Math.floor(Math.random() * mistakes.length)];
    
    if (mistake === 'Ignored Stop Loss') {
      // bad loss
      exitPrice = direction === 'Long' ? entryPrice - (riskAmount * (1.5 + Math.random())) : entryPrice + (riskAmount * (1.5 + Math.random()));
    } else if (isWin) {
      exitPrice = direction === 'Long' ? entryPrice + (riskAmount * (1 + Math.random() * 2)) : entryPrice - (riskAmount * (1 + Math.random() * 2));
    } else {
      exitPrice = direction === 'Long' ? entryPrice - (riskAmount * Math.random()) : entryPrice + (riskAmount * Math.random());
    }

    const tickMultiplier = assetClass === 'Future' ? (Math.random() > 0.5 ? 50 : 20) : 1;
    
    let grossPnl = (exitPrice - entryPrice) * qty * tickMultiplier;
    if (direction === 'Short') grossPnl *= -1;
    
    const fees = Number((Math.random() * 5 + 1).toFixed(2));
    const netPnl = grossPnl - fees;

    // Time: random between 09:30 and 16:00
    const hour = Math.floor(Math.random() * 6) + 9;
    const min = Math.floor(Math.random() * 60);
    const timeStr = `${String(hour).padStart(2, '0')}:${String(min).padStart(2, '0')}:00`;

    trades[dateStr].push({
      id: uuidv4(),
      date: dateStr,
      time: timeStr,
      ticker: `SYM${Math.floor(Math.random() * 100)}`,
      direction,
      assetClass,
      tickMultiplier,
      entryPrice: Number(entryPrice.toFixed(2)),
      stopPrice: Number(stopPrice.toFixed(2)),
      targetPrice: Number((direction === 'Long' ? entryPrice + (riskAmount * 2) : entryPrice - (riskAmount * 2)).toFixed(2)),
      exitPrice: Number(exitPrice.toFixed(2)),
      qty,
      fees,
      strategy: strategies[Math.floor(Math.random() * strategies.length)],
      tags: ['#demo', isWin ? '#winner' : '#loser', mistake === 'None / Plan Followed' ? '#disciplined' : '#mistake'],
      notes: 'Demo trade auto-generated.',
      mistake,
      imageUrl: '',
      grossPnl: Number(grossPnl.toFixed(2)),
      netPnl: Number(netPnl.toFixed(2)),
      netPnlOverride: null,
      isOpen: false,
      isSynced: true,
      createdAt: new Date().toISOString()
    });
  }

  return trades;
};

export const generateDemoJournals = (tradesMap) => {
  const journals = {};
  const dates = Object.keys(tradesMap).sort((a, b) => new Date(a) - new Date(b));
  
  let currentBalance = 100000; // Starting capital

  dates.forEach(date => {
    // Add up netPnl for the day to update balance
    const dailyNetPnl = tradesMap[date].reduce((sum, t) => sum + (t.netPnl || 0), 0);
    currentBalance += dailyNetPnl;

    // Generate a journal for about 70% of traded days
    const hasJournal = Math.random() > 0.3;
    
    journals[date] = {
      accountBalance: currentBalance, // Populate capital tracking
      ...(hasJournal ? {
        grade: ['A+', 'A', 'B', 'C', 'D', 'F'][Math.floor(Math.random() * 6)],
        discipline: Math.floor(Math.random() * 5) + 1,
        mood: ['Focused', 'Calm', 'Tired', 'Anxious', 'Frustrated'][Math.floor(Math.random() * 5)],
        marketConditions: ['Trending', 'Choppy', 'Volatile', 'Slow'][Math.floor(Math.random() * 4)],
        keyLevels: 'SPY: 545 support\nQQQ: 460 key resistance level\nNVDA: Watch VWAP bounce',
        watchlist: 'NVDA - Morning momentum\nAAPL - Gap fill play',
        preMarketPlan: '• Watch NVDA for morning breakout\n• Do not overtrade\n• Max 2 stop outs',
        whatWorked: '• Good patience on the first setup\n• Cut losers quickly',
        mistakes: Math.random() > 0.5 ? '• Chased one entry slightly' : '',
        postMarketReview: 'Overall a decent session. Followed my plan for the most part.',
        lessonsLearned: 'Patience pays off. Let the setups come to you.'
      } : {})
    };
  });
  
  return journals;
};

export const generateDemoPlaybooks = () => {
  return [
    {
      id: '1',
      name: 'Breakout Pullback',
      marketEnv: 'Trending Up, High Relative Volume',
      entryRules: '1. Wait for strong 5m candle breaking resistance.\n2. Wait for 1-2 candle pullback on lower volume.\n3. Enter as price breaks above previous 1m candle high.',
      exitRules: '1. Stop loss below the pullback low.\n2. Target 2R or scale out at next major resistance level.',
      imageUrl: ''
    },
    {
      id: '2',
      name: 'VWAP Bounce',
      marketEnv: 'Morning session (9:45am - 11:00am)',
      entryRules: '1. Stock has strong morning push.\n2. Pulls back slowly to VWAP.\n3. Form a hammer or bullish engulfing on VWAP.',
      exitRules: '1. Stop loss 1 ATR below VWAP.\n2. Sell 50% at high of day (HOD), trail remainder.',
      imageUrl: ''
    }
  ];
};

export const generateDemoWeeklyReviews = (tradesMap) => {
  const reviews = {};
  
  const getWeekStart = (dateStr) => {
    const d = new Date(dateStr);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    const monday = new Date(d.setDate(diff));
    return monday.toISOString().split('T')[0];
  };

  Object.keys(tradesMap).forEach(date => {
    const weekStart = getWeekStart(date);
    if (!reviews[weekStart]) {
      // Create a dummy review for this week
      reviews[weekStart] = {
        wentWell: 'Followed my stop losses strictly this week. Managed risk well on choppy days.',
        mistakes: 'Got chopped up on Wednesday trying to force trades in a tight range.',
        focus: 'Focus on higher quality setups and being patient for the right entry.'
      };
    }
  });

  return reviews;
};
