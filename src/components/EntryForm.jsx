import { useState, useEffect, useCallback } from 'react';
import { ChevronRight, ChevronLeft, Check, Clock, Zap, Target, BookOpen, AlertTriangle } from 'lucide-react';
import { calcGrossPnl, calcNetPnl, formatCurrency } from '../utils/calculations';
import { v4 as uuidv4 } from 'uuid';

const STRATEGIES = ['Breakout', 'Reversal', 'Scalp', 'Momentum', 'Other'];
const ASSET_CLASSES = ['Stock', 'Option', 'Future'];
const MISTAKES = [
  'None / Plan Followed',
  'FOMO / Chasing',
  'Sloppy Entry / Bad Fill',
  'Early Exit / Panicked',
  'Held Too Long / Hoped',
  'Over-leveraged / Large Size',
  'Ignored Stop Loss',
  'Over-traded'
];

const fontStyle = { fontFamily: "'Outfit', sans-serif" };
const monoStyle = { fontFamily: "'JetBrains Mono', monospace" };

const inputStyle = {
  background: 'var(--bg-input)',
  borderColor: 'var(--border-input)',
  color: 'var(--text-input)', 
  ...fontStyle,
};

const whiteInputStyle = {
  background: 'var(--bg-input)',
  borderColor: 'var(--border-input)',
  color: 'var(--text-input)',
  fontWeight: '600', /* Clean, non-chunky semibold style */
  ...fontStyle,
};

const labelStyle = { color: 'var(--text-secondary)' }; /* Soft, readable secondary text for labels */

const StepIndicator = ({ currentStep }) => {
  const steps = ['WHAT', 'HOW', 'CONFIRM'];
  return (
    <div className="flex items-center gap-0.5 mb-5 select-none font-bold">
      {steps.map((s, i) => (
        <div key={s} className="flex items-center gap-0.5">
          <div className="flex items-center gap-2">
            <div
              className="flex items-center justify-center w-6 h-6 text-xs font-bold shrink-0"
              style={{
                background: i <= currentStep ? 'var(--border-active)' : 'var(--bg-sidebar)',
                color: i <= currentStep ? 'var(--bg-app)' : 'var(--text-secondary)',
              }}
            >
              {i < currentStep ? <Check size={12} /> : i + 1}
            </div>
            <span
              className="text-xs uppercase tracking-wider font-bold hidden sm:inline"
              style={{ color: i <= currentStep ? 'var(--border-active)' : 'var(--text-secondary)' }}
            >
              {s}
            </span>
          </div>
          {i < 2 && (
            <div className="w-6 md:w-10 h-px mx-2" style={{ background: i < currentStep ? 'var(--border-active)' : 'var(--border-card)' }} />
          )}
        </div>
      ))}
    </div>
  );
};

const NowButton = ({ onClick }) => (
  <button
    type="button"
    onClick={onClick}
    className="px-3 py-2 text-xs border cursor-pointer hover:bg-[var(--border-active)] hover:text-[var(--bg-app)] transition-all shrink-0 flex items-center gap-1 bg-[var(--bg-sidebar)] text-[var(--text-accent)] border-[var(--border-card)] font-medium"
    style={{ ...fontStyle }}
    title="Stamp current time"
  >
    <Clock size={12} />
    <span>Now</span>
  </button>
);

const FieldLabel = ({ children, optional }) => (
  <label className="block text-[10px] mb-1.5 uppercase tracking-wider font-medium text-[var(--text-secondary)]" style={labelStyle}>
    {children}
    {optional && <span className="text-[var(--text-secondary)]/50 lowercase font-normal"> (optional)</span>}
  </label>
);

const emptyForm = {
  ticker: '',
  assetClass: 'Stock',
  direction: 'Long',
  strategy: 'Breakout',
  tickMultiplier: '',
  entryPrice: '',
  exitPrice: '',
  qty: '',
  entryTime: '',
  exitTime: '',
  fees: '',
  notes: '',
  mistake: 'None / Plan Followed',
  imageUrl: ''
};

