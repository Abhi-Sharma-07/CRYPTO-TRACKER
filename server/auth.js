"use strict";

const fs = require("fs");
const path = require("path");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const nodemailer = require("nodemailer");

const DATA_DIR = path.join(__dirname, "data");
const USERS_FILE = path.join(DATA_DIR, "users.json");

// Ensure data folder and users file exist
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}
if (!fs.existsSync(USERS_FILE)) {
  fs.writeFileSync(USERS_FILE, JSON.stringify([], null, 2), "utf8");
}

const JWT_SECRET = process.env.JWT_SECRET || "crypto_tracker_jwt_secret_key_2026_secured";
const OTP_EXPIRY_MS = 10 * 60 * 1000; // 10 minutes

// In-memory OTP storage: email -> { code, expiresAt, attempts, verified }
const otpStore = new Map();

// Helper to load users
const loadUsers = () => {
  try {
    const raw = fs.readFileSync(USERS_FILE, "utf8");
    return JSON.parse(raw) || [];
  } catch (err) {
    console.error("[auth] Failed to read users.json:", err.message);
    return [];
  }
};

// Helper to save users
const saveUsers = (users) => {
  try {
    fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2), "utf8");
  } catch (err) {
    console.error("[auth] Failed to write users.json:", err.message);
  }
};

// Mailer setup (Nodemailer with Gmail or custom SMTP)
const getMailerTransporter = () => {
  const host = process.env.SMTP_HOST;
  const port = Number(process.env.SMTP_PORT || 587);
  const user =
    process.env.SMTP_USER ||
    process.env.GMAIL_USER ||
    process.env.EMAIL_USER;
  const pass =
    process.env.SMTP_PASS ||
    process.env.GMAIL_APP_PASSWORD ||
    process.env.EMAIL_PASS;

  if (host && user && pass) {
    return nodemailer.createTransport({
      host,
      port,
      secure: port === 465,
      auth: { user, pass },
      tls: {
        rejectUnauthorized: false,
      },
    });
  } else if (user && pass) {
    return nodemailer.createTransport({
      service: "gmail",
      auth: { user, pass },
    });
  }
  return null;
};

