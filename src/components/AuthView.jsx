import { useState } from 'react';
import { supabase } from '../utils/supabaseClient';

export default function AuthView() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [message, setMessage] = useState(null);

  const handleAuth = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);

    try {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      } else {
        const { error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        setMessage('Check your email for the confirmation link!');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-4 sm:p-8 fade-in" style={{ background: 'var(--bg-app)', fontFamily: "'Inter', sans-serif" }}>
      
      {/* Simple, centered card matching site theme */}
      <div className="w-full max-w-sm rounded-xl p-6 sm:p-8 glass-panel" style={{ background: 'var(--bg-card)', border: '1px solid var(--border-card)', boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)' }}>
        
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold mb-2 tracking-tight" style={{ color: 'var(--text-dark)', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
            TradeOS
          </h1>
          <p className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>
            {isLogin ? 'Sign in to your account' : 'Create a new profile'}
          </p>
        </div>

        {error && (
          <div className="mb-6 p-3 rounded-lg text-xs font-bold border" style={{ background: 'rgba(255, 59, 92, 0.1)', color: 'var(--color-loss)', borderColor: 'rgba(255, 59, 92, 0.2)' }}>
            {error}
          </div>
        )}

        {message && (
          <div className="mb-6 p-3 rounded-lg text-xs font-bold border" style={{ background: 'rgba(0, 255, 136, 0.1)', color: 'var(--color-profit)', borderColor: 'rgba(0, 255, 136, 0.2)' }}>
            {message}
          </div>
        )}

        <form onSubmit={handleAuth} className="space-y-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider mb-2" style={{ color: 'var(--text-secondary)' }}>
              Email
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 rounded-lg text-sm font-semibold outline-none transition-all focus:ring-1 focus:ring-[var(--border-active)]"
              style={{ background: 'var(--bg-input)', border: '1px solid var(--border-input)', color: 'var(--text-primary)' }}
              placeholder="trader@network.com"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider mb-2" style={{ color: 'var(--text-secondary)' }}>
              Password
            </label>
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
            onMouseEnter={e => { if(!loading) e.currentTarget.style.opacity = '0.9'; }}
            onMouseLeave={e => { if(!loading) e.currentTarget.style.opacity = '1'; }}
          >
            {loading ? 'Working...' : isLogin ? 'Sign In' : 'Sign Up'}
          </button>
        </form>

        <div className="mt-6 text-center">
          <button
            type="button"
            onClick={() => { setIsLogin(!isLogin); setError(null); setMessage(null); }}
            className="text-xs font-medium transition-colors cursor-pointer"
            style={{ color: 'var(--text-secondary)', background: 'none', border: 'none' }}
            onMouseEnter={e => e.currentTarget.style.color = 'var(--text-dark)'}
            onMouseLeave={e => e.currentTarget.style.color = 'var(--text-secondary)'}
          >
            {isLogin ? "Don't have an account? Sign up" : "Already have an account? Sign in"}
          </button>
        </div>
      </div>
    </div>
  );
}
