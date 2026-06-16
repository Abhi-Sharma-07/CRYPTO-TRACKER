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
  "auth/email-already-in-use":
    "This email already has an account. Please switch to the Login tab instead.",
  "auth/wrong-password":
    "Incorrect password. Please try again.",
  "auth/user-not-found":
    "No account found with this email. Please sign up first.",
  "auth/invalid-credential":
    "Incorrect email or password. Please try again.",
  "auth/weak-password":
    "Password is too weak. Please use at least 6 characters.",
  "auth/too-many-requests":
    "Too many failed attempts. Please wait a moment before trying again.",
  "auth/network-request-failed":
    "Network error. Please check your internet connection and try again.",
  "auth/popup-closed-by-user":
    "Google sign-in was cancelled. Please try again.",
};

export const getFirebaseErrorMessage = (error, fallback = "Firebase request failed.") => {
  const code = String(error?.code || "").toLowerCase();
  const mapped = FIREBASE_ERROR_MAP[code];
  if (mapped) return mapped;
  return error?.message || fallback;
};

