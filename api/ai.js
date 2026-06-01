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

// ─── Gemini API call ──────────────────────────────────────────────────────────

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
    console.error(`Gemini API error: ${response.status}`);
    throw new Error(`AI provider returned an error (${response.status}).`);
  }

  const data = await response.json();
  const reply =
    data?.candidates?.[0]?.content?.parts?.map((p) => p.text).join("\n") ||
    "No response received.";

  return reply;
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
