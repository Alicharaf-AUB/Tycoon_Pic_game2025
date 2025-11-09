import axios from 'axios';

// Use relative path in production (same domain), localhost in development
const API_BASE = import.meta.env.VITE_API_URL || (import.meta.env.PROD ? '' : 'http://localhost:3001');

// Helper to get full URL for uploaded files
export const getFileUrl = (path) => {
  if (!path) return '';
  if (path.startsWith('http')) return path; // Already a full URL
  const base = import.meta.env.VITE_API_URL || (import.meta.env.PROD ? '' : 'http://localhost:3001');
  return `${base}${path}`;
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
    const { data } = await axios.post(`${API_BASE}/api/join`, { name, email });
    return data;
  },

  // Find existing investor by email
  findInvestor: async (email) => {
    const { data } = await axios.post(`${API_BASE}/api/find-investor`, { email });
    return data;
  },

  // Get game state
  getGameState: async () => {
    const { data } = await axios.get(`${API_BASE}/api/game-state`);
    return data;
  },

  // Get investor
  getInvestor: async (id) => {
    const { data } = await axios.get(`${API_BASE}/api/investors/${id}`);
    return data;
  },

  // Make investment
  invest: async (investorId, startupId, amount) => {
    const { data } = await axios.post(`${API_BASE}/api/invest`, {
      investorId,
      startupId,
      amount,
    });
    return data;
  },

  // Submit investments (finalize choices)
  submit: async (investorId) => {
    const { data } = await axios.post(`${API_BASE}/api/submit`, {
      investorId,
    });
    return data;
  },

  // Submit funds request
  submitFundsRequest: async (investorId, requestedAmount, justification) => {
    const { data } = await axios.post(`${API_BASE}/api/funds-request`, {
      investorId,
      requestedAmount,
      justification,
    });
    return data;
  },

  // Get investor's funds requests
  getFundsRequests: async (investorId) => {
    const { data } = await axios.get(`${API_BASE}/api/investors/${investorId}/funds-requests`);
    return data;
  },
};

// Admin API
export const adminApi = {
  // Create basic auth header
  getAuthHeader: (username, password) => {
    const token = btoa(`${username}:${password}`);
    return { Authorization: `Basic ${token}` };
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

  // Get stats
  getStats: async (username, password) => {
    const { data } = await axios.get(`${API_BASE}/api/admin/stats`, {
      headers: adminApi.getAuthHeader(username, password),
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
};
