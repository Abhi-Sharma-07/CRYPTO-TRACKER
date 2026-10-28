import { getApp, getApps, initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import firebaseConfig from "./config/firebaseConfig";

let firebaseApp = null;
let auth = null;
let db = null;

try {
  if (firebaseConfig.apiKey && firebaseConfig.apiKey.trim() !== "" && !firebaseConfig.apiKey.includes("your_")) {
    firebaseApp = getApps().length ? getApp() : initializeApp(firebaseConfig);
    auth = getAuth(firebaseApp);
    db = getFirestore(firebaseApp);
  }
} catch (err) {
  console.warn("Firebase initialization skipped or failed:", err.message);
}

export { auth, db };
