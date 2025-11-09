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
      <div className="min-h-screen flex items-center justify-center bg-[#252943]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-2 border-[#33A4FA]/20 border-t-[#33A4FA] mx-auto mb-3"></div>
          <p className="text-[#DEE0ED]/60 text-sm font-medium">Loading portfolio...</p>
        </div>
      </div>
    );
  }

  if (!investor) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="fintech-card max-w-md w-full text-center p-8">
          <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center mx-auto mb-4">
            <span className="text-2xl">⚠️</span>
          </div>
          <p className="text-red-400 font-semibold mb-6 text-lg">{error || 'Investor not found'}</p>
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
    <div className="min-h-screen p-4 pb-24 bg-[#252943]">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="fintech-card p-6 md:p-8">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
              <div>
                <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">
                  {investor.name}
                </h1>
                <div className="flex items-center gap-2">
                  <span className="badge-gold text-xs">Investor</span>
                  {!isConnected && (
                    <span className="badge-danger text-xs">
                      Offline
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Financial Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="border border-[#DEE0ED]/10 rounded-xl p-5 bg-[#DEE0ED]/5">
                <p className="text-xs text-[#93AEFB] mb-2 uppercase tracking-wider font-medium">Starting Capital</p>
                <p className="text-2xl font-bold text-white">
                  {formatCurrency(investor.starting_credit)}
                </p>
              </div>
              <div className="border border-[#DEE0ED]/10 rounded-xl p-5 bg-[#DEE0ED]/5">
                <p className="text-xs text-[#93AEFB] mb-2 uppercase tracking-wider font-medium">Invested</p>
                <p className="text-2xl font-bold text-white">
                  {formatCurrency(investor.invested)}
                </p>
              </div>
              <div className="border border-[#E3FF3B]/30 rounded-xl p-5 bg-[#E3FF3B]/5">
                <p className="text-xs text-[#E3FF3B] mb-2 uppercase tracking-wider font-medium">Available</p>
                <p className="text-2xl font-bold text-[#E3FF3B]">
                  {formatCurrency(investor.remaining)}
                </p>
              </div>
            </div>

            {/* Status Messages */}
            {isLocked && (
              <div className="mt-6 border border-amber-500/30 rounded-xl p-4 bg-amber-500/10 text-amber-300 text-sm font-medium">
                <span className="mr-2">🔒</span>
                Game locked - No more changes allowed
              </div>
            )}

            {/* Submit Button */}
            {!isLocked && !investor.submitted && investor.invested > 0 && (
              <div className="mt-6 space-y-3">
                <button
                  onClick={handleSubmit}
                  disabled={submitting}
                  className="w-full btn-success text-base py-4 font-semibold disabled:opacity-50"
                >
                  {submitting ? (
                    <span className="flex items-center justify-center gap-2">
                      <div className="spinner w-4 h-4"></div>
                      Submitting...
                    </span>
                  ) : (
                    'Submit My Investments'
                  )}
                </button>
                <p className="text-xs text-slate-500 text-center">
                  Once submitted, you won't be able to change your investments
                </p>
              </div>
            )}

            {investor.submitted && (
              <div className="mt-6 border border-[#E3FF3B]/30 rounded-xl p-4 bg-[#E3FF3B]/10 text-[#252943] text-sm font-semibold text-center">
                <span className="mr-2">✅</span>
                Your investments have been submitted
              </div>
            )}
          </div>
        </div>

        {/* Startups Section */}
        <h2 className="text-2xl font-semibold mb-6 text-white flex items-center gap-3">
          <span className="text-2xl">🚀</span> Investment Opportunities
        </h2>
        
        {startups.length === 0 ? (
          <div className="fintech-card text-center p-12">
            <span className="text-5xl block mb-3 opacity-30">📊</span>
            <p className="text-slate-400 text-sm">No startups available yet</p>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {startups.map((startup) => {
              const myInvestment = getInvestmentForStartup(startup.id);
              const investors = (currentGameState?.investments || [])
                .filter(inv => inv.startup_id === startup.id)
                .sort((a, b) => b.amount - a.amount);

              return (
                <div key={startup.id} className="fintech-card-hover">
                  {/* View Details Button */}
                  <button
                    onClick={() => setViewingStartup(startup)}
                    className="absolute top-4 right-4 z-10 text-xs text-slate-400 hover:text-slate-200 font-medium border border-slate-800 rounded px-3 py-1.5 bg-slate-900/50 hover:bg-slate-800/50 transition-colors"
                  >
                    Details
                  </button>

                  {/* Logo */}
                  {startup.logo && (
                    <div className="mb-4 flex justify-center">
                      <img 
                        src={getFileUrl(startup.logo)} 
                        alt={`${startup.name} logo`}
                        className="h-16 w-16 object-contain cursor-pointer"
                        onClick={() => setViewingStartup(startup)}
                      />
                    </div>
                  )}
                  
                  <div className="mb-4">
                    <h3 
                      className="text-xl font-bold text-slate-100 mb-2 cursor-pointer hover:text-slate-300 transition-colors"
                      onClick={() => setViewingStartup(startup)}
                    >
                      {startup.name}
                    </h3>
                    {startup.description && (
                      <p className="text-sm text-slate-500 line-clamp-2 leading-relaxed">
                        {startup.description}
                      </p>
                    )}
                  </div>

                  <div className="mb-4 pb-4 border-b border-slate-800">
                    <p className="text-xs text-slate-500 mb-2 uppercase tracking-wider font-medium">Total Raised</p>
                    <p className="text-2xl font-bold text-slate-200">
                      {formatCurrency(startup.total_raised)}
                    </p>
                  </div>

                  {myInvestment && (
                    <div className="mb-4 border border-emerald-900/30 rounded-lg p-4 bg-emerald-950/20">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs text-emerald-400 uppercase tracking-wider font-medium">
                          Your Investment
                        </span>
                        {!isLocked && !investor.submitted && (
                          <button
                            onClick={() => handleRemoveInvestment(startup.id)}
                            disabled={submitting}
                            className="text-xs text-red-400 hover:text-red-300 font-medium"
                          >
                            Remove
                          </button>
                        )}
                      </div>
                      <p className="text-xl font-bold text-emerald-300 mb-1">
                        {formatCurrency(myInvestment.amount)}
                      </p>
                      <p className="text-xs text-slate-500">
                        {formatPercentage(myInvestment.amount, startup.total_raised)} of total
                      </p>
                    </div>
                  )}

                  {investors.length > 0 && (
                    <div className="mb-5">
                      <p className="text-xs text-slate-500 mb-3 uppercase tracking-wider font-medium">
                        Investors ({investors.length})
                      </p>
                      <div className="space-y-2 max-h-32 overflow-y-auto">
                        {investors.slice(0, 5).map((inv) => (
                          <div
                            key={inv.id}
                            className="flex items-center justify-between text-sm border border-slate-800 rounded p-2 bg-slate-900/30"
                          >
                            <span className={inv.investor_id === investorId ? 'text-slate-200 font-semibold' : 'text-slate-400'}>
                              {inv.investor_name}
                              {inv.investor_id === investorId && <span className="ml-1 text-xs">•</span>}
                            </span>
                            <span className="text-slate-300 font-medium text-xs">
                              {formatCurrency(inv.amount)}
                            </span>
                          </div>
                        ))}
                        {investors.length > 5 && (
                          <p className="text-xs text-slate-600 italic text-center mt-2">
                            +{investors.length - 5} more
                          </p>
                        )}
                      </div>
                    </div>
                  )}

                  {!isLocked && !investor.submitted && (
                    <button
                      onClick={() => setSelectedStartup(startup)}
                      disabled={submitting}
                      className="btn-primary w-full text-sm py-3 font-medium"
                    >
                      {myInvestment ? 'Edit Investment' : 'Invest Now'}
                    </button>
                  )}

                  {investor.submitted && (
                    <div className="border border-emerald-900/30 rounded-lg text-emerald-400 text-xs font-medium text-center py-2.5 bg-emerald-950/20">
                      ✓ Submitted
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
        <div className="fixed inset-0 bg-black/90 backdrop-blur-sm flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="fintech-card max-w-3xl w-full my-8">
            <button
              onClick={() => setViewingStartup(null)}
              className="absolute top-6 right-6 text-slate-500 hover:text-slate-300 text-2xl font-light"
            >
              ✕
            </button>

            {/* Logo */}
            {viewingStartup.logo && (
              <div className="mb-8 flex justify-center">
                <img 
                  src={getFileUrl(viewingStartup.logo)} 
                  alt={`${viewingStartup.name} logo`}
                  className="h-24 w-24 object-contain"
                />
              </div>
            )}

            <h2 className="text-3xl md:text-4xl font-bold text-slate-100 mb-6 text-center">{viewingStartup.name}</h2>

            {/* Description */}
            {viewingStartup.description && (
              <div className="mb-8">
                <h3 className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-3">Description</h3>
                <p className="text-slate-300 leading-relaxed text-sm">{viewingStartup.description}</p>
              </div>
            )}

            {/* Key Details Grid */}
            <div className="grid md:grid-cols-2 gap-4 mb-8">
              {viewingStartup.industry && (
                <div className="border border-slate-800 rounded-lg p-4 bg-slate-900/30">
                  <h3 className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-2">Industry</h3>
                  <p className="text-slate-200 font-medium">{viewingStartup.industry}</p>
                </div>
              )}

              {viewingStartup.ask && (
                <div className="border border-slate-800 rounded-lg p-4 bg-slate-900/30">
                  <h3 className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-2">Funding Ask</h3>
                  <p className="text-slate-200 font-medium">{viewingStartup.ask}</p>
                </div>
              )}

              {viewingStartup.generating_revenue && (
                <div className="border border-slate-800 rounded-lg p-4 bg-slate-900/30">
                  <h3 className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-2">Generating Revenue</h3>
                  <p className={`font-medium ${viewingStartup.generating_revenue === 'Yes' ? 'text-emerald-400' : 'text-slate-400'}`}>
                    {viewingStartup.generating_revenue}
                  </p>
                </div>
              )}

              {viewingStartup.legal_entity && (
                <div className="border border-slate-800 rounded-lg p-4 bg-slate-900/30">
                  <h3 className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-2">Legal Entity</h3>
                  <p className="text-slate-200 font-medium">{viewingStartup.legal_entity}</p>
                </div>
              )}
            </div>

            {/* Team */}
            {viewingStartup.team && (
              <div className="mb-8">
                <h3 className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-3">Team</h3>
                <p className="text-slate-300 leading-relaxed text-sm">{viewingStartup.team}</p>
              </div>
            )}

            {/* Programs & Cohorts */}
            {(viewingStartup.cohort || viewingStartup.support_program) && (
              <div className="mb-8">
                <h3 className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-3">Programs & Cohorts</h3>
                <div className="flex flex-wrap gap-2">
                  {viewingStartup.cohort && viewingStartup.cohort.split(',').map((c, i) => (
                    <span key={i} className="badge-info text-xs">
                      {c.trim()}
                    </span>
                  ))}
                  {viewingStartup.support_program && viewingStartup.support_program.split(',').map((p, i) => (
                    <span key={i} className="badge bg-purple-500/10 text-purple-400 border-purple-500/30 text-xs">
                      {p.trim()}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Contact */}
            {viewingStartup.email && (
              <div className="mb-8">
                <h3 className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-3">Contact</h3>
                <a href={`mailto:${viewingStartup.email}`} className="text-blue-400 hover:text-blue-300 font-medium text-sm hover:underline">
                  {viewingStartup.email}
                </a>
              </div>
            )}

            {/* Pitch Deck */}
            {viewingStartup.pitch_deck && (
              <div className="mb-8">
                <h3 className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-3">Pitch Deck</h3>
                <a 
                  href={getFileUrl(viewingStartup.pitch_deck)} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="btn-secondary inline-flex items-center gap-2 text-sm"
                >
                  View Pitch Deck
                </a>
              </div>
            )}

            {/* Investment Stats */}
            <div className="border border-slate-800 rounded-lg p-6 mb-6 bg-slate-900/30">
              <h3 className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-4">Investment Status</h3>
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <p className="text-xs text-slate-500 mb-2 uppercase tracking-wide">Total Raised</p>
                  <p className="text-2xl font-bold text-slate-200">{formatCurrency(viewingStartup.total_raised || 0)}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500 mb-2 uppercase tracking-wide">Investors</p>
                  <p className="text-2xl font-bold text-slate-200">
                    {gameState?.investments?.filter(inv => inv.startup_id === viewingStartup.id).length || 0}
                  </p>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-4">
              <button
                onClick={() => setViewingStartup(null)}
                className="btn-secondary flex-1 py-3 text-sm"
              >
                Close
              </button>
              {!isLocked && !investor?.submitted && (
                <button
                  onClick={() => {
                    setViewingStartup(null);
                    setSelectedStartup(viewingStartup);
                  }}
                  className="btn-primary flex-1 py-3 text-sm"
                >
                  Invest Now
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Investment Modal */}
      {selectedStartup && !isLocked && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="fintech-card max-w-md w-full">
            <div className="mb-6">
              <h3 className="text-2xl font-bold text-slate-100 mb-2">{selectedStartup.name}</h3>
              <p className="text-sm text-slate-500 font-medium">Make your investment</p>
            </div>
            
            {error && (
              <div className="mb-6 border border-red-900/30 rounded-lg p-4 bg-red-950/20 text-red-400 text-sm">
                {error}
              </div>
            )}

            <div className="mb-8">
              <label className="block text-sm font-medium text-slate-400 mb-3 uppercase tracking-wider">
                Investment Amount
              </label>
              <div className="relative">
                <input
                  type="number"
                  value={investmentAmount}
                  onChange={(e) => setInvestmentAmount(e.target.value)}
                  placeholder="0"
                  className="input text-xl font-semibold text-center pr-16"
                  min="0"
                  max={investor.remaining + (getInvestmentForStartup(selectedStartup.id)?.amount || 0)}
                  autoFocus
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 text-sm font-medium">
                  CR
                </span>
              </div>
              <div className="mt-3 flex items-center justify-between">
                <p className="text-xs text-slate-500">
                  Available: <span className="text-slate-300 font-medium">{formatCurrency(investor.remaining + (getInvestmentForStartup(selectedStartup.id)?.amount || 0))}</span>
                </p>
                <button
                  type="button"
                  onClick={() => setInvestmentAmount((investor.remaining + (getInvestmentForStartup(selectedStartup.id)?.amount || 0)).toString())}
                  className="text-xs text-slate-400 hover:text-slate-200 font-medium uppercase tracking-wide"
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
                className="btn-secondary py-3 text-sm"
                disabled={submitting}
              >
                Cancel
              </button>
              <button
                onClick={handleInvest}
                disabled={submitting || !investmentAmount}
                className="btn-primary disabled:opacity-50 py-3 text-sm"
              >
                {submitting ? (
                  <span className="flex items-center justify-center gap-2">
                    <div className="spinner w-4 h-4"></div>
                    Processing...
                  </span>
                ) : (
                  'Confirm'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
