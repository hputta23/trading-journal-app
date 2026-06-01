import { useState } from 'react';
import { supabase } from '../utils/supabaseClient';
import { Shield, Mail, Lock, LogIn, UserPlus } from 'lucide-react';

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
    <div className="min-h-screen w-full flex items-center justify-center p-4 fade-in" style={{ background: 'var(--bg-app)', fontFamily: "'Inter', sans-serif" }}>
      <div className="glass-panel w-full max-w-md p-8 rounded-2xl relative overflow-hidden" style={{ border: '1px solid var(--border-card)' }}>
        
        {/* Decorative background glow */}
        <div style={{ position: 'absolute', top: '-50px', left: '-50px', width: '200px', height: '200px', background: 'var(--color-cyan)', filter: 'blur(100px)', opacity: 0.15, borderRadius: '50%', zIndex: 0 }} />
        
        <div className="relative z-10">
          <div className="flex justify-center mb-6">
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center" style={{ background: 'rgba(0, 212, 255, 0.1)', border: '1px solid rgba(0, 212, 255, 0.25)' }}>
              <Shield size={32} style={{ color: 'var(--color-cyan)' }} />
            </div>
          </div>
          
          <h1 className="text-center text-2xl font-bold mb-2 font-mono-data" style={{ color: 'var(--text-dark)', letterSpacing: '-0.02em' }}>
            TradeOS SECURE
          </h1>
          <p className="text-center text-sm mb-8" style={{ color: 'var(--text-secondary)' }}>
            {isLogin ? 'Authenticate to access your cloud-synced trading journal.' : 'Create a secure profile to backup your trades to the cloud.'}
          </p>

          {error && (
            <div className="mb-6 p-4 rounded-xl text-xs font-bold font-mono-data" style={{ background: 'rgba(255, 59, 92, 0.1)', color: 'var(--color-loss)', border: '1px solid rgba(255, 59, 92, 0.3)' }}>
              ERROR: {error}
            </div>
          )}

          {message && (
            <div className="mb-6 p-4 rounded-xl text-xs font-bold font-mono-data" style={{ background: 'rgba(0, 255, 136, 0.1)', color: 'var(--color-profit)', border: '1px solid rgba(0, 255, 136, 0.3)' }}>
              {message}
            </div>
          )}

          <form onSubmit={handleAuth} className="space-y-4">
            <div>
              <label className="block text-[10px] uppercase font-bold tracking-widest mb-1.5" style={{ color: 'var(--text-secondary)' }}>Email Address</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Mail size={16} style={{ color: 'var(--text-secondary)' }} />
                </div>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-11 pr-4 py-3.5 rounded-xl text-sm font-mono-data font-semibold outline-none transition-all"
                  style={{ background: 'var(--bg-input)', border: '1px solid var(--border-input)', color: 'var(--text-input)' }}
                  placeholder="trader@network.com"
                />
              </div>
            </div>

            <div>
              <label className="block text-[10px] uppercase font-bold tracking-widest mb-1.5" style={{ color: 'var(--text-secondary)' }}>Password</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Lock size={16} style={{ color: 'var(--text-secondary)' }} />
                </div>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-11 pr-4 py-3.5 rounded-xl text-sm font-mono-data font-semibold outline-none transition-all"
                  style={{ background: 'var(--bg-input)', border: '1px solid var(--border-input)', color: 'var(--text-input)' }}
                  placeholder="••••••••"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-6 py-4 rounded-xl text-xs font-bold uppercase tracking-widest flex items-center justify-center gap-2 transition-all hover:opacity-90 disabled:opacity-50"
              style={{ background: 'var(--color-cyan)', color: '#000', border: 'none', cursor: loading ? 'not-allowed' : 'pointer' }}
            >
              {loading ? (
                'Processing...'
              ) : isLogin ? (
                <><LogIn size={16} /> INITIALIZE SESSION</>
              ) : (
                <><UserPlus size={16} /> REGISTER CLOUD PROFILE</>
              )}
            </button>
          </form>

          <div className="mt-6 text-center">
            <button
              type="button"
              onClick={() => { setIsLogin(!isLogin); setError(null); setMessage(null); }}
              className="text-xs font-bold transition-colors cursor-pointer"
              style={{ color: 'var(--text-secondary)', background: 'none', border: 'none' }}
              onMouseEnter={(e) => e.target.style.color = 'var(--color-cyan)'}
              onMouseLeave={(e) => e.target.style.color = 'var(--text-secondary)'}
            >
              {isLogin ? "Don't have a profile? Register." : "Already registered? Login."}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
