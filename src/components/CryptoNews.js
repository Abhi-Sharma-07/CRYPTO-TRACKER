import React, { useEffect, useState } from "react";
import { makeStyles } from "@material-ui/core/styles";
import {
  Container,
  Card,
  CardContent,
  Typography,
  CircularProgress,
  Box,
  Grid,
  Button,
} from "@material-ui/core";
import { useTheme } from "../ThemeContext";
import { useHistory } from "react-router-dom";
import { CryptoState } from "../CryptoContext";

const useStyles = makeStyles((theme) => ({
  container: {
    marginTop: 20,
    paddingBottom: 50,
  },
  title: {
    textAlign: "center",
    marginBottom: 24,
    fontWeight: 600,
    fontSize: "1.4rem",
    fontFamily: "serif",
  },
  card: {
    height: "100%",
    display: "flex",
    flexDirection: "column",
    cursor: "pointer",
    borderRadius: 12,
    transition: "transform 0.2s ease, box-shadow 0.2s ease",
    "&:hover": {
      transform: "translateY(-4px)",
    },
  },
  media: {
    height: 64,
    width: 64,
    objectFit: "contain",
    margin: "20px auto 10px auto",
    display: "block",
  },
  content: {
    flexGrow: 1,
  },
  date: {
    fontSize: "0.85rem",
    marginTop: 10,
  },
  loaderContainer: {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    height: "400px",
  },
}));

const CryptoNews = () => {
  const classes = useStyles();
  
  const [visibleCount, setVisibleCount] = useState(12);
  const { isDarkMode } = useTheme();
  const history = useHistory();
  const { coins, loading, fetchCoins, symbol } = CryptoState();

  useEffect(() => {
    if (!coins.length && !loading) {
      fetchCoins();
    }
  }, [coins.length, loading, fetchCoins]);

  useEffect(() => {
    setVisibleCount(12);
  }, [coins.length]);

  const formatPercent = (value) => {
    if (value === null || value === undefined) return "N/A";
    const sign = value > 0 ? "+" : "";
    return `${sign}${value.toFixed(2)}%`;
  };

  const visibleCoins = coins.slice(0, visibleCount);

  if (loading && !visibleCoins.length) {
    return (
      <Container className={classes.container}>
        <Box className={classes.loaderContainer}>
          <CircularProgress style={{ color: "#EEBC1D" }} />
        </Box>
      </Container>
    );
  }

  return (
    <Container className={classes.container}>
      <Typography
        variant="h5"
        className={classes.title}
        style={{ color: isDarkMode ? "gold" : "black", fontFamily: "serif" }}
      >
        Market Updates
      </Typography>

      <Grid container spacing={3}>
        {visibleCoins.length === 0 ? (
          <Box style={{ width: "100%", textAlign: "center" }}>
            <Typography variant="h6" style={{ width: "100%", fontFamily: "serif" }}>
              No data available
            </Typography>
            <Button
              variant="contained"
              onClick={() => {
                fetchCoins();
              }}
              style={{ marginTop: 12, backgroundColor: "#EEBC1D", color: "#111", fontFamily: "serif" }}
            >
              Retry
            </Button>
          </Box>
        ) : (
          visibleCoins.map((coin) => (
            <Grid item xs={12} sm={6} md={4} key={coin.id}>
              <Card
                className={classes.card}
                style={{
                  backgroundColor: isDarkMode ? "#181a20" : "#ffffff",
                  border: isDarkMode ? "1px solid rgba(255, 255, 255, 0.08)" : "1px solid #e2e8f0",
                  color: isDarkMode ? "#ffffff" : "#111827",
                  boxShadow: isDarkMode ? "0 4px 20px rgba(0,0,0,0.5)" : "0 4px 16px rgba(0,0,0,0.06)",
                }}
                onClick={() => history.push(`/coins/${coin.id}`)}
              >
                {coin.image && (
                  <img
                    className={classes.media}
                    src={coin.image}
                    alt={coin.name}
                    loading="lazy"
                    decoding="async"
                  />
                )}
                <CardContent className={classes.content}>
                  <Typography
                    gutterBottom
                    variant="h6"
                    component="h2"
                    style={{
                      color: isDarkMode ? "#ffffff" : "#111827",
                      fontWeight: 700,
                      textAlign: "center",
                      marginBottom: 12,
                    }}
                  >
                    {coin.name} ({coin.symbol?.toUpperCase()})
                  </Typography>

                  <div style={{ display: "flex", flexDirection: "column", gap: 7, fontSize: "0.88rem" }}>
                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                      <span style={{ color: isDarkMode ? "#94a3b8" : "#475569", fontWeight: 600 }}>Current Price:</span>
                      <strong style={{ color: isDarkMode ? "#f8fafc" : "#0f172a", fontWeight: 700 }}>
                        {symbol}{coin.current_price?.toLocaleString() || "N/A"}
                      </strong>
                    </div>

                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                      <span style={{ color: isDarkMode ? "#94a3b8" : "#475569", fontWeight: 600 }}>Market Cap:</span>
                      <strong style={{ color: isDarkMode ? "#f8fafc" : "#0f172a", fontWeight: 700 }}>
                        {symbol}{coin.market_cap?.toLocaleString() || "N/A"}
                      </strong>
                    </div>

                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                      <span style={{ color: isDarkMode ? "#94a3b8" : "#475569", fontWeight: 600 }}>24h Volume:</span>
                      <strong style={{ color: isDarkMode ? "#f8fafc" : "#0f172a", fontWeight: 700 }}>
                        {symbol}{coin.total_volume?.toLocaleString() || "N/A"}
                      </strong>
                    </div>

                    <div style={{ display: "flex", justifyContent: "space-between", marginTop: 4, paddingTop: 6, borderTop: isDarkMode ? "1px solid rgba(255,255,255,0.08)" : "1px solid #e2e8f0" }}>
                      <span style={{ color: isDarkMode ? "#94a3b8" : "#475569", fontWeight: 600 }}>24h Change:</span>
                      <strong style={{ color: (coin.price_change_percentage_24h || 0) >= 0 ? "#10b981" : "#ef4444", fontWeight: 700 }}>
                        {formatPercent(coin.price_change_percentage_24h)}
                      </strong>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Grid>
          ))
        )}
      </Grid>
      {coins.length > visibleCount && (
        <Box style={{ display: "flex", justifyContent: "center", marginTop: 24 }}>
          <Button
            variant="contained"
            onClick={() => setVisibleCount((prev) => prev + 12)}
            style={{ backgroundColor: "#EEBC1D", color: "#111", fontFamily: "serif" }}
          >
            Load More
          </Button>
        </Box>
      )}
    </Container>
  );
};

export default CryptoNews;
