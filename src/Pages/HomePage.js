import React, { Suspense } from "react";
import { ErrorBoundary } from "react-error-boundary";
import Banner from "../components/Banner/Banner";
import ErrorFallback from "../components/ErrorBoundary";
import { useTheme } from "../ThemeContext";
// import CoinsTable from "../components/CoinsTable";
const CoinsTable = React.lazy(() => import("../components/CoinsTable"));

const Homepage = () => {
  const { isDarkMode } = useTheme();
  const tagline =
    "Welcome to CryptoTracker Track prices, discover market movers, and stay ahead with real-time crypto updates.";

  return (
    <div>
      <style>
        {`
          @keyframes logoRotate {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }
        `}
      </style>
      <div
        style={{
          width: "100%",
          padding: "28px 16px",
          backgroundColor: isDarkMode ? "#000" : "#EFDECD",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexDirection: "column",
          gap: 10,
          textAlign: "center",
        }}
      >
        <img
          src="/crypto.jpg"
          alt="Crypto Tracker"
          style={{
            width: 56,
            height: 56,
            borderRadius: "50%",
            objectFit: "cover",
            border: isDarkMode
              ? "1px solid rgba(255,255,255,0.2)"
              : "1px solid rgba(0,0,0,0.1)",
            animation: "logoRotate 12s linear infinite",
          }}
        />
        <div
          style={{
            color: isDarkMode ? "#fff" : "#1a1a1a",
            fontSize: "3.5rem",
            fontWeight: "bold",
            letterSpacing: "0.4px",
            fontFamily: "serif",
          }}
        >
          Crypto Tracker
        </div>
        <div
          style={{
            color: isDarkMode ? "rgba(255,255,255,0.85)" : "#333",
            maxWidth: 980,
            fontSize: "0.95rem",
            lineHeight: 1.5,
            fontWeight: 700,
            whiteSpace: "nowrap",
            fontFamily: "serif",
          }}
        >
          {tagline}
        </div>
      </div>
      <Banner />
      <ErrorBoundary
        FallbackComponent={ErrorFallback}
        onReset={() => {
          // reset the state of your app so the error doesn't happen again
        }}
      >
        <Suspense fallback={<div>Loading...</div>}>
          {/* Make sure CoinsTable isn't receiving an Error object as a prop */}
          <CoinsTable />
        </Suspense>
      </ErrorBoundary>
    </div>
  );
};

export default Homepage;
