import { useState, useMemo } from 'react';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight } from 'lucide-react';
import { formatCurrency } from '../utils/calculations';

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export default function CalendarView({ allTrades, allJournals = {}, onSelectDate, onNavigateTab }) {
  const [currentDate, setCurrentDate] = useState(new Date());
  
  // Get days in month
  const getDaysInMonth = (year, month) => new Date(year, month + 1, 0).getDate();
  const getFirstDayOfMonth = (year, month) => new Date(year, month, 1).getDay();

  const calendarData = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const daysInMonth = getDaysInMonth(year, month);
    const firstDay = getFirstDayOfMonth(year, month);
    
    const days = [];
    
    // Pad empty cells for previous month
    for (let i = 0; i < firstDay; i++) {
      days.push(null);
    }
    
    // Generate days for current month
    for (let i = 1; i <= daysInMonth; i++) {
      const dateKey = `${year}-${String(month + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
      const tradesForDay = allTrades[dateKey] || [];
      const netPnl = tradesForDay.reduce((sum, t) => sum + (t.netPnl || 0), 0);
      const isTraded = tradesForDay.length > 0;
      const hasJournal = allJournals[dateKey] !== undefined;
      
      days.push({
        day: i,
        dateKey,
        trades: tradesForDay,
        netPnl,
        isTraded,
        hasJournal
      });
    }
    
    return days;
  }, [currentDate, allTrades, allJournals]);

  const prevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };
  
  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const monthName = currentDate.toLocaleString('default', { month: 'long' });
  const year = currentDate.getFullYear();

  // Calculate monthly stats
  const monthlyStats = useMemo(() => {
    let grossProfit = 0;
    let grossLoss = 0;
    let winDays = 0;
    let lossDays = 0;

    calendarData.forEach(d => {
      if (d && d.isTraded) {
        if (d.netPnl >= 0) {
          grossProfit += d.netPnl;
          winDays++;
        } else {
          grossLoss += Math.abs(d.netPnl);
          lossDays++;
        }
      }
    });

    const netPnl = grossProfit - grossLoss;

    return { netPnl, winDays, lossDays };
  }, [calendarData]);

  return (
    <div className="h-full w-full overflow-y-auto bg-[var(--bg-app)] pb-12">
      
      {/* ── HEADER ── */}
      <div className="p-6 md:p-8 border-b border-[var(--border-card)] flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[var(--text-dark)] flex items-center gap-3 tracking-tight">
            <CalendarIcon className="text-[var(--text-accent)]" />
            Performance Calendar
          </h1>
          <p className="text-sm text-[var(--text-secondary)] mt-1 font-medium">Monthly heatmap of your daily P&L.</p>
        </div>
        {/* Monthly Summary Badges */}
        <div className="flex items-center gap-3 flex-wrap">
          {[
            { label: 'Win Days', value: monthlyStats.winDays, color: 'var(--color-profit)', bg: 'var(--bg-kpi-profit)', border: 'var(--border-profit)' },
            { label: 'Loss Days', value: monthlyStats.lossDays, color: 'var(--color-loss)', bg: 'var(--bg-kpi-loss)', border: 'var(--border-loss)' },
            { label: 'Net P&L', value: formatCurrency(monthlyStats.netPnl), color: monthlyStats.netPnl >= 0 ? 'var(--color-profit)' : 'var(--color-loss)', bg: monthlyStats.netPnl >= 0 ? 'var(--bg-kpi-profit)' : 'var(--bg-kpi-loss)', border: monthlyStats.netPnl >= 0 ? 'var(--border-profit)' : 'var(--border-loss)' },
          ].map(({ label, value, color, bg, border }) => (
            <div key={label} style={{ padding: '12px 18px', borderRadius: 12, border: `1px solid ${border}`, background: bg, minWidth: 90 }}>
              <span style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text-secondary)', display: 'block', marginBottom: 6 }}>{label}</span>
              <span style={{ fontSize: 20, fontWeight: 900, color, fontFamily: "'JetBrains Mono', monospace", lineHeight: 1, display: 'block' }}>{value}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="p-6 md:p-8 max-w-[1200px] mx-auto">
        
        {/* Calendar Controls */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-black uppercase tracking-tight text-[var(--text-dark)]">
            {monthName} <span className="text-[var(--text-secondary)] font-normal">{year}</span>
          </h2>
          <div className="flex items-center gap-2">
            <button onClick={prevMonth} className="p-2 glass-panel hover:bg-white/5 rounded-lg transition-colors cursor-pointer border border-[var(--border-card)]" style={{ borderRadius: 10 }}>
              <ChevronLeft size={20} className="text-[var(--text-secondary)]" />
            </button>
            <button onClick={nextMonth} className="p-2 glass-panel hover:bg-white/5 rounded-lg transition-colors cursor-pointer border border-[var(--border-card)]" style={{ borderRadius: 10 }}>
              <ChevronRight size={20} className="text-[var(--text-secondary)]" />
            </button>
          </div>
        </div>

        {/* Calendar Grid */}
        <div className="glass-panel rounded-2xl border border-[var(--border-card)] overflow-hidden">
          {/* Days Header */}
          <div className="grid grid-cols-7 border-b border-[var(--border-card)] bg-[var(--bg-sidebar)]/50">
            {DAYS.map(day => (
              <div key={day} className="py-3 text-center text-[11px] font-bold uppercase tracking-widest text-[var(--text-secondary)] border-r last:border-0 border-[var(--border-card)]">
                {day}
              </div>
            ))}
          </div>
          
          {/* Calendar Body */}
          <div className="grid grid-cols-7 auto-rows-fr">
            {calendarData.map((dayData, idx) => {
              if (!dayData) {
                return <div key={`empty-${idx}`} className="min-h-[120px] border-r border-b border-[var(--border-card)] bg-[var(--bg-card)]/30 rounded-lg" style={{ borderRadius: 8 }} />;
              }
              
              const isToday = dayData.dateKey === new Date().toISOString().split('T')[0];
              
              let bgColorClass = 'bg-transparent';
              if (dayData.isTraded) {
                if (dayData.netPnl > 0) bgColorClass = 'bg-[var(--bg-badge-profit)]';
                else if (dayData.netPnl < 0) bgColorClass = 'bg-[var(--bg-badge-loss)]';
                else bgColorClass = 'bg-[var(--bg-badge-cyan)]';
              }

              return (
                <div 
                  key={dayData.dateKey} 
                  className={`min-h-[120px] p-3 border-r border-b border-[var(--border-card)] relative transition-colors ${bgColorClass} hover:opacity-80 rounded-lg cursor-pointer group`}
                  style={{ borderRadius: 8 }}
                  onClick={() => {
                    if (onSelectDate) onSelectDate(dayData.dateKey);
                    if (onNavigateTab) onNavigateTab('journal');
                  }}
                >
                  <div className="flex justify-between items-start mb-2">
                    <span className={`text-sm font-bold ${isToday ? 'bg-[var(--border-active)] text-[var(--bg-app)] w-7 h-7 rounded-full flex items-center justify-center' : 'text-[var(--text-secondary)]'}`}>
                      {dayData.day}
                    </span>
                    <div className="flex flex-col gap-1 items-end">
                      {dayData.isTraded && (
                        <span className="hidden md:inline-block text-[10px] font-bold text-[var(--text-primary)] uppercase bg-[var(--bg-card)] px-2 py-0.5 border border-[var(--border-card)] rounded-lg" style={{ borderRadius: 8 }}>
                          {dayData.trades.length} Trades
                        </span>
                      )}
                      {dayData.hasJournal && (
                        <span className="hidden md:inline-block text-[10px] font-bold text-[var(--text-accent)] uppercase bg-[var(--bg-card)] px-2 py-0.5 border border-[var(--border-card)] rounded-lg" style={{ borderRadius: 8 }}>
                          Journal
                        </span>
                      )}
                    </div>
                  </div>
                  
                  {dayData.isTraded ? (
                    <div className="absolute bottom-3 left-3 right-3 text-center">
                      <div className={`font-mono-data font-bold text-sm ${dayData.netPnl >= 0 ? 'text-[var(--color-profit)]' : 'text-[var(--color-loss)]'}`}>
                        {formatCurrency(dayData.netPnl)}
                      </div>
                    </div>
                  ) : !dayData.hasJournal && (
                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                       <span className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-secondary)]">No Data</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

      </div>
    </div>
  );
}
