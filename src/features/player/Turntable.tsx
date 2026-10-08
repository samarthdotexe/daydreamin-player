import { Pause, Play } from "lucide-react";
import { motion } from "motion/react";

import type { EraDefinition } from "../eras/types";
import type { PlaybackStatus } from "./types";
import { useReducedMotionPolicy } from "./useReducedMotionPolicy";
import styles from "./Turntable.module.css";

interface TurntableProps {
  era: EraDefinition;
  status: PlaybackStatus;
  onTogglePlayback: () => void;
  disabled?: boolean;
}

const playingStates = new Set<PlaybackStatus>(["loading", "playing"]);

export function Turntable({ era, status, onTogglePlayback, disabled = false }: TurntableProps) {
  const { reduce, allowContinuous } = useReducedMotionPolicy();
  const isPlaying = playingStates.has(status);
  const shouldSpin = isPlaying && allowContinuous;

  return (
    <div
      className={styles.stage}
      data-reduced-motion={String(reduce)}
      data-era={era.id}
      data-testid="turntable"
    >
      <div className={styles.deck}>
        <div className={styles.deckGlow} aria-hidden="true" />
        <div className={styles.platter} aria-hidden="true">
          <motion.div
            className={styles.vinyl}
            data-spinning={String(shouldSpin)}
            data-testid="vinyl"
            animate={{ scale: isPlaying && !reduce ? 1 : 0.992 }}
            transition={{ type: "spring", stiffness: 150, damping: 22 }}
          >
            <span className={styles.grooveOne} />
            <span className={styles.grooveTwo} />
            <span className={styles.grooveThree} />
            <span className={styles.label}>
              <span className={styles.labelName}>{era.recordLabel}</span>
              <span className={styles.labelEra}>{era.displayYear}</span>
            </span>
            <span className={styles.spindle} />
          </motion.div>
        </div>

        <motion.div
          className={styles.tonearm}
          data-state={isPlaying ? "playing" : "resting"}
          data-testid="tonearm"
          initial={false}
          animate={{ rotate: isPlaying ? 13 : -7 }}
          transition={
            reduce
              ? { duration: 0.08 }
              : { type: "spring", stiffness: 72, damping: 18, mass: 1.15 }
          }
          aria-hidden="true"
        >
          <span className={styles.counterweight} />
          <span className={styles.armTube} />
          <span className={styles.headshell} />
        </motion.div>

        <span className={styles.powerLight} data-active={String(isPlaying)} aria-hidden="true" />
        <span className={styles.speedLabel} aria-hidden="true">33</span>
        <button
          className={styles.playButton}
          type="button"
          onClick={onTogglePlayback}
          aria-label={isPlaying ? "Pause" : "Play"}
          aria-pressed={isPlaying}
          disabled={disabled}
        >
          {isPlaying ? <Pause size={18} fill="currentColor" /> : <Play size={18} fill="currentColor" />}
        </button>
      </div>
    </div>
  );
}
