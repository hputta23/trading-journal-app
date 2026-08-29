import React, { useState, useEffect } from 'react';
import { Layers, Plus, Save, Edit2, Trash2, X, Image as ImageIcon } from 'lucide-react';
import { loadPlaybook, savePlaybook } from '../utils/storage';

const emptyPlaybook = { id: '', name: '', marketEnv: '', entryRules: '', exitRules: '', imageUrl: '' };

export default function PlaybookView() {
  const [playbooks, setPlaybooks] = useState([]);
  const [editing, setEditing] = useState(null);

  useEffect(() => {
    setPlaybooks(loadPlaybook());
  }, []);

  const handleSave = () => {
    if (!editing.name) return;
    
    let updated;
    if (editing.id) {
      updated = playbooks.map(p => p.id === editing.id ? editing : p);
    } else {
      updated = [{ ...editing, id: Date.now().toString() }, ...playbooks];
    }
    
    setPlaybooks(updated);
    savePlaybook(updated);
    setEditing(null);
  };

  const handleDelete = (id) => {
    if (!window.confirm('Delete this playbook?')) return;
    const updated = playbooks.filter(p => p.id !== id);
    setPlaybooks(updated);
    savePlaybook(updated);
  };

  return (
    <div className="fade-in" style={{ padding: '24px 28px', maxWidth: 1200, margin: '0 auto', minHeight: '100%' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <Layers size={24} style={{ color: 'var(--text-accent)' }} />
          <h1 style={{ fontSize: 26, fontWeight: 900, color: 'var(--text-dark)', letterSpacing: '-0.02em', margin: 0, lineHeight: 1.2 }}>Trading Playbook</h1>
        </div>
        {!editing && (
          <button
            onClick={() => setEditing({ ...emptyPlaybook })}
            className="flex items-center gap-2 cursor-pointer font-bold px-4 py-2 hover:opacity-90 transition-colors"
            style={{ background: 'var(--border-active)', color: 'var(--bg-app)', borderRadius: 10, fontSize: 13 }}
          >
            <Plus size={16} /> New Playbook
          </button>
        )}
      </div>
      
      {editing ? (
        <div className="glass-panel" style={{ padding: '24px', borderRadius: 16, border: '1px solid var(--border-card)', marginBottom: 24 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 20 }}>
            <h2 style={{ fontSize: 18, fontWeight: 800, margin: 0, color: 'var(--text-dark)' }}>
              {editing.id ? 'Edit Playbook' : 'Create Playbook'}
            </h2>
            <div style={{ display: 'flex', gap: 12 }}>
              <button onClick={() => setEditing(null)} className="flex items-center gap-2 cursor-pointer font-bold px-3 py-1.5 hover:bg-[var(--bg-input)] rounded-lg transition-colors" style={{ color: 'var(--text-secondary)', fontSize: 13 }}>
                <X size={14} /> Cancel
              </button>
              <button onClick={handleSave} className="flex items-center gap-2 cursor-pointer font-bold px-4 py-1.5 rounded-lg transition-colors" style={{ background: 'var(--color-profit)', color: '#fff', fontSize: 13 }}>
                <Save size={14} /> Save
              </button>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 20 }}>
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 6 }}>Strategy Name</label>
              <input
                value={editing.name}
                onChange={e => setEditing(p => ({ ...p, name: e.target.value }))}
                placeholder="e.g. Breakout Pullback"
                style={{ width: '100%', padding: '12px 16px', background: 'var(--bg-input)', border: '1px solid var(--border-input)', borderRadius: 10, color: 'var(--text-primary)', fontSize: 14 }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 6 }}>Ideal Market Environment</label>
              <input
                value={editing.marketEnv}
                onChange={e => setEditing(p => ({ ...p, marketEnv: e.target.value }))}
                placeholder="e.g. Trending, High Volatility"
                style={{ width: '100%', padding: '12px 16px', background: 'var(--bg-input)', border: '1px solid var(--border-input)', borderRadius: 10, color: 'var(--text-primary)', fontSize: 14 }}
              />
            </div>
          </div>
          
          <div style={{ marginTop: 20 }}>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 6 }}>Example Image URL (Optional)</label>
            <input
              value={editing.imageUrl}
              onChange={e => setEditing(p => ({ ...p, imageUrl: e.target.value }))}
              placeholder="https://..."
              style={{ width: '100%', padding: '12px 16px', background: 'var(--bg-input)', border: '1px solid var(--border-input)', borderRadius: 10, color: 'var(--text-primary)', fontSize: 14 }}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 20, marginTop: 20 }}>
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 6 }}>Entry Rules & Criteria</label>
              <textarea
                value={editing.entryRules}
                onChange={e => setEditing(p => ({ ...p, entryRules: e.target.value }))}
                placeholder="1. Wait for price to break resistance...&#10;2. Wait for pullback..."
                style={{ width: '100%', minHeight: 120, padding: '12px 16px', background: 'var(--bg-input)', border: '1px solid var(--border-input)', borderRadius: 10, color: 'var(--text-primary)', fontSize: 14, resize: 'vertical' }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 6 }}>Exit & Stop Rules</label>
              <textarea
                value={editing.exitRules}
                onChange={e => setEditing(p => ({ ...p, exitRules: e.target.value }))}
                placeholder="1. Stop loss below moving average...&#10;2. Target 2R..."
                style={{ width: '100%', minHeight: 120, padding: '12px 16px', background: 'var(--bg-input)', border: '1px solid var(--border-input)', borderRadius: 10, color: 'var(--text-primary)', fontSize: 14, resize: 'vertical' }}
              />
            </div>
          </div>
        </div>
      ) : playbooks.length === 0 ? (
        <div className="glass-panel" style={{ padding: '60px 20px', borderRadius: 16, border: '1px dashed var(--border-card)', textAlign: 'center' }}>
          <Layers size={48} style={{ color: 'var(--text-secondary)', opacity: 0.3, margin: '0 auto 20px' }} />
          <h2 style={{ fontSize: 20, fontWeight: 800, color: 'var(--text-dark)', marginBottom: 10 }}>No Playbooks Yet</h2>
          <p style={{ color: 'var(--text-secondary)', maxWidth: 400, margin: '0 auto' }}>
            A trading playbook helps you codify your setups. Define your rules, criteria, and environments here to trade more systematically.
          </p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(400px, 1fr))', gap: 20 }}>
          {playbooks.map(p => (
            <div key={p.id} className="glass-panel flex flex-col" style={{ borderRadius: 16, border: '1px solid var(--border-card)', overflow: 'hidden' }}>
              {p.imageUrl && (
                <div style={{ width: '100%', height: 160, background: 'var(--bg-input)', overflow: 'hidden', borderBottom: '1px solid var(--border-card)' }}>
                  <img src={p.imageUrl} alt={p.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                </div>
              )}
              <div style={{ padding: '24px', flex: 1, display: 'flex', flexDirection: 'column' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                  <div>
                    <h3 style={{ fontSize: 18, fontWeight: 800, margin: 0, color: 'var(--text-dark)' }}>{p.name}</h3>
                    {p.marketEnv && <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-accent)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{p.marketEnv}</span>}
                  </div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button onClick={() => setEditing(p)} className="text-[var(--text-secondary)] hover:text-[var(--color-cyan)] cursor-pointer"><Edit2 size={16}/></button>
                    <button onClick={() => handleDelete(p.id)} className="text-[var(--text-secondary)] hover:text-[var(--color-loss)] cursor-pointer"><Trash2 size={16}/></button>
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginTop: 12, flex: 1 }}>
                  {p.entryRules && (
                    <div style={{ background: 'var(--bg-input)', padding: '12px 16px', borderRadius: 10, border: '1px solid var(--border-input)' }}>
                      <div style={{ fontSize: 10, fontWeight: 800, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 6 }}>Entry Rules</div>
                      <div style={{ fontSize: 13, color: 'var(--text-primary)', whiteSpace: 'pre-wrap', lineHeight: 1.5 }}>{p.entryRules}</div>
                    </div>
                  )}
                  {p.exitRules && (
                    <div style={{ background: 'var(--bg-input)', padding: '12px 16px', borderRadius: 10, border: '1px solid var(--border-input)' }}>
                      <div style={{ fontSize: 10, fontWeight: 800, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 6 }}>Exit Rules</div>
                      <div style={{ fontSize: 13, color: 'var(--text-primary)', whiteSpace: 'pre-wrap', lineHeight: 1.5 }}>{p.exitRules}</div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
