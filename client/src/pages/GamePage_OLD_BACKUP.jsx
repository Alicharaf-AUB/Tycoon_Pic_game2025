import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useSocket } from '../context/SocketContext';
import { api, formatCurrency, formatPercentage, getFileUrl } from '../utils/api';

export default function GamePage() {
  const { investorId } = useParams();
  const { gameState, isConnected } = useSocket();
  const [investor, setInvestor] = useState(null);
  const [selectedStartup, setSelectedStartup] = useState(null);
  const [viewingStartup, setViewingStartup] = useState(null);
  const [investmentAmount, setInvestmentAmount] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [fallbackGameState, setFallbackGameState] = useState(null);

  // Load game state via API as fallback
  useEffect(() => {
    const loadGameState = async () => {
      try {
        const state = await api.getGameState();
        console.log('Loaded game state via API:', state);
        setFallbackGameState(state);
      } catch (err) {
        console.error('Error loading game state:', err);
      }
    };

    // Load immediately
    loadGameState();
    
    // Reload every 5 seconds if not connected via socket
    const interval = setInterval(() => {
      if (!isConnected) {
        loadGameState();
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [isConnected]);

  // Load investor data
  useEffect(() => {
    const loadInvestor = async () => {
      try {
        console.log('Loading investor:', investorId);
        const { investor } = await api.getInvestor(investorId);
        console.log('Investor loaded:', investor);
        setInvestor(investor);
      } catch (err) {
        console.error('Error loading investor:', err);
        setError('Investor not found');
      } finally {
        setLoading(false);
      }
    };

    loadInvestor();
  }, [investorId]);

  // Update investor from game state
  useEffect(() => {
    if (gameState?.investors) {
      const updatedInvestor = gameState.investors.find(i => i.id === investorId);
      if (updatedInvestor) {
        setInvestor(updatedInvestor);
      }
    }
  }, [gameState, investorId]);
  
  // Log game state for debugging
  useEffect(() => {
    console.log('Game state updated:', gameState);
    console.log('Startups:', gameState?.startups);
    console.log('Is connected:', isConnected);
  }, [gameState, isConnected]);

  const getInvestmentForStartup = (startupId) => {
    const state = gameState || fallbackGameState;
    if (!state?.investments) return null;
    return state.investments.find(
      inv => inv.investor_id === investorId && inv.startup_id === startupId
    );
  };

  const handleInvest = async () => {
    if (!selectedStartup || !investmentAmount) return;

    const amount = parseInt(investmentAmount);
    if (isNaN(amount) || amount < 0) {
      setError('Invalid amount');
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      await api.invest(investorId, selectedStartup.id, amount);
      setSelectedStartup(null);
      setInvestmentAmount('');
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to make investment');
    } finally {
      setSubmitting(false);
    }
  };

  const handleRemoveInvestment = async (startupId) => {
    setSubmitting(true);
    setError('');

    try {
      await api.invest(investorId, startupId, 0);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to remove investment');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmit = async () => {
    if (!confirm('Are you sure you want to submit your investments? You won\'t be able to change them after submission.')) {
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      await api.submit(investorId);
      alert('✅ Your investments have been submitted successfully!');
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to submit investments');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-gold-200 border-t-gold-600 mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">Loading your portfolio...</p>
        </div>
      </div>
    );
  }

  if (!investor) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="glass-card max-w-md w-full text-center p-8 shadow-gold-lg">
          <span className="text-6xl mb-4 block">⚠️</span>
          <p className="text-red-300 font-bold mb-6 text-xl">{error || 'Investor not found'}</p>
          <a href="/" className="btn-primary inline-block">
            Back to Join
          </a>
        </div>
      </div>
    );
  }

  // Use socket game state if available, otherwise use fallback
  const currentGameState = gameState || fallbackGameState;
  const isLocked = currentGameState?.isLocked || false;
  const startups = currentGameState?.startups || [];

  return (
    <div className="min-h-screen p-4 pb-24 relative overflow-hidden">
      {/* Background effects */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-40 right-20 w-96 h-96 bg-gold-500/5 rounded-full blur-3xl animate-float"></div>
        <div className="absolute bottom-40 left-20 w-80 h-80 bg-gold-600/5 rounded-full blur-3xl animate-float" style={{animationDelay: '1.5s'}}></div>
      </div>

      <div className="max-w-7xl mx-auto relative z-10">
        {/* Header */}
        <div className="mb-8">
          <div className="glass-card p-6 md:p-8 shadow-gold-lg shimmer">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
              <div>
                <h1 className="text-4xl md:text-5xl font-bold text-gradient-gold font-display mb-2">
                  {investor.name}
                </h1>
                <div className="flex items-center gap-2">
                  <span className="badge-gold">💼 Angel Investor</span>
                  {!isConnected && (
                    <span className="badge-danger animate-pulse">
                      ⚠️ Disconnected
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Financial Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 md:gap-6">
              <div className="glass-card bg-blue-950/20 border-blue-500/30 p-5 shadow-lg hover:scale-105 transition-transform duration-300">
                <p className="text-xs text-blue-300 mb-2 font-bold uppercase tracking-wider">Starting Capital</p>
                <p className="text-2xl md:text-3xl font-bold text-blue-200 font-display">
                  {formatCurrency(investor.starting_credit)}
                </p>
              </div>
              <div className="glass-card bg-gold-950/20 border-gold-500/30 p-5 shadow-gold hover:scale-105 transition-transform duration-300 animate-glow">
                <p className="text-xs text-gold-300 mb-2 font-bold uppercase tracking-wider">Invested</p>
                <p className="text-2xl md:text-3xl font-bold text-gold-200 font-display">
                  {formatCurrency(investor.invested)}
                </p>
              </div>
              <div className="glass-card bg-emerald-950/20 border-emerald-500/30 p-5 shadow-lg hover:scale-105 transition-transform duration-300">
                <p className="text-xs text-emerald-300 mb-2 font-bold uppercase tracking-wider">Remaining</p>
                <p className="text-2xl md:text-3xl font-bold text-emerald-200 font-display">
                  {formatCurrency(investor.remaining)}
                </p>
              </div>
            </div>

            {/* Status Messages */}
            {isLocked && (
              <div className="mt-6 glass-card bg-amber-950/30 border-amber-500/50 px-6 py-4 text-amber-200 text-base font-semibold animate-pulse-slow">
                <span className="text-xl mr-2">🔒</span>
                <strong>Game Locked:</strong> No more changes allowed
              </div>
            )}

            {/* Submit Button */}
            {!isLocked && !investor.submitted && investor.invested > 0 && (
              <div className="mt-6 space-y-3">
                <button
                  onClick={handleSubmit}
                  disabled={submitting}
                  className="w-full btn-success text-lg md:text-xl py-5 font-bold disabled:opacity-50 uppercase tracking-wide"
                >
                  {submitting ? (
                    <span className="flex items-center justify-center gap-3">
                      <div className="spinner w-5 h-5"></div>
                      Submitting...
                    </span>
                  ) : (
                    <span className="flex items-center justify-center gap-3">
                      <span className="text-2xl">✓</span>
                      Submit My Investments
                    </span>
                  )}
                </button>
                <p className="text-sm text-slate-400 text-center font-medium">
                  Once submitted, you won't be able to change your investments
                </p>
              </div>
            )}

            {investor.submitted && (
              <div className="mt-6 glass-card bg-emerald-950/30 border-emerald-500/50 px-6 py-4 text-emerald-200 text-base font-semibold text-center animate-glow">
                <span className="text-xl mr-2">✅</span>
                Your investments have been submitted!
              </div>
            )}
          </div>
        </div>

        {/* Startups Section */}
        <h2 className="text-3xl md:text-4xl font-bold mb-6 text-slate-100 font-display flex items-center gap-3">
          <span className="text-4xl">🚀</span> Investment Opportunities
        </h2>
        
        {startups.length === 0 ? (
          <div className="glass-card text-center p-12 shadow-lg">
            <span className="text-6xl block mb-4">📊</span>
            <p className="text-slate-300 text-lg font-semibold">No startups available yet</p>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {startups.map((startup) => {
              const myInvestment = getInvestmentForStartup(startup.id);
              const investors = (currentGameState?.investments || [])
                .filter(inv => inv.startup_id === startup.id)
                .sort((a, b) => b.amount - a.amount);

              return (
                <div key={startup.id} className="glass-card-hover relative overflow-hidden shadow-glass-lg group">
                  {/* View Details Button */}
                  <button
                    onClick={() => setViewingStartup(startup)}
                    className="absolute top-4 right-4 z-10 text-sm text-blue-200 hover:text-blue-100 font-bold glass-card bg-blue-950/40 border-blue-500/30 px-4 py-2 hover:scale-110 transition-transform duration-300"
                  >
                    <span className="mr-1">ℹ️</span>Details
                  </button>

                  {/* Logo */}
                  {startup.logo && (
                    <div className="mb-4 flex justify-center group-hover:scale-110 transition-transform duration-300">
                      <img 
                        src={getFileUrl(startup.logo)} 
                        alt={`${startup.name} logo`}
                        className="h-20 w-20 object-contain cursor-pointer drop-shadow-lg"
                        onClick={() => setViewingStartup(startup)}
                      />
                    </div>
                  )}
                  
                  <div className="mb-4">
                    <h3 
                      className="text-2xl font-bold text-slate-100 mb-2 cursor-pointer hover:text-gold-300 transition-colors font-display"
                      onClick={() => setViewingStartup(startup)}
                    >
                      {startup.name}
                    </h3>
                    {startup.description && (
                      <p className="text-sm text-slate-400 line-clamp-2 leading-relaxed">
                        {startup.description}
                      </p>
                    )}
                  </div>

                  <div className="mb-4 pb-4 border-b border-gold-500/20">
                    <p className="text-xs text-gold-300 mb-2 font-bold uppercase tracking-wider">Total Raised</p>
                    <p className="text-3xl font-bold text-gradient-gold font-display">
                      {formatCurrency(startup.total_raised)}
                    </p>
                  </div>

                  {myInvestment && (
                    <div className="mb-4 glass-card bg-gold-950/30 border-gold-500/50 p-4 animate-glow">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-bold text-gold-300 uppercase tracking-wider flex items-center gap-2">
                          <span className="text-lg">💎</span> Your Investment
                        </span>
                        {!isLocked && !investor.submitted && (
                          <button
                            onClick={() => handleRemoveInvestment(startup.id)}
                            disabled={submitting}
                            className="text-sm text-red-300 hover:text-red-200 font-bold hover:scale-110 transition-transform"
                          >
                            Remove
                          </button>
                        )}
                      </div>
                      <p className="text-2xl font-bold text-gold-200 font-display mb-1">
                        {formatCurrency(myInvestment.amount)}
                      </p>
                      <p className="text-sm text-slate-400 font-medium">
                        {formatPercentage(myInvestment.amount, startup.total_raised)} of total
                      </p>
                    </div>
                  )}

                  {investors.length > 0 && (
                    <div className="mb-5">
                      <p className="text-sm text-slate-300 mb-3 font-bold uppercase tracking-wider flex items-center gap-2">
                        <span className="text-lg">👥</span> Investors ({investors.length})
                      </p>
                      <div className="space-y-2 max-h-40 overflow-y-auto custom-scrollbar">
                        {investors.slice(0, 5).map((inv) => (
                          <div
                            key={inv.id}
                            className="flex items-center justify-between text-sm glass-card bg-slate-900/40 p-3 hover:bg-slate-800/60 transition-all"
                          >
                            <span className={inv.investor_id === investorId ? 'text-gold-300 font-bold' : 'text-slate-300 font-medium'}>
                              {inv.investor_name}
                              {inv.investor_id === investorId && <span className="ml-2">⭐</span>}
                            </span>
                            <span className="text-slate-200 font-bold">
                              {formatCurrency(inv.amount)}
                            </span>
                          </div>
                        ))}
                        {investors.length > 5 && (
                          <p className="text-sm text-slate-500 italic text-center mt-2 font-medium">
                            +{investors.length - 5} more investors
                          </p>
                        )}
                      </div>
                    </div>
                  )}

                  {!isLocked && !investor.submitted && (
                    <button
                      onClick={() => setSelectedStartup(startup)}
                      disabled={submitting}
                      className="btn-primary w-full text-base py-4 font-bold uppercase tracking-wide"
                    >
                      {myInvestment ? (
                        <span className="flex items-center justify-center gap-2">
                          <span className="text-xl">✏️</span> Edit Investment
                        </span>
                      ) : (
                        <span className="flex items-center justify-center gap-2">
                          <span className="text-xl">💰</span> Invest Now
                        </span>
                      )}
                    </button>
                  )}

                  {investor.submitted && (
                    <div className="glass-card bg-emerald-950/30 border-emerald-500/50 text-emerald-300 text-base font-bold text-center py-3">
                      <span className="text-lg mr-2">✅</span>
                      Submitted
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Startup Details Modal */}
      {viewingStartup && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="glass-card max-w-3xl w-full my-8 shadow-gold-glow relative">
            <button
              onClick={() => setViewingStartup(null)}
              className="absolute top-6 right-6 text-slate-300 hover:text-gold-400 text-3xl font-bold hover:scale-110 transition-transform z-10"
            >
              ✕
            </button>

            {/* Logo */}
            {viewingStartup.logo && (
              <div className="mb-8 flex justify-center">
                <img 
                  src={getFileUrl(viewingStartup.logo)} 
                  alt={`${viewingStartup.name} logo`}
                  className="h-28 w-28 object-contain drop-shadow-2xl"
                />
              </div>
            )}

            <h2 className="text-4xl md:text-5xl font-bold text-gradient-gold mb-6 font-display text-center">{viewingStartup.name}</h2>

            {/* Description */}
            {viewingStartup.description && (
              <div className="mb-8">
                <h3 className="text-sm font-bold text-gold-300 uppercase tracking-wider mb-3">📝 Description</h3>
                <p className="text-slate-300 leading-relaxed text-base">{viewingStartup.description}</p>
              </div>
            )}

            {/* Key Details Grid */}
            <div className="grid md:grid-cols-2 gap-6 mb-8">
              {viewingStartup.industry && (
                <div className="glass-card p-4 bg-slate-900/40">
                  <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-2">🏢 Industry</h3>
                  <p className="text-slate-100 font-semibold text-lg">{viewingStartup.industry}</p>
                </div>
              )}

              {viewingStartup.ask && (
                <div className="glass-card p-4 bg-emerald-950/20 border-emerald-500/30">
                  <h3 className="text-sm font-bold text-emerald-400 uppercase tracking-wider mb-2">💰 Funding Ask</h3>
                  <p className="text-emerald-200 font-semibold text-lg">{viewingStartup.ask}</p>
                </div>
              )}

              {viewingStartup.generating_revenue && (
                <div className="glass-card p-4 bg-slate-900/40">
                  <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-2">📊 Generating Revenue</h3>
                  <p className={`font-semibold text-lg ${viewingStartup.generating_revenue === 'Yes' ? 'text-emerald-300' : 'text-slate-300'}`}>
                    {viewingStartup.generating_revenue}
                  </p>
                </div>
              )}

              {viewingStartup.legal_entity && (
                <div className="glass-card p-4 bg-slate-900/40">
                  <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-2">⚖️ Legal Entity</h3>
                  <p className="text-slate-100 font-semibold text-lg">{viewingStartup.legal_entity}</p>
                </div>
              )}
            </div>

            {/* Team */}
            {viewingStartup.team && (
              <div className="mb-8">
                <h3 className="text-sm font-bold text-gold-300 uppercase tracking-wider mb-3">👥 Team</h3>
                <p className="text-slate-300 leading-relaxed text-base">{viewingStartup.team}</p>
              </div>
            )}

            {/* Programs & Cohorts */}
            {(viewingStartup.cohort || viewingStartup.support_program) && (
              <div className="mb-8">
                <h3 className="text-sm font-bold text-gold-300 uppercase tracking-wider mb-3">🎓 Programs & Cohorts</h3>
                <div className="flex flex-wrap gap-3">
                  {viewingStartup.cohort && viewingStartup.cohort.split(',').map((c, i) => (
                    <span key={i} className="badge-info">
                      {c.trim()}
                    </span>
                  ))}
                  {viewingStartup.support_program && viewingStartup.support_program.split(',').map((p, i) => (
                    <span key={i} className="badge bg-purple-500/20 text-purple-300 border-purple-500/50">
                      {p.trim()}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Contact */}
            {viewingStartup.email && (
              <div className="mb-8">
                <h3 className="text-sm font-bold text-gold-300 uppercase tracking-wider mb-3">📧 Contact</h3>
                <a href={`mailto:${viewingStartup.email}`} className="text-blue-300 hover:text-blue-200 font-semibold text-lg hover:underline">
                  {viewingStartup.email}
                </a>
              </div>
            )}

            {/* Pitch Deck */}
            {viewingStartup.pitch_deck && (
              <div className="mb-8">
                <h3 className="text-sm font-bold text-gold-300 uppercase tracking-wider mb-3">📄 Pitch Deck</h3>
                <a 
                  href={getFileUrl(viewingStartup.pitch_deck)} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="btn-secondary inline-flex items-center gap-2"
                >
                  <span className="text-xl">📥</span>
                  <span>View Pitch Deck</span>
                </a>
              </div>
            )}

            {/* Investment Stats */}
            <div className="glass-card bg-gold-950/20 border-gold-500/30 p-6 md:p-8 mb-6 shadow-gold">
              <h3 className="text-base font-bold text-gold-300 uppercase tracking-wider mb-4 flex items-center gap-2">
                <span className="text-xl">📈</span> Investment Status
              </h3>
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <p className="text-sm text-slate-400 mb-2 uppercase tracking-wide">Total Raised</p>
                  <p className="text-3xl font-bold text-gold-300 font-display">{formatCurrency(viewingStartup.total_raised || 0)}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-400 mb-2 uppercase tracking-wide">Investors</p>
                  <p className="text-3xl font-bold text-gold-300 font-display">
                    {gameState?.investments?.filter(inv => inv.startup_id === viewingStartup.id).length || 0}
                  </p>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-4">
              <button
                onClick={() => setViewingStartup(null)}
                className="btn-secondary flex-1 py-4 text-lg"
              >
                Close
              </button>
              {!isLocked && !investor?.submitted && (
                <button
                  onClick={() => {
                    setViewingStartup(null);
                    setSelectedStartup(viewingStartup);
                  }}
                  className="btn-primary flex-1 py-4 text-lg"
                >
                  <span className="flex items-center justify-center gap-2">
                    <span className="text-xl">💰</span>
                    Invest Now
                  </span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Investment Modal */}
      {selectedStartup && !isLocked && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 z-50">
          <div className="glass-card max-w-md w-full shadow-gold-glow">
            <div className="mb-6">
              <h3 className="text-3xl md:text-4xl font-bold text-gradient-gold mb-2 font-display">{selectedStartup.name}</h3>
              <p className="text-base text-slate-400 font-semibold flex items-center gap-2">
                <span className="text-xl">💰</span> Make your investment
              </p>
            </div>
            
            {error && (
              <div className="mb-6 glass-card bg-red-950/30 border-red-500/50 text-red-300 px-6 py-4 text-base font-medium">
                <span className="text-xl mr-2">⚠️</span>
                {error}
              </div>
            )}

            <div className="mb-8">
              <label className="block text-base font-bold text-slate-200 mb-3 uppercase tracking-wider">
                Investment Amount
              </label>
              <div className="relative">
                <input
                  type="number"
                  value={investmentAmount}
                  onChange={(e) => setInvestmentAmount(e.target.value)}
                  placeholder="0"
                  className="input-gold pr-20 text-2xl font-bold text-center"
                  min="0"
                  max={investor.remaining + (getInvestmentForStartup(selectedStartup.id)?.amount || 0)}
                  autoFocus
                />
                <span className="absolute right-6 top-1/2 -translate-y-1/2 text-gold-400 text-lg font-bold">
                  CR
                </span>
              </div>
              <div className="mt-3 flex items-center justify-between">
                <p className="text-sm text-slate-400 font-medium">
                  Available: <span className="text-slate-200 font-bold">{formatCurrency(investor.remaining + (getInvestmentForStartup(selectedStartup.id)?.amount || 0))}</span>
                </p>
                <button
                  type="button"
                  onClick={() => setInvestmentAmount((investor.remaining + (getInvestmentForStartup(selectedStartup.id)?.amount || 0)).toString())}
                  className="text-sm text-gold-400 hover:text-gold-300 font-bold uppercase tracking-wide hover:scale-110 transition-transform"
                >
                  MAX
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <button
                onClick={() => {
                  setSelectedStartup(null);
                  setInvestmentAmount('');
                  setError('');
                }}
                className="btn-secondary py-4 text-base"
                disabled={submitting}
              >
                Cancel
              </button>
              <button
                onClick={handleInvest}
                disabled={submitting || !investmentAmount}
                className="btn-primary disabled:opacity-50 py-4 text-base"
              >
                {submitting ? (
                  <span className="flex items-center justify-center gap-2">
                    <div className="spinner w-5 h-5"></div>
                    Processing...
                  </span>
                ) : (
                  <span className="flex items-center justify-center gap-2">
                    <span className="text-xl">✓</span>
                    Confirm
                  </span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
