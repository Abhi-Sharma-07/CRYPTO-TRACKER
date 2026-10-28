import React, { Suspense, lazy } from "react";
import { makeStyles, CircularProgress } from "@material-ui/core";
import "./App.css";
import { BrowserRouter, Redirect, Route, Switch } from "react-router-dom";
import Header from "./components/Header";
import Footer from "./components/Footer";
import Alert from "./components/Alert";
import AuthModal from "./components/Authentication/AuthModal";
import ProtectedRoute from "./components/Authentication/ProtectedRoute";
import { ThemeProvider, useTheme } from "./ThemeContext";
import { CryptoState } from "./CryptoContext";
import { isAdminUser } from "./utils/adminAccess";

const Homepage = lazy(() => import("./Pages/HomePage"));
const CoinPage = lazy(() => import("./Pages/CoinPage"));
const VisitorsPage = lazy(() => import("./Pages/VisitorsPage"));
const TrafficPage = lazy(() => import("./Pages/TrafficPage"));
const NewsPage = lazy(() => import("./Pages/NewsPage"));
const AboutPage = lazy(() => import("./Pages/AboutPage"));
const ContactPage = lazy(() => import("./Pages/ContactPage"));
const AiPage = lazy(() => import("./Pages/AiPage"));

const useStyles = makeStyles(() => ({
  App: {
    minHeight: "100vh",
  },
}));

function AppContent() {
  const classes = useStyles();
  const { isDarkMode } = useTheme();
  const { user } = CryptoState();
  const isAdmin = isAdminUser(user);

  if (user === undefined) {
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          backgroundColor: "#14161a",
        }}
      >
        <CircularProgress style={{ color: "gold" }} size={60} />
      </div>
    );
  }

  return (
    <div
      className={`${classes.App} ${isDarkMode ? "dark-theme" : "light-theme"}`}
      style={{
        backgroundColor: isDarkMode ? "#14161a" : "#faf8f3",
        color: isDarkMode ? "white" : "#000",
      }}
    >
      <Header />
      <Suspense
        fallback={
          <div
            style={{
              minHeight: "50vh",
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
            }}
          >
            <CircularProgress style={{ color: "gold" }} />
          </div>
        }
      >
        <Switch>
          {/* Public Home & Info Pages */}
          <Route path="/" component={Homepage} exact />
          <Route path="/about" component={AboutPage} exact />
          <Route path="/contact" component={ContactPage} exact />
          <Route path="/login" exact><Redirect to="/" /></Route>
          <Route path="/signup" exact><Redirect to="/" /></Route>
          <Route path="/auth" exact><Redirect to="/" /></Route>

          {/* Protected Modules (Require JWT / OTP login) */}
          <ProtectedRoute
            path="/coins/:id"
            component={CoinPage}
            moduleName="Coin Analytics & Charts"
            exact
          />
          <ProtectedRoute
            path="/ai"
            component={AiPage}
            moduleName="Rubina AI Assistant"
            exact
          />
          <ProtectedRoute
            path="/news"
            component={NewsPage}
            moduleName="Crypto News & Updates"
            exact
          />
          <ProtectedRoute
            path="/signups"
            component={VisitorsPage}
            moduleName="Platform Signups"
            exact
          />
          <Route
            path="/traffic"
            exact
            render={() => (isAdmin ? <TrafficPage /> : <Redirect to="/" />)}
          />

          {/* Catch-all */}
          <Redirect to="/" />
        </Switch>
      </Suspense>
      <Footer />
      {/* Global Auth Modal for prompting JWT & OTP signin */}
      <AuthModal triggerButton={false} />
    </div>
  );
}

function App() {
  return (
    <ThemeProvider>
      <style>
        {`
          * {
            font-family: serif !important;
          }
        `}
      </style>
      <BrowserRouter>
        <AppContent />
        <Alert />
      </BrowserRouter>
    </ThemeProvider>
  );
}

export default App;
