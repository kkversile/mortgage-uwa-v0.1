declare global {
  interface Window {
    __MORTGAGE_UWA_API__?: string;
  }
}

export const API_BASE_URL =
  (typeof window !== 'undefined' && window.__MORTGAGE_UWA_API__) ||
  'http://localhost:7002/api';
