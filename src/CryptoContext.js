import { createContext, useContext, useEffect, useState, useCallback } from "react";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { auth, db } from "./firebase";
import { onSnapshot, doc, setDoc } from "firebase/firestore";
import {
  getStoredToken,
  getStoredUser,
  setStoredAuth,
  clearStoredAuth,
  fetchCurrentUser,
  saveWatchlistApi,
} from "./services/authApi";
import { FALLBACK_COINS } from "./config/fallbackCoins";

const Crypto = createContext();

const CryptoContext = ({ children }) => {
  const [currency, setCurrency] = useState("USD");
  const [symbol, setSymbol] = useState("$");
  const [alert, setAlert] = useState({
    open: false,
    message: "",
    type: "success",
  });
  const [user, setUser] = useState(undefined);
  
  // Instant 0ms load: read from localStorage cache first, or FALLBACK_COINS immediately
  const [coins, setCoins] = useState(() => {
    try {
      const cached = localStorage.getItem("coinsCacheV1_USD");
      if (cached) {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed.coins) && parsed.coins.length > 0) {
          return parsed.coins;
        }
      }
    } catch {
      // ignore
    }
    return FALLBACK_COINS;
  });
  const [loading, setLoading] = useState(false);
  const [watchlist, setWatchlist] = useState([]);
  
  // Global Auth Modal control for easy prompt across modules
  const [authModalState, setAuthModalState] = useState({
    open: false,
    tab: 0, // 0 = login, 1 = signup
    message: "",
  });

  const openAuthModal = (tab = 0, message = "") => {
    setAuthModalState({ open: true, tab, message });
  };

  const closeAuthModal = () => {
    setAuthModalState((prev) => ({ ...prev, open: false }));
  };

  // Login handler
  const loginUser = (userData, token) => {
    setUser(userData);
    if (Array.isArray(userData?.watchlist)) {
      setWatchlist(userData.watchlist);
    }
    if (token) {
      setStoredAuth(token, userData);
    }
  };

  // Logout handler
  const logoutUser = () => {
    clearStoredAuth();
    setUser(null);
    setWatchlist([]);
    try {
      if (auth) signOut(auth);
    } catch (e) {
      // ignore
    }
    setAlert({
      open: true,
      type: "success",
      message: "Logged out successfully!",
    });
  };

  // Update watchlist helper
  const updateWatchlist = async (newCoins) => {
    setWatchlist(newCoins);
    // Sync with JWT backend
    saveWatchlistApi(newCoins);
    // If user has firebase uid, also update firestore if accessible
    if (db && user?.uid && !user.uid.startsWith("usr_")) {
      try {
        const coinRef = doc(db, "watchlist", user.uid);
        await setDoc(coinRef, { coins: newCoins }, { merge: true });
      } catch (e) {
        // backend is primary
      }
    }
  };

  // Check existing session on boot (JWT primary, Firebase fallback)
  useEffect(() => {
    let isMounted = true;
    const token = getStoredToken();
    const cachedUser = getStoredUser();

    if (token) {
      if (cachedUser && isMounted) {
        setUser(cachedUser);
        if (Array.isArray(cachedUser.watchlist)) {
          setWatchlist(cachedUser.watchlist);
        }
      }
      fetchCurrentUser(token)
        .then((freshUser) => {
          if (isMounted) {
            if (freshUser) {
              setUser(freshUser);
              if (Array.isArray(freshUser.watchlist)) {
                setWatchlist(freshUser.watchlist);
              }
            } else {
              setUser(null);
            }
          }
        })
        .catch(() => {
          if (isMounted && !cachedUser) setUser(null);
        });
    } else {
      // Check Firebase auth fallback
      if (auth) {
        try {
          const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
            if (isMounted) {
              if (firebaseUser) {
                setUser(firebaseUser);
              } else {
                setUser(null);
              }
            }
          });
          return () => unsubscribe();
        } catch {
          if (isMounted) setUser(null);
        }
      } else {
        if (isMounted) setUser(null);
      }
    }

    return () => {
      isMounted = false;
    };
  }, []);

  // Listen for Firestore watchlist changes if using Firebase
  useEffect(() => {
    if (db && user && user.uid && !user.uid.startsWith("usr_")) {
      try {
        const coinRef = doc(db, "watchlist", user.uid);
        const unsubscribe = onSnapshot(
          coinRef,
          (coin) => {
            if (coin.exists() && coin.data()?.coins) {
              setWatchlist(coin.data().coins);
            }
          },
          () => {}
        );
        return () => unsubscribe();
      } catch {
        // ignore
      }
    }
  }, [user]);

  const fetchCoins = useCallback(async () => {
    const cacheKey = `coinsCacheV1_${currency}`;
    const cached = localStorage.getItem(cacheKey);

    if (cached) {
      try {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed.coins) && parsed.coins.length > 0) {
          setCoins(parsed.coins);
          // If cache is less than 60 seconds old, avoid unnecessary network calls
          if (Date.now() - (parsed.ts || 0) < 60000) {
            setLoading(false);
            return;
          }
        }
      } catch {
        // ignore cache errors
      }
    }

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 4000);

      // 1. Try our high-speed local proxy first (0-5ms response, handles caching & 429s)
      let data = null;
      try {
        const proxyRes = await fetch(
          `http://localhost:5000/api/coins?currency=${currency.toLowerCase()}`,
          { signal: controller.signal }
        );
        if (proxyRes.ok) {
          const proxyText = await proxyRes.text();
          if (proxyText && proxyText.trim()) {
            data = JSON.parse(proxyText);
          }
        }
      } catch {
        // Local proxy not reachable, try direct CoinGecko
      }

      // 2. Direct CoinGecko fallback if proxy didn't return data
      if (!Array.isArray(data) || data.length === 0) {
        const directRes = await fetch(
          `https://api.coingecko.com/api/v3/coins/markets?vs_currency=${currency.toLowerCase()}&order=market_cap_desc&per_page=100&page=1&sparkline=false`,
          { signal: controller.signal }
        );
        if (directRes.ok) {
          const directText = await directRes.text();
          if (directText && directText.trim()) {
            data = JSON.parse(directText);
          }
        }
      }

      clearTimeout(timeoutId);

      if (Array.isArray(data) && data.length > 0) {
        setCoins(data);
        localStorage.setItem(
          cacheKey,
          JSON.stringify({ coins: data, ts: Date.now() })
        );
      }
    } catch (error) {
      console.warn("Using instant cached/fallback crypto dataset.");
    } finally {
      setLoading(false);
    }
  }, [currency]);

  useEffect(() => {
    if (currency === "INR") setSymbol("₹");
    else if (currency === "USD") setSymbol("$");
    else if (currency === "EUR") setSymbol("€");

    fetchCoins();
  }, [currency, fetchCoins]);

  return (
    <Crypto.Provider
      value={{
        currency,
        setCurrency,
        symbol,
        alert,
        setAlert,
        user,
        setUser,
        coins,
        loading,
        watchlist,
        setWatchlist,
        updateWatchlist,
        loginUser,
        logoutUser,
        fetchCoins,
        authModalState,
        openAuthModal,
        closeAuthModal,
      }}
    >
      {children}
    </Crypto.Provider>
  );
};

export default CryptoContext;

export const CryptoState = () => {
  return useContext(Crypto);
};
