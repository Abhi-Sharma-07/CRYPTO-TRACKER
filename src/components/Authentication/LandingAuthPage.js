import React, { useState } from "react";
import {
  Typography,
  Tab,
  Tabs,
  Button,
} from "@material-ui/core";
import { makeStyles, ThemeProvider, createTheme } from "@material-ui/core/styles";
import { useHistory } from "react-router-dom";
import Login from "./Login";
import Signup from "./Signup";

const FEATURES = [
  {
    icon: "📊",
    title: "Live Market Data",
    desc: "Track 100+ coins with real-time prices, charts, and market caps.",
  },
  {
    icon: "🤖",
    title: "AI-Powered Insights",
    desc: "Ask Rubina, your AI assistant, anything about the crypto market.",
  },
  {
    icon: "⭐",
    title: "Personal Watchlist",
    desc: "Save your favourite coins and monitor them in one place.",
  },
  {
    icon: "🔒",
    title: "Secure JWT & OTP",
    desc: "Protected accounts with Email Verification Codes and JWT tokens.",
  },
];

const TICKERS = [
  { symbol: "BTC", color: "#F7931A" },
  { symbol: "ETH", color: "#627EEA" },
  { symbol: "SOL", color: "#9945FF" },
  { symbol: "BNB", color: "#F3BA2F" },
  { symbol: "ADA", color: "#3CC8C8" },
  { symbol: "XRP", color: "#346AA9" },
];

const useStyles = makeStyles((theme) => ({
  page: {
    minHeight: "100vh",
    width: "100%",
    display: "flex",
    background: "#0f1117",
    [theme.breakpoints.down("sm")]: {
      flexDirection: "column",
    },
  },

  /* ─── LEFT PANEL ─── */
  left: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    padding: "60px 56px",
    background: "linear-gradient(155deg, #111420 0%, #0f1117 100%)",
    borderRight: "1px solid rgba(255,255,255,0.05)",
    position: "relative",
    overflow: "hidden",
    [theme.breakpoints.down("sm")]: {
      display: "none",
    },
  },

  leftGlow: {
    position: "absolute",
    width: "500px",
    height: "500px",
    borderRadius: "50%",
    background: "radial-gradient(circle, rgba(238,188,29,0.07) 0%, transparent 70%)",
    top: "50%",
    left: "50%",
    transform: "translate(-50%, -50%)",
    pointerEvents: "none",
  },

  brand: {
    display: "flex",
    alignItems: "center",
    gap: "14px",
    marginBottom: "48px",
    zIndex: 1,
  },

  brandLogo: {
    width: "48px",
    height: "48px",
    borderRadius: "50%",
    border: "2px solid #EEBC1D",
    objectFit: "cover",
  },

  brandName: {
    fontFamily: "serif",
    fontSize: "22px",
    fontWeight: 700,
    color: "#ffffff",
    letterSpacing: "0.5px",
  },

  headline: {
    fontFamily: "serif",
    fontSize: "42px",
    fontWeight: 800,
    lineHeight: 1.2,
    color: "#ffffff",
    marginBottom: "16px",
    zIndex: 1,
    "& span": {
      color: "#EEBC1D",
    },
  },

  subheadline: {
    fontSize: "16px",
    color: "#9ca3af",
    lineHeight: 1.6,
    marginBottom: "40px",
    maxWidth: "460px",
    zIndex: 1,
  },

  features: {
    display: "flex",
    flexDirection: "column",
    gap: "20px",
    marginBottom: "44px",
    zIndex: 1,
  },

  featureItem: {
    display: "flex",
    alignItems: "flex-start",
    gap: "16px",
  },

  featureIconBox: {
    width: "40px",
    height: "40px",
    borderRadius: "10px",
    background: "rgba(238,188,29,0.1)",
    border: "1px solid rgba(238,188,29,0.2)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "18px",
    flexShrink: 0,
  },

  featureText: {
    display: "flex",
    flexDirection: "column",
    gap: "2px",
  },

  featureTitle: {
    fontSize: "14px",
    fontWeight: 600,
    color: "#f3f4f6",
  },

  featureDesc: {
    fontSize: "13px",
    color: "#6b7280",
    lineHeight: 1.4,
  },

  tickerRow: {
    display: "flex",
    gap: "10px",
    flexWrap: "wrap",
    zIndex: 1,
  },

  tickerBadge: {
    padding: "4px 12px",
    borderRadius: "20px",
    background: "rgba(255,255,255,0.04)",
    border: "1px solid rgba(255,255,255,0.08)",
    fontSize: "12px",
    fontWeight: 600,
    letterSpacing: "0.5px",
  },

  /* ─── RIGHT PANEL ─── */
  right: {
    flex: 1,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "40px 24px",
    background: "#0f1117",
  },

  card: {
    width: "100%",
    maxWidth: "440px",
    background: "#161922",
    border: "1px solid rgba(255,255,255,0.08)",
    borderRadius: "16px",
    padding: "36px 32px",
    boxShadow: "0 20px 60px rgba(0,0,0,0.5)",
  },

  cardHeader: {
    textAlign: "center",
    marginBottom: "24px",
  },

  cardLogo: {
    width: "52px",
    height: "52px",
    borderRadius: "50%",
    border: "2px solid #EEBC1D",
    objectFit: "cover",
    marginBottom: "14px",
  },

  cardTitle: {
    fontFamily: "serif",
    fontSize: "24px",
    fontWeight: 700,
    color: "#ffffff",
    marginBottom: "4px",
  },

  cardSubtitle: {
    fontSize: "14px",
    color: "#6b7280",
  },

  tabs: {
    marginBottom: "24px",
    borderBottom: "1px solid rgba(255,255,255,0.08)",
    "& .MuiTabs-indicator": {
      backgroundColor: "#EEBC1D",
      height: "2px",
    },
  },

  tab: {
    color: "#6b7280",
    fontSize: "14px",
    fontWeight: 600,
    textTransform: "none",
    minWidth: 0,
    "&.Mui-selected": {
      color: "#EEBC1D",
    },
  },

  homeLink: {
    display: "block",
    textAlign: "center",
    marginTop: "20px",
    color: "#EEBC1D",
    fontSize: "14px",
    cursor: "pointer",
    textDecoration: "none",
    "&:hover": {
      textDecoration: "underline",
    },
  },

  footer: {
    textAlign: "center",
    marginTop: "20px",
    fontSize: "12px",
    color: "#4b5563",
    lineHeight: 1.5,
  },
}));

