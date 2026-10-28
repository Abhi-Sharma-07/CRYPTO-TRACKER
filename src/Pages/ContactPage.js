import React, { useState, useEffect } from "react";
import { Container, Paper, Button, Typography, Box, CircularProgress } from "@material-ui/core";
import { makeStyles } from "@material-ui/core/styles";
import { useTheme } from "../ThemeContext";
import { CryptoState } from "../CryptoContext";
import { getFirebaseErrorMessage } from "../utils/firebaseError";
import { sendContactMessage } from "../utils/emailjs";

const useStyles = makeStyles({
  container: {
    marginTop: 24,
    paddingBottom: 60,
  },
  title: {
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 28,
    fontFamily: "Montserrat, sans-serif",
  },
  formCard: {
    maxWidth: 580,
    margin: "0 auto",
    padding: "36px 32px",
    borderRadius: 16,
    transition: "background-color 0.25s ease, border-color 0.25s ease",
  },
  formGroup: {
    marginBottom: 20,
    display: "flex",
    flexDirection: "column",
  },
  submitButton: {
    backgroundColor: "#EEBC1D",
    color: "#0f172a",
    fontWeight: 700,
    fontSize: "0.95rem",
    letterSpacing: "0.5px",
    padding: "12px 28px",
    borderRadius: 8,
    textTransform: "uppercase",
    marginTop: 8,
    transition: "all 0.2s ease",
    "&:hover": {
      backgroundColor: "#ffd700",
      boxShadow: "0 4px 14px rgba(238, 188, 29, 0.4)",
    },
    fontFamily: "Montserrat, sans-serif",
  },
});

