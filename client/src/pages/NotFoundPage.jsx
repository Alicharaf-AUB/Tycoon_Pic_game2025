import { useNavigate } from 'react-router-dom';
import { useEffect } from 'react';
import { log404Error } from '../utils/errorLogger';
import { GAME_CONFIG } from '../config';

export default function NotFoundPage() {
  const navigate = useNavigate();

  useEffect(() => {
    // Log the 404 error
    log404Error(window.location.pathname);
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center p-4 lg:p-8 relative overflow-hidden">
      {/* Premium Ambient Background - matching LoginPage */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-blue-600/10 rounded-full blur-3xl animate-float"></div>
        <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-indigo-600/10 rounded-full blur-3xl animate-float" style={{animationDelay: '2s'}}></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-gradient-radial from-blue-500/8 to-transparent rounded-full blur-2xl"></div>
      </div>

      <div className="max-w-3xl w-full relative z-10 animate-fade-in">
        {/* Logo Section */}
        <div className="text-center mb-12">
          <div className="mb-8 relative inline-block">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-600/30 to-indigo-600/30 blur-3xl rounded-full"></div>
            <div className="relative bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 border-2 border-blue-500/40 rounded-3xl p-10 shadow-2xl shadow-blue-500/30">
              <svg className="w-20 h-20 md:w-24 md:h-24 animate-float" viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg">
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

          <h1 className="text-4xl sm:text-5xl md:text-6xl font-display font-bold mb-4 leading-tight">
            <span className="text-gradient-executive bg-clip-text text-transparent bg-gradient-to-r from-blue-400 via-blue-300 to-blue-500">
              {GAME_CONFIG.gameName}
            </span>
          </h1>

          <div className="h-px bg-gradient-to-r from-transparent via-blue-500/30 to-transparent max-w-md mx-auto mb-8"></div>
        </div>

        {/* 404 Content Card */}
        <div className="card-premium shadow-elite-lg mb-8 text-center">
          {/* 404 Number */}
          <div className="mb-8">
            <div className="inline-flex items-center justify-center">
              <span className="text-8xl md:text-9xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-blue-300 to-blue-500">
                404
              </span>
            </div>
          </div>

          {/* Error Icon */}
          <div className="mb-8">
            <div className="inline-flex w-24 h-24 rounded-2xl bg-gradient-to-br from-blue-500/20 to-indigo-600/20 backdrop-blur-xl items-center justify-center border-2 border-blue-500/30 shadow-lg mx-auto">
              <svg className="w-12 h-12 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>

          {/* Error Message */}
          <div className="mb-8">
            <h2 className="text-3xl md:text-4xl font-display font-bold text-slate-100 mb-4">
              Page Not Found
            </h2>
            <p className="text-lg md:text-xl text-slate-300 mb-3">
              Oops! The page you're looking for doesn't exist.
            </p>
            <p className="text-sm text-slate-500 max-w-lg mx-auto">
              It might have been moved or deleted, or you may have typed the wrong URL.
            </p>
          </div>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
            <button
              onClick={() => navigate('/')}
              className="btn-executive px-8 py-4 text-lg font-bold relative overflow-hidden group"
            >
              <span className="relative z-10 flex items-center justify-center gap-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                </svg>
                <span>Return to Home</span>
              </span>
            </button>
            <button
              onClick={() => navigate(-1)}
              className="px-8 py-4 bg-slate-800/50 backdrop-blur-xl border-2 border-slate-700 text-slate-300 font-bold rounded-xl hover:bg-slate-800 hover:border-blue-500/50 transition-all text-lg"
            >
              <span className="flex items-center justify-center gap-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                <span>Go Back</span>
              </span>
            </button>
          </div>

          {/* Additional Info */}
          <div className="pt-8 border-t border-slate-700/50">
            <p className="text-sm text-slate-500 mb-4">Looking for something specific?</p>
            <div className="flex flex-wrap gap-4 justify-center">
              <button
                onClick={() => navigate('/')}
                className="inline-flex items-center gap-2 text-blue-400 hover:text-blue-300 transition-colors font-medium text-sm"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                </svg>
                <span>Investor Login</span>
              </button>
              <span className="text-slate-700">•</span>
              <button
                onClick={() => navigate('/admin')}
                className="inline-flex items-center gap-2 text-blue-400 hover:text-blue-300 transition-colors font-medium text-sm"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
                <span>Admin Portal</span>
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        {GAME_CONFIG.organizationInfo.enabled && (
          <div className="text-center">
            <p className="text-xs text-slate-600 font-medium">
              Powered by {GAME_CONFIG.organizationInfo.name}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
