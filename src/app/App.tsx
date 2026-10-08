import { Search } from "lucide-react";
import { useRef, useState, type JSX } from "react";

import { EraScene } from "../features/eras/EraScene";
import { EraTimeline } from "../features/eras/EraTimeline";
import { RecommendationTray } from "../features/eras/RecommendationTray";
import { SearchOverlay } from "../features/search/SearchOverlay";
import { QueryProvider } from "./QueryProvider";
import styles from "./App.module.css";

function Experience(): JSX.Element {
  const [searchOpen, setSearchOpen] = useState(false);
  const searchButtonRef = useRef<HTMLButtonElement>(null);

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
      </header>

      <nav aria-label="Decade navigation" className={styles.timeline}>
        <EraTimeline />
      </nav>

      <RecommendationTray />
      <section aria-label="Music player" className={styles.playerRegion} />
      <SearchOverlay
        open={searchOpen}
        onClose={() => setSearchOpen(false)}
        returnFocusRef={searchButtonRef}
      />
    </main>
  );
}

export function App(): JSX.Element {
  return <QueryProvider><Experience /></QueryProvider>;
}
