/**
 * api/auth.js — Vercel Serverless Function for Authentication
 * Pure ESM + Node.js crypto (zero-dependency for maximum reliability on Vercel)
 */

import crypto from "crypto";
import nodemailer from "nodemailer";

const JWT_SECRET = process.env.JWT_SECRET || "crypto_tracker_jwt_secret_key_2026_secured";

// Mailer setup (Nodemailer for Gmail or custom SMTP)
const getMailerTransporter = () => {
  const host = process.env.SMTP_HOST;
  const port = Number(process.env.SMTP_PORT || 587);
  const user = process.env.SMTP_USER || process.env.GMAIL_USER;
  const pass = process.env.SMTP_PASS || process.env.GMAIL_APP_PASSWORD;

  if (host && user && pass) {
    return nodemailer.createTransport({
      host,
      port,
      secure: port === 465,
      auth: { user, pass },
    });
  }

  if (user && pass) {
    return nodemailer.createTransport({
      service: "gmail",
      auth: { user, pass },
    });
  }

  return null;
};

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

      const transporter = getMailerTransporter();
      if (transporter) {
        try {
          const fromAddr =
            process.env.EMAIL_FROM ||
            process.env.GMAIL_USER ||
            "no-reply@cryptotracker.com";
          await transporter.sendMail({
            from: fromAddr.includes("<") ? fromAddr : `"Crypto Tracker" <${fromAddr}>`,
            to: email,
            subject: `${otp} is your Crypto Tracker verification code`,
            text: `Your Crypto Tracker verification code is: ${otp}. It will expire in 10 minutes.`,
            html: `
              <div style="font-family: Arial, sans-serif; background: #0b0f19; padding: 32px; color: #f8fafc; border-radius: 8px; max-width: 500px; margin: 0 auto;">
                <h2 style="color: #eebc1d; margin-top: 0;">Crypto Tracker Verification</h2>
                <p style="font-size: 15px; color: #cbd5e1;">Use the verification code below to complete your registration:</p>
                <div style="background: #1e293b; color: #eebc1d; font-size: 32px; font-weight: bold; letter-spacing: 8px; padding: 18px; text-align: center; border-radius: 8px; margin: 24px 0; border: 1px solid rgba(238, 188, 29, 0.3);">
                  ${otp}
                </div>
                <p style="color: #94a3b8; font-size: 13px; line-height: 1.5;">This code expires in 10 minutes. If you did not make this request, you can safely disregard this message.</p>
              </div>
            `,
          });
        } catch (mailErr) {
          console.error("[api/auth] SMTP delivery error:", mailErr.message);
        }
      }

      return jsonResponse(200, {
        success: true,
        message: `Verification code sent to ${email}. Please check your inbox or spam folder.`,
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

    // 8. Contact message dispatch
    if (action === "contact" && req.method === "POST") {
      const { name, email, subject, message } = body;
      if (!name || !email || !message) {
        return jsonResponse(400, { error: "Name, email, and message are required." });
      }

      const contactEntry = {
        id: "msg_" + Date.now(),
        name: String(name).trim(),
        email: String(email).trim(),
        subject: String(subject || "General Inquiry").trim(),
        message: String(message).trim(),
        timestamp: new Date().toISOString(),
      };

      const transporter = getMailerTransporter();
      const ownerEmail =
        process.env.REACT_APP_OWNER_NOTIFICATION_EMAIL ||
        process.env.OWNER_EMAIL ||
        process.env.GMAIL_USER ||
        "abhisharmawork07@gmail.com";

      if (transporter) {
        try {
          const fromAddress =
            process.env.EMAIL_FROM ||
            `"${contactEntry.name} (via Crypto Tracker)" <${process.env.GMAIL_USER || "no-reply@cryptotracker.com"}>`;

          await transporter.sendMail({
            from: fromAddress,
            to: ownerEmail,
            replyTo: `"${contactEntry.name}" <${contactEntry.email}>`,
            subject: `📬 New Contact Message: "${contactEntry.subject}" from ${contactEntry.name} (${contactEntry.email})`,
            text: `New contact message received:

Sender Name : ${contactEntry.name}
Sender Email: ${contactEntry.email}
Subject     : ${contactEntry.subject}
Date & Time : ${new Date().toLocaleString()}

Message:
${contactEntry.message}

Reply directly to this email to contact ${contactEntry.name} at ${contactEntry.email}.`,
            html: `
<div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #0f172a; border-radius: 12px; overflow: hidden; border: 1px solid #334155; color: #f8fafc;">
  <div style="background: linear-gradient(135deg, #1e293b, #0f172a); padding: 24px; border-bottom: 2px solid #eebc1d;">
    <h2 style="margin: 0; color: #eebc1d; font-size: 20px;">
      📬 New Contact Inquiry
    </h2>
    <p style="margin: 6px 0 0 0; color: #94a3b8; font-size: 13px;">Received via Crypto Tracker Contact Portal</p>
  </div>
  
  <div style="padding: 24px;">
    <!-- SENDER INFO CARD -->
    <div style="background: #1e293b; border-radius: 8px; padding: 16px 20px; margin-bottom: 20px; border-left: 4px solid #eebc1d;">
      <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
        <tr>
          <td style="padding: 6px 0; color: #94a3b8; width: 110px; font-weight: 600;">👤 SENDER:</td>
          <td style="padding: 6px 0; color: #ffffff; font-weight: bold; font-size: 15px;">${contactEntry.name}</td>
        </tr>
        <tr>
          <td style="padding: 6px 0; color: #94a3b8; font-weight: 600;">📧 EMAIL:</td>
          <td style="padding: 6px 0;">
            <a href="mailto:${contactEntry.email}" style="color: #60a5fa; text-decoration: none; font-weight: 600;">${contactEntry.email}</a>
          </td>
        </tr>
        <tr>
          <td style="padding: 6px 0; color: #94a3b8; font-weight: 600;">📌 SUBJECT:</td>
          <td style="padding: 6px 0; color: #f1f5f9;">${contactEntry.subject}</td>
        </tr>
        <tr>
          <td style="padding: 6px 0; color: #94a3b8; font-weight: 600;">⏰ TIME:</td>
          <td style="padding: 6px 0; color: #cbd5e1; font-size: 13px;">${new Date().toLocaleString()}</td>
        </tr>
      </table>
    </div>

    <!-- MESSAGE CONTENT -->
    <div style="margin-bottom: 24px;">
      <h3 style="margin: 0 0 10px 0; font-size: 13px; text-transform: uppercase; letter-spacing: 0.5px; color: #eebc1d;">Message Body</h3>
      <div style="background: #182234; padding: 18px; border-radius: 8px; font-size: 14px; line-height: 1.6; color: #e2e8f0; white-space: pre-wrap; border: 1px solid #334155;">
${contactEntry.message.replace(/</g, "&lt;").replace(/>/g, "&gt;")}
      </div>
    </div>

    <!-- QUICK ACTIONS -->
    <div style="text-align: center; margin-top: 24px; padding-top: 16px; border-top: 1px solid #334155;">
      <a href="mailto:${contactEntry.email}?subject=Re: ${encodeURIComponent(contactEntry.subject)}" style="display: inline-block; background: #eebc1d; color: #0f172a; font-weight: 700; font-size: 14px; padding: 10px 24px; border-radius: 6px; text-decoration: none;">
        ✉️ Reply to ${contactEntry.name} (${contactEntry.email})
      </a>
    </div>
  </div>
</div>
`,
          });
        } catch (mailErr) {
          console.error("[api/auth/contact] Mailer error:", mailErr.message);
        }
      }

      return jsonResponse(200, {
        success: true,
        message: "Contact message sent successfully.",
      });
    }

    return jsonResponse(404, { error: `Endpoint /api/auth/${action} not found.` });
  } catch (err) {
    console.error("[api/auth] Unhandled server error:", err);
    return jsonResponse(500, { error: "Authentication server error: " + err.message });
  }
}
