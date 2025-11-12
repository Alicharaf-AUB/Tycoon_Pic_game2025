import { useState, useEffect } from 'react';
import axios from 'axios';

// Use relative path in production (same domain), localhost in development
const isProduction = window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1';
const API_BASE = import.meta.env.VITE_API_URL || (isProduction ? window.location.origin : 'http://localhost:3001');

export default function AppPasswordGate({ children }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);

  // Check if user is on admin route - admins bypass app password
  const isAdminRoute = window.location.pathname.startsWith('/admin');

  // Check if user is already authenticated
  useEffect(() => {
    const checkAuth = async () => {
      // Admin routes bypass app password protection
      if (isAdminRoute) {
        setIsAuthenticated(true);
        setCheckingAuth(false);
        return;
      }

      const accessToken = sessionStorage.getItem('app_access_token');

      if (accessToken) {
        // Verify token is still valid by making a test request
        try {
          await axios.get(`${API_BASE}/api/game-state`, {
            headers: {
              'x-app-access-token': accessToken
            }
          });
          setIsAuthenticated(true);
        } catch (err) {
          // Token is invalid, clear it
          sessionStorage.removeItem('app_access_token');
        }
      }

      setCheckingAuth(false);
    };

    checkAuth();
  }, [isAdminRoute]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await axios.post(`${API_BASE}/api/verify-app-access`, {
        password
      });

      if (response.data.success) {
        // Store access token
        sessionStorage.setItem('app_access_token', response.data.accessToken);
        setIsAuthenticated(true);
      } else {
        setError('Incorrect password');
      }
    } catch (err) {
      if (err.response?.status === 401) {
        setError('Incorrect password. Please try again.');
      } else {
        setError('Unable to verify password. Please check your connection.');
      }
    } finally {
      setLoading(false);
    }
  };

  // Show loading while checking authentication
  if (checkingAuth) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="spinner w-12 h-12 mx-auto mb-4"></div>
          <p className="text-slate-400">Loading...</p>
        </div>
      </div>
    );
  }

  // Show password gate if not authenticated
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <div className="mb-6">
              <div className="inline-flex w-20 h-20 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 items-center justify-center border-4 border-slate-800 mx-auto shadow-2xl">
                <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
            </div>
            <h1 className="text-4xl font-bold mb-2 text-slate-100">
              iPark Angel Hub
            </h1>
            <p className="text-slate-400 text-lg">Secure Access Required</p>
            <p className="text-slate-500 text-sm mt-2">Please enter the application password to continue</p>
          </div>

          <div className="bg-slate-800/50 backdrop-blur-xl border border-slate-700 rounded-2xl p-8 shadow-2xl">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Application Password
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-900/50 border border-slate-700 rounded-xl text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  placeholder="Enter password"
                  autoFocus
                  disabled={loading}
                />
              </div>

              {error && (
                <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4">
                  <div className="flex items-center gap-3">
                    <svg className="w-5 h-5 text-red-400 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                    <p className="text-sm text-red-400">{error}</p>
                  </div>
                </div>
              )}

              <button
                type="submit"
                disabled={loading || !password}
                className="w-full bg-gradient-to-r from-blue-500 to-purple-600 text-white font-semibold py-4 px-6 rounded-xl hover:from-blue-600 hover:to-purple-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 disabled:transform-none"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <div className="spinner w-5 h-5"></div>
                    Verifying...
                  </span>
                ) : (
                  'Access Application'
                )}
              </button>
            </form>

            <div className="mt-6 pt-6 border-t border-slate-700">
              <div className="flex items-center gap-2 text-slate-500 text-sm">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                </svg>
                <span>Your connection is secure</span>
              </div>
            </div>
          </div>

          <div className="mt-6 text-center text-sm text-slate-600">
            <p>This application is password protected</p>
            <p className="mt-1">Contact your administrator if you don't have access</p>
          </div>
        </div>
      </div>
    );
  }

  // Render children if authenticated
  return children;
}

// Export function to get access token
export function getAppAccessToken() {
  return sessionStorage.getItem('app_access_token');
}
