import React, { useState } from "react";
import { Box, Button, CircularProgress } from "@material-ui/core";
import { CryptoState } from "../../CryptoContext";
import { sendOtp, signupUser } from "../../services/authApi";
import { sendOwnerNotification } from "../../utils/emailjs";
import { logAuthEvent } from "../../utils/authTraffic";

const inputStyle = {
  width: "100%",
  padding: "13px 16px",
  border: "1px solid rgba(255, 255, 255, 0.14)",
  borderRadius: 10,
  fontSize: "0.95rem",
  color: "#ffffff",
  backgroundColor: "#1e222d",
  outline: "none",
  boxSizing: "border-box",
  transition: "all 0.2s ease-in-out",
};

const labelStyle = {
  display: "block",
  fontSize: "0.78rem",
  fontWeight: "600",
  color: "#a0aec0",
  marginBottom: 6,
  textTransform: "uppercase",
  letterSpacing: "0.04em",
};

const fieldWrap = {
  display: "flex",
  flexDirection: "column",
  width: "100%",
};

const Signup = ({ handleClose }) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [otp, setOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [focusedField, setFocusedField] = useState(null);

  const { setAlert, loginUser } = CryptoState();

  const getFieldStyle = (fieldName) => ({
    ...inputStyle,
    borderColor: focusedField === fieldName ? "#EEBC1D" : "rgba(255, 255, 255, 0.14)",
    boxShadow:
      focusedField === fieldName
        ? "0 0 0 3px rgba(238, 188, 29, 0.2)"
        : "none",
  });

  // Step 1: Send OTP via Nodemailer
  const handleSendOtp = async () => {
    if (!email || !email.includes("@")) {
      setAlert({
        open: true,
        message: "Please enter a valid email address.",
        type: "error",
      });
      return;
    }
    if (!password || password.length < 6) {
      setAlert({
        open: true,
        message: "Password must be at least 6 characters.",
        type: "error",
      });
      return;
    }
    if (password !== confirmPassword) {
      setAlert({
        open: true,
        message: "Passwords do not match.",
        type: "error",
      });
      return;
    }

    setLoading(true);
    try {
      const res = await sendOtp(email);
      setOtpSent(true);
      setAlert({
        open: true,
        message: res.message || `Verification code sent to ${email}`,
        type: "success",
      });
    } catch (err) {
      setAlert({
        open: true,
        message: err.message || "Failed to dispatch verification email.",
        type: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  // Step 2: Submit OTP and Complete Signup
  const handleVerifyAndSignup = async () => {
    if (!otp || otp.trim().length < 6) {
      setAlert({
        open: true,
        message: "Please enter the 6-digit verification code.",
        type: "error",
      });
      return;
    }

    setLoading(true);
    try {
      const res = await signupUser({ email, password, otp: otp.trim() });
      loginUser(res.user, res.token);

      logAuthEvent({
        eventType: "signup",
        provider: "jwt-email-otp",
        userEmail: res.user.email,
        uid: res.user.uid || res.user.id,
      }).catch((e) => console.error("Traffic log failed:", e));

      sendOwnerNotification({
        type: "signup",
        userEmail: res.user.email,
      }).catch((e) => console.error("Owner notification failed:", e));

      setAlert({
        open: true,
        message: `Account activated! Welcome to Crypto Tracker, ${res.user.email}`,
        type: "success",
      });

      if (handleClose) handleClose();
    } catch (err) {
      setAlert({
        open: true,
        message: err.message || "Invalid or expired verification code.",
        type: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 16,
        padding: "24px 28px 28px",
        backgroundColor: "#181a20",
      }}
    >
      {!otpSent ? (
        <>
          {/* Step 1: Account Information */}
          <div style={fieldWrap}>
            <label style={labelStyle} htmlFor="signup-email">
              Email Address
            </label>
            <input
              id="signup-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onFocus={() => setFocusedField("email")}
              onBlur={() => setFocusedField(null)}
              style={getFieldStyle("email")}
              placeholder="name@example.com"
              required
              autoFocus
            />
          </div>

          <div style={fieldWrap}>
            <label style={labelStyle} htmlFor="signup-password">
              Password
            </label>
            <input
              id="signup-password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onFocus={() => setFocusedField("password")}
              onBlur={() => setFocusedField(null)}
              style={getFieldStyle("password")}
              placeholder="At least 6 characters"
              required
            />
          </div>

          <div style={fieldWrap}>
            <label style={labelStyle} htmlFor="signup-confirm">
              Confirm Password
            </label>
            <input
              id="signup-confirm"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              onFocus={() => setFocusedField("confirm")}
              onBlur={() => setFocusedField(null)}
              style={getFieldStyle("confirm")}
              placeholder="Re-enter password"
              required
            />
          </div>

          <Button
            variant="contained"
            size="large"
            disabled={loading}
            onClick={handleSendOtp}
            style={{
              backgroundColor: "#EEBC1D",
              color: "#111",
              fontWeight: 700,
              height: 48,
              borderRadius: 10,
              fontSize: "0.95rem",
              letterSpacing: "0.02em",
              marginTop: 6,
              boxShadow: "0 4px 16px rgba(238, 188, 29, 0.3)",
              textTransform: "none",
            }}
          >
            {loading ? (
              <CircularProgress size={24} style={{ color: "#111" }} />
            ) : (
              "Get Verification Code"
            )}
          </Button>
        </>
      ) : (
        <>
          {/* Step 2: Email Verification */}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              padding: "12px 16px",
              backgroundColor: "rgba(255, 255, 255, 0.04)",
              borderRadius: 10,
              border: "1px solid rgba(255, 255, 255, 0.08)",
            }}
          >
            <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
              <span style={{ fontSize: "0.75rem", color: "#848e9c", textTransform: "uppercase", fontWeight: 600 }}>
                Verification sent to
              </span>
              <span style={{ fontSize: "0.95rem", color: "#ffffff", fontWeight: 600 }}>
                {email}
              </span>
            </div>
            <button
              type="button"
              onClick={() => setOtpSent(false)}
              style={{
                background: "none",
                border: "none",
                color: "#EEBC1D",
                fontSize: "0.85rem",
                fontWeight: 600,
                cursor: "pointer",
                padding: "4px 8px",
              }}
            >
              Edit
            </button>
          </div>

          <div style={fieldWrap}>
            <label style={labelStyle} htmlFor="signup-otp">
              6-Digit Code
            </label>
            <input
              id="signup-otp"
              type="text"
              value={otp}
              onChange={(e) =>
                setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))
              }
              onFocus={() => setFocusedField("otp")}
              onBlur={() => setFocusedField(null)}
              style={{
                ...getFieldStyle("otp"),
                letterSpacing: "10px",
                textAlign: "center",
                fontWeight: 700,
                fontSize: "1.4rem",
                padding: "12px",
                color: "#EEBC1D",
                backgroundColor: "#161922",
                border: focusedField === "otp" ? "1.5px solid #EEBC1D" : "1.5px solid rgba(238, 188, 29, 0.4)",
              }}
              placeholder="······"
              maxLength={6}
              autoFocus
            />
          </div>

          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: -4 }}>
            <span style={{ fontSize: "0.8rem", color: "#848e9c" }}>
              Check your inbox or spam
            </span>
            <button
              type="button"
              onClick={handleSendOtp}
              disabled={loading}
              style={{
                background: "none",
                border: "none",
                color: "#EEBC1D",
                fontSize: "0.82rem",
                cursor: "pointer",
                padding: 0,
                fontWeight: 600,
                textDecoration: "underline",
              }}
            >
              Resend Code
            </button>
          </div>

          <Button
            variant="contained"
            size="large"
            disabled={loading || otp.length < 6}
            onClick={handleVerifyAndSignup}
            style={{
              backgroundColor: "#EEBC1D",
              color: "#111",
              fontWeight: 700,
              height: 48,
              borderRadius: 10,
              fontSize: "0.95rem",
              letterSpacing: "0.02em",
              marginTop: 6,
              boxShadow: "0 4px 16px rgba(238, 188, 29, 0.3)",
              textTransform: "none",
            }}
          >
            {loading ? (
              <CircularProgress size={24} style={{ color: "#111" }} />
            ) : (
              "Complete Sign Up"
            )}
          </Button>
        </>
      )}
    </Box>
  );
};

export default Signup;
