import React from "react";
import { makeStyles } from "@material-ui/core/styles";
import Drawer from "@material-ui/core/Drawer";
import { Avatar, Button, Typography, IconButton } from "@material-ui/core";
import { Close } from "@material-ui/icons";
import { CryptoState } from "../../CryptoContext";
import { useTheme } from "../../ThemeContext";
import { numberWithCommas } from "../CoinsTable";
import { AiFillDelete } from "react-icons/ai";

const useStyles = makeStyles({
  containerDark: {
    width: 380,
    maxWidth: "92vw",
    padding: "24px 20px 24px 20px",
    height: "100%",
    maxHeight: "100vh",
    boxSizing: "border-box",
    display: "flex",
    flexDirection: "column",
    overflowY: "auto",
    fontFamily: "serif",
    backgroundColor: "#111",
    color: "#fff",
    "&::-webkit-scrollbar": {
      width: "6px",
    },
    "&::-webkit-scrollbar-thumb": {
      backgroundColor: "#333",
      borderRadius: "4px",
    },
  },
  containerLight: {
    width: 380,
    maxWidth: "92vw",
    padding: "24px 20px 24px 20px",
    height: "100%",
    maxHeight: "100vh",
    boxSizing: "border-box",
    display: "flex",
    flexDirection: "column",
    overflowY: "auto",
    fontFamily: "serif",
    backgroundColor: "#fff",
    color: "#000",
    "&::-webkit-scrollbar": {
      width: "6px",
    },
    "&::-webkit-scrollbar-thumb": {
      backgroundColor: "#ccc",
      borderRadius: "4px",
    },
  },
  profile: {
    width: "100%",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "16px",
    marginBottom: "16px",
  },
  logout: {
    height: 48,
    minHeight: 48,
    width: "100%",
    backgroundColor: "#ff4d4d",
    color: "#fff",
    marginTop: 16,
    marginBottom: 8,
    fontFamily: "serif",
    fontWeight: "bold",
    borderRadius: 8,
    flexShrink: 0,
    "&:hover": {
      backgroundColor: "#cc0000",
    },
  },
  picture: {
    width: 96,
    height: 96,
    cursor: "pointer",
    backgroundColor: "#EEBC1D",
    objectFit: "contain",
    boxShadow: "0px 4px 10px rgba(0,0,0,0.3)",
    border: "2px solid #EEBC1D",
  },
  watchlistDark: {
    flex: 1,
    width: "100%",
    backgroundColor: "#1a1a1a",
    borderRadius: 12,
    padding: 15,
    display: "flex",
    flexDirection: "column",
    gap: 12,
    overflowY: "auto",
    "&::-webkit-scrollbar": {
      width: "6px",
    },
    "&::-webkit-scrollbar-thumb": {
      backgroundColor: "#333",
      borderRadius: "4px",
    },
  },
  watchlistLight: {
    flex: 1,
    width: "100%",
    backgroundColor: "#f5f5f5",
    borderRadius: 12,
    padding: 15,
    display: "flex",
    flexDirection: "column",
    gap: 12,
    overflowY: "auto",
    "&::-webkit-scrollbar": {
      width: "6px",
    },
    "&::-webkit-scrollbar-thumb": {
      backgroundColor: "#ccc",
      borderRadius: "4px",
    },
  },
  coinDark: {
    padding: 12,
    borderRadius: 8,
    color: "#fff",
    width: "100%",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#222",
    border: "1px solid #333",
    transition: "all 0.2s ease",
    "&:hover": {
      borderColor: "#EEBC1D",
      transform: "scale(1.02)",
    },
  },
  coinLight: {
    padding: 12,
    borderRadius: 8,
    color: "#000",
    width: "100%",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#fff",
    border: "1px solid #e0e0e0",
    transition: "all 0.2s ease",
    "&:hover": {
      borderColor: "#EEBC1D",
      transform: "scale(1.02)",
      boxShadow: "0px 4px 10px rgba(0,0,0,0.05)",
    },
  },
  coinDetails: {
    display: "flex",
    alignItems: "center",
    gap: 12,
  },
  coinIcon: {
    width: 24,
    height: 24,
  },
  coinPriceBlock: {
    display: "flex",
    alignItems: "center",
    gap: 12,
  },
});

