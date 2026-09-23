import { useState, useEffect, useRef } from 'react';
import { Save, Frown, ExternalLink, BookOpen, Activity, Award, CheckCircle2, Target, Brain, TrendingUp, AlertTriangle, ChevronLeft, ChevronRight, Plus, Trash2, CheckCircle, XCircle, ClipboardList, Image, Hash, CheckSquare, Thermometer, Upload } from 'lucide-react';
import { MOODS, MARKET_CONDITIONS, GRADES, loadJournalEntries, saveJournalEntry, emptyJournalEntry } from '../utils/journal';
import { calcDailyStats, formatCurrency, formatPercent, formatNumber } from '../utils/calculations';
import { toast } from 'react-hot-toast';

const fontStyle = { fontFamily: "'Inter', sans-serif" };
const monoStyle = { fontFamily: "'JetBrains Mono', monospace" };

const panelStyle = {
  borderColor: 'var(--border-card)',
  background: 'var(--bg-card)',
  borderRadius: 14,
};

const inputStyle = {
  background: 'var(--bg-input)',
  borderColor: 'var(--border-input)',
  color: 'var(--text-input)',
  borderRadius: 10,
  ...fontStyle,
};

/* ── Section Header Component ── */
const SectionHeader = ({ icon, title, subtitle }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: 10, paddingBottom: 14, marginBottom: 20, borderBottom: '1px solid var(--border-card)' }}>
    <div style={{
      width: 34, height: 34, borderRadius: 8,
      background: 'var(--bg-badge-profit)', border: '1px solid var(--border-profit)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
    }}>
      {icon}
    </div>
    <div style={{ minWidth: 0 }}>
      <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-dark)', lineHeight: 1.3 }}>{title}</div>
      {subtitle && <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 2 }}>{subtitle}</div>}
    </div>
  </div>
);

/* ── Field Label Component ── */
const FieldLabel = ({ children, color }) => (
  <label style={{
    display: 'block',
    fontSize: 11,
    fontWeight: 700,
    textTransform: 'uppercase',
    letterSpacing: '0.12em',
    color: color || 'var(--text-secondary)',
    marginBottom: 10,
    ...fontStyle,
  }}>
    {children}
  </label>
);

