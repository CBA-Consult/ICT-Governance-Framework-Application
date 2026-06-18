/**
 * Authenticated fetch helper — resolves token from AuthContext storage and handles 401 refresh.
 */
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || '/api';

export function getStoredAccessToken() {
  try {
    const storedTokens = localStorage.getItem('tokens');
    if (storedTokens) {
      const tokens = JSON.parse(storedTokens);
      if (tokens?.accessToken) return tokens.accessToken;
    }
  } catch {
    // fall through to legacy key
  }
  return localStorage.getItem('token');
}

async function refreshAccessToken() {
  const storedTokens = localStorage.getItem('tokens');
  if (!storedTokens) return null;

  const tokens = JSON.parse(storedTokens);
  if (!tokens?.refreshToken) return null;

  const response = await fetch(`${API_BASE_URL}/auth/refresh`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refreshToken: tokens.refreshToken })
  });

  if (!response.ok) return null;

  const data = await response.json();
  const newTokens = { ...tokens, accessToken: data.accessToken };
  localStorage.setItem('tokens', JSON.stringify(newTokens));
  localStorage.setItem('token', data.accessToken);
  return data.accessToken;
}

export async function authFetch(url, options = {}) {
  let token = getStoredAccessToken();
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
    ...(token ? { Authorization: `Bearer ${token}` } : {})
  };

  let response = await fetch(url, { ...options, headers });

  if (response.status === 401 && token) {
    const refreshed = await refreshAccessToken();
    if (refreshed) {
      response = await fetch(url, {
        ...options,
        headers: { ...headers, Authorization: `Bearer ${refreshed}` }
      });
    }
  }

  return response;
}

export async function parseApiError(response, fallbackMessage) {
  try {
    const body = await response.json();
    return body.error || body.message || fallbackMessage;
  } catch {
    return fallbackMessage;
  }
}
