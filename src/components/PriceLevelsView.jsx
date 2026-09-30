import React, { useState, useEffect } from 'react';
import { Crosshair, Edit2, Trash2, Check, X, Plus } from 'lucide-react';
import toast from 'react-hot-toast';

const fontStyle = { fontFamily: "'Inter', sans-serif" };
const monoStyle = { fontFamily: "'JetBrains Mono', monospace" };
const panelStyle = { borderColor: 'var(--border-card)', background: 'var(--bg-card)', borderRadius: 14 };
const inputStyle = { background: 'var(--bg-input)', borderColor: 'var(--border-input)', color: 'var(--text-input)', borderRadius: 10, ...fontStyle, padding: '8px 12px', border: '1px solid var(--border-input)', width: '100%', boxSizing: 'border-box' };

const STORAGE_KEY = 'trading-journal-price-levels';

export default function PriceLevelsView() {
  const [levels, setLevels] = useState([]);
  const [editingId, setEditingId] = useState(null);
  
  const [newStock, setNewStock] = useState({
    ticker: '', support1: '', support2: '', resistance1: '', resistance2: '', notes: ''
  });

  const [editFormData, setEditFormData] = useState({});

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        setLevels(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to parse saved price levels");
      }
    }
  }, []);

  const saveLevels = (newLevels) => {
    setLevels(newLevels);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newLevels));
  };

  const handleAdd = (e) => {
    e.preventDefault();
    if (!newStock.ticker) {
      toast.error('Ticker is required');
      return;
    }

    const newEntry = {
      ...newStock,
      id: Date.now(),
      ticker: newStock.ticker.toUpperCase(),
      lastUpdated: new Date().toISOString()
    };

    saveLevels([newEntry, ...levels]);
    setNewStock({ ticker: '', support1: '', support2: '', resistance1: '', resistance2: '', notes: '' });
    toast.success('Added price levels');
  };

  const handleDelete = (id) => {
    if (window.confirm('Are you sure you want to delete these price levels?')) {
      saveLevels(levels.filter(l => l.id !== id));
      toast.success('Deleted price levels');
    }
  };

  const startEdit = (level) => {
    setEditingId(level.id);
    setEditFormData(level);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditFormData({});
  };

  const handleEditSave = () => {
    if (!editFormData.ticker) {
      toast.error('Ticker is required');
      return;
    }

    const updatedLevels = levels.map(l => {
      if (l.id === editingId) {
        return {
          ...editFormData,
          ticker: editFormData.ticker.toUpperCase(),
          lastUpdated: new Date().toISOString()
        };
      }
      return l;
    });

    saveLevels(updatedLevels);
    setEditingId(null);
    setEditFormData({});
    toast.success('Updated price levels');
  };

  const handleEditChange = (e, field) => {
    setEditFormData({
      ...editFormData,
      [field]: e.target.value
    });
  };

  const formatDate = (isoString) => {
    if (!isoString) return '';
    return new Date(isoString).toLocaleDateString();
  };

  return (
    <div style={{ ...fontStyle, padding: '20px', color: 'var(--text-dark)' }}>
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: '24px', gap: '12px' }}>
        <Crosshair size={28} color="var(--text-accent)" />
        <h1 style={{ margin: 0, fontSize: '24px', fontWeight: 600 }}>Price Levels</h1>
      </div>

      <div className="glass-panel" style={{ ...panelStyle, padding: '20px', marginBottom: '24px', border: '1px solid var(--border-card)' }}>
        <h2 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '16px', color: 'var(--text-secondary)' }}>Add New Stock</h2>
        <form onSubmit={handleAdd} style={{ display: 'flex', gap: '12px', alignItems: 'flex-start', flexWrap: 'wrap' }}>
          <div style={{ flex: '1 1 120px' }}>
            <input style={inputStyle} placeholder="Ticker" value={newStock.ticker} onChange={e => setNewStock({...newStock, ticker: e.target.value})} />
          </div>
          <div style={{ flex: '1 1 120px' }}>
            <input style={inputStyle} placeholder="Support 1" value={newStock.support1} onChange={e => setNewStock({...newStock, support1: e.target.value})} />
          </div>
          <div style={{ flex: '1 1 120px' }}>
            <input style={inputStyle} placeholder="Support 2" value={newStock.support2} onChange={e => setNewStock({...newStock, support2: e.target.value})} />
          </div>
          <div style={{ flex: '1 1 120px' }}>
            <input style={inputStyle} placeholder="Resistance 1" value={newStock.resistance1} onChange={e => setNewStock({...newStock, resistance1: e.target.value})} />
          </div>
          <div style={{ flex: '1 1 120px' }}>
            <input style={inputStyle} placeholder="Resistance 2" value={newStock.resistance2} onChange={e => setNewStock({...newStock, resistance2: e.target.value})} />
          </div>
          <div style={{ flex: '2 1 200px' }}>
            <input style={inputStyle} placeholder="Notes" value={newStock.notes} onChange={e => setNewStock({...newStock, notes: e.target.value})} />
          </div>
          <button type="submit" style={{ ...fontStyle, display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 16px', background: 'var(--text-accent)', color: '#fff', border: 'none', borderRadius: '10px', cursor: 'pointer', fontWeight: 500, height: '37px' }}>
            <Plus size={18} /> Add
          </button>
        </form>
      </div>

      <div className="glass-panel" style={{ ...panelStyle, border: '1px solid var(--border-card)', overflow: 'hidden' }}>
        {levels.length === 0 ? (
          <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-secondary)' }}>
            <Crosshair size={48} style={{ opacity: 0.2, marginBottom: '16px' }} />
            <p>No stocks tracked yet. Add one above to get started.</p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border-card)', color: 'var(--text-secondary)' }}>
                  <th style={{ padding: '16px', fontWeight: 500 }}>Ticker</th>
                  <th style={{ padding: '16px', fontWeight: 500 }}>Support 1</th>
                  <th style={{ padding: '16px', fontWeight: 500 }}>Support 2</th>
                  <th style={{ padding: '16px', fontWeight: 500 }}>Resistance 1</th>
                  <th style={{ padding: '16px', fontWeight: 500 }}>Resistance 2</th>
                  <th style={{ padding: '16px', fontWeight: 500 }}>Notes</th>
                  <th style={{ padding: '16px', fontWeight: 500 }}>Last Updated</th>
                  <th style={{ padding: '16px', fontWeight: 500 }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {levels.map((level) => (
                  <tr key={level.id} style={{ borderBottom: '1px solid var(--border-card)' }}>
                    {editingId === level.id ? (
                      <>
                        <td style={{ padding: '12px 16px' }}><input style={{...inputStyle, width: '100%', ...monoStyle}} value={editFormData.ticker} onChange={e => handleEditChange(e, 'ticker')} /></td>
                        <td style={{ padding: '12px 16px' }}><input style={{...inputStyle, width: '100%'}} value={editFormData.support1} onChange={e => handleEditChange(e, 'support1')} /></td>
                        <td style={{ padding: '12px 16px' }}><input style={{...inputStyle, width: '100%'}} value={editFormData.support2} onChange={e => handleEditChange(e, 'support2')} /></td>
                        <td style={{ padding: '12px 16px' }}><input style={{...inputStyle, width: '100%'}} value={editFormData.resistance1} onChange={e => handleEditChange(e, 'resistance1')} /></td>
                        <td style={{ padding: '12px 16px' }}><input style={{...inputStyle, width: '100%'}} value={editFormData.resistance2} onChange={e => handleEditChange(e, 'resistance2')} /></td>
                        <td style={{ padding: '12px 16px' }}><input style={inputStyle} value={editFormData.notes} onChange={e => handleEditChange(e, 'notes')} /></td>
                        <td style={{ padding: '12px 16px', color: 'var(--text-secondary)', fontSize: '14px' }}>{formatDate(level.lastUpdated)}</td>
                        <td style={{ padding: '12px 16px', whiteSpace: 'nowrap' }}>
                          <button onClick={handleEditSave} style={{ background: 'transparent', border: 'none', cursor: 'pointer', marginRight: '8px', color: 'var(--text-accent)' }}><Check size={18} /></button>
                          <button onClick={cancelEdit} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)' }}><X size={18} /></button>
                        </td>
                      </>
                    ) : (
                      <>
                        <td style={{ padding: '16px', ...monoStyle, fontWeight: 'bold' }}>{level.ticker}</td>
                        <td style={{ padding: '16px', color: 'var(--color-profit)' }}>{level.support1}</td>
                        <td style={{ padding: '16px', color: 'var(--color-profit)' }}>{level.support2}</td>
                        <td style={{ padding: '16px', color: 'var(--color-loss)' }}>{level.resistance1}</td>
                        <td style={{ padding: '16px', color: 'var(--color-loss)' }}>{level.resistance2}</td>
                        <td style={{ padding: '16px' }}>{level.notes}</td>
                        <td style={{ padding: '16px', color: 'var(--text-secondary)', fontSize: '14px' }}>{formatDate(level.lastUpdated)}</td>
                        <td style={{ padding: '16px', whiteSpace: 'nowrap' }}>
                          <button onClick={() => startEdit(level)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', marginRight: '8px', color: 'var(--text-secondary)' }}><Edit2 size={18} /></button>
                          <button onClick={() => handleDelete(level.id)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--color-loss)' }}><Trash2 size={18} /></button>
                        </td>
                      </>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