export default function UserSidebar() {
  const classes = useStyles();
  const [state, setState] = React.useState({
    right: false,
  });
  const {
    user,
    setAlert,
    watchlist,
    coins,
    symbol,
    logoutUser,
    updateWatchlist,
  } = CryptoState();
  const { isDarkMode } = useTheme();

  const toggleDrawer = (anchor, open) => (event) => {
    if (
      event &&
      event.type === "keydown" &&
      (event.key === "Tab" || event.key === "Shift")
    ) {
      return;
    }

    setState({ ...state, [anchor]: open });
  };

  const logOut = () => {
    logoutUser();
    setAlert({
      open: true,
      type: "success",
      message: "Logged out successfully!",
    });

    toggleDrawer("right", false)();
  };

  const removeFromWatchlist = async (coin) => {
    try {
      const updated = watchlist.filter((watch) => watch !== coin?.id);
      await updateWatchlist(updated);
      setAlert({
        open: true,
        message: `${coin.name} Removed from the Watchlist !`,
        type: "success",
      });
    } catch (error) {
      setAlert({
        open: true,
        message: "Unable to update watchlist.",
        type: "error",
      });
    }
  };

  return (
    <div>
      {["right"].map((anchor) => (
        <React.Fragment key={anchor}>
          <Avatar
            onClick={toggleDrawer(anchor, true)}
            style={{
              height: 38,
              width: 38,
              marginLeft: 15,
              cursor: "pointer",
              backgroundColor: "#EEBC1D",
            }}
            src={user.photoURL}
            alt={user.displayName || user.email}
          />
          <Drawer
            anchor={anchor}
            open={state[anchor]}
            onClose={toggleDrawer(anchor, false)}
            PaperProps={{
              style: {
                overflowY: "auto",
                maxHeight: "100vh",
              },
            }}
          >
            <div className={isDarkMode ? classes.containerDark : classes.containerLight}>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  width: "100%",
                  marginBottom: 12,
                }}
              >
                <Typography
                  variant="subtitle1"
                  style={{
                    fontWeight: 700,
                    fontFamily: "serif",
                    color: isDarkMode ? "#EEBC1D" : "#b45309",
                    letterSpacing: "0.5px",
                  }}
                >
                  User Profile
                </Typography>
                <IconButton
                  onClick={toggleDrawer(anchor, false)}
                  size="small"
                  style={{
                    color: isDarkMode ? "#ffffff" : "#1e293b",
                    backgroundColor: isDarkMode ? "rgba(255, 255, 255, 0.12)" : "rgba(0, 0, 0, 0.06)",
                    padding: 6,
                    borderRadius: "50%",
                  }}
                  aria-label="close drawer"
                >
                  <Close fontSize="small" />
                </IconButton>
              </div>

              <div className={classes.profile}>
                <Avatar
                  className={classes.picture}
                  src={user.photoURL}
                  alt={user.displayName || user.email}
                />
                <Typography
                  variant="h6"
                  style={{
                    width: "100%",
                    fontSize: 22,
                    textAlign: "center",
                    fontWeight: "bolder",
                    wordWrap: "break-word",
                    fontFamily: "serif",
                  }}
                >
                  {user.displayName || user.email}
                </Typography>
                <div className={isDarkMode ? classes.watchlistDark : classes.watchlistLight}>
                  <Typography style={{ fontSize: 16, fontWeight: "bold", fontFamily: "serif", textAlign: "center", marginBottom: 8 }}>
                    Favorite Assets
                  </Typography>
                  {coins.map((coin) => {
                    if (watchlist.includes(coin.id))
                      return (
                        <div className={isDarkMode ? classes.coinDark : classes.coinLight} key={coin.id}>
                          <div className={classes.coinDetails}>
                            <img src={coin.image} alt={coin.name} className={classes.coinIcon} />
                            <span style={{ fontWeight: "bold", fontFamily: "serif" }}>{coin.name}</span>
                          </div>
                          <div className={classes.coinPriceBlock}>
                            <span style={{ fontFamily: "serif", fontWeight: 500 }}>
                              {symbol} {numberWithCommas((coin.current_price || 0).toFixed(2))}
                            </span>
                            <IconButton
                              size="small"
                              onClick={() => removeFromWatchlist(coin)}
                              style={{ color: "#ff4d4d", padding: 4 }}
                            >
                              <AiFillDelete fontSize="18" />
                            </IconButton>
                          </div>
                        </div>
                      );
                    else return <React.Fragment key={coin.id}></React.Fragment>;
                  })}
                  {!watchlist.length && (
                    <Typography style={{ textAlign: "center", marginTop: 20, color: isDarkMode ? "#888" : "#888", fontFamily: "serif" }}>
                      Your watchlist is currently empty.
                    </Typography>
                  )}
                </div>
              </div>
              <Button
                variant="contained"
                className={classes.logout}
                onClick={logOut}
              >
                Log Out
              </Button>
            </div>
          </Drawer>
        </React.Fragment>
      ))}
    </div>
  );
}
