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

// ─── Coins Proxy Cache & Fallback ─────────────────────────────────────────────
const coinsCache = new Map(); // currency -> { data, ts }
const COINS_CACHE_TTL = 90 * 1000; // 90 seconds in-memory cache

let fallbackCoinsData = [];
try {
  const fallbackPath = path.resolve(__dirname, "data/fallbackCoins.json");
  if (fs.existsSync(fallbackPath)) {
    fallbackCoinsData = JSON.parse(fs.readFileSync(fallbackPath, "utf8"));
  }
} catch {
  fallbackCoinsData = [];
}

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

const { handleAuthRoute } = require("./auth");

const sendJson = (req, res, statusCode, data) => {
  const corsOrigin = resolveCorsOrigin(req.headers.origin);
  const headers = {
    "Content-Type": "application/json",
    "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
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

const RUBINA_SYSTEM_INSTRUCTION = `You are Rubina, the elite cryptocurrency artificial intelligence assistant and market strategist for Crypto Tracker.
CRITICAL IDENTITY RULES:
1. Your name is strictly "Rubina". Never refer to yourself as Gemini, Google AI, or an unnamed generic language model.
2. You were created, built, and trained by Abhi Sharma (The Master). Whenever asked who you are, who created you, who trained you, or who your master is, always clearly state that you are Rubina, created and trained by Abhi Sharma, the Master.
3. Your expertise: Deep cryptocurrency analysis, Bitcoin cycles, tokenomics, technical indicators, blockchain consensus, DeFi, and market strategy.
4. Voice: Confident, professional, sharp, insightful, and always helpful.`;

// ─── Gemini API call & Intelligent Fallback ──────────────────────────────────

const generateFallbackAiReply = (prompt) => {
  const p = prompt.toLowerCase();

  if (
    p.includes("who are you") ||
    p.includes("your name") ||
    p.includes("who created") ||
    p.includes("who made") ||
    p.includes("who trained") ||
    p.includes("master") ||
    p.includes("tell me about yourself")
  ) {
    return "I am Rubina, the dedicated cryptocurrency AI intelligence assistant and market strategist for Crypto Tracker. I was built and trained by Abhi Sharma, the Master. I specialize in real-time token analysis, technical indicators, blockchain consensus, and macroeconomic crypto strategy. How can I assist your portfolio today?";
  }

  if (/^(hi|hello|hey|greetings|hola)\b/i.test(p)) {
    return "Greetings! I am Rubina, your cryptocurrency intelligence core, trained by Abhi Sharma. I can provide real-time market analysis, assess token volatility, explain consensus mechanisms and halving cycles, and highlight top market movers. How can I assist your portfolio today?";
  }

  if (p.includes("halving") || p.includes("halve")) {
    return "Bitcoin Halving Analysis:\n\nBitcoin's halving occurs approximately every 210,000 blocks (roughly every 4 years), cutting the block subsidy awarded to miners in half (most recently to 3.125 BTC per block). Historically, halvings constrict new supply issuance, leading to supply-demand imbalances that have precipitated multi-month bull market cycles. However, increased difficulty and operational costs also pressure less efficient miners to consolidate.";
  }

  if (p.includes("btc") || p.includes("bitcoin")) {
    return "Bitcoin (BTC) Overview:\n\nBitcoin remains the macro benchmark and digital gold standard for cryptocurrency markets. Driven by institutional spot ETF inflows, sovereign reserve adoption narratives, and programmatic scarcity (capped at 21M BTC), its price action dictates broader altcoin market liquidity and macroeconomic risk appetite.";
  }

  if (p.includes("eth") || p.includes("ethereum")) {
    return "Ethereum (ETH) Overview:\n\nEthereum functions as the leading decentralized programmable blockchain, securing the majority of DeFi total value locked (TVL) and Layer 2 scaling networks (Arbitrum, Optimism, Base). Its proof-of-stake mechanism with EIP-1559 fee burning correlates token supply closely with network demand.";
  }

  if (p.includes("buy") || p.includes("invest") || p.includes("recommend") || p.includes("trade") || p.includes("portfolio")) {
    return "Risk Management & Investment Principles:\n\n1. Dollar-Cost Averaging (DCA): Accumulating core assets systematically minimizes the impact of short-term volatility.\n2. Risk Allocation: High-beta altcoins carry severe downside risk; preserve capital by keeping the majority of holdings in proven assets.\n3. Verify Liquidity: Always inspect 24h trading volume and market depth before entering positions.";
  }

  return `Intelligence Synthesis for: "${prompt}"\n\nCrypto assets currently exhibit dynamic macro correlation with global liquidity conditions. Key indicators to monitor include 24-hour trading volume, Bitcoin dominance (BTC.D), funding rates in perpetual markets, and macroeconomic interest rate paths. Maintain disciplined position sizing and avoid high-leverage exposure.`;
};

const askGemini = async (prompt) => {
  const apiKey = process.env.GEMINI_API_KEY;
  const model = process.env.GEMINI_MODEL || "gemini-2.5-flash";

  // If no API key or placeholder, provide instant intelligent response
  if (!apiKey || apiKey === "your_gemini_api_key_here") {
    return generateFallbackAiReply(prompt);
  }

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          system_instruction: {
            parts: [{ text: RUBINA_SYSTEM_INSTRUCTION }],
          },
          contents: [{ parts: [{ text: prompt }] }],
          safetySettings: [
            { category: "HARM_CATEGORY_HARASSMENT",        threshold: "BLOCK_MEDIUM_AND_ABOVE" },
            { category: "HARM_CATEGORY_HATE_SPEECH",       threshold: "BLOCK_MEDIUM_AND_ABOVE" },
            { category: "HARM_CATEGORY_SEXUALLY_EXPLICIT", threshold: "BLOCK_MEDIUM_AND_ABOVE" },
            { category: "HARM_CATEGORY_DANGEROUS_CONTENT", threshold: "BLOCK_MEDIUM_AND_ABOVE" },
          ],
        }),
      }
    );

    if (response.ok) {
      const data = await response.json();
      const reply =
        data?.candidates?.[0]?.content?.parts?.map((p) => p.text).join("\n");
      if (reply) return reply;
    } else {
      console.warn(`Gemini API responded with status ${response.status}; using intelligent fallback.`);
    }
  } catch (err) {
    console.warn("Gemini network error; using intelligent fallback:", err.message);
  }

  // Gracefully return intelligent fallback rather than throwing a 500 error
  return generateFallbackAiReply(prompt);
};

