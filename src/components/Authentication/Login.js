import { Box, Button, TextField } from "@material-ui/core";
import { useState } from "react";
import { CryptoState } from "../../CryptoContext";
import { auth } from "../../firebase";
import { signInWithEmailAndPassword } from "firebase/auth";
import { sendOwnerNotification } from "../../utils/emailjs";
import { getFirebaseErrorMessage } from "../../utils/firebaseError";
import { logAuthEvent } from "../../utils/authTraffic";

const Login = ({ handleClose }) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const { setAlert } = CryptoState();

  const handleSubmit = async () => {
    if (!email || !password) {
      setAlert({
        open: true,
        message: "Please fill all the Fields",
        type: "error",
      });
      return;
    }

    try {
      const result = await signInWithEmailAndPassword(auth, email, password);
      logAuthEvent({
        eventType: "login",
        provider: "password",
        userEmail: result.user.email,
        uid: result.user.uid,
      }).catch((error) => {
        console.error("Login traffic logging failed:", error);
      });
      sendOwnerNotification({
        type: "login",
        userEmail: result.user.email,
      }).catch((error) => {
        console.error("Login notification failed:", error);
      });
      setAlert({
        open: true,
        message: `Login Successful. Welcome ${result.user.email}`,
        type: "success",
      });

      handleClose();
    } catch (error) {
      setAlert({
        open: true,
        message: getFirebaseErrorMessage(error, "Login failed."),
        type: "error",
      });
      return;
    }
  };

  return (
    <Box
      p={3}
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "20px",
      }}
    >
      <TextField
        variant="outlined"
        type="email"
        label="Enter Email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        fullWidth
      />
      <TextField
        variant="outlined"
        label="Enter Password"
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        fullWidth
      />
      <Button
        variant="contained"
        size="large"
        onClick={handleSubmit}
        style={{ backgroundColor: "#EEBC1D", fontFamily: "serif" }}
      >
        Login
      </Button>
    </Box>
  );
};

export default Login;
