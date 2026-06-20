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
  const isFormData = typeof FormData !== 'undefined' && options.body instanceof FormData;
  const headers = {
    ...(isFormData ? {} : { 'Content-Type': 'application/json' }),
    ...(options.headers || {}),
    ...(token ? { Authorization: `Bearer ${token}` } : {})
  };

  let response = await fetch(url, { ...options, headers });

  if (response.status === 401 && token) {
    const refreshed = await refreshAccessToken();
    if (refreshed) {
      token = refreshed;
      response = await fetch(url, {
        ...options,
        headers: {
          ...(isFormData ? {} : { 'Content-Type': 'application/json' }),
          ...(options.headers || {}),
          Authorization: `Bearer ${refreshed}`
        }
      });
    }
  }

  return response;
}

export async function parseApiError(response, fallbackMessage) {
  try {
    const text = await response.text();
    const trimmed = (text || '').trim();

    if (trimmed.startsWith('<!DOCTYPE') || trimmed.startsWith('<html')) {
      if (/Cannot GET \/api\//i.test(trimmed)) {
        return 'API route not found — restart the Express API (npm run server) or use npm run dev:full to start both servers.';
      }
      if (/Internal Server Error/i.test(trimmed) || response.status === 502 || response.status === 503) {
        return 'API server unavailable — run npm run dev (starts API + Next) or npm run server in a separate terminal.';
      }
      if (response.status === 404) {
        return `${fallbackMessage} — API returned HTML 404. Start the API server: npm run server (port 4000).`;
      }
    }

    try {
      const body = JSON.parse(trimmed);
      const parts = [body.error || body.message, body.details].filter(Boolean);
      if (parts.length > 0) {
        return parts.join(': ');
      }
    } catch {
      if (trimmed.length > 0 && trimmed.length < 300) {
        return trimmed;
      }
    }
    return `${fallbackMessage} (HTTP ${response.status})`;
  } catch {
    return fallbackMessage;
  }
}
