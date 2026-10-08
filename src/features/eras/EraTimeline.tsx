import { LayoutGroup, motion, useReducedMotion } from "motion/react";
import type { KeyboardEvent } from "react";

import { ERAS } from "./eras";
import { useEraStore } from "./eraStore";
import type { EraId } from "./types";
import styles from "./EraTimeline.module.css";

export function EraTimeline() {
  const activeEra = useEraStore((state) => state.activeEra);
  const setEra = useEraStore((state) => state.setEra);
  const stepEra = useEraStore((state) => state.stepEra);
  const reduceMotion = useReducedMotion();

  const focusEra = (id: EraId) => {
    requestAnimationFrame(() => {
      document.querySelector<HTMLButtonElement>(`[data-era-id="${id}"]`)?.focus();
    });
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLButtonElement>) => {
    let target: EraId | null = null;

    if (event.key === "ArrowRight" || event.key === "ArrowDown") {
      event.preventDefault();
      stepEra(1);
      target = useEraStore.getState().activeEra;
    } else if (event.key === "ArrowLeft" || event.key === "ArrowUp") {
      event.preventDefault();
      stepEra(-1);
      target = useEraStore.getState().activeEra;
    } else if (event.key === "Home") {
      event.preventDefault();
      target = ERAS[0].id;
      setEra(target);
    } else if (event.key === "End") {
      event.preventDefault();
      target = ERAS[ERAS.length - 1].id;
      setEra(target);
    }

    if (target) {
      focusEra(target);
    }
  };

  return (
    <LayoutGroup id="era-timeline">
      <div
        className={styles.timeline}
        role="radiogroup"
        aria-label="Choose a decade"
        data-reduced-motion={String(Boolean(reduceMotion))}
      >
        <div className={styles.rail} aria-hidden="true" />
        {ERAS.map((era) => {
          const selected = era.id === activeEra;
          return (
            <button
              className={styles.option}
              type="button"
              role="radio"
              aria-checked={selected}
              tabIndex={selected ? 0 : -1}
              data-era-id={era.id}
              key={era.id}
              onClick={() => setEra(era.id)}
              onKeyDown={handleKeyDown}
            >
              {selected ? (
                <motion.span
                  className={styles.thumb}
                  layoutId="active-era-thumb"
                  transition={
                    reduceMotion
                      ? { duration: 0 }
                      : { type: "spring", bounce: 0.12, visualDuration: 0.45 }
                  }
                  aria-hidden="true"
                />
              ) : null}
              <span className={styles.year}>{era.id}</span>
              <span className={styles.label}>{era.label}</span>
            </button>
          );
        })}
      </div>
      <span className={styles.status} role="status" aria-live="polite">
        {activeEra} selected
      </span>
    </LayoutGroup>
  );
}
