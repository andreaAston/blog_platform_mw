// All network calls go through this one file, so the token header, error handling
// and base URL live in a single place.
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000/api';
const TOKEN_KEY = 'blog_token';

export const tokenStore = {
  get: () => localStorage.getItem(TOKEN_KEY),
  set: (token) => localStorage.setItem(TOKEN_KEY, token),
  clear: () => localStorage.removeItem(TOKEN_KEY),
};

export class ApiError extends Error {
  constructor(status, message, details) {
    super(message);
    this.status = status; // 0 means the request never reached the server
    this.details = details; // [{ field, message }] from validation errors
  }
}

async function request(path, { method = 'GET', body, formData } = {}) {
  const headers = {};
  const token = tokenStore.get();
  if (token) headers.Authorization = `Bearer ${token}`;

  let payload;
  if (formData) {
    payload = formData; // the browser sets the multipart Content-Type for us
  } else if (body !== undefined) {
    headers['Content-Type'] = 'application/json';
    payload = JSON.stringify(body);
  }

  let res;
  try {
    res = await fetch(`${API_URL}${path}`, { method, headers, body: payload });
  } catch {
    throw new ApiError(0, 'Cannot reach the server. Check your connection and try again.');
  }

  if (res.status === 204) return null;
  const data = await res.json().catch(() => null);

  if (!res.ok) {
    // A 401 while holding a token means it expired: tell the app to log out.
    if (res.status === 401 && token && !path.startsWith('/auth/login')) {
      window.dispatchEvent(new Event('auth:expired'));
    }
    throw new ApiError(res.status, data?.error?.message || 'Request failed', data?.error?.details);
  }
  return data;
}

export const api = {
  get: (path) => request(path),
  post: (path, body) => request(path, { method: 'POST', body }),
  put: (path, body) => request(path, { method: 'PUT', body }),
  patch: (path, body) => request(path, { method: 'PATCH', body }),
  del: (path) => request(path, { method: 'DELETE' }),
  uploadCover(file) {
    const formData = new FormData();
    formData.append('image', file);
    return request('/uploads/cover', { method: 'POST', formData });
  },
};
