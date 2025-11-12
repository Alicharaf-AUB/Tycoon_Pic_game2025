import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSocket } from '../context/SocketContext';
import { useTheme } from '../context/ThemeContext';
import { api, formatCurrency, formatPercentage, getFileUrl } from '../utils/api';
import { generateInvestmentReport } from '../utils/pdfExport';
import InvestmentConfirmationModal from '../components/InvestmentConfirmationModal';
import FundsRequestModal from '../components/FundsRequestModal';
import TransactionHistory from '../components/TransactionHistory';
import StartupDetailsModal from '../components/StartupDetailsModal';
import PortfolioAnalytics from '../components/PortfolioAnalytics';

export default function DashboardPage() {
  const { investorId } = useParams();
  const navigate = useNavigate();
  const { gameState, isConnected } = useSocket();
  const { theme, toggleTheme, isDark } = useTheme();
  const [investor, setInvestor] = useState(null);
  const [selectedStartup, setSelectedStartup] = useState(null);
  const [viewingStartup, setViewingStartup] = useState(null);
  const [investmentAmount, setInvestmentAmount] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [fallbackGameState, setFallbackGameState] = useState(null);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [lastInvestment, setLastInvestment] = useState(null);
  const [showFundsRequest, setShowFundsRequest] = useState(false);
  const [showTransactions, setShowTransactions] = useState(false);
  const [activeTab, setActiveTab] = useState('opportunities'); // opportunities, portfolio, transactions

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
        setError('Investor account not found');
      } finally {
        setLoading(false);
      }
    };

    loadInvestor();
  }, [investorId]);

  // Update investor from game state
  useEffect(() => {
    if (gameState?.investors) {
      const updatedInvestor = gameState.investors.find(i => i.id === parseInt(investorId));
      if (updatedInvestor) {
        console.log('🔄 Updating investor from game state:', updatedInvestor);
        setInvestor(updatedInvestor);
      }
    }
  }, [gameState, investorId]);

  const getInvestmentForStartup = (startupId) => {
    const state = gameState || fallbackGameState;
    if (!state?.investments) return null;
    return state.investments.find(
      inv => inv.investor_id === parseInt(investorId) && inv.startup_id === startupId
    );
  };

  // Calculate actual remaining amount based on current investments
  const getActualRemaining = () => {
    const state = gameState || fallbackGameState;
    if (!state?.investments || !investor) return investor?.remaining || 0;
    
    const myInvestments = state.investments.filter(
      inv => inv.investor_id === parseInt(investorId)
    );
    
    const totalInvested = myInvestments.reduce((sum, inv) => sum + parseFloat(inv.amount || 0), 0);
    const remaining = parseFloat(investor.starting_credit || 0) - totalInvested;
    
    console.log('💰 Calculated remaining:', {
      starting_credit: investor.starting_credit,
      totalInvested,
      remaining,
      investmentCount: myInvestments.length
    });
    
    return remaining;
  };

  const handleInvest = async () => {
    if (!selectedStartup || !investmentAmount) return;

    const amount = parseInt(investmentAmount);
    if (isNaN(amount) || amount < 0) {
      setError('Invalid amount');
      return;
    }

    // Validate minimum investment and increments
    if (amount > 0 && amount < 500) {
      setError('Minimum investment is 500€');
      return;
    }

    if (amount % 500 !== 0) {
      setError('Investment must be in increments of 500€ (e.g., 500€, 1,000€, 1,500€)');
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      await api.invest(investorId, selectedStartup.id, amount);

      // Store investment details for confirmation
      setLastInvestment({
        startup: selectedStartup,
        amount: amount,
        date: new Date(),
        investorName: investor.name
      });

      setSelectedStartup(null);
      setInvestmentAmount('');
      setShowConfirmation(true);
    } catch (err) {
      const errorMsg = err.response?.data?.error || 'Failed to make investment';
      setError(errorMsg);
      // Show alert for startup limit errors
      if (errorMsg.includes('Maximum startup limit')) {
        alert(errorMsg);
      }
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
    // Check if there are remaining funds
    const remaining = getActualRemaining();
    if (remaining > 0) {
      alert(`⚠️ You must invest all your available funds before finalizing.\n\nRemaining: ${formatCurrency(remaining)}\n\nPlease allocate the remaining funds to startups.`);
      return;
    }

    if (!confirm('Are you sure you want to finalize your portfolio? This action cannot be undone.')) {
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      await api.submit(investorId);

      // Refresh investor data to reflect submitted status
      const { investor: updatedInvestor } = await api.getInvestor(investorId);
      setInvestor(updatedInvestor);

      // Show success notification
      setShowConfirmation(true);
      setLastInvestment({
        startup: null,
        amount: updatedInvestor.invested,
        date: new Date(),
        investorName: updatedInvestor.name,
        isFinalization: true
      });
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to submit investments');
    } finally {
      setSubmitting(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('investor');
    // Clear Remember Me data on explicit logout
    localStorage.removeItem('rememberedInvestorId');
    localStorage.removeItem('rememberedName');
    navigate('/');
  };

  const handleExportPDF = () => {
    generateInvestmentReport(investor, myInvestments, startups, currentGameState);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="loading-elite mx-auto mb-6"></div>
          <p className="text-slate-400 font-medium text-lg">Loading your executive dashboard...</p>
        </div>
      </div>
    );
  }

  if (!investor) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="card-premium max-w-md w-full text-center">
          <svg className="w-20 h-20 mx-auto mb-6 text-rose-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <p className="text-rose-400 font-bold mb-6 text-lg">{error || 'Account Not Found'}</p>
          <a href="/" className="btn-executive inline-block">
            Return to Login
          </a>
        </div>
      </div>
    );
  }

  const currentGameState = gameState || fallbackGameState;
  const isLocked = currentGameState?.isLocked || false;
  const startups = currentGameState?.startups || [];
  const myInvestments = (currentGameState?.investments || []).filter(inv => inv.investor_id === parseInt(investorId));

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      {/* Premium Navigation Header */}
      <nav className="sticky top-0 z-50 bg-slate-900/90 backdrop-blur-xl border-b border-slate-800/50 shadow-2xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            {/* Logo & Title */}
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500/20 to-indigo-500/20 rounded-xl flex items-center justify-center border border-blue-500/30">
                <svg className="w-7 h-7" viewBox="0 0 24 24" fill="none">
                  <path d="M12 2L2 7L12 12L22 7L12 2Z" stroke="currentColor" className="text-blue-400" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M2 17L12 22L22 17" stroke="currentColor" className="text-blue-400" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M2 12L12 17L22 12" stroke="currentColor" className="text-blue-400" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <div>
                <h1 className="text-xl font-display font-bold text-slate-100">Investment Hub</h1>
                <p className="text-xs text-slate-500">VIP Executive Portal</p>
              </div>
            </div>

            {/* Navigation Tabs */}
            <div className="hidden md:flex items-center gap-2">
              <button
                onClick={() => setActiveTab('opportunities')}
                className={`px-4 py-2 rounded-lg font-semibold text-sm transition-all ${
                  activeTab === 'opportunities'
                    ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                    : 'text-slate-400 hover:text-slate-300 hover:bg-slate-800/50'
                }`}
              >
                Opportunities
              </button>
              <button
                onClick={() => setActiveTab('portfolio')}
                className={`px-4 py-2 rounded-lg font-semibold text-sm transition-all ${
                  activeTab === 'portfolio'
                    ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                    : 'text-slate-400 hover:text-slate-300 hover:bg-slate-800/50'
                }`}
              >
                Portfolio
              </button>
              <button
                onClick={() => setActiveTab('transactions')}
                className={`px-4 py-2 rounded-lg font-semibold text-sm transition-all ${
                  activeTab === 'transactions'
                    ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                    : 'text-slate-400 hover:text-slate-300 hover:bg-slate-800/50'
                }`}
              >
                Transactions
              </button>
            </div>

            {/* User Menu */}
            <div className="flex items-center gap-4">
              {!isConnected && (
                <span className="badge-danger animate-pulse text-xs">
                  Reconnecting...
                </span>
              )}
              <div className="hidden sm:flex items-center gap-3 px-4 py-2 bg-slate-800/50 rounded-xl border border-slate-700/50">
                <div className="w-8 h-8 bg-gradient-to-br from-blue-500/30 to-indigo-500/30 rounded-full flex items-center justify-center">
                  <span className="text-sm font-bold text-blue-300">{investor.name.charAt(0)}</span>
                </div>
                <div className="text-left">
                  <p className="text-sm font-semibold text-slate-200">{investor.name}</p>
                  <p className="text-xs text-slate-500">VIP Investor</p>
                </div>
              </div>
              <button
                onClick={toggleTheme}
                className="text-slate-400 hover:text-slate-200 transition-colors p-2 hover:bg-slate-800/50 rounded-lg"
                title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
              >
                {isDark ? (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                  </svg>
                )}
              </button>
              <button
                onClick={handleLogout}
                className="text-slate-400 hover:text-slate-200 transition-colors p-2 hover:bg-slate-800/50 rounded-lg"
                title="Logout"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Portfolio Overview Card */}
        <div className="card-premium mb-8 animate-fade-in">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Portfolio Value */}
            <div className="lg:col-span-1">
              <div className="text-center lg:text-left">
                <p className="text-sm text-slate-500 font-bold uppercase tracking-wider mb-2">Total Capital</p>
                <p className="text-4xl font-display font-bold text-gradient-executive bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-blue-600 mb-1">
                  {formatCurrency(investor.starting_credit)}
                </p>
                <p className="text-xs text-slate-600">Investment Capacity</p>
              </div>
            </div>

            {/* Deployed Capital */}
            <div className="lg:col-span-1">
              <div className="stat-card bg-blue-500/10 border-blue-500/20">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">Deployed</p>
                  <svg className="w-5 h-5 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M8.433 7.418c.155-.103.346-.196.567-.267v1.698a2.305 2.305 0 01-.567-.267C8.07 8.34 8 8.114 8 8c0-.114.07-.34.433-.582zM11 12.849v-1.698c.22.071.412.164.567.267.364.243.433.468.433.582 0 .114-.07.34-.433.582a2.305 2.305 0 01-.567.267z" />
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-13a1 1 0 10-2 0v.092a4.535 4.535 0 00-1.676.662C6.602 6.234 6 7.009 6 8c0 .99.602 1.765 1.324 2.246.48.32 1.054.545 1.676.662v1.941c-.391-.127-.68-.317-.843-.504a1 1 0 10-1.51 1.31c.562.649 1.413 1.076 2.353 1.253V15a1 1 0 102 0v-.092a4.535 4.535 0 001.676-.662C13.398 13.766 14 12.991 14 12c0-.99-.602-1.765-1.324-2.246A4.535 4.535 0 0011 9.092V7.151c.391.127.68.317.843.504a1 1 0 101.511-1.31c-.563-.649-1.413-1.076-2.354-1.253V5z" clipRule="evenodd" />
                  </svg>
                </div>
                <p className="text-3xl font-display font-bold text-blue-300">
                  {formatCurrency(investor.invested)}
                </p>
                <p className="text-xs text-slate-600 mt-1">
                  {myInvestments.length} {myInvestments.length === 1 ? 'Investment' : 'Investments'}
                </p>
              </div>
            </div>

            {/* Available Funds */}
            <div className="lg:col-span-1">
              <div className="stat-card bg-emerald-500/10 border-emerald-500/20">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">Available</p>
                  <svg className="w-5 h-5 text-emerald-400" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v2H7a1 1 0 100 2h2v2a1 1 0 102 0v-2h2a1 1 0 100-2h-2V7z" clipRule="evenodd" />
                  </svg>
                </div>
                <p className="text-3xl font-display font-bold text-emerald-300">
                  {formatCurrency(getActualRemaining())}
                </p>
                <button
                  onClick={() => setShowFundsRequest(true)}
                  className="text-xs text-blue-400 hover:text-blue-300 font-semibold mt-2 transition-colors"
                >
                  Request Additional Funds →
                </button>
              </div>
            </div>

            {/* Allocation Rate */}
            <div className="lg:col-span-1">
              <div className="stat-card bg-purple-500/10 border-purple-500/20">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">Allocation</p>
                  <svg className="w-5 h-5 text-purple-400" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M2 11a1 1 0 011-1h2a1 1 0 011 1v5a1 1 0 01-1 1H3a1 1 0 01-1-1v-5zM8 7a1 1 0 011-1h2a1 1 0 011 1v9a1 1 0 01-1 1H9a1 1 0 01-1-1V7zM14 4a1 1 0 011-1h2a1 1 0 011 1v12a1 1 0 01-1 1h-2a1 1 0 01-1-1V4z" />
                  </svg>
                </div>
                <p className="text-3xl font-display font-bold text-purple-300">
                  {formatPercentage(investor.invested, investor.starting_credit)}
                </p>
                <p className="text-xs text-slate-600 mt-1">of Total Capital</p>
              </div>
            </div>
          </div>

          {/* PDF Export Button */}
          {investor.invested > 0 && (
            <div className="mt-6">
              <button
                onClick={handleExportPDF}
                className="w-full btn-secondary text-sm py-4 font-semibold flex items-center justify-center gap-3 group hover:border-blue-500/50"
              >
                <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <span>Download Investment Report (PDF)</span>
                <span className="text-xs text-slate-500 ml-1">• Professional Portfolio Summary</span>
              </button>
            </div>
          )}

          {/* Status Banners */}
          {isLocked && (
            <div className="mt-6 bg-gradient-to-r from-amber-500/10 to-orange-500/10 border-2 border-amber-500/30 backdrop-blur-xl text-amber-200 px-6 py-4 rounded-xl text-sm font-bold flex items-center gap-3">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
              </svg>
              <span>Investment Period Concluded - Portfolio Locked</span>
            </div>
          )}

          {investor.submitted && (
            <div className="mt-6 space-y-4">
              <div className="bg-gradient-to-r from-emerald-500/10 to-green-500/10 border-2 border-emerald-500/30 backdrop-blur-xl text-emerald-200 px-6 py-5 rounded-xl">
                <div className="flex items-start gap-4">
                  <div className="mt-0.5">
                    <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <h3 className="font-bold text-lg mb-2">✅ Portfolio Successfully Finalized!</h3>
                    <p className="text-emerald-300 text-sm mb-3">
                      Your investment portfolio has been locked and submitted. You can now view your complete portfolio analytics and transaction history in the tabs below.
                    </p>
                    <div className="flex gap-3 text-xs">
                      <button
                        onClick={() => setActiveTab('portfolio')}
                        className="px-4 py-2 bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/30 rounded-lg font-semibold transition-colors"
                      >
                        📊 View Portfolio
                      </button>
                      <button
                        onClick={() => setActiveTab('transactions')}
                        className="px-4 py-2 bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/30 rounded-lg font-semibold transition-colors"
                      >
                        📜 View Transactions
                      </button>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Request Additional Funds Option */}
              <div className="bg-slate-800/40 border border-slate-700/50 backdrop-blur-xl px-6 py-4 rounded-xl">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-bold text-slate-200 mb-1">Want to invest more?</h4>
                    <p className="text-sm text-slate-400">Request additional capital to expand your portfolio</p>
                  </div>
                  <button
                    onClick={() => setShowFundsRequest(true)}
                    className="px-5 py-2.5 bg-blue-500/20 hover:bg-blue-500/30 border border-blue-500/30 rounded-lg font-semibold text-blue-300 transition-colors whitespace-nowrap"
                  >
                    💰 Request Funds
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Finalize Portfolio Button */}
          {!isLocked && !investor.submitted && investor.invested > 0 && (
            <div className="mt-6">
              <button
                onClick={handleSubmit}
                disabled={submitting}
                className="w-full btn-executive text-lg py-5 font-bold disabled:opacity-50 group"
              >
                <span className="flex items-center justify-center gap-3">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span>{submitting ? 'Processing...' : 'Finalize Investment Portfolio'}</span>
                  <svg className="w-5 h-5 transition-transform group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </span>
              </button>
            </div>
          )}
        </div>

        {/* Mobile Tab Navigation */}
        <div className="md:hidden mb-6 flex gap-2 overflow-x-auto">
          <button
            onClick={() => setActiveTab('opportunities')}
            className={`px-4 py-2 rounded-lg font-semibold text-sm whitespace-nowrap transition-all ${
              activeTab === 'opportunities'
                ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                : 'text-slate-400 bg-slate-800/50'
            }`}
          >
            Opportunities
          </button>
          <button
            onClick={() => setActiveTab('portfolio')}
            className={`px-4 py-2 rounded-lg font-semibold text-sm whitespace-nowrap transition-all ${
              activeTab === 'portfolio'
                ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                : 'text-slate-400 bg-slate-800/50'
            }`}
          >
            Portfolio
          </button>
          <button
            onClick={() => setActiveTab('transactions')}
            className={`px-4 py-2 rounded-lg font-semibold text-sm whitespace-nowrap transition-all ${
              activeTab === 'transactions'
                ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                : 'text-slate-400 bg-slate-800/50'
            }`}
          >
            Transactions
          </button>
        </div>

        {/* Tab Content */}
        {activeTab === 'opportunities' && (
          <OpportunitiesTab
            startups={startups}
            investor={investor}
            investorId={investorId}
            currentGameState={currentGameState}
            isLocked={isLocked}
            submitting={submitting}
            getInvestmentForStartup={getInvestmentForStartup}
            setSelectedStartup={setSelectedStartup}
            setViewingStartup={setViewingStartup}
            handleRemoveInvestment={handleRemoveInvestment}
          />
        )}

        {activeTab === 'portfolio' && (
          <PortfolioAnalytics
            investor={investor}
            investments={myInvestments}
            startups={startups}
            gameState={currentGameState}
          />
        )}

        {activeTab === 'transactions' && (
          <TransactionHistory
            investorId={investorId}
            investments={currentGameState?.investments || []}
            startups={startups}
          />
        )}
      </div>

      {/* Investment Modal */}
      {selectedStartup && !isLocked && (
        <div className="modal-overlay flex items-center justify-center p-4">
          <div className="card-premium max-w-lg w-full my-8 animate-fade-in">
            <div className="mb-6">
              <h3 className="text-3xl font-display font-bold text-gradient-executive bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-blue-600 mb-2">
                {selectedStartup.name}
              </h3>
              <p className="text-sm text-slate-400 flex items-center gap-2">
                <span className="inline-block w-2 h-2 rounded-full bg-blue-500"></span>
                Configure your investment amount
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
                Investment Amount (Minimum 500€, increments of 500€)
              </label>
              <div className="relative">
                <input
                  type="number"
                  value={investmentAmount}
                  onChange={(e) => setInvestmentAmount(e.target.value)}
                  placeholder="500"
                  className="input-executive pr-24 text-xl font-bold text-blue-400"
                  min="500"
                  step="500"
                  max={getActualRemaining() + (getInvestmentForStartup(selectedStartup.id)?.amount || 0)}
                  autoFocus
                />
                <span className="absolute right-6 top-1/2 -translate-y-1/2 text-blue-500 text-sm font-bold">
                  €
                </span>
              </div>
              <div className="mt-3 flex items-center justify-between">
                <p className="text-xs text-slate-500 font-medium">
                  Available: <span className="text-slate-300 font-bold">{formatCurrency(getActualRemaining() + (getInvestmentForStartup(selectedStartup.id)?.amount || 0))}</span>
                </p>
                <button
                  type="button"
                  onClick={() => setInvestmentAmount((getActualRemaining() + (getInvestmentForStartup(selectedStartup.id)?.amount || 0)).toString())}
                  className="text-xs text-blue-400 hover:text-blue-300 font-bold uppercase tracking-wider transition-colors"
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
                className="btn-executive flex-1 disabled:opacity-50"
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

      {/* Investment Confirmation Modal */}
      {showConfirmation && lastInvestment && (
        <InvestmentConfirmationModal
          investment={lastInvestment}
          investor={investor}
          onClose={() => setShowConfirmation(false)}
        />
      )}

      {/* Funds Request Modal */}
      {showFundsRequest && (
        <FundsRequestModal
          investor={investor}
          onClose={() => setShowFundsRequest(false)}
        />
      )}
    </div>
  );
}