const ContactPage = () => {
  const classes = useStyles();
  const { isDarkMode } = useTheme();
  const { user, setAlert } = CryptoState();
  const [loading, setLoading] = useState(false);
  const [focusedField, setFocusedField] = useState(null);

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    subject: "",
    message: "",
  });

  // Pre-fill sender name and email if the user is logged in
  useEffect(() => {
    if (user && user.email) {
      setFormData((prev) => ({
        ...prev,
        email: prev.email || user.email,
        name:
          prev.name ||
          user.displayName ||
          user.name ||
          (user.email ? user.email.split("@")[0] : ""),
      }));
    }
  }, [user]);

  const contactEmail =
    process.env.REACT_APP_CONTACT_EMAIL || "support@cryptotracker.com";

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.name.trim() || !formData.email.trim() || !formData.subject.trim() || !formData.message.trim()) {
      setAlert({
        open: true,
        message: "Please fill in all fields before sending.",
        type: "error",
      });
      return;
    }

    setLoading(true);
    try {
      await sendContactMessage({
        name: formData.name.trim(),
        email: formData.email.trim(),
        subject: formData.subject.trim(),
        message: formData.message.trim(),
      });

      setAlert({
        open: true,
        message: "Message sent successfully! We will get back to you soon.",
        type: "success",
      });
      setFormData({
        name: "",
        email: "",
        subject: "",
        message: "",
      });
    } catch (error) {
      setAlert({
        open: true,
        message: getFirebaseErrorMessage(error, "Failed to send message. Please try again later."),
        type: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  const getInputStyle = (fieldName) => {
    const isFocused = focusedField === fieldName;
    return {
      width: "100%",
      padding: "12px 14px",
      fontSize: "0.95rem",
      fontFamily: "Montserrat, sans-serif",
      borderRadius: 8,
      border: isFocused
        ? "1.5px solid #EEBC1D"
        : isDarkMode
        ? "1px solid rgba(255, 255, 255, 0.18)"
        : "1px solid #cbd5e1",
      backgroundColor: isDarkMode ? "#131722" : "#ffffff",
      color: isDarkMode ? "#ffffff" : "#0f172a",
      outline: "none",
      boxShadow: isFocused ? "0 0 0 3px rgba(238, 188, 29, 0.22)" : "none",
      transition: "border-color 0.2s ease, box-shadow 0.2s ease, background-color 0.2s ease",
      boxSizing: "border-box",
    };
  };

  const labelStyle = {
    fontWeight: 600,
    fontSize: "0.85rem",
    marginBottom: 6,
    color: isDarkMode ? "#e2e8f0" : "#334155",
    fontFamily: "Montserrat, sans-serif",
    letterSpacing: "0.3px",
  };

  return (
    <Container className={classes.container}>
      <Typography
        variant="h4"
        className={classes.title}
        style={{
          color: isDarkMode ? "#EEBC1D" : "#0f172a",
        }}
      >
        Contact Support
      </Typography>

      <Paper
        elevation={isDarkMode ? 4 : 2}
        className={classes.formCard}
        style={{
          backgroundColor: isDarkMode ? "#1e232d" : "#ffffff",
          border: isDarkMode
            ? "1px solid rgba(255, 255, 255, 0.1)"
            : "1px solid rgba(0, 0, 0, 0.08)",
          boxShadow: isDarkMode
            ? "0 10px 30px rgba(0, 0, 0, 0.5)"
            : "0 8px 24px rgba(15, 23, 42, 0.06)",
        }}
      >
        <form onSubmit={handleSubmit}>
          <Box className={classes.formGroup}>
            <label htmlFor="contact-name" style={labelStyle}>
              Your Name
            </label>
            <input
              id="contact-name"
              name="name"
              type="text"
              autoComplete="name"
              placeholder="Enter your name"
              value={formData.name}
              onChange={handleChange}
              onFocus={() => setFocusedField("name")}
              onBlur={() => setFocusedField(null)}
              style={getInputStyle("name")}
            />
          </Box>

          <Box className={classes.formGroup}>
            <label htmlFor="contact-email" style={labelStyle}>
              Your Email
            </label>
            <input
              id="contact-email"
              name="email"
              type="email"
              autoComplete="email"
              placeholder="name@example.com"
              value={formData.email}
              onChange={handleChange}
              onFocus={() => setFocusedField("email")}
              onBlur={() => setFocusedField(null)}
              style={getInputStyle("email")}
            />
          </Box>

          <Box className={classes.formGroup}>
            <label htmlFor="contact-subject" style={labelStyle}>
              Subject
            </label>
            <input
              id="contact-subject"
              name="subject"
              type="text"
              placeholder="Inquiry or support topic"
              value={formData.subject}
              onChange={handleChange}
              onFocus={() => setFocusedField("subject")}
              onBlur={() => setFocusedField(null)}
              style={getInputStyle("subject")}
            />
          </Box>

          <Box className={classes.formGroup}>
            <label htmlFor="contact-message" style={labelStyle}>
              Message
            </label>
            <textarea
              id="contact-message"
              name="message"
              rows={5}
              placeholder="Write your message here..."
              value={formData.message}
              onChange={handleChange}
              onFocus={() => setFocusedField("message")}
              onBlur={() => setFocusedField(null)}
              style={{
                ...getInputStyle("message"),
                resize: "vertical",
                minHeight: "110px",
              }}
            />
          </Box>

          <Button
            type="submit"
            variant="contained"
            fullWidth
            disabled={loading}
            className={classes.submitButton}
          >
            {loading ? (
              <CircularProgress size={22} style={{ color: "#0f172a" }} />
            ) : (
              "Send Message"
            )}
          </Button>
        </form>

        <Box style={{ marginTop: 36, paddingTop: 20, textAlign: "center", borderTop: isDarkMode ? "1px solid rgba(255,255,255,0.08)" : "1px solid #f1f5f9" }}>
          <Typography
            variant="subtitle2"
            style={{
              color: isDarkMode ? "#94a3b8" : "#64748b",
              marginBottom: 6,
              fontWeight: 600,
              textTransform: "uppercase",
              letterSpacing: "0.5px",
            }}
          >
            Official Support Email
          </Typography>
          <Typography variant="body1">
            <a
              href={`mailto:${contactEmail}`}
              style={{
                color: isDarkMode ? "#EEBC1D" : "#0284c7",
                textDecoration: "none",
                fontWeight: 600,
              }}
            >
              {contactEmail}
            </a>
          </Typography>
        </Box>
      </Paper>
    </Container>
  );
};

export default ContactPage;
