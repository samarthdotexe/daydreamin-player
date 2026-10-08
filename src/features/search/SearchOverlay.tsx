import { useQuery } from "@tanstack/react-query";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { Search, X } from "lucide-react";
import { useEffect, useMemo, useRef, useState, type RefObject } from "react";

import { TrackRow } from "../../components/TrackRow";
import { searchCatalog } from "../../services/catalog/catalogClient";
import { usePlayerStore } from "../player/playerStore";
import type { Track } from "../player/types";
import { useRecentSearches } from "./useRecentSearches";
import styles from "./SearchOverlay.module.css";

interface SearchOverlayProps {
  open: boolean;
  onClose: () => void;
  returnFocusRef?: RefObject<HTMLElement | null>;
  onPlay?: (track: Track) => void;
  onPlayNext?: (track: Track) => void;
  onQueue?: (track: Track) => void;
  onSave?: (track: Track) => void;
}

function messageFor(error: unknown): string {
  const code = typeof error === "object" && error && "code" in error ? String(error.code) : "";
  if (code === "offline") return "You appear to be offline. Check your connection and try again.";
  if (code === "quota_exceeded") return "The search limit is resting. Try again a little later.";
  if (code === "rate_limited") return "Too many searches at once. Pause for a moment and try again.";
  return "Search is temporarily unavailable.";
}

export function SearchOverlay({
  open,
  onClose,
  returnFocusRef,
  onPlay,
  onPlayNext,
  onQueue,
  onSave,
}: SearchOverlayProps) {
  const reduceMotion = useReducedMotion();
  const inputRef = useRef<HTMLInputElement>(null);
  const dialogRef = useRef<HTMLElement>(null);
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(-1);
  const { recentSearches, addRecentSearch } = useRecentSearches();
  const storePlay = usePlayerStore((state) => state.playNow);
  const storeNext = usePlayerStore((state) => state.playNext);
  const storeQueue = usePlayerStore((state) => state.enqueue);

  useEffect(() => {
    const timer = window.setTimeout(() => setDebouncedQuery(query.trim()), 300);
    return () => window.clearTimeout(timer);
  }, [query]);

  useEffect(() => {
    if (open) window.setTimeout(() => inputRef.current?.focus(), 0);
  }, [open]);

  const search = useQuery({
    queryKey: ["search", debouncedQuery],
    queryFn: ({ signal }) => searchCatalog(debouncedQuery, signal),
    enabled: open && debouncedQuery.length > 0,
  });
  const items = useMemo(() => search.data?.items ?? [], [search.data]);

  function choose(track: Track) {
    addRecentSearch(debouncedQuery || query);
    (onPlay ?? storePlay)(track);
  }

  function close() {
    onClose();
    returnFocusRef?.current?.focus();
  }

  function onKeyDown(event: React.KeyboardEvent) {
    if (event.key === "Escape") {
      event.preventDefault();
      close();
    } else if (event.key === "ArrowDown" && items.length) {
      event.preventDefault();
      setActiveIndex((current) => (current + 1) % items.length);
    } else if (event.key === "ArrowUp" && items.length) {
      event.preventDefault();
      setActiveIndex((current) => (current <= 0 ? items.length - 1 : current - 1));
    } else if (event.key === "Enter" && activeIndex >= 0 && items[activeIndex]) {
      event.preventDefault();
      choose(items[activeIndex]);
    } else if (event.key === "Tab" && dialogRef.current) {
      const focusable = Array.from(
        dialogRef.current.querySelectorAll<HTMLElement>(
          'button:not([disabled]), input:not([disabled]), [href], [tabindex]:not([tabindex="-1"])',
        ),
      );
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
  }

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className={styles.backdrop}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: reduceMotion ? 0.08 : 0.22 }}
          onMouseDown={(event) => { if (event.target === event.currentTarget) close(); }}
        >
          <motion.section
            ref={dialogRef}
            className={styles.dialog}
            role="dialog"
            aria-modal="true"
            aria-label="Search music"
            onKeyDown={onKeyDown}
            initial={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 24, scale: 0.975 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 16, scale: 0.985 }}
            transition={{ type: "spring", stiffness: 330, damping: 31, mass: 0.82 }}
          >
            <header className={styles.header}>
              <div className={styles.searchField}>
                <Search size={20} aria-hidden="true" />
                <input
                  ref={inputRef}
                  type="search"
                  value={query}
                  onChange={(event) => { setQuery(event.target.value); setActiveIndex(-1); }}
                  placeholder="Song, artist, or mood"
                  aria-label="Search any song"
                />
              </div>
              <button className={styles.close} type="button" onClick={close} aria-label="Close search"><X /></button>
            </header>

            <div className={styles.body}>
              {!query.trim() && recentSearches.length > 0 && (
                <section className={styles.recents} aria-label="Recent searches">
                  <p>Recent searches</p>
                  <div>{recentSearches.map((recent) => (
                    <button key={recent} type="button" onClick={() => setQuery(recent)} aria-label={`Search for ${recent}`}>{recent}</button>
                  ))}</div>
                </section>
              )}
              {debouncedQuery && search.isPending && <p className={styles.state} role="status">Searching the airwaves…</p>}
              {search.error && <p className={styles.state} role="alert">{messageFor(search.error)}</p>}
              {search.data && search.data.items.length === 0 && <p className={styles.state}>No songs found. Try another title or artist.</p>}
              <p className={styles.srOnly} aria-live="polite">
                {activeIndex >= 0 && items[activeIndex] ? `${items[activeIndex].title} selected` : ""}
              </p>
              <div className={styles.results} aria-label="Search results">
                {items.map((track, index) => (
                  <div
                    id={`search-result-${index}`}
                    key={`${track.provider}:${track.id}`}
                    data-active={String(index === activeIndex)}
                  >
                    <TrackRow
                      track={track}
                      onPlay={choose}
                      onPlayNext={onPlayNext ?? storeNext}
                      onQueue={onQueue ?? storeQueue}
                      onSave={onSave ?? (() => undefined)}
                    />
                  </div>
                ))}
              </div>
            </div>
          </motion.section>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
