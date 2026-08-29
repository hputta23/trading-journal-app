import { useState, useMemo } from 'react';
import { Search, Plus, Filter, RotateCcw, Target, Info } from 'lucide-react';
import TradeTable from './TradeTable';
import EntryForm from './EntryForm';
import TerminalWindow from './TerminalWindow';
import { calcDailyStats, formatCurrency, formatPercent, formatNumber } from '../utils/calculations';

const fontStyle = { fontFamily: "'Inter', sans-serif" };
const inputStyle = {
  background: 'var(--bg-input)',
  borderColor: 'var(--border-input)',
  color: 'var(--text-input)', 
  ...fontStyle,
};

const STRATEGIES = ['Breakout', 'Reversal', 'Scalp', 'Momentum', 'Other'];
const ASSET_CLASSES = ['Stock', 'Option', 'Future'];

export default function TradesView({ allTrades, onSubmitTrade, onEditTrade, onDeleteTrade, editingTrade, onCancelEdit, quickEntry, currentDate }) {
  const [tickerSearch, setTickerSearch] = useState('');
  const [assetClassFilter, setAssetClassFilter] = useState('ALL');
  const [strategyFilter, setStrategyFilter] = useState('ALL');
  const [directionFilter, setDirectionFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [showLogModal, setShowLogModal] = useState(false);

  const flattenedTrades = useMemo(() => {
    const list = [];
    Object.entries(allTrades).forEach(([date, trades]) => {
      trades.forEach(t => {
        list.push({ ...t, date });
      });
    });
    return list.sort((a, b) => {
      const dateTimeA = `${a.date}T${a.time || '00:00:00'}`;
      const dateTimeB = `${b.date}T${b.time || '00:00:00'}`;
      return new Date(dateTimeB) - new Date(dateTimeA);
    });
  }, [allTrades]);

  const filteredTrades = useMemo(() => {
    return flattenedTrades.filter(t => {
      const matchTicker = t.ticker.toUpperCase().includes(tickerSearch.toUpperCase().trim());
      const matchAsset = assetClassFilter === 'ALL' || t.assetClass === assetClassFilter;
      const matchStrategy = strategyFilter === 'ALL' || t.strategy === strategyFilter;
      const matchDirection = directionFilter === 'ALL' || t.direction === directionFilter;
      
      let matchStatus = true;
      if (statusFilter === 'WIN') matchStatus = !t.isOpen && t.netPnl > 0;
      else if (statusFilter === 'LOSS') matchStatus = !t.isOpen && t.netPnl < 0;
      else if (statusFilter === 'OPEN') matchStatus = t.isOpen;

      return matchTicker && matchAsset && matchStrategy && matchDirection && matchStatus;
    });
  }, [flattenedTrades, tickerSearch, assetClassFilter, strategyFilter, directionFilter, statusFilter]);

  const filteredStats = useMemo(() => calcDailyStats(filteredTrades), [filteredTrades]);

  const handleResetFilters = () => {
    setTickerSearch('');
    setAssetClassFilter('ALL');
    setStrategyFilter('ALL');
    setDirectionFilter('ALL');
    setStatusFilter('ALL');
  };

  const handleFormSubmit = (trade) => {
    onSubmitTrade(trade);
    setShowLogModal(false);
  };

  const handleEditClick = (trade) => {
    onEditTrade(trade);
    setShowLogModal(true);
  };

  const hasActiveFilters = tickerSearch || assetClassFilter !== 'ALL' || strategyFilter !== 'ALL' || directionFilter !== 'ALL' || statusFilter !== 'ALL';

  return (
    <div className="h-full w-full fade-in p-6" style={fontStyle}>
      <TerminalWindow 
        title={
          <span className="flex items-center gap-1.5">
            Master Transaction History & Filters
            <span className="info-trigger inline-flex text-[var(--text-secondary)] font-normal">
              <Info size={11} />
              <span className="info-tooltip font-sans">
                View your entire chronological trading log database. Filters let you isolate specific tickers, strategies, or directions.
              </span>
            </span>
          </span>
        }
        icon={<Target size={16} className="text-[var(--text-accent)]" />}
        actions={
          <button
            onClick={() => { onCancelEdit(); setShowLogModal(true); }}
            className="flex items-center gap-2 px-5 py-2 text-xs font-bold uppercase tracking-widest cursor-pointer hover:opacity-90 active:scale-[0.98] transition-all duration-200 bg-[var(--border-active)] text-[var(--bg-sidebar)] rounded-lg"
          >
            <Plus size={14} />
            RECORD NEW TRADE
          </button>
        }
      >
        <div className="p-6 space-y-8" style={{ background: 'var(--bg-app)' }}>
          {/* ── Filters Command Bar ── */}
          <div className="border p-6 bg-[var(--bg-card)] border-[var(--border-card)] glass-panel rounded-lg">
            <div className="flex items-center justify-between border-b pb-4 mb-6 border-[var(--border-card)]">
              <div className="flex items-center gap-3">
                <div className="p-1.5 rounded-lg bg-[var(--border-active)]/10 text-[var(--border-active)]">
                  <Filter size={16} />
                </div>
                <span className="text-sm font-bold text-[var(--text-dark)] uppercase tracking-widest flex items-center gap-2">
                  Dynamic Search Filters
                  <span className="info-trigger inline-flex text-[var(--text-secondary)] cursor-help">
                    <Info size={12} />
                    <span className="info-tooltip font-sans text-xs normal-case tracking-normal">
                      Narrow down your database records by ticker name, position direction, asset class, strategy type, or win/loss status.
                    </span>
                  </span>
                </span>
              </div>
              {hasActiveFilters && (
                <button
                  onClick={handleResetFilters}
                  className="flex items-center gap-1.5 text-[11px] font-bold hover:opacity-85 transition-opacity cursor-pointer uppercase tracking-wider bg-transparent border border-[var(--color-loss)]/20 px-3 py-1.5 rounded-lg"
                  style={{ color: 'var(--color-loss)' }}
                >
                  <RotateCcw size={13} />
                  RESET FILTERS
                </button>
              )}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-5">
              {/* Ticker Search */}
              <div className="relative">
                <label className="block text-[11px] uppercase font-bold text-[var(--text-secondary)] tracking-wider mb-2">Search Ticker</label>
                <div className="relative">
                  <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--text-secondary)]" />
                  <input
                    type="text"
                    value={tickerSearch}
                    onChange={e => setTickerSearch(e.target.value)}
                    placeholder="E.G. NVDA"
                    className="w-full pl-10 pr-4 py-3 text-[13px] font-semibold uppercase rounded-lg border focus:ring-1 focus:ring-[var(--border-active)] outline-none transition-shadow"
                    style={{ ...inputStyle, textOverflow: 'ellipsis' }}
                  />
                </div>
              </div>

              {/* Direction */}
              <div>
                <label className="block text-[11px] uppercase font-bold text-[var(--text-secondary)] tracking-wider mb-2">Direction</label>
                <select
                  value={directionFilter}
                  onChange={e => setDirectionFilter(e.target.value)}
                  className="w-full px-4 py-3 text-[13px] rounded-lg border cursor-pointer font-semibold focus:ring-1 focus:ring-[var(--border-active)] outline-none transition-shadow"
                  style={{ ...inputStyle, textOverflow: 'ellipsis' }}
                >
                  <option value="ALL">ALL DIRECTIONS</option>
                  <option value="Long">LONG</option>
                  <option value="Short">SHORT</option>
                </select>
              </div>

              {/* Asset Class */}
              <div>
                <label className="block text-[11px] uppercase font-bold text-[var(--text-secondary)] tracking-wider mb-2">Asset Class</label>
                <select
                  value={assetClassFilter}
                  onChange={e => setAssetClassFilter(e.target.value)}
                  className="w-full px-4 py-3 text-[13px] rounded-lg border cursor-pointer font-semibold focus:ring-1 focus:ring-[var(--border-active)] outline-none transition-shadow"
                  style={{ ...inputStyle, textOverflow: 'ellipsis' }}
                >
                  <option value="ALL">ALL ASSETS</option>
                  {ASSET_CLASSES.map(ac => <option key={ac} value={ac}>{ac.toUpperCase()}</option>)}
                </select>
              </div>

              {/* Strategy */}
              <div>
                <label className="block text-[11px] uppercase font-bold text-[var(--text-secondary)] tracking-wider mb-2">Strategy</label>
                <select
                  value={strategyFilter}
                  onChange={e => setStrategyFilter(e.target.value)}
                  className="w-full px-4 py-3 text-[13px] rounded-lg border cursor-pointer font-semibold focus:ring-1 focus:ring-[var(--border-active)] outline-none transition-shadow"
                  style={{ ...inputStyle, textOverflow: 'ellipsis' }}
                >
                  <option value="ALL">ALL STRATEGIES</option>
                  {STRATEGIES.map(s => <option key={s} value={s}>{s.toUpperCase()}</option>)}
                </select>
              </div>

              {/* Outcome Status */}
              <div>
                <label className="block text-[11px] uppercase font-bold text-[var(--text-secondary)] tracking-wider mb-2">Status</label>
                <select
                  value={statusFilter}
                  onChange={e => setStatusFilter(e.target.value)}
                  className="w-full px-4 py-3 text-[13px] rounded-lg border cursor-pointer font-semibold focus:ring-1 focus:ring-[var(--border-active)] outline-none transition-shadow"
                  style={{ ...inputStyle, textOverflow: 'ellipsis' }}
                >
                  <option value="ALL">ALL OUTCOMES</option>
                  <option value="WIN">WINNERS ONLY</option>
                  <option value="LOSS">LOSERS ONLY</option>
                  <option value="OPEN">OPEN POSITIONS</option>
                </select>
              </div>
            </div>
          </div>

          {/* ── Sub-Filtered Dynamic Metrics ── */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 border p-6 bg-[var(--bg-card)] border-[var(--border-card)] glass-panel rounded-lg">
            {[
              [
                'FILTERED NET P&L', 
                filteredStats.totalNetPnl >= 0 ? (
                  <span className="badge-profit text-base font-black font-mono-data px-4 py-2 rounded-lg">{formatCurrency(filteredStats.totalNetPnl)}</span>
                ) : (
                  <span className="badge-loss text-base font-black font-mono-data px-4 py-2 rounded-lg">{formatCurrency(filteredStats.totalNetPnl)}</span>
                )
              ],
              [
                'WIN RATE %', 
                filteredStats.winRate >= 50 ? (
                  <span className="badge-profit text-base font-black font-mono-data px-4 py-2 rounded-lg">{formatPercent(filteredStats.winRate)}</span>
                ) : filteredStats.winRate > 0 ? (
                  <span className="badge-loss text-base font-black font-mono-data px-4 py-2 rounded-lg">{formatPercent(filteredStats.winRate)}</span>
                ) : (
                  <span className="badge-cyan text-base font-black font-mono-data px-4 py-2 rounded-lg">{formatPercent(filteredStats.winRate)}</span>
                )
              ],
              [
                'MATCHED SESSIONS', 
                <span className="badge-cyan text-base font-black font-mono-data px-4 py-2 rounded-lg">{formatNumber(filteredStats.totalTrades)} trades</span>
              ],
              [
                'PROFIT FACTOR', 
                filteredStats.profitFactor >= 1.0 ? (
                  <span className="badge-profit text-base font-black font-mono-data px-4 py-2 rounded-lg">{filteredStats.profitFactor === Infinity ? '∞' : filteredStats.profitFactor.toFixed(2)}</span>
                ) : filteredStats.profitFactor > 0 ? (
                  <span className="badge-loss text-base font-black font-mono-data px-4 py-2 rounded-lg">{filteredStats.profitFactor.toFixed(2)}</span>
                ) : (
                  <span className="badge-cyan text-base font-black font-mono-data px-4 py-2 rounded-lg">{filteredStats.profitFactor.toFixed(2)}</span>
                )
              ],
            ].map(([lbl, element]) => (
              <div key={lbl} className="px-5 border-r border-transparent lg:border-[var(--border-card)] last:border-transparent flex flex-col justify-center gap-3" style={{ minWidth: 0 }}>
                <span className="block text-[11px] text-[var(--text-secondary)] tracking-widest font-bold uppercase" style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{lbl}</span>
                <div className="flex" style={{ minWidth: 0 }}>{element}</div>
              </div>
            ))}
          </div>

          {/* ── Main Trades Table ── */}
          <div className="fade-in">
            <TradeTable
              trades={filteredTrades}
              onEdit={handleEditClick}
              onDelete={onDeleteTrade}
            />
          </div>
        </div>
      </TerminalWindow>

      {/* ── LOG TRADE MODAL OVERLAY ── */}
      {showLogModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-3xl border overflow-y-auto max-h-[90vh] glass-panel" style={{ borderColor: 'var(--border-card)', borderRadius: '16px' }}>
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b p-4 select-none" style={{ borderColor: 'var(--border-card)', background: 'var(--bg-sidebar)', borderTopLeftRadius: 16, borderTopRightRadius: 16 }}>
              <span className="text-xs uppercase tracking-widest font-bold text-[var(--text-accent)]">
                {editingTrade ? 'Edit Trade Entry' : 'Record Trade Session'}
              </span>
              <button
                onClick={() => { setShowLogModal(false); onCancelEdit(); }}
                className="w-8 h-8 flex items-center justify-center hover:bg-white/5 hover:text-[var(--color-loss)] cursor-pointer text-[var(--text-secondary)] text-sm font-bold border border-white/[0.04] bg-white/[0.01] rounded-lg"
              >
                ✕
              </button>
            </div>
            {/* Form Container */}
            <div className="p-5 bg-transparent">
              <EntryForm
                onSubmit={handleFormSubmit}
                editingTrade={editingTrade}
                onCancelEdit={() => { setShowLogModal(false); onCancelEdit(); }}
                quickEntry={quickEntry}
                currentDate={currentDate}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
