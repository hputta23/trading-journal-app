import { useState, useEffect } from 'react';
import { Crosshair, Edit2, Trash2, Check, X, Plus, TrendingUp, BarChart3, Target } from 'lucide-react';
import { toast } from 'react-hot-toast';

const fontStyle = { fontFamily: "'Inter', sans-serif" };
const monoStyle = { fontFamily: "'JetBrains Mono', monospace" };
const panelStyle = { borderColor: 'var(--border-card)', background: 'var(--bg-card)', borderRadius: 14 };
const inputStyle = { background: 'var(--bg-input)', borderColor: 'var(--border-input)', color: 'var(--text-input)', borderRadius: 8, ...fontStyle, padding: '8px 12px', border: '1px solid var(--border-input)', width: '100%', boxSizing: 'border-box', fontSize: 13 };

const STORAGE_KEY = 'trading-journal-price-levels';

const CATEGORIES = [
  { id: 'index', label: 'Market Indices', subtitle: 'SPY, QQQ, IWM, DIA — Start here', icon: <TrendingUp size={16} style={{ color: 'var(--text-accent)' }} />, color: 'var(--color-cyan)' },
  { id: 'sector', label: 'Sectors & ETFs', subtitle: 'SOXX, XLF, XLE, XLK, GLD, TLT', icon: <BarChart3 size={16} style={{ color: 'var(--text-accent)' }} />, color: 'var(--text-accent)' },
  { id: 'stock', label: 'Individual Stocks', subtitle: 'Your specific trade candidates', icon: <Target size={16} style={{ color: 'var(--text-accent)' }} />, color: 'var(--color-profit)' },
];

const SETUP_TYPES = ['', 'Breakout', 'Pullback', 'Reversal', 'Range', 'Gap Fill', 'VWAP Bounce', 'Trend Continuation', 'Mean Reversion', 'Earnings Play', 'Other'];

const emptyEntry = { ticker: '', category: 'stock', support1: '', support2: '', resistance1: '', resistance2: '', setupType: '', entryTrigger: '', catalyst: '', notes: '' };

