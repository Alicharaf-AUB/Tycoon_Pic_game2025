import { formatCurrency } from './api';

// Convert data to CSV format
function convertToCSV(data, headers) {
  const rows = [headers];
  data.forEach(row => {
    rows.push(headers.map(header => {
      const value = row[header] || '';
      // Escape quotes and wrap in quotes if contains comma or quote
      if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
        return `"${value.replace(/"/g, '""')}"`;
      }
      return value;
    }));
  });
  return rows.map(row => row.join(',')).join('\n');
}

// Download CSV file
function downloadCSV(content, filename) {
  const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
}

// Export Investors to CSV
export function exportInvestorsToCSV(investors, investments = [], startups = []) {
  const data = investors.map(inv => {
    // Get all investments by this investor
    const investorVotes = investments.filter(investment => investment.investor_id === inv.id);
    
    // Create list of startups voted for with amounts
    const votesDetails = investorVotes.map(vote => {
      const startup = startups.find(s => s.id === vote.startup_id);
      const startupName = startup ? startup.name : `Startup #${vote.startup_id} (deleted)`;
      return `${startupName}: $${vote.amount}`;
    }).join(' | ');
    
    return {
      'Investor ID': inv.id,
      'Name': inv.name,
      'Email': inv.email || 'N/A',
      'Starting Credit': inv.starting_credit,
      'Total Invested': inv.invested || 0,
      'Remaining Funds': inv.remaining || 0,
      'Allocation Rate': inv.starting_credit > 0 ? `${((inv.invested / inv.starting_credit) * 100).toFixed(1)}%` : '0%',
      'Submitted': inv.submitted ? 'Yes' : 'No',
      'Votes': votesDetails || 'No votes yet',
      'Created At': new Date(inv.created_at).toLocaleString(),
    };
  });

  const headers = Object.keys(data[0] || {});
  const csv = convertToCSV(data, headers);
  const filename = `Investors-Export-${new Date().toISOString().split('T')[0]}.csv`;
  downloadCSV(csv, filename);
}

// Export Startups to CSV
export function exportStartupsToCSV(startups) {
  const data = startups.map(startup => ({
    'Startup ID': startup.id,
    'Name': startup.name,
    'Slug': startup.slug,
    'Industry': startup.industry || 'N/A',
    'Description': startup.description || '',
    'Total Raised': startup.total_raised || 0,
    'Investor Count': startup.investor_count || 0,
    'Funding Ask': startup.ask || 'N/A',
    'Generating Revenue': startup.generating_revenue || 'N/A',
    'Legal Entity': startup.legal_entity || 'N/A',
    'Cohort': startup.cohort || 'N/A',
    'Support Program': startup.support_program || 'N/A',
    'Email': startup.email || 'N/A',
    'Active': startup.is_active ? 'Yes' : 'No',
    'Created At': new Date(startup.created_at).toLocaleString(),
  }));

  const headers = Object.keys(data[0] || {});
  const csv = convertToCSV(data, headers);
  const filename = `Startups-Export-${new Date().toISOString().split('T')[0]}.csv`;
  downloadCSV(csv, filename);
}

// Export Investments to CSV
export function exportInvestmentsToCSV(investments, startups, investors) {
  const data = investments.map(inv => {
    const startup = startups.find(s => s.id === inv.startup_id);
    const investor = investors.find(i => i.id === inv.investor_id);

    return {
      'Investment ID': inv.id,
      'Investor Name': inv.investor_name || investor?.name || 'Unknown',
      'Investor Email': investor?.email || 'N/A',
      'Investor ID': inv.investor_id,
      'Startup Name': startup?.name || 'Unknown',
      'Startup ID': inv.startup_id,
      'Industry': startup?.industry || 'N/A',
      'Amount': inv.amount,
      'Percentage of Startup': startup?.total_raised > 0 ? `${((inv.amount / startup.total_raised) * 100).toFixed(1)}%` : '0%',
      'Created At': new Date(inv.created_at).toLocaleString(),
      'Updated At': new Date(inv.updated_at || inv.created_at).toLocaleString(),
    };
  });

  const headers = Object.keys(data[0] || {});
  const csv = convertToCSV(data, headers);
  const filename = `Investments-Export-${new Date().toISOString().split('T')[0]}.csv`;
  downloadCSV(csv, filename);
}

