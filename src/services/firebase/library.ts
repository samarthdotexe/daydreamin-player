import type { Track } from "../../features/player/types";
import { getTrackKey } from "../../features/player/types";
import { getFirebaseApp } from "./config";

export interface LibraryDriver {
  subscribe(path: string, listener: (tracks: Track[]) => void): () => void;
  set(path: string, value: Record<string, unknown>): Promise<void> | void;
  remove(path: string): Promise<void> | void;
}

export interface LibraryRepository {
  subscribe(userId: string, listener: (tracks: Track[]) => void): () => void;
  save(userId: string, track: Track): Promise<void>;
  remove(userId: string, trackKey: string): Promise<void>;
}

export function serializeTrack(track: Track): Record<string, unknown> {
  return Object.fromEntries(
    Object.entries(track).filter(([, value]) => value !== undefined),
  );
}

function requireUser(userId: string): string {
  const normalized = userId.trim();
  if (!normalized) throw new Error("Sign in to update your saved library.");
  return normalized;
}

export function createLibraryRepository(driver: LibraryDriver): LibraryRepository {
  return {
    subscribe(userId, listener) {
      if (!userId.trim()) {
        listener([]);
        return () => undefined;
      }
      return driver.subscribe(`users/${userId}/playlist`, listener);
    },
    async save(userId, track) {
      const owner = requireUser(userId);
      await driver.set(`users/${owner}/playlist/${getTrackKey(track)}`, serializeTrack(track));
    },
    async remove(userId, trackKey) {
      const owner = requireUser(userId);
      await driver.remove(`users/${owner}/playlist/${trackKey}`);
    },
  };
}

const lazyFirestoreDriver: LibraryDriver = {
  subscribe(path, listener) {
    let stopped = false;
    let unsubscribe: () => void = () => undefined;
    void Promise.all([getFirebaseApp(), import("firebase/firestore")]).then(([app, firestore]) => {
      if (stopped) return;
      if (!app) {
        listener([]);
        return;
      }
      const db = firestore.getFirestore(app);
      unsubscribe = firestore.onSnapshot(firestore.collection(db, path), (snapshot) => {
        listener(snapshot.docs.map((item) => item.data() as Track));
      });
    });
    return () => {
      stopped = true;
      unsubscribe();
    };
  },
  async set(path, value) {
    const [app, firestore] = await Promise.all([getFirebaseApp(), import("firebase/firestore")]);
    if (!app) throw new Error("Firebase is not configured.");
    const db = firestore.getFirestore(app);
    await firestore.setDoc(firestore.doc(db, path), value);
  },
  async remove(path) {
    const [app, firestore] = await Promise.all([getFirebaseApp(), import("firebase/firestore")]);
    if (!app) throw new Error("Firebase is not configured.");
    const db = firestore.getFirestore(app);
    await firestore.deleteDoc(firestore.doc(db, path));
  },
};

export const firebaseLibraryRepository = createLibraryRepository(lazyFirestoreDriver);
