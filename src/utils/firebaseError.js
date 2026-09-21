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
    "An account with this email already exists! Please switch to the Login tab and sign in.",
  "auth/account-exists-with-different-credential":
    "An account already exists with this email address using a different sign-in method.",
  "auth/credential-already-in-use":
    "This credential is already associated with another user account.",
  "auth/wrong-password":
    "Incorrect password. Please try again.",
  "auth/user-not-found":
    "No account found with this email. Please click Sign Up to create an account.",
  "auth/invalid-credential":
    "Incorrect email or password. If you don't have an account yet, please click Sign Up.",
  "auth/invalid-email":
    "Invalid email format. Please enter a valid email address.",
  "auth/weak-password":
    "Password is too weak. Please use at least 6 characters.",
  "auth/too-many-requests":
    "Too many failed attempts. Please wait a moment before trying again.",
  "auth/network-request-failed":
    "Network error. Please check your internet connection and try again.",
  "auth/popup-closed-by-user":
    "Google sign-in popup was closed before completing authentication.",
  "auth/popup-blocked":
    "Google sign-in popup was blocked by your browser. Please allow popups for this site.",
};

export const getFirebaseErrorMessage = (error, fallback = "Authentication failed.") => {
  const code = String(error?.code || "").toLowerCase();
  const mapped = FIREBASE_ERROR_MAP[code];
  if (mapped) return mapped;
  return error?.message || fallback;
};

