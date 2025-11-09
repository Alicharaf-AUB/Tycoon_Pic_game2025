import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api, formatCurrency } from '../utils/api';
import { GAME_CONFIG } from '../config';

export default function JoinPage() {
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleJoin = async (e) => {
    e.preventDefault();
    
    if (!name.trim()) {
      setError('Please enter your name');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const { investor, rejoined } = await api.join(name.trim());
      
      if (rejoined) {
        setError('');
      }
      
      navigate(`/game/${investor.id}`);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to join game');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 lg:p-8 relative overflow-hidden">
      {/* Ambient Background Effects */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 -left-48 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl animate-float"></div>
        <div className="absolute bottom-1/4 -right-48 w-96 h-96 bg-yellow-500/10 rounded-full blur-3xl animate-float" style={{animationDelay: '1.5s'}}></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-radial from-amber-500/5 to-transparent rounded-full blur-2xl"></div>
      </div>

      <div className="w-full max-w-3xl relative z-10 animate-fade-in">
        {/* Elegant Logo Section */}
        <div className="text-center mb-12">
          {/* Decorative Line */}
          <div className="flex items-center justify-center mb-8">
            <div className="h-px w-24 bg-gradient-to-r from-transparent via-amber-500/50 to-transparent"></div>
            <div className="mx-4 text-4xl animate-pulse-glow">💎</div>
            <div className="h-px w-24 bg-gradient-to-r from-transparent via-amber-500/50 to-transparent"></div>
          </div>
          
          {/* Main Logo */}
          <div className="mb-8 relative inline-block">
            <div className="absolute inset-0 bg-gradient-to-r from-amber-500/20 to-yellow-500/20 blur-3xl rounded-full"></div>
            <div className="relative bg-gradient-to-br from-slate-900 to-slate-800 border-2 border-amber-500/30 rounded-3xl p-10 shadow-2xl shadow-amber-500/20">
              <span className="text-7xl md:text-8xl animate-float" style={{display: 'inline-block'}}>{GAME_CONFIG.logoEmoji}</span>
            </div>
          </div>
          
          {/* Elegant Title */}
          <h1 className="text-5xl sm:text-6xl md:text-7xl font-display font-bold mb-6 leading-tight">
            <span className="text-gradient-gold">
              {GAME_CONFIG.gameName}
            </span>
          </h1>
          
          <p className="text-xl sm:text-2xl md:text-3xl text-slate-300 font-serif italic mb-6 font-light">
            {GAME_CONFIG.gameTagline}
          </p>
          
          {/* Event Badge */}
          {GAME_CONFIG.eventInfo.enabled && (
            <div className="inline-flex items-center gap-3 bg-gradient-to-r from-slate-900/80 to-slate-800/80 backdrop-blur-xl border border-amber-500/30 rounded-full px-8 py-4 mb-8 shadow-xl">
              <div className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></div>
              <p className="text-sm md:text-base font-semibold text-slate-200">
                {GAME_CONFIG.eventInfo.eventName}
              </p>
              <div className="h-6 w-px bg-amber-500/30"></div>
              <p className="text-sm md:text-base text-slate-400">
                {GAME_CONFIG.eventInfo.eventDate}
              </p>
            </div>
          )}
          
          {/* Decorative Line */}
          <div className="h-px bg-gradient-to-r from-transparent via-amber-500/30 to-transparent max-w-md mx-auto"></div>
        </div>

        {/* Elite Join Form */}
        <div className="card-premium shadow-elite-lg mb-8">
          <form onSubmit={handleJoin} className="space-y-8">
            {/* Starting Capital Display */}
            <div className="relative bg-gradient-to-br from-slate-950/50 to-slate-900/50 backdrop-blur-xl border-2 border-amber-500/30 rounded-2xl p-8 text-center overflow-hidden shadow-inner">
              <div className="absolute inset-0 bg-gradient-radial from-amber-500/5 to-transparent"></div>
              <div className="relative z-10">
                <p className="text-sm font-bold text-amber-400 uppercase tracking-widest mb-3 flex items-center justify-center gap-2">
                  <span className="inline-block w-8 h-px bg-gradient-to-r from-transparent to-amber-500/50"></span>
                  <span>Your Investment Capital</span>
                  <span className="inline-block w-8 h-px bg-gradient-to-l from-transparent to-amber-500/50"></span>
                </p>
                <p className="text-5xl sm:text-6xl md:text-7xl font-display font-bold text-gradient-gold mb-2">
                  {formatCurrency(GAME_CONFIG.defaultStartingCredit)}
                </p>
                <p className="text-sm text-slate-400 font-medium">Ready to be deployed</p>
              </div>
            </div>

            {/* Name Input */}
            <div>
              <label htmlFor="name" className="block text-sm font-bold text-slate-300 mb-4 uppercase tracking-widest">
                Enter Your Full Name
              </label>
              <input
                type="text"
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="John Smith"
                className="input text-lg"
                disabled={loading}
                maxLength={50}
                autoComplete="name"
              />
            </div>

            {error && (
              <div className="bg-rose-500/10 border-2 border-rose-500/30 backdrop-blur-xl text-rose-300 px-6 py-4 rounded-xl text-sm font-medium animate-fade-in shadow-lg">
                <div className="flex items-center gap-3">
                  <span className="text-xl">⚠</span>
                  <span>{error}</span>
                </div>
              </div>
            )}

            {/* Elite Submit Button */}
            <button
              type="submit"
              disabled={loading || !name.trim()}
              className="btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed text-xl py-6 font-bold relative overflow-hidden group"
            >
              <span className="relative z-10 flex items-center justify-center gap-3">
                {loading ? (
                  <>
                    <div className="w-5 h-5 border-3 border-slate-900 border-t-transparent rounded-full animate-spin"></div>
                    <span>Authenticating...</span>
                  </>
                ) : (
                  <>
                    <span>Begin Investment</span>
                    <svg className="w-6 h-6 transition-transform group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                    </svg>
                  </>
                )}
              </span>
            </button>
          </form>
          
          {/* Trust Indicators */}
          <div className="mt-10 pt-8 border-t border-slate-700/50">
            <div className="grid grid-cols-3 gap-6">
              <div className="text-center group">
                <div className="w-14 h-14 mx-auto mb-3 bg-gradient-to-br from-blue-500/20 to-blue-600/20 backdrop-blur-xl rounded-2xl flex items-center justify-center border border-blue-500/30 shadow-lg group-hover:scale-110 transition-transform">
                  <svg className="w-7 h-7 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wide">Real-Time</p>
              </div>
              <div className="text-center group">
                <div className="w-14 h-14 mx-auto mb-3 bg-gradient-to-br from-emerald-500/20 to-emerald-600/20 backdrop-blur-xl rounded-2xl flex items-center justify-center border border-emerald-500/30 shadow-lg group-hover:scale-110 transition-transform">
                  <svg className="w-7 h-7 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                </div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wide">Secure</p>
              </div>
              <div className="text-center group">
                <div className="w-14 h-14 mx-auto mb-3 bg-gradient-to-br from-purple-500/20 to-purple-600/20 backdrop-blur-xl rounded-2xl flex items-center justify-center border border-purple-500/30 shadow-lg group-hover:scale-110 transition-transform">
                  <svg className="w-7 h-7 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                  </svg>
                </div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wide">Mobile Ready</p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Links */}
        <div className="text-center space-y-4">
          <a
            href="/admin"
            className="inline-flex items-center gap-2 text-sm text-slate-400 hover:text-amber-400 transition-colors font-medium group"
          >
            <svg className="w-4 h-4 group-hover:rotate-12 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
            <span>Admin Portal</span>
          </a>
          
          {GAME_CONFIG.organizationInfo.enabled && (
            <p className="text-xs text-slate-500 font-medium">
              Powered by {GAME_CONFIG.organizationInfo.name}
            </p>
          )}
          
          {/* Decorative Bottom Line */}
          <div className="pt-6">
            <div className="h-px bg-gradient-to-r from-transparent via-amber-500/20 to-transparent max-w-xs mx-auto"></div>
          </div>
        </div>
      </div>
    </div>
  );
}
