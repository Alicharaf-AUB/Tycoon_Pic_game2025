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
        setFallbackGameState(state);
      } catch (err) {
        console.error('Error loading game state:', err);
      }
    };

    loadGameState();
    
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
        const { investor } = await api.getInvestor(investorId);
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
          <div className="loading-elite mx-auto mb-6"></div>
          <p className="text-slate-400 font-medium text-lg">Loading your portfolio...</p>
        </div>
      </div>
    );
  }

  if (!investor) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="card-premium max-w-md w-full text-center">
          <p className="text-rose-400 font-bold mb-6 text-lg">{error || 'Investor not found'}</p>
          <a href="/" className="btn-primary inline-block">
            Return to Portal
          </a>
        </div>
      </div>
    );
  }

  const currentGameState = gameState || fallbackGameState;
  const isLocked = currentGameState?.isLocked || false;
  const startups = currentGameState?.startups || [];

  return (
    <div className="min-h-screen p-4 md:p-6 lg:p-8 pb-20">
      {/* Ambient Background */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-amber-500/5 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-yellow-500/5 rounded-full blur-3xl"></div>
      </div>

      {/* Header */}
      <div className="max-w-7xl mx-auto mb-8 relative z-10">
        <div className="card-premium animate-fade-in">
          {/* Investor Info */}
          <div className="flex items-center justify-between mb-6 pb-6 border-b border-slate-700/50">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-gradient-to-br from-amber-500/20 to-yellow-500/20 rounded-2xl flex items-center justify-center border border-amber-500/30 shadow-lg">
                <span className="text-3xl">👤</span>
              </div>
              <div>
                <h1 className="text-3xl md:text-4xl font-display font-bold text-gradient-gold">
                  {investor.name}
                </h1>
                <p className="text-sm text-slate-400 font-medium flex items-center gap-2 mt-1">
                  <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                  Angel Investor
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {!isConnected && (
                <span className="badge-danger animate-pulse">
                  Reconnecting...
                </span>
              )}
              <span className="badge-gold">
                🏆 AUB Elite
              </span>
            </div>
          </div>

          {/* Portfolio Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
            <div className="stat-card text-blue-400">
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">Starting Capital</p>
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M8.433 7.418c.155-.103.346-.196.567-.267v1.698a2.305 2.305 0 01-.567-.267C8.07 8.34 8 8.114 8 8c0-.114.07-.34.433-.582zM11 12.849v-1.698c.22.071.412.164.567.267.364.243.433.468.433.582 0 .114-.07.34-.433.582a2.305 2.305 0 01-.567.267z" />
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-13a1 1 0 10-2 0v.092a4.535 4.535 0 00-1.676.662C6.602 6.234 6 7.009 6 8c0 .99.602 1.765 1.324 2.246.48.32 1.054.545 1.676.662v1.941c-.391-.127-.68-.317-.843-.504a1 1 0 10-1.51 1.31c.562.649 1.413 1.076 2.353 1.253V15a1 1 0 102 0v-.092a4.535 4.535 0 001.676-.662C13.398 13.766 14 12.991 14 12c0-.99-.602-1.765-1.324-2.246A4.535 4.535 0 0011 9.092V7.151c.391.127.68.317.843.504a1 1 0 101.511-1.31c-.563-.649-1.413-1.076-2.354-1.253V5z" clipRule="evenodd" />
                  </svg>
                </div>
                <p className="text-2xl md:text-3xl font-display font-bold text-slate-100">
                  {formatCurrency(investor.starting_credit)}
                </p>
              </div>
            </div>
            
            <div className="stat-card text-amber-400">
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">Deployed</p>
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M3 1a1 1 0 000 2h1.22l.305 1.222a.997.997 0 00.01.042l1.358 5.43-.893.892C3.74 11.846 4.632 14 6.414 14H15a1 1 0 000-2H6.414l1-1H14a1 1 0 00.894-.553l3-6A1 1 0 0017 3H6.28l-.31-1.243A1 1 0 005 1H3zM16 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zM6.5 18a1.5 1.5 0 100-3 1.5 1.5 0 000 3z" />
                  </svg>
                </div>
                <p className="text-2xl md:text-3xl font-display font-bold text-slate-100">
                  {formatCurrency(investor.invested)}
                </p>
              </div>
            </div>
            
            <div className="stat-card text-emerald-400">
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">Available</p>
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v2H7a1 1 0 100 2h2v2a1 1 0 102 0v-2h2a1 1 0 100-2h-2V7z" clipRule="evenodd" />
                  </svg>
                </div>
                <p className="text-2xl md:text-3xl font-display font-bold text-slate-100">
                  {formatCurrency(investor.remaining)}
                </p>
              </div>
            </div>
          </div>

          {/* Status Banners */}
          {isLocked && (
            <div className="bg-gradient-to-r from-yellow-500/10 to-orange-500/10 border-2 border-yellow-500/30 backdrop-blur-xl text-yellow-200 px-6 py-4 rounded-xl text-sm font-bold flex items-center gap-3 mb-4">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
              </svg>
              <span>Investment Period Concluded - Results Are Final</span>
            </div>
          )}

          {investor.submitted && (
            <div className="bg-gradient-to-r from-emerald-500/10 to-green-500/10 border-2 border-emerald-500/30 backdrop-blur-xl text-emerald-200 px-6 py-4 rounded-xl text-sm font-bold flex items-center gap-3 mb-4">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <span>Your investments have been successfully submitted!</span>
            </div>
          )}

          {/* Submit Button */}
          {!isLocked && !investor.submitted && investor.invested > 0 && (
            <button
              onClick={handleSubmit}
              disabled={submitting}
              className="w-full btn-primary text-lg py-5 font-bold disabled:opacity-50 group"
            >
              <span className="flex items-center justify-center gap-3">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>{submitting ? 'Submitting...' : 'Finalize Investment Portfolio'}</span>
                <svg className="w-5 h-5 transition-transform group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </span>
            </button>
          )}
        </div>
      </div>

      {/* Startups Section */}
      <div className="max-w-7xl mx-auto relative z-10">
        {/* Section Header */}
        <div className="flex items-center gap-4 mb-6">
          <div className="h-px flex-1 bg-gradient-to-r from-transparent to-amber-500/30"></div>
          <h2 className="text-2xl md:text-3xl font-display font-bold text-slate-100 flex items-center gap-3">
            <span className="text-3xl">🚀</span>
            Investment Opportunities
          </h2>
          <div className="h-px flex-1 bg-gradient-to-l from-transparent to-amber-500/30"></div>
        </div>
        
        {startups.length === 0 ? (
          <div className="card text-center text-slate-400 py-16">
            <svg className="w-16 h-16 mx-auto mb-4 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
            </svg>
            <p className="text-lg font-medium">Opportunities will be available shortly</p>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {startups.map((startup) => {
              const myInvestment = getInvestmentForStartup(startup.id);
              const investors = (currentGameState?.investments || [])
                .filter(inv => inv.startup_id === startup.id)
                .sort((a, b) => b.amount - a.amount);

              return (
                <div key={startup.id} className="card-hover relative group animate-fade-in">
                  {/* Quick Action Button */}
                  <button
                    onClick={() => setViewingStartup(startup)}
                    className="absolute top-4 right-4 z-10 bg-slate-800/90 backdrop-blur-xl hover:bg-slate-700/90 text-slate-300 hover:text-amber-400 text-xs font-bold px-3 py-1.5 rounded-lg border border-slate-700 hover:border-amber-500/50 transition-all shadow-lg"
                  >
                    <span className="flex items-center gap-1">
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span>Details</span>
                    </span>
                  </button>

                  {/* Logo */}
                  {startup.logo && (
                    <div className="mb-4 flex justify-center">
                      <div className="w-20 h-20 bg-slate-800/50 rounded-2xl p-3 border border-slate-700/50">
                        <img 
                          src={getFileUrl(startup.logo)} 
                          alt={`${startup.name} logo`}
                          className="w-full h-full object-contain cursor-pointer"
                          onClick={() => setViewingStartup(startup)}
                        />
                      </div>
                    </div>
                  )}
                  
                  {/* Startup Info */}
                  <div className="mb-4">
                    <h3 
                      className="text-xl font-display font-bold text-slate-100 mb-2 cursor-pointer hover:text-amber-400 transition-colors"
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

                  {/* Total Raised */}
                  <div className="mb-4 pb-4 border-b border-slate-700/50">
                    <div className="flex items-baseline justify-between">
                      <span className="text-xs text-slate-500 font-bold uppercase tracking-wider">Total Raised</span>
                      <span className="text-xs text-slate-500">{investors.length} investors</span>
                    </div>
                    <p className="text-3xl font-display font-bold text-gradient-gold mt-1">
                      {formatCurrency(startup.total_raised)}
                    </p>
                  </div>

                  {/* My Investment */}
                  {myInvestment && (
                    <div className="mb-4 relative bg-gradient-to-br from-amber-500/10 to-yellow-500/10 border-2 border-amber-500/30 rounded-xl p-4 overflow-hidden">
                      <div className="absolute inset-0 bg-gradient-radial from-amber-500/5 to-transparent"></div>
                      <div className="relative z-10">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs font-bold text-amber-300 uppercase tracking-wider flex items-center gap-2">
                            <span className="inline-block w-2 h-2 rounded-full bg-amber-400 animate-pulse"></span>
                            Your Position
                          </span>
                          {!isLocked && !investor.submitted && (
                            <button
                              onClick={() => handleRemoveInvestment(startup.id)}
                              disabled={submitting}
                              className="text-xs text-rose-400 hover:text-rose-300 font-bold transition-colors"
                            >
                              Remove
                            </button>
                          )}
                        </div>
                        <p className="text-2xl font-display font-bold text-slate-100 mb-1">
                          {formatCurrency(myInvestment.amount)}
                        </p>
                        <p className="text-xs text-slate-400 font-medium">
                          {formatPercentage(myInvestment.amount, startup.total_raised)} of total
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Investor List */}
                  {investors.length > 0 && (
                    <div className="mb-4">
                      <p className="text-xs text-slate-500 mb-2 font-bold uppercase tracking-wider flex items-center gap-2">
                        <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3zM6 8a2 2 0 11-4 0 2 2 0 014 0zM16 18v-3a5.972 5.972 0 00-.75-2.906A3.005 3.005 0 0119 15v3h-3zM4.75 12.094A5.973 5.973 0 004 15v3H1v-3a3 3 0 013.75-2.906z" />
                        </svg>
                        Investors
                      </p>
                      <div className="space-y-1.5 max-h-32 overflow-y-auto scrollbar-thin">
                        {investors.slice(0, 5).map((inv) => (
                          <div
                            key={inv.id}
                            className="flex items-center justify-between text-xs bg-slate-800/30 backdrop-blur-xl px-3 py-2 rounded-lg border border-slate-700/30"
                          >
                            <span className={inv.investor_id === investorId ? 'text-amber-400 font-bold' : 'text-slate-400 font-medium'}>
                              {inv.investor_name}
                            </span>
                            <span className="text-slate-500 font-semibold">
                              {formatCurrency(inv.amount)}
                            </span>
                          </div>
                        ))}
                        {investors.length > 5 && (
                          <p className="text-xs text-slate-500 italic text-center pt-1">
                            +{investors.length - 5} more investors
                          </p>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Action Button */}
                  {!isLocked && !investor.submitted ? (
                    <button
                      onClick={() => setSelectedStartup(startup)}
                      disabled={submitting}
                      className="btn-primary w-full text-sm py-3"
                    >
                      {myInvestment ? '✏️ Modify Investment' : '💰 Make Investment'}
                    </button>
                  ) : investor.submitted && (
                    <div className="bg-emerald-500/10 border-2 border-emerald-500/30 text-emerald-300 text-xs font-bold text-center py-3 rounded-xl">
                      ✓ Submitted
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Investment Modal */}
      {selectedStartup && !isLocked && (
        <div className="modal-overlay flex items-center justify-center p-4">
          <div className="card-premium max-w-lg w-full my-8 animate-fade-in">
            <div className="mb-6">
              <h3 className="text-3xl font-display font-bold text-gradient-gold mb-2">{selectedStartup.name}</h3>
              <p className="text-sm text-slate-400 flex items-center gap-2">
                <span className="inline-block w-2 h-2 rounded-full bg-amber-500"></span>
                Configure your investment
              </p>
            </div>
            
            {error && (
              <div className="mb-6 bg-rose-500/10 border-2 border-rose-500/30 backdrop-blur-xl text-rose-300 px-6 py-4 rounded-xl text-sm font-medium animate-fade-in">
                <div className="flex items-center gap-3">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  <span>{error}</span>
                </div>
              </div>
            )}

            <div className="mb-8">
              <label className="block text-sm font-bold text-slate-300 mb-3 uppercase tracking-wider">
                Investment Amount
              </label>
              <div className="relative">
                <input
                  type="number"
                  value={investmentAmount}
                  onChange={(e) => setInvestmentAmount(e.target.value)}
                  placeholder="0"
                  className="input pr-24 text-xl font-bold text-amber-400"
                  min="0"
                  max={investor.remaining + (getInvestmentForStartup(selectedStartup.id)?.amount || 0)}
                  autoFocus
                />
                <span className="absolute right-6 top-1/2 -translate-y-1/2 text-amber-500 text-sm font-bold">
                  €
                </span>
              </div>
              <div className="mt-3 flex items-center justify-between">
                <p className="text-xs text-slate-500 font-medium">
                  Available: <span className="text-slate-300 font-bold">{formatCurrency(investor.remaining + (getInvestmentForStartup(selectedStartup.id)?.amount || 0))}</span>
                </p>
                <button
                  type="button"
                  onClick={() => setInvestmentAmount((investor.remaining + (getInvestmentForStartup(selectedStartup.id)?.amount || 0)).toString())}
                  className="text-xs text-amber-400 hover:text-amber-300 font-bold uppercase tracking-wider transition-colors"
                >
                  Max Amount
                </button>
              </div>
            </div>

            <div className="flex gap-4">
              <button
                onClick={() => {
                  setSelectedStartup(null);
                  setInvestmentAmount('');
                  setError('');
                }}
                className="btn-secondary flex-1"
                disabled={submitting}
              >
                Cancel
              </button>
              <button
                onClick={handleInvest}
                disabled={submitting || !investmentAmount}
                className="btn-primary flex-1 disabled:opacity-50"
              >
                {submitting ? 'Processing...' : 'Confirm Investment'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Startup Details Modal */}
      {viewingStartup && (
        <StartupDetailsModal 
          startup={viewingStartup}
          gameState={currentGameState}
          investor={investor}
          isLocked={isLocked}
          onClose={() => setViewingStartup(null)}
          onInvest={() => {
            setViewingStartup(null);
            setSelectedStartup(viewingStartup);
          }}
        />
      )}
    </div>
  );
}

// Startup Details Modal Component
function StartupDetailsModal({ startup, gameState, investor, isLocked, onClose, onInvest }) {
  return (
    <div className="modal-overlay flex items-center justify-center p-4 overflow-y-auto">
      <div className="card-premium max-w-4xl w-full my-8 animate-fade-in">
        <button
          onClick={onClose}
          className="absolute top-6 right-6 text-slate-400 hover:text-slate-200 transition-colors z-10"
        >
          <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {/* Logo */}
        {startup.logo && (
          <div className="mb-8 flex justify-center">
            <div className="w-32 h-32 bg-slate-800/50 rounded-3xl p-6 border border-slate-700/50">
              <img 
                src={getFileUrl(startup.logo)} 
                alt={`${startup.name} logo`}
                className="w-full h-full object-contain"
              />
            </div>
          </div>
        )}

        <h2 className="text-4xl md:text-5xl font-display font-bold text-gradient-gold mb-6 text-center">{startup.name}</h2>

        {/* Description */}
        {startup.description && (
          <div className="mb-8 p-6 bg-slate-800/30 backdrop-blur-xl rounded-xl border border-slate-700/50">
            <h3 className="text-sm font-bold text-amber-400 uppercase tracking-wider mb-3">Overview</h3>
            <p className="text-slate-300 leading-relaxed">{startup.description}</p>
          </div>
        )}

        {/* Key Details Grid */}
        <div className="grid md:grid-cols-2 gap-6 mb-8">
          {startup.industry && (
            <div className="p-6 bg-slate-800/30 backdrop-blur-xl rounded-xl border border-slate-700/50">
              <h3 className="text-sm font-bold text-amber-400 uppercase tracking-wider mb-3">Industry</h3>
              <p className="text-slate-100 font-semibold text-lg">{startup.industry}</p>
            </div>
          )}

          {startup.ask && (
            <div className="p-6 bg-slate-800/30 backdrop-blur-xl rounded-xl border border-slate-700/50">
              <h3 className="text-sm font-bold text-amber-400 uppercase tracking-wider mb-3">Funding Ask</h3>
              <p className="text-emerald-400 font-bold text-lg">{startup.ask}</p>
            </div>
          )}

          {startup.generating_revenue && (
            <div className="p-6 bg-slate-800/30 backdrop-blur-xl rounded-xl border border-slate-700/50">
              <h3 className="text-sm font-bold text-amber-400 uppercase tracking-wider mb-3">Revenue Status</h3>
              <p className={`font-semibold text-lg ${startup.generating_revenue === 'Yes' ? 'text-emerald-400' : 'text-slate-400'}`}>
                {startup.generating_revenue}
              </p>
            </div>
          )}

          {startup.legal_entity && (
            <div className="p-6 bg-slate-800/30 backdrop-blur-xl rounded-xl border border-slate-700/50">
              <h3 className="text-sm font-bold text-amber-400 uppercase tracking-wider mb-3">Legal Entity</h3>
              <p className="text-slate-100 font-semibold text-lg">{startup.legal_entity}</p>
            </div>
          )}
        </div>

        {/* Team */}
        {startup.team && (
          <div className="mb-8 p-6 bg-slate-800/30 backdrop-blur-xl rounded-xl border border-slate-700/50">
            <h3 className="text-sm font-bold text-amber-400 uppercase tracking-wider mb-3">Team</h3>
            <p className="text-slate-300 leading-relaxed">{startup.team}</p>
          </div>
        )}

        {/* Programs & Cohorts */}
        {(startup.cohort || startup.support_program) && (
          <div className="mb-8 p-6 bg-slate-800/30 backdrop-blur-xl rounded-xl border border-slate-700/50">
            <h3 className="text-sm font-bold text-amber-400 uppercase tracking-wider mb-4">Programs & Cohorts</h3>
            <div className="flex flex-wrap gap-3">
              {startup.cohort && startup.cohort.split(',').map((c, i) => (
                <span key={i} className="bg-blue-500/20 text-blue-300 text-xs font-bold px-4 py-2 rounded-full border border-blue-500/30">
                  {c.trim()}
                </span>
              ))}
              {startup.support_program && startup.support_program.split(',').map((p, i) => (
                <span key={i} className="bg-purple-500/20 text-purple-300 text-xs font-bold px-4 py-2 rounded-full border border-purple-500/30">
                  {p.trim()}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Contact */}
        {startup.email && (
          <div className="mb-8 p-6 bg-slate-800/30 backdrop-blur-xl rounded-xl border border-slate-700/50">
            <h3 className="text-sm font-bold text-amber-400 uppercase tracking-wider mb-3">Contact</h3>
            <a href={`mailto:${startup.email}`} className="text-blue-400 hover:text-blue-300 font-semibold transition-colors">
              {startup.email}
            </a>
          </div>
        )}

        {/* Pitch Deck */}
        {startup.pitch_deck && (
          <div className="mb-8">
            <a 
              href={getFileUrl(startup.pitch_deck)} 
              target="_blank" 
              rel="noopener noreferrer"
              className="btn-secondary w-full justify-center inline-flex items-center gap-3"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <span>View Pitch Deck</span>
            </a>
          </div>
        )}

        {/* Investment Stats */}
        <div className="mb-8 relative bg-gradient-to-br from-amber-500/10 to-yellow-500/10 border-2 border-amber-500/30 rounded-2xl p-8 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-radial from-amber-500/10 to-transparent"></div>
          <div className="relative z-10">
            <h3 className="text-sm font-bold text-amber-400 uppercase tracking-wider mb-6 text-center">Investment Metrics</h3>
            <div className="grid grid-cols-2 gap-6">
              <div className="text-center">
                <p className="text-xs text-slate-400 mb-2">Total Raised</p>
                <p className="text-4xl font-display font-bold text-gradient-gold">{formatCurrency(startup.total_raised || 0)}</p>
              </div>
              <div className="text-center">
                <p className="text-xs text-slate-400 mb-2">Investors</p>
                <p className="text-4xl font-display font-bold text-gradient-gold">
                  {gameState?.investments?.filter(inv => inv.startup_id === startup.id).length || 0}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-4">
          <button
            onClick={onClose}
            className="btn-secondary flex-1"
          >
            Close
          </button>
          {!isLocked && !investor?.submitted && (
            <button
              onClick={onInvest}
              className="btn-primary flex-1"
            >
              Make Investment
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
