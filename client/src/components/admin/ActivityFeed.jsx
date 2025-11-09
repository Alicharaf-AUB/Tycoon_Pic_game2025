import { useState, useEffect } from 'react';
import { useSocket } from '../../context/SocketContext';
import { formatCurrency } from '../../utils/api';

export default function ActivityFeed() {
  const { gameState } = useSocket();
  const [activities, setActivities] = useState([]);
  const [previousInvestments, setPreviousInvestments] = useState([]);

  useEffect(() => {
    if (gameState?.investments) {
      const currentInvestments = gameState.investments;

      // Detect new or modified investments
      if (previousInvestments.length > 0) {
        const newActivities = [];

        // Check for new investments
        currentInvestments.forEach(inv => {
          const prevInv = previousInvestments.find(p => p.id === inv.id);

          if (!prevInv) {
            // New investment
            newActivities.push({
              id: inv.id,
              type: 'new_investment',
              investorName: inv.investor_name,
              startupId: inv.startup_id,
              amount: inv.amount,
              timestamp: new Date(),
            });
          } else if (prevInv.amount !== inv.amount) {
            // Modified investment
            newActivities.push({
              id: inv.id,
              type: 'modified_investment',
              investorName: inv.investor_name,
              startupId: inv.startup_id,
              amount: inv.amount,
              previousAmount: prevInv.amount,
              timestamp: new Date(),
            });
          }
        });

        // Check for removed investments
        previousInvestments.forEach(prevInv => {
          const currentInv = currentInvestments.find(c => c.id === prevInv.id);
          if (!currentInv) {
            newActivities.push({
              id: prevInv.id,
              type: 'removed_investment',
              investorName: prevInv.investor_name,
              startupId: prevInv.startup_id,
              amount: prevInv.amount,
              timestamp: new Date(),
            });
          }
        });

        if (newActivities.length > 0) {
          setActivities(prev => [...newActivities, ...prev].slice(0, 50)); // Keep last 50 activities
        }
      }

      setPreviousInvestments(currentInvestments);
    }
  }, [gameState?.investments]);

  const getStartupName = (startupId) => {
    const startup = gameState?.startups?.find(s => s.id === startupId);
    return startup?.name || 'Unknown Startup';
  };

  const getActivityIcon = (type) => {
    switch (type) {
      case 'new_investment':
        return (
          <div className="w-8 h-8 rounded-full bg-emerald-500/20 flex items-center justify-center">
            <svg className="w-4 h-4 text-emerald-400" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v2H7a1 1 0 100 2h2v2a1 1 0 102 0v-2h2a1 1 0 100-2h-2V7z" clipRule="evenodd" />
            </svg>
          </div>
        );
      case 'modified_investment':
        return (
          <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center">
            <svg className="w-4 h-4 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
              <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
            </svg>
          </div>
        );
      case 'removed_investment':
        return (
          <div className="w-8 h-8 rounded-full bg-rose-500/20 flex items-center justify-center">
            <svg className="w-4 h-4 text-rose-400" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM7 9a1 1 0 000 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
            </svg>
          </div>
        );
      default:
        return null;
    }
  };

  const getActivityMessage = (activity) => {
    switch (activity.type) {
      case 'new_investment':
        return (
          <>
            <span className="font-semibold text-slate-200">{activity.investorName}</span>
            {' invested '}
            <span className="font-bold text-emerald-400">{formatCurrency(activity.amount)}</span>
            {' in '}
            <span className="font-semibold text-blue-400">{getStartupName(activity.startupId)}</span>
          </>
        );
      case 'modified_investment':
        const change = activity.amount - activity.previousAmount;
        const isIncrease = change > 0;
        return (
          <>
            <span className="font-semibold text-slate-200">{activity.investorName}</span>
            {' modified investment in '}
            <span className="font-semibold text-blue-400">{getStartupName(activity.startupId)}</span>
            {' '}
            <span className={isIncrease ? 'text-emerald-400' : 'text-rose-400'}>
              {isIncrease ? '+' : ''}{formatCurrency(change)}
            </span>
          </>
        );
      case 'removed_investment':
        return (
          <>
            <span className="font-semibold text-slate-200">{activity.investorName}</span>
            {' removed investment of '}
            <span className="font-bold text-rose-400">{formatCurrency(activity.amount)}</span>
            {' from '}
            <span className="font-semibold text-blue-400">{getStartupName(activity.startupId)}</span>
          </>
        );
      default:
        return 'Unknown activity';
    }
  };

  const getTimeAgo = (timestamp) => {
    const seconds = Math.floor((new Date() - timestamp) / 1000);

    if (seconds < 60) return 'Just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    return `${Math.floor(seconds / 86400)}d ago`;
  };

  return (
    <div className="card-executive h-full">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-bold text-slate-100 flex items-center gap-2">
          <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
          Live Activity Feed
        </h3>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></div>
          <span className="text-xs text-slate-500">Real-time</span>
        </div>
      </div>

      <div className="space-y-3 max-h-[500px] overflow-y-auto scrollbar-thin">
        {activities.length === 0 ? (
          <div className="text-center py-12">
            <svg className="w-12 h-12 mx-auto mb-4 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            <p className="text-slate-500 text-sm">No recent activity</p>
            <p className="text-slate-600 text-xs mt-1">New investments will appear here in real-time</p>
          </div>
        ) : (
          activities.map((activity, index) => (
            <div
              key={`${activity.id}-${index}`}
              className="flex items-start gap-3 p-3 rounded-lg bg-slate-800/30 border border-slate-700/30 hover:border-blue-500/30 transition-all animate-fade-in"
            >
              {getActivityIcon(activity.type)}
              <div className="flex-1 min-w-0">
                <p className="text-sm text-slate-400 leading-relaxed">
                  {getActivityMessage(activity)}
                </p>
                <p className="text-xs text-slate-600 mt-1">
                  {getTimeAgo(activity.timestamp)}
                </p>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
