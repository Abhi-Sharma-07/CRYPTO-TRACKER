import { useEffect, useMemo, useState } from "react";
import {
  Box,
  Button,
  CircularProgress,
  Container,
  MenuItem,
  Select,
  TextField,
  Typography,
  Grid,
  Paper,
} from "@material-ui/core";
import { makeStyles } from "@material-ui/core/styles";
import { useTheme } from "../ThemeContext";
import { getAiReply } from "../utils/ai";
import { CryptoState } from "../CryptoContext";

const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

const numberWithCommas = (value) =>
  Number(value).toLocaleString(undefined, { maximumFractionDigits: 2 });

const getCoinScore = (coin) => {
  const momentum = clamp((coin.price_change_percentage_24h || 0) / 15, -1, 1);
  const liquidityRaw = coin.market_cap
    ? coin.total_volume / coin.market_cap
    : 0;
  const liquidity = clamp(liquidityRaw / 0.25, 0, 1);
  const size = 1 - clamp((coin.market_cap_rank || 100) / 100, 0, 1);

  const score = momentum * 0.5 + liquidity * 0.2 + size * 0.3;
  return Number(score.toFixed(4));
};

const getSummary = (coin, symbol) => {
  const price = coin.current_price != null ? `${symbol}${numberWithCommas(coin.current_price)}` : "N/A";
  const marketCap = coin.market_cap != null ? `${symbol}${numberWithCommas(coin.market_cap)}` : "N/A";
  const dayChange = coin.price_change_percentage_24h != null ? `${coin.price_change_percentage_24h.toFixed(2)}%` : "N/A";
  const high24 = coin.high_24h != null ? `${symbol}${numberWithCommas(coin.high_24h)}` : "N/A";
  const low24 = coin.low_24h != null ? `${symbol}${numberWithCommas(coin.low_24h)}` : "N/A";

  return `${coin.name} (${coin.symbol.toUpperCase()}) is currently trading at ${price}. In the last 24 hours it moved ${dayChange}, with a daily range between ${low24} and ${high24}. Its market cap is ${marketCap} and rank is #${coin.market_cap_rank || "N/A"}. This snapshot suggests ${coin.price_change_percentage_24h >= 0 ? "short-term positive momentum" : "short-term weakness"}, so manage risk and avoid all-in entries.`;
};

