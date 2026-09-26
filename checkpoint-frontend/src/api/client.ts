import axios from "axios";

export const TOKEN_STORAGE_KEY = "checkpoint_token";

export const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8080",
  headers: {
    "Content-Type": "application/json",
  },
});

// sessionStorage per docs/06-Authentication-and-Security.md section 6:
// token survives the tab session but is cleared when it closes.
apiClient.interceptors.request.use((config) => {
  const token = sessionStorage.getItem(TOKEN_STORAGE_KEY);
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// A 401 means the token is missing/invalid/expired — clear it so the app
// doesn't keep sending a dead token, and let the UI react (AuthContext
// checks storage on mount / route guards redirect to /login).
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      sessionStorage.removeItem(TOKEN_STORAGE_KEY);
    }
    return Promise.reject(error);
  }
);
