import { useState, useEffect } from 'react';
import { useSocket } from '../context/SocketContext';
import { adminApi, formatCurrency } from '../utils/api';

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
            <div className="mb-4">
              <div className="inline-block p-4 bg-gradient-to-br from-gold-400 to-primary-500 rounded-2xl shadow-gold-lg">
                <span className="text-5xl">🔐</span>
              </div>
            </div>
            <h1 className="text-4xl font-bold mb-2 text-gradient-gold font-display">Admin Access</h1>
            <p className="text-gray-600 font-medium">AUB Angel Investor Control Panel</p>
          </div>

          <div className="card-premium">
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2 uppercase tracking-wide">
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
                <label className="block text-sm font-bold text-gray-700 mb-2 uppercase tracking-wide">
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
                <div className="bg-red-50 border-2 border-red-300 text-red-800 px-4 py-3 rounded-lg text-sm font-bold">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="btn-primary w-full"
              >
                {loading ? 'Logging in...' : '🔓 Login'}
              </button>
            </form>
          </div>

          <div className="text-center mt-6">
            <a href="/" className="text-sm text-gray-500 hover:text-gold-600 font-medium">
              ← Back to Join
            </a>
          </div>
        </div>
      </div>
    );
  }

  const tabs = [
    { id: 'overview', name: 'Overview' },
    { id: 'investors', name: 'Investors' },
    { id: 'startups', name: 'Startups' },
    { id: 'investments', name: 'Investments' },
    { id: 'submissions', name: 'Submissions' },
  ];

  return (
    <div className="min-h-screen p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="card-premium mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gradient-gold font-display mb-1">
                🎯 Admin Dashboard
              </h1>
              <p className="text-sm text-gray-600 font-medium">AUB Angel Investor Control Panel</p>
            </div>
            <div className="flex items-center gap-3">
              <GameLockButton username={username} password={password} />
              <button
                onClick={handleLogout}
                className="btn-secondary text-sm"
              >
                🚪 Logout
              </button>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b-2 border-gold-200 mb-6 bg-white rounded-t-xl px-2 pt-2">
          <div className="flex gap-2 overflow-x-auto">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-6 py-3 font-bold transition-all whitespace-nowrap rounded-t-lg ${
                  activeTab === tab.id
                    ? 'text-gold-700 bg-gradient-to-b from-gold-100 to-white border-b-4 border-gold-500'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
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
      className={`px-6 py-2 rounded-lg font-bold transition-all shadow-md text-white ${
        isLocked
          ? 'bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600'
          : 'bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600'
      }`}
    >
      {loading ? '...' : isLocked ? '🔒 Locked' : '🔓 Unlocked'}
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
    return <div className="text-center text-gray-500 font-medium">Loading...</div>;
  }

  const topStartups = (gameState?.startups || [])
    .filter(s => s.total_raised > 0)
    .sort((a, b) => b.total_raised - a.total_raised)
    .slice(0, 5);

  return (
    <div className="space-y-6">
      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="card-premium">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-gray-600 font-bold uppercase">Total Investors</p>
            <span className="text-2xl">👥</span>
          </div>
          <p className="text-4xl font-bold text-gradient-gold">{stats.totalInvestors}</p>
        </div>
        <div className="card-premium">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-gray-600 font-bold uppercase">Active Startups</p>
            <span className="text-2xl">🚀</span>
          </div>
          <p className="text-4xl font-bold text-gradient-gold">{stats.totalStartups}</p>
        </div>
        <div className="card-premium">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-gray-600 font-bold uppercase">Total Invested</p>
            <span className="text-2xl">💰</span>
          </div>
          <p className="text-3xl font-bold text-gradient-gold">
            {formatCurrency(stats.totalInvested)}
          </p>
        </div>
        <div className="card-premium">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-gray-600 font-bold uppercase">Investments</p>
            <span className="text-2xl">📊</span>
          </div>
          <p className="text-4xl font-bold text-gradient-gold">{stats.totalInvestments}</p>
        </div>
      </div>

      {/* Top Startups */}
      {topStartups.length > 0 && (
        <div className="card-premium">
          <h3 className="text-xl font-bold mb-4 text-gray-800 flex items-center gap-2">
            <span>🏆</span> Top Startups by Investment
          </h3>
          <div className="space-y-3">
            {topStartups.map((startup, index) => (
              <div key={startup.id} className="flex items-center justify-between p-4 bg-gradient-to-r from-gold-50 to-amber-50 rounded-lg border-2 border-gold-200">
                <div className="flex items-center gap-4">
                  <span className="text-3xl font-bold text-gold-600">
                    #{index + 1}
                  </span>
                  <div>
                    <p className="font-bold text-gray-900 text-lg">{startup.name}</p>
                  </div>
                </div>
                <p className="text-xl font-bold text-gradient-gold">
                  {formatCurrency(startup.total_raised)}
                </p>
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
    } catch (err) {
      alert('Failed to delete investor');
    }
  };

  return (
    <div className="card overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b-2 border-gold-300 bg-gradient-to-r from-gold-50 to-amber-50">
            <th className="text-left py-4 px-4 text-sm font-bold text-gray-800 uppercase">Name</th>
            <th className="text-center py-4 px-4 text-sm font-bold text-gray-800 uppercase">Status</th>
            <th className="text-right py-4 px-4 text-sm font-bold text-gray-800 uppercase">Starting Credit</th>
            <th className="text-right py-4 px-4 text-sm font-bold text-gray-800 uppercase">Invested</th>
            <th className="text-right py-4 px-4 text-sm font-bold text-gray-800 uppercase">Remaining</th>
            <th className="text-right py-4 px-4 text-sm font-bold text-gray-800 uppercase">Actions</th>
          </tr>
        </thead>
        <tbody>
          {investors.map((investor) => (
            <tr key={investor.id} className="border-b border-gray-200 hover:bg-gold-50 transition-colors">
              <td className="py-4 px-4">
                <p className="font-bold text-gray-900">{investor.name}</p>
              </td>
              <td className="py-4 px-4 text-center">
                {investor.submitted ? (
                  <span className="inline-block bg-green-100 text-green-800 text-xs font-bold px-3 py-1 rounded-full">
                    ✅ Submitted
                  </span>
                ) : (
                  <span className="inline-block bg-yellow-100 text-yellow-800 text-xs font-bold px-3 py-1 rounded-full">
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
                  <span className="text-gray-700 font-semibold">{formatCurrency(investor.starting_credit)}</span>
                )}
              </td>
              <td className="py-4 px-4 text-right text-gold-700 font-bold">
                {formatCurrency(investor.invested)}
              </td>
              <td className="py-4 px-4 text-right text-green-700 font-bold">
                {formatCurrency(investor.remaining)}
              </td>
              <td className="py-4 px-4 text-right">
                <div className="flex items-center justify-end gap-2">
                  {editingCredit === investor.id ? (
                    <>
                      <button
                        onClick={() => handleUpdateCredit(investor.id)}
                        className="text-sm text-green-600 hover:text-green-700 font-bold"
                      >
                        ✓ Save
                      </button>
                      <button
                        onClick={() => {
                          setEditingCredit(null);
                          setNewCredit('');
                        }}
                        className="text-sm text-gray-500 hover:text-gray-700 font-bold"
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
                        className="text-sm text-gold-600 hover:text-gold-700 font-bold"
                      >
                        ✏️ Edit
                      </button>
                      <button
                        onClick={() => handleDelete(investor.id, investor.name)}
                        className="text-sm text-red-600 hover:text-red-700 font-bold"
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
        <div className="text-center py-8 text-gray-500 font-medium">
          No investors yet
        </div>
      )}
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
    } catch (err) {
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
      await adminApi.updateStartup(username, password, editingStartup.id, editForm);
      setEditingStartup(null);
    } catch (err) {
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
                            const result = await adminApi.uploadFile(username, password, file);
                            setNewStartup({ ...newStartup, logo: result.url });
                          } catch (err) {
                            alert('Failed to upload logo');
                          }
                        }
                      }}
                    />
                  </label>
                </div>
                {newStartup.logo && (
                  <img src={`http://localhost:3001${newStartup.logo}`} alt="Logo preview" className="mt-2 h-16 w-16 object-contain border rounded" />
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
                            const result = await adminApi.uploadFile(username, password, file);
                            setNewStartup({ ...newStartup, pitch_deck: result.url });
                          } catch (err) {
                            alert('Failed to upload pitch deck');
                          }
                        }
                      }}
                    />
                  </label>
                </div>
                {newStartup.pitch_deck && (
                  <a href={`http://localhost:3001${newStartup.pitch_deck}`} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-600 hover:underline mt-1 inline-block">
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
                              const result = await adminApi.uploadFile(username, password, file);
                              setEditForm({ ...editForm, logo: result.url });
                            } catch (err) {
                              alert('Failed to upload logo');
                            }
                          }
                        }}
                      />
                    </label>
                  </div>
                  {editForm.logo && (
                    <img src={`http://localhost:3001${editForm.logo}`} alt="Logo preview" className="mt-2 h-16 w-16 object-contain border rounded" />
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
                              const result = await adminApi.uploadFile(username, password, file);
                              setEditForm({ ...editForm, pitch_deck: result.url });
                            } catch (err) {
                              alert('Failed to upload pitch deck');
                            }
                          }
                        }}
                      />
                    </label>
                  </div>
                  {editForm.pitch_deck && (
                    <a href={`http://localhost:3001${editForm.pitch_deck}`} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-600 hover:underline mt-1 inline-block">
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