export default function EntryForm({ onSubmit, editingTrade, onCancelEdit, quickEntry }) {
  const [step, setStep] = useState(0);
  const [form, setForm] = useState({ ...emptyForm });

  useEffect(() => {
    if (editingTrade) {
      setForm({
        ticker: editingTrade.ticker || '',
        assetClass: editingTrade.assetClass || 'Stock',
        direction: editingTrade.direction || 'Long',
        strategy: editingTrade.strategy || 'Breakout',
        tickMultiplier: editingTrade.tickMultiplier || '',
        entryPrice: editingTrade.entryPrice || '',
        exitPrice: editingTrade.exitPrice || '',
        qty: editingTrade.qty || '',
        entryTime: editingTrade.time || '',
        exitTime: editingTrade.exitTime || '',
        fees: editingTrade.fees || '',
        notes: editingTrade.notes || '',
        mistake: editingTrade.mistake || 'None / Plan Followed',
      });
      setStep(0);
    }
  }, [editingTrade]);

  const getNowTime = () => {
    const now = new Date();
    return now.toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' });
  };

  const update = (field, value) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = useCallback(() => {
    const grossPnl = calcGrossPnl(form.entryPrice, form.exitPrice, form.qty, form.direction, form.assetClass, form.tickMultiplier);
    const netPnl = calcNetPnl(grossPnl, form.fees);
    const isOpen = !form.exitPrice || form.exitPrice === '';
    const now = new Date();
    const dateKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;

    const trade = {
      id: editingTrade ? editingTrade.id : uuidv4(),
      date: editingTrade ? editingTrade.date : dateKey,
      time: form.entryTime || getNowTime(),
      exitTime: form.exitTime || '',
      ticker: form.ticker.toUpperCase(),
      direction: form.direction,
      assetClass: form.assetClass,
      tickMultiplier: form.assetClass === 'Future' ? Number(form.tickMultiplier) || 1 : 1,
      entryPrice: Number(form.entryPrice),
      exitPrice: form.exitPrice ? Number(form.exitPrice) : null,
      qty: Number(form.qty),
      fees: Number(form.fees) || 0,
      strategy: form.strategy,
      notes: form.notes,
      mistake: form.mistake || 'None / Plan Followed',
      imageUrl: form.imageUrl || '',
      grossPnl,
      netPnl,
      isOpen,
      isSynced: editingTrade ? editingTrade.isSynced : false,
      createdAt: editingTrade ? editingTrade.createdAt : now.toISOString(),
    };
    onSubmit(trade);
    setForm({ ...emptyForm });
    setStep(0);
  }, [form, editingTrade, onSubmit]);

  useEffect(() => {
    const handleKey = (e) => {
      if (e.key === 'Escape') {
        if (editingTrade) onCancelEdit();
        else if (step > 0) setStep(s => s - 1);
      }
      if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
        e.preventDefault();
        if ((quickEntry || step === 2) && form.ticker && form.entryPrice && form.qty) {
          handleSubmit();
        }
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [step, quickEntry, form, handleSubmit, editingTrade, onCancelEdit]);

  const canAdvanceStep1 = form.ticker && form.assetClass && form.direction && form.strategy &&
    (form.assetClass !== 'Future' || form.tickMultiplier);
  const canAdvanceStep2 = form.entryPrice && form.qty;
  const canSubmit = form.ticker && form.entryPrice && form.qty;

  const grossPreview = calcGrossPnl(form.entryPrice, form.exitPrice, form.qty, form.direction, form.assetClass, form.tickMultiplier);
  const netPreview = calcNetPnl(grossPreview, form.fees);

  const PnlPreview = () => {
    if (grossPreview === null) return null;
    return (
      <div className="flex flex-wrap gap-x-6 gap-y-2 mt-4 pt-4 border-t border-[var(--border-card)]">
        <div className="text-sm font-bold flex items-center gap-1.5" style={{ color: 'var(--text-secondary)' }}>
          <span>GROSS OUTCOME:</span>
          {grossPreview >= 0 ? (
            <span className="badge-profit">{formatCurrency(grossPreview)}</span>
          ) : (
            <span className="badge-loss">{formatCurrency(grossPreview)}</span>
          )}
        </div>
        <div className="text-sm font-bold flex items-center gap-1.5" style={{ color: 'var(--text-secondary)' }}>
          <span>NET P&L PREVIEW:</span>
          {netPreview >= 0 ? (
            <span className="badge-profit">{formatCurrency(netPreview)}</span>
          ) : (
            <span className="badge-loss">{formatCurrency(netPreview)}</span>
          )}
        </div>
      </div>
    );
  };

  const SubmitButton = ({ label }) => (
    <button
      type="button"
      onClick={handleSubmit}
      disabled={!canSubmit}
      className="w-full py-4 text-xs font-bold uppercase tracking-widest cursor-pointer hover:bg-[var(--border-active)] disabled:opacity-20 disabled:cursor-not-allowed transition-all duration-200"
      style={{ background: 'var(--border-active)', color: 'var(--bg-app)', ...fontStyle }}
    >
      {label} <span className="opacity-60 font-mono-data ml-1.5">⌘↵</span>
    </button>
  );

  const FormTitle = () => (
    <div className="flex items-center justify-between mb-4 select-none">
      <div className="flex items-center gap-2">
        {quickEntry && <Zap size={13} className="text-[var(--text-accent)] pulse-cyan" />}
        <span className="text-xs uppercase tracking-widest font-bold text-[var(--text-secondary)] flex items-center gap-1.5">
          <Target size={13} className="text-[var(--text-accent)]" />
          {editingTrade ? 'EDIT SESSION RECORD' : quickEntry ? 'QUICK TRANSACTION LOG' : 'TRANSACTION REGISTER PANEL'}
        </span>
      </div>
      {editingTrade && (
        <button
          type="button"
          onClick={onCancelEdit}
          className="text-xs cursor-pointer hover:opacity-75 uppercase tracking-widest font-bold"
          style={{ color: 'var(--color-loss)', ...fontStyle }}
        >
          Cancel
        </button>
      )}
    </div>
  );

      /* ═══ QUICK ENTRY MODE ═══ */
  if (quickEntry) {
    return (
      <div className="p-4 w-full">
        <FormTitle />
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-5 mt-4">
          <div>
            <FieldLabel>Ticker</FieldLabel>
            <input value={form.ticker} onChange={e => update('ticker', e.target.value.toUpperCase())} placeholder="AAPL" className="w-full px-3.5 py-3 text-sm border uppercase font-bold" style={whiteInputStyle} />
          </div>
          <div>
            <FieldLabel>Asset</FieldLabel>
            <select value={form.assetClass} onChange={e => update('assetClass', e.target.value)} className="w-full px-3.5 py-3 text-sm border cursor-pointer font-bold" style={inputStyle}>
              {ASSET_CLASSES.map(a => <option key={a} value={a}>{a.toUpperCase()}</option>)}
            </select>
          </div>
          <div>
            <FieldLabel>Direction</FieldLabel>
            <select value={form.direction} onChange={e => update('direction', e.target.value)} className="w-full px-3.5 py-3 text-sm border cursor-pointer font-bold" style={inputStyle}>
              {['Long', 'Short'].map(d => <option key={d} value={d}>{d.toUpperCase()}</option>)}
            </select>
          </div>
          <div>
            <FieldLabel>Strategy</FieldLabel>
            <input value={form.strategy} onChange={e => update('strategy', e.target.value)} placeholder="BREAKOUT" className="w-full px-3.5 py-3 text-sm border font-bold" style={whiteInputStyle} />
          </div>
          <div>
            <FieldLabel>Entry $</FieldLabel>
            <input type="number" step="any" value={form.entryPrice} onChange={e => update('entryPrice', e.target.value)} placeholder="0.00" className="w-full px-3.5 py-3 text-sm border font-bold font-mono-data" style={whiteInputStyle} />
          </div>
          <div>
            <FieldLabel optional>Exit $</FieldLabel>
            <input type="number" step="any" value={form.exitPrice} onChange={e => update('exitPrice', e.target.value)} placeholder="0.00" className="w-full px-3.5 py-3 text-sm border font-bold font-mono-data" style={whiteInputStyle} />
          </div>
          <div>
            <FieldLabel>Qty</FieldLabel>
            <input type="number" value={form.qty} onChange={e => update('qty', e.target.value)} placeholder="100" className="w-full px-3.5 py-3 text-sm border font-bold font-mono-data" style={whiteInputStyle} />
          </div>
          <div>
            <FieldLabel>Fees</FieldLabel>
            <input type="number" step="any" value={form.fees} onChange={e => update('fees', e.target.value)} placeholder="0.00" className="w-full px-3.5 py-3 text-sm border font-bold font-mono-data" style={whiteInputStyle} />
          </div>
          {form.assetClass === 'Future' && (
            <div>
              <FieldLabel>Multiplier</FieldLabel>
              <input type="number" step="any" value={form.tickMultiplier} onChange={e => update('tickMultiplier', e.target.value)} placeholder="50" className="w-full px-3.5 py-3 text-sm border font-bold font-mono-data" style={whiteInputStyle} />
            </div>
          )}
          <div>
            <FieldLabel>Entry Time</FieldLabel>
            <div className="flex">
              <input value={form.entryTime} onChange={e => update('entryTime', e.target.value)} placeholder="09:30:00" className="w-full px-3.5 py-3 text-sm border-y border-l rounded-l-lg font-bold font-mono-data" style={whiteInputStyle} />
              <NowButton onClick={() => update('entryTime', getNowTime())} />
            </div>
          </div>
          <div>
            <FieldLabel optional>Exit Time</FieldLabel>
            <div className="flex">
              <input value={form.exitTime} onChange={e => update('exitTime', e.target.value)} placeholder="15:45:00" className="w-full px-3.5 py-3 text-sm border-y border-l rounded-l-lg font-bold font-mono-data" style={whiteInputStyle} />
              <NowButton onClick={() => update('exitTime', getNowTime())} />
            </div>
          </div>
          <div className="col-span-2">
            <FieldLabel>Rule / Mistake</FieldLabel>
            <select
              value={form.mistake}
              onChange={e => update('mistake', e.target.value)}
              className="w-full px-3.5 py-3 text-sm border cursor-pointer font-bold focus:ring-1 focus:ring-[var(--border-active)] outline-none"
              style={{ ...inputStyle, textOverflow: 'ellipsis' }}
            >
              {MISTAKES.map(m => <option key={m} value={m}>{m}</option>)}
            </select>
          </div>
          <div className="col-span-2 lg:col-span-2">
            <FieldLabel optional>Image URL</FieldLabel>
            <input value={form.imageUrl} onChange={e => update('imageUrl', e.target.value)} placeholder="https://imgur.com/..." className="w-full px-3.5 py-3 text-sm border font-bold" style={whiteInputStyle} />
          </div>
          <div className="col-span-2 lg:col-span-4">
            <FieldLabel optional>Notes</FieldLabel>
            <input value={form.notes} onChange={e => update('notes', e.target.value)} placeholder="Add any session notes here..." className="w-full px-3.5 py-3 text-sm border font-bold" style={whiteInputStyle} />
          </div>
        </div>
        <PnlPreview />
        <div className="mt-5">
          <SubmitButton label={editingTrade ? 'Update Record' : 'Submit Record'} />
        </div>
      </div>
    );
  }

  /* ═══ WIZARD MODE ═══ */
  return (
    <div className="p-4 w-full select-none">
      <FormTitle />
      <StepIndicator currentStep={step} />

      {/* Step 1 — WHAT */}
      {step === 0 && (
        <div className="space-y-4 fade-in">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
            <div>
              <FieldLabel>Ticker symbol</FieldLabel>
              <input 
                value={form.ticker} 
                onChange={e => update('ticker', e.target.value.toUpperCase())} 
                placeholder="E.G. AAPL" 
                className="w-full px-4 py-3 text-xs border uppercase font-bold" 
                style={whiteInputStyle} 
                autoFocus 
              />
            </div>
            <div>
              <FieldLabel>Asset Class</FieldLabel>
              <select value={form.assetClass} onChange={e => update('assetClass', e.target.value)} className="w-full px-4 py-3 text-xs border cursor-pointer font-bold" style={inputStyle}>
                {ASSET_CLASSES.map(a => <option key={a} value={a}>{a.toUpperCase()}</option>)}
              </select>
            </div>
            <div>
              <FieldLabel>Direction</FieldLabel>
              <select value={form.direction} onChange={e => update('direction', e.target.value)} className="w-full px-4 py-3 text-xs border cursor-pointer font-bold" style={inputStyle}>
                {['Long', 'Short'].map(d => <option key={d} value={d}>{d.toUpperCase()}</option>)}
              </select>
            </div>
            <div>
              <FieldLabel>Strategy</FieldLabel>
              <input 
                value={form.strategy} 
                onChange={e => update('strategy', e.target.value)} 
                placeholder="E.G. BREAKOUT" 
                className="w-full px-4 py-3 text-xs border font-bold" 
                style={whiteInputStyle} 
              />
            </div>
          </div>

          {form.assetClass === 'Future' && (
            <div className="fade-in max-w-xs">
              <FieldLabel>Tick Multiplier</FieldLabel>
              <input type="number" value={form.tickMultiplier} onChange={e => update('tickMultiplier', e.target.value)} placeholder="e.g. 50" className="w-full px-4 py-3 text-xs border font-bold" style={whiteInputStyle} />
            </div>
          )}

          <div className="flex justify-end pt-3">
            <button
              type="button"
              onClick={() => setStep(1)}
              disabled={!canAdvanceStep1}
              className="px-6 py-3.5 text-xs font-bold uppercase tracking-widest cursor-pointer hover:bg-[var(--border-active)] disabled:opacity-20 disabled:cursor-not-allowed transition-all duration-200"
              style={{ background: 'var(--border-active)', color: 'var(--bg-app)', ...fontStyle }}
            >
              Next: HOW [02/03]
            </button>
          </div>
        </div>
      )}

      {/* Step 2 — HOW */}
      {step === 1 && (
        <div className="space-y-4 fade-in">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <FieldLabel>Entry Price ($)</FieldLabel>
              <input type="number" step="any" value={form.entryPrice} onChange={e => update('entryPrice', e.target.value)} placeholder="0.00" className="w-full px-4 py-3 text-xs border font-bold font-mono-data" style={whiteInputStyle} autoFocus />
            </div>
            <div>
              <FieldLabel optional>Exit Price ($)</FieldLabel>
              <input type="number" step="any" value={form.exitPrice} onChange={e => update('exitPrice', e.target.value)} placeholder="0.00" className="w-full px-4 py-3 text-xs border font-bold font-mono-data" style={whiteInputStyle} />
            </div>
            <div>
              <FieldLabel>Shares / Qty</FieldLabel>
              <input type="number" value={form.qty} onChange={e => update('qty', e.target.value)} placeholder="100" className="w-full px-4 py-3 text-xs border font-bold font-mono-data" style={whiteInputStyle} />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <FieldLabel>Entry Time</FieldLabel>
              <div className="flex gap-2">
                <input value={form.entryTime} onChange={e => update('entryTime', e.target.value)} placeholder="HH:MM:SS" className="flex-1 min-w-0 px-3.5 py-2.5 text-xs border font-bold font-mono-data" style={inputStyle} />
                <NowButton onClick={() => update('entryTime', getNowTime())} />
              </div>
            </div>
            <div>
              <FieldLabel>Exit Time</FieldLabel>
              <div className="flex gap-2">
                <input value={form.exitTime} onChange={e => update('exitTime', e.target.value)} placeholder="HH:MM:SS" className="flex-1 min-w-0 px-3.5 py-2.5 text-xs border font-bold font-mono-data" style={inputStyle} />
                <NowButton onClick={() => update('exitTime', getNowTime())} />
              </div>
            </div>
            <div>
              <FieldLabel>Rule / Mistake</FieldLabel>
              <select value={form.mistake} onChange={e => update('mistake', e.target.value)} className="w-full px-4 py-3 text-xs border cursor-pointer font-bold font-mono-data" style={inputStyle}>
                {MISTAKES.map(m => <option key={m} value={m}>{m.toUpperCase()}</option>)}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <FieldLabel>Fees accrued</FieldLabel>
              <input type="number" step="any" value={form.fees} onChange={e => update('fees', e.target.value)} placeholder="0.00" className="w-full px-4 py-3 text-xs border font-bold font-mono-data" style={whiteInputStyle} />
            </div>
            <div>
              <FieldLabel optional>Image URL</FieldLabel>
              <input value={form.imageUrl} onChange={e => update('imageUrl', e.target.value)} placeholder="https://imgur.com/..." className="w-full px-4 py-3 text-xs border font-bold" style={whiteInputStyle} />
            </div>
            <div>
              <FieldLabel optional>Notes / reflections</FieldLabel>
              <input value={form.notes} onChange={e => update('notes', e.target.value)} placeholder="Session notes..." className="w-full px-4 py-3 text-xs border font-bold" style={whiteInputStyle} />
            </div>
          </div>

          <div className="flex justify-between items-center pt-3 border-t border-[var(--border-card)]">
            <button
              type="button"
              onClick={() => setStep(0)}
              className="flex items-center justify-center gap-1.5 px-5 py-2.5 text-xs font-bold uppercase tracking-widest border cursor-pointer bg-transparent text-[var(--text-secondary)] border-[var(--border-card)] hover:text-[var(--text-dark)] hover:border-[var(--border-active)] transition-all"
            >
              <ChevronLeft size={14} /> Back
            </button>
            
            <button
              type="button"
              onClick={() => setStep(2)}
              disabled={!canAdvanceStep2}
              className="px-6 py-3.5 text-xs font-bold uppercase tracking-widest cursor-pointer hover:bg-[var(--border-active)] disabled:opacity-20 disabled:cursor-not-allowed transition-all duration-200"
              style={{ background: 'var(--border-active)', color: 'var(--bg-app)', ...fontStyle }}
            >
              Next: Confirm [03/03]
            </button>
          </div>
        </div>
      )}

      {/* Step 3 — CONFIRM */}
      {step === 2 && (
        <div className="space-y-4 fade-in font-bold">
          <div className="border p-5 bg-[var(--bg-sidebar)] border-[var(--border-card)]">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs font-mono-data">
              {[
                ['Ticker symbol', form.ticker.toUpperCase(), 'var(--text-accent)'],
                ['Asset Type', form.assetClass, 'var(--text-primary)'],
                ['Direction', form.direction, form.direction === 'Long' ? 'var(--color-profit)' : 'var(--color-loss)'],
                ['Strategy name', form.strategy, 'var(--text-primary)'],
                ['Entry Price', `$${Number(form.entryPrice).toLocaleString('en-US', { minimumFractionDigits: 2 })}`, 'var(--text-accent)'],
                ['Exit Price', form.exitPrice ? `$${Number(form.exitPrice).toLocaleString('en-US', { minimumFractionDigits: 2 })}` : '—', 'var(--text-accent)'],
                ['Shares Qty', Number(form.qty).toLocaleString('en-US'), 'var(--text-accent)'],
                ['Fees Accrued', `$${Number(form.fees || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}`, 'var(--color-loss)'],
                ['Entry Time', form.entryTime || '—', 'var(--text-primary)'],
                ['Exit Time', form.exitTime || '—', 'var(--text-primary)'],
                ['Rule Broken', form.mistake, form.mistake === 'None / Plan Followed' ? 'var(--color-profit)' : 'var(--color-loss)'],
              ].map(([label, value, color]) => (
                <div key={label} className="border-b border-[var(--border-card)] pb-2">
                  <span className="block text-[10px] uppercase font-bold text-[var(--text-secondary)] mb-1">{label}</span>
                  <span className="font-bold text-sm" style={{ color }}>{value}</span>
                </div>
              ))}
            </div>
            {form.notes && (
              <div className="pt-3 mt-3 border-t border-[var(--border-card)]">
                <span className="text-xs uppercase font-bold text-[var(--text-secondary)] mr-2">Session Notes:</span>
                <span className="text-xs text-[var(--text-accent)] font-bold">{form.notes}</span>
              </div>
            )}
          </div>

          <div className="p-5 border bg-[var(--bg-sidebar)] border-[var(--border-card)]">
            <PnlPreview />
          </div>

          <div className="flex justify-between items-center pt-3">
            <button
              type="button"
              onClick={() => setStep(1)}
              className="flex items-center justify-center gap-1.5 px-5 py-2.5 text-xs font-bold uppercase tracking-widest border cursor-pointer bg-transparent text-[var(--text-secondary)] border-[var(--border-card)] hover:text-[var(--text-dark)] hover:border-[var(--border-active)] transition-all"
            >
              <ChevronLeft size={14} /> Back
            </button>
            
            <button
              type="button"
              onClick={handleSubmit}
              className="px-6 py-3.5 text-xs font-bold uppercase tracking-widest cursor-pointer hover:bg-[var(--border-active)] transition-all duration-200"
              style={{ background: 'var(--border-active)', color: 'var(--bg-app)', ...fontStyle }}
            >
              Confirm & Submit <span className="opacity-60 font-mono-data ml-2">⌘↵</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
