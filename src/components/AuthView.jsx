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
    <div className="min-h-screen w-full flex items-center justify-center p-4" style={{ background: '#f0f4f9', fontFamily: "'Inter', sans-serif" }}>
      <div className="w-full max-w-[448px] bg-white rounded-3xl p-10" style={{ boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05), 0 2px 4px -1px rgba(0,0,0,0.03)' }}>
        
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 2L3 7V12.5C3 16.5 6.5 21 12 22C17.5 21 21 16.5 21 12.5V7L12 2Z" fill="#1a73e8" />
              <path d="M12 22C17.5 21 21 16.5 21 12.5V7L12 2L12 22Z" fill="#174ea6" />
            </svg>
          </div>
          <h1 className="text-2xl font-normal mb-2" style={{ color: '#202124' }}>
            {isLogin ? 'Sign in' : 'Create account'}
          </h1>
          <p className="text-base" style={{ color: '#5f6368' }}>
            to continue to TradeOS
          </p>
        </div>

        {error && (
          <div className="mb-6 p-3 rounded bg-red-50 text-red-700 text-sm border border-red-200">
            {error}
          </div>
        )}

        {message && (
          <div className="mb-6 p-3 rounded bg-green-50 text-green-700 text-sm border border-green-200">
            {message}
          </div>
        )}

        <form onSubmit={handleAuth} className="space-y-4">
          <div>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3.5 rounded border outline-none transition-colors"
              style={{ borderColor: '#dadce0', color: '#202124', fontSize: '16px' }}
              placeholder="Email or phone"
              onFocus={(e) => e.target.style.borderColor = '#1a73e8'}
              onBlur={(e) => e.target.style.borderColor = '#dadce0'}
            />
          </div>

          <div>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3.5 rounded border outline-none transition-colors"
              style={{ borderColor: '#dadce0', color: '#202124', fontSize: '16px' }}
              placeholder="Enter your password"
              onFocus={(e) => e.target.style.borderColor = '#1a73e8'}
              onBlur={(e) => e.target.style.borderColor = '#dadce0'}
            />
          </div>

          <div className="flex items-center justify-between pt-8 mt-4">
            <button
              type="button"
              onClick={() => { setIsLogin(!isLogin); setError(null); setMessage(null); }}
              className="text-sm font-medium hover:bg-gray-50 px-3 py-2 rounded transition-colors"
              style={{ color: '#1a73e8' }}
            >
              {isLogin ? 'Create account' : 'Sign in instead'}
            </button>

            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2 rounded shadow-sm text-sm font-medium transition-colors"
              style={{ 
                background: '#1a73e8', 
                color: '#fff', 
                opacity: loading ? 0.7 : 1,
                cursor: loading ? 'not-allowed' : 'pointer'
              }}
              onMouseEnter={e => { if(!loading) e.currentTarget.style.background = '#1b66c9'; }}
              onMouseLeave={e => { if(!loading) e.currentTarget.style.background = '#1a73e8'; }}
            >
              {loading ? 'Working...' : 'Next'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
