import { useState, useEffect, useCallback, useRef } from 'react';
import Header from './components/Header';
import SidebarStats from './components/SidebarStats';
import SettingsView from './components/SettingsView';
import CapitalView from './components/CapitalView';
import CommandPalette from './components/CommandPalette';
import RiskSizerModal from './components/RiskSizerModal';
import DashboardView from './components/DashboardView';
import JournalView from './components/JournalView';
import TradesView from './components/TradesView';
import AnalyticsView from './components/AnalyticsView';
import CalendarView from './components/CalendarView';
import EntryForm from './components/EntryForm';

import { loadTrades, saveTrades, loadSettings, saveSettings, getDateKey } from './utils/storage';
import { calcDailyStats } from './utils/calculations';
import { loadActivityLogs, saveActivityLogs, logActivity } from './utils/logger';
import { generateDemoTrades, generateDemoJournals } from './utils/demoData';
import { LayoutDashboard, FileText, TrendingUp, BarChart3, Calendar, Settings, RefreshCw } from 'lucide-react';

import { supabase } from './utils/supabaseClient';
import AuthView from './components/AuthView';
import ResetPasswordView from './components/ResetPasswordView';
import { Toaster, toast } from 'react-hot-toast';
import { AnimatePresence, motion } from 'framer-motion';

const pageVariants = {
  initial: { opacity: 0, y: 15 },
  in: { opacity: 1, y: 0 },
  out: { opacity: 0, y: -15 }
};
const pageTransition = { type: 'tween', ease: 'anticipate', duration: 0.25 };

const PageWrapper = ({ children, activeTab }) => (
  <motion.div
    key={activeTab}
    initial="initial"
    animate="in"
    exit="out"
    variants={pageVariants}
    transition={pageTransition}
    className="h-full w-full"
  >
    {children}
  </motion.div>
);

