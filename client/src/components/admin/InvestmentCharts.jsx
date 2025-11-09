import { Chart as ChartJS, ArcElement, CategoryScale, LinearScale, BarElement, LineElement, PointElement, Title, Tooltip, Legend } from 'chart.js';
import { Pie, Bar, Line } from 'react-chartjs-2';
import { formatCurrency } from '../../utils/api';

ChartJS.register(ArcElement, CategoryScale, LinearScale, BarElement, LineElement, PointElement, Title, Tooltip, Legend);

export default function InvestmentCharts({ gameState }) {
  if (!gameState) return null;

  const { startups = [], investments = [], investors = [] } = gameState;

  // Industry Distribution (Pie Chart)
  const getIndustryData = () => {
    const industryMap = {};
    startups.forEach(startup => {
      const industry = startup.industry || 'Other';
      const raised = startup.total_raised || 0;
      industryMap[industry] = (industryMap[industry] || 0) + raised;
    });

    return {
      labels: Object.keys(industryMap),
      datasets: [{
        data: Object.values(industryMap),
        backgroundColor: [
          'rgba(59, 130, 246, 0.8)',
          'rgba(16, 185, 129, 0.8)',
          'rgba(245, 158, 11, 0.8)',
          'rgba(139, 92, 246, 0.8)',
          'rgba(236, 72, 153, 0.8)',
          'rgba(20, 184, 166, 0.8)',
        ],
        borderColor: [
          'rgba(59, 130, 246, 1)',
          'rgba(16, 185, 129, 1)',
          'rgba(245, 158, 11, 1)',
          'rgba(139, 92, 246, 1)',
          'rgba(236, 72, 153, 1)',
          'rgba(20, 184, 166, 1)',
        ],
        borderWidth: 2,
      }],
    };
  };

  // Top Startups by Investment (Bar Chart)
  const getTopStartupsData = () => {
    const sorted = [...startups]
      .filter(s => s.total_raised > 0)
      .sort((a, b) => b.total_raised - a.total_raised)
      .slice(0, 10);

    return {
      labels: sorted.map(s => s.name.length > 15 ? s.name.substring(0, 12) + '...' : s.name),
      datasets: [{
        label: 'Total Raised',
        data: sorted.map(s => s.total_raised),
        backgroundColor: 'rgba(59, 130, 246, 0.8)',
        borderColor: 'rgba(59, 130, 246, 1)',
        borderWidth: 2,
      }],
    };
  };

  // Top Investors (Bar Chart)
  const getTopInvestorsData = () => {
    const sorted = [...investors]
      .filter(i => i.invested > 0)
      .sort((a, b) => b.invested - a.invested)
      .slice(0, 10);

    return {
      labels: sorted.map(i => i.name.length > 15 ? i.name.substring(0, 12) + '...' : i.name),
      datasets: [{
        label: 'Total Invested',
        data: sorted.map(i => i.invested),
        backgroundColor: 'rgba(16, 185, 129, 0.8)',
        borderColor: 'rgba(16, 185, 129, 1)',
        borderWidth: 2,
      }],
    };
  };

  // Investment Allocation Rate (Pie Chart)
  const getAllocationData = () => {
    const totalCapital = investors.reduce((sum, i) => sum + i.starting_credit, 0);
    const totalInvested = investors.reduce((sum, i) => sum + i.invested, 0);
    const totalRemaining = totalCapital - totalInvested;

    return {
      labels: ['Deployed', 'Available'],
      datasets: [{
        data: [totalInvested, totalRemaining],
        backgroundColor: [
          'rgba(16, 185, 129, 0.8)',
          'rgba(100, 116, 139, 0.5)',
        ],
        borderColor: [
          'rgba(16, 185, 129, 1)',
          'rgba(100, 116, 139, 1)',
        ],
        borderWidth: 2,
      }],
    };
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        labels: {
          color: '#cbd5e1',
          font: {
            size: 11,
          },
        },
      },
      tooltip: {
        backgroundColor: 'rgba(15, 23, 42, 0.9)',
        titleColor: '#cbd5e1',
        bodyColor: '#e2e8f0',
        borderColor: 'rgba(59, 130, 246, 0.5)',
        borderWidth: 1,
        callbacks: {
          label: function(context) {
            let label = context.label || '';
            if (label) {
              label += ': ';
            }
            if (context.parsed !== null) {
              label += formatCurrency(context.parsed);
            }
            return label;
          }
        }
      },
    },
    scales: {
      x: {
        ticks: { color: '#94a3b8', font: { size: 10 } },
        grid: { color: 'rgba(148, 163, 184, 0.1)' },
      },
      y: {
        ticks: {
          color: '#94a3b8',
          font: { size: 10 },
          callback: function(value) {
            return formatCurrency(value);
          }
        },
        grid: { color: 'rgba(148, 163, 184, 0.1)' },
      },
    },
  };

  const pieOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          color: '#cbd5e1',
          font: { size: 11 },
          padding: 15,
        },
      },
      tooltip: {
        backgroundColor: 'rgba(15, 23, 42, 0.9)',
        titleColor: '#cbd5e1',
        bodyColor: '#e2e8f0',
        borderColor: 'rgba(59, 130, 246, 0.5)',
        borderWidth: 1,
        callbacks: {
          label: function(context) {
            const label = context.label || '';
            const value = context.parsed || 0;
            const total = context.dataset.data.reduce((a, b) => a + b, 0);
            const percentage = ((value / total) * 100).toFixed(1);
            return `${label}: ${formatCurrency(value)} (${percentage}%)`;
          }
        }
      },
    },
  };

  return (
    <div className="space-y-6">
      {/* Row 1: Pie Charts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Industry Distribution */}
        <div className="card-executive">
          <h3 className="text-lg font-bold text-slate-100 mb-4 flex items-center gap-2">
            <svg className="w-5 h-5 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
              <path d="M2 10a8 8 0 018-8v8h8a8 8 0 11-16 0z" />
              <path d="M12 2.252A8.014 8.014 0 0117.748 8H12V2.252z" />
            </svg>
            Investment by Industry
          </h3>
          <div className="h-64">
            <Pie data={getIndustryData()} options={pieOptions} />
          </div>
        </div>

        {/* Capital Allocation */}
        <div className="card-executive">
          <h3 className="text-lg font-bold text-slate-100 mb-4 flex items-center gap-2">
            <svg className="w-5 h-5 text-emerald-400" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM4.332 8.027a6.012 6.012 0 011.912-2.706C6.512 5.73 6.974 6 7.5 6A1.5 1.5 0 019 7.5V8a2 2 0 004 0 2 2 0 011.523-1.943A5.977 5.977 0 0116 10c0 .34-.028.675-.083 1H15a2 2 0 00-2 2v2.197A5.973 5.973 0 0110 16v-2a2 2 0 00-2-2 2 2 0 01-2-2 2 2 0 00-1.668-1.973z" clipRule="evenodd" />
            </svg>
            Capital Allocation
          </h3>
          <div className="h-64">
            <Pie data={getAllocationData()} options={pieOptions} />
          </div>
        </div>
      </div>

      {/* Row 2: Bar Charts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Top Startups */}
        <div className="card-executive">
          <h3 className="text-lg font-bold text-slate-100 mb-4 flex items-center gap-2">
            <svg className="w-5 h-5 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
              <path d="M2 11a1 1 0 011-1h2a1 1 0 011 1v5a1 1 0 01-1 1H3a1 1 0 01-1-1v-5zM8 7a1 1 0 011-1h2a1 1 0 011 1v9a1 1 0 01-1 1H9a1 1 0 01-1-1V7zM14 4a1 1 0 011-1h2a1 1 0 011 1v12a1 1 0 01-1 1h-2a1 1 0 01-1-1V4z" />
            </svg>
            Top Startups by Investment
          </h3>
          <div className="h-64">
            <Bar data={getTopStartupsData()} options={chartOptions} />
          </div>
        </div>

        {/* Top Investors */}
        <div className="card-executive">
          <h3 className="text-lg font-bold text-slate-100 mb-4 flex items-center gap-2">
            <svg className="w-5 h-5 text-emerald-400" fill="currentColor" viewBox="0 0 20 20">
              <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3zM6 8a2 2 0 11-4 0 2 2 0 014 0zM16 18v-3a5.972 5.972 0 00-.75-2.906A3.005 3.005 0 0119 15v3h-3zM4.75 12.094A5.973 5.973 0 004 15v3H1v-3a3 3 0 013.75-2.906z" />
            </svg>
            Top Investors by Amount
          </h3>
          <div className="h-64">
            <Bar data={getTopInvestorsData()} options={chartOptions} />
          </div>
        </div>
      </div>
    </div>
  );
}
