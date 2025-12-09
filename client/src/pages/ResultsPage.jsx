import { useEffect, useState } from 'react';
import { useSocket } from '../context/SocketContext';
import { GAME_CONFIG } from '../config';
import { getFileUrl } from '../utils/api';

export default function ResultsPage() {
  const { gameState, isConnected } = useSocket();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (gameState) {
      setLoading(false);
    }
  }, [gameState]);

  const startups = gameState?.startups?.filter(s => s.is_active) || [];
  const allInvestments = gameState?.investments || [];

  // Calculate total coins per startup (LIVE!)
  const getTotalCoinsForStartup = (startupId) => {
    return allInvestments
      .filter(inv => inv.startup_id === startupId)
      .reduce((sum, inv) => sum + parseFloat(inv.amount || 0), 0);
  };

  // Get top 3 startups (LIVE!)
  const getTop3Startups = () => {
    const startupsWithCoins = startups.map(s => ({
      ...s,
      totalCoins: getTotalCoinsForStartup(s.id)
    }));
    return startupsWithCoins
      .sort((a, b) => b.totalCoins - a.totalCoins)
      .slice(0, 3);
  };

  const top3 = getTop3Startups();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4 animate-bounce">🏆</div>
          <p className="text-2xl font-black text-amber-300">LOADING RESULTS...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-8">
      {/* Header */}
      <div className="bg-gradient-to-r from-amber-950/95 via-yellow-950/95 to-amber-950/95 backdrop-blur-xl border-b-4 border-amber-900 shadow-[0_4px_0_0_rgba(120,53,15,1)]">
        <div className="max-w-7xl mx-auto px-3 sm:px-6">
          <div className="py-8 text-center">
            <div className="flex items-center justify-center gap-3 mb-4">
              <span className="text-5xl">🏆</span>
              <h1 className="text-4xl sm:text-6xl font-black text-amber-300 uppercase tracking-wider">
                Live Results
              </h1>
              <span className="text-5xl">🏆</span>
            </div>
            <p className="text-lg sm:text-xl font-bold text-amber-200">
              {GAME_CONFIG.eventName}
            </p>
            <p className="text-sm text-amber-400 mt-2">Rankings update automatically as votes come in!</p>
            {isConnected ? (
              <div className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-green-900/50 border-2 border-green-600 rounded-full">
                <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
                <span className="text-sm font-black text-green-300 uppercase">🔴 Live</span>
              </div>
            ) : (
              <div className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-red-900/50 border-2 border-red-600 rounded-full">
                <span className="w-2 h-2 bg-red-400 rounded-full"></span>
                <span className="text-sm font-black text-red-300 uppercase">Reconnecting...</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-3 sm:px-6 py-8">
        {/* Announcement */}
        <div className="game-card text-center py-16">
          <div className="text-8xl mb-6 animate-bounce">🏆</div>
          <h2 className="text-4xl sm:text-5xl font-black text-amber-900 dark:text-amber-200 mb-4 uppercase">
            Results Coming Soon!
          </h2>
          <p className="text-xl sm:text-2xl text-amber-700 dark:text-amber-400 font-bold mb-6">
            Thank you for participating in {GAME_CONFIG.eventName}
          </p>
          <p className="text-lg text-amber-600 dark:text-amber-500">
            Winners will be announced shortly. Stay tuned! 🎉
          </p>
        </div>
      </div>
    </div>
  );
}