// Generate 6-digit OTP
const generateOtp = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// Send OTP to email
const sendOtpEmail = async (email, otp) => {
  const transporter = getMailerTransporter();
  const fromAddress =
    process.env.EMAIL_FROM ||
    process.env.SMTP_USER ||
    process.env.GMAIL_USER ||
    "Crypto Tracker <no-reply@cryptotracker.com>";

  const htmlContent = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Verification Code</title>
</head>
<body style="margin: 0; padding: 0; background-color: #0b0d13; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; -webkit-font-smoothing: antialiased;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color: #0b0d13; padding: 48px 12px;">
    <tr>
      <td align="center">
        <!-- Main Card -->
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="max-width: 480px; background-color: #141721; border-radius: 12px; border: 1px solid #232735; overflow: hidden; box-shadow: 0 12px 36px rgba(0, 0, 0, 0.45);">
          
          <!-- Top Accent Line -->
          <tr>
            <td style="height: 3px; background-color: #EEBC1D; line-height: 3px; font-size: 0;">&nbsp;</td>
          </tr>

          <!-- Header (Brand text only, no logo) -->
          <tr>
            <td style="padding: 32px 36px 20px; border-bottom: 1px solid #1f2330;">
              <span style="font-size: 13px; font-weight: 700; color: #EEBC1D; letter-spacing: 2px; text-transform: uppercase;">
                Crypto Tracker
              </span>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding: 32px 36px 28px;">
              <h1 style="margin: 0 0 16px; font-size: 22px; font-weight: 600; color: #ffffff; letter-spacing: -0.2px;">
                Verification code
              </h1>

              <p style="margin: 0 0 24px; font-size: 14px; line-height: 1.6; color: #94a3b8;">
                Please use the following single-use verification code to complete your signup request. This code will expire in <strong style="color: #ffffff;">10 minutes</strong>.
              </p>

              <!-- Clean Monospace Code Display -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin: 28px 0;">
                <tr>
                  <td align="center">
                    <div style="background-color: #0c0e14; border: 1px solid #2d3345; border-radius: 8px; padding: 18px 24px; display: inline-block;">
                      <span style="font-family: ui-monospace, 'SF Mono', Menlo, Consolas, Monaco, 'Courier New', monospace; font-size: 34px; font-weight: 700; letter-spacing: 8px; color: #EEBC1D; text-indent: 8px; display: inline-block;">${otp}</span>
                    </div>
                  </td>
                </tr>
              </table>

              <p style="margin: 0 0 24px; font-size: 13px; line-height: 1.5; color: #64748b; text-align: center;">
                If you didn't request this code, you can safely ignore this email. Someone may have entered your email by mistake.
              </p>

              <!-- Security Callout -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color: #10121a; border-radius: 6px; border: 1px solid #1e2230;">
                <tr>
                  <td style="padding: 12px 16px;">
                    <p style="margin: 0; font-size: 12px; line-height: 1.5; color: #64748b;">
                      <strong style="color: #94a3b8;">Security Note:</strong> Crypto Tracker will never ask for your password or verification code outside of our official website.
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 20px 36px 28px; border-top: 1px solid #1f2330;">
              <p style="margin: 0 0 6px; font-size: 11px; line-height: 1.5; color: #475569;">
                This email was sent to <span style="color: #64748b;">${email}</span>.
              </p>
              <p style="margin: 0; font-size: 11px; color: #334155;">
                Crypto Tracker Platform &bull; Automated Security Service
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `;

  if (transporter) {
    try {
      const info = await transporter.sendMail({
        from: fromAddress.includes("<") ? fromAddress : `"Crypto Tracker" <${fromAddress}>`,
        to: email,
        subject: `${otp} is your Crypto Tracker verification code`,
        text: `Your Crypto Tracker verification code is: ${otp}. It will expire in 10 minutes.`,
        html: htmlContent,
      });
      console.log(`[nodemailer] ✅ OTP email delivered to ${email} (messageId: ${info.messageId})`);
      return { sentViaSmtp: true };
    } catch (err) {
      console.error(`[nodemailer] ❌ SMTP sending failed to ${email}:`, err.message);
      return { sentViaSmtp: false, error: err.message };
    }
  }

  // If no credentials in .env yet
  console.warn(`[nodemailer] ⚠️ GMAIL_USER or GMAIL_APP_PASSWORD is not set in .env.`);
  console.warn(`[nodemailer] To deliver real emails, add GMAIL_USER and GMAIL_APP_PASSWORD to .env.`);
  console.log(`\n=================================================`);
  console.log(`🔐 [AUTH OTP PREVIEW]`);
  console.log(`   To: ${email}`);
  console.log(`   Code: ${otp}`);
  console.log(`   Expires in: 10 minutes`);
  console.log(`=================================================\n`);
  return { sentViaSmtp: false, noCredentials: true };
};

// Route handlers
const handleAuthRoute = async (req, res, urlPath, body, sendJson) => {
  const normalizedEmail = (email) => String(email || "").trim().toLowerCase();

  // 1. Send OTP
  if (req.method === "POST" && urlPath === "/api/auth/send-otp") {
    const email = normalizedEmail(body.email);
    if (!email || !email.includes("@")) {
      return sendJson(req, res, 400, { error: "A valid email address is required." });
    }

    const users = loadUsers();
    if (users.some((u) => u.email === email)) {
      return sendJson(req, res, 400, {
        error: "An account with this email already exists. Please log in.",
      });
    }

    const otp = generateOtp();
    otpStore.set(email, {
      code: otp,
      expiresAt: Date.now() + OTP_EXPIRY_MS,
      attempts: 0,
      verified: false,
    });

    await sendOtpEmail(email, otp);

    return sendJson(req, res, 200, {
      success: true,
      message: `Verification code sent to ${email}. Please check your inbox or spam folder.`,
    });
  }

  // 2. Verify OTP
  if (req.method === "POST" && urlPath === "/api/auth/verify-otp") {
    const email = normalizedEmail(body.email);
    const code = String(body.otp || "").trim();

    if (!email || !code) {
      return sendJson(req, res, 400, { error: "Email and OTP code are required." });
    }

    const record = otpStore.get(email);
    if (!record) {
      return sendJson(req, res, 400, {
        error: "No pending verification code found. Please request a new code.",
      });
    }

    if (Date.now() > record.expiresAt) {
      otpStore.delete(email);
      return sendJson(req, res, 400, {
        error: "Verification code has expired. Please request a new one.",
      });
    }

    record.attempts += 1;
    if (record.attempts > 5) {
      otpStore.delete(email);
      return sendJson(req, res, 400, {
        error: "Too many invalid attempts. Please request a new code.",
      });
    }

    if (record.code !== code) {
      return sendJson(req, res, 400, { error: "Invalid verification code." });
    }

    record.verified = true;
    return sendJson(req, res, 200, {
      success: true,
      message: "Email verified successfully!",
    });
  }

  // 3. Complete Signup (with password)
  if (req.method === "POST" && urlPath === "/api/auth/signup") {
    const email = normalizedEmail(body.email);
    const password = String(body.password || "");
    const otp = String(body.otp || "").trim();

    if (!email || !email.includes("@")) {
      return sendJson(req, res, 400, { error: "A valid email is required." });
    }
    if (!password || password.length < 6) {
      return sendJson(req, res, 400, { error: "Password must be at least 6 characters." });
    }

    const record = otpStore.get(email);
    if (!record || (!record.verified && record.code !== otp)) {
      return sendJson(req, res, 400, {
        error: "Please verify your email with the OTP code first.",
      });
    }

    const users = loadUsers();
    if (users.some((u) => u.email === email)) {
      return sendJson(req, res, 400, { error: "User already exists. Please log in." });
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const newUser = {
      id: "usr_" + Date.now() + "_" + Math.random().toString(36).substr(2, 6),
      uid: "usr_" + Date.now(),
      email,
      passwordHash,
      createdAt: new Date().toISOString(),
      signupDate: new Date().toISOString(),
      watchlist: [],
    };

    users.push(newUser);
    saveUsers(users);
    otpStore.delete(email);

    const token = jwt.sign(
      { id: newUser.id, uid: newUser.uid, email: newUser.email },
      JWT_SECRET,
      { expiresIn: "7d" }
    );

    return sendJson(req, res, 201, {
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
  if (req.method === "POST" && urlPath === "/api/auth/login") {
    const email = normalizedEmail(body.email);
    const password = String(body.password || "");

    if (!email || !password) {
      return sendJson(req, res, 400, { error: "Email and password are required." });
    }

    const users = loadUsers();
    const user = users.find((u) => u.email === email);

    if (!user) {
      return sendJson(req, res, 401, { error: "Invalid email or password." });
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      return sendJson(req, res, 401, { error: "Invalid email or password." });
    }

    const token = jwt.sign(
      { id: user.id, uid: user.uid || user.id, email: user.email },
      JWT_SECRET,
      { expiresIn: "7d" }
    );

    return sendJson(req, res, 200, {
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
  if (req.method === "GET" && urlPath === "/api/auth/me") {
    const authHeader = req.headers["authorization"] || "";
    const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7).trim() : null;

    if (!token) {
      return sendJson(req, res, 401, { error: "Authentication token missing." });
    }

    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      const users = loadUsers();
      const user = users.find((u) => u.id === decoded.id || u.email === decoded.email);

      if (!user) {
        return sendJson(req, res, 404, { error: "User not found." });
      }

      return sendJson(req, res, 200, {
        success: true,
        user: {
          id: user.id,
          uid: user.uid || user.id,
          email: user.email,
          createdAt: user.createdAt,
          watchlist: user.watchlist || [],
        },
      });
    } catch (err) {
      return sendJson(req, res, 401, { error: "Token expired or invalid." });
    }
  }

  // 6. Update Watchlist (POST /api/auth/watchlist)
  if (req.method === "POST" && urlPath === "/api/auth/watchlist") {
    const authHeader = req.headers["authorization"] || "";
    const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7).trim() : null;

    if (!token) {
      return sendJson(req, res, 401, { error: "Authentication token missing." });
    }

    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      const users = loadUsers();
      const user = users.find((u) => u.id === decoded.id || u.email === decoded.email);

      if (!user) {
        return sendJson(req, res, 404, { error: "User not found." });
      }

      if (Array.isArray(body.coins)) {
        user.watchlist = body.coins;
        saveUsers(users);
      }

      return sendJson(req, res, 200, {
        success: true,
        watchlist: user.watchlist || [],
      });
    } catch (err) {
      return sendJson(req, res, 401, { error: "Token expired or invalid." });
    }
  }

  // 7. Signups list for admin (GET /api/auth/signups)
  if (req.method === "GET" && urlPath === "/api/auth/signups") {
    const users = loadUsers();
    const signups = users.map((u) => ({
      uid: u.uid || u.id,
      email: u.email,
      signupDate: u.signupDate || u.createdAt,
    }));
    return sendJson(req, res, 200, { success: true, signups });
  }

  // 8. Contact message dispatch (POST /api/auth/contact)
  if (req.method === "POST" && urlPath === "/api/auth/contact") {
    const { name, email, subject, message } = body;
    if (!name || !email || !message) {
      return sendJson(req, res, 400, { error: "Name, email, and message are required." });
    }

    const contactEntry = {
      id: "msg_" + Date.now(),
      name: String(name).trim(),
      email: String(email).trim(),
      subject: String(subject || "General Inquiry").trim(),
      message: String(message).trim(),
      timestamp: new Date().toISOString(),
    };

    // Save to local storage backup so messages are never lost
    try {
      const messagesPath = path.join(DATA_DIR, "contact_messages.json");
      let messages = [];
      if (fs.existsSync(messagesPath)) {
        try {
          messages = JSON.parse(fs.readFileSync(messagesPath, "utf8")) || [];
        } catch {}
      }
      messages.unshift(contactEntry);
      fs.writeFileSync(messagesPath, JSON.stringify(messages, null, 2), "utf8");
    } catch (saveErr) {
      console.warn("[contact] Failed to save contact message to disk:", saveErr.message);
    }

    // Try sending email via Nodemailer
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
        console.log(`[contact] Notification email sent for message from ${contactEntry.name} <${contactEntry.email}>`);
      } catch (mailErr) {
        console.error("[contact] Failed to send email notification:", mailErr.message);
      }
    }

    return sendJson(req, res, 200, {
      success: true,
      message: "Contact message received and sent to administrator.",
    });
  }

  // 9. Contact messages list (GET /api/auth/contact-messages)
  if (req.method === "GET" && urlPath === "/api/auth/contact-messages") {
    const messagesPath = path.join(DATA_DIR, "contact_messages.json");
    let messages = [];
    if (fs.existsSync(messagesPath)) {
      try {
        messages = JSON.parse(fs.readFileSync(messagesPath, "utf8")) || [];
      } catch {}
    }
    return sendJson(req, res, 200, { success: true, messages });
  }

  return false; // Not handled by auth
};

module.exports = {
  handleAuthRoute,
};
