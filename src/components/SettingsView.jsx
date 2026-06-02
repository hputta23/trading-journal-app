import { useState, useRef } from 'react';
import { Settings, Database, Sliders, Shield, Info, Download, Trash2, Sun, Moon, Upload, FileJson, FileSpreadsheet, LogOut } from 'lucide-react';
import { supabase } from '../utils/supabaseClient';

/* ── Small reusable info tooltip ── */
const Tip = ({ text }) => (
  <span className="info-trigger" style={{ color: 'var(--text-secondary)', display: 'inline-flex', cursor: 'help' }}>
    <Info size={11} />
    <span className="info-tooltip font-sans" style={{ textTransform: 'none', letterSpacing: 'normal', fontSize: '12px', width: '250px' }}>{text}</span>
  </span>
);

export default function SettingsView({ settings, onSave, onClearData, userEmail }) {
  const [googleSheetId, setGoogleSheetId] = useState(settings.googleSheetId || '');
  const [quickEntry, setQuickEntry] = useState(settings.quickEntry || false);
  const [theme, setTheme] = useState(settings.theme || 'dark');
  const [saveStatus, setSaveStatus] = useState(null);
  
  const fileInputRef = useRef(null);
  const csvInputRef = useRef(null);

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  const handleSave = () => {
    onSave({ googleSheetId, quickEntry, theme });
    setSaveStatus('success');
    setTimeout(() => setSaveStatus(null), 3000);
  };

  const handleClearData = () => {
    if (window.confirm("Are you sure you want to clear ALL trading data? This cannot be undone.")) {
      if (onClearData) {
        onClearData();
      } else {
        localStorage.removeItem('trading-journal-trades');
        localStorage.removeItem('trading-journal-entries');
        window.location.reload();
      }
    }
  };

  const handleExportJSON = () => {
    const trades = localStorage.getItem('trading-journal-trades') || '{}';
    const entries = localStorage.getItem('trading-journal-entries') || '{}';
    const dataStr = JSON.stringify({ trades: JSON.parse(trades), entries: JSON.parse(entries) }, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    
    const exportFileDefaultName = `TradeOS_Backup_${new Date().toISOString().split('T')[0]}.json`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  };

  const handleImportJSON = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const obj = JSON.parse(event.target.result);
        if (obj.trades) localStorage.setItem('trading-journal-trades', JSON.stringify(obj.trades));
        if (obj.entries) localStorage.setItem('trading-journal-entries', JSON.stringify(obj.entries));
        alert('Data successfully imported! The app will now reload.');
        window.location.reload();
      } catch (err) {
        alert('Invalid backup file. Could not parse JSON.');
      }
    };
    reader.readAsText(file);
  };

  const handleImportCSV = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const csv = event.target.result;
        const lines = csv.split('\n').filter(l => l.trim() !== '');
        if (lines.length < 2) return alert('CSV appears to be empty or has no data rows.');
        
        // Very basic generic CSV parser
        // Expected headers: Date, Time, Ticker, Direction, Asset, EntryPrice, ExitPrice, Qty, Fees
        const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
        
        let importedCount = 0;
        let allTrades = JSON.parse(localStorage.getItem('trading-journal-trades') || '{}');

        for (let i = 1; i < lines.length; i++) {
          const values = lines[i].split(',').map(v => v.trim());
          const tradeData = {};
          
          headers.forEach((h, idx) => {
            tradeData[h] = values[idx];
          });
          
          // Basic validation to see if we have core fields
          const ticker = tradeData.ticker || tradeData.symbol;
          const entry = parseFloat(tradeData.entryprice || tradeData.price || tradeData.entry);
          const qty = parseFloat(tradeData.qty || tradeData.quantity);
          const date = tradeData.date || new Date().toISOString().split('T')[0];
          
          if (ticker && !isNaN(entry) && !isNaN(qty)) {
            const dateKey = date.includes('T') ? date.split('T')[0] : date;
            if (!allTrades[dateKey]) allTrades[dateKey] = [];
            
            const direction = (tradeData.direction || 'Long').charAt(0).toUpperCase() + (tradeData.direction || 'Long').slice(1).toLowerCase();
            const assetClass = (tradeData.asset || tradeData.assetclass || 'Stock').charAt(0).toUpperCase() + (tradeData.asset || 'Stock').slice(1).toLowerCase();
            const exit = tradeData.exitprice || tradeData.exit ? parseFloat(tradeData.exitprice || tradeData.exit) : null;
            
            // Calc PnL blindly based on Long/Short for simplicity if exit exists
            let grossPnl = 0;
            if (exit) {
               grossPnl = direction === 'Long' ? (exit - entry) * qty : (entry - exit) * qty;
            }
            
            allTrades[dateKey].push({
              id: `import-${Date.now()}-${i}`,
              date: dateKey,
              time: tradeData.time || '09:30:00',
              ticker: ticker.toUpperCase(),
              direction: direction === 'Short' ? 'Short' : 'Long',
              assetClass: assetClass === 'Option' ? 'Option' : assetClass === 'Future' ? 'Future' : 'Stock',
              entryPrice: entry,
              exitPrice: exit,
              qty: qty,
              fees: parseFloat(tradeData.fees || tradeData.fee) || 0,
              strategy: tradeData.strategy || 'Imported',
              grossPnl: grossPnl,
              netPnl: grossPnl - (parseFloat(tradeData.fees) || 0),
              isOpen: !exit,
              mistake: 'None / Plan Followed',
              notes: 'Imported via CSV'
            });
            importedCount++;
          }
        }
        
        localStorage.setItem('trading-journal-trades', JSON.stringify(allTrades));
        alert(`Successfully imported ${importedCount} trades. The app will now reload.`);
        window.location.reload();
        
      } catch (err) {
        console.error(err);
        alert('Failed to parse CSV. Please ensure standard column headers are present (Date, Ticker, Direction, EntryPrice, Qty).');
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="h-full w-full fade-in p-6" style={{ fontFamily: "'Inter', sans-serif" }}>
      <div style={{
        maxWidth: '1000px',
        margin: '0 auto',
        display: 'flex',
        flexDirection: 'column',
        gap: '24px'
      }}>
        {/* Header */}
        <div className="glass-panel flex flex-col md:flex-row items-start md:items-center justify-between p-6 rounded-2xl gap-4">
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{
              width: '48px', height: '48px', borderRadius: '12px',
              background: 'rgba(0, 200, 5, 0.1)', border: '1px solid rgba(0, 200, 5, 0.25)',
              display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}>
              <Settings size={24} style={{ color: 'var(--text-accent)' }} />
            </div>
            <div>
              <h1 style={{ fontSize: '24px', fontWeight: '800', color: 'var(--text-dark)', letterSpacing: '-0.02em', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                System Settings
              </h1>
              <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '4px' }}>
                Configure TradeOS preferences and manage your data
              </p>
            </div>
          </div>
          <button
            onClick={handleSave}
            style={{
              padding: '12px 28px',
              fontSize: '13px', fontWeight: '700',
              textTransform: 'uppercase', letterSpacing: '0.1em',
              background: saveStatus === 'success' ? 'var(--color-profit)' : 'var(--border-active)',
              color: 'var(--bg-app)',
              border: 'none', borderRadius: '10px',
              cursor: 'pointer', transition: 'all 0.2s',
              display: 'flex', alignItems: 'center', gap: '8px',
              boxShadow: saveStatus === 'success' ? '0 0 16px rgba(0, 230, 118, 0.4)' : '0 4px 14px rgba(0, 200, 5, 0.2)'
            }}
          >
            {saveStatus === 'success' ? 'SETTINGS SAVED ✓' : 'APPLY SETTINGS'}
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          {/* ── Integration & Data ── */}
          <div className="glass-panel" style={{ padding: '32px', borderRadius: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
              <Database size={20} style={{ color: 'var(--color-cyan)' }} />
              <h2 style={{ fontSize: '18px', fontWeight: '700', color: 'var(--text-dark)', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>Integration & API</h2>
            </div>

            <div style={{ marginBottom: '24px' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text-secondary)', marginBottom: '12px' }}>
                Google Sheet Database ID
                <Tip text="Synchronize all trade entries directly to a private Google Spreadsheet for secondary record keeping." />
              </label>
              <input
                type="text"
                value={googleSheetId}
                onChange={(e) => setGoogleSheetId(e.target.value)}
                placeholder="Spreadsheet ID (e.g. 1aBcDeFgHiJkLmNoP...)"
                style={{
                  width: '100%', padding: '16px', fontSize: '14px', fontFamily: "'JetBrains Mono', monospace",
                  background: 'var(--bg-input)', border: '1px solid var(--border-input)',
                  color: 'var(--text-input)', borderRadius: '10px'
                }}
              />
              <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-start', marginTop: '12px', padding: '12px 16px', background: 'rgba(0, 200, 5, 0.05)', borderRadius: '8px', border: '1px solid rgba(0, 200, 5, 0.15)' }}>
                <Shield size={14} style={{ color: 'var(--color-profit)', marginTop: '2px', flexShrink: 0 }} />
                <p style={{ fontSize: '12px', color: 'var(--text-secondary)', lineHeight: '1.5' }}>
                  Leave blank to operate purely in high-speed offline local storage mode. All data will remain strictly on this device.
                </p>
              </div>
            </div>
          </div>

          {/* ── Preferences ── */}
          <div className="glass-panel" style={{ padding: '32px', borderRadius: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
              <Sliders size={20} style={{ color: '#facc15' }} />
              <h2 style={{ fontSize: '18px', fontWeight: '700', color: 'var(--text-dark)', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>Trading Preferences</h2>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: '24px', borderBottom: '1px solid var(--border-card)', marginBottom: '24px' }}>
              <div>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-dark)', marginBottom: '4px' }}>
                  Quick Entry HUD
                  <Tip text="Activates simplified transaction input forms by omitting advanced metric logs like setups, plans, and emotional status checks." />
                </label>
                <p style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Bypass emotional checks & setups when logging trades</p>
              </div>
              <button
                onClick={() => setQuickEntry(!quickEntry)}
                style={{
                  width: '56px', height: '30px',
                  background: quickEntry ? 'var(--color-profit)' : 'var(--bg-input)',
                  border: `2px solid ${quickEntry ? 'var(--color-profit)' : 'var(--border-input)'}`,
                  borderRadius: '9999px', cursor: 'pointer', position: 'relative',
                  transition: 'all 0.3s ease'
                }}
              >
                <span style={{
                  position: 'absolute', top: '2px', width: '22px', height: '22px',
                  background: 'var(--text-dark)', borderRadius: '50%',
                  left: quickEntry ? '30px' : '2px', transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)'
                }} />
              </button>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-dark)', marginBottom: '4px' }}>
                  Interface Theme
                </label>
                <p style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Pitch Black Dark vs Feather Light Mint</p>
              </div>
              <div style={{ display: 'flex', background: 'var(--bg-input)', border: '1px solid var(--border-input)', borderRadius: '10px', padding: '4px' }}>
                <button
                  onClick={() => setTheme('dark')}
                  style={{
                    padding: '8px 16px', border: 'none', borderRadius: '6px',
                    background: theme === 'dark' ? 'var(--bg-sidebar)' : 'transparent',
                    color: theme === 'dark' ? 'var(--text-accent)' : 'var(--text-secondary)',
                    fontWeight: '700', fontSize: '11px', letterSpacing: '0.05em', cursor: 'pointer',
                    display: 'flex', alignItems: 'center', gap: '6px',
                    boxShadow: theme === 'dark' ? '0 2px 8px rgba(0,0,0,0.2)' : 'none'
                  }}
                >
                  <Moon size={14} /> DARK
                </button>
                <button
                  onClick={() => setTheme('light')}
                  style={{
                    padding: '8px 16px', border: 'none', borderRadius: '6px',
                    background: theme === 'light' ? 'var(--bg-sidebar)' : 'transparent',
                    color: theme === 'light' ? 'var(--text-accent)' : 'var(--text-secondary)',
                    fontWeight: '700', fontSize: '11px', letterSpacing: '0.05em', cursor: 'pointer',
                    display: 'flex', alignItems: 'center', gap: '6px',
                    boxShadow: theme === 'light' ? '0 2px 8px rgba(0,0,0,0.1)' : 'none'
                  }}
                >
                  <Sun size={14} /> LIGHT
                </button>
              </div>
            </div>
          </div>
          
          {/* ── Data Management (Backups & Imports) ── */}
          <div className="glass-panel" style={{ padding: '32px', borderRadius: '16px', gridColumn: '1 / -1' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
              <Download size={20} style={{ color: 'var(--text-accent)' }} />
              <h2 style={{ fontSize: '18px', fontWeight: '700', color: 'var(--text-dark)', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>Data Import & Export</h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              
              <div style={{ padding: '24px', background: 'var(--bg-input)', borderRadius: '12px', border: '1px solid var(--border-card)' }}>
                <div className="flex items-center gap-2 mb-2">
                  <FileJson size={16} className="text-[var(--text-dark)]" />
                  <h3 style={{ fontSize: '14px', fontWeight: '700', color: 'var(--text-dark)' }}>Backup Data</h3>
                </div>
                <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '20px', lineHeight: '1.5' }}>
                  Export all your local trades and journal entries to a secure JSON file.
                </p>
                <button
                  onClick={handleExportJSON}
                  style={{
                    padding: '10px 16px', fontSize: '12px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.05em',
                    background: 'transparent', border: '1px solid var(--border-card)', color: 'var(--text-primary)',
                    borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', width: '100%', justifyContent: 'center'
                  }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--text-accent)'; e.currentTarget.style.color = 'var(--text-accent)'; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border-card)'; e.currentTarget.style.color = 'var(--text-primary)'; }}
                >
                  <Download size={14} /> Download JSON
                </button>
              </div>

              <div style={{ padding: '24px', background: 'var(--bg-input)', borderRadius: '12px', border: '1px solid var(--border-card)' }}>
                <div className="flex items-center gap-2 mb-2">
                  <Upload size={16} className="text-[var(--text-dark)]" />
                  <h3 style={{ fontSize: '14px', fontWeight: '700', color: 'var(--text-dark)' }}>Restore Backup</h3>
                </div>
                <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '20px', lineHeight: '1.5' }}>
                  Import a previously saved JSON backup file to overwrite current data.
                </p>
                <input type="file" accept=".json" style={{ display: 'none' }} ref={fileInputRef} onChange={handleImportJSON} />
                <button
                  onClick={() => fileInputRef.current.click()}
                  style={{
                    padding: '10px 16px', fontSize: '12px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.05em',
                    background: 'transparent', border: '1px solid var(--border-card)', color: 'var(--text-primary)',
                    borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', width: '100%', justifyContent: 'center'
                  }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--text-accent)'; e.currentTarget.style.color = 'var(--text-accent)'; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border-card)'; e.currentTarget.style.color = 'var(--text-primary)'; }}
                >
                  <FileJson size={14} /> Upload JSON
                </button>
              </div>

              <div style={{ padding: '24px', background: 'var(--bg-input)', borderRadius: '12px', border: '1px solid var(--border-card)' }}>
                <div className="flex items-center gap-2 mb-2">
                  <FileSpreadsheet size={16} className="text-[var(--text-dark)]" />
                  <h3 style={{ fontSize: '14px', fontWeight: '700', color: 'var(--text-dark)' }}>Import Broker CSV</h3>
                </div>
                <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '20px', lineHeight: '1.5' }}>
                  Upload a generic CSV. Expected Headers: Date, Ticker, Direction, EntryPrice, Qty.
                </p>
                <input type="file" accept=".csv" style={{ display: 'none' }} ref={csvInputRef} onChange={handleImportCSV} />
                <button
                  onClick={() => csvInputRef.current.click()}
                  style={{
                    padding: '10px 16px', fontSize: '12px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.05em',
                    background: 'var(--border-active)', border: 'none', color: 'var(--bg-app)',
                    borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', width: '100%', justifyContent: 'center'
                  }}
                  onMouseEnter={e => { e.currentTarget.style.opacity = '0.9'; }}
                  onMouseLeave={e => { e.currentTarget.style.opacity = '1'; }}
                >
                  <Upload size={14} /> Import CSV
                </button>
              </div>

            </div>
          </div>

          {/* ── User Profile ── */}
          <div className="glass-panel" style={{ padding: '32px', borderRadius: '16px', border: '1px solid var(--border-card)', gridColumn: '1 / -1' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
              <Shield size={20} style={{ color: 'var(--text-accent)' }} />
              <h2 style={{ fontSize: '18px', fontWeight: '700', color: 'var(--text-dark)', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>User Profile</h2>
            </div>
            
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '20px' }}>
              <div style={{ flex: 1, minWidth: '300px', padding: '24px', background: 'var(--bg-input)', borderRadius: '12px', border: '1px solid var(--border-card)' }}>
                <h3 style={{ fontSize: '14px', fontWeight: '700', color: 'var(--text-dark)', marginBottom: '8px' }}>Signed in as</h3>
                <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '20px', lineHeight: '1.5' }}>
                  {userEmail}
                </p>
                <button
                  onClick={handleLogout}
                  style={{
                    padding: '10px 20px', fontSize: '12px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.05em',
                    background: 'transparent', border: '1px solid var(--border-card)', color: 'var(--text-primary)',
                    borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px'
                  }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--text-accent)'; e.currentTarget.style.color = 'var(--text-accent)'; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border-card)'; e.currentTarget.style.color = 'var(--text-primary)'; }}
                >
                  <LogOut size={14} /> Log Out
                </button>
              </div>
            </div>
          </div>

          {/* ── Danger Zone ── */}
          <div className="glass-panel" style={{ padding: '32px', borderRadius: '16px', border: '1px solid rgba(255, 59, 92, 0.3)', gridColumn: '1 / -1' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
              <Trash2 size={20} style={{ color: 'var(--color-loss)' }} />
              <h2 style={{ fontSize: '18px', fontWeight: '700', color: 'var(--text-dark)', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>Factory Reset</h2>
            </div>
            
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '20px' }}>
              <div style={{ flex: 1, minWidth: '300px', padding: '24px', background: 'rgba(255, 59, 92, 0.03)', borderRadius: '12px', border: '1px solid rgba(255, 59, 92, 0.2)' }}>
                <h3 style={{ fontSize: '14px', fontWeight: '700', color: 'var(--color-loss)', marginBottom: '8px' }}>Erase All Data</h3>
                <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '20px', lineHeight: '1.5' }}>
                  Permanently delete all trades, journals, and local storage data. This action cannot be reversed.
                </p>
                <button
                  onClick={handleClearData}
                  style={{
                    padding: '10px 20px', fontSize: '12px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.05em',
                    background: 'rgba(255, 59, 92, 0.1)', border: '1px solid rgba(255, 59, 92, 0.3)', color: 'var(--color-loss)',
                    borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px'
                  }}
                  onMouseEnter={e => { e.currentTarget.style.background = 'var(--color-loss)'; e.currentTarget.style.color = '#fff'; }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255, 59, 92, 0.1)'; e.currentTarget.style.color = 'var(--color-loss)'; }}
                >
                  <Trash2 size={14} /> Factory Reset
                </button>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
