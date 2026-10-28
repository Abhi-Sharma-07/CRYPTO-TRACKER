import React from "react";
import { Snackbar } from "@material-ui/core";
import { CryptoState } from "../CryptoContext";
import CheckCircleOutlineIcon from "@material-ui/icons/CheckCircleOutline";
import ErrorOutlineIcon from "@material-ui/icons/ErrorOutline";
import InfoOutlinedIcon from "@material-ui/icons/InfoOutlined";
import CloseIcon from "@material-ui/icons/Close";

const Alert = () => {
  const { alert, setAlert } = CryptoState();

  const handleCloseAlert = (event, reason) => {
    if (reason === "clickaway") return;
    setAlert({ open: false });
  };

  const isSuccess = alert.type === "success";
  const isError = alert.type === "error";

  const borderColor = isSuccess ? "#EEBC1D" : isError ? "#f87171" : "#60a5fa";
  const iconColor = isSuccess ? "#EEBC1D" : isError ? "#f87171" : "#60a5fa";

  return (
    <Snackbar
      anchorOrigin={{ vertical: "top", horizontal: "center" }}
      open={alert.open}
      autoHideDuration={4000}
      onClose={handleCloseAlert}
      style={{ zIndex: 9999 }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 12,
          backgroundColor: "#181a20",
          color: "#ffffff",
          border: `1.5px solid ${borderColor}`,
          borderRadius: 12,
          padding: "12px 18px",
          boxShadow: `0 14px 40px rgba(0, 0, 0, 0.85), 0 0 20px ${borderColor}33`,
          maxWidth: 480,
          fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
        }}
      >
        {isSuccess ? (
          <CheckCircleOutlineIcon style={{ color: iconColor, fontSize: 22 }} />
        ) : isError ? (
          <ErrorOutlineIcon style={{ color: iconColor, fontSize: 22 }} />
        ) : (
          <InfoOutlinedIcon style={{ color: iconColor, fontSize: 22 }} />
        )}

        <span style={{ fontSize: "0.9rem", color: "#f3f4f6", fontWeight: 500, flex: 1, lineHeight: 1.4 }}>
          {alert.message}
        </span>

        <button
          type="button"
          onClick={handleCloseAlert}
          style={{
            background: "none",
            border: "none",
            color: "#848e9c",
            cursor: "pointer",
            padding: 4,
            display: "flex",
            alignItems: "center",
            borderRadius: 6,
            transition: "color 0.2s",
          }}
          aria-label="close alert"
        >
          <CloseIcon style={{ fontSize: 18 }} />
        </button>
      </div>
    </Snackbar>
  );
};

export default Alert;
