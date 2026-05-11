import React from "react";
import { Container, Typography, Paper } from "@material-ui/core";
import { makeStyles } from "@material-ui/core/styles";
import { useTheme } from "../ThemeContext";

const useStyles = makeStyles({
  container: {
    marginTop: 20,
    paddingBottom: 50,
  },
  section: {
    marginBottom: 30,
    padding: 20,
    borderRadius: 10,
  },
  title: {
    color: "gold",
    fontWeight: "bold",
    marginBottom: 20,
    fontFamily: "serif",
  },
});

const AboutPage = () => {
  const classes = useStyles();
  const { isDarkMode } = useTheme();

  return (
    <Container className={classes.container}>
      <Typography
        variant="h3"
        className={classes.title}
        style={{ textAlign: "center", color: isDarkMode ? "gold" : "black", fontFamily: "serif" }}
      >
        About Crypto Tracker
      </Typography>

      <Paper
        className={classes.section}
        style={{
          backgroundColor: isDarkMode ? "#262626" : "#faf8f3",
          color: isDarkMode ? "white" : "black",
        }}
      >
        <Typography
          variant="h5"
          className={classes.title}
          style={{ color: isDarkMode ? "gold" : "black", fontFamily: "serif" }}
        >
          What is Crypto Tracker?
        </Typography>
        <Typography variant="body1" paragraph style={{ fontFamily: "serif" }}>
          Crypto Tracker is a real-time cryptocurrency tracking platform that helps you stay updated
          with the latest prices, market trends, and cryptocurrency news. Monitor your favorite coins
          and make informed investment decisions.
        </Typography>
      </Paper>

      <Paper
        className={classes.section}
        style={{
          backgroundColor: isDarkMode ? "#262626" : "#faf8f3",
          color: isDarkMode ? "white" : "black",
        }}
      >
        <Typography
          variant="h5"
          className={classes.title}
          style={{ color: isDarkMode ? "gold" : "black", fontFamily: "serif" }}
        >
          Features
        </Typography>
        <ul style={{ fontSize: "16px", lineHeight: "1.8", fontFamily: "serif" }}>
          <li> Real-time cryptocurrency prices</li>
          <li> 24-hour price change tracking</li>
          <li> Watchlist management</li>
          <li> Latest crypto news feed</li>
          <li> Dark/Light mode theme</li>
          <li> Multi-currency support (USD, INR, EUR)</li>
          <li> User authentication and profiles</li>
          <li> Market cap information</li>
          <li> AI assistant for coin summaries and market Q&A</li>
          <li> Authentication event notifications by email</li>
          <li> Admin-only traffic log page</li>
        </ul>
      </Paper>

      <Paper
        className={classes.section}
        style={{
          backgroundColor: isDarkMode ? "#262626" : "#faf8f3",
          color: isDarkMode ? "white" : "black",
        }}
      >
        <Typography
          variant="h5"
          className={classes.title}
          style={{ color: isDarkMode ? "gold" : "black", fontFamily: "serif" }}
        >
          What You Can Do In This App
        </Typography>
        <ul style={{ fontSize: "16px", lineHeight: "1.8", fontFamily: "serif" }}>
          <li> Search and open any coin from the market table</li>
          <li> Switch prices instantly between USD, INR, and EUR</li>
          <li> View historical coin charts (24h, 30d, 3m, 1y)</li>
          <li> Sign up or login with email/password or Google</li>
          <li> Save and manage personal watchlist in Firebase</li>
          <li> Use Rubina AI for buy-score ideas and coin summaries</li>
          <li> Send messages from Contact page via EmailJS</li>
          <li> Track auth traffic on the protected Traffic page (admin only)</li>
        </ul>
      </Paper>

      <Paper
        className={classes.section}
        style={{
          backgroundColor: isDarkMode ? "#262626" : "#faf8f3",
          color: isDarkMode ? "white" : "black",
        }}
      >
        <Typography
          variant="h5"
          className={classes.title}
          style={{ color: isDarkMode ? "gold" : "black", fontFamily: "serif" }}
        >
          Contact and Support
        </Typography>
        <Typography variant="body1" paragraph style={{ fontFamily: "serif" }}>
          Have questions or feedback? We'd love to hear from you!
        </Typography>
        <Typography variant="body1" style={{ fontFamily: "serif" }}>
          Email: abhichiku44@gmail.com
        </Typography>
        <Typography variant="body1" style={{ fontFamily: "serif" }}>
          Website: www.cryptotracker.com
        </Typography>
      </Paper>

      <Paper
        className={classes.section}
        style={{
          backgroundColor: isDarkMode ? "#262626" : "#faf8f3",
          color: isDarkMode ? "white" : "black",
        }}
      >
        <Typography
          variant="h5"
          className={classes.title}
          style={{ color: isDarkMode ? "gold" : "black", fontFamily: "serif" }}
        >
          Version
        </Typography>
        <Typography variant="body1" style={{ fontFamily: "serif" }}>
          Crypto Tracker v1.0 - 2026
        </Typography>
      </Paper>
    </Container>
  );
};

export default AboutPage;
