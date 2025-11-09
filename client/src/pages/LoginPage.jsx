import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api, formatCurrency } from '../utils/api';
import { GAME_CONFIG } from '../config';

export default function LoginPage() {
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const navigate = useNavigate();

  // Auto-login if remembered
  useEffect(() => {
    const rememberedInvestorId = localStorage.getItem('rememberedInvestorId');
    const rememberedName = localStorage.getItem('rememberedName');

    if (rememberedInvestorId && rememberedName) {
      // Automatically redirect to dashboard
      setLoading(true);
      api.getInvestor(rememberedInvestorId)
        .then(({ investor }) => {
          navigate(`/dashboard/${investor.id}`);
        })
        .catch(() => {
          // If investor no longer exists, clear remembered data
          localStorage.removeItem('rememberedInvestorId');
          localStorage.removeItem('rememberedName');
          setLoading(false);
        });
    }
  }, [navigate]);

  const handleLogin = async (e) => {
    e.preventDefault();

    if (!name.trim()) {
      setError('Please enter your full name');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const { investor, rejoined } = await api.join(name.trim());

      // Store investor info in localStorage for session management
      localStorage.setItem('investor', JSON.stringify(investor));

      // Remember me functionality
      if (rememberMe) {
        localStorage.setItem('rememberedInvestorId', investor.id);
        localStorage.setItem('rememberedName', investor.name);
      } else {
        localStorage.removeItem('rememberedInvestorId');
        localStorage.removeItem('rememberedName');
      }

      navigate(`/dashboard/${investor.id}`);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to access your account');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 lg:p-8 relative overflow-hidden">
      {/* Premium Ambient Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-blue-600/10 rounded-full blur-3xl animate-float"></div>
        <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-indigo-600/10 rounded-full blur-3xl animate-float" style={{animationDelay: '2s'}}></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-gradient-radial from-blue-500/8 to-transparent rounded-full blur-2xl"></div>
      </div>

      <div className="w-full max-w-4xl relative z-10 animate-fade-in">
        {/* VIP Header */}
        <div className="text-center mb-12">
          {/* Premium Logo */}
          <div className="mb-10 relative inline-block">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-600/30 to-indigo-600/30 blur-3xl rounded-full"></div>
            <div className="relative bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 border-2 border-blue-500/40 rounded-3xl p-12 shadow-2xl shadow-blue-500/30">
              <svg className="w-28 h-28 md:w-36 md:h-36 animate-float" viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg">
                {/* Angel Wings with Blue Gradient */}
                <path d="M100 100 Q70 80, 40 70 Q30 65, 25 75 Q20 85, 30 90 Q50 95, 70 100 Q80 105, 90 110 Z"
                      fill="url(#blueWingGradient)" stroke="url(#blueWingStroke)" strokeWidth="1.5" opacity="0.9"/>
                <path d="M90 110 Q65 95, 45 90 Q35 88, 32 95 Q30 102, 40 105 Q55 108, 75 115 Z"
                      fill="url(#blueWingGradient)" stroke="url(#blueWingStroke)" strokeWidth="1" opacity="0.8"/>
                <path d="M100 100 Q130 80, 160 70 Q170 65, 175 75 Q180 85, 170 90 Q150 95, 130 100 Q120 105, 110 110 Z"
                      fill="url(#blueWingGradient)" stroke="url(#blueWingStroke)" strokeWidth="1.5" opacity="0.9"/>
                <path d="M110 110 Q135 95, 155 90 Q165 88, 168 95 Q170 102, 160 105 Q145 108, 125 115 Z"
                      fill="url(#blueWingGradient)" stroke="url(#blueWingStroke)" strokeWidth="1" opacity="0.8"/>

                {/* Blue Halo */}
                <ellipse cx="100" cy="45" rx="25" ry="8" fill="none" stroke="url(#blueHaloGradient)" strokeWidth="3" opacity="0.9"/>
                <ellipse cx="100" cy="45" rx="25" ry="8" fill="url(#blueHaloGlow)" opacity="0.3"/>

                {/* Center Body - Blue gradient */}
                <circle cx="100" cy="100" r="20" fill="url(#blueBodyGradient)" stroke="url(#blueWingStroke)" strokeWidth="2"/>
                <circle cx="100" cy="100" r="12" fill="url(#blueInnerGlow)" opacity="0.6"/>

                {/* Sparkles */}
                <circle cx="70" cy="60" r="2" fill="#60A5FA" opacity="0.8">
                  <animate attributeName="opacity" values="0.8;0.3;0.8" dur="2s" repeatCount="indefinite"/>
                </circle>
                <circle cx="130" cy="60" r="2" fill="#60A5FA" opacity="0.8">
                  <animate attributeName="opacity" values="0.3;0.8;0.3" dur="2s" repeatCount="indefinite"/>
                </circle>

                <defs>
                  <linearGradient id="blueWingGradient" x1="0" y1="50" x2="200" y2="120">
                    <stop offset="0%" stopColor="#DBEAFE"/>
                    <stop offset="50%" stopColor="#60A5FA"/>
                    <stop offset="100%" stopColor="#3B82F6"/>
                  </linearGradient>
                  <linearGradient id="blueWingStroke" x1="0" y1="50" x2="200" y2="120">
                    <stop offset="0%" stopColor="#60A5FA"/>
                    <stop offset="100%" stopColor="#3B82F6"/>
                  </linearGradient>
                  <linearGradient id="blueHaloGradient" x1="75" y1="45" x2="125" y2="45">
                    <stop offset="0%" stopColor="#60A5FA"/>
                    <stop offset="50%" stopColor="#3B82F6"/>
                    <stop offset="100%" stopColor="#60A5FA"/>
                  </linearGradient>
                  <radialGradient id="blueHaloGlow" cx="50%" cy="50%" r="50%">
                    <stop offset="0%" stopColor="#DBEAFE"/>
                    <stop offset="100%" stopColor="transparent"/>
                  </radialGradient>
                  <radialGradient id="blueBodyGradient" cx="50%" cy="50%" r="50%">
                    <stop offset="0%" stopColor="#DBEAFE"/>
                    <stop offset="50%" stopColor="#60A5FA"/>
                    <stop offset="100%" stopColor="#3B82F6"/>
                  </radialGradient>
                  <radialGradient id="blueInnerGlow" cx="50%" cy="50%" r="50%">
                    <stop offset="0%" stopColor="#EFF6FF"/>
                    <stop offset="100%" stopColor="transparent"/>
                  </radialGradient>
                </defs>
              </svg>
            </div>
          </div>

          {/* VIP Title */}
          <h1 className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-display font-bold mb-6 leading-tight">
            <span className="text-gradient-executive bg-clip-text text-transparent bg-gradient-to-r from-blue-400 via-blue-300 to-blue-500">
              {GAME_CONFIG.gameName}
            </span>
          </h1>

          <p className="text-2xl sm:text-3xl md:text-4xl text-slate-300 font-serif italic mb-4 font-light">
            VIP Investment Hub
          </p>

          <p className="text-lg text-slate-400 max-w-2xl mx-auto mb-8 leading-relaxed">
            Exclusive access for elite investors. Manage your portfolio, track performance, and access premium investment opportunities.
          </p>

          {/* Event Badge */}
          {GAME_CONFIG.eventInfo.enabled && (
            <div className="inline-flex items-center gap-3 bg-gradient-to-r from-blue-950/80 to-indigo-950/80 backdrop-blur-xl border border-blue-500/40 rounded-full px-8 py-4 mb-8 shadow-xl shadow-blue-500/20">
              <div className="w-2 h-2 rounded-full bg-blue-400 animate-pulse"></div>
              <p className="text-sm md:text-base font-semibold text-blue-200">
                {GAME_CONFIG.eventInfo.eventName}
              </p>
              <div className="h-6 w-px bg-blue-500/30"></div>
              <p className="text-sm md:text-base text-blue-300">
                {GAME_CONFIG.eventInfo.eventDate}
              </p>
            </div>
          )}

          <div className="h-px bg-gradient-to-r from-transparent via-blue-500/30 to-transparent max-w-md mx-auto"></div>
        </div>

        {/* VIP Login Form */}
        <div className="card-premium shadow-elite-lg mb-8 max-w-2xl mx-auto">
          <form onSubmit={handleLogin} className="space-y-8">
            {/* Header */}
            <div className="text-center">
              <h2 className="text-2xl md:text-3xl font-display font-bold text-slate-100 mb-3">
                Investor Portal Access
              </h2>
              <p className="text-sm text-slate-400">
                Enter your credentials to access your investment dashboard
              </p>
            </div>

            {/* Name Input */}
            <div>
              <label htmlFor="name" className="block text-sm font-bold text-slate-300 mb-4 uppercase tracking-widest">
                Account Holder Name
              </label>
              <input
                type="text"
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter your full name"
                className="input-executive text-lg"
                disabled={loading}
                maxLength={100}
                autoComplete="name"
                autoFocus
              />
              <p className="mt-2 text-xs text-slate-500">
                Use your registered full name to access your account
              </p>
            </div>

            {/* Remember Me Checkbox */}
            <div className="flex items-start gap-3 group cursor-pointer" onClick={() => setRememberMe(!rememberMe)}>
              <div className="relative flex items-center justify-center mt-0.5">
                <input
                  type="checkbox"
                  id="rememberMe"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-5 h-5 rounded border-2 border-slate-600 bg-slate-900/70 checked:bg-blue-500 checked:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-slate-900 cursor-pointer transition-all"
                  onClick={(e) => e.stopPropagation()}
                />
              </div>
              <label htmlFor="rememberMe" className="text-sm text-slate-300 cursor-pointer select-none">
                <div className="flex flex-col gap-1">
                  <span className="group-hover:text-slate-100 transition-colors">Remember me on this device</span>
                  <span className="text-xs text-slate-500">(Auto-login next time)</span>
                </div>
              </label>
            </div>

            {error && (
              <div className="bg-rose-500/10 border-2 border-rose-500/30 backdrop-blur-xl text-rose-300 px-6 py-4 rounded-xl text-sm font-medium animate-fade-in shadow-lg">
                <div className="flex items-center gap-3">
                  <svg className="w-6 h-6 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  <span>{error}</span>
                </div>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading || !name.trim()}
              className="btn-executive w-full disabled:opacity-50 disabled:cursor-not-allowed text-xl py-6 font-bold relative overflow-hidden group"
            >
              <span className="relative z-10 flex items-center justify-center gap-3">
                {loading ? (
                  <>
                    <div className="w-5 h-5 border-3 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Authenticating Access...</span>
                  </>
                ) : (
                  <>
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 11V7a4 4 0 118 0m-4 8v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2z" />
                    </svg>
                    <span>Access Dashboard</span>
                    <svg className="w-6 h-6 transition-transform group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                    </svg>
                  </>
                )}
              </span>
            </button>
          </form>

          {/* Trust Features */}
          <div className="mt-10 pt-8 border-t border-slate-700/50">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              <div className="text-center group">
                <div className="w-14 h-14 mx-auto mb-3 bg-gradient-to-br from-blue-500/20 to-blue-600/20 backdrop-blur-xl rounded-2xl flex items-center justify-center border border-blue-500/30 shadow-lg group-hover:scale-110 transition-transform">
                  <svg className="w-7 h-7 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                </div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wide">Secure</p>
              </div>
              <div className="text-center group">
                <div className="w-14 h-14 mx-auto mb-3 bg-gradient-to-br from-emerald-500/20 to-emerald-600/20 backdrop-blur-xl rounded-2xl flex items-center justify-center border border-emerald-500/30 shadow-lg group-hover:scale-110 transition-transform">
                  <svg className="w-7 h-7 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wide">Real-Time</p>
              </div>
              <div className="text-center group">
                <div className="w-14 h-14 mx-auto mb-3 bg-gradient-to-br from-purple-500/20 to-purple-600/20 backdrop-blur-xl rounded-2xl flex items-center justify-center border border-purple-500/30 shadow-lg group-hover:scale-110 transition-transform">
                  <svg className="w-7 h-7 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wide">Analytics</p>
              </div>
              <div className="text-center group">
                <div className="w-14 h-14 mx-auto mb-3 bg-gradient-to-br from-amber-500/20 to-amber-600/20 backdrop-blur-xl rounded-2xl flex items-center justify-center border border-amber-500/30 shadow-lg group-hover:scale-110 transition-transform">
                  <svg className="w-7 h-7 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wide">VIP Access</p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center space-y-4">
          <div className="flex items-center justify-center gap-6 text-sm">
            <a
              href="/admin"
              className="inline-flex items-center gap-2 text-slate-400 hover:text-blue-400 transition-colors font-medium group"
            >
              <svg className="w-4 h-4 group-hover:rotate-12 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
              <span>Admin Portal</span>
            </a>
            <span className="text-slate-700">|</span>
            <a
              href="/help"
              className="inline-flex items-center gap-2 text-slate-400 hover:text-blue-400 transition-colors font-medium group"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>Support</span>
            </a>
          </div>

          {GAME_CONFIG.organizationInfo.enabled && (
            <p className="text-xs text-slate-500 font-medium">
              Powered by {GAME_CONFIG.organizationInfo.name}
            </p>
          )}

          <div className="pt-6">
            <div className="h-px bg-gradient-to-r from-transparent via-blue-500/20 to-transparent max-w-xs mx-auto"></div>
          </div>
        </div>
      </div>
    </div>
  );
}
