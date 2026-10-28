import React, { useState, useEffect } from "react";
import { makeStyles } from "@material-ui/core/styles";
import Modal from "@material-ui/core/Modal";
import Backdrop from "@material-ui/core/Backdrop";
import Fade from "@material-ui/core/Fade";
import { Button, Tab, Tabs, AppBar, Box, IconButton } from "@material-ui/core";
import CloseIcon from "@material-ui/icons/Close";
import Signup from "./Signup";
import Login from "./Login";
import { CryptoState } from "../../CryptoContext";

const useStyles = makeStyles(() => ({
  modal: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: 16,
    backdropFilter: "blur(8px)",
  },
  paper: {
    width: "100%",
    maxWidth: 420,
    maxHeight: "90vh",
    backgroundColor: "#181a20",
    color: "#ffffff",
    borderRadius: 16,
    boxShadow: "0 24px 64px rgba(0, 0, 0, 0.85), 0 0 20px rgba(238, 188, 29, 0.15)",
    border: "1px solid rgba(238, 188, 29, 0.28)",
    outline: "none",
    overflowY: "auto",
    overflowX: "hidden",
    position: "relative",
    display: "flex",
    flexDirection: "column",
  },
  closeBtn: {
    position: "absolute",
    top: 14,
    right: 14,
    color: "#848e9c",
    padding: 6,
    transition: "color 0.2s ease, transform 0.2s ease",
    "&:hover": {
      color: "#EEBC1D",
      backgroundColor: "rgba(238, 188, 29, 0.1)",
      transform: "scale(1.08)",
    },
  },
  header: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    paddingTop: 24,
    paddingBottom: 16,
    borderBottom: "1px solid rgba(255, 255, 255, 0.06)",
  },
  brandRow: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    marginBottom: 4,
  },
  logo: {
    width: 38,
    height: 38,
    borderRadius: "50%",
    border: "2px solid #EEBC1D",
    objectFit: "cover",
    boxShadow: "0 0 10px rgba(238, 188, 29, 0.35)",
  },
  brandName: {
    fontWeight: 700,
    fontSize: "1.25rem",
    color: "#ffffff",
    letterSpacing: "0.4px",
  },
  tagline: {
    fontSize: "0.8rem",
    color: "#848e9c",
  },
  noticeBanner: {
    margin: "12px 20px 0 20px",
    padding: "8px 14px",
    borderRadius: 8,
    backgroundColor: "rgba(238, 188, 29, 0.12)",
    border: "1px solid rgba(238, 188, 29, 0.35)",
    color: "#EEBC1D",
    fontSize: "0.82rem",
    textAlign: "center",
    fontWeight: 500,
  },
  tabsContainer: {
    backgroundColor: "rgba(0, 0, 0, 0.25)",
    borderBottom: "1px solid rgba(255, 255, 255, 0.08)",
  },
}));

export default function AuthModal({ triggerButton = true }) {
  const classes = useStyles();
  const [localOpen, setLocalOpen] = useState(false);
  const [tabIndex, setTabIndex] = useState(0);

  const { authModalState, closeAuthModal, openAuthModal } = CryptoState();

  const isOpen = authModalState?.open || localOpen;

  useEffect(() => {
    if (authModalState?.tab !== undefined) {
      setTabIndex(authModalState.tab);
    }
  }, [authModalState?.tab]);

  const handleOpen = () => {
    openAuthModal(0);
    setLocalOpen(true);
  };

  const handleClose = () => {
    closeAuthModal();
    setLocalOpen(false);
  };

  return (
    <div>
      {triggerButton && (
        <Button
          variant="contained"
          style={{
            minWidth: 85,
            height: 40,
            marginLeft: 15,
            backgroundColor: "#EEBC1D",
            color: "#111",
            fontWeight: "bold",
            borderRadius: 6,
          }}
          onClick={handleOpen}
        >
          Login
        </Button>
      )}

      <Modal
        aria-labelledby="auth-modal-title"
        aria-describedby="auth-modal-description"
        className={classes.modal}
        open={isOpen}
        onClose={handleClose}
        closeAfterTransition
        BackdropComponent={Backdrop}
        BackdropProps={{
          timeout: 300,
          style: { backgroundColor: "rgba(0, 0, 0, 0.78)" },
        }}
      >
        <Fade in={isOpen}>
          <div className={`${classes.paper} custom-scrollbar`}>
            {/* Clean Close Button */}
            <IconButton
              size="small"
              className={classes.closeBtn}
              onClick={handleClose}
              aria-label="close"
            >
              <CloseIcon fontSize="small" />
            </IconButton>

            {/* Header */}
            <Box className={classes.header}>
              <div className={classes.brandRow}>
                <img
                  src="/Cryptooo.png"
                  alt="Crypto Logo"
                  className={classes.logo}
                />
                <span className={classes.brandName}>Crypto Tracker</span>
              </div>
              <span className={classes.tagline}>Secure Access Portal</span>
            </Box>

            {authModalState?.message && (
              <div className={classes.noticeBanner}>
                {authModalState.message}
              </div>
            )}

            {/* Clean Modern Tabs */}
            <AppBar position="static" className={classes.tabsContainer} elevation={0}>
              <Tabs
                value={tabIndex}
                onChange={(e, val) => setTabIndex(val)}
                variant="fullWidth"
                TabIndicatorProps={{
                  style: {
                    backgroundColor: "#EEBC1D",
                    height: 3,
                    borderRadius: 3,
                  },
                }}
              >
                <Tab
                  label="Login"
                  style={{
                    color: tabIndex === 0 ? "#EEBC1D" : "#848e9c",
                    fontWeight: 700,
                    fontSize: "0.95rem",
                    textTransform: "none",
                    letterSpacing: "0.3px",
                  }}
                />
                <Tab
                  label="Sign Up"
                  style={{
                    color: tabIndex === 1 ? "#EEBC1D" : "#848e9c",
                    fontWeight: 700,
                    fontSize: "0.95rem",
                    textTransform: "none",
                    letterSpacing: "0.3px",
                  }}
                />
              </Tabs>
            </AppBar>

            {/* Modal Body */}
            <div>
              {tabIndex === 0 && <Login handleClose={handleClose} />}
              {tabIndex === 1 && <Signup handleClose={handleClose} />}
            </div>
          </div>
        </Fade>
      </Modal>
    </div>
  );
}
