import { useState } from 'react';
import { Pencil, Trash2, Check, X, Image as ImageIcon } from 'lucide-react';
import { formatCurrency, formatNumber } from '../utils/calculations';

const EmptyTable = () => (
  <div className="border flex flex-col items-center justify-center py-24 gap-5 glass-panel animate-fade-in" style={{ borderColor: 'var(--border-card)', background: 'var(--bg-card)' }}>
    <div className="w-20 h-px" style={{ background: 'var(--border-card)' }} />
    <p className="text-sm tracking-[0.2em] uppercase font-bold text-[var(--text-secondary)]">
      Awaiting first trade data...
    </p>
    <div className="w-20 h-px" style={{ background: 'var(--border-card)' }} />
  </div>
);

export default function TradeTable({ trades, onEdit, onDelete }) {
  const [confirmingDelete, setConfirmingDelete] = useState(null);

  const handleDelete = (id) => {
    if (id) onDelete(id);
    setConfirmingDelete(null);
  };

  const getRowBg = (trade, idx) => {
    if (trade.isOpen) return 'var(--bg-kpi-profit)';
    if (trade.netPnl > 0) return 'var(--bg-kpi-profit)';
    if (trade.netPnl < 0) return 'var(--bg-kpi-loss)';
    return idx % 2 === 0 ? 'var(--bg-card)' : 'transparent';
  };

  if (!trades || trades.length === 0) return <EmptyTable />;

  return (
    <div className="w-full">
      {/* ── MOBILE CARD VIEW (< md) ── */}
      <div className="md:hidden space-y-4">
        {trades.map((trade) => (
          <div key={trade.id} className="glass-panel p-4 border border-[var(--border-card)] space-y-4 relative">
            
            {/* Header: Ticker & Direction */}
            <div className="flex justify-between items-start">
              <div>
                <div className="flex items-center gap-2">
                  <span className={`text-lg font-black font-mono-data ${trade.direction === 'Long' ? 'text-[var(--color-profit)]' : 'text-[var(--color-loss)]'}`}>
                    {trade.direction === 'Long' ? '↗' : '↘'} {trade.ticker}
                  </span>
                  {trade.imageUrl && (
                    <a href={trade.imageUrl} target="_blank" rel="noopener noreferrer" className="text-[var(--text-accent)] hover:opacity-80">
                      <ImageIcon size={14} />
                    </a>
                  )}
                </div>
                <div className="text-xs text-[var(--text-secondary)] font-mono-data mt-1">{trade.date} {trade.time}</div>
              </div>
              <div className="text-right">
                {trade.isOpen ? (
                  <span className="badge-open">OPEN</span>
                ) : trade.netPnl >= 0 ? (
                  <span className="badge-profit text-sm">{formatCurrency(trade.netPnl)}</span>
                ) : (
                  <span className="badge-loss text-sm">{formatCurrency(trade.netPnl)}</span>
                )}
              </div>
            </div>

            {/* Grid Stats */}
            <div className="grid grid-cols-2 gap-3 text-xs bg-[var(--bg-input)] p-3 rounded-lg border border-[var(--border-input)]">
              <div>
                <span className="block text-[10px] uppercase tracking-wider text-[var(--text-secondary)] mb-1">Entry</span>
                <span className="font-mono-data font-bold">${Number(trade.entryPrice).toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
              </div>
              <div>
                <span className="block text-[10px] uppercase tracking-wider text-[var(--text-secondary)] mb-1">Exit</span>
                <span className="font-mono-data font-bold">{trade.exitPrice ? `$${Number(trade.exitPrice).toLocaleString('en-US', { minimumFractionDigits: 2 })}` : '—'}</span>
              </div>
              <div>
                <span className="block text-[10px] uppercase tracking-wider text-[var(--text-secondary)] mb-1">Qty</span>
                <span className="font-mono-data font-bold">{formatNumber(trade.qty)}</span>
              </div>
              <div>
                <span className="block text-[10px] uppercase tracking-wider text-[var(--text-secondary)] mb-1">Strategy</span>
                <span className="font-bold truncate">{trade.strategy || '—'}</span>
              </div>
            </div>

            {/* Footer Actions */}
            <div className="flex justify-between items-center pt-2 border-t border-[var(--border-card)]">
              <div>
                {trade.isOpen && <span className="text-[10px] uppercase font-bold text-[var(--color-profit)] tracking-widest">OPEN</span>}
              </div>
              <div className="flex items-center gap-3">
                {confirmingDelete === trade.id ? (
                  <div className="flex items-center gap-2 bg-[var(--bg-badge-loss)] px-2 py-1 rounded">
                    <span className="text-[10px] font-bold text-[var(--color-loss)] uppercase">Del?</span>
                    <button onClick={() => handleDelete(trade.id)} className="text-[var(--color-loss)]"><Check size={14} /></button>
                    <button onClick={() => setConfirmingDelete(null)} className="text-[var(--text-secondary)]"><X size={14} /></button>
                  </div>
                ) : (
                  <>
                    <button onClick={() => onEdit(trade)} className="p-1.5 glass-panel rounded cursor-pointer text-[var(--text-secondary)] hover:text-[var(--color-cyan)]">
                      <Pencil size={14} />
                    </button>
                    <button onClick={() => setConfirmingDelete(trade.id)} className="p-1.5 glass-panel rounded cursor-pointer text-[var(--text-secondary)] hover:text-[var(--color-loss)]">
                      <Trash2 size={14} />
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* ── DESKTOP TABLE VIEW (>= md) ── */}
      <div className="hidden md:block border overflow-hidden glass-panel" style={{ borderColor: 'var(--border-card)', background: 'var(--bg-card)' }}>
        <div className="overflow-x-auto">
          <table className="w-full" style={{ minWidth: '1050px' }}>
            <thead>
              <tr className="bg-[var(--bg-sidebar)] border-b" style={{ borderColor: 'var(--border-card)' }}>
                {['#', 'TIME', 'TICKER', 'DIR', 'ASSET', 'ENTRY', 'EXIT', 'QTY', 'GROSS', 'FEES', 'NET', 'STRATEGY', 'IMG', 'STATUS', ''].map((h) => (
                  <th key={h} className="px-5 py-4 text-left font-bold uppercase whitespace-nowrap" style={{ color: 'var(--text-secondary)', fontSize: '10px', letterSpacing: '0.08em', fontFamily: "'Inter', sans-serif" }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {trades.map((trade, idx) => (
                <tr key={trade.id} className="transition-all duration-150 border-b hover:!bg-[var(--accent-glow)]" style={{ background: getRowBg(trade, idx), borderColor: 'rgba(255, 255, 255, 0.02)' }}>
                  <td className="px-5 py-4 text-xs font-semibold text-[var(--text-secondary)] font-mono-data">{idx + 1}</td>
                  <td className="px-5 py-4 text-xs whitespace-nowrap font-mono-data font-semibold text-[var(--text-primary)]">{trade.time}</td>
                  <td className="px-5 py-4 whitespace-nowrap">
                    <a href={`https://www.tradingview.com/chart/?symbol=${trade.ticker}`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 hover:underline text-xs font-bold font-mono-data text-[var(--text-accent)]">
                      {trade.ticker}
                    </a>
                  </td>
                  <td className="px-5 py-4 text-xs font-semibold font-mono-data whitespace-nowrap">
                    <span className={trade.direction === 'Long' ? 'text-[var(--color-profit)]' : 'text-[var(--color-loss)]'}>
                      {trade.direction === 'Long' ? 'LONG ↗' : 'SHORT ↘'}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-xs font-semibold text-[var(--text-primary)]">{trade.assetClass}</td>
                  <td className="px-5 py-4 text-xs font-mono-data font-semibold text-[var(--text-secondary)] whitespace-nowrap">${Number(trade.entryPrice).toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
                  <td className="px-5 py-4 text-xs font-mono-data font-semibold text-[var(--text-secondary)] whitespace-nowrap">
                    {trade.exitPrice ? `$${Number(trade.exitPrice).toLocaleString('en-US', { minimumFractionDigits: 2 })}` : '—'}
                  </td>
                  <td className="px-5 py-4 text-xs font-mono-data font-bold text-[var(--text-secondary)]">{formatNumber(trade.qty)}</td>
                  
                  <td className="px-5 py-4 text-xs font-mono-data font-bold whitespace-nowrap">
                    {trade.isOpen ? <span className="badge-open">OPEN</span> : trade.grossPnl >= 0 ? <span className="badge-profit">{formatCurrency(trade.grossPnl)}</span> : <span className="badge-loss">{formatCurrency(trade.grossPnl)}</span>}
                  </td>

                  <td className="px-5 py-4 text-xs font-mono-data font-semibold">
                    <span className="badge-cyan">${(trade.fees || 0).toFixed(2)}</span>
                  </td>

                  <td className="px-5 py-4 text-xs font-mono-data font-bold whitespace-nowrap">
                    {trade.isOpen ? <span className="badge-open">OPEN</span> : trade.netPnl >= 0 ? <span className="badge-profit">{formatCurrency(trade.netPnl)}</span> : <span className="badge-loss">{formatCurrency(trade.netPnl)}</span>}
                  </td>

                  <td className="px-5 py-4 text-xs font-semibold text-[var(--text-primary)] truncate max-w-[100px]">{trade.strategy}</td>
                  
                  <td className="px-5 py-4 text-xs whitespace-nowrap">
                    {trade.imageUrl ? (
                      <a href={trade.imageUrl} target="_blank" rel="noopener noreferrer" className="text-[var(--text-secondary)] hover:text-[var(--text-accent)] transition-colors">
                        <ImageIcon size={14} />
                      </a>
                    ) : (
                      <span className="text-[var(--border-card)]">—</span>
                    )}
                  </td>

                  <td className="px-5 py-4 whitespace-nowrap">
                    {trade.isOpen ? (
                      <span className="badge-open pulse-yellow">OPEN</span>
                    ) : (
                      <span className="badge-cyan">CLOSED</span>
                    )}
                  </td>

                  <td className="px-5 py-4 whitespace-nowrap">
                    {confirmingDelete === trade.id ? (
                      <div className="flex items-center gap-2 bg-[var(--bg-badge-loss)] px-2 py-1 rounded">
                        <span className="text-[9px] font-bold text-[var(--color-loss)] uppercase">Del?</span>
                        <button onClick={() => handleDelete(trade.id)} className="p-1 cursor-pointer text-[var(--color-loss)] hover:opacity-85 font-bold"><Check size={14} /></button>
                        <button onClick={() => setConfirmingDelete(null)} className="p-1 cursor-pointer text-[var(--text-secondary)] hover:opacity-85 font-bold"><X size={14} /></button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2.5">
                        <button onClick={() => onEdit(trade)} className="p-1 cursor-pointer text-[var(--text-secondary)] hover:text-[var(--color-cyan)] transition-colors" title="Edit"><Pencil size={14} /></button>
                        <button onClick={() => setConfirmingDelete(trade.id)} className="p-1 cursor-pointer text-[var(--text-secondary)] hover:text-[var(--color-loss)] transition-colors" title="Delete"><Trash2 size={14} /></button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
