// 🎯 GAME CONFIGURATION
// Edit this file to customize your investment game!

export const GAME_CONFIG = {
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // 🎮 GAME IDENTITY
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  gameName: 'AUB Angel Investor',
  gameTagline: 'Join the elite investment simulation',
  organizationName: 'AUB Innovation & Entrepreneurship',
  
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // 💰 INVESTOR SETTINGS
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  defaultStartingCredit: 500, // 500 points = 500 euros
  currencySymbol: '€',
  currencyName: 'Points',
  
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // 🎨 BRANDING
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  logoEmoji: '💰', // Or replace with: <img src="/logo.png" />
  accentColor: 'gold', // gold, blue, purple, red
  
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // 📱 FEATURES
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  showInvestorCount: true,
  showTotalRaised: true,
  showLeaderboard: true,
  allowEditInvestments: true,
  showInvestorNames: true, // Show who invested in what
  
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // 🎯 GAME RULES
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  minInvestment: 0,
  maxInvestmentPerStartup: null, // null = no limit
  requireFullAllocation: false, // Must invest all credits?
  
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // 💬 MESSAGING
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  messages: {
    welcomeTitle: 'Welcome, Investor!',
    investmentSuccess: 'Investment recorded! 💎',
    gameLockedMessage: 'Voting period has ended. Results are final! 🏆',
    noStartupsMessage: 'Startups will appear here soon...',
  },
  
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // 🎪 EVENT CUSTOMIZATION
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  eventInfo: {
    enabled: true,
    eventName: 'AIM Demo Day 2025',
    eventDate: 'November 2025',
    eventLocation: 'American University of Beirut',
  },

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // 🏢 ORGANIZATION INFO
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  organizationInfo: {
    enabled: true,
    name: 'AUB Innovation & Entrepreneurship',
  }
};

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 🎨 THEME PRESETS
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
export const THEME_PRESETS = {
  gold: {
    primary: 'from-gold-500 to-primary-600',
    badge: 'bg-gradient-to-r from-gold-200 to-amber-200',
    text: 'text-gold-700',
  },
  blue: {
    primary: 'from-blue-500 to-cyan-600',
    badge: 'bg-gradient-to-r from-blue-200 to-cyan-200',
    text: 'text-blue-700',
  },
  purple: {
    primary: 'from-purple-500 to-pink-600',
    badge: 'bg-gradient-to-r from-purple-200 to-pink-200',
    text: 'text-purple-700',
  },
  red: {
    primary: 'from-red-500 to-orange-600',
    badge: 'bg-gradient-to-r from-red-200 to-orange-200',
    text: 'text-red-700',
  }
};

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 💵 MONEY ANIMATIONS CONFIG
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
export const ANIMATION_CONFIG = {
  enableMoneyRain: true,
  enableCountUp: true,
  enableConfetti: true,
  enablePulse: true,
};

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 📊 DISPLAY OPTIONS
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
export const DISPLAY_CONFIG = {
  cardsPerRowDesktop: 3,
  cardsPerRowTablet: 2,
  cardsPerRowMobile: 1,
  showStartupLogos: false, // Add logo URLs to startups
  showStartupIndustry: true,
};
