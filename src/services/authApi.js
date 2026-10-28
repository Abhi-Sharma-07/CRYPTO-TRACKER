// src/services/authApi.js
// Client API service for JWT + Email OTP authentication

const getApiBase = () => {
  if (process.env.REACT_APP_AUTH_API_ENDPOINT) {
    return process.env.REACT_APP_AUTH_API_ENDPOINT;
  }
  if (
    typeof window !== "undefined" &&
    (window.location.hostname === "localhost" ||
      window.location.hostname === "127.0.0.1")
  ) {
    return "http://localhost:5000";
  }
  return "";
};

const parseJsonResponse = async (response, fallbackErrorMessage = "Request failed.") => {
  const text = await response.text();
  let data = null;

  if (text && text.trim()) {
    try {
      data = JSON.parse(text);
    } catch {
      // Body is not valid JSON (e.g. HTML proxy page or gateway response)
      if (!response.ok) {
        throw new Error(
          `Server returned an error (status ${response.status}). Please try again later.`
        );
      }
      return {};
    }
  }

  if (!response.ok) {
    const errorMsg =
      data?.error ||
      data?.message ||
      `${fallbackErrorMessage} (HTTP ${response.status})`;
    throw new Error(errorMsg);
  }

  return data || {};
};

const TOKEN_KEY = "crypto_jwt_token";
const USER_KEY = "crypto_jwt_user";

// Cookie helpers for cross-session persistence and standard compliance
export const getCookie = (name) => {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(new RegExp("(^|;\\s*)" + name + "=([^;]*)"));
  return match ? decodeURIComponent(match[2]) : null;
};

export const setCookie = (name, value, days = 7) => {
  if (typeof document === "undefined") return;
  const expires = new Date(Date.now() + days * 864e5).toUTCString();
  document.cookie = `${name}=${encodeURIComponent(value)}; expires=${expires}; path=/; SameSite=Lax`;
};

export const deleteCookie = (name) => {
  if (typeof document === "undefined") return;
  document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/; SameSite=Lax`;
};

export const clearAllCookies = () => {
  if (typeof document === "undefined") return;
  const cookies = document.cookie.split(";");
  for (let c of cookies) {
    const eqPos = c.indexOf("=");
    const name = eqPos > -1 ? c.substring(0, eqPos).trim() : c.trim();
    if (name) {
      document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/; SameSite=Lax`;
    }
  }
};

export const getStoredToken = () => {
  return localStorage.getItem(TOKEN_KEY) || getCookie(TOKEN_KEY);
};

export const setStoredAuth = (token, user) => {
  if (token) {
    localStorage.setItem(TOKEN_KEY, token);
    setCookie(TOKEN_KEY, token, 7);
  }
  if (user) {
    const userStr = JSON.stringify(user);
    localStorage.setItem(USER_KEY, userStr);
    setCookie(USER_KEY, userStr, 7);
  }
};

export const clearStoredAuth = () => {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
  deleteCookie(TOKEN_KEY);
  deleteCookie(USER_KEY);
  clearAllCookies();
};

export const getStoredUser = () => {
  try {
    const raw = localStorage.getItem(USER_KEY) || getCookie(USER_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

export const sendOtp = async (email) => {
  const response = await fetch(`${getApiBase()}/api/auth/send-otp`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email }),
  });
  return parseJsonResponse(response, "Failed to send verification code.");
};

export const verifyOtp = async (email, otp) => {
  const response = await fetch(`${getApiBase()}/api/auth/verify-otp`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, otp }),
  });
  return parseJsonResponse(response, "Invalid verification code.");
};

export const signupUser = async ({ email, password, otp }) => {
  const response = await fetch(`${getApiBase()}/api/auth/signup`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password, otp }),
  });
  const data = await parseJsonResponse(response, "Signup failed.");
  if (data.token && data.user) {
    setStoredAuth(data.token, data.user);
  }
  return data;
};

export const loginUserApi = async ({ email, password }) => {
  const response = await fetch(`${getApiBase()}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  const data = await parseJsonResponse(response, "Invalid email or password.");
  if (data.token && data.user) {
    setStoredAuth(data.token, data.user);
  }
  return data;
};

export const fetchCurrentUser = async (token) => {
  const authToken = token || getStoredToken();
  if (!authToken) return null;

  try {
    const response = await fetch(`${getApiBase()}/api/auth/me`, {
      headers: { Authorization: `Bearer ${authToken}` },
    });
    if (!response.ok) {
      clearStoredAuth();
      return null;
    }
    const data = await parseJsonResponse(response, "Failed to fetch user session.");
    if (data.user) {
      setStoredAuth(authToken, data.user);
    }
    return data.user;
  } catch {
    return null;
  }
};

export const saveWatchlistApi = async (coins) => {
  const token = getStoredToken();
  if (!token) return;
  try {
    await fetch(`${getApiBase()}/api/auth/watchlist`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ coins }),
    });
  } catch (err) {
    console.error("Failed to sync watchlist to server:", err);
  }
};
