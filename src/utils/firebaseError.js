const FIREBASE_ERROR_MAP = {
  "auth/configuration-not-found":
    "Firebase Auth is not configured for this project. Enable Authentication in Firebase Console.",
  "auth/invalid-api-key":
    "Invalid Firebase API key. Update your Firebase web config in environment variables.",
  "auth/api-key-not-valid.-please-pass-a-valid-api-key.":
    "Invalid Firebase API key. Update your Firebase web config in environment variables.",
  "auth/operation-not-allowed":
    "This sign-in method is disabled in Firebase Console. Enable it under Authentication > Sign-in method.",
  "auth/unauthorized-domain":
    "This domain is not authorized for Firebase Auth. Add localhost in Authentication > Settings > Authorized domains.",
  "permission-denied":
    "Firestore denied this request. Check your Firestore rules for authenticated access.",
};

export const getFirebaseErrorMessage = (error, fallback = "Firebase request failed.") => {
  const code = String(error?.code || "").toLowerCase();
  const mapped = FIREBASE_ERROR_MAP[code];
  if (mapped) return mapped;
  return error?.message || fallback;
};

