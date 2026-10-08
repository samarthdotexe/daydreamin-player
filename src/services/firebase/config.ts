import type { FirebaseApp } from "firebase/app";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

export const firebaseConfigured = Boolean(
  firebaseConfig.apiKey && firebaseConfig.authDomain && firebaseConfig.projectId && firebaseConfig.appId,
);

let appPromise: Promise<FirebaseApp | null> | null = null;

export function getFirebaseApp(): Promise<FirebaseApp | null> {
  if (!firebaseConfigured) return Promise.resolve(null);
  if (!appPromise) {
    appPromise = import("firebase/app").then(({ getApp, getApps, initializeApp }) =>
      getApps().length ? getApp() : initializeApp(firebaseConfig),
    );
  }
  return appPromise;
}
