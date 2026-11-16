import { getApp, getApps, initializeApp } from "firebase/app";
import { getAuth, signInWithCustomToken, signOut, type Auth } from "firebase/auth";
import { getFirestore, type Firestore } from "firebase/firestore";
import { http } from "@/lib/http";

const config = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

export function isFirebaseChatConfigured(): boolean {
  return Boolean(config.apiKey && config.authDomain && config.projectId && config.appId);
}

function services(): { auth: Auth; db: Firestore } {
  if (!isFirebaseChatConfigured()) throw new Error("Firebase chat is not configured.");
  const app = getApps().length ? getApp() : initializeApp(config);
  return { auth: getAuth(app), db: getFirestore(app) };
}

/** Keeps the Firestore identity aligned with the active Django web session. */
export async function getFirebaseChat(userId: number): Promise<{ auth: Auth; db: Firestore; uid: string }> {
  const { auth, db } = services();
  const expectedUid = String(userId);
  if (auth.currentUser?.uid !== expectedUid) {
    if (auth.currentUser) await signOut(auth);
    const { token } = await http.post<{ token: string }>("/api/messaging/auth/firebase-token/");
    const credential = await signInWithCustomToken(auth, token);
    if (credential.user.uid !== expectedUid) {
      await signOut(auth);
      throw new Error("Unable to open chat for this account.");
    }
  }
  return { auth, db, uid: expectedUid };
}

export async function signOutFirebaseChat(): Promise<void> {
  if (!getApps().length) return;
  await signOut(getAuth(getApp()));
}
