import { formatCurrency, formatPercentage, getFileUrl } from '../utils/api';

export default function PortfolioAnalytics({ investor, investments, startups, gameState }) {
  // Calculate portfolio metrics
  const allocationRate = (investor.invested / investor.starting_credit) * 100;
  const numInvestments = investments.length;

  // Calculate average investment
  const avgInvestment = numInvestments > 0 ? investor.invested / numInvestments : 0;

  // Get investment breakdown by startup
  const investmentBreakdown = investments.map(inv => {
    const startup = startups.find(s => s.id === inv.startup_id);
    return {
      ...inv,
      startup,
      percentage: (inv.amount / investor.invested) * 100,
      shareOfTotal: startup ? (inv.amount / startup.total_raised) * 100 : 0
    };
  }).sort((a, b) => b.amount - a.amount);

  // Industry diversification
  const industryBreakdown = {};
  investmentBreakdown.forEach(inv => {
    const industry = inv.startup?.industry || 'Other';
    if (!industryBreakdown[industry]) {
      industryBreakdown[industry] = { amount: 0, count: 0 };
    }
    industryBreakdown[industry].amount += inv.amount;
    industryBreakdown[industry].count += 1;
  });

  const industries = Object.entries(industryBreakdown)
    .map(([name, data]) => ({
      name,
      amount: data.amount,
      count: data.count,
      percentage: (data.amount / investor.invested) * 100
    }))
    .sort((a, b) => b.amount - a.amount);

  if (investments.length === 0) {
    return (
      <div className="card-premium text-center py-16">
        <svg className="w-20 h-20 mx-auto mb-6 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
        <p className="text-xl font-semibold text-slate-400 mb-2">No Portfolio Data</p>
        <p className="text-sm text-slate-500">Make your first investment to see portfolio analytics</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <div className="h-px flex-1 bg-gradient-to-r from-transparent to-blue-500/30"></div>
        <h2 className="text-2xl md:text-3xl font-display font-bold text-slate-100 flex items-center gap-3">
          <svg className="w-8 h-8 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
          Portfolio Analytics
        </h2>
        <div className="h-px flex-1 bg-gradient-to-l from-transparent to-blue-500/30"></div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="card-hover text-center">
          <div className="w-12 h-12 mx-auto mb-3 bg-gradient-to-br from-blue-500/20 to-blue-600/20 rounded-xl flex items-center justify-center border border-blue-500/30">
            <svg className="w-6 h-6 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
              <path d="M3 1a1 1 0 000 2h1.22l.305 1.222a.997.997 0 00.01.042l1.358 5.43-.893.892C3.74 11.846 4.632 14 6.414 14H15a1 1 0 000-2H6.414l1-1H14a1 1 0 00.894-.553l3-6A1 1 0 0017 3H6.28l-.31-1.243A1 1 0 005 1H3zM16 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zM6.5 18a1.5 1.5 0 100-3 1.5 1.5 0 000 3z" />
            </svg>
          </div>
          <p className="text-xs text-slate-500 font-bold uppercase tracking-wider mb-2">Total Investments</p>
          <p className="text-3xl font-display font-bold text-blue-400">{numInvestments}</p>
          <p className="text-xs text-slate-600 mt-1">Active Positions</p>
        </div>

        <div className="card-hover text-center">
          <div className="w-12 h-12 mx-auto mb-3 bg-gradient-to-br from-emerald-500/20 to-emerald-600/20 rounded-xl flex items-center justify-center border border-emerald-500/30">
            <svg className="w-6 h-6 text-emerald-400" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v3.586L7.707 9.293a1 1 0 00-1.414 1.414l3 3a1 1 0 001.414 0l3-3a1 1 0 00-1.414-1.414L11 10.586V7z" clipRule="evenodd" />
            </svg>
          </div>
          <p className="text-xs text-slate-500 font-bold uppercase tracking-wider mb-2">Allocation Rate</p>
          <p className="text-3xl font-display font-bold text-emerald-400">{allocationRate.toFixed(1)}%</p>
          <p className="text-xs text-slate-600 mt-1">Capital Deployed</p>
        </div>

        <div className="card-hover text-center">
          <div className="w-12 h-12 mx-auto mb-3 bg-gradient-to-br from-purple-500/20 to-purple-600/20 rounded-xl flex items-center justify-center border border-purple-500/30">
            <svg className="w-6 h-6 text-purple-400" fill="currentColor" viewBox="0 0 20 20">
              <path d="M2 11a1 1 0 011-1h2a1 1 0 011 1v5a1 1 0 01-1 1H3a1 1 0 01-1-1v-5zM8 7a1 1 0 011-1h2a1 1 0 011 1v9a1 1 0 01-1 1H9a1 1 0 01-1-1V7zM14 4a1 1 0 011-1h2a1 1 0 011 1v12a1 1 0 01-1 1h-2a1 1 0 01-1-1V4z" />
            </svg>
          </div>
          <p className="text-xs text-slate-500 font-bold uppercase tracking-wider mb-2">Avg Investment</p>
          <p className="text-3xl font-display font-bold text-purple-400">{formatCurrency(avgInvestment)}</p>
          <p className="text-xs text-slate-600 mt-1">Per Startup</p>
        </div>

        <div className="card-hover text-center">
          <div className="w-12 h-12 mx-auto mb-3 bg-gradient-to-br from-amber-500/20 to-amber-600/20 rounded-xl flex items-center justify-center border border-amber-500/30">
            <svg className="w-6 h-6 text-amber-400" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M6 6V5a3 3 0 013-3h2a3 3 0 013 3v1h2a2 2 0 012 2v3.57A22.952 22.952 0 0110 13a22.95 22.95 0 01-8-1.43V8a2 2 0 012-2h2zm2-1a1 1 0 011-1h2a1 1 0 011 1v1H8V5zm1 5a1 1 0 011-1h.01a1 1 0 110 2H10a1 1 0 01-1-1z" clipRule="evenodd" />
              <path d="M2 13.692V16a2 2 0 002 2h12a2 2 0 002-2v-2.308A24.974 24.974 0 0110 15c-2.796 0-5.487-.46-8-1.308z" />
            </svg>
          </div>
          <p className="text-xs text-slate-500 font-bold uppercase tracking-wider mb-2">Industries</p>
          <p className="text-3xl font-display font-bold text-amber-400">{industries.length}</p>
          <p className="text-xs text-slate-600 mt-1">Diversification</p>
        </div>
      </div>

      {/* Portfolio Breakdown */}
      <div className="card-premium">
        <h3 className="text-xl font-display font-bold text-slate-100 mb-6">Investment Breakdown</h3>

        <div className="space-y-4">
          {investmentBreakdown.map((inv, index) => (
            <div key={inv.id} className="relative">
              {/* Progress Bar Background */}
              <div className="absolute top-0 left-0 right-0 h-full bg-gradient-to-r from-blue-500/10 to-indigo-500/10 rounded-lg" style={{ width: `${inv.percentage}%` }}></div>

              {/* Content */}
              <div className="relative flex items-center justify-between p-4 rounded-lg border border-slate-700/30 hover:border-blue-500/30 transition-colors">
                <div className="flex items-center gap-4 flex-1">
                  {/* Rank */}
                  <div className="w-8 h-8 bg-slate-800 rounded-lg flex items-center justify-center font-bold text-sm text-slate-400">
                    {index + 1}
                  </div>

                  {/* Logo */}
                  {inv.startup?.logo && (
                    <div className="w-12 h-12 bg-slate-800/50 rounded-lg p-2 border border-slate-700/50 flex-shrink-0">
                      <img
                        src={getFileUrl(inv.startup.logo)}
                        alt={inv.startup.name}
                        className="w-full h-full object-contain"
                      />
                    </div>
                  )}

                  {/* Details */}
                  <div className="flex-1 min-w-0">
                    <h4 className="font-bold text-slate-100 mb-1">{inv.startup?.name || 'Unknown'}</h4>
                    <div className="flex flex-wrap gap-3 text-xs text-slate-500">
                      <span>{inv.startup?.industry || 'N/A'}</span>
                      <span>•</span>
                      <span>{inv.percentage.toFixed(1)}% of portfolio</span>
                      <span>•</span>
                      <span>{inv.shareOfTotal.toFixed(1)}% of startup total</span>
                    </div>
                  </div>
                </div>

                {/* Amount */}
                <div className="text-right flex-shrink-0 ml-4">
                  <p className="text-xl font-display font-bold text-blue-400">{formatCurrency(inv.amount)}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Industry Diversification */}
      <div className="card-premium">
        <h3 className="text-xl font-display font-bold text-slate-100 mb-6">Industry Diversification</h3>

        <div className="space-y-4">
          {industries.map((industry, index) => (
            <div key={industry.name}>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-3">
                  <span className="font-semibold text-slate-200">{industry.name}</span>
                  <span className="text-xs text-slate-500">
                    {industry.count} {industry.count === 1 ? 'startup' : 'startups'}
                  </span>
                </div>
                <div className="text-right">
                  <span className="font-bold text-blue-400">{formatCurrency(industry.amount)}</span>
                  <span className="text-xs text-slate-500 ml-2">({industry.percentage.toFixed(1)}%)</span>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="h-3 bg-slate-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full transition-all duration-500"
                  style={{ width: `${industry.percentage}%` }}
                ></div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Portfolio Summary */}
      <div className="card-premium bg-gradient-to-br from-blue-500/10 to-indigo-500/10 border-blue-500/30">
        <h3 className="text-xl font-display font-bold text-slate-100 mb-6 text-center">Portfolio Summary</h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center">
            <p className="text-sm text-slate-400 mb-2">Total Deployed</p>
            <p className="text-3xl font-display font-bold text-gradient-executive bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-blue-600">
              {formatCurrency(investor.invested)}
            </p>
            <p className="text-xs text-slate-500 mt-1">across {numInvestments} investments</p>
          </div>

          <div className="text-center">
            <p className="text-sm text-slate-400 mb-2">Available Capital</p>
            <p className="text-3xl font-display font-bold text-emerald-400">
              {formatCurrency(investor.remaining)}
            </p>
            <p className="text-xs text-slate-500 mt-1">{((investor.remaining / investor.starting_credit) * 100).toFixed(1)}% undeployed</p>
          </div>

          <div className="text-center">
            <p className="text-sm text-slate-400 mb-2">Diversification</p>
            <p className="text-3xl font-display font-bold text-purple-400">
              {industries.length}
            </p>
            <p className="text-xs text-slate-500 mt-1">industry {industries.length === 1 ? 'sector' : 'sectors'}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
