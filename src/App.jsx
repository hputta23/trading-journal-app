import { useState, useEffect, useCallback, useRef } from 'react';
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
import { calcDailyStats } from './utils/calculations';
import { loadActivityLogs, saveActivityLogs, logActivity } from './utils/logger';
import { LayoutDashboard, FileText, TrendingUp, BarChart3, RefreshCw } from 'lucide-react';

import { supabase } from './utils/supabaseClient';
import AuthView from './components/AuthView';

export default function App() {
  const [session, setSession] = useState(null);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [currentDate, setCurrentDate] = useState(getDateKey());
  const [allTrades, setAllTrades] = useState({});
  const [allJournals, setAllJournals] = useState({});
  const [activityLogs, setActivityLogs] = useState([]);
  const [settings, setSettings] = useState(() => loadSettings());
  const [editingTrade, setEditingTrade] = useState(null);
  const [cloudSyncStatus, setCloudSyncStatus] = useState('synced');
  const [syncStatus, setSyncStatus] = useState(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showGlobalTradeModal, setShowGlobalTradeModal] = useState(false);

  // Pull to Refresh State
  const [pullY, setPullY] = useState(0);
  const pullStart = useRef(0);
  const scrollRef = useRef(null);

  const handleTouchStart = (e) => {
    if (scrollRef.current && scrollRef.current.scrollTop === 0) {
      pullStart.current = e.touches[0].clientY;
    } else {
      pullStart.current = 0;
    }
  };

  const handleTouchMove = (e) => {
    if (!pullStart.current) return;
    const y = e.touches[0].clientY;
    const diff = y - pullStart.current;
    if (diff > 0) {
      setPullY(Math.min(diff * 0.4, 70)); // Add resistance, max 70px
    }
  };

  const handleTouchEnd = () => {
    if (pullY >= 60) {
      fetchCloudData(); // Trigger manual refresh
    }
    setPullY(0);
    pullStart.current = 0;
  };

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

  const fetchCloudData = useCallback(async () => {
    if (!session) return;
    
    setCloudSyncStatus('syncing');
    const localTrades = loadTrades();
    const localJournals = JSON.parse(localStorage.getItem('trading-journal-entries') || '{}');
    
    try {
      const { data, error } = await supabase
        .from('user_data')
        .select('*')
        .eq('user_id', session.user.id)
        .single();
        
      if (error) {
        if (error.code === 'PGRST116') {
          // If inserting, we don't know if journals column exists, so just insert trades to be safe.
          const { error: insertErr } = await supabase.from('user_data').insert([{ user_id: session.user.id, trades: localTrades }]);
          if (insertErr) console.error("Supabase insert error:", insertErr.message);
        } else {
          console.error("Supabase fetch error:", error.message);
        }
        setAllTrades(localTrades);
        setAllJournals(localJournals);
        setCloudSyncStatus('error');
        return;
      }
        
      const cloudTrades = data.trades || {};
      
      // DATA SAFEGUARD: If cloud is completely empty, but local has data, 
      // assume cloud wipe was accidental or a new device, and push local UP instead of pulling cloud DOWN.
      const localTradesKeys = Object.keys(localTrades).length;
      const cloudTradesKeys = Object.keys(cloudTrades).length;
      if (cloudTradesKeys === 0 && localTradesKeys > 0) {
        console.warn('Cloud is empty but local has data. Preserving local data.');
        setAllTrades(localTrades);
        setAllJournals(localJournals);
        setCloudSyncStatus('synced');
        return; // Early return to prevent overwriting local storage
      }
      
      setAllTrades(cloudTrades);
      saveTrades(cloudTrades);
      
      // Only set cloud journals if the column actually exists in their Supabase table
      if ('journals' in data && data.journals) {
        const cloudJournals = data.journals;
        setAllJournals(cloudJournals);
        localStorage.setItem('trading-journal-entries', JSON.stringify(cloudJournals));
      } else {
        setAllJournals(localJournals);
      }
      
      // Load activity logs safely
      if ('activity_logs' in data && data.activity_logs) {
        setActivityLogs(data.activity_logs);
        saveActivityLogs(data.activity_logs);
      } else {
        setActivityLogs(loadActivityLogs());
      }
      
      setCloudSyncStatus('synced');
    } catch (err) {
      console.error("Exception fetching from Supabase:", err);
      setCloudSyncStatus('error');
    }
  }, [session]);

  // Load data on mount and on visibility change
  useEffect(() => {
    if (!session) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchCloudData();
    
    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        fetchCloudData();
      }
    };
    
    const handleJournalUpdate = () => {
      const latestJournals = JSON.parse(localStorage.getItem('trading-journal-entries') || '{}');
      setAllJournals(latestJournals);
    };
    
    const handleLogUpdate = () => {
      setActivityLogs(loadActivityLogs());
    };

    document.addEventListener('visibilitychange', handleVisibility);
    window.addEventListener('journal_updated', handleJournalUpdate);
    window.addEventListener('activity_log_updated', handleLogUpdate);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibility);
      window.removeEventListener('journal_updated', handleJournalUpdate);
      window.removeEventListener('activity_log_updated', handleLogUpdate);
    };
  }, [session, fetchCloudData]);

  // Sync to Cloud whenever trades or journals change
  const initialMount = useRef(true);
  useEffect(() => {
    if (!session) return;
    
    if (initialMount.current) {
      initialMount.current = false;
      return;
    }

    // Only save to local storage AFTER the initial mount / cloud fetch has occurred
    saveTrades(allTrades);
    localStorage.setItem('trading-journal-entries', JSON.stringify(allJournals));
    
    const syncToCloud = async () => {
      setCloudSyncStatus('syncing');
      try {
        // First fetch to see if journals column exists
        const { data } = await supabase.from('user_data').select('*').eq('user_id', session.user.id).single();
        
        const updatePayload = { trades: allTrades, updated_at: new Date() };
        if (data && 'journals' in data) {
          updatePayload.journals = allJournals;
        }
        if (data && 'activity_logs' in data) {
          updatePayload.activity_logs = activityLogs;
        }
        
        await supabase
          .from('user_data')
          .update(updatePayload)
          .eq('user_id', session.user.id);
          
        setCloudSyncStatus('synced');
      } catch (err) {
        console.error("Cloud sync failed:", err);
        setCloudSyncStatus('error');
      }
    };
    syncToCloud();
  }, [allTrades, allJournals, activityLogs, session]);

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

  // Derived state for the active selected day
  const todayTrades = allTrades[currentDate] || [];
  const stats = calcDailyStats(todayTrades);

  // CRUD handlers
  const handleSubmitTrade = useCallback((trade) => {
    const dateKey = trade.date || currentDate;
    const updated = { ...allTrades };
    if (!updated[dateKey]) updated[dateKey] = [];
    const existingIdx = updated[dateKey].findIndex(t => t.id === trade.id);
    let isEdit = false;
    if (existingIdx >= 0) {
      updated[dateKey][existingIdx] = trade;
      isEdit = true;
    } else {
      updated[dateKey].push(trade);
    }
    persistTrades(updated);
    setEditingTrade(null);
    setShowGlobalTradeModal(false);
    
    logActivity(
      isEdit ? 'TRADE_EDITED' : 'TRADE_ADDED', 
      `${isEdit ? 'Updated' : 'Entered'} ${trade.direction} trade on ${trade.ticker} for ${dateKey}`
    );
  }, [allTrades, currentDate, persistTrades]);

  const handleDeleteTrade = useCallback((id) => {
    const updated = { ...allTrades };
    if (updated[currentDate]) {
      updated[currentDate] = updated[currentDate].filter(t => t.id !== id);
      if (updated[currentDate].length === 0) delete updated[currentDate];
    }
    persistTrades(updated);
    logActivity('TRADE_DELETED', `Deleted trade from ${currentDate}`);
  }, [allTrades, currentDate, persistTrades]);

  const handleEditTrade = useCallback((trade) => {
    setEditingTrade(trade);
    setShowGlobalTradeModal(true);
  }, []);

  const handleSaveSettings = useCallback((s) => { 
    setSettings(s); 
    saveSettings(s); 
    logActivity('SETTINGS_CHANGED', 'Updated application settings');
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
    <div className="flex flex-col h-[100dvh] w-screen overflow-hidden" style={{ background: 'var(--bg-app)' }}>
      
      {/* ── Top Header spanning 100% width (EXACTLY MATCHING IMAGE) ── */}
      <Header
        activeTab={activeTab}
        onTabChange={handleTabChange}
        onToggleMobileMenu={() => setMobileMenuOpen(!mobileMenuOpen)}
        theme={settings.theme}
        onToggleTheme={handleToggleTheme}
        cloudSyncStatus={cloudSyncStatus}
        onManualSync={fetchCloudData}
      />

      <div className="flex-1 flex min-h-0 w-full overflow-hidden relative">
        
        {/* Mobile Menu Overlay */}
        {mobileMenuOpen && (
          <div 
            className="fixed inset-0 z-40 md:hidden backdrop-blur-sm"
            style={{ background: 'rgba(0,0,0,0.6)' }}
            onClick={() => setMobileMenuOpen(false)}
          />
        )}
        
        {/* ── Persistent Global Left Navigation & Session Stats Sidebar (Left Side on Desktop) ── */}
        <div className={`sidebar-left shrink-0 w-[255px] md:block ${mobileMenuOpen ? 'mobile-open z-50' : 'hidden'}`}>
          <SidebarStats
            stats={stats}
            activeTab={activeTab}
            onTabChange={handleTabChange}
            onOpenNewTrade={() => { setEditingTrade(null); setShowGlobalTradeModal(true); setMobileMenuOpen(false); }}
            onSync={handleSync}
            syncStatus={syncStatus}
            userEmail={session.user.email}
          />
        </div>

        {/* ── Main View Panel Container (Right Side on Desktop) ── */}
        <div className="flex-1 min-h-0 bg-[var(--bg-app)] relative overflow-hidden">
          
          {/* Pull to Refresh Indicator */}
          <div 
            className="absolute top-0 left-0 right-0 flex justify-center items-center pointer-events-none transition-transform"
            style={{ 
              height: 60, 
              transform: `translateY(${pullY > 0 ? (pullY - 60) : -60}px)`,
              opacity: pullY / 60 
            }}
          >
            <div className="bg-[var(--bg-card)] border border-[var(--border-card)] rounded-full p-2 shadow-lg">
              <RefreshCw size={20} className={cloudSyncStatus === 'syncing' ? "animate-spin text-[var(--text-accent)]" : "text-[var(--text-secondary)]"} style={{ transform: `rotate(${pullY * 2}deg)` }} />
            </div>
          </div>

          <div 
            ref={scrollRef}
            className="w-full h-full overflow-y-auto pb-16 md:pb-0 transition-transform duration-200"
            style={{ transform: `translateY(${pullY}px)` }}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
          >
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
              userEmail={session.user.email}
            />
            )}
          </div>
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
                className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white/5 hover:text-[#ff3b5c] cursor-pointer text-[#64748b] text-sm font-bold border border-white/[0.04] bg-white/[0.01]"
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
