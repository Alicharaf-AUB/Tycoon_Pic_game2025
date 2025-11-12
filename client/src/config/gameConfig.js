// 🎯 iPARK ANGEL HUB - EASY CUSTOMIZATION
// Edit this file to customize your investment game!

export const GAME_CONFIG = {
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // 🎮 GAME SETTINGS
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  gameName: 'iPark Angel Hub',
  gameTagline: 'Join the elite investment simulation',
  organizationName: 'iPark Angel Hub',
  
  // Starting capital for each investor (in Credits)
  defaultStartingCredits: 2000000,
  
  // Currency symbol
  currency: 'CR',
  currencyName: 'Credits',
  
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // 🎨 BRANDING
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  
  // Logo (add file to client/public/ folder)
  logo: '💰', // Can be emoji or '/logo.png' for image
  logoSize: 'text-5xl', // Tailwind size: text-4xl, text-5xl, text-6xl
  
  // Event information
  eventName: 'AIM Startup Competition 2025',
  eventLocation: 'American University of Beirut',
  
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // 💎 UI SETTINGS
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  
  // Theme colors (Tailwind classes)
  theme: {
    primary: 'gold', // gold, emerald, blue, purple, red
    accent: 'amber',
    mode: 'light' // light or dark
  },
  
  // Show features
  showInvestorCount: true,
  showTotalInvested: true,
  showRemainingCredits: true,
  showPercentages: true,
  showInvestorList: true, // Show who invested in each startup
  
  // Animations
  enableAnimations: true,
  enableSoundEffects: false, // Coming soon!
  enableConfetti: true, // Confetti on investment
  
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // 📊 GAME RULES
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  
  // Minimum investment per startup
  minInvestmentAmount: 0,
  
  // Maximum investment per startup (0 = no limit)
  maxInvestmentAmount: 0,
  
  // Can invest in multiple startups?
  allowMultipleInvestments: true,
  
  // Require all capital to be invested?
  requireFullAllocation: false,
  
  // Allow editing after investment?
  allowEditInvestments: true,
  
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // 📱 MESSAGES & TEXT
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  
  messages: {
    welcome: 'Welcome to the future of startup investing!',
    joinButton: '🎯 Join Game',
    investButton: '💰 Invest Now',
    editButton: '✏️ Edit Investment',
    confirmButton: '✓ Confirm Investment',
    cancelButton: 'Cancel',
    removeButton: 'Remove',
    
    investmentSuccess: '🎉 Investment successful!',
    investmentError: '❌ Investment failed',
    insufficientFunds: '💸 Insufficient funds',
    gameLocked: '🔒 Game is locked. No more changes allowed.',
    
    adminTitle: '🎯 Admin Dashboard',
    adminSubtitle: 'Control Panel',
  },
  
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // 🚀 STARTUP CATEGORIES (Optional tags)
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  
  categories: [
    'EnergyTech',
    'B2B SaaS',
    'Digital Humans',
    'AdTech',
    'FinTech',
    'HealthTech',
    'EdTech',
    'CleanTech',
    'AI/ML',
    'Blockchain',
    'E-commerce',
    'Social Impact',
  ],
  
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // 🎯 LEADERBOARD SETTINGS
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  
  leaderboard: {
    showTopN: 5, // Show top N startups on overview
    showInvestorNames: true,
    showInvestmentAmounts: true,
    updateInterval: 1000, // Update every N milliseconds
  },
  
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // 📧 CONTACT & SUPPORT
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  
  contact: {
    email: 'innovation@aub.edu.lb',
    website: 'https://www.aub.edu.lb',
    social: {
      twitter: '@AUBLebanon',
      instagram: '@AUBLebanon',
      linkedin: 'american-university-of-beirut',
    }
  },
  
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // 🎨 ADVANCED: Custom CSS Classes
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  
  customClasses: {
    // Override default button styles
    primaryButton: 'btn-primary', // Use default or create custom
    secondaryButton: 'btn-secondary',
    
    // Override card styles
    card: 'card-hover', // card, card-hover, card-premium
    
    // Add custom animations
    investAnimation: 'animate-pulse',
  },
};

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 💰 MONEY VIBES SETTINGS
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export const MONEY_VIBES = {
  // Show money flying animation on investment
  moneyAnimation: true,
  
  // Show progress bars
  showFundingProgress: true,
  
  // Show "HOT" badges on trending startups
  showTrendingBadges: true,
  
  // Show investment velocity (investments per minute)
  showVelocity: true,
  
  // Show total money in play
  showTotalMoneyInPlay: true,
  
  // Emojis for different states
  emojis: {
    money: '💰',
    chart: '📊',
    rocket: '🚀',
    fire: '🔥',
    trophy: '🏆',
    diamond: '💎',
    celebration: '🎉',
    lock: '🔒',
    unlock: '🔓',
  }
};

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 📱 RESPONSIVE BREAKPOINTS
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export const RESPONSIVE = {
  // Cards per row at different screen sizes
  mobile: 1,      // < 768px
  tablet: 2,      // 768px - 1024px
  desktop: 3,     // > 1024px
  widescreen: 4,  // > 1536px
  
  // Container max width
  containerMaxWidth: '1600px',
};

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 🎯 EXPORT CONFIG
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export default GAME_CONFIG;
