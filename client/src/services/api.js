const API_BASE = '/api';

// Helper for standard HTTP request with JWT
async function request(endpoint, options = {}) {
  const token = localStorage.getItem('voiceauth_token');
  
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers
  };

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const error = new Error(data.message || `Request failed with status ${response.status}`);
    error.status = response.status;
    error.data = data;
    throw error;
  }

  return data;
}

export const api = {
  // Auth
  register: (body) => request('/auth/register', { method: 'POST', body: JSON.stringify(body) }),
  login: (body) => request('/auth/login', { method: 'POST', body: JSON.stringify(body) }),
  voiceLogin: (body) => request('/auth/voice-login', { method: 'POST', body: JSON.stringify(body) }),
  getMe: () => request('/auth/me'),
  getPhraseHint: (email) => request(`/auth/phrase-hint?email=${encodeURIComponent(email)}`),
  updateVoiceProfile: (body) => request('/auth/update-voice-profile', { method: 'PUT', body: JSON.stringify(body) }),

  // Voice Controller & Operations
  executeCommand: (body) => request('/controller/execute-command', { method: 'POST', body: JSON.stringify(body) }),
  getStatus: () => request('/controller/status'),
  getLogs: () => request('/controller/logs'),
  getHealth: () => request('/health')
};
