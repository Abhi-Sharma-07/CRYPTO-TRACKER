const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY || "AIzaSyBh_lUZOKIaQg9sNbnMEQDnnMSqg-T2FmU",
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN || "crypto-tracker-96ae3.firebaseapp.com",
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID || "crypto-tracker-96ae3",
  storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET || "crypto-tracker-96ae3.firebasestorage.app",
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID || "561436893716",
  appId: process.env.REACT_APP_FIREBASE_APP_ID || "1:561436893716:web:26e3e64d794e028cb6fd01",
  measurementId: process.env.REACT_APP_FIREBASE_MEASUREMENT_ID || "G-VD30BRBSK0",
};

export default firebaseConfig;
