import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import type { CSSProperties } from "react";

import { getEra } from "./eras";
import { useEraStore } from "./eraStore";
import { Turntable } from "../player/Turntable";
import { usePlayerStore } from "../player/playerStore";
import styles from "./EraScene.module.css";

type EraStyle = CSSProperties & {
  "--era-background": string;
  "--era-surface": string;
  "--era-ink": string;
  "--era-muted": string;
  "--era-accent": string;
  "--era-glow": string;
};

export function EraScene() {
  const activeEra = useEraStore((state) => state.activeEra);
  const selectionVersion = useEraStore((state) => state.selectionVersion);
  const reduceMotion = useReducedMotion();
  const era = getEra(activeEra);
  const status = usePlayerStore((state) => state.status);
  const setStatus = usePlayerStore((state) => state.setStatus);
  const palette = era.palette;
  const style: EraStyle = {
    "--era-background": palette.background,
    "--era-surface": palette.surface,
    "--era-ink": palette.ink,
    "--era-muted": palette.muted,
    "--era-accent": palette.accent,
    "--era-glow": palette.glow,
  };

  return (
    <section
      className={styles.scene}
      style={style}
      aria-label={`${era.id} music scene`}
      data-era={era.id}
    >
      <AnimatePresence initial={false} mode="sync">
        <motion.div
          className={styles.backdrop}
          key={`${era.id}-${selectionVersion}`}
          style={{ backgroundImage: `url(${era.sceneUrl})` }}
          initial={reduceMotion ? { opacity: 0 } : { opacity: 0, transform: "scale(1.025)" }}
          animate={{ opacity: 1, transform: "scale(1)" }}
          exit={reduceMotion ? { opacity: 0 } : { opacity: 0, transform: "scale(0.99)" }}
          transition={{ duration: reduceMotion ? 0.12 : 0.62, ease: [0.22, 1, 0.36, 1] }}
          aria-hidden="true"
        />
      </AnimatePresence>

      <div className={styles.scrim} aria-hidden="true" />
      <div className={styles.copy}>
        <p className={styles.kicker}>You are listening to</p>
        <p className={styles.year}>{era.displayYear}</p>
        <p className={styles.tagline}>{era.tagline}</p>
      </div>
      <Turntable
        era={era}
        status={status}
        onTogglePlayback={() => setStatus(status === "playing" ? "paused" : "playing")}
      />
    </section>
  );
}
