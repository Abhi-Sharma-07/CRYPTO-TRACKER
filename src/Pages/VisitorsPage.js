import React, { useEffect, useState } from "react";
import { db } from "../firebase";
import { collection, getDocs, query, orderBy } from "firebase/firestore";
import {
  Container,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Typography,
  CircularProgress,
  Box,
} from "@material-ui/core";
import { makeStyles } from "@material-ui/core/styles";
import { useTheme } from "../ThemeContext";

const useStyles = makeStyles({
  container: {
    marginTop: 20,
    padding: 20,
  },
  table: {
    marginTop: 20,
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

const VisitorsPage = () => {
  const classes = useStyles();
  const [signups, setSignups] = useState([]);
  const [loading, setLoading] = useState(true);
  const { isDarkMode } = useTheme();

  useEffect(() => {
    const fetchSignups = async () => {
      try {
        const q = query(
          collection(db, "signups"),
          orderBy("timestamp", "desc")
        );
        const querySnapshot = await getDocs(q);
        const signupList = [];
        querySnapshot.forEach((doc) => {
          signupList.push({
            id: doc.id,
            ...doc.data(),
          });
        });
        setSignups(signupList);
      } catch (error) {
        console.error("Error fetching signups:", error);
      }
      setLoading(false);
    };

    fetchSignups();
  }, []);

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString();
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
        padding: 20,
      }}
    >
      <Typography variant="h4" className={classes.title}>
        📋 User Signups
      </Typography>

      <Typography variant="h6" style={{ marginBottom: 10, color: "gold", fontFamily: "serif" }}>
        Total Signups: {signups.length}
      </Typography>

      {signups.length === 0 ? (
        <Typography variant="h6" style={{ textAlign: "center", color: "gray", fontFamily: "serif" }}>
          No signups yet
        </Typography>
      ) : (
        <TableContainer
          component={Paper}
          className={classes.table}
          style={{
            backgroundColor: isDarkMode ? "#1e1e1e" : "#faf8f3",
          }}
        >
          <Table>
            <TableHead className={classes.tableHead}>
              <TableRow>
                <TableCell className={classes.tableHeadCell}>
                  Email
                </TableCell>
                <TableCell className={classes.tableHeadCell}>
                  Signup Date
                </TableCell>
                <TableCell className={classes.tableHeadCell}>User ID</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {signups.map((signup) => (
                <TableRow
                  key={signup.id}
                  style={{
                    backgroundColor: isDarkMode ? "#262626" : "#f5f5f5",
                    color: isDarkMode ? "white" : "#000",
                  }}
                >
                  <TableCell style={{ color: isDarkMode ? "white" : "#000", fontFamily: "serif" }}>
                    {signup.email}
                  </TableCell>
                  <TableCell style={{ color: isDarkMode ? "white" : "#000", fontFamily: "serif" }}>
                    {formatDate(signup.signupDate)}
                  </TableCell>
                  <TableCell
                    style={{
                      fontSize: "12px",
                      wordBreak: "break-all",
                      color: isDarkMode ? "white" : "#000",
                      fontFamily: "serif",
                    }}
                  >
                    {signup.uid}
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

export default VisitorsPage;
