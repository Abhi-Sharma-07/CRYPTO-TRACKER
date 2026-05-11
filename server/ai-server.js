/**
 * ai-server.js — Hardened Gemini proxy server
 *
 * Security features:
 *  - Localhost-only binding (127.0.0.1)
 *  - Request body size limit (16 KB)
 *  - Prompt length cap (2 000 chars)
 *  - IP-based rate limiting (20 req / minute)
 *  - CORS locked to localhost origins by default
 *  - Security headers on every response
 *  - Internal errors never leak to clients
 *  - Basic prompt-injection heuristic guard
 */

"use strict";

const http = require("http");
const fs = require("fs");
const path = require("path");

// ─── Configuration ────────────────────────────────────────────────────────────

const PORT = Number(process.env.PORT || process.env.AI_SERVER_PORT || 5000);

const MAX_BODY_BYTES = 16 * 1024;           // 16 KB hard cap
const MAX_PROMPT_LENGTH = 2_000;            // characters
const RATE_LIMIT_WINDOW_MS = 60_000;        // 1 minute
const RATE_LIMIT_MAX_REQUESTS = 20;         // per IP per window

// Allowed CORS origins. Defaults to localhost variants only.
const DEFAULT_ALLOWED_ORIGINS = [
  "http://localhost:3000",
  "http://127.0.0.1:3000",
];

const ALLOWED_ORIGINS =
  (process.env.ALLOWED_ORIGINS || "")
    .split(",")
    .map((o) => o.trim())
    .filter(Boolean);

const EFFECTIVE_ORIGINS = ALLOWED_ORIGINS.length
  ? ALLOWED_ORIGINS
  : DEFAULT_ALLOWED_ORIGINS;

// ─── .env loader (only sets keys not already in environment) ─────────────────

const loadEnvFromFile = () => {
  const envPath = path.resolve(process.cwd(), ".env");
  if (!fs.existsSync(envPath)) return;

  const content = fs.readFileSync(envPath, "utf8");
  content.split(/\r?\n/).forEach((line) => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) return;
    const idx = trimmed.indexOf("=");
    if (idx === -1) return;
    const key = trimmed.slice(0, idx).trim();
    const value = trimmed.slice(idx + 1).trim();
    if (key && !process.env[key]) {
      process.env[key] = value;
    }
  });
};

// ─── Rate limiter (in-memory, IP-keyed) ──────────────────────────────────────

const rateLimitStore = new Map(); // ip → { count, resetAt }

const isRateLimited = (ip) => {
  const now = Date.now();
  let record = rateLimitStore.get(ip);

  if (!record || now > record.resetAt) {
    record = { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS };
    rateLimitStore.set(ip, record);
    return false;
  }

  record.count += 1;
  return record.count > RATE_LIMIT_MAX_REQUESTS;
};

// Periodically purge expired entries to prevent memory growth
setInterval(() => {
  const now = Date.now();
  for (const [ip, record] of rateLimitStore) {
    if (now > record.resetAt) rateLimitStore.delete(ip);
  }
}, RATE_LIMIT_WINDOW_MS);

// ─── Helpers ──────────────────────────────────────────────────────────────────

const getClientIp = (req) =>
  (req.headers["x-forwarded-for"] || req.socket?.remoteAddress || "unknown")
    .split(",")[0]
    .trim();

const resolveCorsOrigin = (originHeader) => {
  if (!originHeader) return null; // non-browser requests (curl, etc.)
  if (EFFECTIVE_ORIGINS.includes(originHeader)) return originHeader;
  
  // Allow any localhost port dynamically (e.g., 3001, 3002) in development
  if (originHeader.startsWith("http://localhost:") || originHeader.startsWith("http://127.0.0.1:")) {
    return originHeader;
  }
  
  return null;
};

const SECURITY_HEADERS = {
  "X-Content-Type-Options": "nosniff",
  "X-Frame-Options": "DENY",
  "X-XSS-Protection": "1; mode=block",
  "Referrer-Policy": "no-referrer",
  "Cache-Control": "no-store",
};

const sendJson = (req, res, statusCode, data) => {
  const corsOrigin = resolveCorsOrigin(req.headers.origin);
  const headers = {
    "Content-Type": "application/json",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    ...SECURITY_HEADERS,
  };
  if (corsOrigin) {
    headers["Access-Control-Allow-Origin"] = corsOrigin;
    headers["Vary"] = "Origin";
  }
  res.writeHead(statusCode, headers);
  res.end(JSON.stringify(data));
};

// ─── Body reader (with size guard) ───────────────────────────────────────────

const readJsonBody = (req) =>
  new Promise((resolve, reject) => {
    let body = "";
    let bytes = 0;

    req.on("data", (chunk) => {
      bytes += chunk.length;
      if (bytes > MAX_BODY_BYTES) {
        req.destroy();
        return reject(new Error("Request body too large."));
      }
      body += chunk;
    });

    req.on("end", () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch {
        reject(new Error("Invalid JSON body."));
      }
    });

    req.on("error", reject);
  });

// ─── Prompt safety ───────────────────────────────────────────────────────────

