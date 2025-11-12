import { useState, useEffect } from 'react';
import { useSocket } from '../context/SocketContext';
import { adminApi, api, formatCurrency, getFileUrl } from '../utils/api';
import ActivityFeed from '../components/admin/ActivityFeed';
import InvestmentCharts from '../components/admin/InvestmentCharts';
import AuditTrail from '../components/admin/AuditTrail';
import { exportInvestorsToCSV, exportStartupsToCSV, exportInvestmentsToCSV, exportAllDataToCSV } from '../utils/adminExport';

export default function AdminPage() {
  const [authenticated, setAuthenticated] = useState(false);
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('');
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const { gameState } = useSocket();

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // Try to fetch stats to verify credentials
      await adminApi.getStats(username, password);
      setAuthenticated(true);
      localStorage.setItem('admin_username', username);
      localStorage.setItem('admin_password', password);
    } catch (err) {
      setError('Invalid credentials');
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
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <div className="mb-6">
              <div className="inline-flex w-16 h-16 rounded-xl bg-slate-800/50 items-center justify-center border border-slate-700 mx-auto">
                <span className="text-3xl">🔐</span>
              </div>
            </div>
            <h1 className="text-3xl font-bold mb-2 text-slate-100">Admin Access</h1>
            <p className="text-slate-500 text-sm">Control Panel</p>
          </div>

          <div className="fintech-card">
            <form onSubmit={handleLogin} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-2 uppercase tracking-wider">
                  Username
                </label>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="input"
                  autoComplete="username"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-400 mb-2 uppercase tracking-wider">
                  Password
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="input"
                  autoComplete="current-password"
                />
              </div>

              {error && (
                <div className="border border-red-900/30 rounded-lg p-4 bg-red-950/20 text-red-400 text-sm">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="btn-primary w-full py-3 text-sm"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <div className="spinner w-4 h-4"></div>
                    Logging in...
                  </span>
                ) : (
                  'Login'
                )}
              </button>
            </form>
          </div>

          <div className="text-center mt-6">
            <a href="/" className="text-sm text-slate-500 hover:text-slate-300 font-medium transition-colors inline-flex items-center gap-2 group">
              <span className="group-hover:-translate-x-1 transition-transform">←</span>
              Back to Join
            </a>
          </div>
        </div>
      </div>
    );
  }

  const tabs = [
    { id: 'overview', name: '📊 Overview', emoji: '📊' },
    { id: 'investors', name: '👥 Investors', emoji: '👥' },
    { id: 'startups', name: '🚀 Startups', emoji: '🚀' },
    { id: 'investments', name: '💰 Investments', emoji: '💰' },
    { id: 'fund-requests', name: '💸 Fund Requests', emoji: '💸' },
    { id: 'submissions', name: '✅ Submissions', emoji: '✅' },
    { id: 'analytics', name: '📈 Analytics', emoji: '📈' },
    { id: 'activity', name: '⚡ Activity Feed', emoji: '⚡' },
    { id: 'audit', name: '📋 Audit Trail', emoji: '📋' },
  ];

  return (
    <div className="min-h-screen p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="fintech-card mb-8">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-slate-100 mb-1">
                Admin Dashboard
              </h1>
              <p className="text-sm text-slate-500">Control Panel</p>
            </div>
            <div className="flex items-center gap-3 flex-wrap">
              <GameLockButton username={username} password={password} />
              <button
                onClick={handleLogout}
                className="btn-secondary text-sm py-2.5 px-5"
              >
                Logout
              </button>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="mb-8">
          <div className="flex gap-2 sm:gap-3 overflow-x-auto pb-2 scrollbar-hide -mx-4 px-4">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-3 sm:px-5 py-2.5 sm:py-3 font-medium transition-all whitespace-nowrap rounded-lg text-xs sm:text-sm min-h-[44px] border flex-shrink-0 ${
                  activeTab === tab.id
                    ? 'bg-slate-800 border-slate-700 text-slate-200'
                    : 'bg-slate-900/30 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
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
        {activeTab === 'fund-requests' && (
          <FundRequestsTab username={username} password={password} />
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
      alert('Failed to toggle lock');
    } finally {
      setLoading(false);
    }
  };

  const isLocked = gameState?.isLocked || false;

  return (
    <button
      onClick={handleToggleLock}
      disabled={loading}
      className={`px-5 py-2.5 rounded-lg font-semibold transition-all text-white text-sm min-h-[44px] ${
        isLocked
          ? 'bg-amber-600 hover:bg-amber-700'
          : 'bg-emerald-600 hover:bg-emerald-700'
      }`}
    >
      {loading ? (
        <span className="flex items-center gap-2">
          <div className="spinner w-4 h-4 border-white border-t-white"></div>
        </span>
      ) : isLocked ? (
        <span className="flex items-center gap-2">
          <span>🔒</span> Locked
        </span>
      ) : (
        <span className="flex items-center gap-2">
          <span>🔓</span> Unlocked
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
        <div className="spinner mb-4"></div>
        <p className="text-slate-500 text-sm">Loading statistics...</p>
      </div>
    );
  }

  const topStartups = (gameState?.startups || [])
    .filter(s => s.total_raised > 0)
    .sort((a, b) => b.total_raised - a.total_raised)
    .slice(0, 5);

  return (
    <div className="space-y-8">
      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="border border-slate-800 rounded-lg p-5 bg-slate-900/30">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs text-slate-500 font-medium uppercase tracking-wider">Total Investors</p>
            <span className="text-2xl opacity-30">👥</span>
          </div>
          <p className="text-3xl font-bold text-slate-200">{stats.totalInvestors}</p>
        </div>
        <div className="border border-slate-800 rounded-lg p-5 bg-slate-900/30">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs text-slate-500 font-medium uppercase tracking-wider">Active Startups</p>
            <span className="text-2xl opacity-30">🚀</span>
          </div>
          <p className="text-3xl font-bold text-slate-200">{stats.totalStartups}</p>
        </div>
        <div className="border border-slate-800 rounded-lg p-5 bg-slate-900/30">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs text-slate-500 font-medium uppercase tracking-wider">Total Invested</p>
            <span className="text-2xl opacity-30">💰</span>
          </div>
          <p className="text-2xl font-bold text-slate-200">
            {formatCurrency(stats.totalInvested)}
          </p>
        </div>
        <div className="border border-slate-800 rounded-lg p-5 bg-slate-900/30">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs text-slate-500 font-medium uppercase tracking-wider">Investments</p>
            <span className="text-2xl opacity-30">📊</span>
          </div>
          <p className="text-3xl font-bold text-slate-200">{stats.totalInvestments}</p>
        </div>
      </div>

      {/* Top Startups */}
      {topStartups.length > 0 && (
        <div className="fintech-card">
          <h3 className="text-xl font-semibold mb-6 text-slate-200 flex items-center gap-2">
            <span className="text-2xl">🏆</span> Top Startups by Investment
          </h3>
          <div className="space-y-3">
            {topStartups.map((startup, index) => (
              <div key={startup.id} className="border border-slate-800 rounded-lg p-4 bg-slate-900/30 hover:bg-slate-800/50 transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <span className="text-3xl font-bold text-slate-500">
                      #{index + 1}
                    </span>
                    <div>
                      <p className="font-semibold text-slate-200 text-base">{startup.name}</p>
                    </div>
                  </div>
                  <p className="text-xl font-bold text-slate-200">
                    {formatCurrency(startup.total_raised)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// Investors Tab
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
      alert('Failed to update credit');
    }
  };

  const handleDelete = async (investorId, name) => {
    if (!confirm(`Delete investor "${name}"?`)) return;

    try {
      await adminApi.deleteInvestor(username, password, investorId);
      // Data will automatically refresh via WebSocket
    } catch (err) {
      alert('Failed to delete investor');
    }
  };

  return (
    <div className="space-y-4">
      {/* Desktop Table View */}
      <div className="hidden lg:block fintech-card overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b-2 border-slate-700">
              <th className="text-left py-4 px-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Name</th>
              <th className="text-center py-4 px-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Status</th>
              <th className="text-right py-4 px-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Starting Credit</th>
              <th className="text-right py-4 px-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Invested</th>
              <th className="text-right py-4 px-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Remaining</th>
              <th className="text-right py-4 px-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody>
            {investors.map((investor) => (
              <tr key={investor.id} className="border-b border-slate-800 hover:bg-slate-800/50 transition-colors">
                <td className="py-4 px-4">
                  <p className="font-bold text-slate-100">{investor.name}</p>
                </td>
                <td className="py-4 px-4 text-center">
                  {investor.submitted ? (
                    <span className="inline-block bg-green-700 text-green-100 text-xs font-bold px-3 py-1 rounded-full">
                      ✅ Submitted
                    </span>
                  ) : (
                    <span className="inline-block bg-yellow-700 text-yellow-100 text-xs font-bold px-3 py-1 rounded-full">
                      ⏳ Pending
                    </span>
                  )}
                </td>
                <td className="py-4 px-4 text-right">
                  {editingCredit === investor.id ? (
                    <input
                      type="number"
                      value={newCredit}
                      onChange={(e) => setNewCredit(e.target.value)}
                      className="input text-right w-32 py-1 text-sm"
                      autoFocus
                    />
                  ) : (
                    <span className="text-slate-200 font-semibold">{formatCurrency(investor.starting_credit)}</span>
                  )}
                </td>
                <td className="py-4 px-4 text-right text-blue-400 font-bold">
                  {formatCurrency(investor.invested)}
                </td>
                <td className="py-4 px-4 text-right text-green-400 font-bold">
                  {formatCurrency(investor.remaining)}
                </td>
                <td className="py-4 px-4 text-right">
                  <div className="flex items-center justify-end gap-2">
                    {editingCredit === investor.id ? (
                      <>
                        <button
                          onClick={() => handleUpdateCredit(investor.id)}
                          className="text-sm text-green-400 hover:text-green-300 font-bold min-h-[44px] px-3"
                        >
                          ✓ Save
                        </button>
                        <button
                          onClick={() => {
                            setEditingCredit(null);
                            setNewCredit('');
                          }}
                          className="text-sm text-slate-400 hover:text-slate-300 font-bold min-h-[44px] px-3"
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
                          className="text-sm text-blue-400 hover:text-blue-300 font-bold min-h-[44px] px-3"
                        >
                          ✏️ Edit
                        </button>
                        <button
                          onClick={() => handleDelete(investor.id, investor.name)}
                          className="text-sm text-red-400 hover:text-red-300 font-bold min-h-[44px] px-3"
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
          <div className="text-center py-8 text-slate-500 font-medium">
            No investors yet
          </div>
        )}
      </div>

      {/* Mobile/Tablet Card View */}
      <div className="lg:hidden space-y-4">
        {investors.map((investor) => (
          <div key={investor.id} className="fintech-card border-2 border-slate-700">
            <div className="flex items-start justify-between mb-3">
              <div>
                <h3 className="font-bold text-slate-100 text-lg">{investor.name}</h3>
                <div className="mt-1">
                  {investor.submitted ? (
                    <span className="inline-block bg-green-700 text-green-100 text-xs font-bold px-3 py-1 rounded-full">
                      ✅ Submitted
                    </span>
                  ) : (
                    <span className="inline-block bg-yellow-700 text-yellow-100 text-xs font-bold px-3 py-1 rounded-full">
                      ⏳ Pending
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <p className="text-xs text-slate-400 font-bold uppercase mb-1">Starting Credit</p>
                {editingCredit === investor.id ? (
                  <input
                    type="number"
                    value={newCredit}
                    onChange={(e) => setNewCredit(e.target.value)}
                    className="input w-full py-2 text-sm"
                    autoFocus
                  />
                ) : (
                  <p className="text-lg font-bold text-slate-100">{formatCurrency(investor.starting_credit)}</p>
                )}
              </div>
              <div>
                <p className="text-xs text-slate-400 font-bold uppercase mb-1">Invested</p>
                <p className="text-lg font-bold text-blue-400">{formatCurrency(investor.invested)}</p>
              </div>
              <div>
                <p className="text-xs text-slate-400 font-bold uppercase mb-1">Remaining</p>
                <p className="text-lg font-bold text-green-400">{formatCurrency(investor.remaining)}</p>
              </div>
              <div>
                <p className="text-xs text-slate-400 font-bold uppercase mb-1">Allocation</p>
                <p className="text-lg font-bold text-purple-400">
                  {investor.starting_credit > 0 ? Math.round((investor.invested / investor.starting_credit) * 100) : 0}%
                </p>
              </div>
            </div>

            <div className="flex gap-2 pt-3 border-t border-slate-700">
              {editingCredit === investor.id ? (
                <>
                  <button
                    onClick={() => handleUpdateCredit(investor.id)}
                    className="btn-primary flex-1 text-sm min-h-[44px]"
                  >
                    ✓ Save Changes
                  </button>
                  <button
                    onClick={() => {
                      setEditingCredit(null);
                      setNewCredit('');
                    }}
                    className="btn-secondary flex-1 text-sm min-h-[44px]"
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
                    className="btn-secondary flex-1 text-sm min-h-[44px]"
                  >
                    ✏️ Edit Credit
                  </button>
                  <button
                    onClick={() => handleDelete(investor.id, investor.name)}
                    className="bg-red-600 hover:bg-red-700 text-white flex-1 text-sm min-h-[44px] rounded-lg font-semibold transition-all"
                  >
                    🗑️ Delete
                  </button>
                </>
              )}
            </div>
          </div>
        ))}

        {investors.length === 0 && (
          <div className="text-center py-8 text-slate-500 font-medium fintech-card">
            No investors yet
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
      console.log('📝 Creating startup with data:', newStartup);
      await adminApi.createStartup(username, password, newStartup);
      setNewStartup(emptyForm);
      setShowCreateForm(false);
      alert('Startup created successfully!');
    } catch (err) {
      console.error('❌ Error creating startup:', err);
      alert(err.response?.data?.error || 'Failed to create startup');
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
      console.log('📝 Updating startup with data:', {
        ...editForm,
        logo: editForm.logo || '(empty)',
        pitch_deck: editForm.pitch_deck || '(empty)',
        ask: editForm.ask || '(empty)'
      });
      await adminApi.updateStartup(username, password, editingStartup.id, editForm);
      setEditingStartup(null);
      alert('Startup updated successfully!');
    } catch (err) {
      console.error('❌ Error updating startup:', err);
      alert(err.response?.data?.error || 'Failed to update startup');
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
      alert('Failed to update startup');
    }
  };

  const handleDelete = async (startupId, name) => {
    if (!confirm(`Delete startup "${name}"? This will also delete all investments in this startup.`)) return;

    try {
      await adminApi.deleteStartup(username, password, startupId);
      // Data will automatically refresh via WebSocket
    } catch (err) {
      alert('Failed to delete startup');
    }
  };

  const allStartups = gameState?.startups || [];

  return (
    <div className="space-y-4">
      {/* Create Button */}
      <div className="flex justify-end">
        <button
          onClick={() => setShowCreateForm(!showCreateForm)}
          className="btn-primary"
        >
          {showCreateForm ? 'Cancel' : '+ New Startup'}
        </button>
      </div>

      {/* Create Form */}
      {showCreateForm && (
        <div className="card-premium max-h-[80vh] overflow-y-auto">
          <h3 className="text-xl font-bold mb-4 text-gray-800">🚀 Create New Startup</h3>
          <form onSubmit={handleCreate} className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2 uppercase tracking-wide">
                  Name *
                </label>
                <input
                  type="text"
                  value={newStartup.name}
                  onChange={(e) => setNewStartup({ ...newStartup, name: e.target.value })}
                  className="input"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2 uppercase tracking-wide">
                  Slug * (URL-friendly identifier)
                </label>
                <input
                  type="text"
                  value={newStartup.slug}
                  onChange={(e) => setNewStartup({ ...newStartup, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-') })}
                  className="input"
                  required
                  placeholder="my-startup"
                />
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2 uppercase tracking-wide">
                Description
              </label>
              <textarea
                value={newStartup.description}
                onChange={(e) => setNewStartup({ ...newStartup, description: e.target.value })}
                className="input"
                rows="3"
              />
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2 uppercase tracking-wide">
                  Logo (PNG/JPG)
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newStartup.logo}
                    onChange={(e) => setNewStartup({ ...newStartup, logo: e.target.value })}
                    className="input flex-1"
                    placeholder="/uploads/logo.png"
                    readOnly
                  />
                  <label className="btn-secondary cursor-pointer whitespace-nowrap">
                    📁 Upload
                    <input
                      type="file"
                      accept="image/png,image/jpeg,image/jpg"
                      className="hidden"
                      onChange={async (e) => {
                        const file = e.target.files[0];
                        if (file) {
                          try {
                            console.log('📤 Uploading logo:', file.name, file.type);
                            const result = await adminApi.uploadFile(username, password, file);
                            console.log('✅ Logo uploaded:', result);
                            setNewStartup({ ...newStartup, logo: result.url });
                          } catch (err) {
                            console.error('❌ Logo upload error:', err);
                            const errorMsg = err.response?.data?.error || 'Failed to upload logo';
                            alert(errorMsg);
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
                    className="mt-2 h-16 w-16 object-contain border rounded"
                    onError={(e) => {
                      console.error('❌ Admin preview failed to load:', newStartup.logo, 'Full URL:', getFileUrl(newStartup.logo));
                      e.target.style.display = 'none';
                    }}
                    onLoad={() => console.log('✅ Admin preview loaded:', newStartup.logo)}
                  />
                )}
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2 uppercase tracking-wide">
                  Pitch Deck (PDF/PPT)
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newStartup.pitch_deck}
                    onChange={(e) => setNewStartup({ ...newStartup, pitch_deck: e.target.value })}
                    className="input flex-1"
                    placeholder="/uploads/deck.pdf"
                    readOnly
                  />
                  <label className="btn-secondary cursor-pointer whitespace-nowrap">
                    📁 Upload
                    <input
                      type="file"
                      accept=".pdf,.ppt,.pptx"
                      className="hidden"
                      onChange={async (e) => {
                        const file = e.target.files[0];
                        if (file) {
                          try {
                            console.log('📤 Uploading pitch deck:', file.name, file.type);
                            const result = await adminApi.uploadFile(username, password, file);
                            console.log('✅ Pitch deck uploaded:', result);
                            setNewStartup({ ...newStartup, pitch_deck: result.url });
                          } catch (err) {
                            console.error('❌ Pitch deck upload error:', err);
                            const errorMsg = err.response?.data?.error || 'Failed to upload pitch deck';
                            alert(errorMsg);
                          }
                        }
                      }}
                    />
                  </label>
                </div>
                {newStartup.pitch_deck && (
                  <a href={getFileUrl(newStartup.pitch_deck)} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-600 hover:underline mt-1 inline-block">
                    View uploaded file →
                  </a>
                )}
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2 uppercase tracking-wide">
                  Cohort
                </label>
                <input
                  type="text"
                  value={newStartup.cohort}
                  onChange={(e) => setNewStartup({ ...newStartup, cohort: e.target.value })}
                  className="input"
                  placeholder="B&A2024, B&A2025"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2 uppercase tracking-wide">
                  Support Program
                </label>
                <input
                  type="text"
                  value={newStartup.support_program}
                  onChange={(e) => setNewStartup({ ...newStartup, support_program: e.target.value })}
                  className="input"
                  placeholder="IVP 2025 Finalists"
                />
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2 uppercase tracking-wide">
                  Industry
                </label>
                <input
                  type="text"
                  value={newStartup.industry}
                  onChange={(e) => setNewStartup({ ...newStartup, industry: e.target.value })}
                  className="input"
                  placeholder="AdTech, FinTech, etc."
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2 uppercase tracking-wide">
                  Email
                </label>
                <input
                  type="email"
                  value={newStartup.email}
                  onChange={(e) => setNewStartup({ ...newStartup, email: e.target.value })}
                  className="input"
                  placeholder="founder@startup.com"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2 uppercase tracking-wide">
                Team
              </label>
              <textarea
                value={newStartup.team}
                onChange={(e) => setNewStartup({ ...newStartup, team: e.target.value })}
                className="input"
                rows="2"
                placeholder="Founder Name - CEO, Co-founder Name - CTO"
              />
            </div>

            <div className="grid md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2 uppercase tracking-wide">
                  Generating Revenue
                </label>
                <select
                  value={newStartup.generating_revenue}
                  onChange={(e) => setNewStartup({ ...newStartup, generating_revenue: e.target.value })}
                  className="input"
                >
                  <option value="">Select...</option>
                  <option value="Yes">Yes</option>
                  <option value="No">No</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2 uppercase tracking-wide">
                  Ask
                </label>
                <input
                  type="text"
                  value={newStartup.ask}
                  onChange={(e) => setNewStartup({ ...newStartup, ask: e.target.value })}
                  className="input"
                  placeholder="$250,000"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2 uppercase tracking-wide">
                  Legal Entity
                </label>
                <input
                  type="text"
                  value={newStartup.legal_entity}
                  onChange={(e) => setNewStartup({ ...newStartup, legal_entity: e.target.value })}
                  className="input"
                  placeholder="Yes (UK)"
                />
              </div>
            </div>

            <button type="submit" disabled={creating} className="btn-primary w-full">
              {creating ? 'Creating...' : '✓ Create Startup'}
            </button>
          </form>
        </div>
      )}

      {/* Edit Modal */}
      {editingStartup && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="card-premium max-w-4xl w-full my-8">
            <h3 className="text-2xl font-bold mb-4 text-gray-800">✏️ Edit Startup</h3>
            <form onSubmit={handleUpdate} className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2 uppercase tracking-wide">
                    Name *
                  </label>
                  <input
                    type="text"
                    value={editForm.name}
                    onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                    className="input"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2 uppercase tracking-wide">
                    Slug * (URL-friendly identifier)
                  </label>
                  <input
                    type="text"
                    value={editForm.slug}
                    onChange={(e) => setEditForm({ ...editForm, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-') })}
                    className="input"
                    required
                    placeholder="my-startup"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2 uppercase tracking-wide">
                  Description
                </label>
                <textarea
                  value={editForm.description}
                  onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                  className="input"
                  rows="3"
                />
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2 uppercase tracking-wide">
                    Logo (PNG/JPG)
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={editForm.logo}
                      onChange={(e) => setEditForm({ ...editForm, logo: e.target.value })}
                      className="input flex-1"
                      readOnly
                    />
                    <label className="btn-secondary cursor-pointer whitespace-nowrap">
                      📁 Upload
                      <input
                        type="file"
                        accept="image/png,image/jpeg,image/jpg"
                        className="hidden"
                        onChange={async (e) => {
                          const file = e.target.files[0];
                          if (file) {
                            try {
                              console.log('📤 Uploading logo (edit):', file.name, file.type);
                              const result = await adminApi.uploadFile(username, password, file);
                              console.log('✅ Logo uploaded (edit):', result);
                              setEditForm({ ...editForm, logo: result.url });
                            } catch (err) {
                              console.error('❌ Logo upload error (edit):', err);
                              const errorMsg = err.response?.data?.error || 'Failed to upload logo';
                              alert(errorMsg);
                            }
                          }
                        }}
                      />
                    </label>
                  </div>
                  {editForm.logo && (
                    <img 
                      src={getFileUrl(editForm.logo)} 
                      alt="Logo preview" 
                      className="mt-2 h-16 w-16 object-contain border rounded"
                      onError={(e) => {
                        console.error('❌ Edit preview failed to load:', editForm.logo, 'Full URL:', getFileUrl(editForm.logo));
                        e.target.style.display = 'none';
                      }}
                      onLoad={() => console.log('✅ Edit preview loaded:', editForm.logo)}
                    />
                  )}
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2 uppercase tracking-wide">
                    Pitch Deck (PDF/PPT)
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={editForm.pitch_deck}
                      onChange={(e) => setEditForm({ ...editForm, pitch_deck: e.target.value })}
                      className="input flex-1"
                      readOnly
                    />
                    <label className="btn-secondary cursor-pointer whitespace-nowrap">
                      📁 Upload
                      <input
                        type="file"
                        accept=".pdf,.ppt,.pptx"
                        className="hidden"
                        onChange={async (e) => {
                          const file = e.target.files[0];
                          if (file) {
                            try {
                              console.log('📤 Uploading pitch deck (edit):', file.name, file.type);
                              const result = await adminApi.uploadFile(username, password, file);
                              console.log('✅ Pitch deck uploaded (edit):', result);
                              setEditForm({ ...editForm, pitch_deck: result.url });
                            } catch (err) {
                              console.error('❌ Pitch deck upload error (edit):', err);
                              const errorMsg = err.response?.data?.error || 'Failed to upload pitch deck';
                              alert(errorMsg);
                            }
                          }
                        }}
                      />
                    </label>
                  </div>
                  {editForm.pitch_deck && (
                    <a href={getFileUrl(editForm.pitch_deck)} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-600 hover:underline mt-1 inline-block">
                      View file →
                    </a>
                  )}
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2 uppercase tracking-wide">
                    Cohort
                  </label>
                  <input
                    type="text"
                    value={editForm.cohort}
                    onChange={(e) => setEditForm({ ...editForm, cohort: e.target.value })}
                    className="input"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2 uppercase tracking-wide">
                    Support Program
                  </label>
                  <input
                    type="text"
                    value={editForm.support_program}
                    onChange={(e) => setEditForm({ ...editForm, support_program: e.target.value })}
                    className="input"
                  />
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2 uppercase tracking-wide">
                    Industry
                  </label>
                  <input
                    type="text"
                    value={editForm.industry}
                    onChange={(e) => setEditForm({ ...editForm, industry: e.target.value })}
                    className="input"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2 uppercase tracking-wide">
                    Email
                  </label>
                  <input
                    type="email"
                    value={editForm.email}
                    onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                    className="input"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2 uppercase tracking-wide">
                  Team
                </label>
                <textarea
                  value={editForm.team}
                  onChange={(e) => setEditForm({ ...editForm, team: e.target.value })}
                  className="input"
                  rows="2"
                />
              </div>

              <div className="grid md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2 uppercase tracking-wide">
                    Generating Revenue
                  </label>
                  <select
                    value={editForm.generating_revenue}
                    onChange={(e) => setEditForm({ ...editForm, generating_revenue: e.target.value })}
                    className="input"
                  >
                    <option value="">Select...</option>
                    <option value="Yes">Yes</option>
                    <option value="No">No</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2 uppercase tracking-wide">
                    Ask
                  </label>
                  <input
                    type="text"
                    value={editForm.ask}
                    onChange={(e) => setEditForm({ ...editForm, ask: e.target.value })}
                    className="input"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2 uppercase tracking-wide">
                    Legal Entity
                  </label>
                  <input
                    type="text"
                    value={editForm.legal_entity}
                    onChange={(e) => setEditForm({ ...editForm, legal_entity: e.target.value })}
                    className="input"
                  />
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setEditingStartup(null)}
                  className="btn-secondary flex-1"
                  disabled={updating}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={updating}
                  className="btn-primary flex-1"
                >
                  {updating ? 'Updating...' : '✓ Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Startups List */}
      <div className="grid gap-4 md:grid-cols-2">
        {allStartups.map((startup) => (
          <div key={startup.id} className="card-hover">
            <div className="flex items-start justify-between mb-3">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="text-xl font-bold text-gray-900">{startup.name}</h3>
                  <span className={`badge ${startup.is_active ? 'badge-success' : 'badge-danger'}`}>
                    {startup.is_active ? '✓ Active' : '✗ Inactive'}
                  </span>
                </div>
                <p className="text-xs text-gray-600 font-mono">/{startup.slug}</p>
              </div>
            </div>

            {startup.description && (
              <p className="text-sm text-gray-600 mb-3">{startup.description}</p>
            )}

            <div className="mb-3 pb-3 border-b-2 border-gold-200">
              <p className="text-xs text-gray-600 mb-1 font-bold uppercase">Total Raised</p>
              <p className="text-2xl font-bold text-gradient-gold">
                {formatCurrency(startup.total_raised)}
              </p>
            </div>

            <div className="grid grid-cols-3 gap-2">
              <button
                onClick={() => handleEdit(startup)}
                className="btn-secondary text-sm"
              >
                ✏️ Edit
              </button>
              <button
                onClick={() => handleToggleActive(startup)}
                className="btn-secondary text-sm"
              >
                {startup.is_active ? '❌' : '✓'}
              </button>
              <button
                onClick={() => handleDelete(startup.id, startup.name)}
                className="btn-danger text-sm"
              >
                🗑️
              </button>
            </div>
          </div>
        ))}
      </div>

      {allStartups.length === 0 && (
        <div className="card text-center text-gray-500 font-medium">
          No startups yet. Create one to get started!
        </div>
      )}
    </div>
  );
}

// Investments Tab
function InvestmentsTab({ gameState }) {
  const investments = gameState?.investments || [];
  const startups = gameState?.startups || [];

  // Group investments by startup
  const investmentsByStartup = startups.map((startup) => ({
    ...startup,
    investments: investments.filter(inv => inv.startup_id === startup.id),
  }));

  return (
    <div className="space-y-6">
      {investmentsByStartup.map((startup) => (
        <div key={startup.id} className="card-premium">
          <div className="mb-4 pb-4 border-b-2 border-gold-300">
            <h3 className="text-2xl font-bold text-gray-900 mb-2">{startup.name}</h3>
            <div className="flex items-center gap-6">
              <div>
                <p className="text-xs text-gray-600 font-bold uppercase">Total Raised</p>
                <p className="text-xl font-bold text-gradient-gold">
                  {formatCurrency(startup.total_raised)}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-600 font-bold uppercase">Investors</p>
                <p className="text-xl font-bold text-gray-900">
                  {startup.investments.length}
                </p>
              </div>
            </div>
          </div>

          {startup.investments.length > 0 ? (
            <div className="space-y-2">
              {startup.investments
                .sort((a, b) => b.amount - a.amount)
                .map((inv) => (
                  <div
                    key={inv.id}
                    className="flex items-center justify-between py-3 px-4 bg-gradient-to-r from-gold-50 to-amber-50 rounded-lg border border-gold-200 hover:border-gold-400 transition-all"
                  >
                    <span className="font-bold text-gray-900">{inv.investor_name}</span>
                    <div className="text-right">
                      <p className="font-bold text-gold-700">
                        {formatCurrency(inv.amount)}
                      </p>
                      <p className="text-xs text-gray-600 font-medium">
                        {((inv.amount / startup.total_raised) * 100).toFixed(1)}% of total
                      </p>
                    </div>
                  </div>
                ))}
            </div>
          ) : (
            <p className="text-center text-gray-500 py-4 font-medium">No investments yet</p>
          )}
        </div>
      ))}

      {investmentsByStartup.length === 0 && (
        <div className="card text-center text-gray-500 font-medium">
          No investments yet
        </div>
      )}
    </div>
  );
}

// Fund Requests Tab - View and manage fund requests
function FundRequestsTab({ username, password }) {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // all, pending, approved, rejected
  const [processingId, setProcessingId] = useState(null);
  const { gameState } = useSocket();

  const loadRequests = async () => {
    setLoading(true);
    try {
      const { requests: data } = await adminApi.getFundsRequests(username, password);
      setRequests(data);
      console.log('📋 Loaded fund requests:', data.length);
    } catch (err) {
      console.error('Failed to load fund requests:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRequests();
  }, [username, password]);

  // Auto-refresh when game state changes (after approval/rejection)
  useEffect(() => {
    if (gameState) {
      console.log('🔄 Game state updated, reloading fund requests...');
      loadRequests();
    }
  }, [gameState]);

  const handleApprove = async (requestId, investorName, requestedAmount) => {
    if (!confirm(`Approve fund request from ${investorName} for ${formatCurrency(requestedAmount)}?`)) return;

    setProcessingId(requestId);
    try {
      console.log('🔄 Approving request:', requestId);
      const result = await adminApi.approveFundsRequest(
        username,
        password,
        requestId,
        'Approved',
        username
      );
      console.log('✅ Approval result:', result);

      // Reload to get fresh data from server
      console.log('🔄 Reloading fund requests...');
      await loadRequests();
      console.log('✅ Fund requests reloaded');

      // Show success message
      const message = result.message || 
        `✅ Fund request approved!\n\nInvestor: ${investorName}\nAmount Added: ${formatCurrency(requestedAmount)}\nNew Total Credit: ${result.newCredit ? formatCurrency(result.newCredit) : 'Updated'}`;
      
      alert(message);
      
      console.log('✅ Fund request approved successfully');
    } catch (err) {
      console.error('❌ Approval error:', err);
      const errorMsg = err.response?.data?.details || err.response?.data?.error || err.message;
      alert('Failed to approve request: ' + errorMsg);
      // Reload in case of error to show correct state
      console.log('🔄 Reloading after error...');
      await loadRequests();
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async (requestId, investorName) => {
    const reason = prompt(`Reject fund request from ${investorName}?\n\nEnter rejection reason:`);
    if (!reason) return;

    setProcessingId(requestId);
    try {
      const result = await adminApi.rejectFundsRequest(
        username,
        password,
        requestId,
        reason,
        username
      );

      // Reload to get fresh data from server
      await loadRequests();

      const message = result.message || `❌ Fund request rejected`;
      alert(message);
      
      console.log('✅ Fund request rejected successfully');
    } catch (err) {
      console.error('Rejection error:', err);
      const errorMsg = err.response?.data?.details || err.response?.data?.error || err.message;
      alert('Failed to reject request: ' + errorMsg);
      // Reload in case of error to show correct state
      await loadRequests();
    } finally {
      setProcessingId(null);
    }
  };

  const handleDelete = async (requestId, investorName) => {
    if (!confirm(`Permanently delete this fund request from ${investorName}?\n\nThis action cannot be undone.`)) return;

    setProcessingId(requestId);
    try {
      await adminApi.deleteFundsRequest(username, password, requestId);

      // Remove from local state immediately for instant feedback
      setRequests(prev => prev.filter(req => req.id !== requestId));

      alert(`🗑️ Fund request deleted successfully`);
    } catch (err) {
      alert('Failed to delete request: ' + (err.response?.data?.error || err.message));
      // Reload in case of error to show correct state
      await loadRequests();
    } finally {
      setProcessingId(null);
    }
  };

  const filteredRequests = requests.filter(req => {
    if (filter === 'all') return true;
    return req.status === filter;
  });

  const pendingCount = requests.filter(r => r.status === 'pending').length;
  const approvedCount = requests.filter(r => r.status === 'approved').length;
  const rejectedCount = requests.filter(r => r.status === 'rejected').length;

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <div className="spinner mb-4"></div>
        <p className="text-slate-500 text-sm">Loading fund requests...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="card bg-gradient-to-br from-slate-800 to-slate-900 border-2 border-slate-700">
          <p className="text-sm font-bold text-slate-400 uppercase mb-2">📋 Total</p>
          <p className="text-4xl font-bold text-slate-100">{requests.length}</p>
        </div>
        <div className="card bg-gradient-to-br from-yellow-900/30 to-yellow-800/20 border-2 border-yellow-700/50">
          <p className="text-sm font-bold text-yellow-400 uppercase mb-2">⏳ Pending</p>
          <p className="text-4xl font-bold text-yellow-300">{pendingCount}</p>
        </div>
        <div className="card bg-gradient-to-br from-green-900/30 to-green-800/20 border-2 border-green-700/50">
          <p className="text-sm font-bold text-green-400 uppercase mb-2">✅ Approved</p>
          <p className="text-4xl font-bold text-green-300">{approvedCount}</p>
        </div>
        <div className="card bg-gradient-to-br from-red-900/30 to-red-800/20 border-2 border-red-700/50">
          <p className="text-sm font-bold text-red-400 uppercase mb-2">❌ Rejected</p>
          <p className="text-4xl font-bold text-red-300">{rejectedCount}</p>
        </div>
      </div>

      {/* Filter Buttons */}
      <div className="flex gap-2 flex-wrap">
        <button
          onClick={() => setFilter('all')}
          className={`px-4 py-2 rounded-lg font-semibold text-sm transition-all ${
            filter === 'all'
              ? 'bg-slate-700 text-slate-100'
              : 'bg-slate-800/50 text-slate-400 hover:text-slate-200'
          }`}
        >
          All ({requests.length})
        </button>
        <button
          onClick={() => setFilter('pending')}
          className={`px-4 py-2 rounded-lg font-semibold text-sm transition-all ${
            filter === 'pending'
              ? 'bg-yellow-700 text-yellow-100'
              : 'bg-slate-800/50 text-slate-400 hover:text-slate-200'
          }`}
        >
          Pending ({pendingCount})
        </button>
        <button
          onClick={() => setFilter('approved')}
          className={`px-4 py-2 rounded-lg font-semibold text-sm transition-all ${
            filter === 'approved'
              ? 'bg-green-700 text-green-100'
              : 'bg-slate-800/50 text-slate-400 hover:text-slate-200'
          }`}
        >
          Approved ({approvedCount})
        </button>
        <button
          onClick={() => setFilter('rejected')}
          className={`px-4 py-2 rounded-lg font-semibold text-sm transition-all ${
            filter === 'rejected'
              ? 'bg-red-700 text-red-100'
              : 'bg-slate-800/50 text-slate-400 hover:text-slate-200'
          }`}
        >
          Rejected ({rejectedCount})
        </button>
      </div>

      {/* Fund Requests List */}
      <div className="space-y-4">
        {filteredRequests.length === 0 ? (
          <div className="card text-center py-12">
            <p className="text-slate-500">No {filter !== 'all' ? filter : ''} fund requests</p>
          </div>
        ) : (
          filteredRequests.map((request) => (
            <div
              key={request.id}
              className={`card border-2 ${
                request.status === 'pending'
                  ? 'border-yellow-700/50 bg-yellow-900/10'
                  : request.status === 'approved'
                  ? 'border-green-700/50 bg-green-900/10'
                  : 'border-red-700/50 bg-red-900/10'
              }`}
            >
              <div className="flex flex-col gap-4">
                {/* Request Info */}
                <div className="flex-1">
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 mb-3">
                    <div className="flex-1">
                      <h3 className="text-lg font-bold text-slate-100 mb-1">
                        {request.investor_name}
                      </h3>
                      <p className="text-sm text-slate-400">{request.investor_email}</p>
                    </div>
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-bold uppercase self-start ${
                        request.status === 'pending'
                          ? 'bg-yellow-700 text-yellow-100'
                          : request.status === 'approved'
                          ? 'bg-green-700 text-green-100'
                          : 'bg-red-700 text-red-100'
                      }`}
                    >
                      {request.status}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 mb-4">
                    <div>
                      <p className="text-xs text-slate-500 uppercase font-bold mb-1">
                        Requested Amount
                      </p>
                      <p className="text-lg sm:text-xl font-bold text-slate-100">
                        {formatCurrency(request.amount)}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500 uppercase font-bold mb-1">
                        Current Credit
                      </p>
                      <p className="text-lg sm:text-xl font-bold text-slate-300">
                        {formatCurrency(request.current_credit)}
                      </p>
                    </div>
                    <div className="col-span-2 lg:col-span-1">
                      <p className="text-xs text-slate-500 uppercase font-bold mb-1">
                        Submitted
                      </p>
                      <p className="text-sm text-slate-400">
                        {new Date(request.created_at).toLocaleDateString()} at{' '}
                        {new Date(request.created_at).toLocaleTimeString()}
                      </p>
                    </div>
                  </div>

                  <div className="mb-3">
                    <p className="text-xs text-slate-500 uppercase font-bold mb-2">
                      Justification
                    </p>
                    <p className="text-sm text-slate-300 bg-slate-900/50 rounded-lg p-3 border border-slate-800">
                      {request.reason}
                    </p>
                  </div>

                  {request.admin_notes && (
                    <div>
                      <p className="text-xs text-slate-500 uppercase font-bold mb-2">
                        Admin Response
                      </p>
                      <p className="text-sm text-slate-300 bg-slate-900/50 rounded-lg p-3 border border-slate-800">
                        {request.admin_notes}
                        {request.reviewed_by && (
                          <span className="text-xs text-slate-500 ml-2">
                            - by {request.reviewed_by}
                          </span>
                        )}
                      </p>
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="pt-3 border-t border-slate-700 relative z-10">
                  {request.status === 'pending' ? (
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          console.log('✅ Approve button clicked for request:', request.id);
                          handleApprove(request.id, request.investor_name, request.amount);
                        }}
                        disabled={processingId === request.id}
                        className="btn-primary py-3 px-4 text-sm disabled:opacity-50 min-h-[48px] relative z-10 pointer-events-auto cursor-pointer touch-manipulation active:scale-95"
                        style={{ WebkitTapHighlightColor: 'transparent' }}
                      >
                        {processingId === request.id ? (
                          <span className="flex items-center justify-center gap-2">
                            <div className="spinner w-4 h-4"></div>
                            Processing...
                          </span>
                        ) : (
                          '✅ Approve'
                        )}
                      </button>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          console.log('❌ Reject button clicked for request:', request.id);
                          handleReject(request.id, request.investor_name);
                        }}
                        disabled={processingId === request.id}
                        className="bg-red-600 hover:bg-red-700 active:bg-red-800 text-white py-3 px-4 rounded-lg font-semibold text-sm transition-all disabled:opacity-50 min-h-[48px] relative z-10 pointer-events-auto cursor-pointer touch-manipulation active:scale-95"
                        style={{ WebkitTapHighlightColor: 'transparent' }}
                      >
                        {processingId === request.id ? (
                          <span className="flex items-center justify-center gap-2">
                            <div className="spinner w-4 h-4"></div>
                            Processing...
                          </span>
                        ) : (
                          '❌ Reject'
                        )}
                      </button>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          console.log('🗑️ Delete button clicked for request:', request.id);
                          handleDelete(request.id, request.investor_name);
                        }}
                        disabled={processingId === request.id}
                        className="bg-slate-600 hover:bg-slate-700 active:bg-slate-800 text-white py-3 px-4 rounded-lg font-semibold text-sm transition-all disabled:opacity-50 min-h-[48px] relative z-10 pointer-events-auto cursor-pointer touch-manipulation active:scale-95"
                        style={{ WebkitTapHighlightColor: 'transparent' }}
                      >
                        {processingId === request.id ? (
                          <span className="flex items-center justify-center gap-2">
                            <div className="spinner w-4 h-4"></div>
                            Processing...
                          </span>
                        ) : (
                          '🗑️ Delete'
                        )}
                      </button>
                    </div>
                  ) : (
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                      <div className="text-xs text-slate-400">
                        <span className="font-semibold text-slate-300">Reviewed by:</span> {request.reviewed_by || 'Unknown'}
                        {request.reviewed_at && (
                          <span className="ml-2">
                            on {new Date(request.reviewed_at).toLocaleDateString()} at {new Date(request.reviewed_at).toLocaleTimeString()}
                          </span>
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          console.log('🗑️ Delete button clicked for request:', request.id);
                          handleDelete(request.id, request.investor_name);
                        }}
                        disabled={processingId === request.id}
                        className="bg-slate-600 hover:bg-slate-700 active:bg-slate-800 text-white py-3 px-4 rounded-lg font-semibold text-sm transition-all disabled:opacity-50 min-h-[48px] relative z-10 pointer-events-auto cursor-pointer touch-manipulation active:scale-95 w-full sm:w-auto"
                        style={{ WebkitTapHighlightColor: 'transparent' }}
                      >
                        {processingId === request.id ? (
                          <span className="flex items-center justify-center gap-2">
                            <div className="spinner w-4 h-4"></div>
                            Deleting...
                          </span>
                        ) : (
                          '🗑️ Delete'
                        )}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

// Submissions Tab - Shows who submitted and what they voted for
function SubmissionsTab({ gameState }) {
  const submittedInvestors = (gameState?.investors || []).filter(inv => inv.submitted);
  const pendingInvestors = (gameState?.investors || []).filter(inv => !inv.submitted);

  return (
    <div className="space-y-6">
      {/* Summary Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="card bg-gradient-to-br from-green-50 to-emerald-100 border-2 border-green-300">
          <p className="text-sm font-bold text-green-700 uppercase mb-2">✅ Submitted</p>
          <p className="text-4xl font-bold text-green-900">{submittedInvestors.length}</p>
        </div>
        <div className="card bg-gradient-to-br from-yellow-50 to-amber-100 border-2 border-yellow-300">
          <p className="text-sm font-bold text-yellow-700 uppercase mb-2">⏳ Pending</p>
          <p className="text-4xl font-bold text-yellow-900">{pendingInvestors.length}</p>
        </div>
        <div className="card bg-gradient-to-br from-blue-50 to-blue-100 border-2 border-blue-300">
          <p className="text-sm font-bold text-blue-700 uppercase mb-2">👥 Total</p>
          <p className="text-4xl font-bold text-blue-900">{(gameState?.investors || []).length}</p>
        </div>
      </div>

      {/* Submitted Investors */}
      <div className="card">
        <h3 className="text-xl font-bold text-gray-800 mb-4">✅ Submitted Investments</h3>
        {submittedInvestors.length > 0 ? (
          <div className="space-y-4">
            {submittedInvestors.map((investor) => {
              const investments = (gameState?.investments || []).filter(
                inv => inv.investor_id === investor.id
              );

              return (
                <div key={investor.id} className="border-2 border-green-200 rounded-lg p-4 bg-green-50">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <h4 className="font-bold text-lg text-gray-900">{investor.name}</h4>
                      <p className="text-sm text-gray-600">
                        Invested: <span className="font-bold text-green-700">{formatCurrency(investor.invested)}</span> / {formatCurrency(investor.starting_credit)}
                      </p>
                    </div>
                    <span className="bg-green-600 text-white text-xs font-bold px-3 py-1 rounded-full">
                      SUBMITTED
                    </span>
                  </div>

                  {investments.length > 0 ? (
                    <div className="space-y-2">
                      <p className="text-xs font-bold text-gray-700 uppercase mb-2">Investment Breakdown:</p>
                      {investments.map((inv) => {
                        const startup = (gameState?.startups || []).find(s => s.id === inv.startup_id);
                        return (
                          <div key={inv.id} className="flex items-center justify-between bg-white p-3 rounded-lg border border-green-200">
                            <span className="font-medium text-gray-900">{startup?.name || 'Unknown'}</span>
                            <span className="font-bold text-gold-700">{formatCurrency(inv.amount)}</span>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500 italic">No investments made</p>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <p className="text-center text-gray-500 py-4">No submissions yet</p>
        )}
      </div>

      {/* Pending Investors */}
      {pendingInvestors.length > 0 && (
        <div className="card">
          <h3 className="text-xl font-bold text-gray-800 mb-4">⏳ Pending Submissions</h3>
          <div className="space-y-2">
            {pendingInvestors.map((investor) => (
              <div key={investor.id} className="flex items-center justify-between bg-yellow-50 border border-yellow-200 p-3 rounded-lg">
                <span className="font-medium text-gray-900">{investor.name}</span>
                <span className="text-sm text-yellow-700 font-bold">
                  {investor.invested > 0 ? `${formatCurrency(investor.invested)} invested` : 'No investments'}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// Analytics Tab - Investment Charts & Visualizations
function AnalyticsTab({ gameState }) {
  const investors = gameState?.investors || [];
  const startups = gameState?.startups || [];
  const investments = gameState?.investments || [];

  return (
    <div className="space-y-6">
      {/* Export Buttons */}
      <div className="card-executive">
        <h3 className="text-xl font-bold text-slate-100 mb-4 flex items-center gap-2">
          <svg className="w-6 h-6 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
          </svg>
          Data Export
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
          <button
            onClick={() => exportInvestorsToCSV(investors)}
            className="btn-secondary text-sm py-3 min-h-[44px] flex items-center justify-center gap-2"
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z" />
            </svg>
            <span>Export Investors</span>
          </button>
          <button
            onClick={() => exportStartupsToCSV(startups)}
            className="btn-secondary text-sm py-3 min-h-[44px] flex items-center justify-center gap-2"
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M12.395 2.553a1 1 0 00-1.45-.385c-.345.23-.614.558-.822.88-.214.33-.403.713-.57 1.116-.334.804-.614 1.768-.84 2.734a31.365 31.365 0 00-.613 3.58 2.64 2.64 0 01-.945-1.067c-.328-.68-.398-1.534-.398-2.654A1 1 0 005.05 6.05 6.981 6.981 0 003 11a7 7 0 1011.95-4.95c-.592-.591-.98-.985-1.348-1.467-.363-.476-.724-1.063-1.207-2.03zM12.12 15.12A3 3 0 017 13s.879.5 2.5.5c0-1 .5-4 1.25-4.5.5 1 .786 1.293 1.371 1.879A2.99 2.99 0 0113 13a2.99 2.99 0 01-.879 2.121z" clipRule="evenodd" />
            </svg>
            <span>Export Startups</span>
          </button>
          <button
            onClick={() => exportInvestmentsToCSV(investments, investors, startups)}
            className="btn-secondary text-sm py-3 min-h-[44px] flex items-center justify-center gap-2"
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path d="M8.433 7.418c.155-.103.346-.196.567-.267v1.698a2.305 2.305 0 01-.567-.267C8.07 8.34 8 8.114 8 8c0-.114.07-.34.433-.582zM11 12.849v-1.698c.22.071.412.164.567.267.364.243.433.468.433.582 0 .114-.07.34-.433.582a2.305 2.305 0 01-.567.267z" />
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-13a1 1 0 10-2 0v.092a4.535 4.535 0 00-1.676.662C6.602 6.234 6 7.009 6 8c0 .99.602 1.765 1.324 2.246.48.32 1.054.545 1.676.662v1.941c-.391-.127-.68-.317-.843-.504a1 1 0 10-1.51 1.31c.562.649 1.413 1.076 2.353 1.253V15a1 1 0 102 0v-.092a4.535 4.535 0 001.676-.662C13.398 13.766 14 12.991 14 12c0-.99-.602-1.765-1.324-2.246A4.535 4.535 0 0011 9.092V7.151c.391.127.68.317.843.504a1 1 0 101.511-1.31c-.563-.649-1.413-1.076-2.354-1.253V5z" clipRule="evenodd" />
            </svg>
            <span>Export Investments</span>
          </button>
          <button
            onClick={() => exportAllDataToCSV(investors, startups, investments)}
            className="btn-primary text-sm py-3 min-h-[44px] flex items-center justify-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <span>Export All Data</span>
          </button>
        </div>
      </div>

      {/* Investment Charts */}
      <InvestmentCharts />
    </div>
  );
}

// Activity Tab - Real-time Activity Feed
function ActivityTab({ gameState }) {
  return (
    <div>
      <ActivityFeed />
    </div>
  );
}

// Audit Tab - Audit Trail & Compliance
function AuditTab() {
  return (
    <div>
      <AuditTrail />
    </div>
  );
}
