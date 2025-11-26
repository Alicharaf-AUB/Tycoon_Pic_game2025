import { useState, useEffect } from 'react';
import { useSocket } from '../context/SocketContext';
import { adminApi, api, formatCurrency, getFileUrl } from '../utils/api';
import ActivityFeed from '../components/admin/ActivityFeed';
import InvestmentCharts from '../components/admin/InvestmentCharts';
import AuditTrail from '../components/admin/AuditTrail';
import ErrorLogs from '../components/admin/ErrorLogs';
import Toast from '../components/Toast';
import { exportInvestorsToCSV, exportStartupsToCSV, exportInvestmentsToCSV, exportAllDataToCSV } from '../utils/adminExport';
import { GAME_CONFIG } from '../config';

export default function AdminPage() {
  const [authenticated, setAuthenticated] = useState(false);
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('');
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [toast, setToast] = useState(null);

  const { gameState } = useSocket();

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      await adminApi.getStats(username, password);
      setAuthenticated(true);
      localStorage.setItem('admin_username', username);
      localStorage.setItem('admin_password', password);
    } catch (err) {
      setError('⚠️ Invalid credentials! Access denied.');
    } finally {
      setLoading(false);
    }
  };

  // Try to auto-login from localStorage
  useEffect(() => {
    const savedUsername = localStorage.getItem('admin_username');
    const savedPassword = localStorage.getItem('admin_password');

    if (savedUsername && savedPassword) {
      setUsername(savedUsername);
      setPassword(savedPassword);
      adminApi.getStats(savedUsername, savedPassword)
        .then(() => setAuthenticated(true))
        .catch(() => {
          localStorage.removeItem('admin_username');
          localStorage.removeItem('admin_password');
        });
    }
  }, []);

  const handleLogout = () => {
    setAuthenticated(false);
    setPassword('');
    localStorage.removeItem('admin_username');
    localStorage.removeItem('admin_password');
  };

  if (!authenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
        {/* Animated background */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-10 left-1/4 text-6xl opacity-10 bounce-game">👑</div>
          <div className="absolute top-32 right-1/3 text-5xl opacity-10 bounce-game" style={{animationDelay: '0.5s'}}>🎮</div>
          <div className="absolute bottom-20 left-1/3 text-5xl opacity-10 bounce-game" style={{animationDelay: '1s'}}>🏆</div>
        </div>

        <div className="w-full max-w-md relative z-10">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="inline-flex w-20 h-20 rounded-full bg-gradient-to-br from-amber-400 to-yellow-600 items-center justify-center border-4 border-amber-900 mx-auto mb-6 shadow-[0_6px_0_0_rgba(120,53,15,1)]">
              <span className="text-5xl">👑</span>
            </div>
            <h1 className="text-4xl sm:text-5xl font-black mb-3 text-amber-900 dark:text-amber-200 pixel-text">
              GAME MASTER
            </h1>
            <p className="text-lg font-bold text-amber-700 dark:text-amber-400">
              {GAME_CONFIG.gameName} - Control Panel
            </p>
          </div>

          {/* Login Card */}
          <div className="game-card">
            <form onSubmit={handleLogin} className="space-y-5">
              <div>
                <label className="block text-sm font-black text-amber-900 dark:text-amber-300 mb-2 uppercase tracking-wider">
                  🔐 Username
                </label>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full px-4 py-3 text-lg font-bold
                           bg-white dark:bg-amber-950/50
                           border-4 border-amber-900 dark:border-amber-600 rounded-xl
                           focus:outline-none focus:ring-4 focus:ring-amber-400
                           text-amber-950 dark:text-amber-100"
                  autoComplete="username"
                />
              </div>

              <div>
                <label className="block text-sm font-black text-amber-900 dark:text-amber-300 mb-2 uppercase tracking-wider">
                  🔑 Password
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-3 text-lg font-bold
                           bg-white dark:bg-amber-950/50
                           border-4 border-amber-900 dark:border-amber-600 rounded-xl
                           focus:outline-none focus:ring-4 focus:ring-amber-400
                           text-amber-950 dark:text-amber-100"
                  autoComplete="current-password"
                />
              </div>

              {error && (
                <div className="game-alert wiggle">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="btn-game w-full disabled:opacity-50"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <div className="w-5 h-5 border-4 border-amber-950 border-t-transparent rounded-full animate-spin"></div>
                    AUTHENTICATING...
                  </span>
                ) : (
                  '🚀 ENTER CONTROL PANEL'
                )}
              </button>
            </form>
          </div>

          {/* Back Link */}
          <div className="text-center mt-6">
            <a href="/" className="text-sm font-bold text-amber-700 dark:text-amber-400 hover:text-amber-900 dark:hover:text-amber-200 transition-colors inline-flex items-center gap-2 group">
              <span className="text-xl group-hover:-translate-x-1 transition-transform">←</span>
              Back to Game
            </a>
          </div>
        </div>
      </div>
    );
  }

  const tabs = [
    { id: 'overview', name: '📊 Overview', emoji: '📊' },
    { id: 'investors', name: '👥 Players', emoji: '👥' },
    { id: 'startups', name: '🚀 Startups', emoji: '🚀' },
    { id: 'investments', name: '🗳️ Votes', emoji: '🗳️' },
    { id: 'submissions', name: '✅ Submissions', emoji: '✅' },
    { id: 'analytics', name: '📈 Analytics', emoji: '📈' },
    { id: 'activity', name: '⚡ Activity', emoji: '⚡' },
    { id: 'audit', name: '📋 Audit', emoji: '📋' },
    { id: 'errors', name: '🐛 Errors', emoji: '🐛' },
  ];

  return (
    <div className="min-h-screen pb-8">
      {/* Toast Notifications */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      {/* 👑 GAME MASTER HEADER */}
      <div className="sticky top-0 z-50 bg-gradient-to-r from-amber-950/95 via-yellow-950/95 to-amber-950/95 backdrop-blur-xl border-b-4 border-amber-900 shadow-[0_4px_0_0_rgba(120,53,15,1)] mb-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 py-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-br from-amber-400 to-yellow-500 rounded-full border-4 border-amber-900 flex items-center justify-center text-2xl shadow-[0_4px_0_0_rgba(120,53,15,1)]">
                👑
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl font-black text-amber-300 uppercase">
                  Game Master
                </h1>
                <p className="text-xs sm:text-sm font-bold text-amber-400">
                  {GAME_CONFIG.gameName} Control Panel
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <GameLockButton username={username} password={password} />
              <button
                onClick={handleLogout}
                className="px-4 py-2 bg-red-600/80 hover:bg-red-500 border-2 border-red-900 rounded-xl font-black text-white text-sm transition-all"
              >
                🚪 EXIT
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        {/* Tabs */}
        <div className="mb-6">
          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide -mx-4 px-4">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-4 sm:px-5 py-2.5 sm:py-3 font-black transition-all whitespace-nowrap rounded-xl text-xs sm:text-sm min-h-[44px] border-4 flex-shrink-0 uppercase ${
                  activeTab === tab.id
                    ? 'bg-gradient-to-b from-amber-400 to-amber-600 border-amber-900 text-amber-950 shadow-[0_4px_0_0_rgba(120,53,15,1)]'
                    : 'bg-amber-950/30 border-amber-800 text-amber-400 hover:bg-amber-900/40 hover:text-amber-200'
                }`}
              >
                {tab.name}
              </button>
            ))}
          </div>
        </div>

        {/* Tab Content */}
        {activeTab === 'overview' && (
          <OverviewTab username={username} password={password} gameState={gameState} />
        )}
        {activeTab === 'investors' && (
          <InvestorsTab username={username} password={password} gameState={gameState} />
        )}
        {activeTab === 'startups' && (
          <StartupsTab username={username} password={password} gameState={gameState} />
        )}
        {activeTab === 'investments' && (
          <InvestmentsTab gameState={gameState} />
        )}
        {activeTab === 'submissions' && (
          <SubmissionsTab gameState={gameState} />
        )}
        {activeTab === 'analytics' && (
          <AnalyticsTab gameState={gameState} />
        )}
        {activeTab === 'activity' && (
          <ActivityTab gameState={gameState} />
        )}
        {activeTab === 'audit' && (
          <AuditTab />
        )}
        {activeTab === 'errors' && (
          <ErrorLogsTab />
        )}
      </div>
    </div>
  );
}

// Game Lock Button Component
function GameLockButton({ username, password }) {
  const { gameState } = useSocket();
  const [loading, setLoading] = useState(false);

  const handleToggleLock = async () => {
    setLoading(true);
    try {
      await adminApi.toggleLock(username, password);
    } catch (err) {
      showToast('Failed to toggle lock', 'error');
    } finally {
      setLoading(false);
    }
  };

  const isLocked = gameState?.isLocked || false;

  return (
    <button
      onClick={handleToggleLock}
      disabled={loading}
      className={`px-5 py-2.5 rounded-xl font-black transition-all text-white text-sm min-h-[44px] border-4 shadow-[0_4px_0_0_rgba(0,0,0,0.4)] hover:shadow-[0_2px_0_0_rgba(0,0,0,0.4)] hover:translate-y-0.5 active:translate-y-1 ${
        isLocked
          ? 'bg-gradient-to-b from-red-500 to-red-700 border-red-900'
          : 'bg-gradient-to-b from-green-500 to-green-700 border-green-900'
      }`}
    >
      {loading ? (
        <span className="flex items-center gap-2">
          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
        </span>
      ) : isLocked ? (
        <span className="flex items-center gap-2">
          <span>🔒</span> LOCKED
        </span>
      ) : (
        <span className="flex items-center gap-2">
          <span>🔓</span> UNLOCKED
        </span>
      )}
    </button>
  );
}

// Overview Tab
function OverviewTab({ username, password, gameState }) {
  const [stats, setStats] = useState(null);

  useEffect(() => {
    const loadStats = async () => {
      try {
        const { stats } = await adminApi.getStats(username, password);
        setStats(stats);
      } catch (err) {
        console.error('Failed to load stats', err);
      }
    };
    loadStats();
  }, [username, password, gameState]);

  if (!stats) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <div className="text-6xl mb-4 animate-bounce">🎮</div>
        <p className="text-xl font-black text-amber-300">LOADING STATS...</p>
      </div>
    );
  }

  const topStartups = (gameState?.startups || [])
    .filter(s => s.total_raised > 0)
    .sort((a, b) => b.total_raised - a.total_raised)
    .slice(0, 5);

  return (
    <div className="space-y-6">
      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="game-card text-center pop-in">
          <p className="text-xs font-black text-amber-700 dark:text-amber-400 uppercase mb-2">👥 Total Players</p>
          <p className="text-4xl font-black text-amber-900 dark:text-amber-200">{stats.totalInvestors}</p>
        </div>
        <div className="game-card text-center pop-in" style={{animationDelay: '0.1s'}}>
          <p className="text-xs font-black text-amber-700 dark:text-amber-400 uppercase mb-2">🚀 Startups</p>
          <p className="text-4xl font-black text-amber-900 dark:text-amber-200">{stats.totalStartups}</p>
        </div>
        <div className="game-card text-center pop-in" style={{animationDelay: '0.2s'}}>
          <p className="text-xs font-black text-amber-700 dark:text-amber-400 uppercase mb-2">🪙 Total Votes</p>
          <p className="text-3xl font-black text-amber-900 dark:text-amber-200">
            {formatCurrency(stats.totalInvested)}
          </p>
        </div>
        <div className="game-card text-center pop-in" style={{animationDelay: '0.3s'}}>
          <p className="text-xs font-black text-amber-700 dark:text-amber-400 uppercase mb-2">🗳️ Vote Count</p>
          <p className="text-4xl font-black text-amber-900 dark:text-amber-200">{stats.totalInvestments}</p>
        </div>
      </div>

      {/* Top Startups */}
      {topStartups.length > 0 && (
        <div className="game-card pop-in" style={{animationDelay: '0.4s'}}>
          <h3 className="text-2xl font-black mb-6 text-amber-900 dark:text-amber-200 flex items-center gap-2">
            <span className="text-3xl">🏆</span> TOP STARTUPS BY VOTES
          </h3>
          <div className="space-y-3">
            {topStartups.map((startup, index) => (
              <div key={startup.id} className="startup-card hover:scale-[1.02] transition-transform">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-full border-4 flex items-center justify-center font-black text-xl shadow-[0_4px_0_0_rgba(120,53,15,1)] ${
                      index === 0 ? 'bg-gradient-to-br from-yellow-300 to-yellow-500 border-yellow-700' :
                      index === 1 ? 'bg-gradient-to-br from-gray-300 to-gray-400 border-gray-600' :
                      index === 2 ? 'bg-gradient-to-br from-orange-400 to-orange-600 border-orange-800' :
                      'bg-gradient-to-br from-amber-400 to-amber-600 border-amber-900'
                    }`}>
                      {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `#${index + 1}`}
                    </div>
                    <div>
                      <p className="font-black text-amber-900 dark:text-amber-100 text-lg">{startup.name}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-black text-amber-900 dark:text-amber-200">
                      🪙 {formatCurrency(startup.total_raised)}
                    </p>
                    <p className="text-xs font-bold text-amber-700 dark:text-amber-400">TOTAL VOTES</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// Investors Tab (now "Players")
