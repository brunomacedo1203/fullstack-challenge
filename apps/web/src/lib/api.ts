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

// Auto-refresh access token on 401 responses
api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const { response, config } = error ?? {};
    if (!response || response.status !== 401 || !config) {
      throw error;
    }

    const originalRequest = config as any;
    if (originalRequest.__isRetry) {
      // Prevent infinite loops
      useAuthStore.getState().logout();
      throw error;
    }

    const { refreshToken } = useAuthStore.getState();
    if (!refreshToken) {
      useAuthStore.getState().logout();
      throw error;
    }

    try {
      originalRequest.__isRetry = true;
      // Use a plain axios call to avoid interceptor recursion
      const { data } = await axios.post(`${baseURL}/auth/refresh`, { refreshToken });
      useAuthStore.getState().setTokens(data.accessToken, data.refreshToken);

      // Retry original request with new token
      const newToken = useAuthStore.getState().accessToken;
      originalRequest.headers = originalRequest.headers ?? {};
      originalRequest.headers.Authorization = `Bearer ${newToken}`;
      return api.request(originalRequest);
    } catch (e) {
      useAuthStore.getState().logout();
      throw error;
    }
  },
);

export default api;
