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
        {/* Podium Section */}
        {top3.length === 0 ? (
          <div className="game-card text-center py-12">
            <p className="text-6xl mb-4">🗳️</p>
            <p className="text-3xl font-black text-amber-900 dark:text-amber-200 mb-2">
              No Votes Yet!
            </p>
            <p className="text-lg text-amber-700 dark:text-amber-400">
              Results will appear here as voting begins...
            </p>
          </div>
        ) : (
          <>
            {/* Top 3 Podium Display */}
            <div className="mb-12">
              {/* First Place - Center, Tallest */}
              {top3[0] && (
                <div className="flex justify-center mb-8">
                  <div className="w-full max-w-2xl">
                    <div className="game-card relative bg-gradient-to-br from-yellow-50 to-amber-100 dark:from-yellow-900/30 dark:to-amber-900/30 border-8 border-yellow-600 shadow-[0_8px_0_0_rgba(202,138,4,1)] pop-in">
                      {/* Trophy Badge */}
                      <div className="absolute -top-8 left-1/2 -translate-x-1/2">
                        <div className="w-20 h-20 bg-gradient-to-br from-yellow-300 to-yellow-500 rounded-full border-8 border-yellow-700 flex items-center justify-center text-5xl shadow-[0_6px_0_0_rgba(161,98,7,1)]">
                          🥇
                        </div>
                      </div>

                      <div className="pt-12">
                        {/* Startup Logo */}
                        {top3[0].logo && (
                          <div className="flex justify-center mb-4">
                            <img
                              src={getFileUrl(top3[0].logo)}
                              alt={top3[0].name}
                              className="w-24 h-24 object-contain rounded-2xl border-4 border-yellow-700 bg-white"
                            />
                          </div>
                        )}

                        {/* Startup Name */}
                        <h2 className="text-4xl sm:text-5xl font-black text-yellow-900 dark:text-yellow-100 text-center mb-4">
                          {top3[0].name}
                        </h2>

                        {/* Coin Count */}
                        <div className="flex justify-center mb-6">
                          <div className="bg-gradient-to-r from-yellow-400 to-amber-500 border-6 border-yellow-800 rounded-2xl px-8 py-4 shadow-[0_6px_0_0_rgba(146,64,14,1)]">
                            <div className="flex items-center gap-3">
                              <span className="text-4xl">🪙</span>
                              <div>
                                <p className="text-5xl font-black text-yellow-950">
                                  {top3[0].totalCoins}
                                </p>
                                <p className="text-sm font-black text-yellow-800 uppercase tracking-wider">
                                  {GAME_CONFIG.currencyName}
                                </p>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Description */}
                        {top3[0].description && (
                          <p className="text-center text-lg text-yellow-900 dark:text-yellow-200 font-bold max-w-xl mx-auto px-4">
                            {top3[0].description}
                          </p>
                        )}

                        {/* Tags */}
                        <div className="flex gap-2 flex-wrap justify-center mt-4">
                          {top3[0].industry && (
                            <span className="px-4 py-2 bg-yellow-200 dark:bg-yellow-800 border-2 border-yellow-900 rounded-lg text-sm font-black text-yellow-900 dark:text-yellow-100">
                              {top3[0].industry}
                            </span>
                          )}
                          {top3[0].cohort && (
                            <span className="px-4 py-2 bg-yellow-200 dark:bg-yellow-800 border-2 border-yellow-900 rounded-lg text-sm font-black text-yellow-900 dark:text-yellow-100">
                              {top3[0].cohort}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Second and Third Place - Side by Side */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Second Place */}
                {top3[1] && (
                  <div className="game-card relative bg-gradient-to-br from-gray-50 to-gray-200 dark:from-gray-800/30 dark:to-gray-700/30 border-6 border-gray-500 shadow-[0_6px_0_0_rgba(107,114,128,1)] pop-in" style={{animationDelay: '0.1s'}}>
                    {/* Silver Badge */}
                    <div className="absolute -top-6 left-1/2 -translate-x-1/2">
                      <div className="w-16 h-16 bg-gradient-to-br from-gray-300 to-gray-400 rounded-full border-6 border-gray-600 flex items-center justify-center text-4xl shadow-[0_4px_0_0_rgba(75,85,99,1)]">
                        🥈
                      </div>
                    </div>

                    <div className="pt-10">
                      {/* Startup Logo */}
                      {top3[1].logo && (
                        <div className="flex justify-center mb-3">
                          <img
                            src={getFileUrl(top3[1].logo)}
                            alt={top3[1].name}
                            className="w-16 h-16 object-contain rounded-xl border-3 border-gray-600 bg-white"
                          />
                        </div>
                      )}

                      {/* Startup Name */}
                      <h3 className="text-2xl sm:text-3xl font-black text-gray-800 dark:text-gray-100 text-center mb-3">
                        {top3[1].name}
                      </h3>

                      {/* Coin Count */}
                      <div className="flex justify-center mb-4">
                        <div className="bg-gradient-to-r from-gray-300 to-gray-400 border-4 border-gray-700 rounded-xl px-6 py-3 shadow-[0_4px_0_0_rgba(55,65,81,1)]">
                          <div className="flex items-center gap-2">
                            <span className="text-2xl">🪙</span>
                            <div>
                              <p className="text-3xl font-black text-gray-900">
                                {top3[1].totalCoins}
                              </p>
                              <p className="text-xs font-black text-gray-700 uppercase">
                                {GAME_CONFIG.currencyName}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Description */}
                      {top3[1].description && (
                        <p className="text-center text-sm text-gray-700 dark:text-gray-300 font-bold line-clamp-3 px-2">
                          {top3[1].description}
                        </p>
                      )}

                      {/* Tags */}
                      <div className="flex gap-2 flex-wrap justify-center mt-3">
                        {top3[1].industry && (
                          <span className="px-3 py-1 bg-gray-200 dark:bg-gray-700 border-2 border-gray-600 rounded-lg text-xs font-black text-gray-800 dark:text-gray-200">
                            {top3[1].industry}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* Third Place */}
                {top3[2] && (
                  <div className="game-card relative bg-gradient-to-br from-orange-50 to-orange-200 dark:from-orange-900/30 dark:to-orange-800/30 border-6 border-orange-600 shadow-[0_6px_0_0_rgba(194,65,12,1)] pop-in" style={{animationDelay: '0.2s'}}>
                    {/* Bronze Badge */}
                    <div className="absolute -top-6 left-1/2 -translate-x-1/2">
                      <div className="w-16 h-16 bg-gradient-to-br from-orange-400 to-orange-600 rounded-full border-6 border-orange-800 flex items-center justify-center text-4xl shadow-[0_4px_0_0_rgba(154,52,18,1)]">
                        🥉
                      </div>
                    </div>

                    <div className="pt-10">
                      {/* Startup Logo */}
                      {top3[2].logo && (
                        <div className="flex justify-center mb-3">
                          <img
                            src={getFileUrl(top3[2].logo)}
                            alt={top3[2].name}
                            className="w-16 h-16 object-contain rounded-xl border-3 border-bronze-600 bg-white"
                          />
                        </div>
                      )}

                      {/* Startup Name */}
                      <h3 className="text-2xl sm:text-3xl font-black text-orange-900 dark:text-orange-100 text-center mb-3">
                        {top3[2].name}
                      </h3>

                      {/* Coin Count */}
                      <div className="flex justify-center mb-4">
                        <div className="bg-gradient-to-r from-orange-400 to-orange-500 border-4 border-orange-800 rounded-xl px-6 py-3 shadow-[0_4px_0_0_rgba(154,52,18,1)]">
                          <div className="flex items-center gap-2">
                            <span className="text-2xl">🪙</span>
                            <div>
                              <p className="text-3xl font-black text-orange-950">
                                {top3[2].totalCoins}
                              </p>
                              <p className="text-xs font-black text-orange-800 uppercase">
                                {GAME_CONFIG.currencyName}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Description */}
                      {top3[2].description && (
                        <p className="text-center text-sm text-orange-900 dark:text-orange-200 font-bold line-clamp-3 px-2">
                          {top3[2].description}
                        </p>
                      )}

                      {/* Tags */}
                      <div className="flex gap-2 flex-wrap justify-center mt-3">
                        {top3[2].industry && (
                          <span className="px-3 py-1 bg-orange-200 dark:bg-orange-800 border-2 border-orange-900 rounded-lg text-xs font-black text-orange-900 dark:text-orange-100">
                            {top3[2].industry}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Live Stats */}
            <div className="game-card bg-gradient-to-r from-purple-900/20 to-pink-900/20 border-purple-900">
              <div className="text-center">
                <h3 className="text-2xl sm:text-3xl font-black text-purple-300 mb-6">
                  📊 Live Competition Stats
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="bg-purple-950/30 border-2 border-purple-800 rounded-xl p-4">
                    <p className="text-sm font-bold text-purple-400 uppercase mb-2">Total Startups</p>
                    <p className="text-4xl font-black text-purple-200">🚀 {startups.length}</p>
                  </div>
                  <div className="bg-purple-950/30 border-2 border-purple-800 rounded-xl p-4">
                    <p className="text-sm font-bold text-purple-400 uppercase mb-2">Total {GAME_CONFIG.currencyName}</p>
                    <p className="text-4xl font-black text-purple-200">
                      🪙 {allInvestments.reduce((sum, inv) => sum + parseFloat(inv.amount || 0), 0)}
                    </p>
                  </div>
                  <div className="bg-purple-950/30 border-2 border-purple-800 rounded-xl p-4">
                    <p className="text-sm font-bold text-purple-400 uppercase mb-2">Active Voters</p>
                    <p className="text-4xl font-black text-purple-200">
                      👥 {new Set(allInvestments.map(inv => inv.investor_id)).size}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
