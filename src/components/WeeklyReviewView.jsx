import React, { useState, useMemo, useEffect } from 'react';
import { BookOpen, Calendar, TrendingUp, Save, Check } from 'lucide-react';
import { loadWeeklyReviews, saveWeeklyReviews } from '../utils/storage';
import { formatCurrency, formatPercent } from '../utils/calculations';

// Helper to get Monday of the week for a given date string (YYYY-MM-DD)
const getWeekStart = (dateStr) => {
  const d = new Date(dateStr);
  const day = d.getDay(); // 0 is Sunday, 1 is Monday...
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  const monday = new Date(d.setDate(diff));
  return monday.toISOString().split('T')[0];
};

const getWeekLabel = (mondayStr) => {
  const d1 = new Date(mondayStr);
  const d2 = new Date(d1);
  d2.setDate(d1.getDate() + 6);
  const options = { month: 'short', day: 'numeric' };
  return `${d1.toLocaleDateString('en-US', options)} - ${d2.toLocaleDateString('en-US', options)}`;
};

export default function WeeklyReviewView({ allTrades }) {
  const [reviews, setReviews] = useState({});
  const [saveStatus, setSaveStatus] = useState(null);

  useEffect(() => {
    setReviews(loadWeeklyReviews());
  }, []);

  const handleSave = () => {
    saveWeeklyReviews(reviews);
    setSaveStatus('saved');
    setTimeout(() => setSaveStatus(null), 2000);
  };

  const handleReviewChange = (weekStart, field, value) => {
    setReviews(prev => ({
      ...prev,
      [weekStart]: {
        ...(prev[weekStart] || {}),
        [field]: value
      }
    }));
  };

  // Group trades by week
  const weeklyStats = useMemo(() => {
    const map = {};
    Object.entries(allTrades).forEach(([date, trades]) => {
      const closed = trades.filter(t => !t.isOpen && t.netPnl !== null);
      if (closed.length === 0) return;

      const weekStart = getWeekStart(date);
      if (!map[weekStart]) {
        map[weekStart] = { weekStart, netPnl: 0, wins: 0, total: 0 };
      }
      
      closed.forEach(t => {
        map[weekStart].netPnl += t.netPnl;
        map[weekStart].total += 1;
        if (t.netPnl > 0) map[weekStart].wins += 1;
      });
    });

    return Object.values(map).sort((a, b) => new Date(b.weekStart) - new Date(a.weekStart));
  }, [allTrades]);

  return (
    <div className="fade-in" style={{ padding: '24px 28px', maxWidth: 1000, margin: '0 auto', minHeight: '100%' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <BookOpen size={24} style={{ color: 'var(--text-accent)' }} />
          <h1 style={{ fontSize: 26, fontWeight: 900, color: 'var(--text-dark)', letterSpacing: '-0.02em', margin: 0, lineHeight: 1.2 }}>Weekly Review</h1>
        </div>
        <button
          onClick={handleSave}
          className="flex items-center gap-2 cursor-pointer font-bold px-4 py-2 transition-colors"
          style={{
            background: saveStatus === 'saved' ? 'var(--color-profit)' : 'var(--bg-card)',
            color: saveStatus === 'saved' ? '#fff' : 'var(--text-primary)',
            border: saveStatus === 'saved' ? 'none' : '1px solid var(--border-card)',
            borderRadius: 10,
            fontSize: 13
          }}
        >
          {saveStatus === 'saved' ? <><Check size={14} /> Saved</> : <><Save size={14} /> Save Reviews</>}
        </button>
      </div>
      
      {weeklyStats.length === 0 ? (
        <div className="glass-panel" style={{ padding: '40px', borderRadius: 16, border: '1px dashed var(--border-card)', textAlign: 'center' }}>
          <p style={{ color: 'var(--text-secondary)' }}>No closed trades yet to review. Log some trades first!</p>
        </div>
      ) : (
        <div className="flex flex-col gap-8">
          {weeklyStats.map(week => {
            const rev = reviews[week.weekStart] || { wentWell: '', mistakes: '', focus: '' };
            const wr = week.total > 0 ? (week.wins / week.total) * 100 : 0;
            return (
              <div key={week.weekStart} className="glass-panel" style={{ padding: '24px', borderRadius: 16, border: '1px solid var(--border-card)' }}>
                {/* Header */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20, flexWrap: 'wrap', gap: 16 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ background: 'var(--bg-input)', padding: '8px 12px', borderRadius: 8, border: '1px solid var(--border-input)' }}>
                      <Calendar size={16} style={{ color: 'var(--text-secondary)' }} />
                    </div>
                    <div>
                      <h3 style={{ fontSize: 18, fontWeight: 800, margin: 0, color: 'var(--text-dark)' }}>{getWeekLabel(week.weekStart)}</h3>
                      <div style={{ fontSize: 12, color: 'var(--text-secondary)', fontWeight: 600 }}>Week of {week.weekStart}</div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: 12 }}>
                    <div style={{ background: 'var(--bg-input)', padding: '10px 16px', borderRadius: 10, minWidth: 100 }}>
                      <div style={{ fontSize: 10, color: 'var(--text-secondary)', fontWeight: 700, uppercase: 'uppercase', letterSpacing: '0.05em' }}>P&L</div>
                      <div style={{ fontSize: 16, fontWeight: 800, color: week.netPnl >= 0 ? 'var(--color-profit)' : 'var(--color-loss)' }}>
                        {week.netPnl >= 0 ? '+' : ''}{formatCurrency(week.netPnl)}
                      </div>
                    </div>
                    <div style={{ background: 'var(--bg-input)', padding: '10px 16px', borderRadius: 10, minWidth: 100 }}>
                      <div style={{ fontSize: 10, color: 'var(--text-secondary)', fontWeight: 700, uppercase: 'uppercase', letterSpacing: '0.05em' }}>Win Rate</div>
                      <div style={{ fontSize: 16, fontWeight: 800, color: 'var(--text-primary)' }}>{formatPercent(wr)}</div>
                    </div>
                    <div style={{ background: 'var(--bg-input)', padding: '10px 16px', borderRadius: 10, minWidth: 100 }}>
                      <div style={{ fontSize: 10, color: 'var(--text-secondary)', fontWeight: 700, uppercase: 'uppercase', letterSpacing: '0.05em' }}>Trades</div>
                      <div style={{ fontSize: 16, fontWeight: 800, color: 'var(--text-primary)' }}>{week.total}</div>
                    </div>
                  </div>
                </div>

                {/* Form Fields */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 16 }}>
                  <div>
                    <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 8 }}>What went well?</label>
                    <textarea
                      value={rev.wentWell}
                      onChange={(e) => handleReviewChange(week.weekStart, 'wentWell', e.target.value)}
                      placeholder="e.g., Followed my plan, took profits at targets..."
                      style={{ width: '100%', minHeight: 80, padding: 16, background: 'var(--bg-input)', border: '1px solid var(--border-input)', borderRadius: 12, color: 'var(--text-primary)', fontSize: 14, resize: 'vertical' }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 8 }}>What mistakes were made?</label>
                    <textarea
                      value={rev.mistakes}
                      onChange={(e) => handleReviewChange(week.weekStart, 'mistakes', e.target.value)}
                      placeholder="e.g., FOMO entered a trade, moved my stop..."
                      style={{ width: '100%', minHeight: 80, padding: 16, background: 'var(--bg-input)', border: '1px solid var(--border-input)', borderRadius: 12, color: 'var(--text-primary)', fontSize: 14, resize: 'vertical' }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 8 }}>Focus for next week?</label>
                    <textarea
                      value={rev.focus}
                      onChange={(e) => handleReviewChange(week.weekStart, 'focus', e.target.value)}
                      placeholder="e.g., Wait for 5min candle close before entry..."
                      style={{ width: '100%', minHeight: 80, padding: 16, background: 'var(--bg-input)', border: '1px solid var(--border-input)', borderRadius: 12, color: 'var(--text-primary)', fontSize: 14, resize: 'vertical' }}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
