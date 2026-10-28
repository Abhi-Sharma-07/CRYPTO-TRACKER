import React, { useState } from "react";
import { Box, Button, CircularProgress } from "@material-ui/core";
import { CryptoState } from "../../CryptoContext";
import { loginUserApi } from "../../services/authApi";
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

const Login = ({ handleClose }) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [focusedField, setFocusedField] = useState(null);

  const { setAlert, loginUser } = CryptoState();

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    if (!email || !password) {
      setAlert({
        open: true,
        message: "Please enter both email and password.",
        type: "error",
      });
      return;
    }

    setLoading(true);
    try {
      const result = await loginUserApi({ email, password });
      loginUser(result.user, result.token);

      logAuthEvent({
        eventType: "login",
        provider: "jwt-password",
        userEmail: result.user.email,
        uid: result.user.uid || result.user.id,
      }).catch((err) => console.error("Traffic log error:", err));

      sendOwnerNotification({
        type: "login",
        userEmail: result.user.email,
      }).catch((err) => console.error("Notification error:", err));

      setAlert({
        open: true,
        message: `Welcome back, ${result.user.email}!`,
        type: "success",
      });

      if (handleClose) handleClose();
    } catch (error) {
      setAlert({
        open: true,
        message: error.message || "Invalid email or password.",
        type: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box
      component="form"
      onSubmit={handleSubmit}
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 16,
        padding: "24px 28px 28px",
        backgroundColor: "#181a20",
      }}
    >
      <div style={fieldWrap}>
        <label style={labelStyle} htmlFor="login-email">
          Email Address
        </label>
        <input
          id="login-email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          onFocus={() => setFocusedField("email")}
          onBlur={() => setFocusedField(null)}
          style={{
            ...inputStyle,
            borderColor: focusedField === "email" ? "#EEBC1D" : "rgba(255, 255, 255, 0.14)",
            boxShadow:
              focusedField === "email"
                ? "0 0 0 3px rgba(238, 188, 29, 0.2)"
                : "none",
          }}
          placeholder="name@example.com"
          required
          autoFocus
        />
      </div>

      <div style={fieldWrap}>
        <label style={labelStyle} htmlFor="login-password">
          Password
        </label>
        <input
          id="login-password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          onFocus={() => setFocusedField("password")}
          onBlur={() => setFocusedField(null)}
          style={{
            ...inputStyle,
            borderColor: focusedField === "password" ? "#EEBC1D" : "rgba(255, 255, 255, 0.14)",
            boxShadow:
              focusedField === "password"
                ? "0 0 0 3px rgba(238, 188, 29, 0.2)"
                : "none",
          }}
          placeholder="Enter your password"
          required
        />
      </div>

      <Button
        type="submit"
        variant="contained"
        size="large"
        disabled={loading}
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
          "Log In"
        )}
      </Button>
    </Box>
  );
};

export default Login;
