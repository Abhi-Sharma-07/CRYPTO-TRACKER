import React, { useState, useEffect } from "react";
import { makeStyles } from "@material-ui/core/styles";
import { CryptoState } from "../CryptoContext";
import { Container, Typography, TextField, TableContainer, Table, TableHead, TableRow, TableCell, TableBody, Paper, LinearProgress, createTheme, ThemeProvider, Button, Box } from "@material-ui/core";
import { useHistory } from "react-router-dom";
import { useTheme } from "../ThemeContext";

export function numberWithCommas(x) {
  return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

const CoinsTable = () => {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const { isDarkMode } = useTheme();

  // Get the context data and fetch function
  const { symbol, coins, loading, fetchCoins } = CryptoState();

  // Add useEffect to fetch coins when component mounts
  useEffect(() => {
    fetchCoins();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const useStyles = makeStyles({
    row: {
      backgroundColor: isDarkMode ? "#16171a" : "#f5f5f5",
      cursor: "pointer",
      "&:hover": {
        backgroundColor: isDarkMode ? "#131111" : "#e0e0e0",
      },
      fontFamily: "serif",
      color: isDarkMode ? "white" : "black",
    },
    pagination: {
      "& .MuiPaginationItem-root": {
        color: isDarkMode ? "gold" : "black",
      },
    },
  });

  const classes = useStyles();
  const history = useHistory();

  const darkTheme = createTheme({
    palette: {
      primary: {
        main: "#fff",
      },
      type: "dark",
    },
    typography: {
      fontFamily: "serif",
    },
  });

  const handleSearch = () => {
    return coins.filter(
      (coin) =>
        coin.name.toLowerCase().includes(search.toLowerCase()) ||
        coin.symbol.toLowerCase().includes(search.toLowerCase())
    );
  };

  const filteredCoins = handleSearch();
  const totalPages = Math.max(1, Math.ceil(filteredCoins.length / 10));

  useEffect(() => {
    if (page > totalPages) {
      setPage(totalPages);
    }
  }, [page, totalPages]);

  // Add this return statement to render the component
  return (
    <ThemeProvider theme={darkTheme}>
      <Container
        style={{
          textAlign: "center",
          backgroundColor: isDarkMode ? "#14161a" : "#faf8f3",
          color: isDarkMode ? "white" : "black",
        }}
      >
        <Typography
          variant="h4"
          style={{
            margin: 18,
            fontFamily: "serif",
            color: isDarkMode ? "white" : "black",
          }}
        >
          Cryptocurrency Prices by Market Cap
        </Typography>

        <TextField
          label="Search For a Crypto Currency.."
          variant="outlined"
          style={{ marginBottom: 20, width: "100%" }}
          InputProps={{
            style: { color: isDarkMode ? "white" : "black" },
          }}
          onChange={(e) => setSearch(e.target.value)}
        />

        <TableContainer
          component={Paper}
          style={{
            backgroundColor: isDarkMode ? "#1e1e1e" : "#faf8f3",
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
                        onClick={() => history.push(`/coins/${coin.id}`)}
                        className={classes.row}
                        key={coin.name}
                      >
                        <TableCell
                          component="th"
                          scope="row"
                          style={{
                            display: "flex",
                            gap: 15,
                          }}
                        >
                          <img
                            src={coin?.image}
                            alt={coin.name}
                            height="50"
                            style={{ marginBottom: 10 }}
                          />
                          <div
                            style={{ display: "flex", flexDirection: "column" }}
                          >
                            <span
                              style={{
                                textTransform: "uppercase",
                                fontSize: 22,
                                color: isDarkMode ? "white" : "black",
                              }}
                            >
                              {coin.symbol}
                            </span>
                            <span style={{ color: isDarkMode ? "darkgrey" : "grey" }}>
                              {coin.name}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell align="right" style={{ color: isDarkMode ? "white" : "black" }}>
                          {symbol}{" "}
                          {numberWithCommas(
                            (coin.current_price || 0).toFixed(2)
                          )}
                        </TableCell>
                        <TableCell
                          align="right"
                          style={{
                            color: profit > 0 ? "rgb(14, 203, 129)" : "red",
                            fontWeight: 500,
                          }}
                        >
                          {profit && "+"}
                          {coin.price_change_percentage_24h ? coin.price_change_percentage_24h.toFixed(2) : "0.00"}%
                        </TableCell>
                        <TableCell align="right" style={{ color: isDarkMode ? "white" : "black" }}>
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
