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
    <div className="min-h-screen flex items-center justify-center p-6 bg-gradient-to-br from-[#252943] via-[#252943] to-[#1a1d33]">
      <div className="w-full max-w-lg">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-[#33A4FA]/10 border border-[#33A4FA]/30 mb-6">
            <span className="text-5xl">{GAME_CONFIG.logoEmoji}</span>
          </div>
          
          <h1 className="text-5xl font-bold mb-4 text-white tracking-tight">
            {GAME_CONFIG.gameName}
          </h1>
          <p className="text-xl text-[#DEE0ED] font-medium">
            {GAME_CONFIG.gameTagline}
          </p>
          
          {GAME_CONFIG.eventInfo.enabled && (
            <div className="mt-6 inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#33A4FA]/10 border border-[#33A4FA]/30">
              <span className="text-sm text-[#93AEFB] font-medium">
                {GAME_CONFIG.eventInfo.eventName} • {GAME_CONFIG.eventInfo.eventDate}
              </span>
            </div>
          )}
        </div>

        {/* Join Form */}
        <div className="fintech-card p-8">
          <form onSubmit={handleJoin} className="space-y-6">
            {/* Starting Capital Display */}
            <div className="bg-[#E3FF3B]/5 border border-[#E3FF3B]/30 rounded-xl p-6 text-center">
              <p className="text-xs text-[#E3FF3B] uppercase tracking-wider mb-2 font-semibold">
                Starting Capital
              </p>
              <p className="text-4xl font-bold text-white">
                {formatCurrency(GAME_CONFIG.defaultStartingCredit)}
              </p>
            </div>

            <div>
              <label htmlFor="name" className="block text-sm font-semibold text-[#DEE0ED] mb-3">
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
              <div className="bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-3 rounded-xl text-sm font-medium">
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
                  <div className="spinner border-white border-t-white"></div>
                  <span>Joining...</span>
                </span>
              ) : (
                'Join & Start Investing'
              )}
            </button>
          </form>
          
          {/* Info Grid */}
          <div className="mt-8 grid grid-cols-3 gap-3">
            <div className="text-center p-4 rounded-xl bg-[#33A4FA]/5 border border-[#33A4FA]/10">
              <div className="text-2xl mb-1">⚡</div>
              <div className="text-xs text-[#93AEFB] font-medium">Real-Time</div>
            </div>
            <div className="text-center p-4 rounded-xl bg-[#33A4FA]/5 border border-[#33A4FA]/10">
              <div className="text-2xl mb-1">👥</div>
              <div className="text-xs text-[#93AEFB] font-medium">Live Board</div>
            </div>
            <div className="text-center p-4 rounded-xl bg-[#33A4FA]/5 border border-[#33A4FA]/10">
              <div className="text-2xl mb-1">📱</div>
              <div className="text-xs text-[#93AEFB] font-medium">Mobile Ready</div>
            </div>
          </div>
        </div>

        {/* Admin Link */}
        <div className="text-center mt-6">
          <a
            href="/admin"
            className="text-sm text-[#93AEFB] hover:text-[#33A4FA] transition-colors font-medium"
          >
            Admin Access
          </a>
        </div>

        {/* Organization Footer */}
        {GAME_CONFIG.organizationInfo.enabled && (
          <div className="text-center mt-8 py-4 border-t border-[#DEE0ED]/10">
            <p className="text-xs text-[#DEE0ED]/40 mb-1">Powered by</p>
            <p className="text-sm text-[#DEE0ED] font-semibold">{GAME_CONFIG.organizationInfo.name}</p>
          </div>
        )}
      </div>
    </div>
  );
}
