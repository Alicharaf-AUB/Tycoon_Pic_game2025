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
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="w-full max-w-lg">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gold-500/10 border border-gold-500/20 mb-6">
            <span className="text-4xl">{GAME_CONFIG.logoEmoji}</span>
          </div>
          
          <h1 className="text-4xl font-bold mb-3 text-slate-50 tracking-tight">
            {GAME_CONFIG.gameName}
          </h1>
          <p className="text-lg text-slate-400 font-medium">
            {GAME_CONFIG.gameTagline}
          </p>
          
          {GAME_CONFIG.eventInfo.enabled && (
            <div className="mt-6 inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-800/50 border border-slate-700">
              <span className="text-sm text-slate-300 font-medium">
                {GAME_CONFIG.eventInfo.eventName} • {GAME_CONFIG.eventInfo.eventDate}
              </span>
            </div>
          )}
        </div>

        {/* Join Form */}
        <div className="fintech-card p-8">
          <form onSubmit={handleJoin} className="space-y-6">
            {/* Starting Capital Display */}
            <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-lg p-6 text-center">
              <p className="text-xs text-emerald-400 uppercase tracking-wider mb-2 font-semibold">
                Starting Capital
              </p>
              <p className="text-3xl font-bold text-slate-50">
                {formatCurrency(GAME_CONFIG.defaultStartingCredit)}
              </p>
            </div>

            <div>
              <label htmlFor="name" className="block text-sm font-semibold text-slate-300 mb-2">
                Your Name
              </label>
              <input
                type="text"
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter your name"
                className="input"
                disabled={loading}
                maxLength={50}
                autoComplete="name"
              />
            </div>

            {error && (
              <div className="bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-3 rounded-lg text-sm font-medium">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading || !name.trim()}
              className="btn-primary w-full text-base font-semibold"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <div className="spinner border-slate-900 border-t-slate-900"></div>
                  <span>Joining...</span>
                </span>
              ) : (
                'Join & Start Investing'
              )}
            </button>
          </form>
          
          {/* Info Grid */}
          <div className="mt-8 grid grid-cols-3 gap-3">
            <div className="text-center p-3 rounded-lg bg-slate-800/50">
              <div className="text-xl mb-1">⚡</div>
              <div className="text-xs text-slate-400 font-medium">Real-Time</div>
            </div>
            <div className="text-center p-3 rounded-lg bg-slate-800/50">
              <div className="text-xl mb-1">👥</div>
              <div className="text-xs text-slate-400 font-medium">Live Board</div>
            </div>
            <div className="text-center p-3 rounded-lg bg-slate-800/50">
              <div className="text-xl mb-1">📱</div>
              <div className="text-xs text-slate-400 font-medium">Mobile Ready</div>
            </div>
          </div>
        </div>

        {/* Admin Link */}
        <div className="text-center mt-6">
          <a
            href="/admin"
            className="text-sm text-slate-500 hover:text-slate-400 transition-colors font-medium"
          >
            Admin Access
          </a>
        </div>

        {/* Organization Footer */}
        {GAME_CONFIG.organizationInfo.enabled && (
          <div className="text-center mt-8 py-4 border-t border-slate-800">
            <p className="text-xs text-slate-500 mb-1">Powered by</p>
            <p className="text-sm text-slate-400 font-semibold">{GAME_CONFIG.organizationInfo.name}</p>
          </div>
        )}
      </div>
    </div>
  );
}
