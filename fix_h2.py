import re

with open('src/components/AnalyticsView.jsx', 'r') as f:
    content = f.read()

# Restore all </span></div> to </span>
content = content.replace("</span></div>", "</span>")

# For Cumulative Equity Curve, the <div> was opened, so we need to add </div> back.
old_cumulative = """<div style={{ display: 'flex', alignItems: 'center', gap: 10 }}><span style={{ fontSize: 15, fontWeight: 800, color: 'var(--text-dark)', letterSpacing: '-0.01em' }}>
                  <TrendingUp size={18} className="text-[var(--color-cyan)]" />
                  Cumulative Equity Curve
                </span>"""
new_cumulative = """<div style={{ display: 'flex', alignItems: 'center', gap: 10 }}><span style={{ fontSize: 15, fontWeight: 800, color: 'var(--text-dark)', letterSpacing: '-0.01em' }}>
                  <TrendingUp size={18} className="text-[var(--color-cyan)]" />
                  Cumulative Equity Curve
                </span></div>"""

content = content.replace(old_cumulative, new_cumulative)

with open('src/components/AnalyticsView.jsx', 'w') as f:
    f.write(content)
