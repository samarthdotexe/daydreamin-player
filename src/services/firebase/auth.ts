import { getFirebaseApp } from "./config";

export interface AuthUser {
  id: string;
  displayName: string;
  email?: string;
  photoUrl?: string;
}

export interface AuthService {
  subscribe(listener: (user: AuthUser | null) => void): () => void;
  signIn(): Promise<void>;
  signOut(): Promise<void>;
}

function mapUser(user: { uid: string; displayName: string | null; email: string | null; photoURL: string | null }): AuthUser {
  return {
    id: user.uid,
    displayName: user.displayName || user.email || "Listener",
    ...(user.email ? { email: user.email } : {}),
    ...(user.photoURL ? { photoUrl: user.photoURL } : {}),
  };
}

export const firebaseAuthService: AuthService = {
  subscribe(listener) {
    let stopped = false;
    let unsubscribe: () => void = () => undefined;
    void getFirebaseApp().then(async (app) => {
      if (stopped) return;
      if (!app) {
        listener(null);
        return;
      }
      const authSdk = await import("firebase/auth");
      if (stopped) return;
      unsubscribe = authSdk.onAuthStateChanged(
        authSdk.getAuth(app),
        (user) => listener(user ? mapUser(user) : null),
      );
    });
    return () => {
      stopped = true;
      unsubscribe();
    };
  },
  async signIn() {
    const [app, { getAuth, GoogleAuthProvider, signInWithPopup }] = await Promise.all([
      getFirebaseApp(),
      import("firebase/auth"),
    ]);
    if (!app) throw new Error("Firebase is not configured.");
    await signInWithPopup(getAuth(app), new GoogleAuthProvider());
  },
  async signOut() {
    const [app, { getAuth, signOut }] = await Promise.all([
      getFirebaseApp(),
      import("firebase/auth"),
    ]);
    if (!app) return;
    await signOut(getAuth(app));
  },
};
