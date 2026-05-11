
## About the Project

Crypto Tracker is a full-featured cryptocurrency tracking web application designed to help users monitor real-time market prices, analyze historical trends, and make informed decisions using AI-powered insights. The platform pulls live data for the top 100 cryptocurrencies ranked by market capitalization and presents it in a clean, intuitive interface with both dark and light themes.

The application was built as a modern single-page application using React for the frontend, Firebase for authentication and data storage, and a custom Node.js proxy server that connects to Google's Gemini AI model for intelligent market analysis.

Whether you are a casual investor looking to check daily prices or an enthusiast who wants to dive deep into momentum scoring and AI-driven analysis, Crypto Tracker provides a streamlined experience without the clutter of traditional trading platforms.

---

## What It Does

### Market Tracking

The core of Crypto Tracker is its real-time market data dashboard. When a user visits the homepage, the app fetches the top 100 cryptocurrencies from the CoinGecko API and displays them in a searchable, paginated table. Each row shows the coin's logo, symbol, current price, 24-hour percentage change, and market capitalization. Positive changes are highlighted in green and negative changes in red, making it easy to scan the market at a glance.

Users can click on any coin to navigate to a dedicated detail page. This page presents the coin's full description, rank, current price, market cap, and an interactive historical price chart. The chart supports four selectable timeframes — 24 hours, 30 days, 3 months, and 1 year — and is rendered using Chart.js with smooth line interpolation, gradient area fills, and hover tooltips that display exact values.

A trending coins carousel on the homepage highlights the top-performing assets with auto-scrolling cards, giving users a quick snapshot of market movers without scrolling through the full table.

### Multi-Currency Support

Users can switch the display currency between US Dollar (USD), Indian Rupee (INR), and Euro (EUR) at any time using a dropdown selector in the navigation bar. The currency selection immediately updates all prices, charts, market cap values, and AI-generated reports across the entire application. The correct currency symbol is automatically applied everywhere.

### User Authentication

The app supports two authentication methods through Firebase — traditional email and password registration, and one-click Google OAuth sign-in. Authentication is handled through a polished modal dialog that cleanly switches between login and signup forms using tab navigation. Form validation catches common errors like weak passwords and already-registered emails, displaying clear error messages mapped from Firebase error codes.

Once logged in, the user's profile avatar appears in the navigation bar. Clicking the avatar opens a sidebar drawer showing account details — display name, email, and profile picture — along with the personal watchlist and a logout button.

### Personal Watchlist

Authenticated users can build a personal watchlist by adding coins from any coin's detail page. The watchlist is stored in Cloud Firestore and syncs in real-time using Firestore's snapshot listeners — if a user adds or removes a coin, the change reflects immediately across all open tabs and devices. The watchlist is displayed inside the user's sidebar drawer, showing each saved coin's name and current price alongside a remove button for easy management.

This real-time sync is powered by Firestore's `onSnapshot` listener, which is established the moment a user logs in and automatically unsubscribed when they log out, preventing memory leaks and unnecessary network usage.

### Rubina AI — Intelligent Market Assistant

One of the standout features is Rubina AI, an AI-powered market intelligence dashboard accessible from the navigation bar. It provides three distinct capabilities organized in a clean card-based layout:

**Market Scanner** — This tool analyzes the top 50 cryptocurrencies using a proprietary scoring algorithm that combines three weighted factors: price momentum (50% weight, derived from the 24-hour percentage change normalized to a -1 to 1 range), trading liquidity (20% weight, calculated as the volume-to-market-cap ratio clamped against a 0.25 benchmark), and market-cap distribution (30% weight, inversely proportional to rank). The algorithm identifies the highest-scoring coin as a suggested buy candidate and presents it with a confidence percentage, current price, and 24-hour movement. This scoring runs entirely on the client side using live CoinGecko data.