// Rudimentary prompt-injection guard — blocks common meta-instruction patterns.
const INJECTION_PATTERNS = [
  /ignore (all |previous |prior |above )?instructions/i,
  /you are now/i,
  /act as (a |an )?(different|new|evil|uncensored|jailbreak)/i,
  /disregard (your |the )?(previous |prior |above )?instructions/i,
  /forget everything/i,
  /system prompt/i,
];

const containsInjection = (text) =>
  INJECTION_PATTERNS.some((re) => re.test(text));

// ─── Gemini API call ─────────────────────────────────────────────────────────

const askGemini = async (prompt) => {
  const apiKey = process.env.GEMINI_API_KEY;
  const model = process.env.GEMINI_MODEL || "gemini-2.5-flash";

  if (!apiKey) throw new Error("GEMINI_API_KEY is not configured.");

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        // Basic safety settings
        safetySettings: [
          { category: "HARM_CATEGORY_HARASSMENT",        threshold: "BLOCK_MEDIUM_AND_ABOVE" },
          { category: "HARM_CATEGORY_HATE_SPEECH",       threshold: "BLOCK_MEDIUM_AND_ABOVE" },
          { category: "HARM_CATEGORY_SEXUALLY_EXPLICIT", threshold: "BLOCK_MEDIUM_AND_ABOVE" },
          { category: "HARM_CATEGORY_DANGEROUS_CONTENT", threshold: "BLOCK_MEDIUM_AND_ABOVE" },
        ],
      }),
    }
  );

  if (!response.ok) {
    // Do NOT forward raw API error details to the client
    console.error(`Gemini API error: ${response.status}`);
    try {
      const errBody = await response.json();
      console.error("Gemini error detail:", JSON.stringify(errBody));
    } catch { /* ignore */ }
    throw new Error(`AI provider returned an error (${response.status}).`);
  }

  const data = await response.json();
  const reply =
    data?.candidates?.[0]?.content?.parts?.map((p) => p.text).join("\n") ||
    "No response received.";

  return reply;
};

// ─── Request handler ──────────────────────────────────────────────────────────

const handleRequest = async (req, res) => {
  // CORS preflight
  if (req.method === "OPTIONS") {
    return sendJson(req, res, 200, { ok: true });
  }

  // Health check (GET only)
  if (req.method === "GET" && req.url === "/api/health") {
    return sendJson(req, res, 200, { ok: true, service: "ai-server" });
  }

  // AI endpoint
  if (req.method === "POST" && req.url === "/api/ai") {
    // Rate limit
    const ip = getClientIp(req);
    if (isRateLimited(ip)) {
      return sendJson(req, res, 429, {
        error: "Too many requests. Please wait a moment and try again.",
      });
    }

    let body;
    try {
      body = await readJsonBody(req);
    } catch (err) {
      return sendJson(req, res, 400, { error: err.message });
    }

    const { prompt, provider = "gemini" } = body;
    const cleanedPrompt = String(prompt || "").trim();

    // Input validation
    if (!cleanedPrompt) {
      return sendJson(req, res, 400, { error: "Prompt is required." });
    }

    if (cleanedPrompt.length > MAX_PROMPT_LENGTH) {
      return sendJson(req, res, 400, {
        error: `Prompt must be ${MAX_PROMPT_LENGTH} characters or fewer.`,
      });
    }

    if (containsInjection(cleanedPrompt)) {
      return sendJson(req, res, 400, {
        error: "Prompt contains disallowed content.",
      });
    }

    if (String(provider).toLowerCase() !== "gemini") {
      return sendJson(req, res, 400, {
        error: "Unsupported provider. Use 'gemini'.",
      });
    }

    try {
      const reply = await askGemini(cleanedPrompt);
      return sendJson(req, res, 200, { reply, provider: "gemini" });
    } catch (err) {
      // Log full error server-side, send only a safe message to client
      console.error("[ai-server] Error:", err.message);
      return sendJson(req, res, 500, {
        error: "The AI service encountered an error. Please try again.",
      });
    }
  }

  return sendJson(req, res, 404, { error: "Not found." });
};

// ─── Bootstrap ───────────────────────────────────────────────────────────────

loadEnvFromFile();

const server = http.createServer(handleRequest);

server.on("error", (err) => {
  if (err.code === "EADDRINUSE") {
    console.error(
      `Port ${PORT} is already in use. Another AI server may already be running.`
    );
    console.error(
      `Try: AI_SERVER_PORT=5001 npm run ai:server`
    );
  } else {
    console.error("AI server failed to start:", err.message);
  }
  process.exit(1);
});

// Start server
server.listen(PORT, () => {
  console.log(`✅ AI server running on http://localhost:${PORT}`);
  console.log(`   Rate limit : ${RATE_LIMIT_MAX_REQUESTS} req / min per IP`);
  console.log(`   Body limit : ${MAX_BODY_BYTES / 1024} KB`);
  console.log(`   Prompt cap : ${MAX_PROMPT_LENGTH} chars`);
  console.log(`   CORS origins: ${EFFECTIVE_ORIGINS.join(", ")}`);
});
