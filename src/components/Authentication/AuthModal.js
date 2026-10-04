import { makeStyles, createTheme, ThemeProvider } from "@material-ui/core/styles";
import Modal from "@material-ui/core/Modal";
import Backdrop from "@material-ui/core/Backdrop";
import Fade from "@material-ui/core/Fade";
import { Button, Tab, Tabs, AppBar, Box } from "@material-ui/core";
import Signup from "./Signup";
import Login from "./Login";
import { useState } from "react";
import { auth } from "../../firebase";
import GoogleButton from "react-google-button";
import {
  GoogleAuthProvider,
  signInWithPopup,
  signInWithRedirect,
} from "firebase/auth";


import { CryptoState } from "../../CryptoContext";
import { sendOwnerNotification } from "../../utils/emailjs";
import { logAuthEvent } from "../../utils/authTraffic";
import { getFirebaseErrorMessage } from "../../utils/firebaseError";


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
  const { setAlert } = CryptoState();

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

  const signInWithGoogle = async () => {
    const googleProvider = new GoogleAuthProvider();
    googleProvider.setCustomParameters({ prompt: "select_account" });
    try {
      const result = await signInWithPopup(auth, googleProvider);
      logAuthEvent({
        eventType: "login",
        provider: "google",
        userEmail: result.user.email,
        uid: result.user.uid,
      }).catch(console.error);
      sendOwnerNotification({
        type: "login (google)",
        userEmail: result.user.email,
      }).catch(console.error);
      setAlert({
        open: true,
        message: `Sign In Successful. Welcome ${result.user.email}`,
        type: "success",
      });
      handleClose();
    } catch (error) {
      console.error("Google sign-in error:", error);
      if (error.code === "auth/popup-blocked" || error.code === "auth/cancelled-popup-request") {
        signInWithRedirect(auth, googleProvider);
      } else if (error.code !== "auth/popup-closed-by-user") {
        setAlert({
          open: true,
          message: getFirebaseErrorMessage(error, `Google sign-in failed: ${error.code || error.message}`),
          type: "error",
        });
      }
    }
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
              <Box style={{ display: "flex", justifyContent: "center", alignItems: "center", paddingTop: 16, paddingBottom: 8, gap: 10 }}>
                <img src="/golden-bull.png" alt="Golden Bull" style={{ width: 42, height: 42, borderRadius: "50%", border: "2px solid #EEBC1D", objectFit: "cover" }} />
                <span style={{ fontWeight: "bold", fontFamily: "serif", fontSize: "1.1rem" }}>Crypto Tracker</span>
              </Box>
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