export default function App() {
  const [session, setSession] = useState(null);
  const [recoveryMode, setRecoveryMode] = useState(false);
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
  const [showCommandPalette, setShowCommandPalette] = useState(false);
  const [showRiskSizer, setShowRiskSizer] = useState(false);
  const [isDemo, setIsDemo] = useState(false);

  const handleLoadDemo = useCallback(() => {
    setIsDemo(true);
    const trades = generateDemoTrades();
    setAllTrades(trades);
    const journals = generateDemoJournals(trades);
    setAllJournals(journals);
    setSession({ user: { id: 'demo', email: 'demo@tradeos.local' } });
  }, []);

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

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  const fetchCloudData = useCallback(async () => {
    if (!session || isDemo) return;
    
    setCloudSyncStatus('syncing');
    const previousOwner = localStorage.getItem('trading-journal-owner');
    
    // If the browser data belongs to a DIFFERENT user, wipe it!
    if (previousOwner && previousOwner !== session.user.id) {
      console.warn("Switching accounts! Wiping previous user's local data to prevent cross-contamination.");
      localStorage.removeItem('trading-journal-trades');
      localStorage.removeItem('trading-journal-entries');
      localStorage.removeItem('trading-journal-activity');
    }
    
    // Claim ownership of this browser's data
    localStorage.setItem('trading-journal-owner', session.user.id);

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
          // New user sign up - adopt whatever is currently in local storage (it's safe because we wiped it if they switched accounts)
          const { error: insertErr } = await supabase.from('user_data').insert([{ user_id: session.user.id, trades: localTrades, journals: localJournals }]);
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
    if (!session || isDemo) return;
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
    window.addEventListener('trading-journal-updated', handleJournalUpdate);
    window.addEventListener('trading-journal-log-updated', handleLogUpdate);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibility);
      window.removeEventListener('trading-journal-updated', handleJournalUpdate);
      window.removeEventListener('trading-journal-log-updated', handleLogUpdate);
    };
  }, [session, isDemo]);

  const handleSaveJournal = (date, updatedData) => {
    const updated = { ...allJournals };
    updated[date] = updatedData;
    setAllJournals(updated);
    
    // In demo mode, don't write to local storage
    if (isDemo) return;
    
    localStorage.setItem('trading-journal-entries', JSON.stringify(updated));
    window.dispatchEvent(new Event('trading-journal-updated'));
  };

  // Sync to Cloud whenever trades or journals change
  const initialMount = useRef(true);
  useEffect(() => {
    if (!session || isDemo) return;
    
    if (initialMount.current) {
      initialMount.current = false;
      return;
    }

    // Only save to local storage AFTER the initial mount / cloud fetch has occurred
    saveTrades(allTrades);
    localStorage.setItem('trading-journal-entries', JSON.stringify(allJournals));
    
    // Hardcoded universal login bypasses cloud sync
    if (session.user.id === 'universal-user') {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setCloudSyncStatus('synced');
      return;
    }

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
      document.documentElement.setAttribute('data-theme', 'light');
      return;
    }
    const currentTheme = settings.theme || 'light';
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
    if (!isDemo) {
      saveTrades(updated);
    }
  }, [isDemo]);

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
    toast.success(`${isEdit ? 'Trade Updated' : 'Trade Logged Successfully'}`);
  }, [allTrades, currentDate, persistTrades]);

  const handleDeleteTrade = useCallback((id) => {
    const updated = { ...allTrades };
    // Search all dates for the trade, not just currentDate
    for (const dateKey of Object.keys(updated)) {
      const idx = updated[dateKey].findIndex(t => t.id === id);
      if (idx !== -1) {
        updated[dateKey].splice(idx, 1);
        if (updated[dateKey].length === 0) delete updated[dateKey];
        break;
      }
    }
    persistTrades(updated);
    logActivity('TRADE_DELETED', `Deleted trade ${id}`);
  }, [allTrades, persistTrades]);

  const handleEditTrade = useCallback((trade) => {
    setEditingTrade(trade);
    setShowGlobalTradeModal(true);
  }, []);

  const handleSaveSettings = useCallback((s) => { 
    setSettings(s); 
    saveSettings(s); 
    logActivity('SETTINGS_CHANGED', 'Updated application settings');
    toast.success('Settings Saved');
  }, []);

  const handleToggleTheme = useCallback(() => {
    const cycle = { dark: 'light', light: 'monochrome', monochrome: 'dark' };
    const nextTheme = cycle[settings.theme] || 'light';
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

  if (recoveryMode) {
    return <ResetPasswordView onComplete={() => setRecoveryMode(false)} />;
  }

  if (!session) {
    return <AuthView onLoadDemo={handleLoadDemo} />;
  }

  const handleLogoutClick = async () => {
    if (session.user.id === 'universal-user') {
      handleLogout();
      return;
    }
    await supabase.auth.signOut();
    handleLogout();
  };

  return (
    <div className="flex flex-col h-[100dvh] w-screen overflow-hidden" style={{ background: 'var(--bg-app)' }}>
      {isDemo && (
        <div className="bg-[var(--bg-badge-loss)] text-[var(--color-loss)] text-[11px] font-bold uppercase tracking-widest flex items-center justify-center gap-4 py-1.5 border-b border-[var(--border-loss)] shadow-sm relative z-50">
          <span>🧪 Playground Mode — Data will not be saved</span>
          <button 
            onClick={() => window.location.reload()}
            className="bg-[var(--color-loss)] text-white px-3 py-0.5 rounded cursor-pointer hover:opacity-80 transition-opacity"
          >
            EXIT
          </button>
        </div>
      )}
      
      {/* ── Top Header spanning 100% width (EXACTLY MATCHING IMAGE) ── */}
      <Header
        activeTab={activeTab}
        onTabChange={handleTabChange}
        onToggleMobileMenu={() => setMobileMenuOpen(!mobileMenuOpen)}
        theme={settings.theme}
        onToggleTheme={handleToggleTheme}
        userEmail={settings.displayName || session.user.email}
        isDemo={isDemo}
        onLogout={handleLogoutClick}
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
            userEmail={settings.displayName || session.user.email}
            isDemo={isDemo}
            onLoadDemo={handleLoadDemo}
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
            <AnimatePresence mode="wait" initial={false}>
              {activeTab === 'dashboard' && (
                <PageWrapper activeTab="dashboard">
                  <DashboardView
                    allTrades={allTrades}
                    settings={settings}
                    onSubmitTrade={handleSubmitTrade}
                    onEditTrade={handleEditTrade}
                    onDeleteTrade={handleDeleteTrade}
                    editingTrade={editingTrade}
                    onCancelEdit={() => setEditingTrade(null)}
                    onSelectDate={handleSelectDateFromHeatmap}
                    onNavigateTab={handleTabChange}
                  />
                </PageWrapper>
              )}

              {activeTab === 'journal' && (
                <PageWrapper activeTab="journal">
                  <JournalView
                    currentDate={currentDate}
                    todayTrades={todayTrades}
                    onEditTrade={handleEditTrade}
                    onSelectDate={setCurrentDate}
                  />
                </PageWrapper>
              )}

              {activeTab === 'trades' && (
                <PageWrapper activeTab="trades">
                  <TradesView
                    allTrades={allTrades}
                    onSubmitTrade={handleSubmitTrade}
                    onEditTrade={handleEditTrade}
                    onDeleteTrade={handleDeleteTrade}
                    editingTrade={editingTrade}
                    onCancelEdit={() => setEditingTrade(null)}
                    quickEntry={settings.quickEntry}
                    currentDate={currentDate}
                  />
                </PageWrapper>
              )}

              {activeTab === 'analytics' && (
                <PageWrapper activeTab="analytics">
                  <AnalyticsView
                    allTrades={allTrades}
                  />
                </PageWrapper>
              )}

              {activeTab === 'calendar' && (
                <PageWrapper activeTab="calendar">
                  <CalendarView
                    allTrades={allTrades}
                    allJournals={allJournals}
                    onSelectDate={setCurrentDate}
                    onNavigateTab={handleTabChange}
                  />
                </PageWrapper>
              )}

              {activeTab === 'capital' && (
                <PageWrapper activeTab="capital">
                  <CapitalView
                    allTrades={allTrades}
                    allJournals={allJournals}
                    onSaveJournal={handleSaveJournal}
                    settings={settings}
                    onSaveSettings={handleSaveSettings}
                  />
                </PageWrapper>
              )}

              {activeTab === 'settings' && (
                <PageWrapper activeTab="settings">
                  <SettingsView
                    settings={settings}
                    onSave={handleSaveSettings}
                    userEmail={settings.displayName || session.user.email}
                    allTrades={allTrades}
                  />
                </PageWrapper>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* ── Mobile Tab Bar ── */}
      <div className="mobile-tab-bar safe-area-bottom">
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
          Stats
        </button>
        <button
          className={activeTab === 'calendar' ? 'active' : ''}
          onClick={() => handleTabChange('calendar')}
        >
          <Calendar size={15} />
          Cal
        </button>
        <button
          className={activeTab === 'settings' ? 'active' : ''}
          onClick={() => handleTabChange('settings')}
        >
          <Settings size={15} />
          Set
        </button>
      </div>

      {/* ── Global Log Trade Modal Overlay ── */}
      {showGlobalTradeModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-3xl border overflow-y-auto max-h-[90vh] glass-panel fade-in" style={{ borderColor: 'var(--border-card)', borderRadius: 16 }}>
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b p-4 select-none shrink-0" style={{ borderColor: 'var(--border-card)', background: 'var(--bg-sidebar)', borderTopLeftRadius: 16, borderTopRightRadius: 16 }}>
              <span className="text-xs font-bold uppercase tracking-widest text-[var(--text-accent)]">
                {editingTrade ? 'Edit Trade Entry' : 'Record Trade Session'}
              </span>
              <button
                onClick={() => { setShowGlobalTradeModal(false); setEditingTrade(null); }}
                className="w-8 h-8 flex items-center justify-center hover:bg-white/5 hover:text-[var(--color-loss)] cursor-pointer text-[var(--text-secondary)] text-sm font-bold border border-white/[0.04] bg-white/[0.01]"
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
                currentDate={currentDate}
                settings={settings}
              />
            </div>
          </div>
        </div>
      )}
      
      <CommandPalette 
        isOpen={showCommandPalette}
        onClose={() => setShowCommandPalette(false)}
        onNavigate={handleTabChange}
        onOpenNewTrade={() => { setEditingTrade(null); setShowGlobalTradeModal(true); setMobileMenuOpen(false); }}
        onOpenRiskSizer={() => setShowRiskSizer(true)}
      />

      <RiskSizerModal
        isOpen={showRiskSizer}
        onClose={() => setShowRiskSizer(false)}
      />

      <Toaster 
        position="top-right" 
        toastOptions={{
          style: {
            background: 'var(--bg-card)',
            color: 'var(--text-primary)',
            border: '1px solid var(--border-card)',
            fontSize: '12px',
            fontWeight: 'bold',
            fontFamily: "'Inter', sans-serif"
          },
          success: { iconTheme: { primary: 'var(--color-profit)', secondary: 'var(--bg-card)' } },
          error: { iconTheme: { primary: 'var(--color-loss)', secondary: 'var(--bg-card)' } }
        }} 
      />
    </div>
  );
}
