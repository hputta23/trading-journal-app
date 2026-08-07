import { useState } from 'react';


export default function AuthView({ onLoadDemo, onLogin }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleAuth = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    // Hardcoded universal login
    if (email === 'hpredz' && password === 'sunnysonu369') {
      onLogin({ user: { id: 'universal-user', email: 'hpredz' } });
    } else {
      setError('Invalid username or password.');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-4 sm:p-8 fade-in" style={{ background: 'var(--bg-app)', fontFamily: "'Inter', sans-serif" }}>
      
      {/* Simple, centered card matching site theme */}
      <div className="w-full max-w-sm rounded-xl p-6 sm:p-8 glass-panel" style={{ background: 'var(--bg-card)', border: '1px solid var(--border-card)', boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)' }}>
        
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold mb-2 tracking-tight" style={{ color: 'var(--text-dark)', fontFamily: "'Inter', sans-serif" }}>
            TradeOS
          </h1>
          <p className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>
            Sign in to your account
          </p>
        </div>

        {error && (
          <div className="mb-6 p-3 rounded-lg text-xs font-bold border" style={{ background: 'rgba(255, 59, 92, 0.1)', color: 'var(--color-loss)', borderColor: 'rgba(255, 59, 92, 0.2)' }}>
            {error}
          </div>
        )}

        <form onSubmit={handleAuth} className="space-y-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider mb-2" style={{ color: 'var(--text-secondary)' }}>
              Email
            </label>
            <input
              type="text"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 rounded-lg text-sm font-semibold outline-none transition-all focus:ring-1 focus:ring-[var(--border-active)]"
              style={{ background: 'var(--bg-input)', border: '1px solid var(--border-input)', color: 'var(--text-primary)' }}
              placeholder="Username"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--text-secondary)' }}>
                Password
              </label>
            </div>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 rounded-lg text-sm font-semibold outline-none transition-all focus:ring-1 focus:ring-[var(--border-active)]"
              style={{ background: 'var(--bg-input)', border: '1px solid var(--border-input)', color: 'var(--text-primary)' }}
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-6 py-3.5 rounded-lg text-xs font-bold uppercase tracking-widest transition-all"
            style={{ 
              background: 'var(--border-active)', 
              color: 'var(--bg-app)', 
              border: 'none', 
              cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.7 : 1
            }}
          >
            {loading ? 'Processing...' : 'Sign In'}
          </button>
        </form>

        {onLoadDemo && (
          <div className="mt-6 text-center border-t border-[var(--border-card)] pt-6">
            <button
              onClick={onLoadDemo}
              className="text-xs font-bold uppercase tracking-wider transition-all px-4 py-2 rounded border border-[var(--border-active)] text-[var(--text-accent)] hover:bg-[var(--border-active)] hover:text-[var(--bg-app)]"
            >
              Or view Demo Dashboard
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
