import axios from 'axios';

const api = axios.create({ baseURL: '/api' });

// Attach JWT token to every request
api.interceptors.request.use(config => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Handle 401 - clear token and redirect to login
api.interceptors.response.use(
  res => res,
  err => {
    if (err.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/giris';
    }
    return Promise.reject(err);
  }
);

export default api;

// ─── Auth ───────────────────────────────────────────────────────────────────
export const authApi = {
  login: (email: string, password: string) => api.post('/auth/login', { email, password }),
};

// ─── Apartments ──────────────────────────────────────────────────────────────
export const apartmentsApi = {
  getAll: () => api.get('/apartments'),
  update: (id: number, data: object) => api.put(`/apartments/${id}`, data),
  uploadPhoto: (id: number, file: File) => {
    const formData = new FormData();
    formData.append('photo', file);
    return api.post(`/apartments/${id}/photo`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
  }
};

// ─── Aidats ──────────────────────────────────────────────────────────────────
export const aidatsApi = {
  getAll: () => api.get('/aidats'),
  create: (data: { month: number; year: number; amount: number }) => api.post('/aidats', data),
  getPayments: (aidatId: number) => api.get(`/aidats/${aidatId}/payments`),
  updatePayment: (paymentId: number, data: { status: string; note?: string; paid_at?: string }) =>
    api.put(`/aidats/payments/${paymentId}`, data),
  getStats: (aidatId: number) => api.get(`/aidats/${aidatId}/stats`),
};

// ─── Expenses ────────────────────────────────────────────────────────────────
export const expensesApi = {
  getAll: (params?: { type?: string; month?: string; page?: number; limit?: number }) => api.get('/expenses', { params }),
  getSummary: () => api.get('/expenses/summary'),
  create: (formData: FormData) => api.post('/expenses', formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
  delete: (id: number) => api.delete(`/expenses/${id}`),
};

// ─── Meetings ────────────────────────────────────────────────────────────────
export const meetingsApi = {
  getAll: (params?: { year?: string; page?: number }) => api.get('/meetings', { params }),
  create: (data: object) => api.post('/meetings', data),
  update: (id: number, data: object) => api.put(`/meetings/${id}`, data),
  delete: (id: number) => api.delete(`/meetings/${id}`),
};

// ─── Timeline ────────────────────────────────────────────────────────────────
export const timelineApi = {
  getAll: () => api.get('/timeline'),
};
