const { v4: uuidv4 } = require('uuid');
const db = require('./database');

function seedDatabase() {
  console.log('🚀 Seeding AUB Angel Investor database with AIM Startups...\n');

  // Clear existing data
  db.exec(`
    DELETE FROM investments;
    DELETE FROM investors;
    DELETE FROM startups;
  `);

// Real AIM Startups from CSV
const startups = [
  {
    id: uuidv4(),
    name: 'Bilo',
    slug: 'bilo',
    description: 'The AI platform to launch outdoor Ads in 5 minutes - on any budget. Billboard Ads as Easy as Online Ads. Launch your outdoor campaign in just 5 minutes—anytime, anywhere, and on any budget. We provide a never before easy, fast, hyper-targeted, and cost-saving approach to booking outdoor ad campaigns using AI and data.',
    logo: 'Bilo',
    pitch_deck: 'Bilo Pitch Deck B&A Oct.pptx',
    cohort: 'B&A2024, B&A2025',
    support_program: 'IVP 2025 Finalists, GTM2025',
    industry: 'AdTech',
    email: 'neahme@usebilo.com',
    team: 'Neahme Jbaily - CEO, Joe Rizkallah - COO',
    generating_revenue: 'Yes',
    ask: '$250,000',
    legal_entity: 'Yes (UK)'
  },
  {
    id: uuidv4(),
    name: 'Mina Canaan',
    slug: 'mina-canaan',
    description: 'A disruptive innovation in marine technology - catamarans powered by wind, sun, electricity, and hydrogen. Democratizing the sailing experience with sustainable rentals through the Mina App.',
    logo: '',
    pitch_deck: '',
    cohort: '',
    support_program: '',
    industry: 'Maritime/CleanTech',
    email: '',
    team: '',
    generating_revenue: '',
    ask: '',
    legal_entity: ''
  },
  {
    id: uuidv4(),
    name: 'IGT',
    slug: 'igt',
    description: 'Innovative solutions for the green industry: hybrid solar systems, solar water heating, and solar water pumping. Leading the EnergyTech revolution.',
    logo: '',
    pitch_deck: '',
    cohort: '',
    support_program: '',
    industry: 'EnergyTech',
    email: '',
    team: '',
    generating_revenue: '',
    ask: '',
    legal_entity: ''
  },
  {
    id: uuidv4(),
    name: 'Impersonas',
    slug: 'impersonas',
    description: 'The "Netflix of digital humans" - transforming digital engagement with licensed virtual avatars. Blockchain-verified digital humans for brands, artists, and influencers.',
    logo: '',
    pitch_deck: '',
    cohort: '',
    support_program: '',
    industry: 'AI/Web3',
    email: '',
    team: '',
    generating_revenue: '',
    ask: '',
    legal_entity: ''
  },
  {
    id: uuidv4(),
    name: 'Schedex',
    slug: 'schedex',
    description: 'AI-powered SaaS for employee and shift management in Hospitality and F&B. Creates optimal schedules saving restaurants 15% while meeting labor targets and employee preferences.',
    logo: '',
    pitch_deck: '',
    cohort: '',
    support_program: '',
    industry: 'HR Tech/SaaS',
    email: '',
    team: '',
    generating_revenue: '',
    ask: '',
    legal_entity: ''
  },
];

const insertStartup = db.prepare(`
  INSERT INTO startups (id, name, slug, description, logo, pitch_deck, cohort, support_program, industry, email, team, generating_revenue, ask, legal_entity, is_active)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)
`);

console.log('📊 Creating AIM Startups:\n');
startups.forEach((startup) => {
  insertStartup.run(startup.id, startup.name, startup.slug, startup.description, startup.logo, startup.pitch_deck, startup.cohort, startup.support_program, startup.industry, startup.email, startup.team, startup.generating_revenue, startup.ask, startup.legal_entity);
  console.log(`   ✓ ${startup.name}`);
});

console.log('\n💰 Setting up for production use...');
console.log('   → No sample investors (participants will join live)');
console.log('   → No sample investments (real-time during event)');
console.log('   → Game state: UNLOCKED');

console.log('\n✅ Database ready for production!\n');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('🎯 AUB ANGEL INVESTOR - PRODUCTION SETUP');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
console.log('📱 STARTUPS LOADED:');
startups.forEach((s, i) => console.log(`   ${i + 1}. ${s.name}`));
console.log('\n🚀 NEXT STEPS:');
console.log('   1. npm run dev          → Start development');
console.log('   2. Deploy to production → See DEPLOYMENT.md');
console.log('   3. Share join link      → Participants invest live');
console.log('\n🔐 ADMIN CREDENTIALS:');
console.log('   Username: admin');
console.log('   Password: demo123');
console.log('   URL: /admin');
console.log('\n💡 TIP: Change admin password in .env before deploying!');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
}

// Export the seed function
module.exports = { seedDatabase };

// Run if called directly
if (require.main === module) {
  seedDatabase();
}
