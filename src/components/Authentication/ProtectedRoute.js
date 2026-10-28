import React from "react";
import { Route, useHistory } from "react-router-dom";
import { CircularProgress, Box, Typography, Button, Container } from "@material-ui/core";
import { LockOutlined, ArrowBack, VpnKey } from "@material-ui/icons";
import { CryptoState } from "../../CryptoContext";
import { useTheme } from "../../ThemeContext";

const ProtectedRoute = ({ component: Component, moduleName = "this module", ...rest }) => {
  const { user, openAuthModal } = CryptoState();
  const { isDarkMode } = useTheme();
  const history = useHistory();

  return (
    <Route
      {...rest}
      render={(props) => {
        if (user === undefined) {
          return (
            <div
              style={{
                minHeight: "70vh",
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
              }}
            >
              <CircularProgress style={{ color: "gold" }} size={50} />
            </div>
          );
        }

        if (!user) {
          return (
            <Container maxWidth="sm" style={{ padding: "60px 20px", textAlign: "center" }}>
              <Box
                style={{
                  backgroundColor: isDarkMode ? "#191c26" : "#ffffff",
                  border: isDarkMode ? "1px solid rgba(238, 188, 29, 0.3)" : "1px solid #e0e0e0",
                  borderRadius: 16,
                  padding: "48px 32px",
                  boxShadow: isDarkMode
                    ? "0 16px 40px rgba(0,0,0,0.5)"
                    : "0 10px 30px rgba(0,0,0,0.08)",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: 20,
                }}
              >
                <div
                  style={{
                    width: 72,
                    height: 72,
                    borderRadius: "50%",
                    backgroundColor: "rgba(238, 188, 29, 0.15)",
                    border: "2px solid #EEBC1D",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <LockOutlined style={{ fontSize: 36, color: "#EEBC1D" }} />
                </div>

                <Typography
                  variant="h5"
                  style={{
                    fontFamily: "serif",
                    fontWeight: "bold",
                    color: isDarkMode ? "white" : "#111",
                  }}
                >
                  Sign In Required
                </Typography>

                <Typography
                  variant="body1"
                  style={{
                    color: isDarkMode ? "#a0aec0" : "#555",
                    maxWidth: 420,
                    lineHeight: 1.6,
                    fontFamily: "serif",
                  }}
                >
                  Access to <strong>{moduleName}</strong> is reserved for registered members. Please
                  log in with your account or create a new one to continue.
                </Typography>

                <Box
                  style={{
                    display: "flex",
                    gap: 16,
                    flexWrap: "wrap",
                    justifyContent: "center",
                    marginTop: 10,
                  }}
                >
                  <Button
                    variant="contained"
                    size="large"
                    startIcon={<VpnKey />}
                    style={{
                      backgroundColor: "#EEBC1D",
                      color: "#111",
                      fontWeight: "bold",
                      fontFamily: "serif",
                      padding: "10px 24px",
                    }}
                    onClick={() =>
                      openAuthModal(0, `Sign in to access ${moduleName}`)
                    }
                  >
                    Login / Sign Up
                  </Button>

                  <Button
                    variant="outlined"
                    size="large"
                    startIcon={<ArrowBack />}
                    style={{
                      color: isDarkMode ? "#EEBC1D" : "#111",
                      borderColor: "#EEBC1D",
                      fontFamily: "serif",
                      padding: "10px 20px",
                    }}
                    onClick={() => history.push("/")}
                  >
                    Back to Home
                  </Button>
                </Box>
              </Box>
            </Container>
          );
        }

        return <Component {...props} />;
      }}
    />
  );
};

export default ProtectedRoute;
