// utils/api.ts
import axios from "axios";

// Base URL'i öncelikle ortam değişkeninden al; prod ortamında her zaman sabit backend endpoint kullanırız.
const getBaseURL = () => {
  if (process.env.NEXT_PUBLIC_API_URL) {
    return process.env.NEXT_PUBLIC_API_URL + "/api";
  }

  // Tarayıcı origin'ine fallback (örn. local geliştirme sırasında)
  if (typeof window !== "undefined" && window.location?.origin) {
    return `${window.location.origin}/api`;
  }

  // Son çare: local backend (development)
  return "http://localhost:5000/api";
};

const api = axios.create({
  baseURL: getBaseURL(),
  withCredentials: true, // eğer cookie göndereceksen
});

// Add request interceptor to include token in all requests
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add response interceptor to handle 401 errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid - clear storage and redirect to login
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      localStorage.removeItem("role");
      // Only redirect if we're not already on the login page
      if (window.location.pathname !== "/login") {
        window.location.href = "/login";
      }
    }
    return Promise.reject(error);
  }
);

export default api;
