import { useState, useEffect, useCallback } from 'react';
import { ChevronLeft, Check, Clock, Zap, Target, Plus, X, Calculator } from 'lucide-react';
import { calcGrossPnl, calcNetPnl, formatCurrency, validateStop, calcPlannedRisk } from '../utils/calculations';
import { v4 as uuidv4 } from 'uuid';

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

const fontStyle = { fontFamily: "'Inter', sans-serif" };

const inputStyle = {
  background: 'var(--bg-input)',
  borderColor: 'var(--border-input)',
  color: 'var(--text-input)', 
  borderRadius: 10,
  ...fontStyle,
};

const whiteInputStyle = {
  background: 'var(--bg-input)',
  borderColor: 'var(--border-input)',
  color: 'var(--text-input)',
  fontWeight: '600', /* Clean, non-chunky semibold style */
  borderRadius: 10,
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
              className="flex items-center justify-center w-8 h-8 text-sm font-bold shrink-0"
              style={{
                background: i <= currentStep ? 'var(--border-active)' : 'var(--bg-sidebar)',
                color: i <= currentStep ? 'var(--bg-app)' : 'var(--text-secondary)',
              }}
            >
              {i < currentStep ? <Check size={16} /> : i + 1}
            </div>
            <span
              className="text-sm uppercase tracking-wider font-bold hidden sm:inline"
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
    className="px-5 text-sm border-y border-r cursor-pointer hover:bg-[var(--border-active)] hover:text-[var(--bg-app)] transition-all shrink-0 flex items-center justify-center gap-2 bg-[var(--bg-sidebar)] text-[var(--text-accent)] border-[var(--border-card)] font-bold"
    style={{ ...fontStyle, borderTopRightRadius: 10, borderBottomRightRadius: 10 }}
    title="Stamp current time"
  >
    <Clock size={16} />
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
  date: '',
  ticker: '',
  assetClass: 'Stock',
  direction: 'Long',
  strategy: 'Breakout',
  tickMultiplier: '',
  entryPrice: '',
  stopPrice: '',
  exitPrice: '',
  qty: '',
  entryTime: '',
  exitTime: '',
  fees: '',
  netPnlOverride: '',
  notes: '',
  mistake: 'None / Plan Followed',
  imageUrl: '',
  advancedExecution: false,
  entryLegs: [{ price: '', qty: '' }],
  exitLegs: [{ price: '', qty: '' }]
};

