# Crypto-tracker

Quick start

1. Copy `.env.example` to a local `.env` and fill in real keys (do NOT commit `.env`).

```bash
cp .env.example .env
# then edit .env and add your real API keys
```

2. Install dependencies and start the local AI server (optional) and client:

```bash
npm install
# if you use the local AI proxy server (Gemini):
npm run ai:server
# in a separate terminal, start the React dev server:
npm start
```

3. For production build:

```bash
npm run build
```

Security notes

- Do not commit `.env` or any secret keys. Use `.env.example` to document required variables.
- If secrets were accidentally committed, rotate the keys immediately and clean history (BFG or git-filter-repo).
- Store production keys in GitHub repository secrets or your deployment platform's secret manager.

Troubleshooting

- If the AI server uses `fetch()` and you see runtime errors, ensure Node.js >= 18 or add a fetch polyfill.
- If market data doesn't appear on navigation, visit the `/news` page and check DevTools → Network for CoinGecko requests.
