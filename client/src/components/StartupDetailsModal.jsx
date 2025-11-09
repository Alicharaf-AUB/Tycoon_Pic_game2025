import { formatCurrency, getFileUrl } from '../utils/api';

export default function StartupDetailsModal({ startup, gameState, investor, isLocked, onClose, onInvest }) {
  const investors = (gameState?.investments || [])
    .filter(inv => inv.startup_id === startup.id)
    .sort((a, b) => b.amount - a.amount);

  const myInvestment = investors.find(inv => inv.investor_id === investor?.id);

  return (
    <div className="modal-overlay flex items-center justify-center p-4 overflow-y-auto z-40">
      <div className="card-premium max-w-5xl w-full my-8 animate-fade-in">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-6 right-6 text-slate-400 hover:text-slate-200 transition-colors z-10 w-10 h-10 flex items-center justify-center rounded-lg hover:bg-slate-800/50"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        <div className="grid md:grid-cols-3 gap-8">
          {/* Left Column - Main Info */}
          <div className="md:col-span-2 space-y-6">
            {/* Logo & Title */}
            <div className="text-center md:text-left">
              {startup.logo && (
                <div className="mb-6 inline-block">
                  <div className="w-24 h-24 bg-slate-800/50 rounded-2xl p-4 border border-slate-700/50">
                    <img
                      src={getFileUrl(startup.logo)}
                      alt={`${startup.name} logo`}
                      className="w-full h-full object-contain"
                    />
                  </div>
                </div>
              )}

              <h2 className="text-4xl font-display font-bold text-gradient-executive bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-blue-600 mb-3">
                {startup.name}
              </h2>

              {startup.industry && (
                <span className="inline-block bg-blue-500/10 text-blue-300 text-sm font-semibold px-4 py-1.5 rounded-full border border-blue-500/20">
                  {startup.industry}
                </span>
              )}
            </div>

            {/* Description */}
            {startup.description && (
              <div className="bg-slate-800/30 backdrop-blur-xl rounded-xl p-6 border border-slate-700/50">
                <h3 className="text-sm font-bold text-blue-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                  </svg>
                  Overview
                </h3>
                <p className="text-slate-300 leading-relaxed">{startup.description}</p>
              </div>
            )}

            {/* Key Details Grid */}
            <div className="grid sm:grid-cols-2 gap-4">
              {startup.ask && (
                <div className="bg-slate-800/30 backdrop-blur-xl rounded-xl p-5 border border-slate-700/50">
                  <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Funding Ask</h4>
                  <p className="text-emerald-400 font-bold text-xl">{startup.ask}</p>
                </div>
              )}

              {startup.generating_revenue && (
                <div className="bg-slate-800/30 backdrop-blur-xl rounded-xl p-5 border border-slate-700/50">
                  <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Revenue Status</h4>
                  <p className={`font-semibold text-xl ${startup.generating_revenue === 'Yes' ? 'text-emerald-400' : 'text-slate-400'}`}>
                    {startup.generating_revenue}
                  </p>
                </div>
              )}

              {startup.legal_entity && (
                <div className="bg-slate-800/30 backdrop-blur-xl rounded-xl p-5 border border-slate-700/50">
                  <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Legal Entity</h4>
                  <p className="text-slate-100 font-semibold text-lg">{startup.legal_entity}</p>
                </div>
              )}

              <div className="bg-slate-800/30 backdrop-blur-xl rounded-xl p-5 border border-slate-700/50">
                <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Investor Interest</h4>
                <p className="text-blue-400 font-bold text-xl">{investors.length} Investors</p>
              </div>
            </div>

            {/* Team */}
            {startup.team && (
              <div className="bg-slate-800/30 backdrop-blur-xl rounded-xl p-6 border border-slate-700/50">
                <h3 className="text-sm font-bold text-blue-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3zM6 8a2 2 0 11-4 0 2 2 0 014 0zM16 18v-3a5.972 5.972 0 00-.75-2.906A3.005 3.005 0 0119 15v3h-3zM4.75 12.094A5.973 5.973 0 004 15v3H1v-3a3 3 0 013.75-2.906z" />
                  </svg>
                  Team
                </h3>
                <p className="text-slate-300 leading-relaxed whitespace-pre-line">{startup.team}</p>
              </div>
            )}

            {/* Programs & Cohorts */}
            {(startup.cohort || startup.support_program) && (
              <div className="bg-slate-800/30 backdrop-blur-xl rounded-xl p-6 border border-slate-700/50">
                <h3 className="text-sm font-bold text-blue-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M10.394 2.08a1 1 0 00-.788 0l-7 3a1 1 0 000 1.84L5.25 8.051a.999.999 0 01.356-.257l4-1.714a1 1 0 11.788 1.838L7.667 9.088l1.94.831a1 1 0 00.787 0l7-3a1 1 0 000-1.838l-7-3zM3.31 9.397L5 10.12v4.102a8.969 8.969 0 00-1.05-.174 1 1 0 01-.89-.89 11.115 11.115 0 01.25-3.762zM9.3 16.573A9.026 9.026 0 007 14.935v-3.957l1.818.78a3 3 0 002.364 0l5.508-2.361a11.026 11.026 0 01.25 3.762 1 1 0 01-.89.89 8.968 8.968 0 00-5.35 2.524 1 1 0 01-1.4 0zM6 18a1 1 0 001-1v-2.065a8.935 8.935 0 00-2-.712V17a1 1 0 001 1z" />
                  </svg>
                  Programs & Cohorts
                </h3>
                <div className="flex flex-wrap gap-2">
                  {startup.cohort && startup.cohort.split(',').map((c, i) => (
                    <span key={i} className="bg-blue-500/10 text-blue-300 text-xs font-semibold px-3 py-1.5 rounded-full border border-blue-500/20">
                      {c.trim()}
                    </span>
                  ))}
                  {startup.support_program && startup.support_program.split(',').map((p, i) => (
                    <span key={i} className="bg-purple-500/10 text-purple-300 text-xs font-semibold px-3 py-1.5 rounded-full border border-purple-500/20">
                      {p.trim()}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Contact */}
            {startup.email && (
              <div className="bg-slate-800/30 backdrop-blur-xl rounded-xl p-6 border border-slate-700/50">
                <h3 className="text-sm font-bold text-blue-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                    <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
                  </svg>
                  Contact
                </h3>
                <a href={`mailto:${startup.email}`} className="text-blue-400 hover:text-blue-300 font-semibold transition-colors">
                  {startup.email}
                </a>
              </div>
            )}

            {/* Pitch Deck */}
            {startup.pitch_deck && (
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
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
              </a>
            )}
          </div>

          {/* Right Column - Investment Info */}
          <div className="md:col-span-1 space-y-6">
            {/* Investment Metrics */}
            <div className="bg-gradient-to-br from-blue-500/10 to-indigo-500/10 border-2 border-blue-500/30 rounded-2xl p-6 sticky top-6">
              <h3 className="text-sm font-bold text-blue-300 uppercase tracking-wider mb-6 text-center">Investment Metrics</h3>

              <div className="space-y-6">
                <div className="text-center pb-6 border-b border-blue-500/20">
                  <p className="text-xs text-slate-400 mb-2">Total Raised</p>
                  <p className="text-4xl font-display font-bold text-gradient-executive bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-blue-600">
                    {formatCurrency(startup.total_raised || 0)}
                  </p>
                </div>

                <div className="text-center pb-6 border-b border-blue-500/20">
                  <p className="text-xs text-slate-400 mb-2">Total Investors</p>
                  <p className="text-4xl font-display font-bold text-blue-400">
                    {investors.length}
                  </p>
                </div>

                {/* My Investment */}
                {myInvestment && (
                  <div className="bg-gradient-to-br from-emerald-500/10 to-green-500/10 border-2 border-emerald-500/30 rounded-xl p-5">
                    <p className="text-xs text-emerald-400 font-bold uppercase tracking-wider mb-3 text-center">Your Investment</p>
                    <p className="text-3xl font-display font-bold text-emerald-300 text-center mb-2">
                      {formatCurrency(myInvestment.amount)}
                    </p>
                    <p className="text-xs text-center text-slate-400">
                      {((myInvestment.amount / startup.total_raised) * 100).toFixed(1)}% of total raised
                    </p>
                  </div>
                )}

                {/* Top Investors */}
                {investors.length > 0 && (
                  <div>
                    <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Top Investors</h4>
                    <div className="space-y-2 max-h-64 overflow-y-auto scrollbar-thin">
                      {investors.slice(0, 10).map((inv, index) => (
                        <div
                          key={inv.id}
                          className={`flex items-center justify-between text-sm p-3 rounded-lg ${
                            inv.investor_id === investor?.id
                              ? 'bg-blue-500/20 border border-blue-500/30'
                              : 'bg-slate-800/30'
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <span className="w-6 h-6 rounded-full bg-slate-700 flex items-center justify-center text-xs font-bold text-slate-400">
                              {index + 1}
                            </span>
                            <span className={inv.investor_id === investor?.id ? 'text-blue-300 font-bold' : 'text-slate-400 font-medium'}>
                              {inv.investor_name}
                            </span>
                          </div>
                          <span className="text-slate-500 font-semibold text-xs">
                            {formatCurrency(inv.amount)}
                          </span>
                        </div>
                      ))}
                      {investors.length > 10 && (
                        <p className="text-xs text-slate-600 italic text-center pt-2">
                          +{investors.length - 10} more
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-4 mt-8 pt-8 border-t border-slate-700/50">
          <button
            onClick={onClose}
            className="btn-secondary flex-1"
          >
            Close
          </button>
          {!isLocked && !investor?.submitted && (
            <button
              onClick={onInvest}
              className="btn-executive flex-1 flex items-center justify-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {myInvestment ? 'Modify Investment' : 'Make Investment'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
