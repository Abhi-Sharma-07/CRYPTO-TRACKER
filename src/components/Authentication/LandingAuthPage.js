import React, { useState } from "react";
import {
  Button,
  TextField,
  Typography,
  Tab,
  Tabs,
  CircularProgress,
  InputAdornment,
  IconButton,
} from "@material-ui/core";
import { makeStyles, ThemeProvider, createTheme } from "@material-ui/core/styles";
import { Visibility, VisibilityOff } from "@material-ui/icons";
import GoogleButton from "react-google-button";
import { auth, db } from "../../firebase";
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithRedirect,
} from "firebase/auth";
import { setDoc, doc } from "firebase/firestore";
import { CryptoState } from "../../CryptoContext";
import { sendOwnerNotification } from "../../utils/emailjs";
import { logAuthEvent } from "../../utils/authTraffic";
import { getFirebaseErrorMessage } from "../../utils/firebaseError";

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
    title: "Secure & Private",
    desc: "Your account is protected with Firebase Authentication.",
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

  /* subtle radial glow behind the left content */
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
    gap: "12px",
    marginBottom: "48px",
  },

  "@keyframes rotateLogo": {
    from: { transform: "rotate(0deg)" },
    to: { transform: "rotate(360deg)" },
  },

  brandLogo: {
    height: "40px",
    width: "40px",
    borderRadius: "50%",
    objectFit: "cover",
    border: "1.5px solid rgba(238,188,29,0.4)",
    animation: "$rotateLogo 20s linear infinite",
  },

  brandName: {
    color: "#ffffff",
    fontWeight: 700,
    fontSize: "18px",
    fontFamily: "serif",
    letterSpacing: "0.2px",
  },

  heroHeading: {
    fontSize: "clamp(34px, 3.2vw, 52px)",
    fontWeight: 800,
    lineHeight: 1.18,
    fontFamily: "serif",
    marginBottom: "18px",
    color: "#ffffff",
  },

  goldWord: {
    color: "#EEBC1D",
  },

  heroDesc: {
    color: "#6b7280",
    fontSize: "16px",
    lineHeight: 1.75,
    maxWidth: "400px",
    marginBottom: "44px",
    fontFamily: "serif",
  },

  featureList: {
    display: "flex",
    flexDirection: "column",
    gap: "22px",
    marginBottom: "52px",
  },

  featureRow: {
    display: "flex",
    gap: "14px",
    alignItems: "flex-start",
  },

  featureIconBox: {
    width: "38px",
    height: "38px",
    borderRadius: "10px",
    background: "rgba(238,188,29,0.08)",
    border: "1px solid rgba(238,188,29,0.15)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "18px",
    flexShrink: 0,
    marginTop: "2px",
  },

  featureTitle: {
    color: "#e5e7eb",
    fontWeight: 700,
    fontSize: "14px",
    fontFamily: "serif",
    marginBottom: "3px",
  },

  featureDesc: {
    color: "#6b7280",
    fontSize: "13px",
    fontFamily: "serif",
    lineHeight: 1.6,
  },

  tickerRow: {
    display: "flex",
    gap: "8px",
    flexWrap: "wrap",
  },

  tickerChip: {
    padding: "5px 14px",
    borderRadius: "100px",
    background: "rgba(255,255,255,0.04)",
    border: "1px solid rgba(255,255,255,0.07)",
    fontFamily: "serif",
    fontSize: "12px",
    fontWeight: 700,
    letterSpacing: "0.5px",
  },

  /* ─── RIGHT PANEL ─── */
  right: {
    width: "440px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "40px 32px",
    background: "#0f1117",
    [theme.breakpoints.down("sm")]: {
      width: "100%",
      padding: "32px 20px",
    },
  },

  card: {
    width: "100%",
    maxWidth: "380px",
  },

  cardHeader: {
    textAlign: "center",
    marginBottom: "28px",
  },

  cardLogo: {
    height: "56px",
    width: "56px",
    borderRadius: "50%",
    objectFit: "cover",
    border: "2px solid rgba(238,188,29,0.4)",
    marginBottom: "14px",
    animation: "$rotateLogo 20s linear infinite",
  },

  cardTitle: {
    color: "#ffffff",
    fontWeight: 700,
    fontSize: "20px",
    fontFamily: "serif",
    marginBottom: "4px",
  },

  cardSubtitle: {
    color: "#6b7280",
    fontSize: "13px",
    fontFamily: "serif",
  },

  tabs: {
    marginBottom: "22px",
    background: "rgba(255,255,255,0.04)",
    borderRadius: "10px",
    padding: "3px",
    "& .MuiTabs-indicator": {
      height: "100%",
      borderRadius: "8px",
      background: "#EEBC1D",
      zIndex: 0,
    },
    "& .MuiTabs-flexContainer": {
      position: "relative",
      zIndex: 1,
    },
  },

  tab: {
    fontFamily: "serif",
    fontWeight: 600,
    fontSize: "13px",
    textTransform: "none",
    minHeight: "34px",
    color: "#6b7280",
    transition: "color 0.2s",
    "&.Mui-selected": {
      color: "#111",
      fontWeight: 700,
    },
  },

  form: {
    display: "flex",
    flexDirection: "column",
    gap: "12px",
  },

  input: {
    "& .MuiOutlinedInput-root": {
      color: "#e5e7eb",
      background: "rgba(255,255,255,0.04)",
      borderRadius: "10px",
      fontFamily: "serif",
      fontSize: "14px",
      "& fieldset": {
        borderColor: "rgba(255,255,255,0.09)",
        transition: "border-color 0.2s",
      },
      "&:hover fieldset": {
        borderColor: "rgba(255,255,255,0.18)",
      },
      "&.Mui-focused fieldset": {
        borderColor: "#EEBC1D",
        borderWidth: "1.5px",
      },
    },
    "& .MuiInputLabel-outlined": {
      color: "#6b7280",
      fontFamily: "serif",
      fontSize: "14px",
      "&.Mui-focused": {
        color: "#EEBC1D",
      },
    },
  },

  submitBtn: {
    background: "#EEBC1D",
    color: "#111",
    fontWeight: 700,
    fontSize: "14px",
    fontFamily: "serif",
    borderRadius: "10px",
    padding: "11px",
    textTransform: "none",
    marginTop: "4px",
    boxShadow: "none",
    transition: "background 0.2s",
    "&:hover": {
      background: "#f5c842",
      boxShadow: "none",
    },
    "&:disabled": {
      background: "#312b0f",
      color: "#6b5a10",
    },
  },

  divider: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    margin: "16px 0",
    "& span": {
      color: "#374151",
      fontSize: "12px",
      fontFamily: "serif",
    },
  },

  dividerLine: {
    flex: 1,
    height: "1px",
    background: "rgba(255,255,255,0.06)",
  },

  googleWrapper: {
    display: "flex",
    justifyContent: "center",
    "& button": {
      borderRadius: "10px !important",
      boxShadow: "none !important",
      background: "rgba(255,255,255,0.05) !important",
      border: "1px solid rgba(255,255,255,0.09) !important",
      fontFamily: "serif !important",
      fontSize: "13px !important",
      height: "42px !important",
      transition: "background 0.2s !important",
      "&:hover": {
        background: "rgba(255,255,255,0.08) !important",
      },
    },
  },

  footer: {
    marginTop: "20px",
    textAlign: "center",
    color: "#374151",
    fontSize: "11px",
    fontFamily: "serif",
    lineHeight: 1.7,
  },
}));

