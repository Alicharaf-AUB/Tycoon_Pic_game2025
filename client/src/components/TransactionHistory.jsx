import { formatCurrency } from '../utils/api';

export default function TransactionHistory({ investorId, investments, startups }) {
  // Filter investments for this investor
  const myInvestments = investments.filter(inv => inv.investor_id === parseInt(investorId));

  // Sort by date (most recent first)
  const sortedInvestments = [...myInvestments].sort((a, b) => {
    const dateA = new Date(a.updated_at || a.created_at);
    const dateB = new Date(b.updated_at || b.created_at);
    return dateB - dateA;
  });

  const getStartupName = (startupId) => {
    const startup = startups.find(s => s.id === startupId);
    return startup?.name || 'Unknown Startup';
  };

  const getStartupIndustry = (startupId) => {
    const startup = startups.find(s => s.id === startupId);
    return startup?.industry || 'N/A';
  };

  const totalInvested = myInvestments.reduce((sum, inv) => sum + inv.amount, 0);

  if (sortedInvestments.length === 0) {
    return (
      <div className="card-premium text-center py-16">
        <svg className="w-20 h-20 mx-auto mb-6 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
        </svg>
        <p className="text-xl font-semibold text-slate-400 mb-2">No Transaction History</p>
        <p className="text-sm text-slate-500">Your investment transactions will appear here</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Summary */}
      <div className="card-premium">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-display font-bold text-slate-100 mb-2">Transaction History</h2>
            <p className="text-sm text-slate-400">Complete record of your investment activities</p>
          </div>
          <button
            onClick={() => {
              const data = generateCSV();
              downloadCSV(data, `transactions-${new Date().toISOString().split('T')[0]}.csv`);
            }}
            className="btn-secondary text-sm flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            Export CSV
          </button>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-3 gap-4 mb-6 pb-6 border-b border-slate-700/50">
          <div className="text-center">
            <p className="text-xs text-slate-500 mb-1">Total Transactions</p>
            <p className="text-2xl font-bold text-blue-400">{sortedInvestments.length}</p>
          </div>
          <div className="text-center">
            <p className="text-xs text-slate-500 mb-1">Total Invested</p>
            <p className="text-2xl font-bold text-emerald-400">{formatCurrency(totalInvested)}</p>
          </div>
          <div className="text-center">
            <p className="text-xs text-slate-500 mb-1">Unique Startups</p>
            <p className="text-2xl font-bold text-purple-400">{new Set(myInvestments.map(inv => inv.startup_id)).size}</p>
          </div>
        </div>

        {/* Filters - Optional future enhancement */}
        <div className="flex gap-2 mb-4">
          <span className="text-xs text-slate-500 font-semibold uppercase tracking-wider">Showing All Transactions</span>
        </div>
      </div>

      {/* Transactions List */}
      <div className="space-y-3">
        {sortedInvestments.map((investment, index) => {
          const createdDate = new Date(investment.created_at);
          const updatedDate = new Date(investment.updated_at || investment.created_at);
          const isModified = investment.updated_at && investment.updated_at !== investment.created_at;

          return (
            <div
              key={investment.id}
              className="card-hover animate-fade-in"
              style={{ animationDelay: `${index * 0.05}s` }}
            >
              <div className="flex items-start justify-between gap-4">
                {/* Left: Transaction Info */}
                <div className="flex-1">
                  <div className="flex items-start gap-4">
                    {/* Icon */}
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-500/20 to-indigo-500/20 rounded-xl flex items-center justify-center border border-blue-500/30 flex-shrink-0">
                      <svg className="w-6 h-6 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>

                    {/* Details */}
                    <div className="flex-1 min-w-0">
                      <h3 className="text-lg font-bold text-slate-100 mb-1">
                        {getStartupName(investment.startup_id)}
                      </h3>
                      <div className="flex flex-wrap items-center gap-3 text-sm text-slate-400">
                        <span className="inline-flex items-center gap-1">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                          </svg>
                          {getStartupIndustry(investment.startup_id)}
                        </span>
                        <span className="inline-flex items-center gap-1">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          {updatedDate.toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </span>
                        {isModified && (
                          <span className="inline-flex items-center gap-1 text-amber-400">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                            Modified
                          </span>
                        )}
                      </div>

                      {/* Original Creation Date if Modified */}
                      {isModified && (
                        <p className="text-xs text-slate-600 mt-2">
                          Originally created: {createdDate.toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Right: Amount */}
                <div className="text-right flex-shrink-0">
                  <p className="text-2xl font-display font-bold text-emerald-400 mb-1">
                    {formatCurrency(investment.amount)}
                  </p>
                  <span className="inline-block bg-emerald-500/10 text-emerald-300 text-xs font-semibold px-3 py-1 rounded-full border border-emerald-500/20">
                    Invested
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Footer */}
      <div className="card-premium text-center text-sm text-slate-500">
        <p>Showing {sortedInvestments.length} {sortedInvestments.length === 1 ? 'transaction' : 'transactions'}</p>
      </div>
    </div>
  );

  function generateCSV() {
    const headers = ['Date', 'Startup', 'Industry', 'Amount', 'Status', 'Transaction ID'];
    const rows = sortedInvestments.map(inv => [
      new Date(inv.updated_at || inv.created_at).toISOString(),
      getStartupName(inv.startup_id),
      getStartupIndustry(inv.startup_id),
      inv.amount,
      'Completed',
      inv.id
    ]);

    return [headers, ...rows].map(row => row.join(',')).join('\n');
  }

  function downloadCSV(data, filename) {
    const blob = new Blob([data], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  }
}
