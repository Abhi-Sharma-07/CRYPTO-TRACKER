import {
  AppBar,
  Container,
  MenuItem,
  Select,
  Toolbar,
  Typography,
  IconButton,
} from "@material-ui/core";
import {
  createTheme,
  makeStyles,
  ThemeProvider,
} from "@material-ui/core/styles";
import { NightsStay, WbSunny } from "@material-ui/icons";
import { useHistory } from "react-router-dom";
import { CryptoState } from "../CryptoContext";
import { useTheme } from "../ThemeContext";
import AuthModal from "./Authentication/AuthModal";
import UserSidebar from "./Authentication/UserSidebar";
import { isAdminUser } from "../utils/adminAccess";

const useStyles = makeStyles((theme) => ({
  title: {
    flex: 1,
    fontFamily: "serif",
    fontWeight: "bold",
    cursor: "pointer",
  },
  themeButton: {
    marginRight: "20px",
  },
}));

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

const lightTheme = createTheme({
  palette: {
    primary: {
      main: "#000",
    },
    type: "light",
  },
  typography: {
    fontFamily: "serif",
  },
});

function Header() {
  const classes = useStyles();
  const { currency, setCurrency, user } = CryptoState();
  const isAdmin = isAdminUser(user);
  const { isDarkMode, toggleTheme } = useTheme();
  const history = useHistory();
  const theme = isDarkMode ? darkTheme : lightTheme;

  return (
    <ThemeProvider theme={theme}>
      <style>
        {`
          @keyframes logoRotate {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }
        `}
      </style>
      <AppBar
        color="transparent"
        position="static"
        style={{
          backgroundColor: isDarkMode ? "#14161a" : "#faf8f3",
          borderBottom: isDarkMode ? "1px solid #333" : "1px solid #e0e0e0",
        }}
      >
        <Container>
          <Toolbar>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                cursor: "pointer",
                flex: 1,
              }}
              onClick={() => history.push(`/`)}
            >
              <img
                src="/crypto.jpg"
                alt="Crypto"
                style={{
                  height: 32,
                  width: 32,
                  borderRadius: "50%",
                  objectFit: "cover",
                  animation: "logoRotate 12s linear infinite",
                }}
              />
              <Typography
                variant="h6"
                className={classes.title}
                style={{ color: isDarkMode ? "gold" : "black" }}
              >
                Crypto Tracker
              </Typography>
            </div>

            <IconButton
              onClick={toggleTheme}
              className={classes.themeButton}
              style={{ color: isDarkMode ? "gold" : "black" }}
              title={isDarkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
            >
              {isDarkMode ? <WbSunny /> : <NightsStay />}
            </IconButton>

            <Typography
              onClick={() => history.push(`/`)}
              variant="h6"
              style={{
                cursor: "pointer",
                color: isDarkMode ? "gold" : "black",
                marginRight: "20px",
                fontFamily: "serif",
              }}
            >
              Home
            </Typography>

            <Typography
              onClick={() => history.push(`/news`)}
              variant="h6"
              style={{
                cursor: "pointer",
                color: isDarkMode ? "gold" : "black",
                marginRight: "20px",
                fontFamily: "serif",
              }}
            >
              News
            </Typography>

            <Typography
              onClick={() => history.push(`/about`)}
              variant="h6"
              style={{
                cursor: "pointer",
                color: isDarkMode ? "gold" : "black",
                marginRight: "20px",
                fontFamily: "serif",
              }}
            >
              About
            </Typography>

            <Typography
              onClick={() => history.push(`/contact`)}
              variant="h6"
              style={{
                cursor: "pointer",
                color: isDarkMode ? "gold" : "black",
                marginRight: "20px",
                fontFamily: "serif",
              }}
            >
              Contact
            </Typography>

            <Typography
              onClick={() => history.push(`/ai`)}
              variant="h6"
              style={{
                cursor: "pointer",
                color: isDarkMode ? "gold" : "black",
                marginRight: "20px",
                fontFamily: "serif",
              }}
            >
              Rubina (ai)
            </Typography>

            {isAdmin && (
              <Typography
                onClick={() => history.push(`/traffic`)}
                variant="h6"
                style={{
                  cursor: "pointer",
                  color: isDarkMode ? "gold" : "black",
                  marginRight: "20px",
                  fontFamily: "serif",
                }}
              >
                Traffic
              </Typography>
            )}

            <Select
              variant="outlined"
              labelId="demo-simple-select-label"
              id="demo-simple-select"
              value={currency}
              style={{
                width: 90,
                height: 40,
                color: isDarkMode ? "gold" : "black",
                backgroundColor: isDarkMode ? "#14161a" : "#fff",
                border: `1px solid ${isDarkMode ? "gold" : "black"}`,
                borderRadius: 4,
              }}
              inputProps={{
                style: { padding: "10px 14px" },
              }}
              MenuProps={{
                PaperProps: {
                  style: {
                    backgroundColor: isDarkMode ? "#14161a" : "#fff",
                    color: isDarkMode ? "white" : "black",
                  },
                },
              }}
              onChange={(e) => setCurrency(e.target.value)}
            >
              <MenuItem
                value={"USD"}
                style={{
                  color: isDarkMode ? "white" : "black",
                }}
              >
                USD
              </MenuItem>
              <MenuItem
                value={"INR"}
                style={{
                  color: isDarkMode ? "white" : "black",
                }}
              >
                INR
              </MenuItem>
              <MenuItem
                value={"EUR"}
                style={{
                  color: isDarkMode ? "white" : "black",
                }}
              >
                EUR
              </MenuItem>
            </Select>

            {user ? <UserSidebar /> : <AuthModal />}
          </Toolbar>
        </Container>
      </AppBar>
    </ThemeProvider>
  );
}

export default Header;