// Export All Data (Combined Report)
export function exportAllDataToCSV(gameState) {
  const { investors = [], startups = [], investments = [] } = gameState;

  // Summary Statistics
  const totalCapital = investors.reduce((sum, i) => sum + i.starting_credit, 0);
  const totalInvested = investors.reduce((sum, i) => sum + (i.invested || 0), 0);
  const totalRemaining = totalCapital - totalInvested;
  const avgInvestment = investments.length > 0 ? totalInvested / investments.length : 0;

  const summaryData = [
    { Metric: 'Total Investors', Value: investors.length },
    { Metric: 'Total Startups', Value: startups.length },
    { Metric: 'Total Investments', Value: investments.length },
    { Metric: 'Total Capital', Value: totalCapital },
    { Metric: 'Total Deployed', Value: totalInvested },
    { Metric: 'Total Available', Value: totalRemaining },
    { Metric: 'Allocation Rate', Value: `${((totalInvested / totalCapital) * 100).toFixed(1)}%` },
    { Metric: 'Average Investment', Value: avgInvestment.toFixed(2) },
  ];

  const summaryCSV = convertToCSV(summaryData, ['Metric', 'Value']);

  // Industry Breakdown
  const industryMap = {};
  startups.forEach(startup => {
    const industry = startup.industry || 'Other';
    if (!industryMap[industry]) {
      industryMap[industry] = { raised: 0, count: 0 };
    }
    industryMap[industry].raised += startup.total_raised || 0;
    industryMap[industry].count += 1;
  });

  const industryData = Object.entries(industryMap).map(([industry, data]) => ({
    Industry: industry,
    'Total Raised': data.raised,
    'Number of Startups': data.count,
    'Average per Startup': (data.raised / data.count).toFixed(2),
  }));

  const industryCSV = convertToCSV(industryData, Object.keys(industryData[0] || {}));

  // Combine all sections
  const combinedCSV = [
    '=== PLATFORM SUMMARY ===',
    summaryCSV,
    '',
    '=== INDUSTRY BREAKDOWN ===',
    industryCSV,
    '',
    '=== DETAILED INVESTORS ===',
  ].join('\n');

  // Add detailed investors
  const investorHeaders = ['Name', 'Starting Credit', 'Invested', 'Remaining', 'Submitted'];
  const investorRows = investors.map(inv => ({
    'Name': inv.name,
    'Starting Credit': inv.starting_credit,
    'Invested': inv.invested || 0,
    'Remaining': inv.remaining || 0,
    'Submitted': inv.submitted ? 'Yes' : 'No',
  }));
  const investorsCSV = convertToCSV(investorRows, investorHeaders);

  const finalCSV = combinedCSV + '\n' + investorsCSV;

  const filename = `Complete-Platform-Report-${new Date().toISOString().split('T')[0]}.csv`;
  downloadCSV(finalCSV, filename);
}

// Export Audit Log to CSV
export function exportAuditLogToCSV(auditLog) {
  const data = auditLog.map(entry => ({
    'Timestamp': new Date(entry.timestamp).toLocaleString(),
    'Admin': entry.admin || 'System',
    'Action': entry.action,
    'Target': entry.target || 'N/A',
    'Details': entry.details || '',
    'IP Address': entry.ipAddress || 'N/A',
  }));

  const headers = Object.keys(data[0] || {});
  const csv = convertToCSV(data, headers);
  const filename = `Audit-Log-${new Date().toISOString().split('T')[0]}.csv`;
  downloadCSV(csv, filename);
}

// Generate Compliance Report
export function generateComplianceReport(gameState) {
  const { investors = [], startups = [], investments = [] } = gameState;

  const report = {
    reportDate: new Date().toLocaleString(),
    platform: 'iPark Angel Hub',
    reportType: 'Compliance Report',

    summary: {
      totalInvestors: investors.length,
      activeInvestors: investors.filter(i => i.invested > 0).length,
      totalStartups: startups.length,
      activeStartups: startups.filter(s => s.is_active).length,
      totalTransactions: investments.length,
    },

    capitalFlow: {
      totalCapital: investors.reduce((sum, i) => sum + i.starting_credit, 0),
      deployed: investors.reduce((sum, i) => sum + (i.invested || 0), 0),
      available: investors.reduce((sum, i) => sum + (i.remaining || 0), 0),
    },

    riskMetrics: {
      concentrationRisk: calculateConcentrationRisk(investments, startups),
      avgInvestmentSize: investments.length > 0 ? (investors.reduce((sum, i) => sum + (i.invested || 0), 0) / investments.length) : 0,
      maxSingleInvestment: Math.max(...investments.map(i => i.amount), 0),
      diversificationScore: calculateDiversificationScore(investments, startups),
    },
  };

  // Convert to CSV format
  const sections = [];

  // Report Header
  sections.push('=== COMPLIANCE REPORT ===');
  sections.push(`Report Date,${report.reportDate}`);
  sections.push(`Platform,${report.platform}`);
  sections.push('');

  // Summary
  sections.push('=== SUMMARY STATISTICS ===');
  sections.push('Metric,Value');
  Object.entries(report.summary).forEach(([key, value]) => {
    sections.push(`${key},${value}`);
  });
  sections.push('');

  // Capital Flow
  sections.push('=== CAPITAL FLOW ===');
  sections.push('Metric,Amount');
  Object.entries(report.capitalFlow).forEach(([key, value]) => {
    sections.push(`${key},${value}`);
  });
  sections.push('');

  // Risk Metrics
  sections.push('=== RISK METRICS ===');
  sections.push('Metric,Value');
  Object.entries(report.riskMetrics).forEach(([key, value]) => {
    sections.push(`${key},${typeof value === 'number' ? value.toFixed(2) : value}`);
  });

  const csvContent = sections.join('\n');
  const filename = `Compliance-Report-${new Date().toISOString().split('T')[0]}.csv`;
  downloadCSV(csvContent, filename);
}

// Helper: Calculate concentration risk
function calculateConcentrationRisk(investments, startups) {
  if (investments.length === 0) return 0;

  const totalInvested = investments.reduce((sum, i) => sum + i.amount, 0);
  const maxStartupInvestment = startups.reduce((max, startup) => {
    return Math.max(max, startup.total_raised || 0);
  }, 0);

  return totalInvested > 0 ? ((maxStartupInvestment / totalInvested) * 100).toFixed(1) : 0;
}

// Helper: Calculate diversification score
function calculateDiversificationScore(investments, startups) {
  if (investments.length === 0) return 0;

  const industries = new Set();
  investments.forEach(inv => {
    const startup = startups.find(s => s.id === inv.startup_id);
    if (startup?.industry) {
      industries.add(startup.industry);
    }
  });

  // Score based on number of industries (max 100)
  return Math.min(industries.size * 20, 100);
}