const useStyles = makeStyles((theme) => ({
  container: {
    paddingTop: theme.spacing(6),
    paddingBottom: theme.spacing(8),
    minHeight: "85vh",
    fontFamily: "serif",
  },
  header: {
    fontFamily: "serif",
    fontWeight: 700,
    marginBottom: theme.spacing(1),
    letterSpacing: "1px",
    textTransform: "uppercase",
  },
  subtitle: {
    fontFamily: "serif",
    marginBottom: theme.spacing(5),
    fontWeight: 400,
    opacity: 0.8,
  },
  darkCard: {
    backgroundColor: "#050505",
    border: "1px solid #333",
    borderRadius: 0,
    padding: theme.spacing(4),
    boxShadow: "none",
    height: "100%",
    display: "flex",
    flexDirection: "column",
    transition: "border-color 0.3s ease",
    "&:hover": {
      borderColor: "#666",
    },
  },
  lightCard: {
    backgroundColor: "#fff",
    border: "1px solid #e0e0e0",
    borderRadius: 0,
    padding: theme.spacing(4),
    boxShadow: "none",
    height: "100%",
    display: "flex",
    flexDirection: "column",
    transition: "border-color 0.3s ease",
    "&:hover": {
      borderColor: "#999",
    },
  },
  cardTitle: {
    fontFamily: "serif",
    fontWeight: 700,
    marginBottom: theme.spacing(2),
    fontSize: "1.25rem",
    textTransform: "uppercase",
    letterSpacing: "1px",
  },
  actionButtonDark: {
    fontFamily: "serif",
    backgroundColor: "transparent",
    border: "1px solid #fff",
    color: "#fff",
    height: 48,
    padding: "0 30px",
    fontWeight: 700,
    marginTop: theme.spacing(2),
    transition: "all 0.3s ease",
    borderRadius: 0,
    "&:hover": {
      backgroundColor: "#fff",
      color: "#000",
      transform: "translateY(-2px)",
    },
    "&:disabled": {
      border: "1px solid #444",
      color: "#444",
    }
  },
  actionButtonLight: {
    fontFamily: "serif",
    backgroundColor: "transparent",
    border: "1px solid #000",
    color: "#000",
    height: 48,
    padding: "0 30px",
    fontWeight: 700,
    marginTop: theme.spacing(2),
    transition: "all 0.3s ease",
    borderRadius: 0,
    "&:hover": {
      backgroundColor: "#000",
      color: "#fff",
      transform: "translateY(-2px)",
    },
    "&:disabled": {
      border: "1px solid #ccc",
      color: "#ccc",
    }
  },
  resultAreaDark: {
    fontFamily: "serif",
    marginTop: theme.spacing(3),
    flexGrow: 1,
    padding: theme.spacing(2.5),
    backgroundColor: "#0a0a0a",
    border: "1px solid #222",
    fontSize: "1rem",
    lineHeight: 1.6,
    color: "#e0e0e0",
  },
  resultAreaLight: {
    fontFamily: "serif",
    marginTop: theme.spacing(3),
    flexGrow: 1,
    padding: theme.spacing(2.5),
    backgroundColor: "#fafafa",
    border: "1px solid #eee",
    fontSize: "1rem",
    lineHeight: 1.6,
    color: "#222",
  },
  textFieldDark: {
    "& .MuiOutlinedInput-root": {
      borderRadius: 0,
      fontFamily: "serif",
      backgroundColor: "#0a0a0a",
      "& fieldset": { borderColor: "#333" },
      "&:hover fieldset": { borderColor: "#666" },
      "&.Mui-focused fieldset": { borderColor: "#fff", borderWidth: 1 },
    },
    "& .MuiInputBase-input": { color: "#fff", fontFamily: "serif" },
    "& .MuiInputLabel-root": { color: "#888", fontFamily: "serif" },
  },
  textFieldLight: {
    "& .MuiOutlinedInput-root": {
      borderRadius: 0,
      fontFamily: "serif",
      backgroundColor: "#fafafa",
      "& fieldset": { borderColor: "#ddd" },
      "&:hover fieldset": { borderColor: "#999" },
      "&.Mui-focused fieldset": { borderColor: "#000", borderWidth: 1 },
    },
    "& .MuiInputBase-input": { color: "#000", fontFamily: "serif" },
    "& .MuiInputLabel-root": { color: "#555", fontFamily: "serif" },
  },
  selectRootDark: {
    borderRadius: 0,
    fontFamily: "serif",
    backgroundColor: "#0a0a0a",
    "& .MuiOutlinedInput-notchedOutline": { borderColor: "#333" },
    "&:hover .MuiOutlinedInput-notchedOutline": { borderColor: "#666" },
    "&.Mui-focused .MuiOutlinedInput-notchedOutline": { borderColor: "#fff" },
  },
  selectRootLight: {
    borderRadius: 0,
    fontFamily: "serif",
    backgroundColor: "#fafafa",
    "& .MuiOutlinedInput-notchedOutline": { borderColor: "#ddd" },
    "&:hover .MuiOutlinedInput-notchedOutline": { borderColor: "#999" },
    "&.Mui-focused .MuiOutlinedInput-notchedOutline": { borderColor: "#000" },
  },
  chatResponseDark: {
    marginTop: theme.spacing(5),
    padding: theme.spacing(4),
    backgroundColor: "#050505",
    border: "1px solid #333",
    borderLeft: "4px solid #fff",
    borderRadius: 0,
  },
  chatResponseLight: {
    marginTop: theme.spacing(5),
    padding: theme.spacing(4),
    backgroundColor: "#fff",
    border: "1px solid #e0e0e0",
    borderLeft: "4px solid #000",
    borderRadius: 0,
  },
}));