export default function EntryForm({ onSubmit, editingTrade, onCancelEdit, quickEntry, currentDate, settings = {} }) {
  const [step, setStep] = useState(0);
  const [form, setForm] = useState({ ...emptyForm });

  useEffect(() => {
    if (editingTrade) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setForm({
        ...emptyForm,
        date: editingTrade.date || currentDate,
        ticker: editingTrade.ticker || '',
        assetClass: editingTrade.assetClass || 'Stock',
        direction: editingTrade.direction || 'Long',
        strategy: editingTrade.strategy || 'Breakout',
        tickMultiplier: editingTrade.tickMultiplier || '',
        entryPrice: editingTrade.entryPrice || '',
        stopPrice: editingTrade.stopPrice !== undefined && editingTrade.stopPrice !== null ? editingTrade.stopPrice : '',
        exitPrice: editingTrade.exitPrice || '',
        qty: editingTrade.qty || '',
        entryTime: editingTrade.time || '',
        exitTime: editingTrade.exitTime || '',
        fees: editingTrade.fees || '',
        netPnlOverride: editingTrade.netPnlOverride !== undefined && editingTrade.netPnlOverride !== null ? editingTrade.netPnlOverride : '',
        notes: editingTrade.notes || '',
        mistake: editingTrade.mistake || 'None / Plan Followed',
        advancedExecution: false,
        entryLegs: [{ price: editingTrade.entryPrice || '', qty: editingTrade.qty || '' }],
        exitLegs: [{ price: editingTrade.exitPrice || '', qty: editingTrade.qty || '' }],
      });
    } else {
      setForm(prev => ({ ...prev, date: currentDate }));
      setStep(0);
    }
  }, [editingTrade, currentDate]);

  const getNowTime = () => {
    const now = new Date();
    return now.toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' });
  };

  const update = (field, value) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  const handleLegChange = (type, index, field, value) => {
    const newLegs = [...form[type]];
    newLegs[index][field] = value;
    update(type, newLegs);
  };

  const addLeg = (type) => {
    update(type, [...form[type], { price: '', qty: '' }]);
  };

  const removeLeg = (type, index) => {
    const newLegs = [...form[type]];
    newLegs.splice(index, 1);
    if (newLegs.length === 0) newLegs.push({ price: '', qty: '' });
    update(type, newLegs);
  };

  useEffect(() => {
    if (form.advancedExecution) {
      let totalEntryQty = 0;
      let totalEntryCost = 0;
      form.entryLegs.forEach(leg => {
        const p = Number(leg.price) || 0;
        const q = Number(leg.qty) || 0;
        if (p > 0 && q > 0) {
          totalEntryQty += q;
          totalEntryCost += p * q;
        }
      });

      let totalExitQty = 0;
      let totalExitCost = 0;
      form.exitLegs.forEach(leg => {
        const p = Number(leg.price) || 0;
        const q = Number(leg.qty) || 0;
        if (p > 0 && q > 0) {
          totalExitQty += q;
          totalExitCost += p * q;
        }
      });

      const avgEntry = totalEntryQty > 0 ? (totalEntryCost / totalEntryQty).toFixed(4).replace(/\.?0+$/, '') : '';
      const avgExit = totalExitQty > 0 ? (totalExitCost / totalExitQty).toFixed(4).replace(/\.?0+$/, '') : '';
      const finalQty = totalEntryQty > 0 ? totalEntryQty.toString() : '';

      // eslint-disable-next-line react-hooks/set-state-in-effect
      setForm(prev => {
        if (prev.entryPrice === avgEntry && prev.exitPrice === avgExit && prev.qty === finalQty) return prev;
        return {
          ...prev,
          entryPrice: avgEntry,
          exitPrice: avgExit,
          qty: finalQty
        };
      });
    }
  }, [form.advancedExecution, form.entryLegs, form.exitLegs]);

  const handleSubmit = useCallback(() => {
    let grossPnl = calcGrossPnl(form.entryPrice, form.exitPrice, form.qty, form.direction, form.assetClass, form.tickMultiplier);
    let netPnl = calcNetPnl(grossPnl, form.fees);
    
    if (form.netPnlOverride !== '' && form.netPnlOverride !== undefined && form.netPnlOverride !== null) {
      netPnl = Number(form.netPnlOverride);
      grossPnl = netPnl + (Number(form.fees) || 0);
    }
    
    const isOpen = !form.exitPrice || form.exitPrice === '';
    const now = new Date();
    const dateKey = form.date || `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;

    const trade = {
      id: editingTrade ? editingTrade.id : uuidv4(),
      date: dateKey,
      time: form.entryTime || getNowTime(),
      exitTime: form.exitTime || '',
      ticker: form.ticker.toUpperCase(),
      direction: form.direction,
      assetClass: form.assetClass,
      tickMultiplier: form.assetClass === 'Future' ? Number(form.tickMultiplier) || 1 : 1,
      entryPrice: Number(form.entryPrice),
      stopPrice: form.stopPrice === '' ? null : Number(form.stopPrice),
      exitPrice: form.exitPrice ? Number(form.exitPrice) : null,
      qty: Number(form.qty),
      fees: Number(form.fees) || 0,
      strategy: form.strategy,
      notes: form.notes,
      mistake: form.mistake || 'None / Plan Followed',
      imageUrl: form.imageUrl || '',
      grossPnl,
      netPnl,
      netPnlOverride: form.netPnlOverride !== '' && form.netPnlOverride !== undefined && form.netPnlOverride !== null ? Number(form.netPnlOverride) : null,
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
  const netPreviewRaw = calcNetPnl(grossPreview, form.fees);
  const netPreview = (form.netPnlOverride !== '' && form.netPnlOverride !== undefined && form.netPnlOverride !== null)
    ? Number(form.netPnlOverride)
    : netPreviewRaw;

  const renderRiskReadout = () => {
    const risk = calcPlannedRisk(form);
    if (risk === null) return null;
    let pctStr = '';
    if (settings && settings.accountSize && Number(settings.accountSize) > 0) {
      const pct = (risk / Number(settings.accountSize)) * 100;
      pctStr = `  ·  ${pct.toFixed(2)}% of account`;
    }
    return (
      <div className="col-span-1 sm:col-span-2 lg:col-span-full mb-4">
        <span className="text-[10px] uppercase font-bold text-[var(--text-secondary)]">Planned Risk</span>
        <div className="text-sm font-mono-data font-bold text-[var(--color-loss)]">
          Risk: {formatCurrency(risk * -1).replace('+', '')}{pctStr}
        </div>
      </div>
    );
  };

  const renderPnlPreview = () => {
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

  const renderSubmitButton = (label) => (
    <button
      type="button"
      onClick={handleSubmit}
      disabled={!canSubmit}
      className="w-full py-4 text-xs font-bold uppercase tracking-widest cursor-pointer hover:bg-[var(--border-active)] disabled:opacity-20 disabled:cursor-not-allowed transition-all duration-200"
      style={{ background: 'var(--border-active)', color: 'var(--bg-app)', borderRadius: 10, ...fontStyle }}
    >
      {label} <span className="opacity-60 font-mono-data ml-1.5">⌘↵</span>
    </button>
  );

  const renderFormTitle = () => (
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
        {renderFormTitle()}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mt-4">
          <div>
            <FieldLabel>Ticker</FieldLabel>
            <input value={form.ticker} onChange={e => update('ticker', e.target.value.toUpperCase())} placeholder="AAPL" className="w-full px-4 py-4 text-base border uppercase font-bold" style={whiteInputStyle} />
          </div>
          <div>
            <FieldLabel>Asset</FieldLabel>
            <select value={form.assetClass} onChange={e => update('assetClass', e.target.value)} className="w-full px-4 py-4 text-base border cursor-pointer font-bold" style={inputStyle}>
              {ASSET_CLASSES.map(a => <option key={a} value={a}>{a.toUpperCase()}</option>)}
            </select>
          </div>
          <div>
            <FieldLabel>Direction</FieldLabel>
            <select value={form.direction} onChange={e => update('direction', e.target.value)} className="w-full px-4 py-4 text-base border cursor-pointer font-bold" style={inputStyle}>
              {['Long', 'Short'].map(d => <option key={d} value={d}>{d.toUpperCase()}</option>)}
            </select>
          </div>
          <div>
            <FieldLabel>Strategy</FieldLabel>
            <input value={form.strategy} onChange={e => update('strategy', e.target.value)} placeholder="BREAKOUT" className="w-full px-4 py-4 text-base border font-bold" style={whiteInputStyle} />
          </div>
          <div>
            <FieldLabel>Entry $</FieldLabel>
            <input type="number" step="any" value={form.entryPrice} onChange={e => update('entryPrice', e.target.value)} placeholder="0.00" className="w-full px-4 py-4 text-base border font-bold font-mono-data" style={whiteInputStyle} />
          </div>
          <div>
            <FieldLabel optional>Stop Price</FieldLabel>
            <input type="number" step="any" value={form.stopPrice} onChange={e => update('stopPrice', e.target.value)} placeholder="0.00" className="w-full px-4 py-4 text-base border font-bold font-mono-data" style={{...whiteInputStyle, borderColor: validateStop(form.entryPrice, form.stopPrice, form.direction) ? 'var(--color-loss)' : whiteInputStyle.borderColor}} />
            {validateStop(form.entryPrice, form.stopPrice, form.direction) && <div className="text-[10px] mt-1 font-bold" style={{color: 'var(--color-loss)'}}>{validateStop(form.entryPrice, form.stopPrice, form.direction)}</div>}
          </div>
          <div>
            <FieldLabel optional>Exit $</FieldLabel>
            <input type="number" step="any" value={form.exitPrice} onChange={e => update('exitPrice', e.target.value)} placeholder="0.00" className="w-full px-4 py-4 text-base border font-bold font-mono-data" style={whiteInputStyle} />
          </div>
          <div>
            <FieldLabel>Qty</FieldLabel>
            <input type="number" value={form.qty} onChange={e => update('qty', e.target.value)} placeholder="100" className="w-full px-4 py-4 text-base border font-bold font-mono-data" style={whiteInputStyle} />
          </div>
          {renderRiskReadout()}
          <div>
            <FieldLabel>Fees</FieldLabel>
            <input type="number" step="any" value={form.fees} onChange={e => update('fees', e.target.value)} placeholder="0.00" className="w-full px-4 py-4 text-base border font-bold font-mono-data" style={whiteInputStyle} />
          </div>
          <div>
            <FieldLabel optional>Net P&L Override</FieldLabel>
            <input type="number" step="any" value={form.netPnlOverride} onChange={e => update('netPnlOverride', e.target.value)} placeholder="Auto" className="w-full px-4 py-4 text-base border font-bold font-mono-data" style={whiteInputStyle} />
          </div>
          {form.assetClass === 'Future' && (
            <div>
              <FieldLabel>Multiplier</FieldLabel>
              <input type="number" step="any" value={form.tickMultiplier} onChange={e => update('tickMultiplier', e.target.value)} placeholder="50" className="w-full px-4 py-4 text-base border font-bold font-mono-data" style={whiteInputStyle} />
            </div>
          )}
          <div>
            <FieldLabel>Trade Date</FieldLabel>
            <input type="date" value={form.date} onChange={e => update('date', e.target.value)} className="w-full px-4 py-4 text-base border font-bold font-mono-data" style={whiteInputStyle} />
          </div>
          <div>
            <FieldLabel>Entry Time</FieldLabel>
            <div className="flex">
              <input value={form.entryTime} onChange={e => update('entryTime', e.target.value)} placeholder="09:30:00" className="flex-1 min-w-0 px-4 py-4 text-base border-y border-l font-bold font-mono-data" style={{ ...whiteInputStyle, borderTopRightRadius: 0, borderBottomRightRadius: 0 }} />
              <NowButton onClick={() => update('entryTime', getNowTime())} />
            </div>
          </div>
          <div>
            <FieldLabel optional>Exit Time</FieldLabel>
            <div className="flex">
              <input value={form.exitTime} onChange={e => update('exitTime', e.target.value)} placeholder="15:45:00" className="flex-1 min-w-0 px-4 py-4 text-base border-y border-l font-bold font-mono-data" style={{ ...whiteInputStyle, borderTopRightRadius: 0, borderBottomRightRadius: 0 }} />
              <NowButton onClick={() => update('exitTime', getNowTime())} />
            </div>
          </div>
          <div className="col-span-1 sm:col-span-2">
            <FieldLabel>Rule / Mistake</FieldLabel>
            <select
              value={form.mistake}
              onChange={e => update('mistake', e.target.value)}
              className="w-full px-4 py-4 text-base border cursor-pointer font-bold focus:ring-1 focus:ring-[var(--border-active)] outline-none"
              style={{ ...inputStyle, textOverflow: 'ellipsis' }}
            >
              {MISTAKES.map(m => <option key={m} value={m}>{m}</option>)}
            </select>
          </div>
          <div className="col-span-1 sm:col-span-2 lg:col-span-2">
            <FieldLabel optional>Image URL</FieldLabel>
            <input value={form.imageUrl} onChange={e => update('imageUrl', e.target.value)} placeholder="https://imgur.com/..." className="w-full px-4 py-4 text-base border font-bold" style={whiteInputStyle} />
          </div>
          <div className="col-span-1 sm:col-span-2 lg:col-span-4">
            <FieldLabel optional>Notes</FieldLabel>
            <input value={form.notes} onChange={e => update('notes', e.target.value)} placeholder="Add any session notes here..." className="w-full px-4 py-4 text-base border font-bold" style={whiteInputStyle} />
          </div>
        </div>
        {renderPnlPreview()}
        <div className="mt-5">
          {renderSubmitButton(editingTrade ? 'Update Record' : 'Submit Record')}
        </div>
      </div>
    );
  }

  /* ═══ WIZARD MODE ═══ */
  return (
    <div className="p-4 w-full select-none">
      {renderFormTitle()}
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
                className="w-full px-4 py-4 text-sm border uppercase font-bold" 
                style={whiteInputStyle} 
                autoFocus 
              />
            </div>
            <div>
              <FieldLabel>Asset Class</FieldLabel>
              <select value={form.assetClass} onChange={e => update('assetClass', e.target.value)} className="w-full px-4 py-4 text-sm border cursor-pointer font-bold" style={inputStyle}>
                {ASSET_CLASSES.map(a => <option key={a} value={a}>{a.toUpperCase()}</option>)}
              </select>
            </div>
            <div>
              <FieldLabel>Direction</FieldLabel>
              <select value={form.direction} onChange={e => update('direction', e.target.value)} className="w-full px-4 py-4 text-sm border cursor-pointer font-bold" style={inputStyle}>
                {['Long', 'Short'].map(d => <option key={d} value={d}>{d.toUpperCase()}</option>)}
              </select>
            </div>
            <div>
              <FieldLabel>Strategy</FieldLabel>
              <input 
                value={form.strategy} 
                onChange={e => update('strategy', e.target.value)} 
                placeholder="E.G. BREAKOUT" 
                className="w-full px-4 py-4 text-sm border font-bold" 
                style={whiteInputStyle} 
              />
            </div>
          </div>

          {form.assetClass === 'Future' && (
            <div className="fade-in max-w-xs">
              <FieldLabel>Tick Multiplier</FieldLabel>
              <input type="number" value={form.tickMultiplier} onChange={e => update('tickMultiplier', e.target.value)} placeholder="e.g. 50" className="w-full px-4 py-4 text-sm border font-bold" style={whiteInputStyle} />
            </div>
          )}

          <div className="flex justify-end pt-3">
            <button
              type="button"
              onClick={() => setStep(1)}
              disabled={!canAdvanceStep1}
              className="px-6 py-3.5 text-xs font-bold uppercase tracking-widest transition-all duration-200 cursor-pointer"
              style={{ 
                background: canAdvanceStep1 ? 'var(--border-active)' : 'var(--bg-sidebar)', 
                color: canAdvanceStep1 ? 'var(--bg-app)' : 'var(--text-secondary)',
                border: canAdvanceStep1 ? '1px solid var(--border-active)' : '1px solid var(--border-card)',
                borderRadius: 10,
                opacity: canAdvanceStep1 ? 1 : 0.6,
                ...fontStyle 
              }}
            >
              Next: HOW [02/03]
            </button>
          </div>
        </div>
      )}

      {/* Step 2 — HOW */}
      {step === 1 && (
        <div className="space-y-4 fade-in">
          
          <div className="flex justify-end mb-2">
            <button
              type="button"
              onClick={() => update('advancedExecution', !form.advancedExecution)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest border transition-all"
              style={{
                background: form.advancedExecution ? 'var(--border-active)' : 'transparent',
                color: form.advancedExecution ? 'var(--bg-app)' : 'var(--text-accent)',
                borderColor: 'var(--border-active)',
                borderRadius: 10
              }}
            >
              <Calculator size={12} />
              Scale In / Out Calculator
            </button>
          </div>

          {!form.advancedExecution ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <FieldLabel>Entry Price ($)</FieldLabel>
                <input type="number" step="any" value={form.entryPrice} onChange={e => update('entryPrice', e.target.value)} placeholder="0.00" className="w-full px-4 py-4 text-sm border font-bold font-mono-data" style={whiteInputStyle} autoFocus />
              </div>
              <div>
                <FieldLabel optional>Stop Price</FieldLabel>
                <input type="number" step="any" value={form.stopPrice} onChange={e => update('stopPrice', e.target.value)} placeholder="0.00" className="w-full px-4 py-4 text-sm border font-bold font-mono-data" style={{...whiteInputStyle, borderColor: validateStop(form.entryPrice, form.stopPrice, form.direction) ? 'var(--color-loss)' : whiteInputStyle.borderColor}} />
                {validateStop(form.entryPrice, form.stopPrice, form.direction) && <div className="text-[10px] mt-1 font-bold" style={{color: 'var(--color-loss)'}}>{validateStop(form.entryPrice, form.stopPrice, form.direction)}</div>}
              </div>
              <div>
                <FieldLabel optional>Exit Price ($)</FieldLabel>
                <input type="number" step="any" value={form.exitPrice} onChange={e => update('exitPrice', e.target.value)} placeholder="0.00" className="w-full px-4 py-4 text-sm border font-bold font-mono-data" style={whiteInputStyle} />
              </div>
              <div>
                <FieldLabel>Shares / Qty</FieldLabel>
                <input type="number" value={form.qty} onChange={e => update('qty', e.target.value)} placeholder="100" className="w-full px-4 py-4 text-sm border font-bold font-mono-data" style={whiteInputStyle} />
              </div>
              {renderRiskReadout()}
            </div>
          ) : (
            <div className="space-y-4 p-5 border border-[var(--border-active)] bg-[var(--bg-sidebar)] shadow-md">
              <div className="flex flex-col gap-8">
                
                {/* Entry Legs */}
                <div className="flex flex-col">
                  <div className="flex items-center justify-between mb-3">
                    <FieldLabel>Entry Executions</FieldLabel>
                    <button type="button" onClick={() => addLeg('entryLegs')} className="px-3 py-1.5 text-[10px] font-bold text-[var(--bg-app)] bg-[var(--text-accent)] rounded uppercase tracking-wider flex items-center gap-1 hover:opacity-90 transition-opacity">
                      <Plus size={12} /> Add Leg
                    </button>
                  </div>
                  <div className="space-y-3 flex-1">
                    {form.entryLegs.map((leg, i) => (
                      <div key={`entry-${i}`} className="flex items-center gap-3">
                        <input type="number" step="any" value={leg.price} onChange={e => handleLegChange('entryLegs', i, 'price', e.target.value)} placeholder="Price ($)" className="w-1/2 px-4 py-4 text-sm border font-bold font-mono-data" style={whiteInputStyle} />
                        <input type="number" value={leg.qty} onChange={e => handleLegChange('entryLegs', i, 'qty', e.target.value)} placeholder="Shares/Qty" className="w-1/2 px-4 py-4 text-sm border font-bold font-mono-data" style={whiteInputStyle} />
                        <button type="button" onClick={() => removeLeg('entryLegs', i)} className="px-4 flex items-center justify-center text-[var(--text-secondary)] border border-transparent hover:border-[var(--color-loss)] hover:text-[var(--color-loss)] transition-colors bg-[var(--bg-app)]">
                          <X size={16} />
                        </button>
                      </div>
                    ))}
                  </div>
                  <div className="mt-4 grid grid-cols-2 gap-4">
                    <div className="p-3 bg-[var(--bg-app)] border border-[var(--border-card)] flex justify-between items-center">
                      <span className="text-[10px] font-bold text-[var(--text-secondary)] uppercase tracking-widest">Avg Entry</span>
                      <span className="text-sm font-bold font-mono-data text-[var(--text-accent)]">{form.entryPrice ? `$${form.entryPrice}` : '—'}</span>
                    </div>
                    <div className="p-3 bg-[var(--bg-app)] border border-[var(--border-card)] flex justify-between items-center">
                      <span className="text-[10px] font-bold text-[var(--text-secondary)] uppercase tracking-widest">Total Qty</span>
                      <span className="text-sm font-bold font-mono-data text-[var(--text-primary)]">{form.qty || 0}</span>
                    </div>
                  </div>
                </div>

                {/* Exit Legs */}
                <div className="flex flex-col">
                  <div className="flex items-center justify-between mb-3">
                    <FieldLabel optional>Exit Executions</FieldLabel>
                    <button type="button" onClick={() => addLeg('exitLegs')} className="px-3 py-1.5 text-[10px] font-bold text-[var(--bg-app)] bg-[var(--text-accent)] rounded uppercase tracking-wider flex items-center gap-1 hover:opacity-90 transition-opacity">
                      <Plus size={12} /> Add Leg
                    </button>
                  </div>
                  <div className="space-y-3 flex-1">
                    {form.exitLegs.map((leg, i) => (
                      <div key={`exit-${i}`} className="flex items-center gap-3">
                        <input type="number" step="any" value={leg.price} onChange={e => handleLegChange('exitLegs', i, 'price', e.target.value)} placeholder="Price ($)" className="w-1/2 px-4 py-4 text-sm border font-bold font-mono-data" style={whiteInputStyle} />
                        <input type="number" value={leg.qty} onChange={e => handleLegChange('exitLegs', i, 'qty', e.target.value)} placeholder="Shares/Qty" className="w-1/2 px-4 py-4 text-sm border font-bold font-mono-data" style={whiteInputStyle} />
                        <button type="button" onClick={() => removeLeg('exitLegs', i)} className="px-4 flex items-center justify-center text-[var(--text-secondary)] border border-transparent hover:border-[var(--color-loss)] hover:text-[var(--color-loss)] transition-colors bg-[var(--bg-app)]">
                          <X size={16} />
                        </button>
                      </div>
                    ))}
                  </div>
                  <div className="mt-4 p-3 bg-[var(--bg-app)] border border-[var(--border-card)] flex justify-between items-center">
                    <span className="text-[10px] font-bold text-[var(--text-secondary)] uppercase tracking-widest">Avg Exit</span>
                    <span className="text-sm font-bold font-mono-data text-[var(--text-accent)]">{form.exitPrice ? `$${form.exitPrice}` : '—'}</span>
                  </div>
                </div>

              </div>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <FieldLabel>Trade Date</FieldLabel>
              <input type="date" value={form.date} onChange={e => update('date', e.target.value)} className="w-full px-4 py-4 text-sm border font-bold font-mono-data" style={inputStyle} />
            </div>
            <div>
              <FieldLabel>Entry Time</FieldLabel>
              <div className="flex">
                <input value={form.entryTime} onChange={e => update('entryTime', e.target.value)} placeholder="HH:MM:SS" className="flex-1 min-w-0 px-4 py-4 text-sm border-y border-l font-bold font-mono-data" style={{ ...inputStyle, borderTopRightRadius: 0, borderBottomRightRadius: 0 }} />
                <NowButton onClick={() => update('entryTime', getNowTime())} />
              </div>
            </div>
            <div>
              <FieldLabel>Exit Time</FieldLabel>
              <div className="flex">
                <input value={form.exitTime} onChange={e => update('exitTime', e.target.value)} placeholder="HH:MM:SS" className="flex-1 min-w-0 px-4 py-4 text-sm border-y border-l font-bold font-mono-data" style={{ ...inputStyle, borderTopRightRadius: 0, borderBottomRightRadius: 0 }} />
                <NowButton onClick={() => update('exitTime', getNowTime())} />
              </div>
            </div>
            <div>
              <FieldLabel>Rule / Mistake</FieldLabel>
              <select value={form.mistake} onChange={e => update('mistake', e.target.value)} className="w-full px-4 py-4 text-sm border cursor-pointer font-bold font-mono-data" style={inputStyle}>
                {MISTAKES.map(m => <option key={m} value={m}>{m.toUpperCase()}</option>)}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <FieldLabel>Fees accrued</FieldLabel>
              <input type="number" step="any" value={form.fees} onChange={e => update('fees', e.target.value)} placeholder="0.00" className="w-full px-4 py-4 text-sm border font-bold font-mono-data" style={whiteInputStyle} />
            </div>
            <div>
              <FieldLabel optional>Net P&L Override</FieldLabel>
              <input type="number" step="any" value={form.netPnlOverride} onChange={e => update('netPnlOverride', e.target.value)} placeholder="Auto" className="w-full px-4 py-4 text-sm border font-bold font-mono-data" style={whiteInputStyle} />
            </div>
            <div>
              <FieldLabel optional>Image URL</FieldLabel>
              <input value={form.imageUrl} onChange={e => update('imageUrl', e.target.value)} placeholder="https://imgur.com/..." className="w-full px-4 py-4 text-sm border font-bold" style={whiteInputStyle} />
            </div>
            <div>
              <FieldLabel optional>Notes / reflections</FieldLabel>
              <input value={form.notes} onChange={e => update('notes', e.target.value)} placeholder="Session notes..." className="w-full px-4 py-4 text-sm border font-bold" style={whiteInputStyle} />
            </div>
          </div>

          <div className="flex justify-between items-center pt-3 border-t border-[var(--border-card)]">
            <button
              type="button"
              onClick={() => setStep(0)}
              className="flex items-center justify-center gap-1.5 px-5 py-2.5 text-xs font-bold uppercase tracking-widest border cursor-pointer bg-transparent text-[var(--text-secondary)] border-[var(--border-card)] hover:text-[var(--text-dark)] hover:border-[var(--border-active)] transition-all"
              style={{ borderRadius: 10 }}
            >
              <ChevronLeft size={14} /> Back
            </button>
            
            <button
              type="button"
              onClick={() => setStep(2)}
              disabled={!canAdvanceStep2}
              className="px-6 py-3.5 text-xs font-bold uppercase tracking-widest transition-all duration-200 cursor-pointer"
              style={{ 
                background: canAdvanceStep2 ? 'var(--border-active)' : 'var(--bg-sidebar)', 
                color: canAdvanceStep2 ? 'var(--bg-app)' : 'var(--text-secondary)',
                border: canAdvanceStep2 ? '1px solid var(--border-active)' : '1px solid var(--border-card)',
                borderRadius: 10,
                opacity: canAdvanceStep2 ? 1 : 0.6,
                ...fontStyle 
              }}
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
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs font-mono-data">
              {[
                ['Ticker symbol', form.ticker.toUpperCase(), 'var(--text-accent)'],
                ['Asset Type', form.assetClass, 'var(--text-primary)'],
                ['Direction', form.direction, form.direction === 'Long' ? 'var(--color-profit)' : 'var(--color-loss)'],
                ['Strategy name', form.strategy, 'var(--text-primary)'],
                ['Entry Price', `$${Number(form.entryPrice).toLocaleString('en-US', { minimumFractionDigits: 2 })}`, 'var(--text-accent)'],
                form.stopPrice ? ['Stop Price', `$${Number(form.stopPrice).toLocaleString('en-US', { minimumFractionDigits: 2 })}`, 'var(--color-loss)'] : null,
                calcPlannedRisk(form) !== null ? ['Planned Risk', formatCurrency(calcPlannedRisk(form) * -1).replace('+', ''), 'var(--color-loss)'] : null,
                ['Exit Price', form.exitPrice ? `$${Number(form.exitPrice).toLocaleString('en-US', { minimumFractionDigits: 2 })}` : '—', 'var(--text-accent)'],
                ['Shares Qty', Number(form.qty).toLocaleString('en-US'), 'var(--text-accent)'],
                ['Fees Accrued', `$${Number(form.fees || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}`, 'var(--color-loss)'],
                ['Entry Time', form.entryTime || '—', 'var(--text-primary)'],
                ['Exit Time', form.exitTime || '—', 'var(--text-primary)'],
                form.netPnlOverride && form.netPnlOverride !== '' ? ['Net P&L Override', `$${Number(form.netPnlOverride).toLocaleString('en-US', { minimumFractionDigits: 2 })}`, 'var(--text-accent)'] : null,
                ['Rule Broken', form.mistake, form.mistake === 'None / Plan Followed' ? 'var(--color-profit)' : 'var(--color-loss)'],
              ].filter(Boolean).map(([label, value, color]) => (
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
            {renderPnlPreview()}
          </div>

          <div className="flex justify-between items-center pt-3">
            <button
              type="button"
              onClick={() => setStep(1)}
              className="flex items-center justify-center gap-1.5 px-5 py-2.5 text-xs font-bold uppercase tracking-widest border cursor-pointer bg-transparent text-[var(--text-secondary)] border-[var(--border-card)] hover:text-[var(--text-dark)] hover:border-[var(--border-active)] transition-all"
              style={{ borderRadius: 10 }}
            >
              <ChevronLeft size={14} /> Back
            </button>
            
            <button
              type="button"
              onClick={handleSubmit}
              className="px-6 py-3.5 text-xs font-bold uppercase tracking-widest cursor-pointer hover:bg-[var(--border-active)] transition-all duration-200"
              style={{ background: 'var(--border-active)', color: 'var(--bg-app)', borderRadius: 10, ...fontStyle }}
            >
              Confirm & Submit <span className="opacity-60 font-mono-data ml-2">⌘↵</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
