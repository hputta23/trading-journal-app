import { useState, useEffect, useCallback } from 'react';
import Header from './components/Header';
import SidebarStats from './components/SidebarStats';
import SettingsView from './components/SettingsView';
import DashboardView from './components/DashboardView';
import JournalView from './components/JournalView';
import TradesView from './components/TradesView';
import AnalyticsView from './components/AnalyticsView';
import CalendarView from './components/CalendarView';
import EntryForm from './components/EntryForm';

import { loadTrades, saveTrades, loadSettings, saveSettings, getDateKey } from './utils/storage';
import { calcDailyStats, formatCurrency } from './utils/calculations';
import { LayoutDashboard, FileText, TrendingUp, BarChart3, X } from 'lucide-react';

const fontStyle = { fontFamily: "'JetBrains Mono', monospace" };

// Generates 30 days of highly detailed dense historical data with at least 10 trades per day
const generateRichDemoData = (currentDate) => {
  const trades = {};
  const journals = {};
  const today = new Date();
  
  const tickers = ['NVDA', 'TSLA', 'SPY', 'AAPL', 'AMD', 'MSFT', 'QQQ', 'BTCUSD'];
  const strategies = ['Breakout', 'Reversal', 'Scalp', 'Momentum', 'Other'];
  const directions = ['Long', 'Short'];
  const assetClasses = ['Stock', 'Option', 'Future'];
  
  const mistakes = [
    'None / Plan Followed',
    'FOMO / Chasing',
    'Sloppy Entry / Bad Fill',
    'Early Exit / Panicked',
    'Held Too Long / Hoped',
    'Over-leveraged / Large Size',
    'Ignored Stop Loss',
    'Over-traded'
  ];

  const marketConds = ['range', 'trending-up', 'trending-down', 'choppy', 'volatile'];

  for (let i = 153; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    
    const y = d.getFullYear();
    const mStr = String(d.getMonth() + 1).padStart(2, '0');
    const dStr = String(d.getDate()).padStart(2, '0');
    const dateKey = `${y}-${mStr}-${dStr}`;

    // Generate at least 10 trades per day (10 to 14)
    const numTrades = 10 + Math.floor(Math.random() * 5);
    const dayTrades = [];
    let dayNetPnl = 0;

    for (let t = 0; t < numTrades; t++) {
      const ticker = tickers[Math.floor(Math.random() * tickers.length)];
      const direction = directions[Math.floor(Math.random() * directions.length)];
      const assetClass = assetClasses[Math.floor(Math.random() * assetClasses.length)];
      const strategy = strategies[Math.floor(Math.random() * strategies.length)];
      
      const entryPrice = parseFloat((100 + Math.random() * 300).toFixed(2));
      const isWin = Math.random() < 0.58;
      let exitPrice;
      let mistake = 'None / Plan Followed';

      if (isWin) {
        exitPrice = parseFloat((direction === 'Long' ? entryPrice * 1.028 : entryPrice * 0.972).toFixed(2));
      } else {
        exitPrice = parseFloat((direction === 'Long' ? entryPrice * 0.985 : entryPrice * 1.015).toFixed(2));
        if (Math.random() < 0.7) {
          mistake = mistakes[Math.floor(Math.random() * (mistakes.length - 1)) + 1];
        }
      }
      
      const qty = Math.floor(15 + Math.random() * 50) * (assetClass === 'Option' ? 2 : 5);
      const fees = parseFloat((2.50 + Math.random() * 4).toFixed(2));
      const dirMult = direction === 'Long' ? 1 : -1;
      const assetMult = assetClass === 'Option' ? 100 : 1;
      
      const grossPnl = parseFloat(((exitPrice - entryPrice) * qty * dirMult * assetMult).toFixed(2));
      const netPnl = parseFloat((grossPnl - fees).toFixed(2));
      dayNetPnl += netPnl;

      const entryHour = 9 + Math.floor(Math.random() * 6);
      const entryMin = String(Math.floor(Math.random() * 60)).padStart(2, '0');
      const entrySec = String(Math.floor(Math.random() * 60)).padStart(2, '0');
      const entryTime = `${String(entryHour).padStart(2, '0')}:${entryMin}:${entrySec}`;

      const exitHour = entryHour + (Math.random() < 0.6 ? 0 : 1);
      const exitMin = String(Math.floor(Math.random() * 60)).padStart(2, '0');
      const exitSec = String(Math.floor(Math.random() * 60)).padStart(2, '0');
      const exitTime = `${String(exitHour).padStart(2, '0')}:${exitMin}:${exitSec}`;

      dayTrades.push({
        id: `demo-${dateKey}-${t}`,
        date: dateKey,
        time: entryTime,
        exitTime: exitTime,
        ticker,
        direction,
        assetClass,
        tickMultiplier: 1,
        entryPrice,
        exitPrice,
        qty,
        fees,
        strategy,
        mistake,
        notes: isWin ? 'Target reached smoothly, solid structure.' : `Stopped out. Mistake: ${mistake}`,
        grossPnl,
        netPnl,
        isOpen: false,
        isSynced: true,
        createdAt: d.toISOString(),
      });
    }
    
    trades[dateKey] = dayTrades;

    const dayGrade = dayNetPnl > 600 ? 'A+' : dayNetPnl > 200 ? 'A' : dayNetPnl > 0 ? 'B+' : dayNetPnl > -100 ? 'B' : dayNetPnl > -300 ? 'C' : 'D';
    const dayMood = dayNetPnl > 400 ? 'confident' : dayNetPnl > 0 ? 'focused' : dayNetPnl > -200 ? 'neutral' : 'tilted';
    
    journals[dateKey] = {
      date: dateKey,
      grade: dayGrade,
      discipline: dayNetPnl > 0 ? Math.floor(Math.random() * 2) + 4 : Math.floor(Math.random() * 3) + 1,
      mood: dayMood,
      marketConditions: marketConds[Math.floor(Math.random() * marketConds.length)],
      preMarketPlan: `Checklists active. Pivot support levels loaded for tickers. Limit initial risk exposure.`,
      postMarketReview: `Standard day review. Realized Net: ${formatCurrency(dayNetPnl)}. Managed stop orders.`,
      lessonsLearned: dayNetPnl > 0 ? 'Patience paid off. Standard pullback trades worked well.' : 'Accept stops quickly. Do not hold positions past rules.',
      mistakes: dayNetPnl > 0 ? 'None' : 'Allowed size to creep beyond parameters.',
      whatWorked: dayNetPnl > 0 ? 'Trading at key daily VWAP curves.' : 'Cut loss on second reversal attempt.',
      updatedAt: d.toISOString()
    };
  }

  return { trades, journals };
};

