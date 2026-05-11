import { Box, Button, TextField } from "@material-ui/core";
import { useState } from "react";
import { CryptoState } from "../../CryptoContext";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { auth, db } from "../../firebase";
import { setDoc, doc } from "firebase/firestore";
import { sendOwnerNotification } from "../../utils/emailjs";
import { getFirebaseErrorMessage } from "../../utils/firebaseError";
import { logAuthEvent } from "../../utils/authTraffic";

const Signup = ({ handleClose }) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const { setAlert } = CryptoState();

  const handleSubmit = async () => {
    if (password !== confirmPassword) {
      setAlert({
        open: true,
        message: "Passwords do not match",
        type: "error",
      });
      return;
    }

    try {
      const result = await createUserWithEmailAndPassword(
        auth,
        email,
        password
      );

      // Save signup record to Firestore
      await setDoc(doc(db, "signups", result.user.uid), {
        email: result.user.email,
        uid: result.user.uid,
        signupDate: new Date().toISOString(),
        timestamp: new Date(),
      });

      sendOwnerNotification({
        type: "signup",
        userEmail: result.user.email,
      }).catch((error) => {
        console.error("Signup notification failed:", error);
      });
      logAuthEvent({
        eventType: "signup",
        provider: "password",
        userEmail: result.user.email,
        uid: result.user.uid,
      }).catch((error) => {
        console.error("Signup traffic logging failed:", error);
      });

      setAlert({
        open: true,
        message: `Sign Up Successful. Welcome ${result.user.email}`,
        type: "success",
      });

      handleClose();
    } catch (error) {
      setAlert({
        open: true,
        message: getFirebaseErrorMessage(error, "Signup failed."),
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
      <TextField
        variant="outlined"
        label="Confirm Password"
        type="password"
        value={confirmPassword}
        onChange={(e) => setConfirmPassword(e.target.value)}
        fullWidth
      />
      <Button
        variant="contained"
        size="large"
        style={{ backgroundColor: "#EEBC1D", fontFamily: "serif" }}
        onClick={handleSubmit}
      >
        Sign Up
      </Button>
    </Box>
  );
};

export default Signup;
