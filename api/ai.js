/**
 * api/ai.js — Vercel Serverless Function (replaces server/ai-server.js)
 *
 * Deployed automatically by Vercel at: /api/ai
 */

"use strict";

// ─── Configuration ─────────────────────────────────────────────────────────────

const MAX_PROMPT_LENGTH = 2_000;
const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_MAX_REQUESTS = 20;

// ─── Rate limiter (in-memory, resets per cold start) ──────────────────────────

const rateLimitStore = new Map();

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

// ─── Prompt safety ────────────────────────────────────────────────────────────

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

// ─── Gemini API call & Intelligent Fallback ──────────────────────────────────

const generateFallbackAiReply = (prompt) => {
  const p = prompt.toLowerCase();

  if (/^(hi|hello|hey|greetings|hola)\b/i.test(p)) {
    return "Greetings! I am Rubina, your generative cryptocurrency intelligence core. I can provide real-time market analysis, assess token volatility, explain consensus mechanisms and halving cycles, and highlight top market movers. How can I assist your portfolio today?";
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
      console.warn(`Gemini API error ${response.status}; using intelligent fallback.`);
    }
  } catch (err) {
    console.warn("Gemini network error; using intelligent fallback:", err.message);
  }

  return generateFallbackAiReply(prompt);
};

// ─── CORS helper ──────────────────────────────────────────────────────────────

const getCorsHeaders = (origin) => {
  const allowedOrigins = (process.env.ALLOWED_ORIGINS || "")
    .split(",")
    .map((o) => o.trim())
    .filter(Boolean);

  let allowOrigin = null;

  if (origin) {
    if (allowedOrigins.includes(origin)) {
      allowOrigin = origin;
    } else if (
      allowedOrigins.length === 0 ||
      origin.startsWith("http://localhost:") ||
      origin.startsWith("http://127.0.0.1:")
    ) {
      allowOrigin = origin;
    }
  }

  return {
    "Access-Control-Allow-Origin": allowOrigin || "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    "X-Content-Type-Options": "nosniff",
    "X-Frame-Options": "DENY",
    "Cache-Control": "no-store",
    ...(allowOrigin ? { Vary: "Origin" } : {}),
  };
};

// ─── Main handler (Vercel serverless) ────────────────────────────────────────

export default async function handler(req, res) {
  const corsHeaders = getCorsHeaders(req.headers.origin);

  // CORS preflight
  if (req.method === "OPTIONS") {
    res.writeHead(200, corsHeaders);
    return res.end();
  }

  // Only accept POST
  if (req.method !== "POST") {
    res.writeHead(405, { ...corsHeaders, "Content-Type": "application/json" });
    return res.end(JSON.stringify({ error: "Method not allowed." }));
  }

  // Rate limit
  const ip = (
    req.headers["x-forwarded-for"] ||
    req.socket?.remoteAddress ||
    "unknown"
  )
    .split(",")[0]
    .trim();

  if (isRateLimited(ip)) {
    res.writeHead(429, { ...corsHeaders, "Content-Type": "application/json" });
    return res.end(
      JSON.stringify({ error: "Too many requests. Please wait a moment and try again." })
    );
  }

  // Parse body (Vercel pre-parses JSON bodies)
  const body = req.body || {};
  const { prompt, provider = "gemini" } = body;
  const cleanedPrompt = String(prompt || "").trim();

  if (!cleanedPrompt) {
    res.writeHead(400, { ...corsHeaders, "Content-Type": "application/json" });
    return res.end(JSON.stringify({ error: "Prompt is required." }));
  }

  if (cleanedPrompt.length > MAX_PROMPT_LENGTH) {
    res.writeHead(400, { ...corsHeaders, "Content-Type": "application/json" });
    return res.end(
      JSON.stringify({ error: `Prompt must be ${MAX_PROMPT_LENGTH} characters or fewer.` })
    );
  }

  if (containsInjection(cleanedPrompt)) {
    res.writeHead(400, { ...corsHeaders, "Content-Type": "application/json" });
    return res.end(JSON.stringify({ error: "Prompt contains disallowed content." }));
  }

  if (String(provider).toLowerCase() !== "gemini") {
    res.writeHead(400, { ...corsHeaders, "Content-Type": "application/json" });
    return res.end(JSON.stringify({ error: "Unsupported provider. Use 'gemini'." }));
  }

  try {
    const reply = await askGemini(cleanedPrompt);
    res.writeHead(200, { ...corsHeaders, "Content-Type": "application/json" });
    return res.end(JSON.stringify({ reply, provider: "gemini" }));
  } catch (err) {
    console.error("[api/ai] Error:", err.message);
    res.writeHead(500, { ...corsHeaders, "Content-Type": "application/json" });
    return res.end(
      JSON.stringify({ error: "The AI service encountered an error. Please try again." })
    );
  }
}
