import axios from 'axios';
import { getDeviceFingerprint } from './deviceFingerprint';

// Use relative path in production (same domain), localhost in development
// Check if we're in production by looking at the hostname
const isProduction = window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1';
const API_BASE = import.meta.env.VITE_API_URL || (isProduction ? window.location.origin : 'http://localhost:3001');

console.log('🔗 API_BASE:', API_BASE);
console.log('🌍 Is Production:', isProduction);

// Helper to get app access token
const getAppAccessToken = () => {
  return sessionStorage.getItem('app_access_token');
};

// Helper to get headers with access token
const getHeaders = () => {
  const token = getAppAccessToken();
  return token ? { 'x-app-access-token': token } : {};
};

// Helper to get full URL for uploaded files
export const getFileUrl = (path) => {
  if (!path) return '';
  if (path.startsWith('http')) return path; // Already a full URL
  const token = getAppAccessToken();
  const url = `${API_BASE}${path}`;
  // Add token as query parameter for file URLs
  return token ? `${url}?token=${token}` : url;
};

// Helper to format currency
export const formatCurrency = (amount) => {
  return new Intl.NumberFormat('en-US', {
    style: 'decimal',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount) + ' €';
};

// Helper to format percentage
export const formatPercentage = (value, total) => {
  if (total === 0) return '0%';
  return ((value / total) * 100).toFixed(1) + '%';
};

// Public API
export const api = {
  // Join as investor
  join: async (name, email) => {
    const { data } = await axios.post(`${API_BASE}/api/join`, { name, email }, { headers: getHeaders() });
    return data;
  },

  // Find existing investor by email and name
  findInvestor: async (email, name) => {
    const { data } = await axios.post(`${API_BASE}/api/find-investor`, { email, name }, { headers: getHeaders() });
    return data;
  },

  // Get game state
  getGameState: async () => {
    const { data } = await axios.get(`${API_BASE}/api/game-state`, { headers: getHeaders() });
    return data;
  },

  // Get investor
  getInvestor: async (id) => {
    const { data } = await axios.get(`${API_BASE}/api/investors/${id}`, { headers: getHeaders() });
    return data;
  },

  // Make investment (with retry on 502)
  invest: async (investorId, startupId, amount, retryCount = 0, onRetry = null) => {
    let deviceFingerprint = null;
    try {
      deviceFingerprint = await getDeviceFingerprint();
    } catch (err) {
      console.warn('Failed to get device fingerprint, continuing without it:', err);
    }
    
    try {
      const { data } = await axios.post(`${API_BASE}/api/invest`, {
        investorId,
        startupId,
        amount,
        deviceFingerprint,
      }, { headers: getHeaders() });
      return data;
    } catch (error) {
      // Retry on 502 (server restart) up to 2 times with exponential backoff
      if (error.response?.status === 502 && retryCount < 2) {
        const delay = (retryCount + 1) * 2000; // 2s, 4s
        const nextRetry = retryCount + 1;
        console.log(`⏳ Server restarting (502), retrying in ${delay/1000}s... (attempt ${nextRetry + 1}/3)`);
        
        // Notify parent component of retry
        if (onRetry) onRetry(nextRetry);
        
        await new Promise(resolve => setTimeout(resolve, delay));
        return api.invest(investorId, startupId, amount, nextRetry, onRetry);
      }
      throw error;
    }
  },

  // Submit investments (finalize choices)
  submit: async (investorId) => {
    const { data } = await axios.post(`${API_BASE}/api/submit`, {
      investorId,
    }, { headers: getHeaders() });
    return data;
  },

  // Submit funds request
  submitFundsRequest: async (investorId, requestedAmount, justification) => {
    const { data } = await axios.post(`${API_BASE}/api/funds-request`, {
      investorId,
      requestedAmount,
      justification,
    }, { headers: getHeaders() });
    return data;
  },

  // Get investor's funds requests
  getFundsRequests: async (investorId) => {
    const { data } = await axios.get(`${API_BASE}/api/investors/${investorId}/funds-requests`, { headers: getHeaders() });
    return data;
  },

  // Log client-side error
  logError: async (errorData) => {
    try {
      const { data } = await axios.post(`${API_BASE}/api/log-error`, errorData, { headers: getHeaders() });
      return data;
    } catch (error) {
      // Silent fail - don't throw if error logging fails
      console.error('Failed to log error:', error);
      return { success: false };
    }
  },
};

// Admin API
export const adminApi = {
  // Create basic auth header combined with app access token
  getAuthHeader: (username, password) => {
    const token = btoa(`${username}:${password}`);
    return {
      Authorization: `Basic ${token}`,
      ...getHeaders()
    };
  },

  // Get all investors
  getInvestors: async (username, password) => {
    const { data } = await axios.get(`${API_BASE}/api/admin/investors`, {
      headers: adminApi.getAuthHeader(username, password),
    });
    return data;
  },

  // Update investor credit
  updateCredit: async (username, password, investorId, startingCredit) => {
    const { data } = await axios.put(
      `${API_BASE}/api/admin/investors/${investorId}/credit`,
      { startingCredit },
      { headers: adminApi.getAuthHeader(username, password) }
    );
    return data;
  },

  // Delete investor
  deleteInvestor: async (username, password, investorId) => {
    const { data } = await axios.delete(
      `${API_BASE}/api/admin/investors/${investorId}`,
      { headers: adminApi.getAuthHeader(username, password) }
    );
    return data;
  },

  // Delete all investors (requires special password)
  deleteAllInvestors: async (username, password, specialPassword) => {
    const { data } = await axios.post(
      `${API_BASE}/api/admin/investors/delete-all`,
      { password: specialPassword },
      { headers: adminApi.getAuthHeader(username, password) }
    );
    return data;
  },

  // Get all startups
  getStartups: async (username, password) => {
    const { data } = await axios.get(`${API_BASE}/api/admin/startups`, {
      headers: adminApi.getAuthHeader(username, password),
    });
    return data;
  },

  // Create startup
  createStartup: async (username, password, startup) => {
    const { data } = await axios.post(
      `${API_BASE}/api/admin/startups`,
      startup,
      { headers: adminApi.getAuthHeader(username, password) }
    );
    return data;
  },

  // Update startup
  updateStartup: async (username, password, startupId, updates) => {
    const { data } = await axios.put(
      `${API_BASE}/api/admin/startups/${startupId}`,
      updates,
      { headers: adminApi.getAuthHeader(username, password) }
    );
    return data;
  },

  // Delete startup
  deleteStartup: async (username, password, startupId) => {
    const { data } = await axios.delete(
      `${API_BASE}/api/admin/startups/${startupId}`,
      { headers: adminApi.getAuthHeader(username, password) }
    );
    return data;
  },

  // Toggle lock
  toggleLock: async (username, password) => {
    const { data } = await axios.post(
      `${API_BASE}/api/admin/toggle-lock`,
      {},
      { headers: adminApi.getAuthHeader(username, password) }
    );
    return data;
  },

    // Get admin statistics
  getStats: async (username, password) => {
    const { data } = await axios.get(`${API_BASE}/api/admin/stats`, {
      headers: adminApi.getAuthHeader(username, password),
    });
    return data;
  },

  // Get admin logs
  getLogs: async (username, password, limit = 100, action = null) => {
    const params = { limit };
    if (action) params.action = action;
    
    const { data } = await axios.get(`${API_BASE}/api/admin/logs`, {
      headers: adminApi.getAuthHeader(username, password),
      params,
    });
    return data;
  },

  // Upload file
  uploadFile: async (username, password, file) => {
    const formData = new FormData();
    formData.append('file', file);

    const { data } = await axios.post(`${API_BASE}/api/admin/upload`, formData, {
      headers: {
        ...adminApi.getAuthHeader(username, password),
        'Content-Type': 'multipart/form-data',
      },
    });
    return data;
  },

  // Get all funds requests
  getFundsRequests: async (username, password, status = null) => {
    const params = status ? { status } : {};
    const { data } = await axios.get(`${API_BASE}/api/admin/funds-requests`, {
      headers: adminApi.getAuthHeader(username, password),
      params,
    });
    return data;
  },

  // Approve funds request
  approveFundsRequest: async (username, password, requestId, adminResponse, reviewedBy) => {
    const { data } = await axios.post(
      `${API_BASE}/api/admin/funds-requests/${requestId}/approve`,
      { adminResponse, reviewedBy },
      { headers: adminApi.getAuthHeader(username, password) }
    );
    return data;
  },

  // Reject funds request
  rejectFundsRequest: async (username, password, requestId, adminResponse, reviewedBy) => {
    const { data } = await axios.post(
      `${API_BASE}/api/admin/funds-requests/${requestId}/reject`,
      { adminResponse, reviewedBy },
      { headers: adminApi.getAuthHeader(username, password) }
    );
    return data;
  },

  // Delete funds request
  deleteFundsRequest: async (username, password, requestId) => {
    const { data } = await axios.delete(
      `${API_BASE}/api/admin/funds-requests/${requestId}`,
      { headers: adminApi.getAuthHeader(username, password) }
    );
    return data;
  },

  // Get error logs
  getErrorLogs: async (username, password, limit = 500) => {
    const { data } = await axios.get(`${API_BASE}/api/admin/error-logs`, {
      headers: adminApi.getAuthHeader(username, password),
      params: { limit },
    });
    return data;
  },
};