// Opportunities Tab Component
function OpportunitiesTab({
  startups,
  investor,
  investorId,
  currentGameState,
  isLocked,
  submitting,
  getInvestmentForStartup,
  setSelectedStartup,
  setViewingStartup,
  handleRemoveInvestment
}) {
  if (startups.length === 0) {
    return (
      <div className="card-premium text-center py-16">
        <svg className="w-20 h-20 mx-auto mb-6 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
        </svg>
        <p className="text-xl font-semibold text-slate-400 mb-2">No Investment Opportunities Available</p>
        <p className="text-sm text-slate-500">New opportunities will appear here when they become available</p>
      </div>
    );
  }

  return (
    <div>
      {/* Section Header */}
      <div className="flex items-center gap-4 mb-6">
        <div className="h-px flex-1 bg-gradient-to-r from-transparent to-blue-500/30"></div>
        <h2 className="text-2xl md:text-3xl font-display font-bold text-slate-100 flex items-center gap-3">
          <svg className="w-8 h-8 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
          Investment Opportunities
        </h2>
        <div className="h-px flex-1 bg-gradient-to-l from-transparent to-blue-500/30"></div>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {startups.map((startup) => {
          const myInvestment = getInvestmentForStartup(startup.id);
          const investors = (currentGameState?.investments || [])
            .filter(inv => inv.startup_id === startup.id)
            .sort((a, b) => b.amount - a.amount);

          return (
            <div key={startup.id} className="card-hover relative group animate-fade-in overflow-hidden">
              {/* Airtable-style Cover/Header with Logo */}
              <div
                className="relative h-32 sm:h-40 bg-gradient-to-br from-slate-800 via-slate-800/90 to-slate-900 border-b border-slate-700/50 cursor-pointer overflow-hidden"
                onClick={() => setViewingStartup(startup)}
              >
                {/* Background Pattern */}
                <div className="absolute inset-0 opacity-10">
                  <div className="absolute inset-0 bg-gradient-to-br from-blue-500/20 to-transparent"></div>
                  <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full blur-3xl"></div>
                  <div className="absolute bottom-0 left-0 w-32 h-32 bg-indigo-500/10 rounded-full blur-3xl"></div>
                </div>

                {/* Logo - Large and Centered */}
                {startup.logo ? (
                  <div className="relative h-full flex items-center justify-center p-4 sm:p-6">
                    <div className="w-24 h-24 sm:w-32 sm:h-32 bg-white/95 rounded-xl sm:rounded-2xl p-3 sm:p-4 shadow-2xl border border-slate-300/20 backdrop-blur-sm">
                      <img
                        src={getFileUrl(startup.logo)}
                        alt={`${startup.name} logo`}
                        className="w-full h-full object-contain"
                        onError={(e) => {
                          console.error('❌ Failed to load logo:', startup.logo, 'Full URL:', getFileUrl(startup.logo));
                          e.target.style.display = 'none';
                          e.target.parentElement.innerHTML = `<div class="w-full h-full flex items-center justify-center text-slate-400 text-xs">Logo Error</div>`;
                        }}
                        onLoad={() => console.log('✅ Logo loaded:', startup.logo)}
                      />
                    </div>
                  </div>
                ) : (
                  <div className="relative h-full flex items-center justify-center p-4 sm:p-6">
                    <div className="w-24 h-24 sm:w-32 sm:h-32 bg-slate-700/50 rounded-xl sm:rounded-2xl flex items-center justify-center border border-slate-600/50">
                      <svg className="w-12 h-12 sm:w-16 sm:h-16 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                      </svg>
                    </div>
                  </div>
                )}

                {/* Quick Details Button */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setViewingStartup(startup);
                  }}
                  className="absolute top-2 right-2 sm:top-3 sm:right-3 z-10 bg-slate-900/90 backdrop-blur-xl hover:bg-slate-800 text-slate-300 hover:text-blue-400 text-xs font-bold px-2 py-1 sm:px-3 sm:py-1.5 rounded-lg border border-slate-700 hover:border-blue-500/50 transition-all shadow-lg"
                >
                  <span className="flex items-center gap-1">
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span className="hidden sm:inline">Full Details</span>
                    <span className="sm:hidden">Details</span>
                  </span>
                </button>
              </div>

              {/* Card Content */}
              <div className="p-4 sm:p-5">
                {/* Startup Name & Industry */}
                <div className="mb-3 sm:mb-4">
                  <div className="flex items-start justify-between gap-2 sm:gap-3 mb-2">
                    <h3
                      className="text-lg sm:text-xl font-display font-bold text-slate-100 cursor-pointer hover:text-blue-400 transition-colors flex-1"
                      onClick={() => setViewingStartup(startup)}
                    >
                      {startup.name}
                    </h3>
                    {startup.industry && (
                      <span className="inline-block bg-blue-500/10 text-blue-300 text-xs font-semibold px-2 sm:px-2.5 py-1 rounded-full border border-blue-500/20 whitespace-nowrap shrink-0">
                        {startup.industry}
                      </span>
                    )}
                  </div>
                  {startup.description && (
                    <p className="text-xs sm:text-sm text-slate-400 line-clamp-2 leading-relaxed">
                      {startup.description}
                    </p>
                  )}
                </div>

                {/* Key Info Grid */}
                <div className="grid grid-cols-2 gap-2 sm:gap-3 mb-3 sm:mb-4">
                  {/* Total Raised */}
                  <div className="bg-slate-800/40 rounded-lg p-2.5 sm:p-3 border border-slate-700/50">
                    <div className="text-xs text-slate-500 font-semibold uppercase tracking-wider mb-1">
                      Total Raised
                    </div>
                    <div className="text-base sm:text-lg font-display font-bold text-gradient-executive bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-blue-600">
                      {formatCurrency(startup.total_raised)}
                    </div>
                    <div className="text-xs text-slate-500 mt-0.5 sm:mt-1">
                      {investors.length} investor{investors.length !== 1 ? 's' : ''}
                    </div>
                  </div>

                  {/* Funding Ask */}
                  <div className="bg-slate-800/40 rounded-lg p-2.5 sm:p-3 border border-slate-700/50">
                    <div className="text-xs text-slate-500 font-semibold uppercase tracking-wider mb-1">
                      Funding Ask
                    </div>
                    <div className="text-base sm:text-lg font-display font-bold text-slate-200">
                      {startup.ask || 'N/A'}
                    </div>
                    <div className="text-xs text-slate-500 mt-0.5 sm:mt-1">
                      {startup.generating_revenue === 'Yes' ? '✓ Revenue' : 'Pre-revenue'}
                    </div>
                  </div>
                </div>

                {/* Pitch Deck & Contact Info */}
                <div className="flex gap-2 mb-3 sm:mb-4">
                  {startup.pitch_deck && (
                    <a
                      href={getFileUrl(startup.pitch_deck)}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="flex-1 bg-gradient-to-r from-purple-500/10 to-pink-500/10 hover:from-purple-500/20 hover:to-pink-500/20 border border-purple-500/30 hover:border-purple-400/50 text-purple-300 hover:text-purple-200 text-xs font-semibold px-2.5 sm:px-3 py-2 rounded-lg transition-all flex items-center justify-center gap-1.5 sm:gap-2"
                    >
                      <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                      </svg>
                      <span className="truncate">Pitch Deck</span>
                    </a>
                  )}
                  {startup.email && (
                    <a
                      href={`mailto:${startup.email}`}
                      onClick={(e) => e.stopPropagation()}
                      className="bg-slate-800/60 hover:bg-slate-700/60 border border-slate-700 hover:border-slate-600 text-slate-300 hover:text-slate-200 text-xs font-semibold px-2.5 sm:px-3 py-2 rounded-lg transition-all flex items-center justify-center shrink-0"
                      title={startup.email}
                    >
                      <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                    </a>
                  )}
                </div>

                {/* My Investment */}
                {myInvestment && (
                  <div className="mb-3 sm:mb-4 relative bg-gradient-to-br from-blue-500/10 to-indigo-500/10 border-2 border-blue-500/30 rounded-xl p-3 sm:p-3.5 overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-radial from-blue-500/5 to-transparent"></div>
                    <div className="relative z-10">
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-xs font-bold text-blue-300 uppercase tracking-wider flex items-center gap-1.5 sm:gap-2">
                          <span className="inline-block w-2 h-2 rounded-full bg-blue-400 animate-pulse"></span>
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
                      <div className="flex items-baseline justify-between gap-2">
                        <p className="text-lg sm:text-xl font-display font-bold text-slate-100">
                          {formatCurrency(myInvestment.amount)}
                        </p>
                        <p className="text-xs text-slate-400 font-medium">
                          {formatPercentage(myInvestment.amount, startup.total_raised)} of total
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Top Investors - Compact */}
                {investors.length > 0 && (
                  <div className="mb-3 sm:mb-4">
                    <p className="text-xs text-slate-500 mb-1.5 sm:mb-2 font-bold uppercase tracking-wider flex items-center gap-1.5 sm:gap-2">
                      <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3zM6 8a2 2 0 11-4 0 2 2 0 014 0zM16 18v-3a5.972 5.972 0 00-.75-2.906A3.005 3.005 0 0119 15v3h-3zM4.75 12.094A5.973 5.973 0 004 15v3H1v-3a3 3 0 013.75-2.906z" />
                      </svg>
                      Top Investors
                    </p>
                    <div className="space-y-1.5 max-h-28 overflow-y-auto scrollbar-thin">
                      {investors.slice(0, 3).map((inv) => (
                        <div
                          key={inv.id}
                          className="flex items-center justify-between text-xs bg-slate-800/30 backdrop-blur-xl px-2.5 sm:px-3 py-1.5 rounded-lg border border-slate-700/30 gap-2"
                        >
                          <span className={`truncate ${inv.investor_id === investorId ? 'text-blue-400 font-bold' : 'text-slate-400 font-medium'}`}>
                            {inv.investor_name}
                          </span>
                          <span className="text-slate-500 font-semibold whitespace-nowrap">
                            {formatCurrency(inv.amount)}
                          </span>
                        </div>
                      ))}
                      {investors.length > 3 && (
                        <p className="text-xs text-slate-500 italic text-center pt-0.5">
                          +{investors.length - 3} more
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
                    className="btn-executive w-full text-sm py-3"
                  >
                    {myInvestment ? '✏️ Modify Investment' : '💼 Make Investment'}
                  </button>
                ) : investor.submitted && (
                  <div className="bg-emerald-500/10 border-2 border-emerald-500/30 text-emerald-300 text-xs font-bold text-center py-3 rounded-xl">
                    ✓ Portfolio Finalized
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