export default function PriceLevelsView() {
  const [levels, setLevels] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [editFormData, setEditFormData] = useState({});
  const [newStock, setNewStock] = useState({ ...emptyEntry });
  const [addingToCategory, setAddingToCategory] = useState(null);

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        // Migrate old entries without category
        const migrated = parsed.map(l => ({ ...emptyEntry, ...l, category: l.category || 'stock' }));
        setLevels(migrated);
      } catch (e) { /* ignore */ }
    }
  }, []);

  const saveLevels = (newLevels) => {
    setLevels(newLevels);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newLevels));
  };

  const handleAdd = (e) => {
    e.preventDefault();
    if (!newStock.ticker.trim()) { toast.error('Ticker is required'); return; }
    const entry = { ...newStock, id: Date.now(), ticker: newStock.ticker.trim().toUpperCase(), lastUpdated: new Date().toISOString() };
    saveLevels([entry, ...levels]);
    setNewStock({ ...emptyEntry, category: newStock.category });
    setAddingToCategory(null);
    toast.success(`Added ${entry.ticker}`);
  };

  const handleDelete = (id, ticker) => {
    if (window.confirm(`Delete ${ticker}?`)) {
      saveLevels(levels.filter(l => l.id !== id));
      toast.success(`Removed ${ticker}`);
    }
  };

  const startEdit = (level) => { setEditingId(level.id); setEditFormData({ ...level }); };
  const cancelEdit = () => { setEditingId(null); setEditFormData({}); };
  const handleEditSave = () => {
    if (!editFormData.ticker?.trim()) { toast.error('Ticker is required'); return; }
    saveLevels(levels.map(l => l.id === editingId ? { ...editFormData, ticker: editFormData.ticker.trim().toUpperCase(), lastUpdated: new Date().toISOString() } : l));
    setEditingId(null); setEditFormData({});
    toast.success('Updated');
  };

  const formatDate = (iso) => iso ? new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : '';

  const getLevelsForCategory = (catId) => levels.filter(l => l.category === catId);

  const renderLevelCell = (value, type) => {
    if (!value) return <span style={{ color: 'var(--text-secondary)', opacity: 0.4 }}>—</span>;
    const color = type === 'support' ? 'var(--color-profit)' : 'var(--color-loss)';
    return <span style={{ color, fontWeight: 700, ...monoStyle }}>{value}</span>;
  };

  const renderTable = (catId) => {
    const items = getLevelsForCategory(catId);
    if (items.length === 0 && addingToCategory !== catId) {
      return (
        <div style={{ padding: '20px 24px', textAlign: 'center', color: 'var(--text-secondary)', fontSize: 13, opacity: 0.6 }}>
          No entries yet — click "+ Add" above
        </div>
      );
    }

    return (
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--border-card)' }}>
              {['Ticker', 'S1', 'S2', 'R1', 'R2', 'Setup', 'Entry Trigger', 'Catalyst / Notes', 'Updated', ''].map((h, i) => (
                <th key={i} style={{ padding: '10px 12px', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text-secondary)', textAlign: 'left', whiteSpace: 'nowrap', ...fontStyle }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {items.map(level => (
              <tr key={level.id} style={{ borderBottom: '1px solid var(--border-card)', transition: 'background 0.1s' }}
                onMouseEnter={e => e.currentTarget.style.background = 'var(--accent-glow)'}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                {editingId === level.id ? (
                  <>
                    <td style={{ padding: '8px 12px' }}><input style={{ ...inputStyle, ...monoStyle, fontWeight: 700 }} value={editFormData.ticker || ''} onChange={e => setEditFormData({ ...editFormData, ticker: e.target.value })} /></td>
                    <td style={{ padding: '8px 6px' }}><input style={{ ...inputStyle, width: 70 }} value={editFormData.support1 || ''} onChange={e => setEditFormData({ ...editFormData, support1: e.target.value })} /></td>
                    <td style={{ padding: '8px 6px' }}><input style={{ ...inputStyle, width: 70 }} value={editFormData.support2 || ''} onChange={e => setEditFormData({ ...editFormData, support2: e.target.value })} /></td>
                    <td style={{ padding: '8px 6px' }}><input style={{ ...inputStyle, width: 70 }} value={editFormData.resistance1 || ''} onChange={e => setEditFormData({ ...editFormData, resistance1: e.target.value })} /></td>
                    <td style={{ padding: '8px 6px' }}><input style={{ ...inputStyle, width: 70 }} value={editFormData.resistance2 || ''} onChange={e => setEditFormData({ ...editFormData, resistance2: e.target.value })} /></td>
                    <td style={{ padding: '8px 6px' }}>
                      <select value={editFormData.setupType || ''} onChange={e => setEditFormData({ ...editFormData, setupType: e.target.value })} style={{ ...inputStyle, width: 110 }}>
                        {SETUP_TYPES.map(s => <option key={s} value={s}>{s || '—'}</option>)}
                      </select>
                    </td>
                    <td style={{ padding: '8px 6px' }}><input style={{ ...inputStyle, width: 120 }} value={editFormData.entryTrigger || ''} onChange={e => setEditFormData({ ...editFormData, entryTrigger: e.target.value })} /></td>
                    <td style={{ padding: '8px 6px' }}><input style={{ ...inputStyle, minWidth: 140 }} value={editFormData.catalyst || ''} onChange={e => setEditFormData({ ...editFormData, catalyst: e.target.value })} /></td>
                    <td style={{ padding: '8px 12px', color: 'var(--text-secondary)', fontSize: 12 }}>{formatDate(level.lastUpdated)}</td>
                    <td style={{ padding: '8px 12px', whiteSpace: 'nowrap' }}>
                      <button onClick={handleEditSave} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, color: 'var(--color-profit)' }}><Check size={16} /></button>
                      <button onClick={cancelEdit} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, color: 'var(--text-secondary)' }}><X size={16} /></button>
                    </td>
                  </>
                ) : (
                  <>
                    <td style={{ padding: '12px', ...monoStyle, fontWeight: 800, fontSize: 13, color: 'var(--text-dark)' }}>
                      <a href={`https://www.tradingview.com/chart/?symbol=${level.ticker}`} target="_blank" rel="noopener noreferrer"
                        style={{ color: 'var(--text-accent)', textDecoration: 'none' }}>{level.ticker}</a>
                    </td>
                    <td style={{ padding: '12px 8px' }}>{renderLevelCell(level.support1, 'support')}</td>
                    <td style={{ padding: '12px 8px' }}>{renderLevelCell(level.support2, 'support')}</td>
                    <td style={{ padding: '12px 8px' }}>{renderLevelCell(level.resistance1, 'resistance')}</td>
                    <td style={{ padding: '12px 8px' }}>{renderLevelCell(level.resistance2, 'resistance')}</td>
                    <td style={{ padding: '12px 8px' }}>
                      {level.setupType ? (
                        <span style={{ padding: '3px 8px', borderRadius: 6, fontSize: 11, fontWeight: 700, background: 'var(--accent-glow)', border: '1px solid var(--border-active)', color: 'var(--text-accent)', whiteSpace: 'nowrap' }}>{level.setupType}</span>
                      ) : <span style={{ color: 'var(--text-secondary)', opacity: 0.4 }}>—</span>}
                    </td>
                    <td style={{ padding: '12px 8px', fontSize: 12, color: 'var(--text-primary)', maxWidth: 150, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={level.entryTrigger}>
                      {level.entryTrigger || <span style={{ color: 'var(--text-secondary)', opacity: 0.4 }}>—</span>}
                    </td>
                    <td style={{ padding: '12px 8px', fontSize: 12, color: 'var(--text-primary)', maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={level.catalyst || level.notes}>
                      {level.catalyst || level.notes || <span style={{ color: 'var(--text-secondary)', opacity: 0.4 }}>—</span>}
                    </td>
                    <td style={{ padding: '12px', fontSize: 11, color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>{formatDate(level.lastUpdated)}</td>
                    <td style={{ padding: '12px', whiteSpace: 'nowrap' }}>
                      <button onClick={() => startEdit(level)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, color: 'var(--text-secondary)', opacity: 0.5 }} title="Edit"><Edit2 size={14} /></button>
                      <button onClick={() => handleDelete(level.id, level.ticker)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, color: 'var(--text-secondary)', opacity: 0.5 }} title="Delete"><Trash2 size={14} /></button>
                    </td>
                  </>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  return (
    <div className="h-full w-full fade-in" style={fontStyle}>
      {/* Header */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '16px 24px', background: 'var(--bg-sidebar)',
        borderBottom: '1px solid var(--border-card)', flexShrink: 0,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <Crosshair size={18} style={{ color: 'var(--text-accent)' }} />
          <div>
            <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-dark)' }}>Watchlist & Levels</div>
            <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>Top-down: Indices → Sectors → Stocks</div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '24px', background: 'var(--bg-app)', height: 'calc(100% - 64px)' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 20 }}>

          {CATEGORIES.map(cat => (
            <div key={cat.id} className="glass-panel" style={{ ...panelStyle, border: '1px solid var(--border-card)', overflow: 'hidden' }}>
              {/* Category Header */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', borderBottom: '1px solid var(--border-card)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ width: 32, height: 32, borderRadius: 8, background: 'var(--bg-badge-profit)', border: '1px solid var(--border-profit)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {cat.icon}
                  </div>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-dark)' }}>{cat.label}</div>
                    <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>{cat.subtitle}</div>
                  </div>
                  <span style={{ marginLeft: 8, padding: '2px 8px', borderRadius: 6, fontSize: 11, fontWeight: 700, background: 'var(--bg-input)', border: '1px solid var(--border-card)', color: 'var(--text-secondary)', ...monoStyle }}>
                    {getLevelsForCategory(cat.id).length}
                  </span>
                </div>
                <button
                  onClick={() => { setAddingToCategory(addingToCategory === cat.id ? null : cat.id); setNewStock({ ...emptyEntry, category: cat.id }); }}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 5,
                    padding: '7px 14px', borderRadius: 8, fontSize: 11, fontWeight: 700,
                    cursor: 'pointer', border: '1px solid var(--border-active)',
                    background: addingToCategory === cat.id ? 'var(--border-active)' : 'var(--accent-glow)',
                    color: addingToCategory === cat.id ? 'var(--bg-app)' : 'var(--text-accent)',
                    transition: 'all 0.15s ease', ...fontStyle,
                  }}
                >
                  <Plus size={13} /> Add
                </button>
              </div>

              {/* Inline Add Form */}
              {addingToCategory === cat.id && (
                <form onSubmit={handleAdd} style={{ padding: '14px 20px', background: 'var(--accent-glow)', borderBottom: '1px solid var(--border-active)', display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'flex-end' }}>
                  <div style={{ flex: '0 0 90px' }}>
                    <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.1em' }}>Ticker</div>
                    <input style={{ ...inputStyle, ...monoStyle, fontWeight: 700 }} placeholder="SPY" value={newStock.ticker} onChange={e => setNewStock({ ...newStock, ticker: e.target.value })} autoFocus />
                  </div>
                  <div style={{ flex: '0 0 75px' }}>
                    <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--color-profit)', marginBottom: 4 }}>S1</div>
                    <input style={inputStyle} placeholder="545" value={newStock.support1} onChange={e => setNewStock({ ...newStock, support1: e.target.value })} />
                  </div>
                  <div style={{ flex: '0 0 75px' }}>
                    <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--color-profit)', marginBottom: 4 }}>S2</div>
                    <input style={inputStyle} placeholder="540" value={newStock.support2} onChange={e => setNewStock({ ...newStock, support2: e.target.value })} />
                  </div>
                  <div style={{ flex: '0 0 75px' }}>
                    <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--color-loss)', marginBottom: 4 }}>R1</div>
                    <input style={inputStyle} placeholder="555" value={newStock.resistance1} onChange={e => setNewStock({ ...newStock, resistance1: e.target.value })} />
                  </div>
                  <div style={{ flex: '0 0 75px' }}>
                    <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--color-loss)', marginBottom: 4 }}>R2</div>
                    <input style={inputStyle} placeholder="560" value={newStock.resistance2} onChange={e => setNewStock({ ...newStock, resistance2: e.target.value })} />
                  </div>
                  <div style={{ flex: '0 0 120px' }}>
                    <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 4 }}>SETUP</div>
                    <select value={newStock.setupType} onChange={e => setNewStock({ ...newStock, setupType: e.target.value })} style={inputStyle}>
                      {SETUP_TYPES.map(s => <option key={s} value={s}>{s || 'Select...'}</option>)}
                    </select>
                  </div>
                  <div style={{ flex: '1 1 140px' }}>
                    <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 4 }}>ENTRY TRIGGER</div>
                    <input style={inputStyle} placeholder="Break above VWAP with vol" value={newStock.entryTrigger} onChange={e => setNewStock({ ...newStock, entryTrigger: e.target.value })} />
                  </div>
                  <div style={{ flex: '1 1 140px' }}>
                    <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 4 }}>CATALYST / NOTES</div>
                    <input style={inputStyle} placeholder="Fed meeting, earnings" value={newStock.catalyst} onChange={e => setNewStock({ ...newStock, catalyst: e.target.value })} />
                  </div>
                  <div style={{ display: 'flex', gap: 6 }}>
                    <button type="submit" style={{ padding: '8px 16px', borderRadius: 8, background: 'var(--border-active)', color: 'var(--bg-app)', border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: 700, ...fontStyle }}>Add</button>
                    <button type="button" onClick={() => setAddingToCategory(null)} style={{ padding: '8px 12px', borderRadius: 8, background: 'var(--bg-card)', color: 'var(--text-secondary)', border: '1px solid var(--border-card)', cursor: 'pointer', fontSize: 12, fontWeight: 700, ...fontStyle }}>Cancel</button>
                  </div>
                </form>
              )}

              {/* Table */}
              {renderTable(cat.id)}
            </div>
          ))}

        </div>
      </div>
    </div>
  );
}
