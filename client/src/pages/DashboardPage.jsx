import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSocket } from '../context/SocketContext';
import { api, formatCurrency } from '../utils/api';
import { GAME_CONFIG } from '../config';

export default function DashboardPage() {
  const { investorId } = useParams();
  const navigate = useNavigate();
  const { gameState, isConnected } = useSocket();
  const [investor, setInvestor] = useState(null);
  const [selectedStartup, setSelectedStartup] = useState(null);
  const [voteAmount, setVoteAmount] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [activeTab, setActiveTab] = useState('vote'); // vote, portfolio

  // Load investor data
  useEffect(() => {
    const loadInvestor = async () => {
      try {
        const { investor } = await api.getInvestor(investorId);
        setInvestor(investor);
      } catch (err) {
        setError('⚠️ Player account not found');
      } finally {
        setLoading(false);
      }
    };
    loadInvestor();
  }, [investorId]);

  // Update investor from game state
  useEffect(() => {
    if (gameState?.investors) {
      const updated = gameState.investors.find(i => i.id === parseInt(investorId));
      if (updated) setInvestor(updated);
    }
  }, [gameState, investorId]);

  const startups = gameState?.startups?.filter(s => s.is_active) || [];
  const allInvestments = gameState?.investments || [];
  const myVotes = allInvestments.filter(inv => inv.investor_id === parseInt(investorId));

  const getVoteForStartup = (startupId) => {
    return myVotes.find(v => v.startup_id === startupId);
  };

  // Calculate total votes per startup (LIVE!)
  const getTotalVotesForStartup = (startupId) => {
    return allInvestments
      .filter(inv => inv.startup_id === startupId)
      .reduce((sum, inv) => sum + parseFloat(inv.amount || 0), 0);
  };

  // Get startup rankings
  const getStartupRankings = () => {
    const startupsWithVotes = startups.map(s => ({
      ...s,
      totalVotes: getTotalVotesForStartup(s.id)
    }));
    return startupsWithVotes.sort((a, b) => b.totalVotes - a.totalVotes);
  };

  const rankedStartups = getStartupRankings();

  const getStartupRank = (startupId) => {
    const index = rankedStartups.findIndex(s => s.id === startupId);
    return index + 1;
  };

  const coinsSpent = myVotes.reduce((sum, v) => sum + parseFloat(v.amount || 0), 0);
  const coinsLeft = parseFloat(investor?.starting_credit || 0) - coinsSpent;
  const isLocked = gameState?.isLocked || investor?.submitted;

  const handleVote = async (startup, amount) => {
    if (isLocked) {
      alert('🔒 Voting is closed!');
      return;
    }

    const coins = parseInt(amount);
    if (isNaN(coins) || coins < 0) {
      setError('❌ Invalid coin amount!');
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      await api.invest(investorId, startup.id, coins);
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 2000);
      setSelectedStartup(null);
      setVoteAmount('');
    } catch (err) {
      setError(err.response?.data?.error || '⚠️ Vote failed!');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmitPortfolio = async () => {
    if (coinsLeft > 0) {
      alert(`⚠️ You have ${coinsLeft} 🪙 coins left!\n\nSpend all your coins before locking in!`);
      return;
    }

    if (!confirm('🔒 Lock in your votes? This cannot be undone!')) return;

    setSubmitting(true);
    try {
      await api.submit(investorId);
      const { investor: updated } = await api.getInvestor(investorId);
      setInvestor(updated);
      alert('✅ VOTES LOCKED! 🏆 Good luck!');
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to lock votes');
    } finally {
      setSubmitting(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('investor');
    navigate('/');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4 animate-bounce">🎮</div>
          <p className="text-2xl font-black text-amber-300">LOADING GAME...</p>
        </div>
      </div>
    );
  }

  if (!investor) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="game-card max-w-md text-center">
          <p className="text-2xl font-black text-red-600 mb-4">❌ ERROR</p>
          <p className="text-lg mb-6">Player not found!</p>
          <button onClick={() => navigate('/')} className="btn-game">
            🏠 Back to Start
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-24 md:pb-8">
      {/* 🎮 GAME HUD - Top Bar */}
      <div className="sticky top-0 z-50 bg-gradient-to-r from-amber-950/95 via-yellow-950/95 to-amber-950/95 backdrop-blur-xl border-b-4 border-amber-900 shadow-[0_4px_0_0_rgba(120,53,15,1)]">
        <div className="max-w-7xl mx-auto px-3 sm:px-6">
          <div className="flex items-center justify-between h-16 sm:h-20">
            {/* Player Info */}
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-amber-400 to-yellow-500 rounded-full border-4 border-amber-900 flex items-center justify-center text-xl sm:text-2xl font-black shadow-[0_4px_0_0_rgba(120,53,15,1)]">
                {investor.name.charAt(0)}
              </div>
              <div className="hidden sm:block">
                <p className="text-sm font-black text-amber-300 uppercase">Player</p>
                <p className="text-base font-black text-amber-100">{investor.name}</p>
              </div>
            </div>

            {/* Coin Display */}
            <div className="coin-display text-base sm:text-xl">
              <span className="text-2xl sm:text-3xl">🪙</span>
              <span className="font-black">{coinsLeft}</span>
              <span className="text-xs hidden sm:inline">LEFT</span>
            </div>

            {/* Logout */}
            <button
              onClick={handleLogout}
              className="px-3 sm:px-4 py-2 bg-red-600/80 hover:bg-red-500 border-2 border-red-900 rounded-xl font-black text-white text-sm sm:text-base transition-all"
            >
              <span className="hidden sm:inline">🚪 EXIT</span>
              <span className="sm:hidden">🚪</span>
            </button>
          </div>
        </div>
      </div>

      {/* Success Toast */}
      {showSuccess && (
        <div className="fixed top-24 left-1/2 -translate-x-1/2 z-50 pop-in">
          <div className="game-alert">
            <span className="text-2xl mr-2">🎉</span>
            {GAME_CONFIG.messages.investmentSuccess}
          </div>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="max-w-7xl mx-auto px-4 pt-4">
          <div className="game-alert wiggle">
            <span className="text-xl mr-2">⚠️</span>
            {error}
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-3 sm:px-6 py-4 sm:py-8">
        {/* Status Banner */}
        {isLocked && (
          <div className="game-card mb-6 text-center bg-gradient-to-r from-red-900/20 to-orange-900/20 border-red-900">
            <p className="text-2xl sm:text-3xl font-black text-red-300 mb-2">
              🔒 {GAME_CONFIG.messages.gameLockedMessage}
            </p>
            <p className="text-base sm:text-lg text-red-400">Your votes are locked in! Check back for results.</p>
          </div>
        )}

        {/* Mobile Tab Switcher */}
        <div className="flex gap-2 mb-6 overflow-x-auto scrollbar-hide">
          <button
            onClick={() => setActiveTab('vote')}
            className={`flex-1 min-w-[140px] px-6 py-3 rounded-2xl font-black text-base sm:text-lg uppercase border-4 transition-all ${
              activeTab === 'vote'
                ? 'bg-gradient-to-b from-amber-400 to-amber-600 border-amber-900 text-amber-950 shadow-[0_4px_0_0_rgba(120,53,15,1)]'
                : 'bg-amber-950/30 border-amber-800 text-amber-400 hover:bg-amber-900/40'
            }`}
          >
            🗳️ VOTE
          </button>
          <button
            onClick={() => setActiveTab('portfolio')}
            className={`flex-1 min-w-[140px] px-6 py-3 rounded-2xl font-black text-base sm:text-lg uppercase border-4 transition-all ${
              activeTab === 'portfolio'
                ? 'bg-gradient-to-b from-amber-400 to-amber-600 border-amber-900 text-amber-950 shadow-[0_4px_0_0_rgba(120,53,15,1)]'
                : 'bg-amber-950/30 border-amber-800 text-amber-400 hover:bg-amber-900/40'
            }`}
          >
            📊 MY VOTES
          </button>
        </div>

        {/* VOTE TAB */}
        {activeTab === 'vote' && (
          <div className="space-y-6">
            {/* Instructions */}
            <div className="speech-bubble">
              <div className="flex items-start gap-3">
                <span className="text-4xl">🎩</span>
                <div>
                  <p className="text-xl sm:text-2xl font-black text-amber-900 dark:text-amber-200 mb-2">
                    VOTE FOR YOUR FAVORITE STARTUPS!
                  </p>
                  <p className="text-sm sm:text-base text-amber-800 dark:text-amber-300 font-bold">
                    Spend your 🪙 {GAME_CONFIG.defaultStartingCredit} coins to vote for the startups you believe in!
                    Click a startup to allocate coins. The more coins, the stronger your vote! 🚀
                  </p>
                </div>
              </div>
            </div>

            {/* Startup Cards Grid */}
            {startups.length === 0 ? (
              <div className="game-card text-center py-12">
                <p className="text-4xl mb-4">🚀</p>
                <p className="text-2xl font-black text-amber-900 dark:text-amber-200">
                  {GAME_CONFIG.messages.noStartupsMessage}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                {rankedStartups.map((startup, idx) => {
                  const currentVote = getVoteForStartup(startup.id);
                  const hasVoted = currentVote && currentVote.amount > 0;
                  const rank = idx + 1;
                  const totalVotes = startup.totalVotes;
                  const rankEmoji = rank === 1 ? '🥇' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : `#${rank}`;

                  return (
                    <div
                      key={startup.id}
                      className="startup-card pop-in"
                      style={{animationDelay: `${idx * 0.1}s`}}
                      onClick={() => !isLocked && setSelectedStartup(startup)}
                    >
                      {/* Rank Badge */}
                      <div className="absolute -top-3 -left-3 z-10">
                        <div className={`w-12 h-12 rounded-full border-4 flex items-center justify-center font-black text-lg shadow-[0_4px_0_0_rgba(120,53,15,1)] ${
                          rank === 1 ? 'bg-gradient-to-br from-yellow-300 to-yellow-500 border-yellow-700' :
                          rank === 2 ? 'bg-gradient-to-br from-gray-300 to-gray-400 border-gray-600' :
                          rank === 3 ? 'bg-gradient-to-br from-orange-400 to-orange-600 border-orange-800' :
                          'bg-gradient-to-br from-amber-400 to-amber-600 border-amber-900'
                        }`}>
                          {rankEmoji}
                        </div>
                      </div>

                      {/* Vote Badge */}
                      {hasVoted && (
                        <div className="absolute -top-3 -right-3 achievement-badge text-2xl z-10">
                          ✓
                        </div>
                      )}

                      {/* Startup Name */}
                      <h3 className="text-xl sm:text-2xl font-black text-amber-900 dark:text-amber-100 mb-3 line-clamp-2">
                        {startup.name}
                      </h3>

                      {/* LIVE Total Votes Display */}
                      <div className="flex items-center gap-2 mb-3">
                        <div className="flex-1 bg-gradient-to-r from-purple-500/20 to-pink-500/20 border-2 border-purple-900 dark:border-purple-600 rounded-lg px-3 py-2">
                          <div className="flex items-center justify-center gap-2">
                            <span className="text-lg">🏆</span>
                            <span className="text-base font-black text-purple-900 dark:text-purple-200">
                              {totalVotes}
                            </span>
                            <span className="text-xs font-bold text-purple-700 dark:text-purple-400 uppercase">
                              Total Votes
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Description */}
                      <p className="text-sm text-amber-800 dark:text-amber-300 mb-4 line-clamp-3">
                        {startup.description || 'An innovative startup ready to change the world!'}
                      </p>

                      {/* Tags */}
                      <div className="flex gap-2 flex-wrap mb-4">
                        {startup.industry && (
                          <span className="badge-pixel text-xs">{startup.industry}</span>
                        )}
                        {startup.cohort && (
                          <span className="badge-pixel text-xs">{startup.cohort}</span>
                        )}
                      </div>

                      {/* Current Vote Amount */}
                      {hasVoted && (
                        <div className="bg-amber-400/30 border-2 border-amber-900 rounded-xl p-3 mb-3">
                          <p className="text-center">
                            <span className="text-2xl mr-2">🪙</span>
                            <span className="text-2xl font-black text-amber-900 dark:text-amber-200">
                              {currentVote.amount}
                            </span>
                            <span className="text-sm font-bold text-amber-800 dark:text-amber-400 ml-2">
                              COINS VOTED
                            </span>
                          </p>
                        </div>
                      )}

                      {/* Vote Button */}
                      {!isLocked && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedStartup(startup);
                          }}
                          className="w-full px-4 py-3 bg-gradient-to-b from-green-400 to-green-600 hover:from-green-300 hover:to-green-500 text-white font-black rounded-xl border-4 border-green-900 shadow-[0_4px_0_0_rgba(20,83,45,1)] hover:shadow-[0_2px_0_0_rgba(20,83,45,1)] hover:translate-y-0.5 active:translate-y-1 transition-all text-base uppercase"
                        >
                          {hasVoted ? '✏️ CHANGE VOTE' : '🗳️ VOTE NOW'}
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            {/* Lock Votes Button - Available in VOTE tab */}
            {!isLocked && myVotes.length > 0 && (
              <div className="game-card bg-gradient-to-r from-purple-900/20 to-pink-900/20 border-purple-900 mt-8">
                <div className="text-center">
                  <p className="text-xl sm:text-2xl font-black text-purple-300 mb-2">
                    🔒 Ready to Lock In Your Votes?
                  </p>
                  <div className="grid grid-cols-3 gap-3 mb-4">
                    <div className="bg-purple-950/30 border border-purple-800 rounded-lg p-2">
                      <p className="text-xs font-bold text-purple-400 uppercase">Voted</p>
                      <p className="text-xl font-black text-purple-200">🚀 {myVotes.length}</p>
                    </div>
                    <div className="bg-purple-950/30 border border-purple-800 rounded-lg p-2">
                      <p className="text-xs font-bold text-purple-400 uppercase">Spent</p>
                      <p className="text-xl font-black text-purple-200">🪙 {coinsSpent}</p>
                    </div>
                    <div className="bg-purple-950/30 border border-purple-800 rounded-lg p-2">
                      <p className="text-xs font-bold text-purple-400 uppercase">Left</p>
                      <p className="text-xl font-black text-purple-200">🪙 {coinsLeft}</p>
                    </div>
                  </div>
                  <p className="text-sm sm:text-base text-purple-400 mb-6">
                    {coinsLeft > 0
                      ? `⚠️ You still have ${coinsLeft} coins left! Spend them all before locking.`
                      : '✅ All coins spent! You can lock your votes now.'
                    }
                  </p>
                  <button
                    onClick={handleSubmitPortfolio}
                    disabled={submitting}
                    className="btn-game w-full sm:w-auto px-12 disabled:opacity-50"
                  >
                    {submitting ? '⚡ LOCKING...' : '🔒 LOCK MY VOTES NOW'}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* PORTFOLIO TAB */}
        {activeTab === 'portfolio' && (
          <div className="space-y-6">
            {/* Portfolio Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
              <div className="game-card text-center">
                <p className="text-xs sm:text-sm font-black text-amber-700 dark:text-amber-400 uppercase mb-2">Total Coins</p>
                <p className="text-2xl sm:text-3xl font-black text-amber-900 dark:text-amber-200">
                  🪙 {investor.starting_credit}
                </p>
              </div>
              <div className="game-card text-center bg-blue-50 dark:bg-blue-950/30">
                <p className="text-xs sm:text-sm font-black text-blue-700 dark:text-blue-400 uppercase mb-2">Spent</p>
                <p className="text-2xl sm:text-3xl font-black text-blue-900 dark:text-blue-200">
                  🪙 {coinsSpent}
                </p>
              </div>
              <div className="game-card text-center bg-green-50 dark:bg-green-950/30">
                <p className="text-xs sm:text-sm font-black text-green-700 dark:text-green-400 uppercase mb-2">Left</p>
                <p className="text-2xl sm:text-3xl font-black text-green-900 dark:text-green-200">
                  🪙 {coinsLeft}
                </p>
              </div>
              <div className="game-card text-center">
                <p className="text-xs sm:text-sm font-black text-amber-700 dark:text-amber-400 uppercase mb-2">Startups</p>
                <p className="text-2xl sm:text-3xl font-black text-amber-900 dark:text-amber-200">
                  🚀 {myVotes.length}
                </p>
              </div>
            </div>

            {/* My Votes List */}
            {myVotes.length === 0 ? (
              <div className="game-card text-center py-12">
                <p className="text-4xl mb-4">📭</p>
                <p className="text-xl sm:text-2xl font-black text-amber-900 dark:text-amber-200 mb-2">
                  No votes yet!
                </p>
                <p className="text-sm sm:text-base text-amber-700 dark:text-amber-400">
                  Go to the VOTE tab to support your favorite startups! 🚀
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {myVotes.map(vote => {
                  const startup = startups.find(s => s.id === vote.startup_id);
                  if (!startup) return null;

                  return (
                    <div key={vote.id} className="game-card flex items-center justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <h4 className="text-lg sm:text-xl font-black text-amber-900 dark:text-amber-100 truncate">
                          {startup.name}
                        </h4>
                        <p className="text-sm text-amber-700 dark:text-amber-400">
                          Voted at {new Date(vote.timestamp).toLocaleTimeString()}
                        </p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-2xl sm:text-3xl font-black text-amber-900 dark:text-amber-200">
                          🪙 {vote.amount}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Lock Portfolio Button */}
            {!isLocked && myVotes.length > 0 && (
              <div className="game-card bg-gradient-to-r from-purple-900/20 to-pink-900/20 border-purple-900">
                <div className="text-center">
                  <p className="text-xl sm:text-2xl font-black text-purple-300 mb-4">
                    🔒 Ready to Lock In Your Votes?
                  </p>
                  <p className="text-sm sm:text-base text-purple-400 mb-6">
                    Make sure you've spent all your coins! This action is final.
                  </p>
                  <button
                    onClick={handleSubmitPortfolio}
                    disabled={submitting}
                    className="btn-game w-full sm:w-auto px-12 disabled:opacity-50"
                  >
                    {submitting ? '⚡ LOCKING...' : '🔒 LOCK MY VOTES'}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Voting Modal */}
      {selectedStartup && !isLocked && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in"
             onClick={() => setSelectedStartup(null)}>
          <div className="game-card max-w-md w-full pop-in" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-2xl sm:text-3xl font-black text-amber-900 dark:text-amber-100 mb-4">
              🗳️ Vote for {selectedStartup.name}
            </h3>

            <p className="text-sm sm:text-base text-amber-800 dark:text-amber-300 mb-6">
              {selectedStartup.description}
            </p>

            {/* Coin Input */}
            <div className="mb-6">
              <label className="block text-sm font-black text-amber-900 dark:text-amber-300 mb-2 uppercase">
                🪙 How many coins to vote?
              </label>
              <input
                type="number"
                value={voteAmount || getVoteForStartup(selectedStartup.id)?.amount || ''}
                onChange={(e) => setVoteAmount(e.target.value)}
                className="w-full px-6 py-4 text-2xl font-black text-center
                         bg-white dark:bg-amber-950/50
                         border-4 border-amber-900 dark:border-amber-600 rounded-2xl
                         focus:outline-none focus:ring-4 focus:ring-amber-400
                         text-amber-950 dark:text-amber-100
                         shadow-[4px_4px_0px_0px_rgba(120,53,15,0.6)]"
                placeholder="0"
                min="0"
                max={coinsLeft + (getVoteForStartup(selectedStartup.id)?.amount || 0)}
                disabled={submitting}
              />
              <p className="text-xs sm:text-sm text-amber-700 dark:text-amber-400 mt-2 text-center font-bold">
                You have 🪙 {coinsLeft} coins available
              </p>
            </div>

            {/* Quick Select */}
            <div className="grid grid-cols-4 gap-2 mb-6">
              {[25, 50, 100, 250].map(amt => (
                <button
                  key={amt}
                  onClick={() => setVoteAmount(amt.toString())}
                  className="px-3 py-2 bg-amber-200 dark:bg-amber-800 border-2 border-amber-900 rounded-lg font-black text-amber-900 dark:text-amber-200 hover:bg-amber-300 dark:hover:bg-amber-700 transition-colors text-sm"
                  disabled={submitting}
                >
                  {amt}
                </button>
              ))}
            </div>

            {/* Buttons */}
            <div className="flex gap-3">
              <button
                onClick={() => setSelectedStartup(null)}
                className="flex-1 px-6 py-3 bg-gray-400 hover:bg-gray-300 border-4 border-gray-700 rounded-xl font-black text-gray-900 uppercase transition-all"
                disabled={submitting}
              >
                ❌ Cancel
              </button>
              <button
                onClick={() => {
                  const amount = voteAmount || getVoteForStartup(selectedStartup.id)?.amount || 0;
                  handleVote(selectedStartup, amount);
                }}
                disabled={submitting}
                className="flex-1 btn-game disabled:opacity-50"
              >
                {submitting ? '⚡ VOTING...' : '✅ CONFIRM'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
