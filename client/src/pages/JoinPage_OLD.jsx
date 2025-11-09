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
        // Show brief welcome back message
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
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-72 h-72 bg-gold-500/5 rounded-full blur-3xl animate-float"></div>
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-gold-600/5 rounded-full blur-3xl animate-float" style={{animationDelay: '1s'}}></div>
        <div className="absolute top-1/2 left-1/2 w-80 h-80 bg-gold-400/5 rounded-full blur-3xl animate-float" style={{animationDelay: '2s'}}></div>
      </div>

      <div className="w-full max-w-2xl relative z-10">
        {/* Logo/Title */}
        <div className="text-center mb-12 animate-fade-in">
          <div className="mb-8 relative">
            <div className="inline-block p-8 glass-card shadow-gold-glow animate-pulse-slow">
              <span className="text-7xl md:text-8xl drop-shadow-2xl">{GAME_CONFIG.logoEmoji}</span>
            </div>
            {/* Floating elements with gold theme */}
            <div className="absolute -top-6 -left-6 text-4xl animate-float opacity-80" style={{animationDelay: '0s'}}>�</div>
            <div className="absolute -top-6 -right-6 text-4xl animate-float opacity-80" style={{animationDelay: '0.5s'}}>�</div>
            <div className="absolute -bottom-6 left-1/4 text-4xl animate-float opacity-80" style={{animationDelay: '1s'}}>🏆</div>
          </div>
          
          <h1 className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-bold mb-6 text-gradient-gold font-display leading-tight tracking-tight">
            {GAME_CONFIG.gameName}
          </h1>
          <p className="text-xl sm:text-2xl md:text-3xl text-slate-300 font-light mb-6 font-display">
            {GAME_CONFIG.gameTagline}
          </p>
          
          {GAME_CONFIG.eventInfo.enabled && (
            <div className="inline-block glass-card border-gold-500/30 shadow-gold px-8 py-3 mb-8">
              <p className="text-base md:text-lg font-semibold text-gold-300">
                ✨ {GAME_CONFIG.eventInfo.eventName} • {GAME_CONFIG.eventInfo.eventDate}
              </p>
            </div>
          )}
        </div>

        {/* Join Form */}
        <div className="glass-card shadow-gold-lg p-8 md:p-10 shimmer">
          <form onSubmit={handleJoin} className="space-y-8">
            {/* Starting Capital Display */}
            <div className="glass-card bg-emerald-950/20 border-emerald-500/30 p-8 text-center shadow-lg">
              <p className="text-sm font-bold text-emerald-300 uppercase tracking-wider mb-3 flex items-center justify-center gap-2">
                <span className="text-xl"></span> Your Starting Capital
              </p>
              <p className="text-4xl sm:text-5xl md:text-6xl font-bold text-gradient-gold font-display">
                {formatCurrency(GAME_CONFIG.defaultStartingCredit)}
              </p>
            </div>

            <div>
              <label htmlFor="name" className="block text-base font-bold text-slate-200 mb-4 uppercase tracking-wider font-display">
                Enter Your Name
              </label>
              <input
                type="text"
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your Name"
                className="input-gold text-xl"
                disabled={loading}
                maxLength={50}
                autoComplete="name"
              />
            </div>

            {error && (
              <div className="glass-card bg-red-950/30 border-red-500/50 text-red-300 px-6 py-4 text-base font-medium animate-shake">
                <span className="text-xl mr-2">⚠️</span> {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading || !name.trim()}
              className="btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed text-xl md:text-2xl py-5 font-bold uppercase tracking-wide"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-3">
                  <div className="spinner border-slate-900 border-t-slate-900 w-6 h-6"></div>
                  <span>Joining...</span>
                </span>
              ) : (
                <span className="flex items-center justify-center gap-3">
                  <span className="text-2xl">🚀</span>
                  <span>Join Live & Start Investing</span>
                </span>
              )}
            </button>
          </form>
          
          {/* Info Cards */}
          <div className="mt-8 grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="text-center p-5 glass-card border-blue-500/30 hover:border-blue-400/50 transition-all duration-300 hover:scale-105">
              <div className="text-3xl mb-2 animate-pulse-slow">⚡</div>
              <div className="text-sm font-bold text-slate-200 uppercase tracking-wide">Real-Time Updates</div>
            </div>
            <div className="text-center p-5 glass-card border-purple-500/30 hover:border-purple-400/50 transition-all duration-300 hover:scale-105">
              <div className="text-3xl mb-2 animate-pulse-slow" style={{animationDelay: '0.5s'}}>👥</div>
              <div className="text-sm font-bold text-slate-200 uppercase tracking-wide">Live Leaderboard</div>
            </div>
            <div className="text-center p-5 glass-card border-emerald-500/30 hover:border-emerald-400/50 transition-all duration-300 hover:scale-105">
              <div className="text-3xl mb-2 animate-pulse-slow" style={{animationDelay: '1s'}}>📱</div>
              <div className="text-sm font-bold text-slate-200 uppercase tracking-wide">Mobile Optimized</div>
            </div>
          </div>
        </div>

        {/* Admin Link */}
        <div className="text-center mt-10">
          <a
            href="/admin"
            className="text-base text-slate-400 hover:text-gold-400 transition-all duration-300 font-semibold inline-flex items-center gap-2 hover:gap-3 group"
          >
            <span className="text-xl group-hover:scale-110 transition-transform">🔐</span>
            <span className="uppercase tracking-wider">Admin Access</span>
          </a>
        </div>

        {/* Organization Footer */}
        {GAME_CONFIG.organizationInfo.enabled && (
          <div className="text-center mt-8 glass-card p-6 border-slate-700/50">
            <p className="text-slate-400 text-sm mb-2 font-semibold uppercase tracking-wider">Powered by</p>
            <p className="text-gold-400 text-xl md:text-2xl font-bold font-display">{GAME_CONFIG.organizationInfo.name}</p>
          </div>
        )}
      </div>
    </div>
  );
}
