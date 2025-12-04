import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api, formatCurrency } from '../utils/api';
import { GAME_CONFIG } from '../config';
import axios from 'axios';

// Use relative path in production (same domain), localhost in development
const isProduction = window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1';
const API_BASE = import.meta.env.VITE_API_URL || (isProduction ? window.location.origin : 'http://localhost:3001');

export default function LoginPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const navigate = useNavigate();

  // Auto-login if remembered
  useEffect(() => {
    const checkRemembered = async () => {
      const rememberedInvestorId = localStorage.getItem('rememberedInvestorId');
      const rememberedName = localStorage.getItem('rememberedName');

      if (rememberedInvestorId && rememberedName) {
        setLoading(true);
        api.getInvestor(rememberedInvestorId)
          .then(({ investor }) => {
            navigate(`/dashboard/${investor.id}`);
          })
          .catch(() => {
            localStorage.removeItem('rememberedInvestorId');
            localStorage.removeItem('rememberedName');
            setLoading(false);
          });
      }
    };

    checkRemembered();
  }, [navigate]);

  const handleLogin = async (e) => {
    e.preventDefault();

    if (!name.trim()) {
      setError('🚫 Enter your player name!');
      return;
    }

    if (!email.trim()) {
      setError('🚫 Enter your email address!');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // Proceed with investor login
      const { investor } = await api.findInvestor(email.trim(), name.trim());

      // Store investor info in localStorage for session management
      localStorage.setItem('investor', JSON.stringify(investor));

      // Remember me functionality
      if (rememberMe) {
        localStorage.setItem('rememberedInvestorId', investor.id);
        localStorage.setItem('rememberedName', investor.name);
      } else {
        localStorage.removeItem('rememberedInvestorId');
        localStorage.removeItem('rememberedName');
      }

      navigate(`/dashboard/${investor.id}`);
    } catch (err) {
      setError(err.response?.data?.error || '⚠️ Failed to join game');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
      {/* Animated Coin Rain Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 text-6xl opacity-20 bounce-game">🪙</div>
        <div className="absolute top-20 right-1/4 text-5xl opacity-15 bounce-game" style={{animationDelay: '0.5s'}}>💰</div>
        <div className="absolute bottom-1/4 left-1/3 text-7xl opacity-10 bounce-game" style={{animationDelay: '1s'}}>🎩</div>
        <div className="absolute top-1/3 right-1/3 text-4xl opacity-20 bounce-game" style={{animationDelay: '1.5s'}}>💵</div>
        <div className="absolute bottom-1/3 right-1/4 text-6xl opacity-15 bounce-game" style={{animationDelay: '2s'}}>🏆</div>
        <div className="absolute top-2/3 left-1/4 text-5xl opacity-10 bounce-game" style={{animationDelay: '2.5s'}}>🚀</div>
      </div>

      <div className="w-full max-w-2xl relative z-10">
        {/* Game Title - Arcade Style */}
        <div className="text-center mb-12 pop-in">
          {/* Super Playful Title */}
          <div className="mb-8">
            <h1 className="text-6xl sm:text-7xl md:text-8xl lg:text-9xl font-black mb-4 pixel-text"
                style={{
                  background: 'linear-gradient(to bottom, #fcd34d, #f59e0b, #d97706)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  filter: 'drop-shadow(4px 4px 0px rgba(120,53,15,0.8))',
                }}>
              {GAME_CONFIG.gameName}
            </h1>

            <div className="inline-block bg-gradient-to-r from-amber-400 to-yellow-500 px-8 py-3 border-4 border-amber-900 rounded-full shadow-[4px_4px_0px_0px_rgba(120,53,15,1)] mb-6">
              <p className="text-2xl sm:text-3xl md:text-4xl font-black text-amber-950 uppercase tracking-wider">
                People's Choice Award
              </p>
            </div>

            <p className="text-xl sm:text-2xl text-amber-200 font-bold mb-4">
              Vote for your favorite startup here
            </p>

            <p className="text-lg text-amber-300/90 max-w-xl mx-auto">
              Vote with your coins / compete with friends
            </p>
          </div>

          {/* Coin Counter Display */}
          <div className="flex justify-center gap-4 mb-8 flex-wrap">
            <div className="coin-display coin-flip">
              <span className="text-3xl">🪙</span>
              <span>{GAME_CONFIG.defaultStartingCredit}</span>
              <span className="text-sm">COINS/PLAYER</span>
            </div>
          </div>
        </div>

        {/* Game Start Form - Arcade Style */}
        <div className="game-card max-w-md mx-auto pop-in" style={{animationDelay: '0.2s'}}>
          <form onSubmit={handleLogin} className="space-y-6">
            {/* Fun Header */}
            <div className="text-center mb-6">
              <h2 className="text-3xl font-black text-amber-900 dark:text-amber-300 mb-2 uppercase tracking-wide">
                🎮 Enter Game
              </h2>
              <p className="text-sm text-amber-700 dark:text-amber-400 font-bold">
                Ready to vote for your favorite startup?
              </p>
            </div>

            {/* Error Message */}
            {error && (
              <div className="game-alert wiggle">
                <span className="text-xl mr-2">⚠️</span>
                {error}
              </div>
            )}

            {/* Input Fields - Game Style */}
            <div>
              <label className="block text-sm font-black text-amber-900 dark:text-amber-300 mb-2 uppercase tracking-wide">
                👤 Player Name
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-6 py-4 text-lg font-bold
                         bg-white dark:bg-amber-950/50
                         border-4 border-amber-900 dark:border-amber-600 rounded-2xl
                         focus:outline-none focus:ring-4 focus:ring-amber-400
                         text-amber-950 dark:text-amber-100
                         shadow-[4px_4px_0px_0px_rgba(120,53,15,0.6)] dark:shadow-[4px_4px_0px_0px_rgba(251,191,36,0.3)]
                         transition-all duration-200"
                placeholder="Your cool name..."
                disabled={loading}
              />
            </div>

            <div>
              <label className="block text-sm font-black text-amber-900 dark:text-amber-300 mb-2 uppercase tracking-wide">
                📧 Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-6 py-4 text-lg font-bold
                         bg-white dark:bg-amber-950/50
                         border-4 border-amber-900 dark:border-amber-600 rounded-2xl
                         focus:outline-none focus:ring-4 focus:ring-amber-400
                         text-amber-950 dark:text-amber-100
                         shadow-[4px_4px_0px_0px_rgba(120,53,15,0.6)] dark:shadow-[4px_4px_0px_0px_rgba(251,191,36,0.3)]
                         transition-all duration-200"
                placeholder="your@email.com"
                disabled={loading}
              />
            </div>

            {/* Remember Me */}
            <label className="flex items-center gap-3 cursor-pointer group">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="w-6 h-6 rounded border-4 border-amber-900 text-amber-600 focus:ring-4 focus:ring-amber-400"
                disabled={loading}
              />
              <span className="text-base font-bold text-amber-900 dark:text-amber-300 group-hover:text-amber-700 dark:group-hover:text-amber-200">
                💾 Remember me for next round!
              </span>
            </label>

            {/* Big Game Button */}
            <button
              type="submit"
              disabled={loading}
              className="btn-game w-full text-2xl disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-3">
                  <span className="animate-spin text-3xl">⚡</span>
                  Loading Game...
                </span>
              ) : (
                <span className="flex items-center justify-center gap-3">
                  START!
                  <span className="text-3xl">🚀</span>
                </span>
              )}
            </button>
          </form>

          {/* Event Info Badge */}
          {GAME_CONFIG.eventInfo.enabled && (
            <div className="mt-6 text-center">
              <div className="inline-flex items-center gap-2 px-6 py-3 bg-amber-900/20 dark:bg-amber-400/20 border-2 border-amber-900 dark:border-amber-400 rounded-full">
                <span className="text-2xl bounce-game">🎪</span>
                <div className="text-left">
                  <p className="text-xs font-bold text-amber-900 dark:text-amber-300 uppercase">Event</p>
                  <p className="text-sm font-black text-amber-950 dark:text-amber-200">
                    {GAME_CONFIG.eventInfo.eventName}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Bottom Decorations */}
        <div className="flex justify-center gap-8 mt-12 text-6xl opacity-30">
          <span className="bounce-game">💰</span>
          <span className="bounce-game" style={{animationDelay: '0.3s'}}>🪙</span>
          <span className="bounce-game" style={{animationDelay: '0.6s'}}>🏆</span>
          <span className="bounce-game" style={{animationDelay: '0.9s'}}>🎩</span>
        </div>
      </div>
    </div>
  );
}
