import { makeStyles, createTheme, ThemeProvider } from "@material-ui/core/styles";
import Modal from "@material-ui/core/Modal";
import Backdrop from "@material-ui/core/Backdrop";
import Fade from "@material-ui/core/Fade";
import { Button, Tab, Tabs, AppBar, Box } from "@material-ui/core";
import Signup from "./Signup";
import Login from "./Login";
import { useState } from "react";
import { CryptoState } from "../../CryptoContext";
import { auth } from "../../firebase";
import GoogleButton from "react-google-button";
import {
  GoogleAuthProvider,
  signInWithRedirect,
} from "firebase/auth";


const useStyles = makeStyles((theme) => ({
  modal: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  paper: {
    width: 400,
    backgroundColor: theme.palette.background.paper,
    color: theme.palette.text.primary,
    borderRadius: 10,
  },
  google: {
    padding: 24,
    paddingTop: 0,
    display: "flex",
    flexDirection: "column",
    textAlign: "center",
    gap: 20,
    fontSize: 20,
    fontFamily: "serif",
  },
}));

// Light theme for modal so TextFields are always visible (dark text on white)
const modalLightTheme = createTheme({
  palette: {
    type: "light",
    primary: { main: "#EEBC1D" },
  },
  typography: { fontFamily: "serif" },
});

export default function AuthModal() {
  const classes = useStyles();
  const [open, setOpen] = useState(false);

  const { } = CryptoState();

  const handleOpen = () => {
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
  };

  const [value, setValue] = useState(0);

  const handleChange = (event, newValue) => {
    setValue(newValue);
  };

  const googleProvider = new GoogleAuthProvider();

  const signInWithGoogle = () => {
    signInWithRedirect(auth, googleProvider);
  };

  return (
    <div>
      <Button
        variant="contained"
        style={{
          width: 85,
          height: 40,
          marginLeft: 15,
          backgroundColor: "#EEBC1D",
          fontFamily: "serif",
        }}
        onClick={handleOpen}
      >
        Login
      </Button>
      <Modal
        aria-labelledby="transition-modal-title"
        aria-describedby="transition-modal-description"
        className={classes.modal}
        open={open}
        onClose={handleClose}
        closeAfterTransition
        BackdropComponent={Backdrop}
        BackdropProps={{
          timeout: 500,
        }}
      >
        <Fade in={open}>
          <ThemeProvider theme={modalLightTheme}>
            <div className={classes.paper}>
              <AppBar
                position="static"
                style={{
                  backgroundColor: "transparent",
                  color: "inherit",
                }}
              >
                <Tabs
                  value={value}
                  onChange={handleChange}
                  variant="fullWidth"
                  style={{ borderRadius: 10 }}
                >
                  <Tab label="Login" style={{ fontFamily: "serif" }} />
                  <Tab label="Sign Up" style={{ fontFamily: "serif" }} />
                </Tabs>
              </AppBar>
              {value === 0 && <Login handleClose={handleClose} />}
              {value === 1 && <Signup handleClose={handleClose} />}
              <Box className={classes.google}>
                <span>OR</span>
                <GoogleButton
                  style={{ width: "100%", outline: "none" }}
                  onClick={signInWithGoogle}
                />
              </Box>
            </div>
          </ThemeProvider>
        </Fade>
      </Modal>
    </div>
  );
}