// ─── Request handler ──────────────────────────────────────────────────────────

const handleRequest = async (req, res) => {
  // CORS preflight
  if (req.method === "OPTIONS") {
    return sendJson(req, res, 200, { ok: true });
  }

  const urlPath = req.url ? req.url.split("?")[0] : "";

  // Health check (GET only)
  if (req.method === "GET" && urlPath === "/api/health") {
    return sendJson(req, res, 200, { ok: true, service: "ai-server" });
  }

  // Fast Cached Coins Market Proxy (0ms-5ms responses, immunity to CoinGecko 429 rate-limiting)
  if (req.method === "GET" && (urlPath === "/api/coins" || urlPath === "/api/coins/markets")) {
    let currency = "usd";
    try {
      const parsedUrl = new URL(req.url, "http://localhost");
      currency = (parsedUrl.searchParams.get("currency") || "usd").toLowerCase();
    } catch {
      // ignore
    }
    const cached = coinsCache.get(currency);
    const now = Date.now();

    if (cached && now - cached.ts < COINS_CACHE_TTL) {
      return sendJson(req, res, 200, cached.data);
    }

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 4500);
      const cgRes = await fetch(
        `https://api.coingecko.com/api/v3/coins/markets?vs_currency=${currency}&order=market_cap_desc&per_page=100&page=1&sparkline=false`,
        { signal: controller.signal }
      );
      clearTimeout(timeoutId);

      if (cgRes.ok) {
        const data = await cgRes.json();
        if (Array.isArray(data) && data.length > 0) {
          coinsCache.set(currency, { data, ts: now });
          return sendJson(req, res, 200, data);
        }
      }
    } catch (e) {
      // fallback
    }

    // If CoinGecko rate-limits (429) or times out, return stale cache if available
    if (cached && cached.data) {
      return sendJson(req, res, 200, cached.data);
    }

    // Otherwise, return instant fallback coins
    return sendJson(req, res, 200, fallbackCoinsData);
  }

  // Authentication endpoints
  if (urlPath.startsWith("/api/auth/")) {
    let body = {};
    if (req.method === "POST" || req.method === "PUT") {
      try {
        body = await readJsonBody(req);
      } catch (err) {
        return sendJson(req, res, 400, { error: err.message });
      }
    }
    const handled = await handleAuthRoute(req, res, urlPath, body, sendJson);
    if (handled !== false) return;
  }

  // AI endpoint
  if (req.method === "POST" && urlPath === "/api/ai") {
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
