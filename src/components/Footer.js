import { Container, Typography, Box } from "@material-ui/core";
import { useTheme } from "../ThemeContext";
import { useHistory } from "react-router-dom";

const Footer = () => {
  const { isDarkMode } = useTheme();
  const history = useHistory();

  return (
    <Box
      component="footer"
      style={{
        marginTop: 40,
        padding: "24px 0",
        backgroundColor: isDarkMode ? "#0f1114" : "#f2e8d5",
        borderTop: isDarkMode ? "1px solid #333" : "1px solid #e0d6c2",
      }}
    >
      <Container
        style={{
          display: "grid",
          gridTemplateColumns: "1.5fr 1fr 1fr",
          gap: 24,
        }}
      >
        <Box>
          <Typography
            variant="h6"
            style={{
              color: isDarkMode ? "white" : "black",
              fontWeight: 700,
              fontFamily: "serif",
            }}
          >
            Crypto Tracker
          </Typography>
          <Typography
            variant="body2"
            style={{
              marginTop: 8,
              color: isDarkMode ? "rgba(255,255,255,0.8)" : "#333",
              lineHeight: 1.6,
              fontFamily: "serif",
            }}
          >
            Track prices, discover market movers, and stay ahead with real-time
            crypto updates.
          </Typography>
        </Box>

        <Box>
          <Typography
            variant="subtitle1"
            style={{ color: isDarkMode ? "white" : "black", fontWeight: 600, fontFamily: "serif" }}
          >
            Quick Links
          </Typography>
          <Box style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 8 }}>
            <Typography
              variant="body2"
              style={{ cursor: "pointer", color: isDarkMode ? "gold" : "black", fontFamily: "serif" }}
              onClick={() => history.push("/news")}
            >
              News
            </Typography>
            <Typography
              variant="body2"
              style={{ cursor: "pointer", color: isDarkMode ? "gold" : "black", fontFamily: "serif" }}
              onClick={() => history.push("/about")}
            >
              About
            </Typography>
            <Typography
              variant="body2"
              style={{ cursor: "pointer", color: isDarkMode ? "gold" : "black", fontFamily: "serif" }}
              onClick={() => history.push("/contact")}
            >
              Contact
            </Typography>
            <Typography
              variant="body2"
              style={{ cursor: "pointer", color: isDarkMode ? "gold" : "black", fontFamily: "serif" }}
              onClick={() => history.push("/ai")}
            >
              Rubina (ai)
            </Typography>
          </Box>
        </Box>

        <Box>
          <Typography
            variant="subtitle1"
            style={{ color: isDarkMode ? "white" : "black", fontWeight: 600, fontFamily: "serif" }}
          >
            Contact
          </Typography>
          <Typography
            variant="body2"
            style={{ marginTop: 8, color: isDarkMode ? "gold" : "black", fontFamily: "serif" }}
          >
            <a
              href="mailto:abhichiku44@gmail.com"
              style={{
                cursor: "pointer",
                color: "inherit",
                textDecoration: "none",
              }}
            >
              abhichiku44@gmail.com
            </a>
          </Typography>
          <Typography
            variant="body2"
            style={{ marginTop: 8, color: isDarkMode ? "rgba(255,255,255,0.8)" : "#333", fontFamily: "serif" }}
          >
            Copyright {new Date().getFullYear()} Crypto Tracker. All rights reserved.
          </Typography>
        </Box>
      </Container>
    </Box>
  );
};

export default Footer;
