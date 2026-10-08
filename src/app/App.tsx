import { Search } from "lucide-react";
import { useCallback, useRef, useState, type JSX } from "react";

import { EraScene } from "../features/eras/EraScene";
import { EraTimeline } from "../features/eras/EraTimeline";
import { RecommendationTray } from "../features/eras/RecommendationTray";
import { SearchOverlay } from "../features/search/SearchOverlay";
import { PlayerDock } from "../features/player/PlayerDock";
import type { Track } from "../features/player/types";
import { AuthMenu } from "../features/auth/AuthMenu";
import type { AuthUser } from "../services/firebase/auth";
import { LibrarySheet } from "../features/library/LibrarySheet";
import { QueryProvider } from "./QueryProvider";
import styles from "./App.module.css";

function Experience(): JSX.Element {
  const [searchOpen, setSearchOpen] = useState(false);
  const [libraryOpen, setLibraryOpen] = useState(false);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [requestedTrack, setRequestedTrack] = useState<Track | null>(null);
  const searchButtonRef = useRef<HTMLButtonElement>(null);
  const handleUserChange = useCallback((nextUser: AuthUser | null) => setUser(nextUser), []);
  const saveTrack = useCallback((track: Track) => {
    setRequestedTrack(track);
    setLibraryOpen(true);
  }, []);

  return (
    <main className={styles.app}>
      <EraScene />

      <header className={styles.header}>
        <div className={styles.brand}>
          <p>A music time machine</p>
          <h1>Daydreamin&apos;</h1>
        </div>
        <button
          ref={searchButtonRef}
          className={styles.searchButton}
          type="button"
          onClick={() => setSearchOpen(true)}
        >
          <Search size={17} />
          <span>Search any song</span>
          <kbd>⌘ K</kbd>
        </button>
        <AuthMenu
          onUserChange={handleUserChange}
          onOpenLibrary={() => { setRequestedTrack(null); setLibraryOpen(true); }}
        />
      </header>

      <nav aria-label="Decade navigation" className={styles.timeline}>
        <EraTimeline />
      </nav>

      <RecommendationTray onSave={saveTrack} />
      <section aria-label="Music player" className={styles.playerRegion}>
        <PlayerDock />
      </section>
      <SearchOverlay
        open={searchOpen}
        onClose={() => setSearchOpen(false)}
        returnFocusRef={searchButtonRef}
        onSave={saveTrack}
      />
      <LibrarySheet
        open={libraryOpen}
        user={user}
        requestedTrack={requestedTrack}
        onClose={() => { setLibraryOpen(false); setRequestedTrack(null); }}
      />
    </main>
  );
}

export function App(): JSX.Element {
  return <QueryProvider><Experience /></QueryProvider>;
}