**Asset Summary** — Users can select any listed cryptocurrency from a dropdown and generate an instant micro-dossier. The dossier includes the current price, 24-hour high and low, market cap, global rank, and a brief momentum assessment describing whether the coin shows short-term positive momentum or weakness. This feature runs entirely from cached market data without making any additional API calls.

**Query Interface** — This is a free-form text input where users can ask any cryptocurrency-related question in natural language. The prompt is sent through a secure Node.js proxy server to Google's Gemini 2.5 Flash model, and the AI's response is displayed directly on the page in a styled response card. Users can ask about historical events like Bitcoin halvings, technical analysis concepts, blockchain technology comparisons, portfolio strategy, or anything else related to crypto. A loading spinner provides feedback while the AI processes the request.

### Dark and Light Themes

The entire application supports a seamless toggle between dark mode and light mode. Dark mode features a deep black background (#14161a) with gold accent colors, creating a premium trading-terminal aesthetic. Light mode uses a warm cream background (#faf8f3) with black text for comfortable daytime reading. The user's theme preference is saved to localStorage so it persists across browser sessions and page refreshes.

Every component adapts to the active theme — the navigation bar, data tables, price charts, news cards, AI dashboard, authentication forms, and footer all switch their background colors, text colors, border styles, and accent highlights based on the current mode. The theme toggle is accessible via a sun/moon icon button in the navigation bar.

### News and Market Updates

The News page displays the top cryptocurrencies in a visual card grid format, providing an alternative view to the tabular homepage. Each card shows the coin's image, name and symbol, current price, market cap, 24-hour trading volume, absolute price change, and percentage change. Cards feature a subtle hover scale animation for interactivity. Users can load more cards progressively using a "Load More" button and click any card to navigate directly to the coin's detail page.

### Contact Form

The Contact page features a professionally styled form with fields for name, email, subject, and message. All fields are validated before submission. Messages are sent directly via EmailJS — a client-side email service — so no backend email server or SMTP configuration is required. Success and error feedback is displayed through Material-UI snackbar notifications. The page also displays a direct contact email address for users who prefer to reach out manually.

### Admin Features

Users whose email matches the configured admin email environment variable gain access to a protected Traffic page in the navigation bar. This page logs authentication events — signups, logins, and other auth activities — stored in Firestore, allowing the admin to monitor platform usage and user activity. The admin check runs on every render using a simple email comparison utility. Non-admin users who attempt to access the Traffic route are automatically redirected to the homepage via a route guard in the React Router configuration.

### Error Handling and Performance

The application employs several strategies for reliability and performance. React Error Boundaries wrap the coins table and other critical components, preventing a single component crash from taking down the entire page — users see a fallback message instead. All pages are lazy-loaded using React's `Suspense` and `lazy()` for code splitting, meaning the browser only downloads the JavaScript for a page when the user actually navigates to it. API responses are cached in localStorage with currency-specific keys, so returning users see data instantly while fresh data loads in the background. Firebase error codes are mapped to user-friendly messages through a dedicated utility function.

---

## Architecture Overview

### Frontend

The frontend is a React single-page application bootstrapped with Create React App. It uses React Router v5 for client-side navigation with hash-free URLs and all pages lazy-loaded for optimal bundle splitting and initial load performance.

Global state is managed through two React Context providers that wrap the entire component tree. The **CryptoContext** serves as the central data store, holding the coin data array, loading state, selected currency and corresponding symbol, the authenticated Firebase user object, the user's Firestore-synced watchlist array, a fetchCoins function with caching logic, and the alert notification state for snackbar messages. The **ThemeContext** manages the dark/light mode boolean with a toggle function and localStorage persistence. This dual-context pattern keeps concerns separated while allowing any deeply nested component to access shared state without prop drilling.

The UI is built entirely with Material-UI v4 components — AppBar and Toolbar for the navigation bar, Table components for the market data grid, Cards and Grid for the news layout, Paper for content sections, Dialog and Tabs for the authentication modal, Drawer for the user sidebar, TextField for forms, Select for dropdowns, and Snackbar for notifications. All components are styled using Material-UI's `makeStyles` hook with theme-aware conditional styling. Chart.js handles all data visualization through the react-chartjs-2 wrapper library. The trending carousel uses react-alice-carousel with auto-play configuration.

Data fetching follows a cache-first strategy. When coins are fetched from CoinGecko, the response is stored in localStorage with a cache key formatted as `coinsCacheV1_{currency}`. On subsequent visits, cached data is displayed instantly while a fresh fetch runs in the background. Historical chart data follows the same pattern with keys formatted as `history_{coinId}_{currency}_{days}`. This ensures the UI is never blocked by network latency and users always see data immediately.

### Backend — AI Proxy Server

The AI proxy server is a lightweight, zero-dependency Node.js HTTP server built using only the native `http`, `fs`, and `path` modules. It exists for a critical security reason — keeping the Gemini API key on the server side rather than exposing it in browser-accessible JavaScript.

The server implements multiple security layers. CORS origin whitelisting ensures only the configured frontend URLs can make requests. IP-based rate limiting using an in-memory Map allows a maximum of 20 requests per minute per IP address, with automatic cleanup of expired entries via a periodic interval. Request body size is hard-capped at 16 KB to prevent abuse. Prompt length is limited to 2,000 characters. A heuristic prompt-injection guard scans incoming prompts against a set of regular expressions that detect common meta-instruction patterns like "ignore previous instructions" or "you are now" — matching prompts are rejected before reaching the AI. Every response includes security headers including X-Content-Type-Options, X-Frame-Options, X-XSS-Protection, Referrer-Policy, and Cache-Control. When errors occur in the Gemini API call, the full error is logged server-side but only a generic message is returned to the client, preventing API keys and internal details from leaking.

The server also includes a built-in `.env` file loader that reads environment variables without requiring the `dotenv` package, and a health check endpoint at `GET /api/health` for monitoring.

### External Services

The application integrates with three external services:

**CoinGecko API** — The primary data source for all cryptocurrency information. It provides current market prices, market capitalizations, 24-hour trading volumes, price change percentages, historical price charts, coin metadata and descriptions, and trending coin rankings. The app uses the free tier which requires no API key but is subject to rate limiting (approximately 10-30 requests per minute). Four API endpoints are used: coin markets list, single coin details, historical market chart, and trending coins.

**Firebase** — Google's backend-as-a-service platform provides two core services. Firebase Authentication handles user registration and login with support for email/password credentials and Google OAuth providers. Cloud Firestore, a NoSQL document database, stores user watchlists (as arrays of coin IDs keyed by user UID) and authentication traffic logs. Firestore's real-time snapshot listeners enable instant watchlist synchronization across devices.

**Google Gemini API** — Google's generative AI model (Gemini 2.5 Flash) powers the free-form Q&A feature on the AI page. All requests are routed through the AI proxy server which adds the API key, enforces safety settings for harassment, hate speech, sexually explicit content, and dangerous content, and returns the generated text response. The model endpoint used is the `generateContent` method from the Generative Language API.

**EmailJS** — A client-side email delivery service that enables the contact form to send messages directly from the browser without any backend email infrastructure. It uses a service ID, template ID, and public key configured through environment variables.

---

## Tech Stack

### 🖥️ Frontend

| Technology | Version | Role |
|---|---|---|
| **React** | 16.14 | Core UI library — component-based architecture with hooks, Context API for state management, lazy loading with Suspense for code splitting |
| **React Router DOM** | 5.2 | Client-side routing — declarative route definitions, programmatic navigation via useHistory, route guards for admin pages |
| **Material-UI Core** | 4.12 | Component library — AppBar, Tables, Cards, Dialogs, Drawers, TextFields, Buttons, Select, Snackbar, Grid, Paper, Typography |
| **Material-UI Icons** | 4.11 | Icon set — NightsStay and WbSunny for theme toggle, and other UI icons |
| **Material-UI Lab** | 4.0-alpha | Extended components — additional UI elements beyond the core set |
| **Chart.js** | 3.5 | Data visualization engine — line charts with gradient fills, tooltips, axis customization, and responsive resizing |
| **react-chartjs-2** | 3.0 | React wrapper for Chart.js — declarative chart components with prop-based configuration |
| **react-alice-carousel** | 2.5 | Carousel component — auto-playing, responsive slider for trending coin cards |
| **Axios** | 0.21 | HTTP client — used for fetching historical chart data from CoinGecko |
| **react-html-parser** | 2.0 | HTML-to-React converter — safely renders coin descriptions from CoinGecko that contain HTML markup |
| **react-icons** | 4.2 | Extended icon library — additional icon options beyond Material-UI |
| **react-google-button** | 0.7 | Pre-styled Google sign-in button component |
| **react-error-boundary** | 3.1 | Error boundary utility — wraps components to catch rendering errors and display fallback UI |

### 🔥 Backend & Services

| Technology | Version | Role |
|---|---|---|
| **Firebase Auth** | 9.1 | Authentication service — email/password registration, Google OAuth provider, auth state observer for session persistence |
| **Cloud Firestore** | 9.1 | NoSQL document database — real-time watchlist sync via onSnapshot listeners, auth traffic event storage |
| **Node.js HTTP** | Native | AI proxy server — zero-dependency HTTP server with built-in rate limiting, CORS, injection guard, and security headers |
| **Google Gemini API** | 2.5 Flash | Generative AI model — natural language Q&A about cryptocurrency markets, accessed via REST endpoint |
| **EmailJS** | 4.4 | Client-side email — sends contact form submissions directly from the browser using service templates |

### 🛠️ Development & Build

| Technology | Version | Role |
|---|---|---|
| **Create React App** | 4.0 | Build toolchain — Webpack bundling, Babel transpilation, dev server with hot reload, production optimization |
| **PostCSS** | 8.5 | CSS processing — autoprefixing and safe parsing for compatibility |
| **Jest + React Testing Library** | Built-in | Testing framework — unit and component testing (via CRA defaults) |
| **ESLint** | Built-in | Code linting — react-app preset for consistent code quality |

### 🌐 External APIs

| API | Auth Required | Role |
|---|---|---|
| **CoinGecko v3** | No (free tier) | Market data — coin list, prices, market caps, volumes, historical charts, trending rankings |
| **Gemini GenerativeLanguage** | API key | AI responses — natural language content generation for crypto Q&A |
| **EmailJS REST** | Public key | Email delivery — contact form message routing to configured inbox |

---

## Security Highlights

The AI proxy server is hardened with multiple defense layers — CORS origin whitelisting restricts access to configured frontend URLs only, IP-based rate limiting caps usage at 20 requests per minute, request bodies are limited to 16 KB, prompts are capped at 2,000 characters, and a regex-based injection guard blocks common prompt manipulation patterns. Every response includes security headers (X-Content-Type-Options, X-Frame-Options, X-XSS-Protection, Referrer-Policy, Cache-Control: no-store). Internal errors are caught and sanitized so that API keys, stack traces, and server details are never exposed to clients.

All sensitive credentials (Firebase keys, Gemini API key, EmailJS keys, admin email) are stored in environment variables loaded from a `.env` file that is excluded from version control. The `.env.example` template documents all required and optional variables without containing actual secrets. Firebase security rules should be configured to restrict Firestore read and write access to authenticated users only.

---

## License

This project is open-source and available under the [MIT License](LICENSE).

---

<p align="center">
  <strong>Built with ❤️ by Abhi</strong><br />
  <a href="mailto:abhichiku44@gmail.com">abhichiku44@gmail.com</a>
</p>
