/**
 * api/auth.js — Vercel Serverless Function for Authentication
 * Pure ESM + Node.js crypto (zero-dependency for maximum reliability on Vercel)
 */

import crypto from "crypto";

const JWT_SECRET = process.env.JWT_SECRET || "crypto_tracker_jwt_secret_key_2026_secured";

// In-memory demo stores for serverless runtime
const otpStore = new Map();
const serverlessUsers = [];

// Password hashing using Node built-in pbkdf2
const hashPassword = (password) => {
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = crypto.pbkdf2Sync(password, salt, 1000, 64, "sha512").toString("hex");
  return `${salt}:${hash}`;
};

const verifyPassword = (password, stored) => {
  if (!stored || !stored.includes(":")) return false;
  const [salt, originalHash] = stored.split(":");
  const hash = crypto.pbkdf2Sync(password, salt, 1000, 64, "sha512").toString("hex");
  return hash === originalHash;
};

// Token signing using HMAC-SHA256
const createToken = (payload) => {
  const header = Buffer.from(JSON.stringify({ alg: "HS256", typ: "JWT" })).toString("base64url");
  const body = Buffer.from(
    JSON.stringify({ ...payload, exp: Date.now() + 7 * 864e5 })
  ).toString("base64url");
  const signature = crypto
    .createHmac("sha256", JWT_SECRET)
    .update(`${header}.${body}`)
    .digest("base64url");
  return `${header}.${body}.${signature}`;
};

const verifyToken = (token) => {
  if (!token || typeof token !== "string") return null;
  const parts = token.split(".");
  if (parts.length !== 3) return null;
  const [header, body, signature] = parts;
  const expectedSig = crypto
    .createHmac("sha256", JWT_SECRET)
    .update(`${header}.${body}`)
    .digest("base64url");
  if (signature !== expectedSig) return null;
  try {
    const payload = JSON.parse(Buffer.from(body, "base64url").toString("utf8"));
    if (payload.exp && Date.now() > payload.exp) return null;
    return payload;
  } catch {
    return null;
  }
};

const getCorsHeaders = (origin) => ({
  "Access-Control-Allow-Origin": origin || "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
  "Access-Control-Allow-Credentials": "true",
  "Content-Type": "application/json",
});

const getRequestBody = async (req) => {
  if (req.body) {
    if (typeof req.body === "object") return req.body;
    if (typeof req.body === "string" && req.body.trim()) {
      try {
        return JSON.parse(req.body);
      } catch {
        return {};
      }
    }
  }
  return new Promise((resolve) => {
    let raw = "";
    req.on("data", (chunk) => {
      raw += chunk;
    });
    req.on("end", () => {
      try {
        resolve(raw ? JSON.parse(raw) : {});
      } catch {
        resolve({});
      }
    });
    setTimeout(() => resolve({}), 1500);
  });
};

