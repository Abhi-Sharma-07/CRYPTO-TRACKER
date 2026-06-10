import { createContext, useContext, useEffect, useState, useCallback } from "react";
import { onAuthStateChanged, getRedirectResult } from "firebase/auth";
import { auth, db } from "./firebase";
import { onSnapshot, doc } from "firebase/firestore";

const Crypto = createContext();

const CryptoContext = ({ children }) => {
  const [currency, setCurrency] = useState("USD");
  const [symbol, setSymbol] = useState("$");
  const [alert, setAlert] = useState({
    open: false,
    message: "",
    type: "success",
  });
  const [user, setUser] = useState(null);
  const [coins, setCoins] = useState([]);
  const [loading, setLoading] = useState(false);
  const [watchlist, setWatchlist] = useState([]);

  useEffect(() => {
    if (user) {
      const coinRef = doc(db, "watchlist", user?.uid);
      const unsubscribe = onSnapshot(coinRef, (coin) => {
        if (coin.exists()) {
          setWatchlist(coin.data().coins);
        } else {
          console.log("No Items in Watchlist");
        }
      });

      return () => {
        unsubscribe();
      };
    }
  }, [user]);

  useEffect(() => {
    // Handle Google redirect sign-in result (runs on every page load after redirect)
    getRedirectResult(auth)
      .then((result) => {
        if (result?.user) {
          console.log("Google redirect sign-in success:", result.user.email);
          setUser(result.user);
          setAlert({
            open: true,
            message: `Login Successful. Welcome ${result.user.email}`,
            type: "success",
          });
        }
      })
      .catch((error) => {
        console.error("Google redirect error:", error.code, error.message);
      });

    // Listen for auth state changes
    const unsubscribe = onAuthStateChanged(auth, (loggedInUser) => {
      if (loggedInUser) setUser(loggedInUser);
      else setUser(null);
    });

    return () => unsubscribe();
  }, []);

  const fetchCoins = useCallback(async () => {
    const cacheKey = `coinsCacheV1_${currency}`;
    const cached = localStorage.getItem(cacheKey);
    let isCached = false;

    if (cached) {
      try {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed.coins)) {
          setCoins(parsed.coins);
          setLoading(false);
          isCached = true;
        }
      } catch {
        // ignore cache errors
      }
    }

    if (!isCached) setLoading(true);

    try {
      const response = await fetch(
        `https://api.coingecko.com/api/v3/coins/markets?vs_currency=${currency.toLowerCase()}&order=market_cap_desc&per_page=100&page=1&sparkline=false`
      );
      const data = await response.json();

      if (!Array.isArray(data)) {
        throw new Error(
          data?.error || "CoinGecko returned an invalid market response."
        );
      }

      setCoins(data);
      localStorage.setItem(
        cacheKey,
        JSON.stringify({ coins: data, ts: Date.now() })
      );
    } catch (error) {
      console.error("Error fetching coins:", error);
    }

    setLoading(false);
  }, [currency]);

  useEffect(() => {
    if (currency === "INR") setSymbol("\u20B9");
    else if (currency === "USD") setSymbol("$");
    else if (currency === "EUR") setSymbol("\u20AC");

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
        coins,
        loading,
        watchlist,
        fetchCoins,
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
