## About the Project

Crypto Tracker is a full-featured cryptocurrency tracking web application designed to help users monitor real-time market prices, analyze historical trends, and make informed decisions using AI-powered insights. The platform pulls live data for the top 100 cryptocurrencies ranked by market capitalization and presents it in a clean, intuitive interface with both dark and light themes.

The application was built as a modern single-page application using React for the frontend, Firebase for authentication and data storage, and a custom Node.js proxy server that connects to Google's Gemini AI model for intelligent market analysis.

---

## What It Does

### Market Tracking

The core of Crypto Tracker is its real-time market data dashboard. When a user visits the homepage, the app fetches the top 100 cryptocurrencies from the CoinGecko API and displays them in a searchable, paginated table. Each row shows the coin's logo, symbol, current price, 24-hour percentage change, and market capitalization. Users can click on any coin to view a detailed page with a full description, current statistics, and an interactive historical price chart. The chart supports four timeframes — 24 hours, 30 days, 3 months, and 1 year — and is rendered using Chart.js with smooth line interpolation and gradient fills.

A trending coins carousel on the homepage highlights the top-performing assets with auto-scrolling cards, giving users a quick snapshot of market movers.

### Multi-Currency Support

Users can switch the display currency between US Dollar (USD), Indian Rupee (INR), and Euro (EUR) at any time using a dropdown in the navigation bar. The currency selection immediately updates all prices, charts, and market data across the entire application.

### User Authentication

The app supports two authentication methods through Firebase — traditional email and password registration, and one-click Google OAuth sign-in. Authentication is handled through a modal dialog that switches between login and signup forms. Once logged in, users see their profile avatar in the navigation bar, which opens a sidebar drawer showing their account details and personal watchlist.

### Personal Watchlist

Authenticated users can build a personal watchlist by adding coins from the detail page. The watchlist is stored in Cloud Firestore and syncs in real-time — if a user adds or removes a coin, the change reflects immediately across all open tabs. The watchlist is displayed inside the user's sidebar drawer, showing each coin's name and current price with a remove button.

### Rubina AI — Intelligent Market Assistant

One of the standout features is Rubina AI, an AI-powered market intelligence dashboard accessible from the navigation bar. It provides three distinct capabilities:

**Market Scanner** — This tool analyzes the top 50 cryptocurrencies using a proprietary scoring algorithm that combines three factors: price momentum (50% weight based on 24-hour change), trading liquidity (20% weight based on volume-to-market-cap ratio), and market-cap rank (30% weight). It then identifies the highest-scoring coin as a suggested buy candidate along with a confidence percentage.

**Asset Summary** — Users can select any listed cryptocurrency from a dropdown and generate an instant micro-dossier. The dossier includes the current price, 24-hour range, market cap, rank, and a brief momentum assessment — all computed from the latest live data without needing an AI call.

**Query Interface** — This is a free-form text input where users can ask any cryptocurrency-related question. The prompt is sent through a secure Node.js proxy server to Google's Gemini 2.5 Flash model, and the AI response is displayed directly on the page. Users can ask about historical events, technical analysis concepts, blockchain technology, or market strategy.

### Dark and Light Themes

The entire application supports a toggle between dark mode (dark background with gold accents) and light mode (warm cream background with black text). The user's theme preference is saved to local storage so it persists across browser sessions. Every component — from the navigation bar and tables to charts and cards — adapts its colors based on the active theme.

### News and Market Updates

The News page displays the top cryptocurrencies in a visual card grid format. Each card shows the coin's image, name, current price, market cap, 24-hour trading volume, and percentage change. Users can load more cards progressively and click any card to navigate to the coin's detail page.

### Contact Form

The Contact page features a form with fields for name, email, subject, and message. Submissions are sent directly via EmailJS — a client-side email service — so no backend email server is required. Success and error feedback is displayed through snackbar notifications.

### Admin Features

Users whose email matches the configured admin email gain access to a protected Traffic page. This page logs authentication events (signups, logins) stored in Firestore, allowing the admin to monitor platform activity. Non-admin users who try to access this page are automatically redirected to the homepage.

---

## Architecture Overview

### Frontend

