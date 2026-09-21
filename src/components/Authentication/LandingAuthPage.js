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
    icon: "📈",
    title: "Live Market Data",
    desc: "Track 100+ coins with real-time prices, candle charts, and market metrics.",
  },
  {
    icon: "🤖",
    title: "Rubina AI Insights",
    desc: "Get instant market analysis, predictions, and coin advice from Rubina AI.",
  },
  {
    icon: "⭐",
    title: "Cloud Watchlist",
    desc: "Save and sync your favorite cryptocurrency watchlist across all devices.",
  },
  {
    icon: "🛡️",
    title: "Bank-Grade Auth",
    desc: "Protected by Firebase Authentication with strict multi-layer security.",
  },
];

const TICKERS = [
  { symbol: "BTC", color: "#F7931A", change: "+4.2%" },
  { symbol: "ETH", color: "#627EEA", change: "+3.8%" },
  { symbol: "SOL", color: "#9945FF", change: "+8.5%" },
  { symbol: "BNB", color: "#F3BA2F", change: "+2.1%" },
  { symbol: "ADA", color: "#3CC8C8", change: "+1.9%" },
  { symbol: "XRP", color: "#346AA9", change: "+5.4%" },
];

const useStyles = makeStyles((theme) => ({
  page: {
    minHeight: "100vh",
    width: "100%",
    display: "flex",
    background: "#080a0f",
    fontFamily: "'Inter', 'Outfit', -apple-system, BlinkMacSystemFont, sans-serif",
    position: "relative",
    overflow: "hidden",
    [theme.breakpoints.down("sm")]: {
      flexDirection: "column",
    },
  },

  /* ─── LEFT PANEL ─── */
  left: {
    flex: 1.1,
    display: "flex",
    flexDirection: "column",
    justifyContent: "space-between",
    padding: "50px 60px",
    background: "radial-gradient(circle at 10% 20%, rgba(238, 188, 29, 0.08) 0%, transparent 40%), radial-gradient(circle at 90% 80%, rgba(99, 102, 241, 0.06) 0%, transparent 40%), #090b10",
    borderRight: "1px solid rgba(255, 255, 255, 0.07)",
    position: "relative",
    overflow: "hidden",
    [theme.breakpoints.down("sm")]: {
      padding: "36px 24px",
    },
  },

  brand: {
    display: "flex",
    alignItems: "center",
    gap: "14px",
    marginBottom: "24px",
  },

  "@keyframes logoGlow": {
    "0%, 100%": { boxShadow: "0 0 15px rgba(238, 188, 29, 0.4)" },
    "50%": { boxShadow: "0 0 30px rgba(238, 188, 29, 0.8)" },
  },

  brandLogo: {
    height: "44px",
    width: "44px",
    borderRadius: "50%",
    objectFit: "cover",
    border: "2px solid #EEBC1D",
    animation: "$logoGlow 4s ease-in-out infinite",
  },

  brandName: {
    color: "#ffffff",
    fontWeight: 800,
    fontSize: "20px",
    fontFamily: "'Outfit', 'Inter', sans-serif",
    letterSpacing: "0.5px",
    background: "linear-gradient(135deg, #FFFFFF 0%, #EEBC1D 100%)",
    WebkitBackgroundClip: "text",
    WebkitTextFillColor: "transparent",
  },

  /* Golden Bull Hero Display Card */
  bullCard: {
    position: "relative",
    width: "100%",
    maxWidth: "520px",
    height: "230px",
    borderRadius: "20px",
    overflow: "hidden",
    border: "1px solid rgba(238, 188, 29, 0.35)",
    boxShadow: "0 20px 40px rgba(0,0,0,0.8), 0 0 30px rgba(238, 188, 29, 0.15)",
    marginBottom: "28px",
    background: "#000",
    "& img": {
      width: "100%",
      height: "100%",
      objectFit: "cover",
      transition: "transform 0.7s cubic-bezier(0.16, 1, 0.3, 1)",
    },
    "&:hover img": {
      transform: "scale(1.05)",
    },
  },

  bullBadge: {
    position: "absolute",
    bottom: "14px",
    left: "14px",
    background: "rgba(15, 20, 30, 0.85)",
    backdropFilter: "blur(10px)",
    border: "1px solid rgba(238, 188, 29, 0.4)",
    borderRadius: "100px",
    padding: "6px 16px",
    display: "flex",
    alignItems: "center",
    gap: "8px",
    color: "#EEBC1D",
    fontSize: "12px",
    fontWeight: 700,
    letterSpacing: "0.5px",
  },

  pulseDot: {
    width: "8px",
    height: "8px",
    borderRadius: "50%",
    backgroundColor: "#10B981",
    boxShadow: "0 0 10px #10B981",
  },

  heroHeading: {
    fontSize: "clamp(30px, 3.2vw, 46px)",
    fontWeight: 800,
    lineHeight: 1.18,
    fontFamily: "'Outfit', 'Inter', sans-serif",
    marginBottom: "12px",
    color: "#F8FAFC",
  },

  goldWord: {
    background: "linear-gradient(135deg, #FFE066 0%, #EEBC1D 50%, #D97706 100%)",
    WebkitBackgroundClip: "text",
    WebkitTextFillColor: "transparent",
  },

  heroDesc: {
    color: "#94A3B8",
    fontSize: "15px",
    lineHeight: 1.6,
    maxWidth: "480px",
    marginBottom: "28px",
    fontFamily: "'Inter', sans-serif",
  },

  featureGrid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "14px",
    marginBottom: "28px",
    [theme.breakpoints.down("xs")]: {
      gridTemplateColumns: "1fr",
    },
  },

  featureCard: {
    padding: "14px 16px",
    borderRadius: "14px",
    background: "rgba(255, 255, 255, 0.025)",
    border: "1px solid rgba(255, 255, 255, 0.06)",
    transition: "all 0.25s ease",
    "&:hover": {
      background: "rgba(238, 188, 29, 0.04)",
      borderColor: "rgba(238, 188, 29, 0.25)",
      transform: "translateY(-2px)",
    },
  },

  featureHeader: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    marginBottom: "4px",
  },

  featureTitle: {
    color: "#F1F5F9",
    fontWeight: 700,
    fontSize: "14px",
    fontFamily: "'Outfit', sans-serif",
  },

  featureDesc: {
    color: "#94A3B8",
    fontSize: "12px",
    lineHeight: 1.5,
    fontFamily: "'Inter', sans-serif",
  },

  tickerRow: {
    display: "flex",
    gap: "10px",
    flexWrap: "wrap",
  },

  tickerChip: {
    padding: "6px 14px",
    borderRadius: "100px",
    background: "rgba(255, 255, 255, 0.03)",
    border: "1px solid rgba(255, 255, 255, 0.08)",
    fontFamily: "'Inter', sans-serif",
    fontSize: "12px",
    fontWeight: 700,
    display: "flex",
    alignItems: "center",
    gap: "6px",
  },

  /* ─── RIGHT PANEL ─── */
  right: {
    width: "480px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "40px 36px",
    background: "#0c0f17",
    [theme.breakpoints.down("sm")]: {
      width: "100%",
      padding: "36px 20px",
    },
  },

  card: {
    width: "100%",
    maxWidth: "400px",
    padding: "36px",
    borderRadius: "24px",
    background: "rgba(18, 22, 32, 0.95)",
    backdropFilter: "blur(16px)",
    border: "1px solid rgba(255, 255, 255, 0.08)",
    boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.7)",
  },

  cardHeader: {
    textAlign: "center",
    marginBottom: "28px",
  },

  cardLogo: {
    height: "64px",
    width: "64px",
    borderRadius: "50%",
    objectFit: "cover",
    border: "2px solid #EEBC1D",
    boxShadow: "0 0 20px rgba(238, 188, 29, 0.3)",
    marginBottom: "14px",
  },

  cardTitle: {
    color: "#FFFFFF",
    fontWeight: 800,
    fontSize: "22px",
    fontFamily: "'Outfit', sans-serif",
    marginBottom: "4px",
  },

  cardSubtitle: {
    color: "#94A3B8",
    fontSize: "13px",
    fontFamily: "'Inter', sans-serif",
  },

  tabs: {
    marginBottom: "24px",
    background: "rgba(255, 255, 255, 0.04)",
    borderRadius: "12px",
    padding: "4px",
    minHeight: "42px",
    "& .MuiTabs-indicator": {
      height: "100%",
      borderRadius: "9px",
      background: "#EEBC1D",
      boxShadow: "0 2px 10px rgba(238, 188, 29, 0.4)",
      zIndex: 0,
    },
    "& .MuiTabs-flexContainer": {
      position: "relative",
      zIndex: 1,
    },
  },

  tab: {
    fontFamily: "'Outfit', sans-serif",
    fontWeight: 700,
    fontSize: "14px",
    textTransform: "none",
    minHeight: "38px",
    color: "#94A3B8",
    transition: "color 0.2s",
    "&.Mui-selected": {
      color: "#0F172A",
      fontWeight: 800,
    },
  },

  form: {
    display: "flex",
    flexDirection: "column",
    gap: "16px",
  },

  input: {
    "& .MuiOutlinedInput-root": {
      color: "#F8FAFC",
      background: "rgba(255, 255, 255, 0.03)",
      borderRadius: "12px",
      fontFamily: "'Inter', sans-serif",
      fontSize: "14px",
      "& fieldset": {
        borderColor: "rgba(255, 255, 255, 0.1)",
        transition: "border-color 0.2s, box-shadow 0.2s",
      },
      "&:hover fieldset": {
        borderColor: "rgba(238, 188, 29, 0.4)",
      },
      "&.Mui-focused fieldset": {
        borderColor: "#EEBC1D",
        borderWidth: "1.5px",
        boxShadow: "0 0 12px rgba(238, 188, 29, 0.2)",
      },
    },
    "& .MuiInputLabel-outlined": {
      color: "#94A3B8",
      fontFamily: "'Inter', sans-serif",
      fontSize: "14px",
      "&.Mui-focused": {
        color: "#EEBC1D",
      },
    },
  },

  submitBtn: {
    background: "linear-gradient(135deg, #FBBF24 0%, #EEBC1D 60%, #D97706 100%)",
    color: "#0F172A",
    fontWeight: 800,
    fontSize: "15px",
    fontFamily: "'Outfit', sans-serif",
    borderRadius: "12px",
    padding: "12px",
    textTransform: "none",
    marginTop: "6px",
    boxShadow: "0 4px 15px rgba(238, 188, 29, 0.3)",
    transition: "all 0.2s ease",
    "&:hover": {
      background: "linear-gradient(135deg, #FCD34D 0%, #F59E0B 100%)",
      boxShadow: "0 6px 20px rgba(238, 188, 29, 0.45)",
      transform: "translateY(-1px)",
    },
    "&:disabled": {
      background: "#312b0f",
      color: "#6b5a10",
    },
  },

  divider: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    margin: "20px 0 16px",
    "& span": {
      color: "#64748B",
      fontSize: "12px",
      fontFamily: "'Inter', sans-serif",
      fontWeight: 600,
      textTransform: "uppercase",
      letterSpacing: "1px",
    },
  },

  dividerLine: {
    flex: 1,
    height: "1px",
    background: "rgba(255, 255, 255, 0.08)",
  },

  customGoogleBtn: {
    width: "100%",
    height: "46px",
    borderRadius: "12px",
    background: "rgba(255, 255, 255, 0.04)",
    border: "1px solid rgba(255, 255, 255, 0.12)",
    color: "#F8FAFC",
    fontWeight: 700,
    fontSize: "14px",
    fontFamily: "'Outfit', sans-serif",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "10px",
    cursor: "pointer",
    transition: "all 0.2s ease",
    "&:hover": {
      background: "rgba(255, 255, 255, 0.08)",
      borderColor: "rgba(238, 188, 29, 0.5)",
      boxShadow: "0 0 15px rgba(238, 188, 29, 0.15)",
    },
  },

  footer: {
    marginTop: "24px",
    textAlign: "center",
    color: "#64748B",
    fontSize: "11px",
    fontFamily: "'Inter', sans-serif",
    lineHeight: 1.6,
  },
}));

