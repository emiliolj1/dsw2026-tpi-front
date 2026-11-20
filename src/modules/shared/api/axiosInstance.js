import axios from 'axios';
import { clearSession, getStoredSession, parseSession } from './sessionStorage';

const instance = axios.create({
  baseURL: import.meta.env.VITE_BACKEND_URL || 'http://localhost:5278',
});

instance.interceptors.request.use((config) => {
  if (config.skipAuth) {
    return config;
  }

  const token = parseSession(getStoredSession())?.token;

  if (token && !config.headers.has('Authorization')) {
    config.headers.set('Authorization', `Bearer ${token}`);
  }

  return config;
});

instance.interceptors.response.use(undefined, (error) => {
  if (error.response?.status === 401 && !error.config?.skipAuth) {
    const authorization = error.config?.headers?.get('Authorization');

    if (
      typeof authorization === 'string' &&
      authorization.startsWith('Bearer ')
    ) {
      clearSession(authorization.slice('Bearer '.length));
    }
  }

  return Promise.reject(error);
});

export { instance };