The frontend is a React single-page application bootstrapped with Create React App. It uses React Router for client-side navigation with all pages lazy-loaded using React's `Suspense` and `lazy()` for optimal bundle splitting and performance.

Global state is managed through two React Context providers. The **CryptoContext** holds the coin data array, loading state, selected currency and symbol, the authenticated user object, the user's watchlist, and alert notification state. The **ThemeContext** manages the dark/light mode preference with a toggle function. Both contexts wrap the entire application so any component can access shared state without prop drilling.

The UI is built with Material-UI v4 components — AppBar for navigation, Tables for market data, Cards for news, Paper for content sections, Dialogs for authentication, and Drawers for the user sidebar. Chart.js handles all data visualization through the react-chartjs-2 wrapper. The trending carousel uses the react-alice-carousel library.

Data fetching uses a cache-first strategy. When coins are fetched from CoinGecko, the response is stored in `localStorage` with a cache key based on the selected currency. On subsequent visits, cached data is displayed instantly while a fresh fetch runs in the background, ensuring the UI is never blocked by network latency.

### Backend (AI Proxy Server)

The AI proxy server is a lightweight Node.js HTTP server with no external dependencies. It exists to keep the Gemini API key secure on the server side rather than exposing it in the browser. The server implements multiple security layers: CORS origin whitelisting, IP-based rate limiting (20 requests per minute), request body size limits (16 KB), prompt length caps (2,000 characters), a heuristic prompt-injection guard that blocks common meta-instruction patterns, and security headers on every response. Internal errors are caught and sanitized so that API keys and stack traces are never leaked to clients.

### External Services

The application integrates with three external services:

- **CoinGecko API** — Provides all cryptocurrency market data including current prices, market caps, trading volumes, historical price charts, and coin metadata. Used on the free tier with no API key required.

- **Firebase** — Handles user authentication (email/password and Google OAuth) and provides Cloud Firestore for real-time data storage. The Firestore database stores user watchlists and authentication traffic logs.

- **Google Gemini API** — Powers the free-form AI Q&A feature through the Gemini 2.5 Flash model. All requests are routed through the AI proxy server for security.

---



## Tech Stack

- **React 16.14**  
  **Use:** Building the frontend UI.  
  **Why:** Supports Hooks, component-based architecture, and lazy loading for better performance.

- **React Router DOM 5**  
  **Use:** Managing page navigation.  
  **Why:** Enables smooth client-side routing without page reloads.

- **Material-UI 4**  
  **Use:** Designing responsive UI components.  
  **Why:** Provides ready-made modern components and faster UI development.

- **Chart.js 3 + react-chartjs-2**  
  **Use:** Creating interactive charts and graphs.  
  **Why:** Helps visualize cryptocurrency price trends effectively.

- **react-alice-carousel**  
  **Use:** Displaying trending coins in a carousel.  
  **Why:** Adds smooth auto-scrolling and improves user experience.

- **Firebase Auth 9**  
  **Use:** User authentication system.  
  **Why:** Supports secure Email/Password login and Google OAuth integration.

- **Cloud Firestore**  
  **Use:** Storing watchlist and user-related data.  
  **Why:** Provides real-time database synchronization and scalability.

- **Node.js HTTP Server**  
  **Use:** Backend server for API handling.  
  **Why:** Secures Gemini API keys and manages backend requests efficiently.

- **Google Gemini 2.5 Flash**  
  **Use:** AI-powered market question answering.  
  **Why:** Generates intelligent natural language responses for users.

- **EmailJS**  
  **Use:** Sending contact form emails directly from frontend.  
  **Why:** Eliminates the need for a dedicated email backend service.

- **React Context API**  
  **Use:** Managing global application state.  
  **Why:** Simplifies state sharing across components without Redux.


## Security Highlights

The AI proxy server is hardened with CORS origin whitelisting, IP-based rate limiting, request body size limits, prompt length caps, prompt-injection pattern detection, and standard security headers. Internal errors are never exposed to clients. All sensitive keys are stored in environment variables and excluded from version control via `.gitignore`. Firebase security rules should be configured to restrict database access to authenticated users only.

---

## License

This project is open-source and available under the [MIT License](LICENSE)
"mailto:abhichiku44@gmail.com"