const authTheme = createTheme({
  palette: { type: "dark", primary: { main: "#EEBC1D" } },
  typography: { fontFamily: "serif" },
});

export default function LandingAuthPage() {
  const classes = useStyles();
  const [tabValue, setTabValue] = useState(0);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const { setAlert } = CryptoState();

  const reset = () => { setEmail(""); setPassword(""); setConfirmPassword(""); };
  const handleTabChange = (_, v) => { setTabValue(v); reset(); };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password)
      return setAlert({ open: true, message: "Please fill all fields", type: "error" });
    if (tabValue === 1 && !confirmPassword)
      return setAlert({ open: true, message: "Please confirm your password", type: "error" });
    if (tabValue === 1 && password !== confirmPassword)
      return setAlert({ open: true, message: "Passwords do not match", type: "error" });

    setLoading(true);
    try {
      if (tabValue === 0) {
        const { user } = await signInWithEmailAndPassword(auth, email, password);
        logAuthEvent({ eventType: "login", provider: "password", userEmail: user.email, uid: user.uid }).catch(console.error);
        sendOwnerNotification({ type: "login", userEmail: user.email }).catch(console.error);
        setAlert({ open: true, message: `Welcome back, ${user.email}!`, type: "success" });
      } else {
        const { user } = await createUserWithEmailAndPassword(auth, email, password);
        try {
          await setDoc(doc(db, "signups", user.uid), {
            email: user.email, uid: user.uid,
            signupDate: new Date().toISOString(), timestamp: new Date(),
          });
        } catch (dbErr) { console.error("DB save:", dbErr); }
        logAuthEvent({ eventType: "signup", provider: "password", userEmail: user.email, uid: user.uid }).catch(console.error);
        sendOwnerNotification({ type: "signup", userEmail: user.email }).catch(console.error);
        setAlert({ open: true, message: `Account created! Welcome ${user.email}`, type: "success" });
      }
    } catch (error) {
      setAlert({ open: true, message: getFirebaseErrorMessage(error, tabValue === 0 ? "Login failed." : "Signup failed."), type: "error" });
    } finally {
      setLoading(false);
    }
  };

  const handleGoogle = async () => {
    const provider = new GoogleAuthProvider();
    try {
      const { user } = await signInWithPopup(auth, provider);
      logAuthEvent({ eventType: "login", provider: "google", userEmail: user.email, uid: user.uid }).catch(console.error);
      sendOwnerNotification({ type: "login (google)", userEmail: user.email }).catch(console.error);
    } catch (error) {
      console.error("Google error:", error.code, error.message);
      if (error.code === "auth/popup-blocked") {
        signInWithRedirect(auth, provider);
      } else if (error.code !== "auth/popup-closed-by-user") {
        setAlert({ open: true, message: getFirebaseErrorMessage(error, `Google sign-in failed: ${error.code}`), type: "error" });
      }
    }
  };

  return (
    <ThemeProvider theme={authTheme}>
      <div className={classes.page}>

        {/* ── LEFT PANEL ── */}
        <div className={classes.left}>
          <div className={classes.leftGlow} />

          {/* Brand */}
          <div className={classes.brand}>
            <img src="/crypto.jpg" alt="Logo" className={classes.brandLogo} />
            <Typography className={classes.brandName}>Crypto Tracker</Typography>
          </div>

          {/* Headline */}
          <Typography className={classes.heroHeading}>
            Your <span className={classes.goldWord}>crypto</span> universe, all in one place.
          </Typography>

          <Typography className={classes.heroDesc}>
            Real-time prices, AI insights, and a personal watchlist —
            everything you need to stay ahead of the market.
          </Typography>

          {/* Features */}
          <div className={classes.featureList}>
            {FEATURES.map((f) => (
              <div className={classes.featureRow} key={f.title}>
                <div className={classes.featureIconBox}>{f.icon}</div>
                <div>
                  <Typography className={classes.featureTitle}>{f.title}</Typography>
                  <Typography className={classes.featureDesc}>{f.desc}</Typography>
                </div>
              </div>
            ))}
          </div>

          {/* Coin tickers */}
          <div className={classes.tickerRow}>
            {TICKERS.map((t) => (
              <div
                key={t.symbol}
                className={classes.tickerChip}
                style={{ color: t.color, borderColor: `${t.color}22` }}
              >
                {t.symbol}
              </div>
            ))}
          </div>
        </div>

        {/* ── RIGHT PANEL ── */}
        <div className={classes.right}>
          <div className={classes.card}>

            {/* Header */}
            <div className={classes.cardHeader}>
              <img src="/crypto.jpg" alt="Logo" className={classes.cardLogo} />
              <Typography className={classes.cardTitle}>
                {tabValue === 0 ? "Welcome back" : "Get started"}
              </Typography>
              <Typography className={classes.cardSubtitle}>
                {tabValue === 0
                  ? "Sign in to your account to continue"
                  : "Create a free account in seconds"}
              </Typography>
            </div>

            {/* Tabs */}
            <Tabs value={tabValue} onChange={handleTabChange} variant="fullWidth" className={classes.tabs}>
              <Tab label="Login" className={classes.tab} disableRipple />
              <Tab label="Sign Up" className={classes.tab} disableRipple />
            </Tabs>

            {/* Form */}
            <form className={classes.form} onSubmit={handleSubmit} noValidate>
              <TextField
                className={classes.input}
                variant="outlined"
                type="email"
                label="Email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                fullWidth
                disabled={loading}
              />

              <TextField
                className={classes.input}
                variant="outlined"
                type={showPassword ? "text" : "password"}
                label="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                fullWidth
                disabled={loading}
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton onClick={() => setShowPassword(!showPassword)} edge="end" size="small" style={{ color: "#6b7280" }}>
                        {showPassword ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />

              {tabValue === 1 && (
                <TextField
                  className={classes.input}
                  variant="outlined"
                  type="password"
                  label="Confirm password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  fullWidth
                  disabled={loading}
                />
              )}

              <Button className={classes.submitBtn} type="submit" variant="contained" fullWidth disabled={loading} disableElevation>
                {loading
                  ? <CircularProgress size={20} style={{ color: "#6b5a10" }} />
                  : tabValue === 0 ? "Sign In" : "Create Account"}
              </Button>
            </form>

            {/* Divider */}
            <div className={classes.divider}>
              <div className={classes.dividerLine} />
              <span>or</span>
              <div className={classes.dividerLine} />
            </div>

            {/* Google */}
            <div className={classes.googleWrapper}>
              <GoogleButton onClick={handleGoogle} disabled={loading} label="Continue with Google" />
            </div>

            <Typography className={classes.footer}>
              By continuing, you agree to our Terms of Service<br />and Privacy Policy.
            </Typography>
          </div>
        </div>

      </div>
    </ThemeProvider>
  );
}
