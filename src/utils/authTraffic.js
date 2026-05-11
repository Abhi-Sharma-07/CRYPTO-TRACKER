import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { db } from "../firebase";

export const logAuthEvent = async ({
  eventType,
  provider,
  userEmail,
  uid,
}) => {
  if (!eventType || !userEmail || !uid) return;

  await addDoc(collection(db, "auth_events"), {
    eventType,
    provider: provider || "unknown",
    email: userEmail,
    uid,
    userAgent: navigator.userAgent || "unknown",
    timestamp: serverTimestamp(),
    clientTime: new Date().toISOString(),
  });
};

