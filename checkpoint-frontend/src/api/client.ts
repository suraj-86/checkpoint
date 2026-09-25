import axios from "axios";

export const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8080",
  headers: {
    "Content-Type": "application/json",
  },
});

// Phase 2 will attach the JWT here once auth exists:
//
// apiClient.interceptors.request.use((config) => {
//   const token = localStorage.getItem("checkpoint_token");
//   if (token) config.headers.Authorization = `Bearer ${token}`;
//   return config;
// });