const authTheme = createTheme({
  palette: { type: "dark", primary: { main: "#EEBC1D" } },
  typography: { fontFamily: "'Inter', sans-serif" },
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
      setAlert({ open: true, message: `Welcome ${user.email} 🎉`, type: "success" });
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

          {/* Top Brand */}
          <div className={classes.brand}>
            <img src="/golden-bull.png" alt="Logo" className={classes.brandLogo} />
            <Typography className={classes.brandName}>Crypto Tracker</Typography>
          </div>

          {/* Golden Bull Hero Display Card */}
          <div className={classes.bullCard}>
            <img src="/golden-bull.png" alt="Golden Bull Charging" />
            <div className={classes.bullBadge}>
              <div className={classes.pulseDot} />
              <span>BULLISH MARKET • LIVE DATA</span>
            </div>
          </div>

          {/* Hero Headline & Desc */}
          <div>
            <Typography className={classes.heroHeading}>
              Your <span className={classes.goldWord}>Crypto</span> Universe,<br />All in One Place.
            </Typography>

            <Typography className={classes.heroDesc}>
              Real-time prices, AI insights, and personal portfolio watchlist —
              everything you need to stay ahead of the crypto market.
            </Typography>
          </div>

          {/* Features Grid */}
          <div className={classes.featureGrid}>
            {FEATURES.map((f) => (
              <div className={classes.featureCard} key={f.title}>
                <div className={classes.featureHeader}>
                  <span className={classes.featureIcon}>{f.icon}</span>
                  <Typography className={classes.featureTitle}>{f.title}</Typography>
                </div>
                <Typography className={classes.featureDesc}>{f.desc}</Typography>
              </div>
            ))}
          </div>

          {/* Coin Tickers */}
          <div className={classes.tickerRow}>
            {TICKERS.map((t) => (
              <div
                key={t.symbol}
                className={classes.tickerChip}
                style={{ color: t.color, borderColor: `${t.color}33` }}
              >
                <span>{t.symbol}</span>
                <span style={{ color: "#10B981", fontSize: "11px" }}>{t.change}</span>
              </div>
            ))}
          </div>
        </div>

        {/* ── RIGHT PANEL ── */}
        <div className={classes.right}>
          <div className={classes.card}>

            {/* Header */}
            <div className={classes.cardHeader}>
              <img src="/golden-bull.png" alt="Logo" className={classes.cardLogo} />
              <Typography className={classes.cardTitle}>
                {tabValue === 0 ? "Welcome Back" : "Create Account"}
              </Typography>
              <Typography className={classes.cardSubtitle}>
                {tabValue === 0
                  ? "Sign in to access your watchlist & market insights"
                  : "Join thousands of traders monitoring real-time crypto"}
              </Typography>
            </div>

            {/* Tabs */}
            <Tabs value={tabValue} onChange={handleTabChange} variant="fullWidth" className={classes.tabs}>
              <Tab label="Sign In" className={classes.tab} disableRipple />
              <Tab label="Create Account" className={classes.tab} disableRipple />
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
                      <IconButton onClick={() => setShowPassword(!showPassword)} edge="end" size="small" style={{ color: "#94A3B8" }}>
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
                  ? <CircularProgress size={22} style={{ color: "#0F172A" }} />
                  : tabValue === 0 ? "Sign In to Account" : "Create Free Account"}
              </Button>
            </form>

            {/* Divider */}
            <div className={classes.divider}>
              <div className={classes.dividerLine} />
              <span>OR</span>
              <div className={classes.dividerLine} />
            </div>

            {/* Custom Google Button */}
            <button className={classes.customGoogleBtn} onClick={handleGoogle} disabled={loading} type="button">
              <svg width="18" height="18" viewBox="0 0 24 24">
                <path fill="#EA4335" d="M12 5c1.6 0 3 .6 4.1 1.6l3.1-3.1C17.3 1.7 14.8 1 12 1 7.5 1 3.7 3.6 1.9 7.3l3.7 2.9C6.5 7.3 9 5 12 5z"/>
                <path fill="#4285F4" d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.5h6.5c-.3 1.5-1.1 2.8-2.4 3.7l3.7 2.9c2.2-2 3.7-5 3.7-8.8z"/>
                <path fill="#FBBC05" d="M5.6 14.8c-.2-.7-.4-1.5-.4-2.3s.2-1.6.4-2.3L1.9 7.3C.7 9.7 0 10.8 0 12.5s.7 2.8 1.9 5.2l3.7-2.9z"/>
                <path fill="#34A853" d="M12 23c3.2 0 6-1.1 8-3l-3.7-2.9c-1.1.7-2.5 1.2-4.3 1.2-3 0-5.5-2.3-6.4-5.2L1.9 16C3.7 19.7 7.5 23 12 23z"/>
              </svg>
              <span>Continue with Google</span>
            </button>

            <Typography className={classes.footer}>
              By continuing, you agree to our Terms of Service<br />and Privacy Policy.
            </Typography>
          </div>
        </div>

      </div>
    </ThemeProvider>
  );
}