function InvestorsTab({ username, password, gameState }) {
  const [editingCredit, setEditingCredit] = useState(null);
  const [newCredit, setNewCredit] = useState('');

  const investors = gameState?.investors || [];

  const handleUpdateCredit = async (investorId) => {
    const amount = parseInt(newCredit);
    if (isNaN(amount) || amount < 0) return;

    try {
      await adminApi.updateCredit(username, password, investorId, amount);
      setEditingCredit(null);
      setNewCredit('');
    } catch (err) {
      showToast('Failed to update coins', 'error');
    }
  };

  const handleDelete = async (investorId, name) => {
    if (!confirm(`🗑️ Delete player "${name}"?\n\nThis cannot be undone!`)) return;

    try {
      await adminApi.deleteInvestor(username, password, investorId);
    } catch (err) {
      showToast('Failed to delete player', 'error');
    }
  };

  return (
    <div className="space-y-4">
      {/* Desktop Table View */}
      <div className="hidden lg:block game-card overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b-4 border-amber-900">
              <th className="text-left py-4 px-4 text-xs font-black text-amber-700 dark:text-amber-400 uppercase tracking-wider">Player Name</th>
              <th className="text-center py-4 px-4 text-xs font-black text-amber-700 dark:text-amber-400 uppercase tracking-wider">Status</th>
              <th className="text-right py-4 px-4 text-xs font-black text-amber-700 dark:text-amber-400 uppercase tracking-wider">Starting Coins</th>
              <th className="text-right py-4 px-4 text-xs font-black text-amber-700 dark:text-amber-400 uppercase tracking-wider">Voted</th>
              <th className="text-right py-4 px-4 text-xs font-black text-amber-700 dark:text-amber-400 uppercase tracking-wider">Remaining</th>
              <th className="text-right py-4 px-4 text-xs font-black text-amber-700 dark:text-amber-400 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody>
            {investors.map((investor) => (
              <tr key={investor.id} className="border-b-2 border-amber-900/30 hover:bg-amber-400/10 transition-colors">
                <td className="py-4 px-4">
                  <p className="font-black text-amber-900 dark:text-amber-100">{investor.name}</p>
                </td>
                <td className="py-4 px-4 text-center">
                  {investor.submitted ? (
                    <span className="inline-flex items-center gap-1 bg-gradient-to-r from-green-500 to-green-600 text-white text-xs font-black px-3 py-1 rounded-full border-2 border-green-900">
                      ✅ LOCKED
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 bg-gradient-to-r from-yellow-500 to-yellow-600 text-yellow-950 text-xs font-black px-3 py-1 rounded-full border-2 border-yellow-900">
                      ⏳ VOTING
                    </span>
                  )}
                </td>
                <td className="py-4 px-4 text-right">
                  {editingCredit === investor.id ? (
                    <input
                      type="number"
                      value={newCredit}
                      onChange={(e) => setNewCredit(e.target.value)}
                      className="w-32 px-3 py-1 text-right font-bold border-2 border-amber-900 rounded-lg"
                      autoFocus
                    />
                  ) : (
                    <span className="text-amber-900 dark:text-amber-200 font-black">🪙 {formatCurrency(investor.starting_credit)}</span>
                  )}
                </td>
                <td className="py-4 px-4 text-right text-blue-600 dark:text-blue-400 font-black">
                  🪙 {formatCurrency(investor.invested)}
                </td>
                <td className="py-4 px-4 text-right text-green-600 dark:text-green-400 font-black">
                  🪙 {formatCurrency(investor.remaining)}
                </td>
                <td className="py-4 px-4 text-right">
                  <div className="flex items-center justify-end gap-2">
                    {editingCredit === investor.id ? (
                      <>
                        <button
                          onClick={() => handleUpdateCredit(investor.id)}
                          className="text-sm text-green-600 dark:text-green-400 hover:text-green-700 font-black min-h-[44px] px-3"
                        >
                          ✓ Save
                        </button>
                        <button
                          onClick={() => {
                            setEditingCredit(null);
                            setNewCredit('');
                          }}
                          className="text-sm text-amber-700 dark:text-amber-400 hover:text-amber-800 font-black min-h-[44px] px-3"
                        >
                          ✗ Cancel
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          onClick={() => {
                            setEditingCredit(investor.id);
                            setNewCredit(investor.starting_credit.toString());
                          }}
                          className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 font-black min-h-[44px] px-3"
                        >
                          ✏️ Edit
                        </button>
                        <button
                          onClick={() => handleDelete(investor.id, investor.name)}
                          className="text-sm text-red-600 dark:text-red-400 hover:text-red-700 font-black min-h-[44px] px-3"
                        >
                          🗑️ Delete
                        </button>
                      </>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {investors.length === 0 && (
          <div className="text-center py-12">
            <p className="text-4xl mb-3">👥</p>
            <p className="text-xl font-black text-amber-700 dark:text-amber-400">No players yet!</p>
          </div>
        )}
      </div>

      {/* Mobile/Tablet Card View */}
      <div className="lg:hidden space-y-4">
        {investors.map((investor) => (
          <div key={investor.id} className="game-card">
            <div className="flex items-start justify-between mb-3">
              <div>
                <h3 className="font-black text-amber-900 dark:text-amber-100 text-lg">{investor.name}</h3>
                <div className="mt-2">
                  {investor.submitted ? (
                    <span className="inline-flex items-center gap-1 bg-gradient-to-r from-green-500 to-green-600 text-white text-xs font-black px-3 py-1 rounded-full border-2 border-green-900">
                      ✅ LOCKED
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 bg-gradient-to-r from-yellow-500 to-yellow-600 text-yellow-950 text-xs font-black px-3 py-1 rounded-full border-2 border-yellow-900">
                      ⏳ VOTING
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <p className="text-xs text-amber-700 dark:text-amber-400 font-black uppercase mb-1">Starting Coins</p>
                {editingCredit === investor.id ? (
                  <input
                    type="number"
                    value={newCredit}
                    onChange={(e) => setNewCredit(e.target.value)}
                    className="w-full px-3 py-2 text-sm font-bold border-2 border-amber-900 rounded-lg"
                    autoFocus
                  />
                ) : (
                  <p className="text-lg font-black text-amber-900 dark:text-amber-100">🪙 {formatCurrency(investor.starting_credit)}</p>
                )}
              </div>
              <div>
                <p className="text-xs text-amber-700 dark:text-amber-400 font-black uppercase mb-1">Voted</p>
                <p className="text-lg font-black text-blue-600 dark:text-blue-400">🪙 {formatCurrency(investor.invested)}</p>
              </div>
              <div>
                <p className="text-xs text-amber-700 dark:text-amber-400 font-black uppercase mb-1">Remaining</p>
                <p className="text-lg font-black text-green-600 dark:text-green-400">🪙 {formatCurrency(investor.remaining)}</p>
              </div>
              <div>
                <p className="text-xs text-amber-700 dark:text-amber-400 font-black uppercase mb-1">Allocation</p>
                <p className="text-lg font-black text-purple-600 dark:text-purple-400">
                  {investor.starting_credit > 0 ? Math.round((investor.invested / investor.starting_credit) * 100) : 0}%
                </p>
              </div>
            </div>

            <div className="flex gap-2 pt-3 border-t-2 border-amber-900/30">
              {editingCredit === investor.id ? (
                <>
                  <button
                    onClick={() => handleUpdateCredit(investor.id)}
                    className="flex-1 px-4 py-3 bg-gradient-to-b from-green-400 to-green-600 border-4 border-green-900 rounded-xl font-black text-white text-sm min-h-[44px]"
                  >
                    ✓ Save Changes
                  </button>
                  <button
                    onClick={() => {
                      setEditingCredit(null);
                      setNewCredit('');
                    }}
                    className="flex-1 px-4 py-3 bg-gradient-to-b from-gray-400 to-gray-600 border-4 border-gray-900 rounded-xl font-black text-white text-sm min-h-[44px]"
                  >
                    ✗ Cancel
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={() => {
                      setEditingCredit(investor.id);
                      setNewCredit(investor.starting_credit.toString());
                    }}
                    className="flex-1 px-4 py-3 bg-gradient-to-b from-blue-400 to-blue-600 border-4 border-blue-900 rounded-xl font-black text-white text-sm min-h-[44px]"
                  >
                    ✏️ Edit Coins
                  </button>
                  <button
                    onClick={() => handleDelete(investor.id, investor.name)}
                    className="flex-1 px-4 py-3 bg-gradient-to-b from-red-400 to-red-600 border-4 border-red-900 rounded-xl font-black text-white text-sm min-h-[44px]"
                  >
                    🗑️ Delete
                  </button>
                </>
              )}
            </div>
          </div>
        ))}

        {investors.length === 0 && (
          <div className="game-card text-center py-12">
            <p className="text-4xl mb-3">👥</p>
            <p className="text-xl font-black text-amber-700 dark:text-amber-400">No players yet!</p>
          </div>
        )}
      </div>
    </div>
  );
}

// Startups Tab
function StartupsTab({ username, password, gameState }) {
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingStartup, setEditingStartup] = useState(null);
  const emptyForm = {
    name: '',
    slug: '',
    description: '',
    logo: '',
    pitch_deck: '',
    cohort: '',
    support_program: '',
    industry: '',
    email: '',
    team: '',
    generating_revenue: '',
    ask: '',
    legal_entity: ''
  };
  const [newStartup, setNewStartup] = useState(emptyForm);
  const [editForm, setEditForm] = useState(emptyForm);
  const [creating, setCreating] = useState(false);
  const [updating, setUpdating] = useState(false);

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!newStartup.name || !newStartup.slug) return;

    setCreating(true);
    try {
      await adminApi.createStartup(username, password, newStartup);
      setNewStartup(emptyForm);
      setShowCreateForm(false);
      showToast('Startup created successfully!');
    } catch (err) {
      showToast(err.response?.data?.error || 'Failed to create startup', 'error');
    } finally {
      setCreating(false);
    }
  };

  const handleEdit = (startup) => {
    setEditingStartup(startup);
    setEditForm({
      name: startup.name,
      slug: startup.slug,
      description: startup.description || '',
      logo: startup.logo || '',
      pitch_deck: startup.pitch_deck || '',
      cohort: startup.cohort || '',
      support_program: startup.support_program || '',
      industry: startup.industry || '',
      email: startup.email || '',
      team: startup.team || '',
      generating_revenue: startup.generating_revenue || '',
      ask: startup.ask || '',
      legal_entity: startup.legal_entity || ''
    });
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    if (!editForm.name || !editForm.slug) return;

    setUpdating(true);
    try {
      await adminApi.updateStartup(username, password, editingStartup.id, editForm);
      setEditingStartup(null);
      showToast('Startup updated successfully!');
    } catch (err) {
      showToast(err.response?.data?.error || 'Failed to update startup', 'error');
    } finally {
      setUpdating(false);
    }
  };

  const handleToggleActive = async (startup) => {
    try {
      await adminApi.updateStartup(username, password, startup.id, {
        isActive: !startup.is_active,
      });
    } catch (err) {
      showToast('Failed to update startup', 'error');
    }
  };

  const handleDelete = async (startupId, name) => {
    if (!confirm(`🗑️ Delete startup "${name}"?\n\nThis will also delete all votes for this startup!\n\nThis cannot be undone!`)) return;

    try {
      await adminApi.deleteStartup(username, password, startupId);
    } catch (err) {
      showToast('Failed to delete startup', 'error');
    }
  };

  const allStartups = gameState?.startups || [];

  return (
    <div className="space-y-4">
      {/* Create Button */}
      <div className="flex justify-end">
        <button
          onClick={() => setShowCreateForm(!showCreateForm)}
          className="btn-game"
        >
          {showCreateForm ? '✗ Cancel' : '➕ New Startup'}
        </button>
      </div>

      {/* Create Form */}
      {showCreateForm && (
        <div className="game-card max-h-[80vh] overflow-y-auto">
          <h3 className="text-2xl font-black mb-6 text-amber-900 dark:text-amber-100">🚀 Create New Startup</h3>
          <form onSubmit={handleCreate} className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-black text-amber-900 dark:text-amber-300 mb-2 uppercase tracking-wide">
                  Name *
                </label>
                <input
                  type="text"
                  value={newStartup.name}
                  onChange={(e) => setNewStartup({ ...newStartup, name: e.target.value })}
                  className="w-full px-4 py-3 font-bold border-4 border-amber-900 rounded-xl focus:outline-none focus:ring-4 focus:ring-amber-400"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-black text-amber-900 dark:text-amber-300 mb-2 uppercase tracking-wide">
                  Slug * (URL-friendly)
                </label>
                <input
                  type="text"
                  value={newStartup.slug}
                  onChange={(e) => setNewStartup({ ...newStartup, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-') })}
                  className="w-full px-4 py-3 font-bold border-4 border-amber-900 rounded-xl focus:outline-none focus:ring-4 focus:ring-amber-400"
                  required
                  placeholder="my-startup"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-black text-amber-900 dark:text-amber-300 mb-2 uppercase tracking-wide">
                Description
              </label>
              <textarea
                value={newStartup.description}
                onChange={(e) => setNewStartup({ ...newStartup, description: e.target.value })}
                className="w-full px-4 py-3 font-bold border-4 border-amber-900 rounded-xl focus:outline-none focus:ring-4 focus:ring-amber-400"
                rows="3"
              />
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-black text-amber-900 dark:text-amber-300 mb-2 uppercase tracking-wide">
                  Logo (PNG/JPG)
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newStartup.logo}
                    onChange={(e) => setNewStartup({ ...newStartup, logo: e.target.value })}
                    className="flex-1 px-4 py-3 font-bold border-4 border-amber-900 rounded-xl focus:outline-none focus:ring-4 focus:ring-amber-400"
                    placeholder="/uploads/logo.png"
                    readOnly
                  />
                  <label className="px-4 py-3 bg-gradient-to-b from-blue-400 to-blue-600 border-4 border-blue-900 rounded-xl font-black text-white cursor-pointer whitespace-nowrap hover:from-blue-300 hover:to-blue-500 transition-all">
                    📁 Upload
                    <input
                      type="file"
                      accept="image/png,image/jpeg,image/jpg"
                      className="hidden"
                      onChange={async (e) => {
                        const file = e.target.files[0];
                        if (file) {
                          try {
                            const result = await adminApi.uploadFile(username, password, file);
                            setNewStartup({ ...newStartup, logo: result.url });
                          } catch (err) {
                            showToast(err.response?.data?.error || 'Failed to upload logo', 'error');
                          }
                        }
                      }}
                    />
                  </label>
                </div>
                {newStartup.logo && (
                  <img
                    src={getFileUrl(newStartup.logo)}
                    alt="Logo preview"
                    className="mt-2 h-16 w-16 object-contain border-4 border-amber-900 rounded-lg"
                    onError={(e) => e.target.style.display = 'none'}
                  />
                )}
              </div>
              <div>
                <label className="block text-sm font-black text-amber-900 dark:text-amber-300 mb-2 uppercase tracking-wide">
                  Pitch Deck (PDF/PPT)
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newStartup.pitch_deck}
                    onChange={(e) => setNewStartup({ ...newStartup, pitch_deck: e.target.value })}
                    className="flex-1 px-4 py-3 font-bold border-4 border-amber-900 rounded-xl focus:outline-none focus:ring-4 focus:ring-amber-400"
                    placeholder="/uploads/deck.pdf"
                    readOnly
                  />
                  <label className="px-4 py-3 bg-gradient-to-b from-blue-400 to-blue-600 border-4 border-blue-900 rounded-xl font-black text-white cursor-pointer whitespace-nowrap hover:from-blue-300 hover:to-blue-500 transition-all">
                    📁 Upload
                    <input
                      type="file"
                      accept=".pdf,.ppt,.pptx"
                      className="hidden"
                      onChange={async (e) => {
                        const file = e.target.files[0];
                        if (file) {
                          try {
                            const result = await adminApi.uploadFile(username, password, file);
                            setNewStartup({ ...newStartup, pitch_deck: result.url });
                          } catch (err) {
                            showToast(err.response?.data?.error || 'Failed to upload pitch deck', 'error');
                          }
                        }
                      }}
                    />
                  </label>
                </div>
                {newStartup.pitch_deck && (
                  <a href={getFileUrl(newStartup.pitch_deck)} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-600 dark:text-blue-400 hover:underline mt-1 inline-block font-bold">
                    📄 View file →
                  </a>
                )}
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-black text-amber-900 dark:text-amber-300 mb-2 uppercase tracking-wide">
                  Cohort
                </label>
                <input
                  type="text"
                  value={newStartup.cohort}
                  onChange={(e) => setNewStartup({ ...newStartup, cohort: e.target.value })}
                  className="w-full px-4 py-3 font-bold border-4 border-amber-900 rounded-xl focus:outline-none focus:ring-4 focus:ring-amber-400"
                  placeholder="B&A2024, B&A2025"
                />
              </div>
              <div>
                <label className="block text-sm font-black text-amber-900 dark:text-amber-300 mb-2 uppercase tracking-wide">
                  Support Program
                </label>
                <input
                  type="text"
                  value={newStartup.support_program}
                  onChange={(e) => setNewStartup({ ...newStartup, support_program: e.target.value })}
                  className="w-full px-4 py-3 font-bold border-4 border-amber-900 rounded-xl focus:outline-none focus:ring-4 focus:ring-amber-400"
                  placeholder="IVP 2025 Finalists"
                />
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-black text-amber-900 dark:text-amber-300 mb-2 uppercase tracking-wide">
                  Industry
                </label>
                <input
                  type="text"
                  value={newStartup.industry}
                  onChange={(e) => setNewStartup({ ...newStartup, industry: e.target.value })}
                  className="w-full px-4 py-3 font-bold border-4 border-amber-900 rounded-xl focus:outline-none focus:ring-4 focus:ring-amber-400"
                  placeholder="AdTech, FinTech, etc."
                />
              </div>
              <div>
                <label className="block text-sm font-black text-amber-900 dark:text-amber-300 mb-2 uppercase tracking-wide">
                  Email
                </label>
                <input
                  type="email"
                  value={newStartup.email}
                  onChange={(e) => setNewStartup({ ...newStartup, email: e.target.value })}
                  className="w-full px-4 py-3 font-bold border-4 border-amber-900 rounded-xl focus:outline-none focus:ring-4 focus:ring-amber-400"
                  placeholder="founder@startup.com"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-black text-amber-900 dark:text-amber-300 mb-2 uppercase tracking-wide">
                Team
              </label>
              <textarea
                value={newStartup.team}
                onChange={(e) => setNewStartup({ ...newStartup, team: e.target.value })}
                className="w-full px-4 py-3 font-bold border-4 border-amber-900 rounded-xl focus:outline-none focus:ring-4 focus:ring-amber-400"
                rows="2"
                placeholder="Founder Name - CEO, Co-founder Name - CTO"
              />
            </div>

            <div className="grid md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-black text-amber-900 dark:text-amber-300 mb-2 uppercase tracking-wide">
                  Generating Revenue
                </label>
                <select
                  value={newStartup.generating_revenue}
                  onChange={(e) => setNewStartup({ ...newStartup, generating_revenue: e.target.value })}
                  className="w-full px-4 py-3 font-bold border-4 border-amber-900 rounded-xl focus:outline-none focus:ring-4 focus:ring-amber-400"
                >
                  <option value="">Select...</option>
                  <option value="Yes">Yes</option>
                  <option value="No">No</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-black text-amber-900 dark:text-amber-300 mb-2 uppercase tracking-wide">
                  Ask
                </label>
                <input
                  type="text"
                  value={newStartup.ask}
                  onChange={(e) => setNewStartup({ ...newStartup, ask: e.target.value })}
                  className="w-full px-4 py-3 font-bold border-4 border-amber-900 rounded-xl focus:outline-none focus:ring-4 focus:ring-amber-400"
                  placeholder="$250,000"
                />
              </div>
              <div>
                <label className="block text-sm font-black text-amber-900 dark:text-amber-300 mb-2 uppercase tracking-wide">
                  Legal Entity
                </label>
                <input
                  type="text"
                  value={newStartup.legal_entity}
                  onChange={(e) => setNewStartup({ ...newStartup, legal_entity: e.target.value })}
                  className="w-full px-4 py-3 font-bold border-4 border-amber-900 rounded-xl focus:outline-none focus:ring-4 focus:ring-amber-400"
                  placeholder="Yes (UK)"
                />
              </div>
            </div>

            <button type="submit" disabled={creating} className="btn-game w-full disabled:opacity-50">
              {creating ? '⚡ CREATING...' : '✓ CREATE STARTUP'}
            </button>
          </form>
        </div>
      )}

      {/* Edit Modal - Similar structure, omitted for brevity but would follow same pattern */}
      {editingStartup && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="game-card max-w-4xl w-full my-8 max-h-[90vh] overflow-y-auto">
            <h3 className="text-3xl font-black mb-6 text-amber-900 dark:text-amber-100">✏️ Edit Startup</h3>
            <form onSubmit={handleUpdate} className="space-y-4">
              {/* Same form fields as create but with editForm */}
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-black text-amber-900 dark:text-amber-300 mb-2 uppercase">Name *</label>
                  <input
                    type="text"
                    value={editForm.name}
                    onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                    className="w-full px-4 py-3 font-bold border-4 border-amber-900 rounded-xl focus:outline-none focus:ring-4 focus:ring-amber-400"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-black text-amber-900 dark:text-amber-300 mb-2 uppercase">Slug *</label>
                  <input
                    type="text"
                    value={editForm.slug}
                    onChange={(e) => setEditForm({ ...editForm, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-') })}
                    className="w-full px-4 py-3 font-bold border-4 border-amber-900 rounded-xl focus:outline-none focus:ring-4 focus:ring-amber-400"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-black text-amber-900 dark:text-amber-300 mb-2 uppercase">Description</label>
                <textarea
                  value={editForm.description}
                  onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                  className="w-full px-4 py-3 font-bold border-4 border-amber-900 rounded-xl focus:outline-none focus:ring-4 focus:ring-amber-400"
                  rows="3"
                />
              </div>

              {/* Other fields... */}

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setEditingStartup(null)}
                  className="flex-1 px-6 py-3 bg-gradient-to-b from-gray-400 to-gray-600 border-4 border-gray-900 rounded-xl font-black text-white"
                  disabled={updating}
                >
                  ✗ Cancel
                </button>
                <button
                  type="submit"
                  disabled={updating}
                  className="flex-1 btn-game disabled:opacity-50"
                >
                  {updating ? '⚡ SAVING...' : '✓ SAVE CHANGES'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Startups Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {allStartups.map((startup, idx) => (
          <div key={startup.id} className="startup-card pop-in" style={{animationDelay: `${idx * 0.05}s`}}>
            <div className="flex items-start justify-between mb-3">
              <div className="flex-1">
                <h3 className="text-xl font-black text-amber-900 dark:text-amber-100 mb-1">{startup.name}</h3>
                <p className="text-xs text-amber-700 dark:text-amber-400 font-mono">/{startup.slug}</p>
                <span className={`inline-block mt-2 px-3 py-1 text-xs font-black rounded-full border-2 ${
                  startup.is_active
                    ? 'bg-green-500 text-white border-green-900'
                    : 'bg-red-500 text-white border-red-900'
                }`}>
                  {startup.is_active ? '✓ ACTIVE' : '✗ INACTIVE'}
                </span>
              </div>
            </div>

            {startup.description && (
              <p className="text-sm text-amber-800 dark:text-amber-300 mb-3 line-clamp-2">{startup.description}</p>
            )}

            <div className="mb-4 pb-4 border-b-2 border-amber-900/30">
              <p className="text-xs text-amber-700 dark:text-amber-400 font-black uppercase mb-1">Total Votes</p>
              <p className="text-2xl font-black text-amber-900 dark:text-amber-200">
                🪙 {formatCurrency(startup.total_raised)}
              </p>
            </div>

            <div className="grid grid-cols-3 gap-2">
              <button
                onClick={() => handleEdit(startup)}
                className="px-3 py-2 bg-gradient-to-b from-blue-400 to-blue-600 border-2 border-blue-900 rounded-lg font-black text-white text-sm hover:from-blue-300 hover:to-blue-500 transition-all"
              >
                ✏️ Edit
              </button>
              <button
                onClick={() => handleToggleActive(startup)}
                className="px-3 py-2 bg-gradient-to-b from-yellow-400 to-yellow-600 border-2 border-yellow-900 rounded-lg font-black text-yellow-950 text-sm hover:from-yellow-300 hover:to-yellow-500 transition-all"
              >
                {startup.is_active ? '❌' : '✓'}
              </button>
              <button
                onClick={() => handleDelete(startup.id, startup.name)}
                className="px-3 py-2 bg-gradient-to-b from-red-400 to-red-600 border-2 border-red-900 rounded-lg font-black text-white text-sm hover:from-red-300 hover:to-red-500 transition-all"
              >
                🗑️
              </button>
            </div>
          </div>
        ))}
      </div>

      {allStartups.length === 0 && (
        <div className="game-card text-center py-12">
          <p className="text-4xl mb-3">🚀</p>
          <p className="text-xl font-black text-amber-700 dark:text-amber-400">No startups yet!</p>
          <p className="text-sm font-bold text-amber-600 dark:text-amber-500 mt-2">Create one to get started!</p>
        </div>
      )}
    </div>
  );
}

// Investments Tab (now "Votes")
function InvestmentsTab({ gameState }) {
  const investments = gameState?.investments || [];
  const startups = gameState?.startups || [];

  // Group votes by startup
  const votesByStartup = startups.map((startup) => ({
    ...startup,
    votes: investments.filter(inv => inv.startup_id === startup.id),
  }));

  // Sort by total votes descending
  const sortedStartups = votesByStartup.sort((a, b) => b.total_raised - a.total_raised);

  return (
    <div className="space-y-6">
      {sortedStartups.map((startup, idx) => (
        <div key={startup.id} className="game-card pop-in" style={{animationDelay: `${idx * 0.05}s`}}>
          <div className="mb-4 pb-4 border-b-4 border-amber-900/30">
            <div className="flex items-start justify-between mb-2">
              <h3 className="text-2xl font-black text-amber-900 dark:text-amber-100">{startup.name}</h3>
              <div className={`w-12 h-12 rounded-full border-4 flex items-center justify-center font-black text-xl shadow-[0_4px_0_0_rgba(120,53,15,1)] ${
                idx === 0 ? 'bg-gradient-to-br from-yellow-300 to-yellow-500 border-yellow-700' :
                idx === 1 ? 'bg-gradient-to-br from-gray-300 to-gray-400 border-gray-600' :
                idx === 2 ? 'bg-gradient-to-br from-orange-400 to-orange-600 border-orange-800' :
                'bg-gradient-to-br from-amber-400 to-amber-600 border-amber-900'
              }`}>
                {idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : `#${idx + 1}`}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-amber-700 dark:text-amber-400 font-black uppercase">Total Votes</p>
                <p className="text-2xl font-black text-amber-900 dark:text-amber-200">
                  🪙 {formatCurrency(startup.total_raised)}
                </p>
              </div>
              <div>
                <p className="text-xs text-amber-700 dark:text-amber-400 font-black uppercase">Voters</p>
                <p className="text-2xl font-black text-amber-900 dark:text-amber-200">
                  👥 {startup.votes.length}
                </p>
              </div>
            </div>
          </div>

          {startup.votes.length > 0 ? (
            <div className="space-y-2">
              {startup.votes
                .sort((a, b) => b.amount - a.amount)
                .map((vote) => (
                  <div
                    key={vote.id}
                    className="flex items-center justify-between py-3 px-4 bg-amber-400/20 rounded-xl border-2 border-amber-900/30 hover:border-amber-900 hover:bg-amber-400/30 transition-all"
                  >
                    <span className="font-black text-amber-900 dark:text-amber-100">{vote.investor_name}</span>
                    <div className="text-right">
                      <p className="font-black text-amber-900 dark:text-amber-200">
                        🪙 {formatCurrency(vote.amount)}
                      </p>
                      <p className="text-xs text-amber-700 dark:text-amber-400 font-bold">
                        {((vote.amount / startup.total_raised) * 100).toFixed(1)}% of total
                      </p>
                    </div>
                  </div>
                ))}
            </div>
          ) : (
            <p className="text-center text-amber-600 dark:text-amber-500 py-8 font-bold">No votes yet</p>
          )}
        </div>
      ))}

      {sortedStartups.length === 0 && (
        <div className="game-card text-center py-12">
          <p className="text-4xl mb-3">🗳️</p>
          <p className="text-xl font-black text-amber-700 dark:text-amber-400">No votes yet!</p>
        </div>
      )}
    </div>
  );
}

// Submissions Tab
function SubmissionsTab({ gameState }) {
  const submittedInvestors = (gameState?.investors || []).filter(inv => inv.submitted);
  const pendingInvestors = (gameState?.investors || []).filter(inv => !inv.submitted);

  return (
    <div className="space-y-6">
      {/* Summary Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="game-card text-center pop-in bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/30 dark:to-emerald-950/20">
          <p className="text-sm font-black text-green-700 dark:text-green-400 uppercase mb-2">✅ Locked</p>
          <p className="text-5xl font-black text-green-900 dark:text-green-200">{submittedInvestors.length}</p>
        </div>
        <div className="game-card text-center pop-in bg-gradient-to-br from-yellow-50 to-amber-50 dark:from-yellow-950/30 dark:to-amber-950/20" style={{animationDelay: '0.1s'}}>
          <p className="text-sm font-black text-yellow-700 dark:text-yellow-400 uppercase mb-2">⏳ Voting</p>
          <p className="text-5xl font-black text-yellow-900 dark:text-yellow-200">{pendingInvestors.length}</p>
        </div>
        <div className="game-card text-center pop-in bg-gradient-to-br from-blue-50 to-blue-50 dark:from-blue-950/30 dark:to-blue-950/20" style={{animationDelay: '0.2s'}}>
          <p className="text-sm font-black text-blue-700 dark:text-blue-400 uppercase mb-2">👥 Total</p>
          <p className="text-5xl font-black text-blue-900 dark:text-blue-200">{(gameState?.investors || []).length}</p>
        </div>
      </div>

      {/* Submitted Players */}
      <div className="game-card pop-in" style={{animationDelay: '0.3s'}}>
        <h3 className="text-2xl font-black text-amber-900 dark:text-amber-100 mb-4 flex items-center gap-2">
          <span className="text-3xl">✅</span> LOCKED VOTES
        </h3>
        {submittedInvestors.length > 0 ? (
          <div className="space-y-4">
            {submittedInvestors.map((investor) => {
              const votes = (gameState?.investments || []).filter(
                inv => inv.investor_id === investor.id
              );

              return (
                <div key={investor.id} className="border-4 border-green-900/30 rounded-2xl p-4 bg-green-500/10">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <h4 className="font-black text-lg text-amber-900 dark:text-amber-100">{investor.name}</h4>
                      <p className="text-sm font-bold text-amber-700 dark:text-amber-400">
                        Voted: <span className="font-black text-green-700 dark:text-green-400">🪙 {formatCurrency(investor.invested)}</span> / 🪙 {formatCurrency(investor.starting_credit)}
                      </p>
                    </div>
                    <span className="bg-gradient-to-r from-green-500 to-green-600 text-white text-xs font-black px-4 py-2 rounded-full border-2 border-green-900">
                      LOCKED
                    </span>
                  </div>

                  {votes.length > 0 ? (
                    <div className="space-y-2">
                      <p className="text-xs font-black text-amber-700 dark:text-amber-400 uppercase mb-2">Vote Breakdown:</p>
                      {votes.map((vote) => {
                        const startup = (gameState?.startups || []).find(s => s.id === vote.startup_id);
                        return (
                          <div key={vote.id} className="flex items-center justify-between bg-white dark:bg-amber-950/20 p-3 rounded-lg border-2 border-green-900/20">
                            <span className="font-bold text-amber-900 dark:text-amber-100">{startup?.name || 'Unknown'}</span>
                            <span className="font-black text-amber-900 dark:text-amber-200">🪙 {formatCurrency(vote.amount)}</span>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <p className="text-sm text-amber-600 dark:text-amber-500 italic">No votes made</p>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-8">
            <p className="text-4xl mb-2">⏰</p>
            <p className="text-lg font-black text-amber-700 dark:text-amber-400">No locked votes yet!</p>
          </div>
        )}
      </div>

      {/* Pending Players */}
      {pendingInvestors.length > 0 && (
        <div className="game-card pop-in" style={{animationDelay: '0.4s'}}>
          <h3 className="text-2xl font-black text-amber-900 dark:text-amber-100 mb-4 flex items-center gap-2">
            <span className="text-3xl">⏳</span> STILL VOTING
          </h3>
          <div className="space-y-2">
            {pendingInvestors.map((investor) => (
              <div key={investor.id} className="flex items-center justify-between bg-yellow-500/10 border-2 border-yellow-900/30 p-4 rounded-xl hover:border-yellow-900/50 transition-all">
                <span className="font-black text-amber-900 dark:text-amber-100">{investor.name}</span>
                <span className="text-sm text-yellow-700 dark:text-yellow-400 font-black">
                  {investor.invested > 0 ? `🪙 ${formatCurrency(investor.invested)} voted` : 'No votes yet'}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// Analytics Tab
function AnalyticsTab({ gameState }) {
  const investors = gameState?.investors || [];
  const startups = gameState?.startups || [];
  const investments = gameState?.investments || [];

  return (
    <div className="space-y-6">
      {/* Export Buttons */}
      <div className="game-card pop-in">
        <h3 className="text-2xl font-black text-amber-900 dark:text-amber-100 mb-4 flex items-center gap-2">
          <span className="text-3xl">📊</span> DATA EXPORT
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
          <button
            onClick={() => exportInvestorsToCSV(investors)}
            className="px-4 py-3 bg-gradient-to-b from-blue-400 to-blue-600 border-4 border-blue-900 rounded-xl font-black text-white text-sm min-h-[44px] flex items-center justify-center gap-2 hover:from-blue-300 hover:to-blue-500 transition-all"
          >
            👥 Players CSV
          </button>
          <button
            onClick={() => exportStartupsToCSV(startups)}
            className="px-4 py-3 bg-gradient-to-b from-purple-400 to-purple-600 border-4 border-purple-900 rounded-xl font-black text-white text-sm min-h-[44px] flex items-center justify-center gap-2 hover:from-purple-300 hover:to-purple-500 transition-all"
          >
            🚀 Startups CSV
          </button>
          <button
            onClick={() => exportInvestmentsToCSV(investments, investors, startups)}
            className="px-4 py-3 bg-gradient-to-b from-green-400 to-green-600 border-4 border-green-900 rounded-xl font-black text-white text-sm min-h-[44px] flex items-center justify-center gap-2 hover:from-green-300 hover:to-green-500 transition-all"
          >
            🗳️ Votes CSV
          </button>
          <button
            onClick={() => exportAllDataToCSV(investors, startups, investments)}
            className="px-4 py-3 bg-gradient-to-b from-amber-400 to-amber-600 border-4 border-amber-900 rounded-xl font-black text-amber-950 text-sm min-h-[44px] flex items-center justify-center gap-2 hover:from-amber-300 hover:to-amber-500 transition-all"
          >
            📦 ALL DATA
          </button>
        </div>
      </div>

      {/* Charts */}
      <div className="game-card pop-in" style={{animationDelay: '0.1s'}}>
        <InvestmentCharts />
      </div>
    </div>
  );
}

// Activity Tab
function ActivityTab({ gameState }) {
  return (
    <div className="game-card pop-in">
      <ActivityFeed />
    </div>
  );
}

// Audit Tab
function AuditTab() {
  return (
    <div className="game-card pop-in">
      <AuditTrail />
    </div>
  );
}

// Error Logs Tab
function ErrorLogsTab() {
  return (
    <div className="game-card pop-in">
      <ErrorLogs />
    </div>
  );
}
