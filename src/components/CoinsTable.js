import React, { useState, useEffect } from "react";
import { makeStyles } from "@material-ui/core/styles";
import { CryptoState } from "../CryptoContext";
import { Container, Typography, TextField, TableContainer, Table, TableHead, TableRow, TableCell, TableBody, Paper, LinearProgress, createTheme, ThemeProvider, Button, Box, InputAdornment } from "@material-ui/core";
import { Search } from "@material-ui/icons";
import { useHistory } from "react-router-dom";
import { useTheme } from "../ThemeContext";

export function numberWithCommas(x) {
  return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

const CoinsTable = () => {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const { isDarkMode } = useTheme();

  const { symbol, coins, loading, user, openAuthModal } = CryptoState();

  const handleCoinClick = (coinId) => {
    if (!user) {
      openAuthModal(
        0,
        "Please log in to view detailed coin analytics & charts"
      );
      return;
    }
    history.push(`/coins/${coinId}`);
  };

  const useStyles = makeStyles({
    searchRoot: {
      marginBottom: 20,
      maxWidth: 680,
      width: "100%",
      margin: "0 auto 20px auto",
      "& .MuiOutlinedInput-root": {
        backgroundColor: isDarkMode ? "#181a20" : "#ffffff",
        borderRadius: 10,
        color: isDarkMode ? "#ffffff" : "#0f172a",
        "& fieldset": {
          borderColor: isDarkMode ? "rgba(255, 255, 255, 0.2)" : "#cbd5e1",
          borderWidth: 1.5,
        },
        "&:hover fieldset": {
          borderColor: "#EEBC1D",
        },
        "&.Mui-focused fieldset": {
          borderColor: "#EEBC1D",
        },
      },
      "& .MuiOutlinedInput-input": {
        padding: "14px 14px 14px 6px",
        fontSize: "1rem",
        fontFamily: "serif",
        color: isDarkMode ? "#ffffff" : "#0f172a",
        "&::placeholder": {
          color: isDarkMode ? "#94a3b8" : "#64748b",
          opacity: 1,
        },
      },
    },
    row: {
      backgroundColor: isDarkMode ? "#16171a" : "#ffffff",
      cursor: "pointer",
      "&:hover": {
        backgroundColor: isDarkMode ? "#1f2128" : "#f1f5f9",
      },
      fontFamily: "serif",
      color: isDarkMode ? "#ffffff" : "#111827",
    },
    pagination: {
      "& .MuiPaginationItem-root": {
        color: isDarkMode ? "gold" : "black",
      },
    },
  });

  const classes = useStyles();
  const history = useHistory();

  const tableTheme = createTheme({
    palette: {
      type: isDarkMode ? "dark" : "light",
      primary: {
        main: "#EEBC1D",
      },
    },
    typography: {
      fontFamily: "serif",
    },
  });

  const handleSearch = () => {
    const q = (search || "").trim().toLowerCase();
    if (!q) return coins || [];
    return (coins || []).filter(
      (coin) =>
        (coin?.name && coin.name.toLowerCase().includes(q)) ||
        (coin?.symbol && coin.symbol.toLowerCase().includes(q))
    );
  };

  const filteredCoins = handleSearch();
  const totalPages = Math.max(1, Math.ceil(filteredCoins.length / 10));

  useEffect(() => {
    if (page > totalPages) {
      setPage(totalPages);
    }
  }, [page, totalPages]);

  return (
    <ThemeProvider theme={tableTheme}>
      <Container
        maxWidth="md"
        style={{
          textAlign: "center",
          backgroundColor: isDarkMode ? "#14161a" : "#faf8f3",
          color: isDarkMode ? "white" : "black",
          maxWidth: 940,
          paddingLeft: 16,
          paddingRight: 16,
        }}
      >
        <Typography
          variant="h4"
          style={{
            margin: "20px 0 16px 0",
            fontFamily: "serif",
            color: isDarkMode ? "white" : "black",
            fontSize: "1.85rem",
          }}
        >
          Cryptocurrency Prices by Market Cap
        </Typography>

        <TextField
          className={classes.searchRoot}
          placeholder="Search For a Crypto Currency.. (e.g. Bitcoin, ETH, Solana)"
          variant="outlined"
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <Search style={{ color: isDarkMode ? "#EEBC1D" : "#b45309", marginLeft: 6 }} />
              </InputAdornment>
            ),
          }}
          onChange={(e) => setSearch(e.target.value)}
        />

        <TableContainer
          component={Paper}
          style={{
            backgroundColor: isDarkMode ? "#1e1e1e" : "#ffffff",
            borderRadius: 10,
            overflow: "hidden",
            boxShadow: isDarkMode
              ? "0 4px 20px rgba(0,0,0,0.4)"
              : "0 4px 16px rgba(0,0,0,0.06)",
          }}
        >
          {loading && <LinearProgress style={{ backgroundColor: "gold" }} />}
          
          <Table>
            <TableHead style={{ backgroundColor: "#EEBC1D" }}>
              <TableRow>
                {["Coin", "Price", "24h Change", "Market Cap"].map((head) => (
                  <TableCell
                    style={{
                      color: "black",
                      fontWeight: "700",
                      fontFamily: "serif",
                      padding: "12px 18px",
                      fontSize: "0.95rem",
                    }}
                    key={head}
                    align={head === "Coin" ? "left" : "right"}
                  >
                    {head}
                  </TableCell>
                ))}
              </TableRow>
            </TableHead>

            <TableBody>
              {filteredCoins
                .slice((page - 1) * 10, (page - 1) * 10 + 10)
                .map((coin) => {
                    const profit = coin.price_change_percentage_24h > 0;
                    
                    return (
                      <TableRow
                        onClick={() => handleCoinClick(coin.id)}
                        className={classes.row}
                        key={coin.name}
                      >
                        <TableCell
                          component="th"
                          scope="row"
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 12,
                            padding: "10px 18px",
                          }}
                        >
                          <img
                            src={coin?.image}
                            alt={coin.name}
                            height="38"
                            width="38"
                            style={{ objectFit: "contain" }}
                          />
                          <div
                            style={{ display: "flex", flexDirection: "column", textAlign: "left" }}
                          >
                            <span
                              style={{
                                textTransform: "uppercase",
                                fontSize: 18,
                                fontWeight: 700,
                                color: isDarkMode ? "white" : "black",
                              }}
                            >
                              {coin.symbol}
                            </span>
                            <span style={{ fontSize: 13, color: isDarkMode ? "darkgrey" : "grey" }}>
                              {coin.name}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell align="right" style={{ color: isDarkMode ? "white" : "black", padding: "10px 18px", fontWeight: 500 }}>
                          {symbol}{" "}
                          {numberWithCommas(
                            (coin.current_price || 0).toFixed(2)
                          )}
                        </TableCell>
                        <TableCell
                          align="right"
                          style={{
                            color: profit > 0 ? "rgb(14, 203, 129)" : "red",
                            fontWeight: 600,
                            padding: "10px 18px",
                          }}
                        >
                          {profit && "+"}
                          {coin.price_change_percentage_24h ? coin.price_change_percentage_24h.toFixed(2) : "0.00"}%
                        </TableCell>
                        <TableCell align="right" style={{ color: isDarkMode ? "white" : "black", padding: "10px 18px" }}>
                          {symbol}{" "}
                          {numberWithCommas(
                            (coin.market_cap || 0).toString().slice(0, -6)
                          )}
                          M
                        </TableCell>
                      </TableRow>
                    );
                })}
              {!loading && filteredCoins.length === 0 && (
                <TableRow>
                  <TableCell colSpan={4} align="center" style={{ padding: 24 }}>
                    No coins match your search.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>

        <Box
          style={{
            padding: 20,
            width: "100%",
            display: "flex",
            justifyContent: "center",
            gap: 12,
          }}
        >
          <Button
            variant="outlined"
            disabled={page === 1}
            onClick={() => {
              setPage((prev) => Math.max(1, prev - 1));
              window.scroll(0, 450);
            }}
            style={{
              color: isDarkMode ? "gold" : "black",
              borderColor: isDarkMode ? "gold" : "black",
              fontFamily: "serif",
            }}
          >
            Prev
          </Button>
          {Array.from({ length: Math.min(totalPages, 5) }, (_, idx) => idx + 1).map((p) => (
            <Button
              key={p}
              variant={page === p ? "contained" : "outlined"}
              onClick={() => {
                setPage(p);
                window.scroll(0, 450);
              }}
              style={{
                color: isDarkMode ? "gold" : "black",
                borderColor: isDarkMode ? "gold" : "black",
                backgroundColor: page === p ? (isDarkMode ? "#333" : "#f0e6d2") : "transparent",
                fontFamily: "serif",
              }}
            >
              {p}
            </Button>
          ))}
          <Button
            variant="outlined"
            disabled={page === totalPages}
            onClick={() => {
              setPage((prev) => Math.min(totalPages, prev + 1));
              window.scroll(0, 450);
            }}
            style={{
              color: isDarkMode ? "gold" : "black",
              borderColor: isDarkMode ? "gold" : "black",
              fontFamily: "serif",
            }}
          >
            Next
          </Button>
        </Box>
      </Container>
    </ThemeProvider>
  );
};

export default CoinsTable;
