import axios from "axios";
import { useEffect, useState } from "react";
import { HistoricalChart } from "../config/api";
import { Line } from "react-chartjs-2";
import {
  CircularProgress,
  createTheme,
  makeStyles,
  ThemeProvider,
} from "@material-ui/core";
import SelectButton from "./SelectButton";
import { chartDays } from "../config/data";
import { CryptoState } from "../CryptoContext";
import { useTheme } from "../ThemeContext";

const CoinInfo = ({ coin }) => {
  const [historicData, setHistoricData] = useState();
  const [days, setDays] = useState(1);
  const { currency } = CryptoState();
  const { isDarkMode } = useTheme();

  const useStyles = makeStyles((theme) => ({
    container: {
      width: "75%",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      marginTop: 25,
      padding: 40,
      [theme.breakpoints.down("md")]: {
        width: "100%",
        marginTop: 0,
        padding: 20,
        paddingTop: 0,
      },
    },
  }));

  const classes = useStyles();

  const fetchHistoricData = async () => {
    const cacheKey = `history_${coin.id}_${currency}_${days}`;
    const cached = localStorage.getItem(cacheKey);
    if (cached) {
      try {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed.prices)) {
          setHistoricData(parsed.prices);
        }
      } catch {
        // ignore cache errors
      }
    }

    const { data } = await axios.get(HistoricalChart(coin.id, days, currency));
    setHistoricData(data.prices);
    localStorage.setItem(cacheKey, JSON.stringify({ prices: data.prices, ts: Date.now() }));
  };

  useEffect(() => {
    fetchHistoricData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [days, currency]);

  return (
    <ThemeProvider
      theme={createTheme({
        palette: {
          primary: {
            main: isDarkMode ? "#fff" : "#000",
          },
          type: isDarkMode ? "dark" : "light",
        },
        typography: {
          fontFamily: "serif",
        },
      })}
    >
      <div className={classes.container}>
        {!historicData ? (
          <CircularProgress
            style={{ color: "gold" }}
            size={250}
            thickness={1}
          />
        ) : (
          <>
            <Line
              data={{
                labels: historicData.map((coin) => {
                  let date = new Date(coin[0]);
                  let time =
                    date.getHours() > 12
                      ? `${date.getHours() - 12}:${date.getMinutes()} PM`
                      : `${date.getHours()}:${date.getMinutes()} AM`;
                  return days === 1 ? time : date.toLocaleDateString();
                }),

                datasets: [
                  {
                    data: historicData.map((coin) => coin[1]),
                    label: `Price ( Past ${days} Days ) in ${currency}`,
                    borderColor: isDarkMode ? "#EEBC1D" : "#0B6E4F",
                    backgroundColor: isDarkMode
                      ? "rgba(238, 188, 29, 0.15)"
                      : "rgba(11, 110, 79, 0.12)",
                    fill: true,
                    borderWidth: 2,
                    tension: 0.25,
                    pointRadius: 0,
                    pointHoverRadius: 4,
                  },
                ],
              }}
              options={{
                elements: {
                  point: {
                    radius: 0,
                  },
                },
                plugins: {
                  legend: {
                    labels: {
                      color: isDarkMode ? "#fff" : "#000",
                      font: {
                        size: 12,
                        weight: "600",
                        family: "serif",
                      },
                    },
                  },
                  tooltip: {
                    mode: "index",
                    intersect: false,
                    titleColor: isDarkMode ? "#fff" : "#000",
                    bodyColor: isDarkMode ? "#fff" : "#000",
                  },
                },
                scales: {
                  x: {
                    ticks: {
                      color: isDarkMode ? "rgba(255,255,255,0.8)" : "#333",
                      maxTicksLimit: 6,
                      font: { family: "serif" },
                    },
                    grid: {
                      color: isDarkMode ? "rgba(255,255,255,0.18)" : "rgba(0,0,0,0.15)",
                    },
                  },
                  y: {
                    ticks: {
                      color: isDarkMode ? "rgba(255,255,255,0.8)" : "#333",
                      maxTicksLimit: 6,
                      font: { family: "serif" },
                    },
                    grid: {
                      color: isDarkMode ? "rgba(255,255,255,0.18)" : "rgba(0,0,0,0.15)",
                    },
                  },
                },
              }}
            />
            <div
              style={{
                display: "flex",
                marginTop: 20,
                justifyContent: "space-around",
                width: "100%",
              }}
            >
              {chartDays.map((day) => (
                <SelectButton
                  key={day.value}
                  onClick={() => setDays(day.value)}
                  selected={day.value === days}
                >
                  {day.label}
                </SelectButton>
              ))}
            </div>
          </>
        )}
      </div>
    </ThemeProvider>
  );
};

export default CoinInfo;