export default function JournalView({ currentDate, todayTrades, onEditTrade, onSelectDate }) {
  const [entry, setEntry] = useState({ ...emptyJournalEntry });
  const [newGoalText, setNewGoalText] = useState('');
  const [tagInputText, setTagInputText] = useState('');
  const fileInputRef = useRef(null);
  const pasteBoxRef = useRef(null);

  /* ── Tag helpers ── */
  const handleAddTag = (e) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      const val = tagInputText.trim().replace(/^#/, '');
      if (val && !(entry.tags || []).includes(val)) {
        updateField('tags', [...(entry.tags || []), val]);
      }
      setTagInputText('');
    }
  };

  const removeTag = (tag) => {
    updateField('tags', (entry.tags || []).filter(t => t !== tag));
  };

  /* ── Image helpers (multi-image) ── */
  const getImages = () => {
    // Backward compat: old entries have imageUrl string, new ones have images array
    if (entry.images && entry.images.length > 0) return entry.images;
    if (entry.imageUrl && entry.imageUrl.trim()) return [entry.imageUrl.trim()];
    return [];
  };

  const addImage = (base64OrUrl) => {
    const current = getImages();
    setEntry(prev => ({ ...prev, images: [...current, base64OrUrl], imageUrl: '' }));
  };

  const removeImage = (index) => {
    const current = getImages();
    const updated = current.filter((_, i) => i !== index);
    setEntry(prev => ({ ...prev, images: updated, imageUrl: '' }));
  };

  const processImageFile = (file) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new window.Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_WIDTH = 1200;
        let width = img.width;
        let height = img.height;
        if (width > MAX_WIDTH) {
          height = Math.round((height * MAX_WIDTH) / width);
          width = MAX_WIDTH;
        }
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);
        const compressedBase64 = canvas.toDataURL('image/jpeg', 0.6);
        addImage(compressedBase64);
        toast.success('Image added!');
      };
      img.src = event.target.result;
    };
    reader.readAsDataURL(file);
  };

  const handleFileSelect = (e) => {
    const files = e.target.files;
    if (!files) return;
    for (let i = 0; i < files.length; i++) {
      if (files[i].type.startsWith('image/')) {
        processImageFile(files[i]);
      }
    }
    e.target.value = '';
  };

  const handlePasteBoxPaste = (e) => {
    const items = e.clipboardData?.items;
    if (!items) return;
    for (let i = 0; i < items.length; i++) {
      if (items[i].type.startsWith('image/')) {
        e.preventDefault();
        const file = items[i].getAsFile();
        if (file) processImageFile(file);
        if (pasteBoxRef.current) {
          setTimeout(() => { if (pasteBoxRef.current) pasteBoxRef.current.innerHTML = ''; }, 0);
        }
        return;
      }
    }
  };

  useEffect(() => {
    const entries = loadJournalEntries();
    if (entries[currentDate]) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setEntry({ ...emptyJournalEntry, ...entries[currentDate] });
    } else {
      setEntry({ ...emptyJournalEntry });
    }
  }, [currentDate]);

  const updateField = (field, value) => {
    setEntry(prev => ({ ...prev, [field]: value }));
  };

  /* ── Goal helpers ── */
  const addGoal = () => {
    const text = newGoalText.trim();
    if (!text) return;
    const goal = { id: Date.now(), text, achieved: null };
    setEntry(prev => ({ ...prev, sessionGoals: [...(prev.sessionGoals || []), goal] }));
    setNewGoalText('');
  };

  const toggleGoal = (id, value) => {
    setEntry(prev => ({
      ...prev,
      sessionGoals: (prev.sessionGoals || []).map(g => g.id === id ? { ...g, achieved: g.achieved === value ? null : value } : g),
    }));
  };

  const removeGoal = (id) => {
    setEntry(prev => ({ ...prev, sessionGoals: (prev.sessionGoals || []).filter(g => g.id !== id) }));
  };

  const handleSave = () => {
    const currentImages = getImages();
    const sanitized = {
      ...entry,
      title: (entry.title || '').trim(),
      preMarketBias: (entry.preMarketBias || '').trim(),
      spyGapStatus: (entry.spyGapStatus || '').trim(),
      keyLevels: (entry.keyLevels || '').trim(),
      watchlist: (entry.watchlist || '').trim(),
      maxLossForDay: (entry.maxLossForDay || '').trim(),
      maxTradesForDay: (entry.maxTradesForDay || '').trim(),
      preMarketPlan: (entry.preMarketPlan || '').trim().replace(/<[^>]*>/g, ''),
      sessionGoals: (entry.sessionGoals || []).map(g => ({ ...g, text: (g.text || '').trim() })).filter(g => g.text),
      postMarketReview: (entry.postMarketReview || '').trim().replace(/<[^>]*>/g, ''),
      lessonsLearned: (entry.lessonsLearned || '').trim().replace(/<[^>]*>/g, ''),
      mistakes: (entry.mistakes || '').trim().replace(/<[^>]*>/g, ''),
      whatWorked: (entry.whatWorked || '').trim().replace(/<[^>]*>/g, ''),
      images: currentImages,
      imageUrl: '',  // Migrate old field away
      tags: entry.tags || [],
      checklist: entry.checklist || { checkedNews: false, reviewedPlaybook: false, setHardStop: false, mentalClear: false },
      tiltScore: parseInt(entry.tiltScore) || 1,
    };
    saveJournalEntry(currentDate, sanitized);
    toast.success('Journal Saved');
  };

  const todayStats = calcDailyStats(todayTrades);

  const getDisciplineColor = (score) => {
    if (score >= 4) return 'var(--color-profit)';
    if (score === 3) return 'var(--color-cyan)';
    return 'var(--color-loss)';
  };

  const getDisciplineLabel = (score) => {
    if (score === 5) return 'PERFECT';
    if (score === 4) return 'DISCIPLINED';
    if (score === 3) return 'MODERATE';
    if (score === 2) return 'SLOPPY';
    if (score === 1) return 'GAMBLING';
    return 'NOT RATED';
  };

  const images = getImages();

  return (
    <div className="h-full w-full fade-in" style={fontStyle}>
      {/* ── Sticky Top Bar ── */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '16px 24px',
        background: 'var(--bg-sidebar)',
        borderBottom: '1px solid var(--border-card)',
        flexShrink: 0,
        gap: 12,
        flexWrap: 'wrap',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
          <BookOpen size={18} style={{ color: 'var(--text-accent)', flexShrink: 0 }} />
          <div style={{ minWidth: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-dark)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              Daily Journal
            </div>
            <div className="flex items-center gap-1 ml-2">
              <button
                onClick={() => {
                  if (!onSelectDate) return;
                  const [y, m, day] = currentDate.split('-');
                  const dateObj = new Date(y, m - 1, day);
                  dateObj.setDate(dateObj.getDate() - 1);
                  const prevStr = `${dateObj.getFullYear()}-${String(dateObj.getMonth() + 1).padStart(2, '0')}-${String(dateObj.getDate()).padStart(2, '0')}`;
                  onSelectDate(prevStr);
                }}
                className="p-1.5 rounded-md hover:bg-white/5 text-[var(--text-secondary)] transition-colors cursor-pointer"
              >
                <ChevronLeft size={16} />
              </button>
              <input
                type="date"
                value={currentDate}
                onChange={(e) => onSelectDate && onSelectDate(e.target.value)}
                style={{ fontSize: 12, color: 'var(--text-secondary)', background: 'transparent', border: 'none', outline: 'none', cursor: 'pointer', ...monoStyle }}
              />
              <button
                onClick={() => {
                  if (!onSelectDate) return;
                  const [y, m, day] = currentDate.split('-');
                  const dateObj = new Date(y, m - 1, day);
                  dateObj.setDate(dateObj.getDate() + 1);
                  const nextStr = `${dateObj.getFullYear()}-${String(dateObj.getMonth() + 1).padStart(2, '0')}-${String(dateObj.getDate()).padStart(2, '0')}`;
                  onSelectDate(nextStr);
                }}
                className="p-1.5 rounded-md hover:bg-white/5 text-[var(--text-secondary)] transition-colors cursor-pointer"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        </div>
        <button
          onClick={handleSave}
          style={{
            display: 'flex', alignItems: 'center', gap: 8,
            padding: '10px 22px',
            fontSize: 12, fontWeight: 700,
            textTransform: 'uppercase', letterSpacing: '0.1em',
            cursor: 'pointer',
            background: 'var(--border-active)',
            color: 'var(--bg-app)',
            border: 'none', borderRadius: 10,
            transition: 'all 0.2s ease',
            flexShrink: 0,
            ...fontStyle,
          }}
        >
          <Save size={14} />
          SAVE JOURNAL
        </button>
      </div>

      {/* ── Scrollable Content ── */}
      <div style={{
        flex: 1, overflowY: 'auto',
        padding: '24px',
        background: 'var(--bg-app)',
        height: 'calc(100% - 64px)',
      }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>

          {/* ═══════════════════════════════════════════════
              SECTION 1: TITLE + TAGS + PERFORMANCE STRIP
              ═══════════════════════════════════════════════ */}
          <div style={{ marginBottom: 24 }}>
            <input
              type="text"
              placeholder="Give this day a title... (e.g. Big NVDA Earnings Miss, Choppy Range Day)"
              value={entry.title || ''}
              onChange={e => updateField('title', e.target.value)}
              style={{
                width: '100%', fontSize: 28, fontWeight: 800,
                color: 'var(--text-dark)', background: 'transparent',
                border: 'none', outline: 'none', padding: '8px 0',
                borderBottom: '2px solid var(--border-card)',
                transition: 'border-color 0.2s', letterSpacing: '-0.02em', ...fontStyle
              }}
              onFocus={e => e.target.style.borderBottom = '2px solid var(--border-active)'}
              onBlur={e => e.target.style.borderBottom = '2px solid var(--border-card)'}
            />
            {/* Tags */}
            <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 8, marginTop: 12 }}>
              <Hash size={16} style={{ color: 'var(--text-secondary)' }} />
              {(entry.tags || []).map(tag => (
                <div key={tag} style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'var(--bg-input)', padding: '4px 10px', borderRadius: 8, border: '1px solid var(--border-input)', fontSize: 12, fontWeight: 600, color: 'var(--text-primary)' }}>
                  #{tag}
                  <XCircle size={12} className="cursor-pointer hover:text-[var(--color-loss)] transition-colors" onClick={() => removeTag(tag)} />
                </div>
              ))}
              <input type="text" placeholder="Add tag and press Enter" value={tagInputText} onChange={e => setTagInputText(e.target.value)} onKeyDown={handleAddTag}
                style={{ background: 'transparent', border: 'none', outline: 'none', color: 'var(--text-primary)', fontSize: 13, minWidth: 160, ...fontStyle }}
              />
            </div>
          </div>

          {/* Quick Stats Strip */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10, marginBottom: 24 }}>
            {[
              { label: 'NET P&L', value: formatCurrency(todayStats.totalNetPnl), color: todayStats.totalNetPnl >= 0 ? 'var(--color-profit)' : 'var(--color-loss)', cls: todayStats.totalNetPnl >= 0 ? 'kpi-container-profit' : 'kpi-container-loss' },
              { label: 'WIN RATE', value: formatPercent(todayStats.winRate), color: 'var(--color-cyan)', cls: 'kpi-container-cyan' },
              { label: 'TRADES', value: formatNumber(todayStats.totalTrades), color: 'var(--text-primary)', cls: 'kpi-container-slate' },
              { label: 'PROFIT FACTOR', value: todayStats.profitFactor === Infinity ? '∞' : todayStats.profitFactor.toFixed(2), color: todayStats.profitFactor >= 1 ? 'var(--color-profit)' : 'var(--color-loss)', cls: todayStats.profitFactor >= 1 ? 'kpi-container-profit' : 'kpi-container-loss' },
            ].map(item => (
              <div key={item.label} className={item.cls} style={{ padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 4 }}>
                <span style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.15em', color: 'var(--text-secondary)', ...fontStyle }}>{item.label}</span>
                <span style={{ fontSize: 22, fontWeight: 800, color: item.color, ...monoStyle, lineHeight: 1 }}>{item.value}</span>
              </div>
            ))}
          </div>


          {/* ═══════════════════════════════════════════════
              SECTION 2: PRE-SESSION WAR ROOM
              ═══════════════════════════════════════════════ */}
          <div className="glass-panel" style={{ ...panelStyle, padding: '28px', border: '1px solid var(--border-card)', marginBottom: 20 }}>
            <SectionHeader
              icon={<ClipboardList size={16} style={{ color: 'var(--text-accent)' }} />}
              title="Pre-Session War Room"
              subtitle="Complete this BEFORE the market opens"
            />

            {/* Row 1: Market Context + Checklist */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 240px', gap: 20, marginBottom: 20 }}>
              <div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 14, marginBottom: 16 }}>
                  {/* Market Bias */}
                  <div>
                    <FieldLabel>Market Bias</FieldLabel>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                      {[['Bullish', 'var(--color-profit)'], ['Bearish', 'var(--color-loss)'], ['Neutral', 'var(--text-secondary)'], ['Cautious', 'var(--color-cyan)']].map(([label, col]) => (
                        <button key={label} onClick={() => updateField('preMarketBias', entry.preMarketBias === label ? '' : label)} style={{
                          padding: '7px 14px', borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: 'pointer',
                          border: `1.5px solid ${entry.preMarketBias === label ? col : 'var(--border-card)'}`,
                          background: entry.preMarketBias === label ? `color-mix(in srgb, ${col} 12%, var(--bg-card))` : 'var(--bg-input)',
                          color: entry.preMarketBias === label ? col : 'var(--text-secondary)',
                          transition: 'all 0.15s ease', ...fontStyle,
                        }}>{label}</button>
                      ))}
                    </div>
                  </div>
                  {/* SPY Gap */}
                  <div>
                    <FieldLabel>SPY Gap</FieldLabel>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                      {[['Gap Up ↑', 'var(--color-profit)'], ['Gap Down ↓', 'var(--color-loss)'], ['Flat →', 'var(--text-secondary)']].map(([label, col]) => (
                        <button key={label} onClick={() => updateField('spyGapStatus', entry.spyGapStatus === label ? '' : label)} style={{
                          padding: '7px 14px', borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: 'pointer',
                          border: `1.5px solid ${entry.spyGapStatus === label ? col : 'var(--border-card)'}`,
                          background: entry.spyGapStatus === label ? `color-mix(in srgb, ${col} 12%, var(--bg-card))` : 'var(--bg-input)',
                          color: entry.spyGapStatus === label ? col : 'var(--text-secondary)',
                          transition: 'all 0.15s ease', ...fontStyle,
                        }}>{label}</button>
                      ))}
                    </div>
                  </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                  <div>
                    <FieldLabel>Daily Max Loss ($)</FieldLabel>
                    <input type="number" inputMode="decimal" value={entry.maxLossForDay || ''} onChange={e => updateField('maxLossForDay', e.target.value)} placeholder="e.g. 500"
                      style={{ width: '100%', padding: '10px 14px', fontSize: 14, fontWeight: 600, border: '1px solid var(--border-input)', borderRadius: 10, ...inputStyle, ...monoStyle }}
                    />
                  </div>
                  <div>
                    <FieldLabel>Max Trades Today</FieldLabel>
                    <input type="number" inputMode="numeric" value={entry.maxTradesForDay || ''} onChange={e => updateField('maxTradesForDay', e.target.value)} placeholder="e.g. 5"
                      style={{ width: '100%', padding: '10px 14px', fontSize: 14, fontWeight: 600, border: '1px solid var(--border-input)', borderRadius: 10, ...inputStyle, ...monoStyle }}
                    />
                  </div>
                </div>
              </div>
              {/* Checklist */}
              <div>
                <FieldLabel>Pre-Flight Checklist</FieldLabel>
                <div style={{ background: 'var(--bg-input)', border: '1px solid var(--border-input)', borderRadius: 10, padding: '14px', display: 'flex', flexDirection: 'column', gap: 12, height: 'calc(100% - 28px)' }}>
                  {[
                    { key: 'checkedNews', label: 'Checked Econ/News' },
                    { key: 'reviewedPlaybook', label: 'Reviewed Playbook' },
                    { key: 'setHardStop', label: 'Hard Stop in Broker' },
                    { key: 'mentalClear', label: 'Mentally Clear & Ready' }
                  ].map(item => {
                    const isChecked = entry.checklist?.[item.key];
                    return (
                      <label key={item.key} onClick={() => {
                        const cl = entry.checklist || { checkedNews: false, reviewedPlaybook: false, setHardStop: false, mentalClear: false };
                        updateField('checklist', { ...cl, [item.key]: !cl[item.key] });
                      }} style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', fontSize: 13, fontWeight: 600, color: isChecked ? 'var(--text-secondary)' : 'var(--text-primary)', textDecoration: isChecked ? 'line-through' : 'none' }}>
                        {isChecked ? <CheckSquare size={16} style={{ color: 'var(--color-profit)' }} /> : <div style={{ width: 16, height: 16, borderRadius: 4, border: '2px solid var(--border-active)' }} />}
                        <span>{item.label}</span>
                      </label>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Row 2: Key Levels + Watchlist */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 20 }}>
              <div>
                <FieldLabel>Key S/R Levels</FieldLabel>
                <textarea value={entry.keyLevels || ''} onChange={e => updateField('keyLevels', e.target.value)}
                  placeholder={'SPY: 548.50 support / 551 resistance\nQQQ: 465 key level\nNVDA: VWAP watch'} rows={3}
                  style={{ width: '100%', padding: '12px 14px', fontSize: 13, fontWeight: 500, lineHeight: 1.6, border: '1px solid var(--border-input)', resize: 'vertical', borderRadius: 10, ...inputStyle, ...fontStyle }}
                />
              </div>
              <div>
                <FieldLabel>Watchlist / Tickers on Radar</FieldLabel>
                <textarea value={entry.watchlist || ''} onChange={e => updateField('watchlist', e.target.value)}
                  placeholder={'NVDA — earnings gap play\nAAPL — VWAP bounce setup\nSPY — trend continuation'} rows={3}
                  style={{ width: '100%', padding: '12px 14px', fontSize: 13, fontWeight: 500, lineHeight: 1.6, border: '1px solid var(--border-input)', resize: 'vertical', borderRadius: 10, ...inputStyle, ...fontStyle }}
                />
              </div>
            </div>

            {/* Row 3: Pre-Market Thesis */}
            <div style={{ marginBottom: 24 }}>
              <FieldLabel>Pre-Market Thesis & Catalysts</FieldLabel>
              <textarea value={entry.preMarketPlan || ''} onChange={e => updateField('preMarketPlan', e.target.value)}
                placeholder={'Macro: Fed minutes today at 2 PM — expect volatility spike\nSector: Tech leadership strong — look for continuation\nCatalyst: NVDA guidance tonight — don\'t hold overnight'} rows={3}
                style={{ width: '100%', padding: '14px 16px', fontSize: 13, fontWeight: 500, lineHeight: 1.7, border: '1px solid var(--border-input)', resize: 'vertical', minHeight: 90, borderRadius: 10, ...inputStyle, ...fontStyle }}
              />
            </div>

            {/* Row 4: Session Intentions */}
            <div style={{ borderTop: '1px solid var(--border-card)', paddingTop: 20 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
                <Target size={14} style={{ color: 'var(--text-accent)' }} />
                <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-dark)', textTransform: 'uppercase', letterSpacing: '0.08em', ...fontStyle }}>Session Intentions & Rules</span>
                <span style={{ fontSize: 11, color: 'var(--text-secondary)', fontWeight: 500, marginLeft: 4 }}>— tick ✅/❌ after the session</span>
              </div>

              {/* Tally */}
              {(entry.sessionGoals || []).length > 0 && (() => {
                const goals = entry.sessionGoals || [];
                const achieved = goals.filter(g => g.achieved === true).length;
                const missed = goals.filter(g => g.achieved === false).length;
                const pending = goals.filter(g => g.achieved === null).length;
                const pct = goals.length ? Math.round((achieved / goals.length) * 100) : 0;
                return (
                  <div style={{ display: 'flex', gap: 10, marginBottom: 14, flexWrap: 'wrap' }}>
                    {[
                      [achieved, 'Achieved', 'var(--color-profit)', 'var(--bg-kpi-profit)', 'var(--border-profit)'],
                      [missed,   'Missed',   'var(--color-loss)',   'var(--bg-kpi-loss)',   'var(--border-loss)'],
                      [pending,  'Pending',  'var(--text-primary)', 'var(--bg-card)',        'var(--border-card)'],
                      [`${pct}%`, 'Score', pct >= 70 ? 'var(--color-profit)' : pct >= 40 ? 'var(--text-primary)' : 'var(--color-loss)', pct >= 70 ? 'var(--bg-kpi-profit)' : pct >= 40 ? 'var(--bg-card)' : 'var(--bg-kpi-loss)', pct >= 70 ? 'var(--border-profit)' : pct >= 40 ? 'var(--border-card)' : 'var(--border-loss)'],
                    ].map(([val, label, color, bg, border]) => (
                      <div key={label} style={{ flex: 1, minWidth: 70, background: bg, border: `1px solid ${border}`, borderRadius: 10, padding: '10px 12px', textAlign: 'center' }}>
                        <div style={{ fontSize: 18, fontWeight: 900, color, ...monoStyle }}>{val}</div>
                        <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.08em', marginTop: 2 }}>{label}</div>
                      </div>
                    ))}
                  </div>
                );
              })()}

              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 12 }}>
                {(entry.sessionGoals || []).length === 0 && (
                  <div style={{ textAlign: 'center', padding: '16px 0', color: 'var(--text-secondary)', fontSize: 13, opacity: 0.6 }}>
                    No intentions yet — add your first rule below.
                  </div>
                )}
                {(entry.sessionGoals || []).map((goal) => (
                  <div key={goal.id} style={{
                    display: 'flex', alignItems: 'center', gap: 10, padding: '11px 14px',
                    background: goal.achieved === true ? 'var(--bg-kpi-profit)' : goal.achieved === false ? 'var(--bg-kpi-loss)' : 'var(--bg-sidebar)',
                    border: `1px solid ${goal.achieved === true ? 'var(--border-profit)' : goal.achieved === false ? 'var(--border-loss)' : 'var(--border-card)'}`,
                    borderRadius: 10, transition: 'all 0.15s ease',
                  }}>
                    <span style={{ flex: 1, fontSize: 13, fontWeight: 500, color: 'var(--text-primary)', lineHeight: 1.5 }}>{goal.text}</span>
                    <button onClick={() => toggleGoal(goal.id, true)} title="Mark achieved"
                      style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, display: 'flex', alignItems: 'center', opacity: goal.achieved === true ? 1 : 0.3, transition: 'opacity 0.15s' }}>
                      <CheckCircle size={17} style={{ color: 'var(--color-profit)' }} />
                    </button>
                    <button onClick={() => toggleGoal(goal.id, false)} title="Mark missed"
                      style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, display: 'flex', alignItems: 'center', opacity: goal.achieved === false ? 1 : 0.3, transition: 'opacity 0.15s' }}>
                      <XCircle size={17} style={{ color: 'var(--color-loss)' }} />
                    </button>
                    <button onClick={() => removeGoal(goal.id)} title="Remove"
                      style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, display: 'flex', alignItems: 'center', opacity: 0.25, transition: 'opacity 0.15s' }}>
                      <Trash2 size={14} style={{ color: 'var(--text-secondary)' }} />
                    </button>
                  </div>
                ))}
              </div>

              <div style={{ display: 'flex', gap: 8 }}>
                <input type="text" value={newGoalText} onChange={e => setNewGoalText(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && addGoal()}
                  placeholder="e.g.  No FOMO entries · Wait for clean setup · Stop after 3 losses"
                  style={{ flex: 1, padding: '11px 14px', fontSize: 13, fontWeight: 500, border: '1px solid var(--border-input)', borderRadius: 10, outline: 'none', ...inputStyle, ...fontStyle }}
                />
                <button onClick={addGoal} style={{
                  padding: '11px 18px', borderRadius: 10, border: '1px solid var(--border-active)',
                  background: 'var(--bg-badge-profit)', color: 'var(--text-accent)',
                  cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6,
                  fontSize: 12, fontWeight: 700, whiteSpace: 'nowrap', ...fontStyle,
                }}>
                  <Plus size={14} /> Add Rule
                </button>
              </div>
            </div>
          </div>


          {/* ═══════════════════════════════════════════════
              SECTION 3: SESSION TRADES TABLE
              ═══════════════════════════════════════════════ */}
          <div className="glass-panel" style={{ ...panelStyle, padding: '24px', border: '1px solid var(--border-card)', marginBottom: 20 }}>
            <SectionHeader
              icon={<Award size={16} style={{ color: 'var(--text-accent)' }} />}
              title={`Session Trades (${todayTrades.length})`}
              subtitle="Trades executed during this session"
            />
            <div style={{
              maxHeight: 350, overflowY: 'auto',
              border: '1px solid var(--border-card)', background: 'var(--bg-input)', borderRadius: 10, padding: 4,
            }}>
              {todayTrades.length === 0 ? (
                <div style={{ height: 120, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                  <Frown size={24} style={{ color: 'var(--text-secondary)', opacity: 0.4 }} />
                  <p style={{ fontSize: 13, color: 'var(--text-secondary)', fontWeight: 600 }}>No trades yet for this day</p>
                </div>
              ) : (
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid var(--border-card)' }}>
                      {['Time', 'Ticker', 'Dir', 'Net P&L', 'Mistake', ''].map((head, hi) => (
                        <th key={hi} style={{ padding: '10px 14px', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.12em', color: 'var(--text-secondary)', textAlign: 'left', whiteSpace: 'nowrap', ...fontStyle }}>{head}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {todayTrades.map((t) => (
                      <tr key={t.id} style={{ borderBottom: '1px solid var(--border-card)', background: t.isOpen ? 'var(--accent-glow)' : t.netPnl >= 0 ? 'var(--bg-kpi-profit)' : 'var(--bg-kpi-loss)', transition: 'background 0.15s ease' }}>
                        <td style={{ padding: '10px 14px', fontSize: 12, color: 'var(--text-primary)', whiteSpace: 'nowrap', ...monoStyle, fontWeight: 600 }}>{t.time}</td>
                        <td style={{ padding: '10px 14px' }}>
                          <a href={`https://www.tradingview.com/chart/?symbol=${t.ticker}`} target="_blank" rel="noopener noreferrer"
                            style={{ color: 'var(--text-accent)', fontWeight: 800, fontSize: 13, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 4, whiteSpace: 'nowrap', ...monoStyle }}>
                            {t.ticker}<ExternalLink size={10} style={{ opacity: 0.5 }} />
                          </a>
                        </td>
                        <td style={{ padding: '10px 14px', fontWeight: 700, fontSize: 12, color: t.direction === 'Long' ? 'var(--color-profit)' : 'var(--color-loss)', whiteSpace: 'nowrap' }}>{t.direction === 'Long' ? 'LONG' : 'SHORT'}</td>
                        <td style={{ padding: '10px 14px' }}>
                          {t.isOpen ? <span className="badge-open" style={{ fontSize: 10, padding: '4px 10px' }}>OPEN</span>
                            : t.netPnl >= 0 ? <span className="badge-profit" style={{ fontSize: 10, padding: '4px 10px' }}>{formatCurrency(t.netPnl)}</span>
                            : <span className="badge-loss" style={{ fontSize: 10, padding: '4px 10px' }}>{formatCurrency(t.netPnl)}</span>}
                        </td>
                        <td style={{ padding: '10px 14px', fontSize: 11, color: 'var(--color-loss)', maxWidth: 120, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontWeight: 600 }} title={t.mistake || 'None'}>
                          {t.mistake && t.mistake !== 'None' ? t.mistake.split('/')[0] : '—'}
                        </td>
                        <td style={{ padding: '10px 14px', textAlign: 'right' }}>
                          <button onClick={() => onEditTrade(t)} style={{ padding: '6px 14px', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', border: '1px solid var(--border-card)', color: 'var(--text-secondary)', background: 'var(--bg-sidebar)', cursor: 'pointer', borderRadius: 10, transition: 'all 0.15s ease', ...fontStyle }}>Edit</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>


          {/* ═══════════════════════════════════════════════
              SECTION 4: POST-SESSION REVIEW (2 columns)
              ═══════════════════════════════════════════════ */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5" style={{ marginBottom: 20 }}>

            {/* LEFT: Execution Quality */}
            <div className="glass-panel" style={{ ...panelStyle, padding: '24px', border: '1px solid var(--border-card)' }}>
              <SectionHeader
                icon={<Activity size={16} style={{ color: 'var(--text-accent)' }} />}
                title="Execution Quality"
                subtitle="Rate your performance and mindset"
              />

              {/* Grade */}
              <div style={{ marginBottom: 24 }}>
                <FieldLabel>Execution Grade</FieldLabel>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  {GRADES.map((g) => {
                    const isSelected = entry.grade === g;
                    let activeBg = 'var(--color-cyan)';
                    if (g.startsWith('C')) activeBg = 'var(--color-profit)';
                    if (g.startsWith('D') || g === 'F') activeBg = 'var(--color-loss)';
                    return (
                      <button key={g} onClick={() => updateField('grade', g)} style={{
                        width: 44, height: 44, borderRadius: 8,
                        border: `2px solid ${isSelected ? activeBg : 'var(--border-card)'}`,
                        background: isSelected ? activeBg : 'var(--bg-input)',
                        color: isSelected ? 'var(--bg-app)' : 'var(--text-secondary)',
                        fontSize: 13, fontWeight: 800, cursor: 'pointer',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        transition: 'all 0.15s ease', boxShadow: isSelected ? `0 0 16px ${activeBg}50` : 'none', ...fontStyle,
                      }}>{g}</button>
                    );
                  })}
                </div>
              </div>

              {/* Discipline */}
              <div style={{ marginBottom: 24 }}>
                <FieldLabel>Rule Adherence & Discipline</FieldLabel>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                  {[1, 2, 3, 4, 5].map((level) => {
                    const isActive = (entry.discipline || 0) >= level;
                    const activeColor = getDisciplineColor(entry.discipline || 0);
                    return (
                      <button key={level} onClick={() => updateField('discipline', level)} style={{
                        width: 44, height: 38, border: `2px solid ${isActive ? activeColor : 'var(--border-card)'}`,
                        background: isActive ? `${activeColor}18` : 'transparent', color: isActive ? activeColor : 'var(--text-secondary)',
                        fontSize: 16, fontWeight: 800, cursor: 'pointer', borderRadius: 8, transition: 'all 0.15s ease', ...monoStyle,
                      }}>{isActive ? '█' : '░'}</button>
                    );
                  })}
                  <span style={{ fontSize: 12, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em', color: getDisciplineColor(entry.discipline || 0), marginLeft: 8, ...monoStyle }}>
                    {getDisciplineLabel(entry.discipline || 0)}
                  </span>
                </div>
              </div>

              {/* Tilt */}
              <div style={{ marginBottom: 24 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <FieldLabel>Emotional Tilt Score</FieldLabel>
                  <span style={{ fontSize: 13, fontWeight: 700, color: entry.tiltScore >= 7 ? 'var(--color-loss)' : entry.tiltScore <= 3 ? 'var(--color-profit)' : 'var(--text-secondary)' }}>
                    {entry.tiltScore} / 10
                  </span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <Thermometer size={16} style={{ color: entry.tiltScore >= 7 ? 'var(--color-loss)' : entry.tiltScore <= 3 ? 'var(--color-profit)' : 'var(--text-secondary)' }} />
                  <input type="range" min="1" max="10" value={entry.tiltScore || 1} onChange={e => updateField('tiltScore', parseInt(e.target.value))}
                    style={{ flex: 1, accentColor: entry.tiltScore >= 7 ? 'var(--color-loss)' : entry.tiltScore <= 3 ? 'var(--color-profit)' : 'var(--color-cyan)', cursor: 'pointer' }}
                  />
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: 'var(--text-secondary)', marginTop: 4, fontWeight: 600 }}>
                  <span>Flow State</span><span>Frustrated</span><span>Full Tilt</span>
                </div>
              </div>

              {/* Mood & Market */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                <div>
                  <FieldLabel>Trader Mood</FieldLabel>
                  <select value={entry.mood} onChange={e => updateField('mood', e.target.value)}
                    style={{ width: '100%', padding: '10px 14px', fontSize: 13, fontWeight: 600, border: '1px solid var(--border-input)', cursor: 'pointer', ...inputStyle }}>
                    {MOODS.map(m => <option key={m.value} value={m.value}>{m.emoji} {m.label}</option>)}
                  </select>
                </div>
                <div>
                  <FieldLabel>Market Conditions</FieldLabel>
                  <select value={entry.marketConditions} onChange={e => updateField('marketConditions', e.target.value)}
                    style={{ width: '100%', padding: '10px 14px', fontSize: 13, fontWeight: 600, border: '1px solid var(--border-input)', cursor: 'pointer', ...inputStyle }}>
                    {MARKET_CONDITIONS.map(mc => <option key={mc.value} value={mc.value}>{mc.label}</option>)}
                  </select>
                </div>
              </div>
            </div>

            {/* RIGHT: Written Review */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              <div className="glass-panel" style={{ ...panelStyle, padding: '24px', border: '1px solid var(--border-card)' }}>
                <SectionHeader
                  icon={<CheckCircle2 size={16} style={{ color: 'var(--text-accent)' }} />}
                  title="Strengths & Weaknesses"
                  subtitle="What worked and what didn't"
                />
                <div style={{ marginBottom: 16 }}>
                  <FieldLabel color="var(--color-profit)">✓ What Worked Well</FieldLabel>
                  <textarea value={entry.whatWorked || ''} onChange={e => updateField('whatWorked', e.target.value)}
                    placeholder="• Patient entries on AAPL pullback&#10;• Followed stop loss rules" rows={3}
                    style={{ width: '100%', padding: '12px 14px', fontSize: 13, fontWeight: 500, lineHeight: 1.7, border: '1px solid var(--border-input)', resize: 'vertical', minHeight: 80, ...inputStyle }}
                  />
                </div>
                <div>
                  <FieldLabel color="var(--color-loss)">✗ Weaknesses & Rules Broken</FieldLabel>
                  <textarea value={entry.mistakes || ''} onChange={e => updateField('mistakes', e.target.value)}
                    placeholder="• Over-leveraged on TSLA trade&#10;• Chased the breakout" rows={3}
                    style={{ width: '100%', padding: '12px 14px', fontSize: 13, fontWeight: 500, lineHeight: 1.7, border: '1px solid var(--border-input)', resize: 'vertical', minHeight: 80, ...inputStyle }}
                  />
                </div>
              </div>

              <div className="glass-panel" style={{ ...panelStyle, padding: '24px', border: '1px solid var(--border-card)', flex: 1 }}>
                <SectionHeader
                  icon={<Brain size={16} style={{ color: 'var(--text-accent)' }} />}
                  title="Post-Market Analysis"
                  subtitle="Reflect on the session"
                />
                <div style={{ marginBottom: 16 }}>
                  <FieldLabel>Session Review & Diagnostics</FieldLabel>
                  <textarea value={entry.postMarketReview || ''} onChange={e => updateField('postMarketReview', e.target.value)}
                    placeholder="• Cut losers early but held NVDA too long&#10;• Market was choppy — should have reduced size" rows={3}
                    style={{ width: '100%', padding: '12px 14px', fontSize: 13, fontWeight: 500, lineHeight: 1.7, border: '1px solid var(--border-input)', resize: 'vertical', minHeight: 80, ...inputStyle }}
                  />
                </div>
                <div>
                  <FieldLabel>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <AlertTriangle size={12} />
                      Golden Lesson / Key Takeaway
                    </span>
                  </FieldLabel>
                  <textarea value={entry.lessonsLearned || ''} onChange={e => updateField('lessonsLearned', e.target.value)}
                    placeholder="Do not chase high-of-day breakouts when volume is weak." rows={2}
                    style={{ width: '100%', padding: '12px 14px', fontSize: 13, fontWeight: 500, lineHeight: 1.7, resize: 'vertical', minHeight: 60, ...inputStyle, border: '2px solid var(--border-profit)', background: 'var(--accent-glow)' }}
                  />
                </div>
              </div>
            </div>
          </div>


          {/* ═══════════════════════════════════════════════
              SECTION 5: CHARTS OF DAY (full width, multi-image)
              ═══════════════════════════════════════════════ */}
          <div className="glass-panel" style={{ ...panelStyle, padding: '24px', border: '1px solid var(--border-card)', marginBottom: 20 }}>
            <SectionHeader
              icon={<Image size={16} style={{ color: 'var(--text-accent)' }} />}
              title={`Charts of Day (${images.length})`}
              subtitle="Paste screenshots or upload images of your setups"
            />

            {/* Hidden file input (multiple) */}
            <input ref={fileInputRef} type="file" accept="image/*" multiple onChange={handleFileSelect} style={{ display: 'none' }} />

            {/* Upload + Paste row */}
            <div style={{ display: 'flex', gap: 10, marginBottom: 16 }}>
              <button onClick={() => fileInputRef.current?.click()}
                style={{ padding: '10px 18px', borderRadius: 10, background: 'var(--accent-glow)', border: '1px solid var(--border-active)', color: 'var(--text-accent)', fontSize: 12, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, ...fontStyle }}>
                <Upload size={14} /> Upload Images
              </button>
              <div
                ref={pasteBoxRef}
                contentEditable
                onPaste={handlePasteBoxPaste}
                suppressContentEditableWarning
                style={{
                  flex: 1, padding: '10px 16px', textAlign: 'center',
                  border: '2px dashed var(--border-active)', borderRadius: 10,
                  background: 'var(--bg-input)', color: 'var(--text-secondary)',
                  fontSize: 13, cursor: 'text', outline: 'none', ...fontStyle
                }}
                onFocus={e => { e.currentTarget.style.background = 'var(--accent-glow)'; e.currentTarget.style.borderColor = 'var(--text-accent)'; }}
                onBlur={e => { e.currentTarget.style.background = 'var(--bg-input)'; e.currentTarget.style.borderColor = 'var(--border-active)'; if (pasteBoxRef.current) pasteBoxRef.current.innerHTML = ''; }}
                data-placeholder="Click here, then Cmd+V to paste a screenshot"
              ></div>
            </div>

            {/* Image Gallery Grid */}
            {images.length > 0 && (
              <div style={{ display: 'grid', gridTemplateColumns: images.length === 1 ? '1fr' : 'repeat(auto-fill, minmax(300px, 1fr))', gap: 12 }}>
                {images.map((src, idx) => (
                  <div key={idx} style={{ borderRadius: 10, overflow: 'hidden', border: '1px solid var(--border-card)', background: 'var(--bg-input)', position: 'relative' }}>
                    <button onClick={() => removeImage(idx)}
                      style={{ position: 'absolute', top: 8, right: 8, background: 'rgba(0,0,0,0.6)', color: '#fff', border: 'none', borderRadius: '50%', width: 26, height: 26, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', zIndex: 2 }}>
                      <XCircle size={14} />
                    </button>
                    <img src={src} alt={`Chart ${idx + 1}`} style={{ width: '100%', display: 'block', objectFit: 'contain' }} onError={(e) => e.target.style.display = 'none'} />
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}
