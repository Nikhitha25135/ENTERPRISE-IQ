import axios from 'axios';

export const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const ACCESS_KEY = 'eiq_access_token';
const REFRESH_KEY = 'eiq_refresh_token';

export const tokenStore = {
  getAccess: () => localStorage.getItem(ACCESS_KEY),
  getRefresh: () => localStorage.getItem(REFRESH_KEY),
  set: (access, refresh) => {
    localStorage.setItem(ACCESS_KEY, access);
    if (refresh) localStorage.setItem(REFRESH_KEY, refresh);
  },
  clear: () => {
    localStorage.removeItem(ACCESS_KEY);
    localStorage.removeItem(REFRESH_KEY);
  },
};

const api = axios.create({ baseURL: API_BASE_URL });

api.interceptors.request.use((config) => {
  const token = tokenStore.getAccess();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

let refreshPromise = null;

api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config;
    const status = error.response?.status;
    const isAuthRoute = original?.url?.includes('/api/auth/login') || original?.url?.includes('/api/auth/refresh');

    if (status === 401 && !original._retry && !isAuthRoute && tokenStore.getRefresh()) {
      original._retry = true;
      try {
        if (!refreshPromise) {
          refreshPromise = axios
            .post(`${API_BASE_URL}/api/auth/refresh`, { refresh_token: tokenStore.getRefresh() })
            .then((r) => {
              tokenStore.set(r.data.access_token, r.data.refresh_token);
              return r.data.access_token;
            })
            .finally(() => {
              refreshPromise = null;
            });
        }
        const newAccess = await refreshPromise;
        original.headers.Authorization = `Bearer ${newAccess}`;
        return api(original);
      } catch (refreshErr) {
        tokenStore.clear();
        window.location.href = '/login';
        return Promise.reject(refreshErr);
      }
    }
    return Promise.reject(error);
  }
);

function extractErrorMessage(error) {
  const detail = error?.response?.data?.detail;
  if (typeof detail === 'string') return detail;
  if (Array.isArray(detail) && detail[0]?.msg) return detail[0].msg;
  if (error?.message) return error.message;
  return 'Something went wrong. Please try again.';
}

export const apiClient = {
  raw: api,
  err: extractErrorMessage,

  // Auth
  register: (payload) => api.post('/api/auth/register', payload).then((r) => r.data),
  login: (payload) => api.post('/api/auth/login', payload).then((r) => r.data),
  logout: () => api.post('/api/auth/logout').then((r) => r.data),
  forgotPassword: (email) => api.post('/api/auth/forgot-password', { email }).then((r) => r.data),
  resetPassword: (token, new_password) =>
    api.post('/api/auth/reset-password', { token, new_password }).then((r) => r.data),
  me: () => api.get('/api/auth/me').then((r) => r.data),

  // Users
  getProfile: () => api.get('/api/users/me').then((r) => r.data),
  updateProfile: (payload) => api.patch('/api/users/me', payload).then((r) => r.data),
  listUsers: () => api.get('/api/users').then((r) => r.data),
  changeUserRole: (userId, role) =>
    api.patch(`/api/users/${userId}/role`, null, { params: { role } }).then((r) => r.data),

  // Documents
  uploadDocument: (file, workspace_id, onProgress) => {
    const form = new FormData();
    form.append('file', file);
    return api
      .post('/api/documents/upload', form, {
        params: workspace_id ? { workspace_id } : undefined,
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress: onProgress,
      })
      .then((r) => r.data);
  },
  listDocuments: (params) => api.get('/api/documents', { params }).then((r) => r.data),
  getDocument: (id) => api.get(`/api/documents/${id}`).then((r) => r.data),
  renameDocument: (id, file_name) => api.patch(`/api/documents/${id}`, { file_name }).then((r) => r.data),
  deleteDocument: (id) => api.delete(`/api/documents/${id}`).then((r) => r.data),
  downloadUrl: (id) => `${API_BASE_URL}/api/documents/${id}/download`,

  // Chat
  askQuery: (payload) => api.post('/api/chat/query', payload).then((r) => r.data),
  chatHistory: (params) => api.get('/api/chat/history', { params }).then((r) => r.data),

  // System
  health: () => api.get('/api/health').then((r) => r.data),
};

export default apiClient;
