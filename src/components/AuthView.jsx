import { useState } from 'react';
import { supabase } from '../utils/supabaseClient';
import { motion, AnimatePresence } from 'framer-motion';
import { Activity, Mail, Lock, ArrowRight } from 'lucide-react';

export default function AuthView({ onLoadDemo, onLogin }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  // 'signin' | 'signup' | 'reset'
  const [view, setView] = useState('signin');

  const handleAuth = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (view === 'signup') {
        const { error } = await supabase.auth.signUp({
          email,
          password,
        });
        if (error) throw error;
        setError('Check your email for the confirmation link.');
      } else if (view === 'signin') {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
        // The App component listens for auth state changes, so it will handle onLogin automatically
      } else if (view === 'reset') {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/reset-password`,
        });
        if (error) throw error;
        setError('Check your email for the password reset link.');
      }
    } catch (error) {
      setError(error.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  const variants = {
    initial: { opacity: 0, x: 20 },
    in: { opacity: 1, x: 0 },
    out: { opacity: 0, x: -20 },
  };

  return (
    <div className="min-h-screen w-full flex bg-[var(--bg-app)] text-[var(--text-primary)]" style={{ fontFamily: "'Inter', sans-serif" }}>
      
      {/* ── Left Branding Side (Hidden on Mobile) ── */}
      <div className="hidden md:flex md:w-[45%] lg:w-[40%] flex-col justify-between p-12 border-r border-[var(--border-card)] relative overflow-hidden" style={{ background: 'var(--bg-sidebar)' }}>
        
        {/* Subtle glowing grid background */}
        <div className="absolute inset-0 pointer-events-none opacity-20" 
             style={{ 
               backgroundImage: `linear-gradient(var(--border-card) 1px, transparent 1px), linear-gradient(90deg, var(--border-card) 1px, transparent 1px)`,
               backgroundSize: '40px 40px',
               maskImage: 'radial-gradient(ellipse at top left, black, transparent 80%)',
               WebkitMaskImage: 'radial-gradient(ellipse at top left, black, transparent 80%)'
             }} 
        />

        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-16">
            <div className="w-10 h-10 rounded-xl bg-[var(--border-active)] flex items-center justify-center text-[var(--bg-app)]">
              <Activity size={20} strokeWidth={3} />
            </div>
            <span className="text-2xl font-black tracking-tight text-[var(--text-dark)]">TradeOS</span>
          </div>

          <h2 className="text-4xl font-bold tracking-tight text-[var(--text-dark)] leading-tight mb-6">
            Institutional-grade<br/>trading analytics.
          </h2>
          <p className="text-[var(--text-secondary)] text-lg leading-relaxed max-w-md">
            Log your trades, analyze your edge, and identify your mistake tax with powerful, automated metrics.
          </p>
        </div>

        <div className="relative z-10">
          <div className="glass-panel p-6 rounded-2xl">
            <p className="text-sm italic text-[var(--text-secondary)] mb-4">
              "TradeOS helped me realize I was bleeding 30% of my profits to FOMO entries. Once I saw the data, the fix was easy."
            </p>
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-[var(--border-card)]" />
              <div>
                <p className="text-xs font-bold text-[var(--text-dark)]">Prop Firm Trader</p>
                <p className="text-[10px] uppercase tracking-widest text-[var(--text-secondary)]">Funded $150k</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Right Auth Side ── */}
      <div className="flex-1 flex items-center justify-center p-6 sm:p-12 relative">
        <div className="w-full max-w-[420px]">
          
          {/* Mobile Logo */}
          <div className="md:hidden flex items-center gap-3 mb-10 justify-center">
            <div className="w-8 h-8 rounded-lg bg-[var(--border-active)] flex items-center justify-center text-[var(--bg-app)]">
              <Activity size={16} strokeWidth={3} />
            </div>
            <span className="text-xl font-black tracking-tight text-[var(--text-dark)]">TradeOS</span>
          </div>

          <AnimatePresence mode="wait">
            <motion.div
              key={view}
              initial="initial"
              animate="in"
              exit="out"
              variants={variants}
              transition={{ duration: 0.2 }}
            >
              <div className="mb-8">
                <h1 className="text-2xl font-bold tracking-tight text-[var(--text-dark)] mb-2">
                  {view === 'signin' ? 'Welcome back' : view === 'signup' ? 'Create an account' : 'Reset password'}
                </h1>
                <p className="text-sm text-[var(--text-secondary)]">
                  {view === 'signin' ? 'Enter your credentials to access your dashboard.' : 
                   view === 'signup' ? 'Start tracking your edge today.' : 
                   'Enter your email and we will send you a reset link.'}
                </p>
              </div>

              {error && (
                <div className={`mb-6 p-4 rounded-xl text-xs font-bold border ${error.includes('Check your email') ? 'bg-[var(--bg-badge-profit)] text-[var(--color-profit)] border-[var(--border-profit)]' : 'bg-[var(--bg-badge-loss)] text-[var(--color-loss)] border-[var(--border-loss)]'}`}>
                  {error}
                </div>
              )}

              <form onSubmit={handleAuth} className="space-y-4">
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-[var(--text-secondary)] mb-2">
                    Email Address
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <Mail size={16} className="text-[var(--text-secondary)] opacity-50" />
                    </div>
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full pl-11 pr-4 py-3.5 rounded-xl text-sm font-semibold outline-none transition-all focus:ring-1 focus:ring-[var(--border-active)] bg-[var(--bg-input)] border border-[var(--border-input)] text-[var(--text-primary)]"
                      placeholder="you@example.com"
                    />
                  </div>
                </div>

                {view !== 'reset' && (
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="block text-[11px] font-bold uppercase tracking-wider text-[var(--text-secondary)]">
                        Password
                      </label>
                      {view === 'signin' && (
                        <button 
                          type="button" 
                          onClick={() => { setView('reset'); setError(null); }}
                          className="text-[11px] font-bold text-[var(--text-accent)] hover:underline cursor-pointer"
                        >
                          Forgot password?
                        </button>
                      )}
                    </div>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                        <Lock size={16} className="text-[var(--text-secondary)] opacity-50" />
                      </div>
                      <input
                        type="password"
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full pl-11 pr-4 py-3.5 rounded-xl text-sm font-semibold outline-none transition-all focus:ring-1 focus:ring-[var(--border-active)] bg-[var(--bg-input)] border border-[var(--border-input)] text-[var(--text-primary)]"
                        placeholder="••••••••"
                      />
                    </div>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full mt-6 py-4 rounded-xl text-xs font-bold uppercase tracking-widest transition-all flex items-center justify-center gap-2 group"
                  style={{ 
                    background: 'var(--border-active)', 
                    color: 'var(--bg-app)', 
                    border: 'none', 
                    cursor: loading ? 'not-allowed' : 'pointer',
                    opacity: loading ? 0.7 : 1
                  }}
                >
                  {loading ? 'Processing...' : (view === 'signin' ? 'Sign In' : view === 'signup' ? 'Sign Up' : 'Send Reset Link')}
                  {!loading && <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />}
                </button>
              </form>

              {/* Social Logins (UI Only for now) */}
              {view !== 'reset' && (
                <div className="mt-8">
                  <div className="relative flex items-center py-2">
                    <div className="flex-grow border-t border-[var(--border-card)]"></div>
                    <span className="shrink-0 px-4 text-xs font-bold text-[var(--text-secondary)] bg-[var(--bg-app)]">OR</span>
                    <div className="flex-grow border-t border-[var(--border-card)]"></div>
                  </div>
                  
                  <div className="mt-6">
                    <button 
                      type="button"
                      className="w-full py-3.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-3 bg-[var(--bg-card)] border border-[var(--border-card)] hover:bg-[var(--bg-input)] text-[var(--text-dark)] cursor-pointer"
                      onClick={() => setError("Social login not configured yet.")}
                    >
                      Continue with Google
                    </button>
                  </div>
                </div>
              )}

              {/* View Toggles */}
              <div className="mt-10 text-center">
                {view === 'signin' ? (
                  <p className="text-xs text-[var(--text-secondary)] font-medium">
                    Don't have an account?{' '}
                    <button onClick={() => { setView('signup'); setError(null); }} className="font-bold text-[var(--text-accent)] hover:underline cursor-pointer">
                      Sign up
                    </button>
                  </p>
                ) : view === 'signup' ? (
                  <p className="text-xs text-[var(--text-secondary)] font-medium">
                    Already have an account?{' '}
                    <button onClick={() => { setView('signin'); setError(null); }} className="font-bold text-[var(--text-accent)] hover:underline cursor-pointer">
                      Sign in
                    </button>
                  </p>
                ) : (
                  <button onClick={() => { setView('signin'); setError(null); }} className="text-xs font-bold text-[var(--text-secondary)] hover:text-[var(--text-accent)] transition-colors cursor-pointer flex items-center justify-center gap-2 mx-auto">
                    <ArrowRight size={14} className="rotate-180" /> Back to sign in
                  </button>
                )}
              </div>
            </motion.div>
          </AnimatePresence>

        </div>
        
        {/* Demo Button fixed at bottom right */}
        {onLoadDemo && (
          <div className="absolute bottom-6 right-6">
            <button
              onClick={onLoadDemo}
              className="text-[10px] font-bold uppercase tracking-wider transition-all px-4 py-2 rounded-lg border border-[var(--border-card)] text-[var(--text-secondary)] hover:border-[var(--border-active)] hover:text-[var(--text-accent)] bg-[var(--bg-card)] cursor-pointer shadow-lg"
            >
              View Live Demo
            </button>
          </div>
        )}
      </div>
      
    </div>
  );
}
