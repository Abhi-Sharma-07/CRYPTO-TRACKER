import React, { useEffect, useState } from "react";
import { db } from "../firebase";
import { collection, getDocs, orderBy, query } from "firebase/firestore";
import {
  Box,
  CircularProgress,
  Container,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from "@material-ui/core";
import { makeStyles } from "@material-ui/core/styles";
import { useTheme } from "../ThemeContext";

const useStyles = makeStyles({
  container: {
    marginTop: 20,
    padding: 20,
  },
  title: {
    textAlign: "center",
    marginBottom: 20,
    color: "gold",
    fontWeight: "bold",
    fontFamily: "serif",
  },
  tableHead: {
    backgroundColor: "#EEBC1D",
  },
  tableHeadCell: {
    fontWeight: "bold",
    color: "black",
    fontFamily: "serif",
  },
  loaderContainer: {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    height: "400px",
  },
});

const TrafficPage = () => {
  const classes = useStyles();
  const { isDarkMode } = useTheme();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const q = query(collection(db, "auth_events"), orderBy("timestamp", "desc"));
        const snapshot = await getDocs(q);
        const list = [];
        snapshot.forEach((docRef) => {
          list.push({ id: docRef.id, ...docRef.data() });
        });
        setEvents(list);
      } catch (error) {
        console.error("Error fetching auth events:", error);
      }
      setLoading(false);
    };

    fetchEvents();
  }, []);

  const formatEventTime = (item) => {
    if (item?.timestamp?.toDate) {
      return item.timestamp.toDate().toLocaleString();
    }
    if (item?.clientTime) {
      return new Date(item.clientTime).toLocaleString();
    }
    return "N/A";
  };

  if (loading) {
    return (
      <Container className={classes.container}>
        <Box className={classes.loaderContainer}>
          <CircularProgress style={{ color: "#EEBC1D" }} />
        </Box>
      </Container>
    );
  }

  return (
    <Container
      className={classes.container}
      style={{
        backgroundColor: isDarkMode ? "#14161a" : "#faf8f3",
        color: isDarkMode ? "white" : "#000",
        minHeight: "100vh",
      }}
    >
      <Typography variant="h4" className={classes.title}>
        Auth Traffic Log
      </Typography>
      <Typography
        variant="h6"
        style={{ marginBottom: 10, color: "gold", fontFamily: "serif" }}
      >
        Total Events: {events.length}
      </Typography>

      {events.length === 0 ? (
        <Typography
          variant="h6"
          style={{ textAlign: "center", color: "gray", fontFamily: "serif" }}
        >
          No auth events yet
        </Typography>
      ) : (
        <TableContainer
          component={Paper}
          style={{ backgroundColor: isDarkMode ? "#1e1e1e" : "#faf8f3" }}
        >
          <Table>
            <TableHead className={classes.tableHead}>
              <TableRow>
                <TableCell className={classes.tableHeadCell}>Event</TableCell>
                <TableCell className={classes.tableHeadCell}>Email</TableCell>
                <TableCell className={classes.tableHeadCell}>Provider</TableCell>
                <TableCell className={classes.tableHeadCell}>Time</TableCell>
                <TableCell className={classes.tableHeadCell}>User ID</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {events.map((item) => (
                <TableRow
                  key={item.id}
                  style={{
                    backgroundColor: isDarkMode ? "#262626" : "#f5f5f5",
                  }}
                >
                  <TableCell style={{ color: isDarkMode ? "white" : "#000", fontFamily: "serif" }}>
                    {String(item.eventType || "unknown").toUpperCase()}
                  </TableCell>
                  <TableCell style={{ color: isDarkMode ? "white" : "#000", fontFamily: "serif" }}>
                    {item.email || "N/A"}
                  </TableCell>
                  <TableCell style={{ color: isDarkMode ? "white" : "#000", fontFamily: "serif" }}>
                    {item.provider || "unknown"}
                  </TableCell>
                  <TableCell style={{ color: isDarkMode ? "white" : "#000", fontFamily: "serif" }}>
                    {formatEventTime(item)}
                  </TableCell>
                  <TableCell
                    style={{
                      fontSize: 12,
                      wordBreak: "break-all",
                      color: isDarkMode ? "white" : "#000",
                      fontFamily: "serif",
                    }}
                  >
                    {item.uid || "N/A"}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </Container>
  );
};

export default TrafficPage;

