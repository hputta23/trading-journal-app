import { useState, useEffect } from 'react';
import { Save, Frown, ExternalLink, BookOpen, Activity, Award, CheckCircle2, Target, Brain, TrendingUp, AlertTriangle } from 'lucide-react';
import { MOODS, MARKET_CONDITIONS, GRADES, loadJournalEntries, saveJournalEntry, emptyJournalEntry } from '../utils/journal';
import { calcDailyStats, formatCurrency, formatPercent, formatNumber } from '../utils/calculations';

const fontStyle = { fontFamily: "'Inter', sans-serif" };
const monoStyle = { fontFamily: "'JetBrains Mono', monospace" };

const panelStyle = {
  borderColor: 'var(--border-card)',
  background: 'var(--bg-card)',
  borderRadius: '16px',
};

const inputStyle = {
  background: 'var(--bg-input)',
  borderColor: 'var(--border-input)',
  color: 'var(--text-input)',
  borderRadius: '12px',
  ...fontStyle,
};

/* ── Section Header Component ── */
const SectionHeader = ({ icon, title, subtitle }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: 10, paddingBottom: 14, marginBottom: 20, borderBottom: '1px solid var(--border-card)' }}>
    <div style={{
      width: 34, height: 34, borderRadius: 10,
      background: 'rgba(0,200,5,0.08)', border: '1px solid rgba(0,200,5,0.2)',
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

export default function JournalView({ currentDate, todayTrades, onEditTrade }) {
  const [entry, setEntry] = useState({ ...emptyJournalEntry });
  const [saveStatus, setSaveStatus] = useState(null);

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

  const handleSave = () => {
    const sanitized = {
      ...entry,
      preMarketPlan: (entry.preMarketPlan || '').trim().replace(/<[^>]*>/g, ''),
      postMarketReview: (entry.postMarketReview || '').trim().replace(/<[^>]*>/g, ''),
      lessonsLearned: (entry.lessonsLearned || '').trim().replace(/<[^>]*>/g, ''),
      mistakes: (entry.mistakes || '').trim().replace(/<[^>]*>/g, ''),
      whatWorked: (entry.whatWorked || '').trim().replace(/<[^>]*>/g, ''),
    };
    saveJournalEntry(currentDate, sanitized);
    setSaveStatus('success');
    setTimeout(() => setSaveStatus(null), 3000);
  };

  const todayStats = calcDailyStats(todayTrades);

  const getDisciplineColor = (score) => {
    if (score >= 4) return '#00ffaa';
    if (score === 3) return '#facc15';
    return '#ff477e';
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
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-dark)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              Daily Journal
            </div>
            <div style={{ fontSize: 11, color: 'var(--text-secondary)', ...monoStyle }}>{currentDate}</div>
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
            background: saveStatus === 'success' ? 'var(--color-profit)' : 'var(--border-active)',
            color: 'var(--bg-app)',
            border: 'none', borderRadius: 10,
            transition: 'all 0.2s ease',
            flexShrink: 0,
            ...fontStyle,
          }}
        >
          <Save size={14} />
          {saveStatus === 'success' ? 'SAVED ✓' : 'SAVE JOURNAL'}
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
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

            {/* ════ LEFT COLUMN ════ */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

              {/* ── Session Performance Metrics ── */}
              <div className="glass-panel" style={{ ...panelStyle, padding: '24px', border: '1px solid var(--border-card)' }}>
                <SectionHeader
                  icon={<TrendingUp size={16} style={{ color: 'var(--text-accent)' }} />}
                  title="Session Performance"
                  subtitle="Today's trading results at a glance"
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
                      let activeBg = '#00d4ff';
                      if (g.startsWith('C')) activeBg = '#facc15';
                      if (g.startsWith('D') || g === 'F') activeBg = '#ff3b5c';

                      return (
                        <button
                          key={g}
                          onClick={() => updateField('grade', g)}
                          style={{
                            width: 48, height: 48,
                            borderRadius: '50%',
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

              {/* ── Pre-Market Strategy & Plan ── */}
              <div className="glass-panel" style={{ ...panelStyle, padding: '24px', border: '1px solid var(--border-card)' }}>
                <SectionHeader
                  icon={<Target size={16} style={{ color: 'var(--text-accent)' }} />}
                  title="Pre-Market Strategy"
                  subtitle="Define your game plan before the bell"
                />

                <FieldLabel>Strategy & Plan Checklist</FieldLabel>
                <textarea
                  value={entry.preMarketPlan || ''}
                  onChange={e => updateField('preMarketPlan', e.target.value)}
                  placeholder="• Focus on VWAP bounces on NVDA&#10;• Maximum 3 stop outs today&#10;• No FOMO trades before 10:00 AM&#10;• Watch SPY for market direction"
                  rows={6}
                  style={{
                    width: '100%',
                    padding: '16px 18px',
                    fontSize: 14, fontWeight: 500,
                    lineHeight: 1.7,
                    border: '1px solid var(--border-input)',
                    resize: 'vertical',
                    minHeight: 140,
                    ...inputStyle,
                  }}
                />
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
                  subtitle="Reflect on today's session"
                />

                <div style={{ marginBottom: 20 }}>
                  <FieldLabel>Session Review & Diagnostics</FieldLabel>
                  <textarea
                    value={entry.postMarketReview || ''}
                    onChange={e => updateField('postMarketReview', e.target.value)}
                    placeholder="• Cut losers early today but held NVDA too long&#10;• Followed stop loss rules perfectly on 3/4 trades&#10;• Market was choppy — should have reduced size"
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
                      border: '2px solid rgba(250, 204, 21, 0.3)',
                      background: 'rgba(250, 204, 21, 0.04)',
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
                  borderRadius: 12,
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
                              background: t.isOpen ? 'rgba(250, 204, 21, 0.03)' : t.netPnl >= 0 ? 'rgba(0, 255, 136, 0.03)' : 'rgba(255, 59, 92, 0.03)',
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
                                  borderRadius: 6,
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
