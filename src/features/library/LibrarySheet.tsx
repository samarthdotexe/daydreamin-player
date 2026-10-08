import { BookmarkX, X } from "lucide-react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

import type { AuthUser } from "../../services/firebase/auth";
import { firebaseLibraryRepository, type LibraryRepository } from "../../services/firebase/library";
import { getTrackKey, type Track } from "../player/types";
import { usePlayerStore } from "../player/playerStore";
import styles from "./LibrarySheet.module.css";

interface LibrarySheetProps {
  open: boolean;
  user: AuthUser | null;
  requestedTrack?: Track | null;
  repository?: LibraryRepository;
  onClose: () => void;
}

export function LibrarySheet({ open, user, requestedTrack, repository = firebaseLibraryRepository, onClose }: LibrarySheetProps) {
  const reduceMotion = useReducedMotion();
  const sheetRef = useRef<HTMLElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const returnFocusRef = useRef<HTMLElement | null>(null);
  const [tracks, setTracks] = useState<Track[]>([]);
  const [error, setError] = useState("");
  const playNow = usePlayerStore((state) => state.playNow);

  useEffect(() => repository.subscribe(user?.id ?? "", setTracks), [repository, user?.id]);

  useEffect(() => {
    if (!open) return;
    returnFocusRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const appRoot = document.getElementById("root");
    if (appRoot) appRoot.inert = true;
    const timer = window.setTimeout(() => closeRef.current?.focus(), 0);
    return () => {
      window.clearTimeout(timer);
      if (appRoot) appRoot.inert = false;
    };
  }, [open]);

  useEffect(() => {
    if (!user || !requestedTrack) return;
    void Promise.resolve(repository.save(user.id, requestedTrack))
      .catch(() => setError("This track could not be saved."));
  }, [repository, requestedTrack, user]);

  async function remove(track: Track) {
    if (!user) return;
    try { await repository.remove(user.id, getTrackKey(track)); }
    catch { setError("This track could not be removed."); }
  }

  function close() {
    onClose();
    window.setTimeout(() => returnFocusRef.current?.focus(), 0);
  }

  function trapFocus(event: React.KeyboardEvent) {
    if (event.key === "Escape") {
      close();
      return;
    }
    if (event.key !== "Tab" || !sheetRef.current) return;
    const focusable = Array.from(sheetRef.current.querySelectorAll<HTMLElement>('button:not([disabled]), [href], [tabindex]:not([tabindex="-1"])'));
    const first = focusable[0];
    const last = focusable.at(-1);
    if (event.shiftKey && document.activeElement === first && last) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last && first) {
      event.preventDefault();
      first.focus();
    }
  }

  return createPortal(
    <AnimatePresence>
      {open && (
        <motion.div className={styles.backdrop} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onMouseDown={(event) => { if (event.target === event.currentTarget) close(); }}>
          <motion.aside
            ref={sheetRef}
            className={styles.sheet}
            role="dialog"
            aria-modal="true"
            aria-label="Saved library"
            onKeyDown={trapFocus}
            initial={reduceMotion ? { opacity: 0 } : { opacity: 0, x: 32 }}
            animate={{ opacity: 1, x: 0 }}
            exit={reduceMotion ? { opacity: 0 } : { opacity: 0, x: 28 }}
            transition={{ type: "spring", stiffness: 290, damping: 30 }}
          >
            <header><div><p>Your collection</p><h2>Saved daydreams</h2></div><button ref={closeRef} type="button" onClick={close} aria-label="Close library"><X /></button></header>
            {!user ? (
              <div className={styles.empty}><h3>Sign in to save this track</h3><p>Your music keeps playing while you decide. An account is only needed for cloud saves.</p></div>
            ) : tracks.length === 0 ? (
              <div className={styles.empty}><h3>Nothing saved yet</h3><p>Use the bookmark on any recommendation or search result.</p></div>
            ) : (
              <ul>{tracks.map((track) => <li key={getTrackKey(track)}><button className={styles.track} type="button" onClick={() => playNow(track)}><img src={track.artwork} alt="" /><span><strong>{track.title}</strong><small>{track.artist}</small></span></button><button type="button" onClick={() => void remove(track)} aria-label={`Remove ${track.title}`}><BookmarkX /></button></li>)}</ul>
            )}
            {error && <p role="alert" className={styles.error}>{error}</p>}
          </motion.aside>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body,
  );
}
