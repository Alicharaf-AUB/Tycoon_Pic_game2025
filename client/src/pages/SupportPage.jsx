import { useNavigate } from 'react-router-dom';
import { GAME_CONFIG } from '../config';

export default function SupportPage() {
  const navigate = useNavigate();

  const faqs = [
    {
      question: "How do I join the platform?",
      answer: "Enter your full name and email address on the login page. If you're a new investor, you'll automatically receive your starting capital. If you're returning, you'll be logged back into your existing account."
    },
    {
      question: "How do I make an investment?",
      answer: "Browse available startups on your dashboard, click on a startup to view details, enter your investment amount, and confirm. Your portfolio will update in real-time."
    },
    {
      question: "How do I request additional funds?",
      answer: "Click the 'Request Funds' button on your dashboard, enter the amount you need and the reason, then submit. An admin will review and approve your request."
    },
    {
      question: "Can I sell my investments?",
      answer: "Currently, investments are locked for the duration of the investment period. You can view your portfolio performance but cannot sell positions."
    },
    {
      question: "How do I track my performance?",
      answer: "Your dashboard shows your total portfolio value, available cash, investment breakdown, and transaction history. All data updates in real-time."
    },
    {
      question: "What if I forget my account details?",
      answer: "Simply enter your name and email again on the login page. The system will automatically recognize you and log you back in."
    }
  ];

  const steps = [
    {
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
        </svg>
      ),
      title: "Login or Join",
      description: "Enter your name and email to access your investor account or create a new one."
    },
    {
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
      ),
      title: "Browse Startups",
      description: "Explore available investment opportunities and review detailed startup information."
    },
    {
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      title: "Make Investments",
      description: "Decide how much to invest in each startup and submit your investment decisions."
    },
    {
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      ),
      title: "Track Performance",
      description: "Monitor your portfolio value, returns, and investment history in real-time."
    }
  ];

  const features = [
    {
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
      ),
      title: "Real-Time Updates",
      description: "All investment data and portfolio values update instantly across all connected devices."
    },
    {
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
        </svg>
      ),
      title: "Secure Access",
      description: "Your account is protected with password authentication and secure session management."
    },
    {
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
        </svg>
      ),
      title: "Mobile Responsive",
      description: "Access your portfolio from any device - desktop, tablet, or smartphone."
    },
    {
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
        </svg>
      ),
      title: "Portfolio Analytics",
      description: "View detailed breakdowns, charts, and analytics of your investment performance."
    },
    {
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      title: "Transaction History",
      description: "Complete record of all your investments and fund requests with timestamps."
    },
    {
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
      ),
      title: "Multi-Investor Support",
      description: "Compete with other investors on the platform and see live leaderboards."
    }
  ];

  return (
    <div className="min-h-screen flex items-center justify-center p-4 lg:p-8 relative overflow-hidden">
      {/* Premium Ambient Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-blue-600/10 rounded-full blur-3xl animate-float"></div>
        <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-indigo-600/10 rounded-full blur-3xl animate-float" style={{animationDelay: '2s'}}></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-gradient-radial from-blue-500/8 to-transparent rounded-full blur-2xl"></div>
      </div>

      <div className="w-full max-w-6xl relative z-10 animate-fade-in">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="mb-8 relative inline-block">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-600/30 to-indigo-600/30 blur-3xl rounded-full"></div>
            <div className="relative bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 border-2 border-blue-500/40 rounded-3xl p-8 shadow-2xl shadow-blue-500/30">
              <svg className="w-16 h-16 md:w-20 md:h-20 animate-float" viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg">
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
              Help & Support
            </span>
          </h1>

          <p className="text-lg md:text-xl text-slate-300 mb-4">
            Everything you need to know about {GAME_CONFIG.gameName}
          </p>

          <div className="h-px bg-gradient-to-r from-transparent via-blue-500/30 to-transparent max-w-md mx-auto"></div>
        </div>

        {/* Getting Started Section */}
        <div className="card-premium shadow-elite-lg mb-8">
          <h2 className="text-2xl md:text-3xl font-display font-bold text-slate-100 mb-6 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500/20 to-indigo-600/20 flex items-center justify-center border border-blue-500/30">
              <svg className="w-6 h-6 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <span>Getting Started</span>
          </h2>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {steps.map((step, index) => (
              <div key={index} className="relative group">
                <div className="bg-gradient-to-br from-slate-900/50 to-slate-800/50 backdrop-blur-xl border border-slate-700 rounded-2xl p-6 h-full hover:border-blue-500/50 transition-all">
                  <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-blue-500/20 to-indigo-600/20 flex items-center justify-center border border-blue-500/30 mb-4 group-hover:scale-110 transition-transform">
                    <div className="text-blue-400">
                      {step.icon}
                    </div>
                  </div>
                  <div className="absolute top-4 right-4 text-4xl font-bold text-slate-800/50">
                    {index + 1}
                  </div>
                  <h3 className="text-lg font-bold text-slate-100 mb-2">{step.title}</h3>
                  <p className="text-sm text-slate-400">{step.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Features Section */}
        <div className="card-premium shadow-elite-lg mb-8">
          <h2 className="text-2xl md:text-3xl font-display font-bold text-slate-100 mb-6 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500/20 to-emerald-600/20 flex items-center justify-center border border-emerald-500/30">
              <svg className="w-6 h-6 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
              </svg>
            </div>
            <span>Platform Features</span>
          </h2>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, index) => (
              <div key={index} className="bg-gradient-to-br from-slate-900/50 to-slate-800/50 backdrop-blur-xl border border-slate-700 rounded-xl p-6 hover:border-blue-500/50 transition-all">
                <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-blue-500/20 to-indigo-600/20 flex items-center justify-center border border-blue-500/30 mb-4">
                  <div className="text-blue-400">
                    {feature.icon}
                  </div>
                </div>
                <h3 className="text-lg font-bold text-slate-100 mb-2">{feature.title}</h3>
                <p className="text-sm text-slate-400">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>

        {/* FAQ Section */}
        <div className="card-premium shadow-elite-lg mb-8">
          <h2 className="text-2xl md:text-3xl font-display font-bold text-slate-100 mb-6 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500/20 to-purple-600/20 flex items-center justify-center border border-purple-500/30">
              <svg className="w-6 h-6 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <span>Frequently Asked Questions</span>
          </h2>

          <div className="space-y-4">
            {faqs.map((faq, index) => (
              <div key={index} className="bg-gradient-to-br from-slate-900/50 to-slate-800/50 backdrop-blur-xl border border-slate-700 rounded-xl p-6 hover:border-blue-500/30 transition-all">
                <h3 className="text-lg font-bold text-blue-300 mb-3 flex items-start gap-3">
                  <svg className="w-6 h-6 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span>{faq.question}</span>
                </h3>
                <p className="text-slate-400 pl-9">{faq.answer}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Contact Section */}
        <div className="card-premium shadow-elite-lg mb-8">
          <div className="text-center">
            <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br from-amber-500/20 to-amber-600/20 flex items-center justify-center border border-amber-500/30 mb-6">
              <svg className="w-8 h-8 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
            </div>
            <h2 className="text-2xl md:text-3xl font-display font-bold text-slate-100 mb-4">
              Still Need Help?
            </h2>
            <p className="text-slate-400 mb-6 max-w-2xl mx-auto">
              If you have any questions or need assistance, please contact the platform administrator or event organizer for support.
            </p>
            <div className="flex flex-wrap gap-4 justify-center">
              <button
                onClick={() => navigate('/')}
                className="btn-executive px-6 py-3 text-base font-bold"
              >
                <span className="relative z-10 flex items-center justify-center gap-2">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                  </svg>
                  <span>Back to Login</span>
                </span>
              </button>
              <button
                onClick={() => navigate('/admin')}
                className="px-6 py-3 bg-slate-800/50 backdrop-blur-xl border-2 border-slate-700 text-slate-300 font-bold rounded-xl hover:bg-slate-800 hover:border-blue-500/50 transition-all"
              >
                <span className="flex items-center justify-center gap-2">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                  <span>Admin Portal</span>
                </span>
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
