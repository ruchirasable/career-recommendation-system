import axios from 'axios';

const BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

const api = axios.create({
  baseURL: BASE_URL,
  timeout: 60000,
  headers: { 'Content-Type': 'application/json' },
});

// Attach token on every request if present
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('cc_token');
  if (token) config.headers['Authorization'] = `Bearer ${token}`;
  return config;
});

// ─── Auth API ──────────────────────────────────────────────
export const authSignup  = (data)  => api.post('/api/auth/signup', data);
export const authLogin   = (data)  => api.post('/api/auth/login', data);
export const authMe      = ()      => api.get('/api/auth/me');
export const authLogout  = ()      => api.post('/api/auth/logout');
export const authProfile = (data)  => api.put('/api/auth/profile', data);

// ─── Activity tracking ─────────────────────────────────────
export const saveIITActivity     = (data) => api.post('/api/activity/iit', data);
export const saveCollegeActivity = (data) => api.post('/api/activity/college', data);

// ─── College & IIT API ─────────────────────────────────────
export const getIITRecommendation = (rank, score, stream, category) =>
  api.post('/iit-recommendation', {
    rank: rank || null,
    score: score || null,
    stream,
    category: category || 'General',
  });

export const getCollegeRecommendation = (subjects, location, location_type) =>
  api.post('/college-recommendation', { subjects, location, location_type });

export const getSubjects   = () => api.get('/subjects');
export const getLocations  = () => api.get('/locations');
export const getStreams     = () => api.get('/streams');
export const getCategories = () => api.get('/categories');
export const getHealth     = () => api.get('/health');
export const getIITNames   = () => api.get('/iit-names');
export const getIITPrograms = (institute) => api.get('/iit-programs', { params: { institute } });
export const getIITCutoffLookup = (institute, stream, category) =>
  api.post('/iit-cutoff-lookup', { institute, stream, category: category || 'General' });

export default api;
