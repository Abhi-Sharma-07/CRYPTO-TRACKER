import {
  Button,
  LinearProgress,
  makeStyles,
  Typography,
} from "@material-ui/core";
import { Star, StarBorder } from "@material-ui/icons";
import axios from "axios";
import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import ReactHtmlParser from "react-html-parser";
import CoinInfo from "../components/CoinInfo";
import { SingleCoin } from "../config/api";
import { numberWithCommas } from "../components/CoinsTable";
import { CryptoState } from "../CryptoContext";
import { doc, setDoc } from "firebase/firestore";
import { db } from "../firebase";
import { getFirebaseErrorMessage } from "../utils/firebaseError";

const CoinPage = () => {
  const { id } = useParams();
  const [coin, setCoin] = useState();

  const { currency, symbol, user, setAlert, watchlist } = CryptoState();

  const fetchCoin = async () => {
    const cacheKey = `coin_${id}`;
    const cached = localStorage.getItem(cacheKey);
    if (cached) {
      try {
        const parsed = JSON.parse(cached);
        if (parsed && parsed.id) {
          setCoin(parsed);
        }
      } catch {
        // ignore cache errors
      }
    }

    const { data } = await axios.get(SingleCoin(id));
    setCoin(data);
    localStorage.setItem(cacheKey, JSON.stringify(data));
  };

  const inWatchlist = watchlist.includes(coin?.id);

  const addToWatchlist = async () => {
    const coinRef = doc(db, "watchlist", user.uid);
    try {
      await setDoc(
        coinRef,
        { coins: watchlist ? [...watchlist, coin?.id] : [coin?.id] },
        { merge: true }
      );

      setAlert({
        open: true,
        message: `${coin.name} Added to the Watchlist !`,
        type: "success",
      });
    } catch (error) {
      setAlert({
        open: true,
        message: getFirebaseErrorMessage(
          error,
          "Unable to update watchlist."
        ),
        type: "error",
      });
    }
  };

  const removeFromWatchlist = async () => {
    const coinRef = doc(db, "watchlist", user.uid);
    try {
      await setDoc(
        coinRef,
        { coins: watchlist.filter((watch) => watch !== coin?.id) },
        { merge: true }
      );

      setAlert({
        open: true,
        message: `${coin.name} Removed from the Watchlist !`,
        type: "success",
      });
    } catch (error) {
      setAlert({
        open: true,
        message: getFirebaseErrorMessage(
          error,
          "Unable to update watchlist."
        ),
        type: "error",
      });
    }
  };

  useEffect(() => {
    fetchCoin();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const useStyles = makeStyles((theme) => ({
    container: {
      display: "flex",
      [theme.breakpoints.down("md")]: {
        flexDirection: "column",
        alignItems: "center",
      },
    },
    sidebar: {
      width: "30%",
      [theme.breakpoints.down("md")]: {
        width: "100%",
      },
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      marginTop: 16,
      borderRight: "2px solid grey",
      paddingBottom: 16,
    },
    heading: {
      fontWeight: "bold",
      marginBottom: 12,
      fontFamily: "serif",
    },
    description: {
      width: "100%",
      fontFamily: "serif",
      padding: 16,
      paddingBottom: 10,
      paddingTop: 0,
      textAlign: "justify",
    },
    marketData: {
      alignSelf: "start",
      padding: 16,
      paddingTop: 6,
      width: "100%",
      [theme.breakpoints.down("md")]: {
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
      },
      [theme.breakpoints.down("xs")]: {
        alignItems: "start",
      },
    },
    statRow: {
      display: "flex",
      alignItems: "baseline",
      gap: 12,
      marginBottom: 8,
    },
    statLabel: {
      minWidth: 170,
      fontWeight: 600,
      fontFamily: "serif",
    },
    statValue: {
      fontFamily: "serif",
    },
  }));

  const classes = useStyles();

  if (!coin) return <LinearProgress style={{ backgroundColor: "gold" }} />;

  return (
    <div className={classes.container}>
      <div className={classes.sidebar}>
        <img
          src={coin?.image.large}
          alt={coin?.name}
          height="140"
          style={{ marginBottom: 12 }}
        />
        <Typography variant="h4" className={classes.heading}>
          {coin?.name}
        </Typography>
        <Typography variant="subtitle1" className={classes.description}>
          {ReactHtmlParser(coin?.description.en.split(". ")[0])}.
        </Typography>
        <div className={classes.marketData}>
          {[
            {
              label: "Rank",
              value: numberWithCommas(coin?.market_cap_rank),
            },
            {
              label: "Current Price",
              value: `${symbol} ${numberWithCommas(
                coin?.market_data.current_price[currency.toLowerCase()]
              )}`,
            },
            {
              label: "24h High",
              value: `${symbol} ${numberWithCommas(
                coin?.market_data.high_24h[currency.toLowerCase()]
              )}`,
            },
            {
              label: "24h Low",
              value: `${symbol} ${numberWithCommas(
                coin?.market_data.low_24h[currency.toLowerCase()]
              )}`,
            },
            {
              label: "Market Cap",
              value: `${symbol} ${numberWithCommas(
                coin?.market_data.market_cap[currency.toLowerCase()]
                  .toString()
                  .slice(0, -6)
              )}M`,
            },
            {
              label: "Total Volume",
              value: `${symbol} ${numberWithCommas(
                coin?.market_data.total_volume[currency.toLowerCase()]
                  .toString()
                  .slice(0, -6)
              )}M`,
            },
            {
              label: "Circulating Supply",
              value: numberWithCommas(
                coin?.market_data.circulating_supply?.toFixed(0)
              ),
            },
            {
              label: "All Time High",
              value: `${symbol} ${numberWithCommas(
                coin?.market_data.ath[currency.toLowerCase()]
              )}`,
            },
            {
              label: "All Time Low",
              value: `${symbol} ${numberWithCommas(
                coin?.market_data.atl[currency.toLowerCase()]
              )}`,
            },
          ].map((item) => (
            <div key={item.label} className={classes.statRow}>
              <Typography variant="subtitle1" className={classes.statLabel}>
                {item.label}:
              </Typography>
              <Typography variant="subtitle1" className={classes.statValue}>
                {item.value}
              </Typography>
            </div>
          ))}
          {user && (
            <Button
              variant={inWatchlist ? "contained" : "outlined"}
              style={{
                width: "100%",
                height: 48,
                backgroundColor: inWatchlist ? "#EEBC1D" : "transparent",
                color: inWatchlist ? "#111" : "#EEBC1D",
                borderColor: "#EEBC1D",
                fontFamily: "serif",
                fontWeight: 700,
                marginTop: 12,
              }}
              startIcon={inWatchlist ? <Star /> : <StarBorder />}
              onClick={inWatchlist ? removeFromWatchlist : addToWatchlist}
            >
              {inWatchlist ? "Favourited" : "Add to Favourites"}
            </Button>
          )}
        </div>
      </div>
      <CoinInfo coin={coin} />
    </div>
  );
};

export default CoinPage;
