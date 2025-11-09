import { useState, useEffect } from 'react';
import { exportAuditLogToCSV } from '../../utils/adminExport';

export default function AuditTrail() {
  const [auditLog, setAuditLog] = useState([]);
  const [filter, setFilter] = useState('all'); // all, admin, investor, system

  useEffect(() => {
    // Load audit log from localStorage
    const savedLog = localStorage.getItem('auditLog');
    if (savedLog) {
      try {
        setAuditLog(JSON.parse(savedLog));
      } catch (e) {
        console.error('Error loading audit log:', e);
      }
    }
  }, []);

  // Log admin action
  const logAction = (action, target, details) => {
    const entry = {
      id: Date.now(),
      timestamp: new Date().toISOString(),
      admin: localStorage.getItem('admin_username') || 'Admin',
      action,
      target,
      details,
      ipAddress: 'Local', // In production, this would be the actual IP
    };

    const newLog = [entry, ...auditLog].slice(0, 500); // Keep last 500 entries
    setAuditLog(newLog);
    localStorage.setItem('auditLog', JSON.stringify(newLog));
  };

  // Make logAction available globally
  useEffect(() => {
    window.logAdminAction = logAction;
    return () => {
      delete window.logAdminAction;
    };
  }, [auditLog]);

  const filteredLog = auditLog.filter(entry => {
    if (filter === 'all') return true;
    if (filter === 'admin') return entry.action.includes('Admin');
    if (filter === 'investor') return entry.action.includes('Investor') || entry.action.includes('Credit');
    if (filter === 'system') return entry.action.includes('Lock') || entry.action.includes('System');
    return true;
  });

  const getActionIcon = (action) => {
    if (action.includes('Delete') || action.includes('Remove')) {
      return (
        <div className="w-8 h-8 rounded-full bg-rose-500/20 flex items-center justify-center">
          <svg className="w-4 h-4 text-rose-400" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
        </div>
      );
    }
    if (action.includes('Create') || action.includes('Add')) {
      return (
        <div className="w-8 h-8 rounded-full bg-emerald-500/20 flex items-center justify-center">
          <svg className="w-4 h-4 text-emerald-400" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v2H7a1 1 0 100 2h2v2a1 1 0 102 0v-2h2a1 1 0 100-2h-2V7z" clipRule="evenodd" />
          </svg>
        </div>
      );
    }
    if (action.includes('Update') || action.includes('Modify') || action.includes('Edit')) {
      return (
        <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center">
          <svg className="w-4 h-4 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
            <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
          </svg>
        </div>
      );
    }
    if (action.includes('Lock') || action.includes('Unlock')) {
      return (
        <div className="w-8 h-8 rounded-full bg-amber-500/20 flex items-center justify-center">
          <svg className="w-4 h-4 text-amber-400" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
          </svg>
        </div>
      );
    }
    return (
      <div className="w-8 h-8 rounded-full bg-slate-500/20 flex items-center justify-center">
        <svg className="w-4 h-4 text-slate-400" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
        </svg>
      </div>
    );
  };

  const handleExport = () => {
    exportAuditLogToCSV(filteredLog);
  };

  const clearAuditLog = () => {
    if (confirm('Are you sure you want to clear the audit log? This action cannot be undone.')) {
      setAuditLog([]);
      localStorage.removeItem('auditLog');
      logAction('Clear Audit Log', 'System', 'Audit log cleared by admin');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="card-executive">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-xl font-bold text-slate-100 flex items-center gap-2">
              <svg className="w-6 h-6 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M3 3a1 1 0 000 2v8a2 2 0 002 2h2.586l-1.293 1.293a1 1 0 101.414 1.414L10 15.414l2.293 2.293a1 1 0 001.414-1.414L12.414 15H15a2 2 0 002-2V5a1 1 0 100-2H3zm11.707 4.707a1 1 0 00-1.414-1.414L10 9.586 8.707 8.293a1 1 0 00-1.414 0l-2 2a1 1 0 101.414 1.414L8 10.414l1.293 1.293a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              Audit Trail & Compliance
            </h3>
            <p className="text-sm text-slate-500 mt-1">Complete log of all administrative actions</p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={handleExport}
              className="btn-secondary text-sm py-2 flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              Export Log
            </button>
            <button
              onClick={clearAuditLog}
              className="btn-danger text-sm py-2"
            >
              Clear Log
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="flex gap-2 mb-4">
          {['all', 'admin', 'investor', 'system'].map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                filter === f
                  ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                  : 'bg-slate-800/50 text-slate-400 hover:text-slate-300'
              }`}
            >
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
          <div className="ml-auto text-sm text-slate-500 flex items-center">
            {filteredLog.length} entries
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-4 gap-4 mb-6">
          <div className="bg-slate-800/30 rounded-lg p-4 text-center">
            <p className="text-2xl font-bold text-blue-400">{auditLog.length}</p>
            <p className="text-xs text-slate-500 mt-1">Total Actions</p>
          </div>
          <div className="bg-slate-800/30 rounded-lg p-4 text-center">
            <p className="text-2xl font-bold text-emerald-400">
              {auditLog.filter(e => e.action.includes('Create') || e.action.includes('Add')).length}
            </p>
            <p className="text-xs text-slate-500 mt-1">Created</p>
          </div>
          <div className="bg-slate-800/30 rounded-lg p-4 text-center">
            <p className="text-2xl font-bold text-blue-400">
              {auditLog.filter(e => e.action.includes('Update') || e.action.includes('Modify')).length}
            </p>
            <p className="text-xs text-slate-500 mt-1">Modified</p>
          </div>
          <div className="bg-slate-800/30 rounded-lg p-4 text-center">
            <p className="text-2xl font-bold text-rose-400">
              {auditLog.filter(e => e.action.includes('Delete') || e.action.includes('Remove')).length}
            </p>
            <p className="text-xs text-slate-500 mt-1">Deleted</p>
          </div>
        </div>
      </div>

      {/* Audit Log Entries */}
      <div className="card-executive">
        <div className="space-y-2 max-h-[600px] overflow-y-auto scrollbar-thin">
          {filteredLog.length === 0 ? (
            <div className="text-center py-12">
              <svg className="w-16 h-16 mx-auto mb-4 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <p className="text-slate-500">No audit entries</p>
              <p className="text-slate-600 text-sm mt-1">Administrative actions will be logged here</p>
            </div>
          ) : (
            filteredLog.map(entry => (
              <div
                key={entry.id}
                className="flex items-start gap-3 p-4 rounded-lg bg-slate-800/20 border border-slate-700/30 hover:border-blue-500/30 transition-all"
              >
                {getActionIcon(entry.action)}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-slate-200">
                        {entry.action}
                      </p>
                      {entry.target && (
                        <p className="text-sm text-slate-400 mt-1">
                          Target: <span className="text-blue-400">{entry.target}</span>
                        </p>
                      )}
                      {entry.details && (
                        <p className="text-xs text-slate-500 mt-1">{entry.details}</p>
                      )}
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="text-xs text-slate-400">
                        {new Date(entry.timestamp).toLocaleString()}
                      </p>
                      <p className="text-xs text-slate-600 mt-1">by {entry.admin}</p>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
