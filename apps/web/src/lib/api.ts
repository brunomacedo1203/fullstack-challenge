import axios from 'axios';
import { useAuthStore } from '../features/auth/store';

const envBaseURL = import.meta.env.VITE_API_BASE_URL;

let baseURL = envBaseURL;

if (!baseURL) {
  if (typeof window !== 'undefined') {
    const protocol = window.location.protocol;
    const hostname = window.location.hostname;
    baseURL = `${protocol}//${hostname}:3001/api`;
  } else {
    baseURL = 'http://localhost:3001/api';
  }
}

if (
  baseURL.includes('api-gateway') &&
  typeof window !== 'undefined' &&
  window.location.hostname !== 'api-gateway'
) {
  const protocol = window.location.protocol;
  const hostname = window.location.hostname;
  baseURL = `${protocol}//${hostname}:3001/api`;
}

export const api = axios.create({ baseURL });

api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().accessToken;
  if (token) {
    config.headers = config.headers ?? {};
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;