import { supabase } from './utils/supabaseClient';
import AuthView from './components/AuthView';

export default function App() {
  const [session, setSession] = useState(null);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [currentDate, setCurrentDate] = useState(getDateKey());
  const [allTrades, setAllTrades] = useState({});
  const [settings, setSettings] = useState({ googleSheetId: '', quickEntry: false, theme: 'dark' });
  const [editingTrade, setEditingTrade] = useState(null);
  const [syncStatus, setSyncStatus] = useState(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showGlobalTradeModal, setShowGlobalTradeModal] = useState(false);

  // Auth Initialization
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Load data on mount
  useEffect(() => {
    if (!session) return;
    
    const fetchCloudData = async () => {
      const localTrades = loadTrades();
      
      try {
        const { data, error } = await supabase
          .from('user_data')
          .select('trades')
          .eq('user_id', session.user.id)
          .single();
          
        if (error) {
          console.error("Supabase fetch error (table might not exist):", error.message);
          // If table doesn't exist or row doesn't exist, fallback to local
          setAllTrades(localTrades);
          return;
        }
          
        if (data && data.trades && Object.keys(data.trades).length > 0) {
          setAllTrades(data.trades);
        } else {
          // New user row but no trades, preserve local
          const { error: insertErr } = await supabase.from('user_data').insert([{ user_id: session.user.id, trades: localTrades }]);
          if (insertErr) {
             console.error("Supabase insert error:", insertErr.message);
          }
          setAllTrades(localTrades);
        }
      } catch (err) {
        console.error("Exception fetching from Supabase:", err);
        setAllTrades(localTrades);
      }
    };
    
    fetchCloudData();
    const s = loadSettings();
    setSettings(s);
  }, [session]);

  // Sync to Cloud whenever allTrades changes
  useEffect(() => {
    if (!session || Object.keys(allTrades).length === 0) return;
    
    // Save locally first for fast offline fallback
    saveTrades(allTrades);
    
    // Then sync to Supabase
    const syncToCloud = async () => {
      try {
        await supabase
          .from('user_data')
          .update({ trades: allTrades, updated_at: new Date() })
          .eq('user_id', session.user.id);
      } catch (err) {
        console.error("Cloud sync failed:", err);
      }
    };
    syncToCloud();
  }, [allTrades, session]);

  // Apply theme to document element
  useEffect(() => {
    if (!session) {
      document.documentElement.setAttribute('data-theme', 'dark');
      return;
    }
    const currentTheme = settings.theme || 'dark';
    document.documentElement.setAttribute('data-theme', currentTheme);
  }, [settings.theme, session]);



  // Sync theme if Header toggle updates localStorage directly
  useEffect(() => {
    const handleStorageChange = () => {
      const s = loadSettings();
      setSettings(prev => prev.theme !== s.theme ? { ...prev, theme: s.theme } : prev);
    };
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  // Save trades helper
  const persistTrades = useCallback((updated) => {
    setAllTrades(updated);
    saveTrades(updated);
  }, []);

  // Load detailed historical mock data
  const handleLoadDemo = useCallback(() => {
    const { trades, journals } = generateRichDemoData(currentDate);
    setAllTrades(trades);
    saveTrades(trades);
    localStorage.setItem('trading-journal-entries', JSON.stringify(journals));
    setActiveTab('dashboard');
  }, [currentDate]);

  // Derived state for the active selected day
  const todayTrades = allTrades[currentDate] || [];
  const stats = calcDailyStats(todayTrades);

  // CRUD handlers
  const handleSubmitTrade = useCallback((trade) => {
    const dateKey = trade.date || currentDate;
    const updated = { ...allTrades };
    if (!updated[dateKey]) updated[dateKey] = [];
    const existingIdx = updated[dateKey].findIndex(t => t.id === trade.id);
    if (existingIdx >= 0) {
      updated[dateKey][existingIdx] = trade;
    } else {
      updated[dateKey].push(trade);
    }
    persistTrades(updated);
    setEditingTrade(null);
    setShowGlobalTradeModal(false);
  }, [allTrades, currentDate, persistTrades]);

  const handleDeleteTrade = useCallback((id) => {
    const updated = { ...allTrades };
    if (updated[currentDate]) {
      updated[currentDate] = updated[currentDate].filter(t => t.id !== id);
      if (updated[currentDate].length === 0) delete updated[currentDate];
    }
    persistTrades(updated);
  }, [allTrades, currentDate, persistTrades]);

  const handleEditTrade = useCallback((trade) => {
    setEditingTrade(trade);
    setShowGlobalTradeModal(true);
  }, []);

  const handleSaveSettings = useCallback((s) => { 
    setSettings(s); 
    saveSettings(s); 
  }, []);

  const handleToggleTheme = useCallback(() => {
    const nextTheme = settings.theme === 'dark' ? 'light' : 'dark';
    const updated = { ...settings, theme: nextTheme };
    setSettings(updated);
    saveSettings(updated);
  }, [settings]);

  // Sync to sheets mock
  const handleSync = useCallback(async () => {
    setSyncStatus('pending');
    try {
      const unsyncedTrades = [];
      const updatedAllTrades = { ...allTrades };
      Object.entries(updatedAllTrades).forEach(([date, trades]) => {
        trades.forEach((trade, idx) => {
          if (!trade.isSynced && !trade.isOpen) unsyncedTrades.push({ date, idx, trade });
        });
      });
      if (unsyncedTrades.length === 0) {
        setSyncStatus('success');
        setTimeout(() => setSyncStatus(null), 3000);
        return;
      }
      
      await new Promise(resolve => setTimeout(resolve, 1500));

      unsyncedTrades.forEach(({ date, idx }) => {
        if (updatedAllTrades[date]?.[idx]) {
          updatedAllTrades[date][idx] = { ...updatedAllTrades[date][idx], isSynced: true };
        }
      });
      persistTrades(updatedAllTrades);
      setSyncStatus('success');
      setTimeout(() => setSyncStatus(null), 3000);
    } catch {
      setSyncStatus('error');
      setTimeout(() => setSyncStatus(null), 5000);
    }
  }, [allTrades, persistTrades]);

  const handleSelectDateFromHeatmap = (date) => {
    setCurrentDate(date);
  };

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setMobileMenuOpen(false);
  };

  if (!session) {
    return <AuthView />;
  }

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden" style={{ background: 'var(--bg-app)' }}>
      
      {/* ── Top Header spanning 100% width (EXACTLY MATCHING IMAGE) ── */}
      <Header
        activeTab={activeTab}
        onTabChange={handleTabChange}
        onToggleMobileMenu={() => setMobileMenuOpen(!mobileMenuOpen)}
        theme={settings.theme}
        onToggleTheme={handleToggleTheme}
      />

      <div className="flex-1 flex min-h-0 w-full overflow-hidden">
        
        {/* ── Persistent Global Left Navigation & Session Stats Sidebar (Left Side on Desktop) ── */}
        <div className={`sidebar-left shrink-0 w-[255px] md:block ${mobileMenuOpen ? 'mobile-open' : 'hidden'}`}>
          <SidebarStats
            stats={stats}
            activeTab={activeTab}
            onTabChange={handleTabChange}
            onOpenNewTrade={() => { setEditingTrade(null); setShowGlobalTradeModal(true); setMobileMenuOpen(false); }}
            onSync={handleSync}
            syncStatus={syncStatus}
            onLoadDemo={() => { handleLoadDemo(); setMobileMenuOpen(false); }}
            userEmail={session.user.email}
          />
        </div>

        {/* ── Main View Panel Container (Right Side on Desktop) ── */}
        <div className="flex-1 overflow-y-auto min-h-0 bg-[var(--bg-app)] pb-16 md:pb-0">
          {activeTab === 'dashboard' && (
            <DashboardView
              allTrades={allTrades}
              onSubmitTrade={handleSubmitTrade}
              onEditTrade={handleEditTrade}
              onDeleteTrade={handleDeleteTrade}
              editingTrade={editingTrade}
              onCancelEdit={() => setEditingTrade(null)}
              onSelectDate={handleSelectDateFromHeatmap}
              onNavigateTab={handleTabChange}
            />
          )}

          {activeTab === 'journal' && (
            <JournalView
              currentDate={currentDate}
              todayTrades={todayTrades}
              onEditTrade={handleEditTrade}
            />
          )}

          {activeTab === 'trades' && (
            <TradesView
              allTrades={allTrades}
              onSubmitTrade={handleSubmitTrade}
              onEditTrade={handleEditTrade}
              onDeleteTrade={handleDeleteTrade}
              editingTrade={editingTrade}
              onCancelEdit={() => setEditingTrade(null)}
              quickEntry={settings.quickEntry}
            />
          )}

          {activeTab === 'analytics' && (
            <AnalyticsView
              allTrades={allTrades}
            />
          )}

          {activeTab === 'calendar' && (
            <CalendarView
              allTrades={allTrades}
            />
          )}

          {activeTab === 'settings' && (
            <SettingsView
              settings={settings}
              onSave={handleSaveSettings}
              onLoadDemo={() => { handleLoadDemo(); setMobileMenuOpen(false); }}
              userEmail={session.user.email}
            />
          )}
        </div>
      </div>

      {/* ── Mobile Tab Bar ── */}
      <div className="mobile-tab-bar">
        <button
          className={activeTab === 'dashboard' ? 'active' : ''}
          onClick={() => handleTabChange('dashboard')}
        >
          <LayoutDashboard size={15} />
          Dash
        </button>
        <button
          className={activeTab === 'journal' ? 'active' : ''}
          onClick={() => handleTabChange('journal')}
        >
          <FileText size={15} />
          Journal
        </button>
        <button
          className={activeTab === 'trades' ? 'active' : ''}
          onClick={() => handleTabChange('trades')}
        >
          <TrendingUp size={15} />
          Trades
        </button>
        <button
          className={activeTab === 'analytics' ? 'active' : ''}
          onClick={() => handleTabChange('analytics')}
        >
          <BarChart3 size={15} />
          Analysis
        </button>
      </div>

      {/* ── Global Log Trade Modal Overlay ── */}
      {showGlobalTradeModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-3xl border overflow-y-auto max-h-[90vh] glass-panel fade-in" style={{ borderColor: 'var(--border-card)' }}>
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b p-4 select-none shrink-0" style={{ borderColor: 'var(--border-card)', background: 'var(--bg-sidebar)' }}>
              <span className="text-xs font-bold uppercase tracking-widest text-[var(--text-accent)]">
                {editingTrade ? 'Edit Trade Entry' : 'Record Trade Session'}
              </span>
              <button
                onClick={() => { setShowGlobalTradeModal(false); setEditingTrade(null); }}
                className="px-2 py-0.5 hover:text-[#ff3b5c] cursor-pointer text-[#64748b] text-sm font-bold border border-white/[0.04] bg-white/[0.01]"
              >
                ✕
              </button>
            </div>
            {/* Form Container */}
            <div className="p-5 bg-transparent">
              <EntryForm
                onSubmit={handleSubmitTrade}
                editingTrade={editingTrade}
                onCancelEdit={() => { setShowGlobalTradeModal(false); setEditingTrade(null); }}
                quickEntry={settings.quickEntry}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
