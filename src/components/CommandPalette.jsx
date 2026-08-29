import { useState, useEffect, useRef } from 'react';
import { Search, Calculator, Plus, LayoutDashboard, List, BookOpen, Target, Settings, X } from 'lucide-react';

export default function CommandPalette({ isOpen, onClose, onNavigate, onOpenNewTrade, onOpenRiskSizer }) {
  const [search, setSearch] = useState('');
  const inputRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
      setSearch('');
    }
  }, [isOpen]);

  const actions = [
    { id: 'new-trade', label: 'Log New Trade', icon: <Plus size={16} />, group: 'Actions', action: () => { onOpenNewTrade(); onClose(); } },
    { id: 'risk-sizer', label: 'Risk / Position Sizer', icon: <Calculator size={16} />, group: 'Tools', action: () => { onOpenRiskSizer(); onClose(); } },
    
    { id: 'nav-dashboard', label: 'Go to Dashboard', icon: <LayoutDashboard size={16} />, group: 'Navigation', action: () => { onNavigate('dashboard'); onClose(); } },
    { id: 'nav-trades', label: 'Go to Trades', icon: <List size={16} />, group: 'Navigation', action: () => { onNavigate('trades'); onClose(); } },
    { id: 'nav-journal', label: 'Go to Daily Journal', icon: <BookOpen size={16} />, group: 'Navigation', action: () => { onNavigate('journal'); onClose(); } },
    { id: 'nav-capital', label: 'Go to Capital & Targets', icon: <Target size={16} />, group: 'Navigation', action: () => { onNavigate('capital'); onClose(); } },
    { id: 'nav-settings', label: 'Go to Settings', icon: <Settings size={16} />, group: 'Navigation', action: () => { onNavigate('settings'); onClose(); } },
  ];

  const filteredActions = actions.filter(a => a.label.toLowerCase().includes(search.toLowerCase()));

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-[10vh] sm:pt-[20vh] px-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Palette */}
      <div 
        className="relative w-full max-w-lg bg-[var(--bg-card)] border border-[var(--border-card)] rounded-xl shadow-2xl overflow-hidden flex flex-col fade-in"
        style={{ maxHeight: '60vh' }}
      >
        <div className="flex items-center px-4 border-b border-[var(--border-card)]">
          <Search size={18} className="text-[var(--text-secondary)]" />
          <input
            ref={inputRef}
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Type a command or search..."
            className="w-full bg-transparent border-none text-[var(--text-primary)] px-4 py-4 focus:outline-none"
          />
          <button onClick={onClose} className="p-1 hover:bg-[var(--bg-input)] rounded-md text-[var(--text-secondary)] cursor-pointer">
            <X size={16} />
          </button>
        </div>

        <div className="overflow-y-auto py-2">
          {filteredActions.length === 0 ? (
            <div className="px-6 py-8 text-center text-[var(--text-secondary)] text-sm">
              No matching commands found.
            </div>
          ) : (
            filteredActions.map((action, i) => (
              <button
                key={action.id}
                onClick={action.action}
                className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-[var(--bg-sidebar)] transition-colors text-[var(--text-primary)] cursor-pointer"
              >
                <div className="w-8 h-8 rounded-md bg-[var(--bg-input)] border border-[var(--border-input)] flex items-center justify-center text-[var(--text-secondary)] shrink-0">
                  {action.icon}
                </div>
                <div className="flex flex-col">
                  <span className="text-sm font-medium">{action.label}</span>
                  <span className="text-[10px] uppercase tracking-wider text-[var(--text-secondary)]">{action.group}</span>
                </div>
              </button>
            ))
          )}
        </div>
        
        <div className="bg-[var(--bg-sidebar)] border-t border-[var(--border-card)] px-4 py-2 text-xs text-[var(--text-secondary)] flex justify-between">
          <span>Search for tools and shortcuts</span>
          <span><kbd className="font-sans px-1.5 py-0.5 rounded border border-[var(--border-input)] bg-[var(--bg-input)]">ESC</kbd> to close</span>
        </div>
      </div>
    </div>
  );
}
