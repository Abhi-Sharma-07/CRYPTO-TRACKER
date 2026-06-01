/**
 * api/health.js — Vercel Serverless health-check endpoint
 * Responds to GET /api/health
 */

"use strict";

export default function handler(req, res) {
  res.status(200).json({ ok: true, service: "crypto-tracker-api" });
}