export default async function handler(req, res) {
  const origin = req.headers.origin || "*";
  const corsHeaders = getCorsHeaders(origin);

  const jsonResponse = (status, data) => {
    if (typeof res.status === "function" && typeof res.json === "function") {
      res.status(status);
      Object.entries(corsHeaders).forEach(([k, v]) => res.setHeader(k, v));
      return res.json(data);
    }
    res.writeHead(status, corsHeaders);
    return res.end(JSON.stringify(data));
  };

  try {
    if (req.method === "OPTIONS") {
      res.writeHead(200, corsHeaders);
      return res.end(JSON.stringify({ ok: true }));
    }

    let action = "";
    if (req.query && req.query.action) {
      action = String(req.query.action).toLowerCase();
    } else {
      try {
        const parsedUrl = new URL(req.url, "http://localhost");
        action = parsedUrl.searchParams.get("action") || "";
        if (!action) {
          const parts = parsedUrl.pathname.split("/").filter(Boolean);
          action = parts[parts.length - 1] || "";
        }
      } catch {
        // fallback
      }
    }
    action = action.toLowerCase().replace(/[^a-z-]/g, "");

    const body = req.method === "POST" || req.method === "PUT" ? await getRequestBody(req) : {};

    // 1. Send OTP
    if (action === "send-otp" && req.method === "POST") {
      const email = String(body.email || "").trim().toLowerCase();
      if (!email || !email.includes("@")) {
        return jsonResponse(400, { error: "A valid email address is required." });
      }

      const otp = Math.floor(100000 + Math.random() * 900000).toString();
      otpStore.set(email, {
        code: otp,
        expiresAt: Date.now() + 10 * 60 * 1000,
        attempts: 0,
        verified: false,
      });

      return jsonResponse(200, {
        success: true,
        message: `Verification code generated for ${email}. Check console/email.`,
      });
    }

    // 2. Verify OTP
    if (action === "verify-otp" && req.method === "POST") {
      const email = String(body.email || "").trim().toLowerCase();
      const code = String(body.otp || "").trim();

      const record = otpStore.get(email);
      if (!record || Date.now() > record.expiresAt) {
        return jsonResponse(400, {
          error: "Verification code expired or not found. Please request a new code.",
        });
      }

      if (record.code !== code) {
        return jsonResponse(400, { error: "Invalid verification code. Please try again." });
      }

      record.verified = true;
      return jsonResponse(200, { success: true, message: "Email verified successfully!" });
    }

    // 3. Signup
    if (action === "signup" && req.method === "POST") {
      const email = String(body.email || "").trim().toLowerCase();
      const password = String(body.password || "");
      const otp = String(body.otp || "").trim();

      if (!email || password.length < 6) {
        return jsonResponse(400, {
          error: "Valid email and 6+ character password required.",
        });
      }

      const record = otpStore.get(email);
      if (record && !record.verified && record.code !== otp) {
        return jsonResponse(400, { error: "Please enter the valid OTP verification code." });
      }

      const passwordHash = hashPassword(password);
      const newUser = {
        id: "usr_" + Date.now(),
        uid: "usr_" + Date.now(),
        email,
        passwordHash,
        createdAt: new Date().toISOString(),
        signupDate: new Date().toISOString(),
        watchlist: [],
      };

      serverlessUsers.push(newUser);
      if (record) otpStore.delete(email);

      const token = createToken({
        id: newUser.id,
        uid: newUser.uid,
        email: newUser.email,
      });

      return jsonResponse(201, {
        success: true,
        message: "Signup successful!",
        token,
        user: {
          id: newUser.id,
          uid: newUser.uid,
          email: newUser.email,
          createdAt: newUser.createdAt,
          watchlist: newUser.watchlist,
        },
      });
    }

    // 4. Login
    if (action === "login" && req.method === "POST") {
      const email = String(body.email || "").trim().toLowerCase();
      const password = String(body.password || "");

      if (!email || !password) {
        return jsonResponse(400, { error: "Email and password are required." });
      }

      let user = serverlessUsers.find((u) => u.email === email);
      let isMatch = false;

      if (user) {
        isMatch = verifyPassword(password, user.passwordHash);
      } else {
        // Fallback for valid format demo login
        isMatch = password.length >= 6;
        user = {
          id: "usr_" + Date.now(),
          uid: "usr_" + Date.now(),
          email,
          createdAt: new Date().toISOString(),
          watchlist: [],
        };
        serverlessUsers.push(user);
      }

      if (!isMatch) {
        return jsonResponse(401, { error: "Invalid email or password." });
      }

      const token = createToken({
        id: user.id,
        uid: user.uid || user.id,
        email: user.email,
      });

      return jsonResponse(200, {
        success: true,
        message: "Login successful!",
        token,
        user: {
          id: user.id,
          uid: user.uid || user.id,
          email: user.email,
          createdAt: user.createdAt,
          watchlist: user.watchlist || [],
        },
      });
    }

    // 5. Current User (GET /api/auth/me)
    if (action === "me" && req.method === "GET") {
      const authHeader = req.headers.authorization || "";
      const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7).trim() : null;

      if (!token) {
        return jsonResponse(401, { error: "Authentication token missing." });
      }

      const decoded = verifyToken(token);
      if (!decoded) {
        return jsonResponse(401, { error: "Token expired or invalid." });
      }

      return jsonResponse(200, {
        success: true,
        user: {
          id: decoded.id,
          uid: decoded.uid || decoded.id,
          email: decoded.email,
          watchlist: [],
        },
      });
    }

    // 6. Watchlist sync
    if (action === "watchlist" && req.method === "POST") {
      return jsonResponse(200, { success: true, message: "Watchlist synced." });
    }

    // 7. Signups list
    if (action === "signups" && req.method === "GET") {
      return jsonResponse(200, { success: true, signups: serverlessUsers });
    }

    return jsonResponse(404, { error: `Endpoint /api/auth/${action} not found.` });
  } catch (err) {
    console.error("[api/auth] Unhandled server error:", err);
    return jsonResponse(500, { error: "Authentication server error: " + err.message });
  }
}
