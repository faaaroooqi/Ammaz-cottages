import axios from "axios";

/**
 * Local development API instance
 * Backend running on: http://localhost:5000
 * All routes prefixed with: /api
 */
const API = axios.create({
  baseURL: window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1"
    ? "http://localhost:5000/api"
    : "/api",
  withCredentials: false,               // JWT in headers, not cookies
  timeout: 10000,                       // prevent hanging requests
});

// 🔐 Attach JWT token automatically
API.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// 🚨 Global auth / error safety
API.interceptors.response.use(
  (response) => response,
  (error) => {
    const isLoginRequest = error.config?.url && error.config.url.includes("/auth/login");
    
    if (error.response?.status === 401 && !isLoginRequest) {
      console.warn("Unauthorized – redirecting to login");

      localStorage.removeItem("token");
      localStorage.removeItem("user");

      // hard redirect avoids broken React state
      window.location.href = "/login";
    }

    return Promise.reject(error);
  }
);

export default API;
