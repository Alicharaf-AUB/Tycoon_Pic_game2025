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
        <div className="card-premium max-w-md w-full text-center">
          <p className="text-red-600 font-bold mb-4">{error || 'Investor not found'}</p>
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
    <div className="min-h-screen p-4 pb-20">
      {/* Header */}
      <div className="max-w-7xl mx-auto mb-6">
        <div className="card-premium">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold text-gradient-gold font-display">
                {investor.name}
              </h1>
              <p className="text-sm text-gray-600 font-medium">💼 Angel Investor</p>
            </div>
            <div className="flex items-center gap-2">
              {!isConnected && (
                <span className="badge-danger">
                  Disconnected
                </span>
              )}
              <span className="badge-gold">
                🏆 AUB
              </span>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-4 border-2 border-blue-200">
              <p className="text-xs text-blue-700 mb-1 font-bold uppercase">Starting Capital</p>
              <p className="text-lg font-bold text-blue-900">
                {formatCurrency(investor.starting_credit)}
              </p>
            </div>
            <div className="bg-gradient-to-br from-gold-50 to-amber-100 rounded-lg p-4 border-2 border-gold-300">
              <p className="text-xs text-gold-700 mb-1 font-bold uppercase">Invested</p>
              <p className="text-lg font-bold text-gold-900">
                {formatCurrency(investor.invested)}
              </p>
            </div>
            <div className="bg-gradient-to-br from-green-50 to-emerald-100 rounded-lg p-4 border-2 border-green-300">
              <p className="text-xs text-green-700 mb-1 font-bold uppercase">Remaining</p>
              <p className="text-lg font-bold text-green-900">
                {formatCurrency(investor.remaining)}
              </p>
            </div>
          </div>

          {isLocked && (
            <div className="mt-4 bg-yellow-50 border-2 border-yellow-400 text-yellow-900 px-4 py-3 rounded-lg text-sm font-bold">
              <strong>🔒 Game Locked:</strong> No more changes allowed
            </div>
          )}

          {/* Submit Button */}
          {!isLocked && !investor.submitted && investor.invested > 0 && (
            <div className="mt-4">
              <button
                onClick={handleSubmit}
                disabled={submitting}
                className="w-full btn-primary text-lg py-4 font-bold disabled:opacity-50"
              >
                {submitting ? 'Submitting...' : '✓ Submit My Investments'}
              </button>
              <p className="text-xs text-gray-600 text-center mt-2">
                Once submitted, you won't be able to change your investments
              </p>
            </div>
          )}

          {investor.submitted && (
            <div className="mt-4 bg-green-50 border-2 border-green-400 text-green-900 px-4 py-3 rounded-lg text-sm font-bold text-center">
              ✅ Your investments have been submitted!
            </div>
          )}
        </div>
      </div>

      {/* Startups */}
      <div className="max-w-7xl mx-auto">
        <h2 className="text-2xl font-bold mb-4 text-gray-800 flex items-center gap-2">
          <span></span> Investment Opportunities
        </h2>
        
        {startups.length === 0 ? (
          <div className="card text-center text-gray-500">
            <p>No startups available yet</p>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {startups.map((startup) => {
              const myInvestment = getInvestmentForStartup(startup.id);
              const investors = (currentGameState?.investments || [])
                .filter(inv => inv.startup_id === startup.id)
                .sort((a, b) => b.amount - a.amount);

              return (
                <div key={startup.id} className="card-hover relative">
                  {/* View Details Button */}
                  <button
                    onClick={() => setViewingStartup(startup)}
                    className="absolute top-2 right-2 text-xs text-blue-600 hover:text-blue-700 font-bold bg-blue-50 px-2 py-1 rounded"
                  >
                    ℹDetails
                  </button>

                  {/* Logo */}
                  {startup.logo && (
                    <div className="mb-3 flex justify-center">
                      <img 
                        src={getFileUrl(startup.logo)} 
                        alt={`${startup.name} logo`}
                        className="h-16 w-16 object-contain cursor-pointer"
                        onClick={() => setViewingStartup(startup)}
                      />
                    </div>
                  )}
                  
                  <div className="mb-3">
                    <h3 
                      className="text-lg font-bold text-gray-900 mb-1 cursor-pointer hover:text-gold-600"
                      onClick={() => setViewingStartup(startup)}
                    >
                      {startup.name}
                    </h3>
                    {startup.description && (
                      <p className="text-sm text-gray-600 line-clamp-2">
                        {startup.description}
                      </p>
                    )}
                  </div>

                  <div className="mb-3 pb-3 border-b-2 border-gold-200">
                    <p className="text-xs text-gray-600 mb-1 font-bold uppercase">Total Raised</p>
                    <p className="text-2xl font-bold text-gradient-gold">
                      {formatCurrency(startup.total_raised)}
                    </p>
                  </div>

                  {myInvestment && (
                    <div className="mb-3 bg-gradient-to-br from-gold-100 to-amber-100 border-2 border-gold-300 rounded-lg p-3">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-bold text-gold-800 uppercase">
                          💎 Your Investment
                        </span>
                        {!isLocked && !investor.submitted && (
                          <button
                            onClick={() => handleRemoveInvestment(startup.id)}
                            disabled={submitting}
                            className="text-xs text-red-600 hover:text-red-700 font-bold"
                          >
                            Remove
                          </button>
                        )}
                      </div>
                      <p className="text-lg font-bold text-gray-900">
                        {formatCurrency(myInvestment.amount)}
                      </p>
                      <p className="text-xs text-gray-600 font-medium">
                        {formatPercentage(myInvestment.amount, startup.total_raised)} of total
                      </p>
                    </div>
                  )}

                  {investors.length > 0 && (
                    <div className="mb-3">
                      <p className="text-xs text-gray-600 mb-2 font-bold uppercase">
                        👥 Investors ({investors.length})
                      </p>
                      <div className="space-y-1 max-h-32 overflow-y-auto">
                        {investors.slice(0, 5).map((inv) => (
                          <div
                            key={inv.id}
                            className="flex items-center justify-between text-xs bg-gray-50 p-2 rounded"
                          >
                            <span className={inv.investor_id === investorId ? 'text-gold-700 font-bold' : 'text-gray-700 font-medium'}>
                              {inv.investor_name}
                            </span>
                            <span className="text-gray-600 font-semibold">
                              {formatCurrency(inv.amount)}
                            </span>
                          </div>
                        ))}
                        {investors.length > 5 && (
                          <p className="text-xs text-gray-500 italic text-center mt-1">
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
                      className="btn-primary w-full text-sm"
                    >
                      {myInvestment ? '✏️ Edit Investment' : '💰 Invest Now'}
                    </button>
                  )}

                  {investor.submitted && (
                    <div className="bg-green-50 border-2 border-green-300 text-green-800 text-xs font-bold text-center py-2 rounded-lg">
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
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="card-premium max-w-3xl w-full my-8">
            <button
              onClick={() => setViewingStartup(null)}
              className="absolute top-4 right-4 text-gray-500 hover:text-gray-700 text-2xl"
            >
              ✕
            </button>

            {/* Logo */}
            {viewingStartup.logo && (
              <div className="mb-6 flex justify-center">
                <img 
                  src={getFileUrl(viewingStartup.logo)} 
                  alt={`${viewingStartup.name} logo`}
                  className="h-24 w-24 object-contain"
                />
              </div>
            )}

            <h2 className="text-3xl font-bold text-gradient-gold mb-4">{viewingStartup.name}</h2>

            {/* Description */}
            {viewingStartup.description && (
              <div className="mb-6">
                <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wide mb-2">Description</h3>
                <p className="text-gray-700 leading-relaxed">{viewingStartup.description}</p>
              </div>
            )}

            {/* Key Details Grid */}
            <div className="grid md:grid-cols-2 gap-6 mb-6">
              {viewingStartup.industry && (
                <div>
                  <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wide mb-2">Industry</h3>
                  <p className="text-gray-900 font-semibold">{viewingStartup.industry}</p>
                </div>
              )}

              {viewingStartup.ask && (
                <div>
                  <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wide mb-2">Funding Ask</h3>
                  <p className="text-gray-900 font-semibold text-green-700">{viewingStartup.ask}</p>
                </div>
              )}

              {viewingStartup.generating_revenue && (
                <div>
                  <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wide mb-2">Generating Revenue</h3>
                  <p className={`font-semibold ${viewingStartup.generating_revenue === 'Yes' ? 'text-green-700' : 'text-gray-700'}`}>
                    {viewingStartup.generating_revenue}
                  </p>
                </div>
              )}

              {viewingStartup.legal_entity && (
                <div>
                  <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wide mb-2">Legal Entity</h3>
                  <p className="text-gray-900 font-semibold">{viewingStartup.legal_entity}</p>
                </div>
              )}
            </div>

            {/* Team */}
            {viewingStartup.team && (
              <div className="mb-6">
                <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wide mb-2">Team</h3>
                <p className="text-gray-700">{viewingStartup.team}</p>
              </div>
            )}

            {/* Programs & Cohorts */}
            {(viewingStartup.cohort || viewingStartup.support_program) && (
              <div className="mb-6">
                <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wide mb-2">Programs & Cohorts</h3>
                <div className="flex flex-wrap gap-2">
                  {viewingStartup.cohort && viewingStartup.cohort.split(',').map((c, i) => (
                    <span key={i} className="bg-blue-100 text-blue-800 text-xs font-bold px-3 py-1 rounded-full">
                      {c.trim()}
                    </span>
                  ))}
                  {viewingStartup.support_program && viewingStartup.support_program.split(',').map((p, i) => (
                    <span key={i} className="bg-purple-100 text-purple-800 text-xs font-bold px-3 py-1 rounded-full">
                      {p.trim()}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Contact */}
            {viewingStartup.email && (
              <div className="mb-6">
                <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wide mb-2">Contact</h3>
                <a href={`mailto:${viewingStartup.email}`} className="text-blue-600 hover:underline font-semibold">
                  {viewingStartup.email}
                </a>
              </div>
            )}

            {/* Pitch Deck */}
            {viewingStartup.pitch_deck && (
              <div className="mb-6">
                <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wide mb-2">Pitch Deck</h3>
                <a 
                  href={getFileUrl(viewingStartup.pitch_deck)} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="btn-secondary inline-block"
                >
                  View Pitch Deck
                </a>
              </div>
            )}

            {/* Investment Stats */}
            <div className="bg-gradient-to-br from-gold-50 to-amber-100 border-2 border-gold-300 rounded-lg p-6 mb-6">
              <h3 className="text-sm font-bold text-gold-800 uppercase tracking-wide mb-3">Investment Status</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-gray-700 mb-1">Total Raised</p>
                  <p className="text-2xl font-bold text-gold-700">{formatCurrency(viewingStartup.total_raised || 0)}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-700 mb-1">Investors</p>
                  <p className="text-2xl font-bold text-gold-700">
                    {gameState?.investments?.filter(inv => inv.startup_id === viewingStartup.id).length || 0}
                  </p>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3">
              <button
                onClick={() => setViewingStartup(null)}
                className="btn-secondary flex-1"
              >
                Close
              </button>
              {!isLocked && !investor?.submitted && (
                <button
                  onClick={() => {
                    setViewingStartup(null);
                    setSelectedStartup(viewingStartup);
                  }}
                  className="btn-primary flex-1"
                >
                  💰 Invest Now
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Investment Modal */}
      {selectedStartup && !isLocked && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="card-premium max-w-md w-full">
            <div className="mb-4">
              <h3 className="text-2xl font-bold text-gradient-gold mb-1">{selectedStartup.name}</h3>
              <p className="text-sm text-gray-600">💰 Make your investment</p>
            </div>
            
            {error && (
              <div className="mb-4 bg-red-50 border-2 border-red-300 text-red-800 px-4 py-3 rounded-lg text-sm font-medium">
                {error}
              </div>
            )}

            <div className="mb-6">
              <label className="block text-sm font-bold text-gray-700 mb-2 uppercase tracking-wide">
                Investment Amount
              </label>
              <div className="relative">
                <input
                  type="number"
                  value={investmentAmount}
                  onChange={(e) => setInvestmentAmount(e.target.value)}
                  placeholder="0"
                  className="input pr-16 text-lg font-semibold"
                  min="0"
                  max={investor.remaining + (getInvestmentForStartup(selectedStartup.id)?.amount || 0)}
                  autoFocus
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gold-600 text-sm font-bold">
                  CR
                </span>
              </div>
              <div className="mt-2 flex items-center justify-between">
                <p className="text-xs text-gray-600 font-medium">
                  Available: {formatCurrency(investor.remaining + (getInvestmentForStartup(selectedStartup.id)?.amount || 0))}
                </p>
                <button
                  type="button"
                  onClick={() => setInvestmentAmount((investor.remaining + (getInvestmentForStartup(selectedStartup.id)?.amount || 0)).toString())}
                  className="text-xs text-gold-600 hover:text-gold-700 font-bold"
                >
                  MAX
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => {
                  setSelectedStartup(null);
                  setInvestmentAmount('');
                  setError('');
                }}
                className="btn-secondary"
                disabled={submitting}
              >
                Cancel
              </button>
              <button
                onClick={handleInvest}
                disabled={submitting || !investmentAmount}
                className="btn-primary disabled:opacity-50"
              >
                {submitting ? 'Processing...' : '✓ Confirm'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
