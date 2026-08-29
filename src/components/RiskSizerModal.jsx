import { useState } from 'react';
import { Calculator, X } from 'lucide-react';
import { formatCurrency } from '../utils/calculations';

export default function RiskSizerModal({ isOpen, onClose }) {
  const [accountSize, setAccountSize] = useState(10000);
  const [riskPercent, setRiskPercent] = useState(1);
  const [entryPrice, setEntryPrice] = useState(150);
  const [stopLoss, setStopLoss] = useState(145);

  if (!isOpen) return null;

  const riskAmount = (accountSize * riskPercent) / 100;
  const riskPerShare = Math.abs(entryPrice - stopLoss);
  
  // Calculate position size
  const positionSize = riskPerShare > 0 ? Math.floor(riskAmount / riskPerShare) : 0;
  const positionValue = positionSize * entryPrice;
  const leverage = accountSize > 0 ? (positionValue / accountSize).toFixed(2) : 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 fade-in">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      
      <div className="relative w-full max-w-md bg-[var(--bg-card)] border border-[var(--border-card)] rounded-xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-[var(--border-card)] bg-[var(--bg-sidebar)]">
          <div className="flex items-center gap-2">
            <Calculator size={18} className="text-[var(--text-accent)]" />
            <h2 className="text-sm font-bold text-[var(--text-dark)] uppercase tracking-wider">Position Sizer</h2>
          </div>
          <button onClick={onClose} className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors cursor-pointer p-1">
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-5">
          
          <div className="flex gap-4">
            <div className="flex-1">
              <label className="block text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)] mb-1">Account Size ($)</label>
              <input
                type="number"
                value={accountSize}
                onChange={(e) => setAccountSize(Number(e.target.value))}
                className="w-full bg-[var(--bg-input)] border border-[var(--border-input)] rounded-lg px-3 py-2 text-[var(--text-primary)] font-mono-data text-sm"
              />
            </div>
            <div className="flex-1">
              <label className="block text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)] mb-1">Risk %</label>
              <input
                type="number"
                step="0.1"
                value={riskPercent}
                onChange={(e) => setRiskPercent(Number(e.target.value))}
                className="w-full bg-[var(--bg-input)] border border-[var(--border-input)] rounded-lg px-3 py-2 text-[var(--text-primary)] font-mono-data text-sm"
              />
            </div>
          </div>

          <div className="flex gap-4">
            <div className="flex-1">
              <label className="block text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)] mb-1">Entry Price</label>
              <input
                type="number"
                step="0.01"
                value={entryPrice}
                onChange={(e) => setEntryPrice(Number(e.target.value))}
                className="w-full bg-[var(--bg-input)] border border-[var(--border-input)] rounded-lg px-3 py-2 text-[var(--text-primary)] font-mono-data text-sm"
              />
            </div>
            <div className="flex-1">
              <label className="block text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)] mb-1">Stop Loss</label>
              <input
                type="number"
                step="0.01"
                value={stopLoss}
                onChange={(e) => setStopLoss(Number(e.target.value))}
                className="w-full bg-[var(--bg-input)] border border-[var(--border-input)] rounded-lg px-3 py-2 text-[var(--text-primary)] font-mono-data text-sm"
              />
            </div>
          </div>

          {/* Results Box */}
          <div className="bg-[var(--bg-input)] border border-[var(--border-input)] rounded-xl p-5 mt-4">
            <div className="flex items-end justify-between mb-4 pb-4 border-b border-[var(--border-card)]">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-secondary)] mb-1">Recommended Size</p>
                <div className="text-3xl font-black text-[var(--text-primary)] font-mono-data">{positionSize} <span className="text-sm text-[var(--text-secondary)]">shares/contracts</span></div>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-secondary)]">Total Risk</p>
                <p className="text-sm font-bold text-[var(--color-loss)] font-mono-data">{formatCurrency(-riskAmount)}</p>
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-secondary)]">Position Value</p>
                <p className="text-sm font-bold text-[var(--text-primary)] font-mono-data">{formatCurrency(positionValue)}</p>
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-secondary)]">Risk Per Share</p>
                <p className="text-sm font-bold text-[var(--text-primary)] font-mono-data">{formatCurrency(riskPerShare)}</p>
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-secondary)]">Required Leverage</p>
                <p className="text-sm font-bold text-[var(--text-primary)] font-mono-data">{leverage}x</p>
              </div>
            </div>
          </div>
          
        </div>
      </div>
    </div>
  );
}
