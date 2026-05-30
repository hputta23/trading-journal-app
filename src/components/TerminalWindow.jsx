export default function TerminalWindow({ title, children, actions, icon }) {
  return (
    <div
      className="flex flex-col h-full border overflow-hidden glass-panel"
      style={{ borderColor: 'var(--border-card)', background: 'var(--bg-card)' }}
    >
      {/* ── Terminal Window Title Bar ── */}
      <div
        className="flex items-center justify-between px-5 py-3 border-b select-none shrink-0"
        style={{ borderColor: 'var(--border-card)', background: 'var(--bg-sidebar)', gap: 12 }}
      >
        <div className="flex items-center gap-2" style={{ minWidth: 0, overflow: 'hidden' }}>
          <span style={{ flexShrink: 0 }}>{icon}</span>
          <span
            className="font-bold text-[var(--text-dark)] tracking-wider uppercase font-sans"
            style={{
              fontSize: 12,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              minWidth: 0,
            }}
          >
            {title}
          </span>
        </div>

        <div className="flex items-center gap-4" style={{ flexShrink: 0 }}>
          {actions && <div className="flex items-center gap-2 mr-1">{actions}</div>}
        </div>
      </div>

      {/* ── Window Content area ── */}
      <div className="flex-1 overflow-y-auto min-h-0" style={{ background: 'var(--bg-app)' }}>
        {children}
      </div>
    </div>
  );
}
export { TerminalWindow };
