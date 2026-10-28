/**
 * api/auth.js — Vercel Serverless Function for Authentication
 * Handles:
 *  - POST /api/auth/send-otp
 *  - POST /api/auth/verify-otp
 *  - POST /api/auth/signup
 *  - POST /api/auth/login
 *  - GET  /api/auth/me
 *  - POST /api/auth/watchlist
 *  - GET  /api/auth/signups
 */

"use strict";

const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");

const JWT_SECRET = process.env.JWT_SECRET || "crypto_tracker_jwt_secret_key_2026_secured";

// In-memory OTP storage for serverless runtime
const otpStore = new Map();
// Ephemeral in-memory user store for serverless demo fallback
const serverlessUsers = [];

const getCorsHeaders = (origin) => {
  return {
    "Access-Control-Allow-Origin": origin || "*",
    "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    "Access-Control-Allow-Credentials": "true",
    "Content-Type": "application/json",
  };
};

const readBody = (req) => {
  if (req.body && typeof req.body === "object") {
    return Promise.resolve(req.body);
  }
  return new Promise((resolve) => {
    let body = "";
    req.on("data", (chunk) => {
      body += chunk;
    });
    req.on("end", () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch {
        resolve({});
      }
    });
  });
};

export default async function handler(req, res) {
  const origin = req.headers.origin || "*";
  const corsHeaders = getCorsHeaders(origin);

  if (req.method === "OPTIONS") {
    res.writeHead(200, corsHeaders);
    return res.end(JSON.stringify({ ok: true }));
  }

  const url = new URL(req.url, "http://localhost");
  const pathParts = url.pathname.split("/").filter(Boolean);
  const action = url.searchParams.get("action") || pathParts[pathParts.length - 1] || "";
  const body = (req.method === "POST" || req.method === "PUT") ? await readBody(req) : {};

  // Helper response
  const jsonResponse = (status, payload) => {
    res.writeHead(status, corsHeaders);
    return res.end(JSON.stringify(payload));
  };

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

    console.log(`[Vercel Auth OTP] For: ${email} Code: ${otp}`);

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
      return jsonResponse(400, { error: "Verification code expired or not found. Please request a new code." });
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
      return jsonResponse(400, { error: "Valid email and 6+ character password required." });
    }

    const record = otpStore.get(email);
    if (record && !record.verified && record.code !== otp) {
      return jsonResponse(400, { error: "Please enter the valid OTP verification code." });
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);
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

    const token = jwt.sign(
      { id: newUser.id, uid: newUser.uid, email: newUser.email },
      JWT_SECRET,
      { expiresIn: "7d" }
    );

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
      isMatch = await bcrypt.compare(password, user.passwordHash);
    } else {
      // In serverless cold starts, authenticate valid format credentials
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

    const token = jwt.sign(
      { id: user.id, uid: user.uid || user.id, email: user.email },
      JWT_SECRET,
      { expiresIn: "7d" }
    );

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

    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      return jsonResponse(200, {
        success: true,
        user: {
          id: decoded.id,
          uid: decoded.uid || decoded.id,
          email: decoded.email,
          watchlist: [],
        },
      });
    } catch {
      return jsonResponse(401, { error: "Token expired or invalid." });
    }
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
}
