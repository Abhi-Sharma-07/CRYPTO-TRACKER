import { makeStyles } from "@material-ui/core/styles";
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
  getAdditionalUserInfo,
  signInWithRedirect,
  getRedirectResult,
} from "firebase/auth";
import { sendOwnerNotification } from "../../utils/emailjs";
import { getFirebaseErrorMessage } from "../../utils/firebaseError";
import { logAuthEvent } from "../../utils/authTraffic";

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

  const googleProvider = new GoogleAuthProvider();

  // Handle redirect result when user lands back after Google sign-in
  useState(() => {
    getRedirectResult(auth)
      .then((res) => {
        if (!res) return; // no redirect result, normal page load
        const authMeta = getAdditionalUserInfo(res);
        const eventType = authMeta?.isNewUser ? "signup" : "login";

        sendOwnerNotification({
          type: eventType,
          userEmail: res.user.email,
        }).catch((error) => {
          console.error("Google auth notification failed:", error);
        });
        logAuthEvent({
          eventType,
          provider: "google",
          userEmail: res.user.email,
          uid: res.user.uid,
        }).catch((error) => {
          console.error("Google auth traffic logging failed:", error);
        });

        setAlert({
          open: true,
          message: `${
            authMeta?.isNewUser ? "Sign Up Successful" : "Login Successful"
          }. Welcome ${res.user.email}`,
          type: "success",
        });
      })
      .catch((error) => {
        if (error.code !== "auth/popup-closed-by-user") {
          setAlert({
            open: true,
            message: getFirebaseErrorMessage(error, "Google sign-in failed."),
            type: "error",
          });
        }
      });
  }, []);

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
        </Fade>
      </Modal>
    </div>
  );
}