const authTheme = createTheme({
  palette: {
    type: "dark",
    primary: {
      main: "#EEBC1D",
    },
  },
  typography: {
    fontFamily: "serif",
  },
});

export default function LandingAuthPage({ initialTab = 0 }) {
  const classes = useStyles();
  const history = useHistory();
  const [tabValue, setTabValue] = useState(initialTab);

  return (
    <ThemeProvider theme={authTheme}>
      <div className={classes.page}>
        {/* ── LEFT PANEL ── */}
        <div className={classes.left}>
          <div className={classes.leftGlow} />

          {/* Brand */}
          <div className={classes.brand}>
            <img src="/Cryptooo.png" alt="Crypto Tracker" className={classes.brandLogo} />
            <span className={classes.brandName}>Crypto Tracker</span>
          </div>

          {/* Headline */}
          <Typography className={classes.headline}>
            Smart crypto intelligence,<br />
            <span>real-time</span> insights.
          </Typography>

          <Typography className={classes.subheadline}>
            Real-time prices, AI insights, and a personal watchlist — verified securely with Email OTP and JWT.
          </Typography>

          {/* Features */}
          <div className={classes.features}>
            {FEATURES.map((f, i) => (
              <div key={i} className={classes.featureItem}>
                <div className={classes.featureIconBox}>{f.icon}</div>
                <div className={classes.featureText}>
                  <span className={classes.featureTitle}>{f.title}</span>
                  <span className={classes.featureDesc}>{f.desc}</span>
                </div>
              </div>
            ))}
          </div>

          {/* Tickers */}
          <div className={classes.tickerRow}>
            {TICKERS.map((t) => (
              <span key={t.symbol} className={classes.tickerBadge} style={{ color: t.color }}>
                {t.symbol}
              </span>
            ))}
          </div>
        </div>

        {/* ── RIGHT PANEL ── */}
        <div className={classes.right}>
          <div className={classes.card}>
            {/* Header */}
            <div className={classes.cardHeader}>
              <img src="/Cryptooo.png" alt="Logo" className={classes.cardLogo} />
              <Typography className={classes.cardTitle}>
                {tabValue === 0 ? "Welcome back" : "Create Account"}
              </Typography>
              <Typography className={classes.cardSubtitle}>
                {tabValue === 0
                  ? "Sign in with your email and password"
                  : "Verify your email with OTP to get full access"}
              </Typography>
            </div>

            {/* Tabs */}
            <Tabs
              value={tabValue}
              onChange={(e, val) => setTabValue(val)}
              variant="fullWidth"
              className={classes.tabs}
            >
              <Tab label="Login" className={classes.tab} disableRipple />
              <Tab label="Sign Up" className={classes.tab} disableRipple />
            </Tabs>

            {/* Forms */}
            {tabValue === 0 && <Login />}
            {tabValue === 1 && <Signup />}

            <Button
              className={classes.homeLink}
              onClick={() => history.push("/")}
              fullWidth
            >
              ← Back to Public Homepage
            </Button>

            <Typography className={classes.footer}>
              By continuing, you agree to our Terms of Service<br />and Privacy Policy.
            </Typography>
          </div>
        </div>
      </div>
    </ThemeProvider>
  );
}
