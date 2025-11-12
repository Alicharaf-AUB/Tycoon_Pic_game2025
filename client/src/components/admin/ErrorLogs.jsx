import { useState, useEffect } from 'react';
import { adminApi } from '../../utils/api';

export default function ErrorLogs() {
  const [errorLogs, setErrorLogs] = useState([]);
  const [filter, setFilter] = useState('all'); // all, runtime, api, validation, 404, react_error
  const [loading, setLoading] = useState(true);

  const fetchErrorLogs = async () => {
    setLoading(true);
    try {
      const username = localStorage.getItem('admin_username');
      const password = localStorage.getItem('admin_password');

      if (!username || !password) {
        console.error('No admin credentials found');
        setLoading(false);
        return;
      }

      const { logs } = await adminApi.getErrorLogs(username, password, 500);
      setErrorLogs(logs);
    } catch (error) {
      console.error('Error fetching error logs:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchErrorLogs();
    // Refresh logs every 30 seconds
    const interval = setInterval(fetchErrorLogs, 30000);
    return () => clearInterval(interval);
  }, []);

  const filteredLog = errorLogs.filter(entry => {
    if (filter === 'all') return true;
    return entry.error_type === filter;
  });

  const getErrorIcon = (errorType) => {
    switch (errorType) {
      case 'api':
        return (
          <div className="w-8 h-8 rounded-full bg-orange-500/20 flex items-center justify-center">
            <svg className="w-4 h-4 text-orange-400" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
          </div>
        );
      case 'validation':
        return (
          <div className="w-8 h-8 rounded-full bg-yellow-500/20 flex items-center justify-center">
            <svg className="w-4 h-4 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
          </div>
        );
      case '404':
        return (
          <div className="w-8 h-8 rounded-full bg-purple-500/20 flex items-center justify-center">
            <svg className="w-4 h-4 text-purple-400" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
            </svg>
          </div>
        );
      case 'react_error':
        return (
          <div className="w-8 h-8 rounded-full bg-red-500/20 flex items-center justify-center">
            <svg className="w-4 h-4 text-red-400" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
          </div>
        );
      default:
        return (
          <div className="w-8 h-8 rounded-full bg-rose-500/20 flex items-center justify-center">
            <svg className="w-4 h-4 text-rose-400" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
          </div>
        );
    }
  };

  const handleRefresh = () => {
    fetchErrorLogs();
  };

  const handleExport = () => {
    const csv = [
      ['ID', 'Timestamp', 'User', 'Email', 'Error Type', 'Message', 'Page URL', 'IP Address'],
      ...filteredLog.map(log => [
        log.id,
        new Date(log.timestamp).toLocaleString(),
        log.investor_name || 'Anonymous',
        log.investor_email || 'N/A',
        log.error_type,
        log.error_message,
        log.page_url,
        log.ip_address || 'Unknown',
      ])
    ];

    const csvContent = csv.map(row => row.map(cell => `"${cell}"`).join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `error-logs-${Date.now()}.csv`;
    a.click();
  };

  const errorTypes = ['all', 'runtime', 'api', 'validation', '404', 'react_error', 'unhandled'];
  const errorTypeLabels = {
    all: 'All',
    runtime: 'Runtime',
    api: 'API',
    validation: 'Validation',
    '404': '404 Not Found',
    react_error: 'React Error',
    unhandled: 'Unhandled',
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="card-executive">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-xl font-bold text-slate-100 flex items-center gap-2">
              <svg className="w-6 h-6 text-red-400" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              User Error Logs
            </h3>
            <p className="text-sm text-slate-500 mt-1">Track errors experienced by users</p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={handleRefresh}
              className="btn-secondary text-sm py-2 flex items-center gap-2"
              disabled={loading}
            >
              <svg className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Refresh
            </button>
            <button
              onClick={handleExport}
              className="btn-secondary text-sm py-2 flex items-center gap-2"
              disabled={loading}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              Export CSV
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-2 mb-4">
          {errorTypes.map(type => (
            <button
              key={type}
              onClick={() => setFilter(type)}
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                filter === type
                  ? 'bg-red-500/20 text-red-300 border border-red-500/30'
                  : 'bg-slate-800/50 text-slate-400 hover:text-slate-300'
              }`}
            >
              {errorTypeLabels[type]}
            </button>
          ))}
          <div className="ml-auto text-sm text-slate-500 flex items-center">
            {filteredLog.length} errors
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-5 gap-4 mb-6">
          <div className="bg-slate-800/30 rounded-lg p-4 text-center">
            <p className="text-2xl font-bold text-red-400">{errorLogs.length}</p>
            <p className="text-xs text-slate-500 mt-1">Total Errors</p>
          </div>
          <div className="bg-slate-800/30 rounded-lg p-4 text-center">
            <p className="text-2xl font-bold text-orange-400">
              {errorLogs.filter(e => e.error_type === 'api').length}
            </p>
            <p className="text-xs text-slate-500 mt-1">API Errors</p>
          </div>
          <div className="bg-slate-800/30 rounded-lg p-4 text-center">
            <p className="text-2xl font-bold text-red-400">
              {errorLogs.filter(e => e.error_type === 'react_error').length}
            </p>
            <p className="text-xs text-slate-500 mt-1">React Errors</p>
          </div>
          <div className="bg-slate-800/30 rounded-lg p-4 text-center">
            <p className="text-2xl font-bold text-purple-400">
              {errorLogs.filter(e => e.error_type === '404').length}
            </p>
            <p className="text-xs text-slate-500 mt-1">404 Errors</p>
          </div>
          <div className="bg-slate-800/30 rounded-lg p-4 text-center">
            <p className="text-2xl font-bold text-yellow-400">
              {errorLogs.filter(e => e.error_type === 'validation').length}
            </p>
            <p className="text-xs text-slate-500 mt-1">Validation</p>
          </div>
        </div>
      </div>

      {/* Error Log Entries */}
      <div className="card-executive">
        <h4 className="text-lg font-semibold text-slate-200 mb-4">Error Details</h4>
        <div className="max-h-[600px] overflow-y-auto scrollbar-thin pr-2">
          <div className="space-y-2 pb-4">
            {loading ? (
              <div className="text-center py-12">
                <div className="spinner w-8 h-8 mx-auto mb-4"></div>
                <p className="text-slate-500">Loading error logs...</p>
              </div>
            ) : filteredLog.length === 0 ? (
              <div className="text-center py-12">
                <svg className="w-16 h-16 mx-auto mb-4 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="text-slate-500">No errors logged</p>
                <p className="text-slate-600 text-sm mt-1">Great! Your users aren't experiencing any errors</p>
              </div>
            ) : (
              filteredLog.map(entry => (
                <div
                  key={entry.id}
                  className="flex items-start gap-3 p-4 rounded-lg bg-slate-800/20 border border-slate-700/30 hover:border-red-500/30 transition-all"
                >
                  {getErrorIcon(entry.error_type)}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs px-2 py-1 rounded bg-red-500/20 text-red-400 font-semibold border border-red-500/30">
                            {entry.error_type.toUpperCase()}
                          </span>
                          {entry.investor_name && (
                            <span className="text-xs text-slate-400">
                              User: <span className="text-blue-400">{entry.investor_name}</span>
                              {entry.investor_email && <span className="text-slate-600"> ({entry.investor_email})</span>}
                            </span>
                          )}
                        </div>
                        <p className="text-sm font-semibold text-slate-200 break-words">
                          {entry.error_message}
                        </p>
                        {entry.page_url && (
                          <p className="text-xs text-slate-500 mt-1 break-all">
                            Page: {entry.page_url}
                          </p>
                        )}
                        {entry.error_stack && (
                          <details className="mt-2">
                            <summary className="text-xs text-slate-400 cursor-pointer hover:text-slate-300">
                              View stack trace
                            </summary>
                            <pre className="text-xs text-slate-500 mt-2 bg-slate-900/50 p-2 rounded overflow-x-auto">
                              {entry.error_stack}
                            </pre>
                          </details>
                        )}
                        <div className="flex items-center gap-2 mt-2">
                          <span className="text-xs px-2 py-1 rounded bg-purple-500/20 text-purple-400 font-mono border border-purple-500/30">
                            IP: {entry.ip_address || 'Unknown'}
                          </span>
                        </div>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className="text-xs text-slate-400">
                          {new Date(entry.timestamp).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
