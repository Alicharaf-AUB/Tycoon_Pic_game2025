import { api } from './api';

/**
 * Utility for logging client-side errors to the backend
 */

// Get investor data from localStorage if available
const getInvestorData = () => {
  try {
    const investorId = localStorage.getItem('investor_id');
    const investorName = localStorage.getItem('investor_name');
    const investorEmail = localStorage.getItem('investor_email');

    return {
      investorId: investorId ? parseInt(investorId) : null,
      investorName,
      investorEmail,
    };
  } catch (e) {
    return {
      investorId: null,
      investorName: null,
      investorEmail: null,
    };
  }
};

/**
 * Log an error to the backend
 * @param {Error} error - The error object
 * @param {string} errorType - Type of error (e.g., 'runtime', 'api', 'validation')
 * @param {object} additionalInfo - Additional context information
 */
export const logError = async (error, errorType = 'runtime', additionalInfo = {}) => {
  try {
    const investorData = getInvestorData();

    const errorData = {
      ...investorData,
      errorType,
      errorMessage: error.message || String(error),
      errorStack: error.stack || null,
      pageUrl: window.location.href,
      userAgent: navigator.userAgent,
      ...additionalInfo,
    };

    // Log to console in development
    if (import.meta.env.DEV) {
      console.error('📝 Logging error:', errorData);
    }

    // Send to backend
    await api.logError(errorData);
  } catch (e) {
    // Silent fail - don't let error logging cause more errors
    console.error('Failed to log error:', e);
  }
};

/**
 * Log an API error
 * @param {Error} error - The error object
 * @param {string} endpoint - The API endpoint that failed
 * @param {object} requestData - The request data sent
 */
export const logApiError = async (error, endpoint, requestData = {}) => {
  await logError(error, 'api', {
    endpoint,
    requestData: JSON.stringify(requestData),
  });
};

/**
 * Log a validation error
 * @param {string} message - The validation error message
 * @param {object} formData - The form data that failed validation
 */
export const logValidationError = async (message, formData = {}) => {
  const error = new Error(message);
  await logError(error, 'validation', {
    formData: JSON.stringify(formData),
  });
};

/**
 * Log a 404 error
 * @param {string} path - The path that wasn't found
 */
export const log404Error = async (path) => {
  const error = new Error(`Page not found: ${path}`);
  await logError(error, '404', {
    attemptedPath: path,
  });
};

/**
 * Wrap an async function to automatically log errors
 * @param {Function} fn - The async function to wrap
 * @param {string} errorType - Type of error to log
 */
export const withErrorLogging = (fn, errorType = 'runtime') => {
  return async (...args) => {
    try {
      return await fn(...args);
    } catch (error) {
      await logError(error, errorType);
      throw error; // Re-throw to allow normal error handling
    }
  };
};

// Set up global error handlers
if (typeof window !== 'undefined') {
  // Catch unhandled errors
  window.addEventListener('error', (event) => {
    logError(event.error || new Error(event.message), 'unhandled', {
      filename: event.filename,
      lineno: event.lineno,
      colno: event.colno,
    });
  });

  // Catch unhandled promise rejections
  window.addEventListener('unhandledrejection', (event) => {
    logError(
      event.reason instanceof Error ? event.reason : new Error(String(event.reason)),
      'unhandled_promise'
    );
  });
}
