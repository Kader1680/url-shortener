const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

function getToken() {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('shortly_token');
}

function setToken(token) {
  localStorage.setItem('shortly_token', token);
}

function clearToken() {
  localStorage.removeItem('shortly_token');
}

async function request(path, { method = 'GET', body, auth = false } = {}) {
  const headers = { 'Content-Type': 'application/json' };

  if (auth) {
    const token = getToken();
    if (token) headers.Authorization = `Bearer ${token}`;
  }

  const res = await fetch(`${API_URL}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  const isJson = res.headers.get('content-type')?.includes('application/json');
  const data = isJson ? await res.json() : null;

  if (!res.ok) {
    throw new Error(data?.error || `Request failed with status ${res.status}`);
  }

  return data;
}

export const api = {
  register: (payload) => request('/api/auth/register', { method: 'POST', body: payload }),
  login: (payload) => request('/api/auth/login', { method: 'POST', body: payload }),
  me: () => request('/api/auth/me', { auth: true }),
  shorten: (payload, authed) => request('/api/urls', { method: 'POST', body: payload, auth: authed }),
  listUrls: (page = 1) => request(`/api/urls?page=${page}`, { auth: true }),
  getStats: (id) => request(`/api/urls/${id}/stats`, { auth: true }),
  deleteUrl: (id) => request(`/api/urls/${id}`, { method: 'DELETE', auth: true }),
  toggleUrl: (id, isActive) =>
    request(`/api/urls/${id}`, { method: 'PATCH', body: { isActive }, auth: true }),
};

export { getToken, setToken, clearToken, API_URL };
