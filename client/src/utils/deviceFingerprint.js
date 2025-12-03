/**
 * Device Fingerprinting for Vote Integrity
 * Generates a unique fingerprint for each device/browser
 */

export const generateDeviceFingerprint = () => {
  const components = [
    navigator.userAgent,
    navigator.language,
    screen.width,
    screen.height,
    screen.colorDepth,
    new Date().getTimezoneOffset(),
    navigator.hardwareConcurrency || 'unknown',
    navigator.deviceMemory || 'unknown',
    navigator.platform,
  ];

  // Add canvas fingerprint
  try {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    ctx.textBaseline = 'top';
    ctx.font = '14px Arial';
    ctx.fillText('AUB PIC 2025', 2, 2);
    components.push(canvas.toDataURL());
  } catch (e) {
    components.push('canvas-blocked');
  }

  // Create hash
  const fingerprint = components.join('|||');
  return hashString(fingerprint);
};

// Simple hash function
const hashString = (str) => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return Math.abs(hash).toString(36);
};

// Store device fingerprint in localStorage
export const getDeviceFingerprint = () => {
  let fingerprint = localStorage.getItem('device_fingerprint');
  
  if (!fingerprint) {
    fingerprint = generateDeviceFingerprint();
    localStorage.setItem('device_fingerprint', fingerprint);
  }
  
  return fingerprint;
};

// Check if device has already voted for a startup
export const hasDeviceVoted = (startupId) => {
  const votes = JSON.parse(localStorage.getItem('device_votes') || '{}');
  return votes[startupId] === true;
};

// Mark device as voted for a startup
export const markDeviceVoted = (startupId) => {
  const votes = JSON.parse(localStorage.getItem('device_votes') || '{}');
  votes[startupId] = true;
  localStorage.setItem('device_votes', JSON.stringify(votes));
};

// Get all startups this device has voted for
export const getDeviceVotes = () => {
  return JSON.parse(localStorage.getItem('device_votes') || '{}');
};
