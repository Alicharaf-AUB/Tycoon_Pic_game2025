import { useState } from 'react';
import { formatCurrency, api } from '../utils/api';

export default function FundsRequestModal({ investor, onClose }) {
  const [requestAmount, setRequestAmount] = useState('');
  const [justification, setJustification] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    const amount = parseInt(requestAmount);
    if (isNaN(amount) || amount <= 0) {
      alert('Please enter a valid amount');
      return;
    }

    if (!justification.trim()) {
      alert('Please provide a justification for your request');
      return;
    }

    setLoading(true);

    try {
      await api.submitFundsRequest(investor.id, amount, justification);
      setSubmitted(true);
    } catch (error) {
      console.error('Error submitting funds request:', error);
      const errorMessage = error.response?.data?.error || error.message || 'Failed to submit request';
      alert(`Failed to submit request: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="modal-overlay flex items-center justify-center p-4 z-50">
        <div className="card-premium max-w-xl w-full my-8 animate-fade-in">
          {/* Success State */}
          <div className="text-center">
            <div className="w-20 h-20 mx-auto mb-6 bg-gradient-to-br from-blue-500/20 to-indigo-500/20 rounded-full flex items-center justify-center border-2 border-blue-500/30 shadow-lg shadow-blue-500/20">
              <svg className="w-10 h-10 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>

            <h2 className="text-3xl font-display font-bold text-gradient-executive bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-blue-600 mb-3">
              Request Submitted!
            </h2>

            <p className="text-slate-400 mb-6 leading-relaxed">
              Your request for additional investment capital has been submitted successfully. Our investment committee will review your request and respond within 2-3 business days.
            </p>

            <div className="bg-slate-800/50 rounded-xl p-6 mb-8 border border-slate-700/50">
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">Requested Amount:</span>
                  <span className="text-blue-400 font-bold">{formatCurrency(parseInt(requestAmount))}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">Current Capital:</span>
                  <span className="text-slate-300 font-semibold">{formatCurrency(investor.starting_credit)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">Potential New Capital:</span>
                  <span className="text-emerald-400 font-bold">{formatCurrency(investor.starting_credit + parseInt(requestAmount))}</span>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-r from-blue-500/10 to-indigo-500/10 border-2 border-blue-500/30 rounded-xl p-5 mb-6">
              <div className="flex gap-3">
                <svg className="w-6 h-6 text-blue-400 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
                <div className="text-left">
                  <h4 className="text-blue-300 font-bold mb-1 text-sm">Next Steps</h4>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    You will receive an email notification once your request has been reviewed. You can track the status of your request in the dashboard.
                  </p>
                </div>
              </div>
            </div>

            <button
              onClick={onClose}
              className="btn-executive w-full"
            >
              Return to Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="modal-overlay flex items-center justify-center p-4 z-50">
      <div className="card-premium max-w-2xl w-full my-8 animate-fade-in overflow-y-auto max-h-[90vh]">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h2 className="text-3xl font-display font-bold text-gradient-executive bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-blue-600 mb-2">
                Request Additional Funds
              </h2>
              <p className="text-slate-400 text-sm">
                Submit a request to increase your investment capital
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-slate-200 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Current Portfolio Info */}
        <div className="bg-slate-800/50 rounded-xl p-6 mb-6 border border-slate-700/50">
          <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4">Current Portfolio Status</h3>
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center">
              <p className="text-xs text-slate-500 mb-1">Total Capital</p>
              <p className="text-xl font-bold text-slate-200">{formatCurrency(investor.starting_credit)}</p>
            </div>
            <div className="text-center">
              <p className="text-xs text-slate-500 mb-1">Deployed</p>
              <p className="text-xl font-bold text-blue-400">{formatCurrency(investor.invested)}</p>
            </div>
            <div className="text-center">
              <p className="text-xs text-slate-500 mb-1">Available</p>
              <p className="text-xl font-bold text-emerald-400">{formatCurrency(investor.remaining)}</p>
            </div>
          </div>
        </div>

        {/* Request Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Amount Field */}
          <div>
            <label className="block text-sm font-bold text-slate-300 mb-3 uppercase tracking-wider">
              Requested Amount *
            </label>
            <div className="relative">
              <input
                type="number"
                value={requestAmount}
                onChange={(e) => setRequestAmount(e.target.value)}
                placeholder="Enter amount"
                className="input-executive text-xl font-bold text-blue-400 pr-16"
                min="1"
                required
              />
              <span className="absolute right-6 top-1/2 -translate-y-1/2 text-blue-500 text-sm font-bold">
                €
              </span>
            </div>
            <p className="mt-2 text-xs text-slate-500">
              Enter the additional capital amount you wish to request
            </p>
          </div>

          {/* Justification Field */}
          <div>
            <label className="block text-sm font-bold text-slate-300 mb-3 uppercase tracking-wider">
              Business Justification *
            </label>
            <textarea
              value={justification}
              onChange={(e) => setJustification(e.target.value)}
              placeholder="Explain why you need additional investment capital and how you plan to deploy it..."
              className="input-executive min-h-[150px] resize-y"
              maxLength={1000}
              required
            />
            <div className="mt-2 flex justify-between text-xs">
              <span className="text-slate-500">Provide a detailed justification for your request</span>
              <span className="text-slate-600">{justification.length}/1000</span>
            </div>
          </div>

          {/* Preview of New Capital */}
          {requestAmount && parseInt(requestAmount) > 0 && (
            <div className="bg-gradient-to-r from-blue-500/10 to-indigo-500/10 border-2 border-blue-500/30 rounded-xl p-6">
              <h4 className="text-sm font-bold text-blue-300 uppercase tracking-wider mb-4">Request Preview</h4>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-slate-400 text-sm">Current Capital:</span>
                  <span className="text-slate-200 font-semibold">{formatCurrency(investor.starting_credit)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400 text-sm">Additional Request:</span>
                  <span className="text-blue-400 font-bold">+{formatCurrency(parseInt(requestAmount))}</span>
                </div>
                <div className="h-px bg-blue-500/30"></div>
                <div className="flex justify-between">
                  <span className="text-slate-300 font-bold">Potential New Capital:</span>
                  <span className="text-emerald-400 font-bold text-lg">
                    {formatCurrency(investor.starting_credit + parseInt(requestAmount))}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Important Information */}
          <div className="bg-amber-500/10 border-2 border-amber-500/30 rounded-xl p-5">
            <div className="flex gap-3">
              <svg className="w-6 h-6 text-amber-400 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              <div className="text-left">
                <h4 className="text-amber-300 font-bold mb-2 text-sm">Important Information</h4>
                <ul className="text-xs text-slate-400 space-y-1 leading-relaxed">
                  <li>• Requests are subject to review and approval by the investment committee</li>
                  <li>• Review process typically takes 2-3 business days</li>
                  <li>• Approval is based on justification, portfolio performance, and availability</li>
                  <li>• You will be notified via email once your request is processed</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-4 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="btn-secondary flex-1"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn-executive flex-1 disabled:opacity-50"
              disabled={loading || !requestAmount || !justification.trim()}
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <div className="w-5 h-5 border-3 border-white border-t-transparent rounded-full animate-spin"></div>
                  Submitting...
                </span>
              ) : (
                <span className="flex items-center justify-center gap-2">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                  </svg>
                  Submit Request
                </span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
