import { useState, useEffect } from 'react';
import { Save, Frown, ExternalLink, BookOpen, Activity, Award, CheckCircle2, Target, Brain, TrendingUp, AlertTriangle, ChevronLeft, ChevronRight, Plus, Trash2, CheckCircle, XCircle, ClipboardList } from 'lucide-react';
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
    const sanitized = {
      ...entry,
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
            
            {/* Date Navigation Controls */}
            <div className="flex items-center gap-1 ml-2">
              <button 
                onClick={() => {
                  if (!onSelectDate) return;
                  const d = new Date(currentDate);
                  // handle timezone offsets correctly by using setUTCDate if currentDate is YYYY-MM-DD
                  // actually simpler: parse the string, subtract 1 day
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
                style={{ 
                  fontSize: 12, 
                  color: 'var(--text-secondary)', 
                  background: 'transparent',
                  border: 'none',
                  outline: 'none',
                  cursor: 'pointer',
                  ...monoStyle 
                }}
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
        <div style={{
          maxWidth: 1200,
          margin: '0 auto',
        }}>
          {/* ════════════════════════════════════════════
              PRE-SESSION WAR ROOM — Full width at top
              ════════════════════════════════════════════ */}
          <div className="glass-panel" style={{ ...panelStyle, padding: '28px', border: '1px solid var(--border-card)', marginBottom: 20 }}>
            <SectionHeader
              icon={<ClipboardList size={16} style={{ color: 'var(--text-accent)' }} />}
              title="Pre-Session War Room"
              subtitle="Complete this BEFORE the market opens. Revisit after session to tally your discipline."
            />

            {/* ── Row 1: Market Context ── */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 14, marginBottom: 20 }}>

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

              {/* Max Loss */}
              <div>
                <FieldLabel>Daily Max Loss ($)</FieldLabel>
                <input
                  type="number" inputMode="decimal"
                  value={entry.maxLossForDay || ''}
                  onChange={e => updateField('maxLossForDay', e.target.value)}
                  placeholder="e.g. 500"
                  style={{ width: '100%', padding: '10px 14px', fontSize: 14, fontWeight: 600, border: '1px solid var(--border-input)', borderRadius: 10, ...inputStyle, ...monoStyle }}
                />
              </div>

              {/* Max Trades */}
              <div>
                <FieldLabel>Max Trades Today</FieldLabel>
                <input
                  type="number" inputMode="numeric"
                  value={entry.maxTradesForDay || ''}
                  onChange={e => updateField('maxTradesForDay', e.target.value)}
                  placeholder="e.g. 5"
                  style={{ width: '100%', padding: '10px 14px', fontSize: 14, fontWeight: 600, border: '1px solid var(--border-input)', borderRadius: 10, ...inputStyle, ...monoStyle }}
                />
              </div>
            </div>

            {/* ── Row 2: Key Levels + Watchlist ── */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 20 }}>
              <div>
                <FieldLabel>Key S/R Levels to Watch</FieldLabel>
                <textarea
                  value={entry.keyLevels || ''}
                  onChange={e => updateField('keyLevels', e.target.value)}
                  placeholder={'SPY: 548.50 support / 551 resistance\nQQQ: 465 key level\nNVDA: VWAP watch'}
                  rows={3}
                  style={{ width: '100%', padding: '12px 14px', fontSize: 13, fontWeight: 500, lineHeight: 1.6, border: '1px solid var(--border-input)', resize: 'vertical', borderRadius: 10, ...inputStyle, ...fontStyle }}
                />
              </div>
              <div>
                <FieldLabel>Watchlist / Tickers on Radar</FieldLabel>
                <textarea
                  value={entry.watchlist || ''}
                  onChange={e => updateField('watchlist', e.target.value)}
                  placeholder={'NVDA — earnings gap play\nAAPL — VWAP bounce setup\nSPY — trend continuation'}
                  rows={3}
                  style={{ width: '100%', padding: '12px 14px', fontSize: 13, fontWeight: 500, lineHeight: 1.6, border: '1px solid var(--border-input)', resize: 'vertical', borderRadius: 10, ...inputStyle, ...fontStyle }}
                />
              </div>
            </div>

            {/* ── Row 3: Notes / Thesis / Catalysts ── */}
            <div style={{ marginBottom: 24 }}>
              <FieldLabel>Pre-Market Thesis & Catalysts</FieldLabel>
              <textarea
                value={entry.preMarketPlan || ''}
                onChange={e => updateField('preMarketPlan', e.target.value)}
                placeholder={'Macro: Fed minutes today at 2 PM — expect volatility spike\nSector: Tech leadership strong — look for continuation\nCatalyst: NVDA guidance tonight — don\'t hold overnight\nBias: Wait for first 15-min candle to close before trading'}
                rows={4}
                style={{ width: '100%', padding: '14px 16px', fontSize: 13, fontWeight: 500, lineHeight: 1.7, border: '1px solid var(--border-input)', resize: 'vertical', minHeight: 110, borderRadius: 10, ...inputStyle, ...fontStyle }}
              />
            </div>

            {/* ── Row 4: Intentions Tracker ── */}
            <div style={{ borderTop: '1px solid var(--border-card)', paddingTop: 20 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
                <Target size={14} style={{ color: 'var(--text-accent)' }} />
                <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-dark)', textTransform: 'uppercase', letterSpacing: '0.08em', ...fontStyle }}>Session Intentions & Rules</span>
                <span style={{ fontSize: 11, color: 'var(--text-secondary)', fontWeight: 500, marginLeft: 4 }}>— tick ✅/❌ after the session</span>
              </div>

              {/* Tally summary */}
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
                        <div style={{ fontSize: 18, fontWeight: 900, color, fontFamily: "'JetBrains Mono', monospace" }}>{val}</div>
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

          {/* ════ TWO-COLUMN GRID (post-session) ════ */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

            {/* ════ LEFT COLUMN ════ */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

              {/* ── Session Performance Metrics ── */}
              <div className="glass-panel" style={{ ...panelStyle, padding: '24px', border: '1px solid var(--border-card)' }}>
                <SectionHeader
                  icon={<TrendingUp size={16} style={{ color: 'var(--text-accent)' }} />}
                  title="Session Performance"
                  subtitle="Session trading results at a glance"
                />
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12 }}>
                  {[
                    { label: 'NET P&L', value: formatCurrency(todayStats.totalNetPnl), color: todayStats.totalNetPnl >= 0 ? 'var(--color-profit)' : 'var(--color-loss)', cls: todayStats.totalNetPnl >= 0 ? 'kpi-container-profit' : 'kpi-container-loss' },
                    { label: 'WIN RATE', value: formatPercent(todayStats.winRate), color: 'var(--color-cyan)', cls: 'kpi-container-cyan' },
                    { label: 'TRADES', value: formatNumber(todayStats.totalTrades), color: 'var(--text-primary)', cls: 'kpi-container-slate' },
                    { label: 'PROFIT FACTOR', value: todayStats.profitFactor === Infinity ? '∞' : todayStats.profitFactor.toFixed(2), color: todayStats.profitFactor >= 1 ? 'var(--color-profit)' : 'var(--color-loss)', cls: todayStats.profitFactor >= 1 ? 'kpi-container-profit' : 'kpi-container-loss' },
                  ].map(item => (
                    <div key={item.label} className={item.cls} style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: 6 }}>
                      <span style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.15em', color: 'var(--text-secondary)', ...fontStyle }}>
                        {item.label}
                      </span>
                      <span style={{ fontSize: 20, fontWeight: 800, color: item.color, ...monoStyle, lineHeight: 1 }}>
                        {item.value}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* ── Session Overview (Grade, Discipline, Mood, Market) ── */}
              <div className="glass-panel" style={{ ...panelStyle, padding: '24px', border: '1px solid var(--border-card)' }}>
                <SectionHeader
                  icon={<Activity size={16} style={{ color: 'var(--text-accent)' }} />}
                  title="Session Overview"
                  subtitle="Rate your execution quality and mindset"
                />

                {/* Grade Selector */}
                <div style={{ marginBottom: 28 }}>
                  <FieldLabel>Daily Execution Grade</FieldLabel>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
                    {GRADES.map((g) => {
                      const isSelected = entry.grade === g;
                      let activeBg = 'var(--color-cyan)';
                      if (g.startsWith('C')) activeBg = 'var(--color-profit)';
                      if (g.startsWith('D') || g === 'F') activeBg = 'var(--color-loss)';

                      return (
                        <button
                          key={g}
                          onClick={() => updateField('grade', g)}
                          style={{
                            width: 48, height: 48,
                            borderRadius: 8,
                            border: `2px solid ${isSelected ? activeBg : 'var(--border-card)'}`,
                            background: isSelected ? activeBg : 'var(--bg-input)',
                            color: isSelected ? 'var(--bg-app)' : 'var(--text-secondary)',
                            fontSize: 14, fontWeight: 800,
                            cursor: 'pointer',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            transition: 'all 0.15s ease',
                            boxShadow: isSelected ? `0 0 16px ${activeBg}50` : 'none',
                            ...fontStyle,
                          }}
                        >
                          {g}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Discipline Rating */}
                <div style={{ marginBottom: 28 }}>
                  <FieldLabel>Rule Adherence & Discipline</FieldLabel>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                    {[1, 2, 3, 4, 5].map((level) => {
                      const isActive = (entry.discipline || 0) >= level;
                      const activeColor = getDisciplineColor(entry.discipline || 0);
                      return (
                        <button
                          key={level}
                          onClick={() => updateField('discipline', level)}
                          style={{
                            width: 48, height: 40,
                            border: `2px solid ${isActive ? activeColor : 'var(--border-card)'}`,
                            background: isActive ? `${activeColor}18` : 'transparent',
                            color: isActive ? activeColor : 'var(--text-secondary)',
                            fontSize: 16, fontWeight: 800,
                            cursor: 'pointer',
                            borderRadius: 8,
                            transition: 'all 0.15s ease',
                            ...monoStyle,
                          }}
                        >
                          {isActive ? '█' : '░'}
                        </button>
                      );
                    })}
                    <span style={{
                      fontSize: 12, fontWeight: 800,
                      textTransform: 'uppercase', letterSpacing: '0.1em',
                      color: getDisciplineColor(entry.discipline || 0),
                      marginLeft: 8,
                      ...monoStyle,
                    }}>
                      {getDisciplineLabel(entry.discipline || 0)}
                    </span>
                  </div>
                </div>

                {/* Mood & Market Conditions */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                  <div>
                    <FieldLabel>Trader Mood</FieldLabel>
                    <select
                      value={entry.mood}
                      onChange={e => updateField('mood', e.target.value)}
                      style={{
                        width: '100%',
                        padding: '12px 16px',
                        fontSize: 13, fontWeight: 600,
                        border: '1px solid var(--border-input)',
                        cursor: 'pointer',
                        ...inputStyle,
                      }}
                    >
                      {MOODS.map(m => (
                        <option key={m.value} value={m.value}>
                          {m.emoji} {m.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <FieldLabel>Market Conditions</FieldLabel>
                    <select
                      value={entry.marketConditions}
                      onChange={e => updateField('marketConditions', e.target.value)}
                      style={{
                        width: '100%',
                        padding: '12px 16px',
                        fontSize: 13, fontWeight: 600,
                        border: '1px solid var(--border-input)',
                        cursor: 'pointer',
                        ...inputStyle,
                      }}
                    >
                      {MARKET_CONDITIONS.map(mc => (
                        <option key={mc.value} value={mc.value}>
                          {mc.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>


            </div>

            {/* ════ RIGHT COLUMN ════ */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>


              {/* ── Strengths & Weaknesses ── */}
              <div className="glass-panel" style={{ ...panelStyle, padding: '24px', border: '1px solid var(--border-card)' }}>
                <SectionHeader
                  icon={<CheckCircle2 size={16} style={{ color: 'var(--text-accent)' }} />}
                  title="Strengths & Weaknesses"
                  subtitle="What worked and what didn't"
                />

                {/* What Worked */}
                <div style={{ marginBottom: 20 }}>
                  <FieldLabel color="var(--color-profit)">✓ What Worked Well</FieldLabel>
                  <textarea
                    value={entry.whatWorked || ''}
                    onChange={e => updateField('whatWorked', e.target.value)}
                    placeholder="• Patient entries on AAPL pullback&#10;• Followed stop loss rules&#10;• Good position sizing"
                    rows={4}
                    style={{
                      width: '100%',
                      padding: '14px 16px',
                      fontSize: 14, fontWeight: 500,
                      lineHeight: 1.7,
                      border: '1px solid var(--border-input)',
                      resize: 'vertical',
                      minHeight: 100,
                      ...inputStyle,
                    }}
                  />
                </div>

                {/* Mistakes */}
                <div>
                  <FieldLabel color="var(--color-loss)">✗ Weaknesses & Rules Broken</FieldLabel>
                  <textarea
                    value={entry.mistakes || ''}
                    onChange={e => updateField('mistakes', e.target.value)}
                    placeholder="• Over-leveraged on TSLA trade&#10;• Chased the breakout without confirmation&#10;• Didn't wait for volume"
                    rows={4}
                    style={{
                      width: '100%',
                      padding: '14px 16px',
                      fontSize: 14, fontWeight: 500,
                      lineHeight: 1.7,
                      border: '1px solid var(--border-input)',
                      resize: 'vertical',
                      minHeight: 100,
                      ...inputStyle,
                    }}
                  />
                </div>
              </div>

              {/* ── Post-Market Analysis ── */}
              <div className="glass-panel" style={{ ...panelStyle, padding: '24px', border: '1px solid var(--border-card)' }}>
                <SectionHeader
                  icon={<Brain size={16} style={{ color: 'var(--text-accent)' }} />}
                  title="Post-Market Analysis"
                  subtitle="Reflect on the session"
                />

                <div style={{ marginBottom: 20 }}>
                  <FieldLabel>Session Review & Diagnostics</FieldLabel>
                  <textarea
                    value={entry.postMarketReview || ''}
                    onChange={e => updateField('postMarketReview', e.target.value)}
                    placeholder="• Cut losers early but held NVDA too long&#10;• Followed stop loss rules perfectly on 3/4 trades&#10;• Market was choppy — should have reduced size"
                    rows={5}
                    style={{
                      width: '100%',
                      padding: '16px 18px',
                      fontSize: 14, fontWeight: 500,
                      lineHeight: 1.7,
                      border: '1px solid var(--border-input)',
                      resize: 'vertical',
                      minHeight: 120,
                      ...inputStyle,
                    }}
                  />
                </div>

                <div>
                  <FieldLabel>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <AlertTriangle size={12} />
                      Golden Lesson / Key Takeaway
                    </span>
                  </FieldLabel>
                  <textarea
                    value={entry.lessonsLearned || ''}
                    onChange={e => updateField('lessonsLearned', e.target.value)}
                    placeholder="Do not chase high-of-day breakouts when volume is weak. Wait for a pullback and test of VWAP before entering."
                    rows={3}
                    style={{
                      width: '100%',
                      padding: '16px 18px',
                      fontSize: 14, fontWeight: 500,
                      lineHeight: 1.7,
                      resize: 'vertical',
                      minHeight: 80,
                      ...inputStyle,
                      border: '2px solid var(--border-profit)',
                      background: 'var(--accent-glow)',
                    }}
                  />
                </div>
              </div>

              {/* ── Session Executed Trades ── */}
              <div className="glass-panel" style={{ ...panelStyle, padding: '24px', border: '1px solid var(--border-card)', flex: 1 }}>
                <SectionHeader
                  icon={<Award size={16} style={{ color: 'var(--text-accent)' }} />}
                  title={`Session Trades (${todayTrades.length})`}
                  subtitle="Trades executed during this session"
                />

                <div style={{
                  minHeight: 200,
                  maxHeight: 400,
                  overflowY: 'auto',
                  border: '1px solid var(--border-card)',
                  background: 'var(--bg-input)',
                  borderRadius: 10,
                  padding: 4,
                }}>
                  {todayTrades.length === 0 ? (
                    <div style={{ height: 200, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 12 }}>
                      <Frown size={28} style={{ color: 'var(--text-secondary)', opacity: 0.5 }} />
                      <p style={{ fontSize: 13, color: 'var(--text-secondary)', fontWeight: 600, textAlign: 'center' }}>
                        No trades yet for this day
                      </p>
                    </div>
                  ) : (
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                      <thead>
                        <tr style={{ borderBottom: '1px solid var(--border-card)' }}>
                          {['Time', 'Ticker', 'Dir', 'Net P&L', 'Mistake', ''].map((head, hi) => (
                            <th key={hi} style={{
                              padding: '12px 14px',
                              fontSize: 10, fontWeight: 700,
                              textTransform: 'uppercase',
                              letterSpacing: '0.12em',
                              color: 'var(--text-secondary)',
                              textAlign: 'left',
                              whiteSpace: 'nowrap',
                              ...fontStyle,
                            }}>
                              {head}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {todayTrades.map((t) => (
                          <tr
                            key={t.id}
                            style={{
                              borderBottom: '1px solid var(--border-card)',
                              background: t.isOpen ? 'var(--accent-glow)' : t.netPnl >= 0 ? 'var(--bg-kpi-profit)' : 'var(--bg-kpi-loss)',
                              transition: 'background 0.15s ease',
                            }}
                          >
                            <td style={{ padding: '12px 14px', fontSize: 12, color: 'var(--text-primary)', whiteSpace: 'nowrap', ...monoStyle, fontWeight: 600 }}>
                              {t.time}
                            </td>
                            <td style={{ padding: '12px 14px' }}>
                              <a
                                href={`https://www.tradingview.com/chart/?symbol=${t.ticker}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                style={{
                                  color: 'var(--text-accent)',
                                  fontWeight: 800, fontSize: 13,
                                  textDecoration: 'none',
                                  display: 'flex', alignItems: 'center', gap: 4,
                                  whiteSpace: 'nowrap',
                                  ...monoStyle,
                                }}
                              >
                                {t.ticker}
                                <ExternalLink size={10} style={{ opacity: 0.5 }} />
                              </a>
                            </td>
                            <td style={{
                              padding: '12px 14px',
                              fontWeight: 700, fontSize: 12,
                              color: t.direction === 'Long' ? 'var(--color-profit)' : 'var(--color-loss)',
                              whiteSpace: 'nowrap',
                            }}>
                              {t.direction === 'Long' ? 'LONG' : 'SHORT'}
                            </td>
                            <td style={{ padding: '12px 14px' }}>
                              {t.isOpen ? (
                                <span className="badge-open" style={{ fontSize: 10, padding: '4px 10px' }}>OPEN</span>
                              ) : t.netPnl >= 0 ? (
                                <span className="badge-profit" style={{ fontSize: 10, padding: '4px 10px' }}>{formatCurrency(t.netPnl)}</span>
                              ) : (
                                <span className="badge-loss" style={{ fontSize: 10, padding: '4px 10px' }}>{formatCurrency(t.netPnl)}</span>
                              )}
                            </td>
                            <td style={{
                              padding: '12px 14px',
                              fontSize: 11, color: 'var(--color-loss)',
                              maxWidth: 120,
                              overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                              fontWeight: 600,
                            }} title={t.mistake || 'None'}>
                              {t.mistake && t.mistake !== 'None' ? t.mistake.split('/')[0] : '—'}
                            </td>
                            <td style={{ padding: '12px 14px', textAlign: 'right' }}>
                              <button
                                onClick={() => onEditTrade(t)}
                                style={{
                                  padding: '6px 14px',
                                  fontSize: 10, fontWeight: 700,
                                  textTransform: 'uppercase',
                                  letterSpacing: '0.05em',
                                  border: '1px solid var(--border-card)',
                                  color: 'var(--text-secondary)',
                                  background: 'var(--bg-sidebar)',
                                  cursor: 'pointer',
                                  borderRadius: 10,
                                  transition: 'all 0.15s ease',
                                  ...fontStyle,
                                }}
                              >
                                Edit
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
