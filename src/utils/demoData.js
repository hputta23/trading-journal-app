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
      exitPrice: Number(exitPrice.toFixed(2)),
      qty,
      fees,
      strategy: strategies[Math.floor(Math.random() * strategies.length)],
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
