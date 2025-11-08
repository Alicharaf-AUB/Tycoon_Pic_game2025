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
    <div className="min-h-screen flex items-center justify-center p-4 lg:p-8">
      <div className="w-full max-w-2xl">
        {/* Logo/Title */}
        <div className="text-center mb-8 animate-fade-in">
          <div className="mb-6 relative">
            <div className="inline-block p-6 bg-gradient-to-br from-gold-400 to-primary-500 rounded-3xl shadow-gold-lg animate-pulse-slow">
              <span className="text-6xl md:text-7xl">{GAME_CONFIG.logoEmoji}</span>
            </div>
            {/* Floating money emojis */}
            <div className="absolute -top-4 -left-4 text-3xl animate-bounce" style={{animationDelay: '0s'}}>💵</div>
            <div className="absolute -top-4 -right-4 text-3xl animate-bounce" style={{animationDelay: '0.5s'}}>💎</div>
            <div className="absolute -bottom-4 left-1/4 text-3xl animate-bounce" style={{animationDelay: '1s'}}>🏆</div>
          </div>
          
          <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold mb-4 text-gradient-gold font-display leading-tight">
            {GAME_CONFIG.gameName}
          </h1>
          <p className="text-lg sm:text-xl md:text-2xl text-gray-600 font-medium mb-4">
            {GAME_CONFIG.gameTagline}
          </p>
          
          {GAME_CONFIG.eventInfo.enabled && (
            <div className="inline-block bg-gradient-to-r from-gold-100 to-amber-100 border-2 border-gold-300 rounded-full px-6 py-2 mb-6">
              <p className="text-sm md:text-base font-bold text-gray-800">
                🎪 {GAME_CONFIG.eventInfo.eventName} • {GAME_CONFIG.eventInfo.eventDate}
              </p>
            </div>
          )}
        </div>

        {/* Join Form */}
        <div className="card-premium shadow-2xl">
          <form onSubmit={handleJoin} className="space-y-6">
            {/* Starting Capital Display */}
            <div className="bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-300 rounded-xl p-6 text-center">
              <p className="text-sm font-bold text-green-700 uppercase tracking-wide mb-2">
                💰 Your Starting Capital
              </p>
              <p className="text-3xl sm:text-4xl md:text-5xl font-bold text-gradient-gold">
                {formatCurrency(GAME_CONFIG.defaultStartingCredit)}
              </p>
            </div>

            <div>
              <label htmlFor="name" className="block text-sm font-bold text-gray-700 mb-3 uppercase tracking-wide">
                Enter Your Name
              </label>
              <input
                type="text"
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your Name"
                className="input text-lg"
                disabled={loading}
                maxLength={50}
                autoComplete="name"
              />
            </div>

            {error && (
              <div className="bg-red-50 border-2 border-red-300 text-red-800 px-4 py-3 rounded-lg text-sm font-medium animate-shake">
                ⚠️ {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading || !name.trim()}
              className="btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed text-xl py-4 transform transition-all hover:scale-105"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="animate-spin">⏳</span> Joining...
                </span>
              ) : (
                <span className="flex items-center justify-center gap-2">
                  🎯 Join Live & Start Investing
                </span>
              )}
            </button>
          </form>
          
          {/* Info Cards */}
          <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="text-center p-3 bg-blue-50 rounded-lg border border-blue-200">
              <div className="text-2xl mb-1">⚡</div>
              <div className="text-xs font-bold text-gray-700">Real-Time Updates</div>
            </div>
            <div className="text-center p-3 bg-purple-50 rounded-lg border border-purple-200">
              <div className="text-2xl mb-1">👥</div>
              <div className="text-xs font-bold text-gray-700">Live Leaderboard</div>
            </div>
            <div className="text-center p-3 bg-green-50 rounded-lg border border-green-200">
              <div className="text-2xl mb-1">📱</div>
              <div className="text-xs font-bold text-gray-700">Mobile Optimized</div>
            </div>
          </div>
        </div>

        {/* Admin Link */}
        <div className="text-center mt-8">
          <a
            href="/admin"
            className="text-sm text-gray-500 hover:text-gold-600 transition-colors font-medium inline-flex items-center gap-2"
          >
            🔐 Admin Access
          </a>
        </div>

        {/* Organization Footer */}
        <div className="text-center mt-8 text-xs text-gray-500">
          <p>Powered by {GAME_CONFIG.organizationName}</p>
        </div>
      </div>
    </div>
  );
}
