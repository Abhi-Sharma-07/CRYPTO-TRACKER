import React, { useState } from "react";
import { Container, Paper, TextField, Button, Typography, Box } from "@material-ui/core";
import { makeStyles } from "@material-ui/core/styles";
import { useTheme } from "../ThemeContext";
import { CryptoState } from "../CryptoContext";
import { getFirebaseErrorMessage } from "../utils/firebaseError";
import { sendContactMessage } from "../utils/emailjs";

const useStyles = makeStyles({
  container: {
    marginTop: 20,
    paddingBottom: 50,
  },
  title: {
    color: "gold",
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 30,
    fontFamily: "serif",
  },
  form: {
    maxWidth: 600,
    margin: "0 auto",
    padding: 30,
    borderRadius: 10,
  },
  formGroup: {
    marginBottom: 20,
  },
  submitButton: {
    backgroundColor: "#EEBC1D",
    color: "black",
    fontWeight: "bold",
    padding: "12px 30px",
    "&:hover": {
      backgroundColor: "#FFD700",
    },
    fontFamily: "serif",
  },
});

const ContactPage = () => {
  const classes = useStyles();
  const { isDarkMode } = useTheme();
  const { setAlert } = CryptoState();
  
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    subject: "",
    message: "",
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.name || !formData.email || !formData.subject || !formData.message) {
      setAlert({
        open: true,
        message: "Please fill all fields",
        type: "error",
      });
      return;
    }

    try {
      await sendContactMessage({
        name: formData.name,
        email: formData.email,
        subject: formData.subject,
        message: formData.message,
      });

      setAlert({
        open: true,
        message: "Message sent successfully! We'll get back to you soon.",
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
        message: getFirebaseErrorMessage(error, "Failed to send message. Please try again."),
        type: "error",
      });
    }
  };

  return (
    <Container className={classes.container}>
      <Typography
        variant="h3"
        className={classes.title}
        style={{ color: isDarkMode ? "gold" : "black", fontFamily: "serif" }}
      >
        Contact Us
      </Typography>

      <Paper
        className={classes.form}
        style={{
          backgroundColor: isDarkMode ? "#262626" : "#faf8f3",
          color: isDarkMode ? "white" : "black",
        }}
      >
        <form onSubmit={handleSubmit}>
          <Box className={classes.formGroup}>
            <TextField
              fullWidth
              label="Your Name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              variant="outlined"
              style={{
                backgroundColor: isDarkMode ? "#1a1a1a" : "#ffffff",
              }}
              InputProps={{
                style: { color: isDarkMode ? "white" : "black", fontFamily: "serif" },
              }}
              InputLabelProps={{
                style: { color: isDarkMode ? "gold" : "black" },
              }}
            />
          </Box>

          <Box className={classes.formGroup}>
            <TextField
              fullWidth
              label="Your Email"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleChange}
              variant="outlined"
              style={{
                backgroundColor: isDarkMode ? "#1a1a1a" : "#ffffff",
              }}
              InputProps={{
                style: { color: isDarkMode ? "white" : "black", fontFamily: "serif" },
              }}
              InputLabelProps={{
                style: { color: isDarkMode ? "gold" : "black" },
              }}
            />
          </Box>

          <Box className={classes.formGroup}>
            <TextField
              fullWidth
              label="Subject"
              name="subject"
              value={formData.subject}
              onChange={handleChange}
              variant="outlined"
              style={{
                backgroundColor: isDarkMode ? "#1a1a1a" : "#ffffff",
              }}
              InputProps={{
                style: { color: isDarkMode ? "white" : "black", fontFamily: "serif" },
              }}
              InputLabelProps={{
                style: { color: isDarkMode ? "gold" : "black" },
              }}
            />
          </Box>

          <Box className={classes.formGroup}>
            <TextField
              fullWidth
              label="Message"
              name="message"
              value={formData.message}
              onChange={handleChange}
              variant="outlined"
              multiline
              rows={5}
              style={{
                backgroundColor: isDarkMode ? "#1a1a1a" : "#ffffff",
              }}
              InputProps={{
                style: { color: isDarkMode ? "white" : "black", fontFamily: "serif" },
              }}
              InputLabelProps={{
                style: { color: isDarkMode ? "gold" : "black" },
              }}
            />
          </Box>

          <Button
            type="submit"
            variant="contained"
            fullWidth
            className={classes.submitButton}
          >
            Send Message
          </Button>
        </form>

        <Box style={{ marginTop: 40, textAlign: "center" }}>
          <Typography
            variant="h6"
            style={{ color: isDarkMode ? "gold" : "black", marginBottom: 15, fontFamily: "serif" }}
          >
            Contact Email
          </Typography>
          <Typography variant="body1" paragraph>
            <a
              href="mailto:abhichiku44@gmail.com"
              style={{
                color: isDarkMode ? "gold" : "black",
                textDecoration: "none",
              }}
            >
              abhichiku44@gmail.com
            </a>
          </Typography>
        </Box>
      </Paper>
    </Container>
  );
};

export default ContactPage;
