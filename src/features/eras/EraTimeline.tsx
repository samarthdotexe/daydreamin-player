import { LayoutGroup, motion, useReducedMotion } from "motion/react";
import { useRef, useState, type KeyboardEvent, type PointerEvent } from "react";

import { ERAS } from "./eras";
import { useEraStore } from "./eraStore";
import type { EraId } from "./types";
import styles from "./EraTimeline.module.css";

export function EraTimeline() {
  const activeEra = useEraStore((state) => state.activeEra);
  const setEra = useEraStore((state) => state.setEra);
  const stepEra = useEraStore((state) => state.stepEra);
  const reduceMotion = useReducedMotion();
  const [previewEra, setPreviewEra] = useState<EraId | null>(null);
  const dragging = useRef(false);
  const moved = useRef(false);
  const ignoreClick = useRef(false);
  const displayedEra = previewEra ?? activeEra;

  const eraAtPointer = (event: PointerEvent<HTMLDivElement>): EraId => {
    const rect = event.currentTarget.getBoundingClientRect();
    const horizontal = rect.width >= rect.height;
    const position = horizontal
      ? (event.clientX - rect.left) / Math.max(rect.width, 1)
      : (event.clientY - rect.top) / Math.max(rect.height, 1);
    const index = Math.round(Math.min(1, Math.max(0, position)) * (ERAS.length - 1));
    return ERAS[index].id;
  };

  const handlePointerDown = (event: PointerEvent<HTMLDivElement>) => {
    if (event.button !== 0) return;
    dragging.current = true;
    moved.current = false;
    event.currentTarget.setPointerCapture?.(event.pointerId);
    setPreviewEra(eraAtPointer(event));
  };

  const handlePointerMove = (event: PointerEvent<HTMLDivElement>) => {
    if (!dragging.current) return;
    moved.current = true;
    setPreviewEra(eraAtPointer(event));
  };

  const handlePointerUp = (event: PointerEvent<HTMLDivElement>) => {
    if (!dragging.current) return;
    const era = eraAtPointer(event);
    dragging.current = false;
    ignoreClick.current = moved.current;
    setPreviewEra(null);
    setEra(era);
    window.setTimeout(() => { ignoreClick.current = false; }, 0);
  };

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
        data-dragging={String(previewEra !== null)}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={() => { dragging.current = false; setPreviewEra(null); }}
      >
        <div className={styles.rail} aria-hidden="true" />
        {ERAS.map((era) => {
          const selected = era.id === displayedEra;
          return (
            <button
              className={styles.option}
              type="button"
              role="radio"
              aria-checked={selected}
              tabIndex={selected ? 0 : -1}
              data-era-id={era.id}
              key={era.id}
              onClick={() => { if (!ignoreClick.current) setEra(era.id); }}
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
