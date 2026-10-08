import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { AnimatePresence, motion } from "motion/react";

import { TrackRow } from "../../components/TrackRow";
import { getEraRecommendations } from "../../services/catalog/catalogClient";
import { usePlayerStore } from "../player/playerStore";
import type { Track } from "../player/types";
import { useEraStore } from "./eraStore";
import styles from "./RecommendationTray.module.css";

function errorMessage(error: unknown): string {
  const code = typeof error === "object" && error && "code" in error ? String(error.code) : "";
  if (code === "quota_exceeded") return "The search limit is resting. Your previous picks are still here.";
  if (code === "offline") return "You appear to be offline. Your previous picks are still here.";
  return "Recommendations could not be refreshed.";
}

export function RecommendationTray() {
  const era = useEraStore((state) => state.activeEra);
  const playNow = usePlayerStore((state) => state.playNow);
  const playNext = usePlayerStore((state) => state.playNext);
  const enqueue = usePlayerStore((state) => state.enqueue);
  const query = useQuery({
    queryKey: ["recommendations", era],
    queryFn: ({ signal }) => getEraRecommendations(era, signal),
    placeholderData: keepPreviousData,
  });

  const saveLater = (_track: Track) => undefined;

  return (
    <aside className={styles.tray} aria-label={`${era} recommendations`}>
      <div className={styles.heading}>
        <div>
          <p>Curated for this decade</p>
          <h2>Needle drops</h2>
        </div>
        {query.isFetching && <span role="status">Tuning in…</span>}
      </div>

      {query.error && (
        <div className={styles.error} role="alert">
          <span>{errorMessage(query.error)}</span>
          <button type="button" onClick={() => query.refetch()}>Try again</button>
        </div>
      )}

      {!query.data && query.isPending ? (
        <div className={styles.skeletons} aria-label="Loading recommendations">
          <i /><i /><i />
        </div>
      ) : null}

      <AnimatePresence mode="popLayout" initial={false}>
        <motion.div
          key={era}
          className={styles.list}
          initial={{ opacity: 0, x: 12 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -8 }}
          transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
        >
          {query.data?.items.map((track) => (
            <TrackRow
              key={`${track.provider}:${track.id}`}
              track={track}
              onPlay={playNow}
              onPlayNext={playNext}
              onQueue={enqueue}
              onSave={saveLater}
              compact
            />
          ))}
        </motion.div>
      </AnimatePresence>
    </aside>
  );
}