const AiPage = () => {
  const { isDarkMode } = useTheme();
  const classes = useStyles();
  const { coins, fetchCoins, loading: coinsLoading, symbol } = CryptoState();
  const [prompt, setPrompt] = useState("");
  const [reply, setReply] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [error, setError] = useState("");
  const [selectedCoinId, setSelectedCoinId] = useState("");
  const [coinSummary, setCoinSummary] = useState("");
  const [recommendation, setRecommendation] = useState("");

  useEffect(() => {
    if (!coins.length) {
      fetchCoins();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const selectedCoin = useMemo(
    () => coins.find((coin) => coin.id === selectedCoinId),
    [coins, selectedCoinId]
  );

  const onAskAi = async () => {
    const cleanedPrompt = prompt.trim();
    if (!cleanedPrompt) return;

    setAiLoading(true);
    setError("");
    try {
      const result = await getAiReply(cleanedPrompt, "gemini");
      setReply(result);
    } catch (err) {
      setError(err.message || "Unable to fetch AI response.");
    } finally {
      setAiLoading(false);
    }
  };

  const onRecommend = () => {
    if (!coins.length) {
      setRecommendation("No coin data is available yet. Please wait and try again.");
      return;
    }

    const ranked = [...coins]
      .filter((coin) => coin.market_cap_rank && coin.market_cap_rank <= 50)
      .map((coin) => ({ ...coin, score: getCoinScore(coin) }))
      .sort((a, b) => b.score - a.score);

    const pick = ranked[0];
    if (!pick) {
      setRecommendation("Unable to generate recommendation from current data.");
      return;
    }

    const confidence = clamp(((pick.score + 1) / 2) * 100, 0, 100).toFixed(0);
    setRecommendation(
      `Suggested buy candidate: ${pick.name} (${pick.symbol.toUpperCase()}). Confidence: ${confidence}% based on momentum, liquidity, and market-cap rank from the latest snapshot. Current price: ${symbol}${numberWithCommas(pick.current_price)}. 24h move: ${pick.price_change_percentage_24h?.toFixed(2)}%.`
    );
  };

  const onGenerateSummary = () => {
    if (!selectedCoin) {
      setCoinSummary("Select a coin to generate a summary.");
      return;
    }
    setCoinSummary(getSummary(selectedCoin, symbol));
  };

  return (
    <Container className={classes.container}>
      <Box mb={2}>
        <Typography variant="h3" className={classes.header} style={{ color: isDarkMode ? "#fff" : "#000" }}>
          RUBINA AI
        </Typography>
        <Typography variant="subtitle1" className={classes.subtitle} style={{ color: isDarkMode ? "#888" : "#555" }}>
          Data-driven cryptocurrency intelligence.
        </Typography>
      </Box>

      <Grid container spacing={4}>
        <Grid item xs={12} md={6}>
          <Paper className={isDarkMode ? classes.darkCard : classes.lightCard} elevation={0}>
            <Typography variant="h6" className={classes.cardTitle} style={{ color: isDarkMode ? "#fff" : "#000" }}>
              Market Scanner
            </Typography>
            <Typography variant="body2" style={{ color: isDarkMode ? "#888" : "#666", marginBottom: 16, fontFamily: "serif" }}>
              Analyze top 50 assets using momentum, liquidity, and distribution metrics.
            </Typography>
            
            <Button
              onClick={onRecommend}
              disabled={coinsLoading}
              className={isDarkMode ? classes.actionButtonDark : classes.actionButtonLight}
              fullWidth
            >
              RUN ANALYSIS
            </Button>
            
            <Box className={isDarkMode ? classes.resultAreaDark : classes.resultAreaLight}>
              {recommendation || "Select 'Run Analysis' to process live market data."}
            </Box>
          </Paper>
        </Grid>

        <Grid item xs={12} md={6}>
          <Paper className={isDarkMode ? classes.darkCard : classes.lightCard} elevation={0}>
            <Typography variant="h6" className={classes.cardTitle} style={{ color: isDarkMode ? "#fff" : "#000" }}>
              Asset Summary
            </Typography>
            <Typography variant="body2" style={{ color: isDarkMode ? "#888" : "#666", marginBottom: 16, fontFamily: "serif" }}>
              Execute a fundamental micro-snapshot on any listed cryptocurrency.
            </Typography>

            <Select
              value={selectedCoinId}
              onChange={(e) => setSelectedCoinId(e.target.value)}
              displayEmpty
              variant="outlined"
              fullWidth
              className={isDarkMode ? classes.selectRootDark : classes.selectRootLight}
              style={{ color: isDarkMode ? "#fff" : "#000" }}
            >
              <MenuItem value="" style={{ fontFamily: "serif" }}><em>Select an asset</em></MenuItem>
              {coins.slice(0, 100).map((coin) => (
                <MenuItem key={coin.id} value={coin.id} style={{ fontFamily: "serif" }}>
                  {coin.name} ({coin.symbol.toUpperCase()})
                </MenuItem>
              ))}
            </Select>

            <Button
              onClick={onGenerateSummary}
              className={isDarkMode ? classes.actionButtonDark : classes.actionButtonLight}
              fullWidth
            >
              GENERATE DOSSIER
            </Button>

            <Box className={isDarkMode ? classes.resultAreaDark : classes.resultAreaLight}>
              {coinSummary || "Await asset selection."}
            </Box>
          </Paper>
        </Grid>

        <Grid item xs={12}>
          <Paper className={isDarkMode ? classes.darkCard : classes.lightCard} style={{ marginTop: 8 }} elevation={0}>
            <Typography variant="h6" className={classes.cardTitle} style={{ color: isDarkMode ? "#fff" : "#000" }}>
              Query Interface
            </Typography>
            <Typography variant="body2" style={{ color: isDarkMode ? "#888" : "#666", marginBottom: 20, fontFamily: "serif" }}>
              Direct access to the generative intelligence core.
            </Typography>

            <TextField
              placeholder="e.g. Provide a historical analysis of global halving events."
              variant="outlined"
              fullWidth
              multiline
              rows={3}
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              className={isDarkMode ? classes.textFieldDark : classes.textFieldLight}
            />

            <Box style={{ marginTop: 24, display: "flex", gap: 16, alignItems: "center" }}>
              <Button
                onClick={onAskAi}
                disabled={aiLoading || !prompt.trim()}
                className={isDarkMode ? classes.actionButtonDark : classes.actionButtonLight}
                style={{ width: "240px" }}
              >
                SUBMIT QUERY
              </Button>
              {aiLoading && <CircularProgress size={24} style={{ color: isDarkMode ? "#fff" : "#000" }} />}
            </Box>

            {error && (
              <Typography style={{ marginTop: 16, color: "#ff4d4d", fontFamily: "serif", fontWeight: 600 }}>
                [ERR] {error}
              </Typography>
            )}
          </Paper>
        </Grid>
      </Grid>

      {reply && (
        <Box className={isDarkMode ? classes.chatResponseDark : classes.chatResponseLight}>
          <Typography variant="h6" style={{ fontWeight: 800, color: isDarkMode ? "#fff" : "#000", marginBottom: 16, fontFamily: "serif", textTransform: "uppercase", letterSpacing: "1px" }}>
            Response
          </Typography>
          <Typography style={{ color: isDarkMode ? "#ccc" : "#333", lineHeight: 1.8, fontSize: "1rem", whiteSpace: "pre-wrap", fontFamily: "serif" }}>
            {reply}
          </Typography>
        </Box>
      )}
    </Container>
  );
};

export default AiPage;
