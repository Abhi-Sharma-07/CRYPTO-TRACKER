import React, { Suspense, lazy } from "react";
import { makeStyles, CircularProgress } from "@material-ui/core";
import "./App.css";
import { BrowserRouter, Redirect, Route } from "react-router-dom";
import Header from "./components/Header";
import Footer from "./components/Footer";
import Alert from "./components/Alert";
import { ThemeProvider, useTheme } from "./ThemeContext";
import { CryptoState } from "./CryptoContext";
import { isAdminUser } from "./utils/adminAccess";
import LandingAuthPage from "./components/Authentication/LandingAuthPage";

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

  if (user === null) {
    return <LandingAuthPage />;
  }

  return (
    <div
      className={classes.App}
      style={{
        backgroundColor: isDarkMode ? "#14161a" : "#faf8f3",
        color: isDarkMode ? "white" : "#000",
      }}
    >
      <Header />
      <Suspense fallback={<div>Loading...</div>}>
        <Route path="/" component={Homepage} exact />
        <Route path="/coins/:id" component={CoinPage} exact />
        <Route path="/signups" component={VisitorsPage} exact />
        <Route
          path="/traffic"
          exact
          render={() => (isAdmin ? <TrafficPage /> : <Redirect to="/" />)}
        />
        <Route path="/news" component={NewsPage} exact />
        <Route path="/about" component={AboutPage} exact />
        <Route path="/contact" component={ContactPage} exact />
        <Route path="/ai" component={AiPage} exact />
      </Suspense>
      <Footer />
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
