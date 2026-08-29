import { useState } from 'react';
import { supabase } from '../utils/supabaseClient';
import { motion, AnimatePresence } from 'framer-motion';
import { Activity, Mail, Lock, ArrowRight } from 'lucide-react';

export default function AuthView() {
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
    initial: { opacity: 0, y: 10 },
    in: { opacity: 1, y: 0 },
    out: { opacity: 0, y: -10 },
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-6 bg-[var(--bg-app)] text-[var(--text-primary)] relative" style={{ fontFamily: "'Inter', sans-serif" }}>
      
      {/* Subtle background element */}
      <div className="absolute inset-0 pointer-events-none opacity-[0.03]" 
           style={{ 
             backgroundImage: `linear-gradient(var(--text-primary) 1px, transparent 1px), linear-gradient(90deg, var(--text-primary) 1px, transparent 1px)`,
             backgroundSize: '40px 40px',
             maskImage: 'radial-gradient(ellipse at center, black, transparent 70%)',
             WebkitMaskImage: 'radial-gradient(ellipse at center, black, transparent 70%)'
           }} 
      />

      <div className="w-full max-w-[480px] z-10">
        
        {/* Logo */}
        <div className="flex items-center gap-4 mb-12 justify-center">
          <div className="w-12 h-12 rounded-xl bg-[var(--border-active)] flex items-center justify-center text-[var(--bg-app)] shadow-[0_0_20px_var(--border-active)]">
            <Activity size={24} strokeWidth={3} />
          </div>
          <span className="text-3xl font-black tracking-tight text-[var(--text-dark)]">TradeOS</span>
        </div>

        <div className="glass-panel p-8 sm:p-10 rounded-2xl shadow-2xl border border-[var(--border-card)]" style={{ background: 'var(--bg-card)' }}>
          <AnimatePresence mode="wait">
            <motion.div
              key={view}
              initial="initial"
              animate="in"
              exit="out"
              variants={variants}
              transition={{ duration: 0.2 }}
            >
              <div className="mb-10 text-center">
                <h1 className="text-3xl font-bold tracking-tight text-[var(--text-dark)] mb-3">
                  {view === 'signin' ? 'Welcome back' : view === 'signup' ? 'Create an account' : 'Reset password'}
                </h1>
                <p className="text-base text-[var(--text-secondary)]">
                  {view === 'signin' ? 'Enter your credentials to access your dashboard.' : 
                   view === 'signup' ? 'Start tracking your edge today.' : 
                   'Enter your email and we will send you a reset link.'}
                </p>
              </div>

              {error && (
                <div className={`mb-8 p-5 rounded-xl text-sm font-bold border ${error.includes('Check your email') ? 'bg-[var(--bg-badge-profit)] text-[var(--color-profit)] border-[var(--border-profit)]' : 'bg-[var(--bg-badge-loss)] text-[var(--color-loss)] border-[var(--border-loss)]'}`}>
                  {error}
                </div>
              )}

              <form onSubmit={handleAuth} className="space-y-6">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)] mb-2.5">
                    Email Address
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none">
                      <Mail size={18} className="text-[var(--text-secondary)] opacity-50" />
                    </div>
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full pl-14 pr-5 py-4 rounded-xl text-base font-semibold outline-none transition-all focus:ring-2 focus:ring-[var(--border-active)] bg-[var(--bg-input)] border border-[var(--border-input)] text-[var(--text-primary)]"
                      placeholder="you@example.com"
                    />
                  </div>
                </div>

                {view !== 'reset' && (
                  <div>
                    <div className="flex items-center justify-between mb-2.5">
                      <label className="block text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)]">
                        Password
                      </label>
                      {view === 'signin' && (
                        <button 
                          type="button" 
                          onClick={() => { setView('reset'); setError(null); }}
                          className="text-xs font-bold text-[var(--text-accent)] hover:underline cursor-pointer"
                        >
                          Forgot password?
                        </button>
                      )}
                    </div>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none">
                        <Lock size={18} className="text-[var(--text-secondary)] opacity-50" />
                      </div>
                      <input
                        type="password"
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full pl-14 pr-5 py-4 rounded-xl text-base font-semibold outline-none transition-all focus:ring-2 focus:ring-[var(--border-active)] bg-[var(--bg-input)] border border-[var(--border-input)] text-[var(--text-primary)]"
                        placeholder="••••••••"
                      />
                    </div>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full mt-8 py-4 rounded-xl text-sm font-bold uppercase tracking-widest transition-all flex items-center justify-center gap-3 group"
                  style={{ 
                    background: 'var(--border-active)', 
                    color: 'var(--bg-app)', 
                    border: 'none', 
                    cursor: loading ? 'not-allowed' : 'pointer',
                    opacity: loading ? 0.7 : 1
                  }}
                >
                  {loading ? 'Processing...' : (view === 'signin' ? 'Sign In' : view === 'signup' ? 'Sign Up' : 'Send Reset Link')}
                  {!loading && <ArrowRight size={16} className="group-hover:translate-x-1.5 transition-transform" />}
                </button>
              </form>

              {/* Social Logins (UI Only for now) */}
              {view !== 'reset' && (
                <div className="mt-8">
                  <div className="relative flex items-center py-4">
                    <div className="flex-grow border-t border-[var(--border-card)]"></div>
                    <span className="shrink-0 px-5 text-sm font-bold text-[var(--text-secondary)]" style={{ background: 'var(--bg-card)' }}>OR</span>
                    <div className="flex-grow border-t border-[var(--border-card)]"></div>
                  </div>
                  
                  <div className="mt-4">
                    <button 
                      type="button"
                      className="w-full py-4 rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-3 bg-[var(--bg-input)] border border-[var(--border-card)] hover:bg-[var(--border-card)] text-[var(--text-dark)] cursor-pointer"
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
                  <p className="text-sm text-[var(--text-secondary)] font-medium">
                    Don't have an account?{' '}
                    <button onClick={() => { setView('signup'); setError(null); }} className="font-bold text-[var(--text-accent)] hover:underline cursor-pointer">
                      Sign up
                    </button>
                  </p>
                ) : view === 'signup' ? (
                  <p className="text-sm text-[var(--text-secondary)] font-medium">
                    Already have an account?{' '}
                    <button onClick={() => { setView('signin'); setError(null); }} className="font-bold text-[var(--text-accent)] hover:underline cursor-pointer">
                      Sign in
                    </button>
                  </p>
                ) : (
                  <button onClick={() => { setView('signin'); setError(null); }} className="text-sm font-bold text-[var(--text-secondary)] hover:text-[var(--text-accent)] transition-colors cursor-pointer flex items-center justify-center gap-2 mx-auto">
                    <ArrowRight size={16} className="rotate-180" /> Back to sign in
                  </button>
                )}
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
