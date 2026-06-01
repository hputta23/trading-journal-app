import { useState } from 'react';
import { supabase } from '../utils/supabaseClient';
import { Shield, Mail, Lock, LogIn, UserPlus, Activity, Cloud, Database } from 'lucide-react';

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
      {/* Premium ambient glow */}
      <div style={{ position: 'fixed', top: '20%', left: '30%', width: '400px', height: '400px', background: 'var(--color-cyan)', filter: 'blur(150px)', opacity: 0.1, borderRadius: '50%', zIndex: 0, pointerEvents: 'none' }} />
      <div style={{ position: 'fixed', bottom: '20%', right: '30%', width: '300px', height: '300px', background: '#3b82f6', filter: 'blur(150px)', opacity: 0.1, borderRadius: '50%', zIndex: 0, pointerEvents: 'none' }} />

      <div className="w-full max-w-5xl flex flex-col md:flex-row rounded-3xl overflow-hidden relative z-10 glass-panel" style={{ border: '1px solid var(--border-card)', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)' }}>
        
        {/* Left Side: Branding & Features (Hidden on mobile) */}
        <div className="hidden md:flex flex-col justify-between w-1/2 p-12 relative overflow-hidden" style={{ background: 'linear-gradient(135deg, rgba(0, 212, 255, 0.05) 0%, rgba(0, 0, 0, 0) 100%)', borderRight: '1px solid var(--border-card)' }}>
          <div>
            <div className="flex items-center gap-3 mb-10">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'rgba(0, 212, 255, 0.1)', border: '1px solid rgba(0, 212, 255, 0.2)' }}>
                <Activity size={20} style={{ color: 'var(--color-cyan)' }} />
              </div>
              <span className="text-xl font-bold font-mono-data tracking-wide" style={{ color: 'var(--text-dark)' }}>TradeOS</span>
            </div>
            
            <h2 className="text-4xl font-bold mb-6 leading-tight font-sans tracking-tight" style={{ color: 'var(--text-dark)', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
              Secure.<br/>Institutional.<br/>Cloud-Synced.
            </h2>
            <p className="text-sm leading-relaxed mb-12" style={{ color: 'var(--text-secondary)' }}>
              Join the elite tier of retail traders. Your trading journal, analytics, and setups are now securely synced to a robust cloud infrastructure.
            </p>

            <div className="space-y-6">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ background: 'rgba(255, 255, 255, 0.03)' }}>
                  <Cloud size={16} style={{ color: 'var(--text-accent)' }} />
                </div>
                <div>
                  <h3 className="text-sm font-bold" style={{ color: 'var(--text-dark)' }}>Real-time Cloud Sync</h3>
                  <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>Access your trades from any device, anywhere.</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ background: 'rgba(255, 255, 255, 0.03)' }}>
                  <Shield size={16} style={{ color: 'var(--color-cyan)' }} />
                </div>
                <div>
                  <h3 className="text-sm font-bold" style={{ color: 'var(--text-dark)' }}>Military-Grade Encryption</h3>
                  <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>Your financial data is protected by strict RLS policies.</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ background: 'rgba(255, 255, 255, 0.03)' }}>
                  <Database size={16} style={{ color: '#facc15' }} />
                </div>
                <div>
                  <h3 className="text-sm font-bold" style={{ color: 'var(--text-dark)' }}>Infinite Storage</h3>
                  <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>Log thousands of trades with sub-millisecond query times.</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side: Auth Form */}
        <div className="w-full md:w-1/2 p-8 sm:p-12 flex flex-col justify-center" style={{ background: 'var(--bg-card)' }}>
          <div className="max-w-sm w-full mx-auto">
            <div className="flex items-center justify-center gap-3 mb-8 md:hidden">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'rgba(0, 212, 255, 0.1)', border: '1px solid rgba(0, 212, 255, 0.2)' }}>
                <Shield size={20} style={{ color: 'var(--color-cyan)' }} />
              </div>
              <span className="text-xl font-bold font-mono-data tracking-wide" style={{ color: 'var(--text-dark)' }}>TradeOS</span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold mb-2" style={{ color: 'var(--text-dark)', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
              {isLogin ? 'Welcome Back' : 'Create Account'}
            </h1>
            <p className="text-sm mb-8" style={{ color: 'var(--text-secondary)' }}>
              {isLogin ? 'Enter your credentials to access your terminal.' : 'Register a new cloud profile to begin journaling.'}
            </p>

            {error && (
              <div className="mb-6 p-4 rounded-xl text-xs font-bold flex items-center gap-2" style={{ background: 'rgba(255, 59, 92, 0.1)', color: 'var(--color-loss)', border: '1px solid rgba(255, 59, 92, 0.2)' }}>
                <Shield size={14} /> {error}
              </div>
            )}

            {message && (
              <div className="mb-6 p-4 rounded-xl text-xs font-bold flex items-center gap-2" style={{ background: 'rgba(0, 255, 136, 0.1)', color: 'var(--color-profit)', border: '1px solid rgba(0, 255, 136, 0.2)' }}>
                <Shield size={14} /> {message}
              </div>
            )}

            <form onSubmit={handleAuth} className="space-y-5">
              <div>
                <label className="block text-[11px] uppercase font-bold tracking-widest mb-2" style={{ color: 'var(--text-secondary)' }}>Email Address</label>
                <div className="flex items-center rounded-xl overflow-hidden transition-all focus-within:ring-2 focus-within:ring-[var(--color-cyan)]" style={{ background: 'var(--bg-input)', border: '1px solid var(--border-input)' }}>
                  <div className="pl-4 pr-3 flex items-center justify-center">
                    <Mail size={16} style={{ color: 'var(--text-secondary)' }} />
                  </div>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full py-4 pr-4 bg-transparent text-sm font-semibold outline-none"
                    style={{ color: 'var(--text-primary)', fontFamily: "'Inter', sans-serif" }}
                    placeholder="trader@network.com"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] uppercase font-bold tracking-widest mb-2" style={{ color: 'var(--text-secondary)' }}>Password</label>
                <div className="flex items-center rounded-xl overflow-hidden transition-all focus-within:ring-2 focus-within:ring-[var(--color-cyan)]" style={{ background: 'var(--bg-input)', border: '1px solid var(--border-input)' }}>
                  <div className="pl-4 pr-3 flex items-center justify-center">
                    <Lock size={16} style={{ color: 'var(--text-secondary)' }} />
                  </div>
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full py-4 pr-4 bg-transparent text-sm font-semibold outline-none"
                    style={{ color: 'var(--text-primary)', fontFamily: "'Inter', sans-serif" }}
                    placeholder="••••••••"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full mt-8 py-4 rounded-xl text-xs font-bold uppercase tracking-widest flex items-center justify-center gap-2 transition-all"
                style={{ 
                  background: 'var(--color-cyan)', 
                  color: '#000', 
                  border: 'none', 
                  cursor: loading ? 'not-allowed' : 'pointer',
                  opacity: loading ? 0.7 : 1,
                  boxShadow: '0 4px 14px rgba(0, 212, 255, 0.3)'
                }}
                onMouseEnter={e => { if(!loading) e.currentTarget.style.transform = 'translateY(-1px)'; }}
                onMouseLeave={e => { if(!loading) e.currentTarget.style.transform = 'translateY(0)'; }}
              >
                {loading ? (
                  'Processing Request...'
                ) : isLogin ? (
                  <><LogIn size={16} /> Authenticate Session</>
                ) : (
                  <><UserPlus size={16} /> Register Profile</>
                )}
              </button>
            </form>

            <div className="mt-8 pt-8 border-t text-center" style={{ borderColor: 'var(--border-card)' }}>
              <p className="text-xs text-[var(--text-secondary)] mb-3">
                {isLogin ? "Don't have an account yet?" : "Already have a cloud profile?"}
              </p>
              <button
                type="button"
                onClick={() => { setIsLogin(!isLogin); setError(null); setMessage(null); }}
                className="text-xs font-bold uppercase tracking-widest transition-colors cursor-pointer px-4 py-2 rounded-lg border"
                style={{ 
                  color: 'var(--text-dark)', 
                  background: 'transparent', 
                  borderColor: 'var(--border-card)' 
                }}
                onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'var(--text-secondary)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--border-card)'; }}
              >
                {isLogin ? "Create New Account" : "Log In Instead"}
              </button>
            </div>
            
          </div>
        </div>
      </div>
    </div>
  );
}
