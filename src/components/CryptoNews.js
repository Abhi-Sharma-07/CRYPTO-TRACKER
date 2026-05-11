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
    transition: "transform 0.2s",
    "&:hover": {
      transform: "scale(1.05)",
    },
  },
  media: {
    height: 110,
    objectFit: "cover",
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
                  backgroundColor: isDarkMode ? "#262626" : "#faf8f3",
                  color: isDarkMode ? "white" : "black",
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
                    style={{ color: isDarkMode ? "white" : "black", fontFamily: "serif" }}
                  >
                    {coin.name} ({coin.symbol?.toUpperCase()})
                  </Typography>
                  <Typography
                    variant="body2"
                    color={isDarkMode ? "lightgray" : "textSecondary"}
                    style={{ fontFamily: "serif" }}
                  >
                    Current Price: {symbol}{coin.current_price?.toLocaleString() || "N/A"}
                  </Typography>
                  <Typography
                    variant="body2"
                    color={isDarkMode ? "lightgray" : "textSecondary"}
                    style={{ fontFamily: "serif" }}
                  >
                    Market Cap: {symbol}{coin.market_cap?.toLocaleString() || "N/A"}
                  </Typography>
                  <Typography
                    variant="body2"
                    color={isDarkMode ? "lightgray" : "textSecondary"}
                    style={{ fontFamily: "serif" }}
                  >
                    24h Volume: {symbol}{coin.total_volume?.toLocaleString() || "N/A"}
                  </Typography>
                  <Typography
                    variant="body2"
                    color={isDarkMode ? "lightgray" : "textSecondary"}
                    style={{ fontFamily: "serif" }}
                  >
                    24h Price Change: {symbol}{coin.price_change_24h?.toLocaleString() || "N/A"}
                  </Typography>
                  <Typography
                    variant="caption"
                    className={classes.date}
                    style={{ color: isDarkMode ? "gold" : "black", fontFamily: "serif" }}
                  >
                  24h Change: {formatPercent(coin.price_change_percentage_24h)}
                </Typography>
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
