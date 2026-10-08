import type { JSX } from "react";

import { EraScene } from "../features/eras/EraScene";
import { EraTimeline } from "../features/eras/EraTimeline";

export function App(): JSX.Element {
  return (
    <main style={{ position: "relative", minHeight: "100svh", overflow: "hidden" }}>
      <EraScene />

      <header style={{ position: "relative", zIndex: 2, padding: "1.5rem" }}>
        <p style={{ margin: 0, fontSize: "0.68rem", letterSpacing: "0.16em" }}>
          A MUSIC TIME MACHINE
        </p>
        <h1 style={{ margin: "0.2rem 0 0", fontFamily: "Georgia, serif" }}>
          Daydreamin&apos;
        </h1>
      </header>

      <nav
        aria-label="Decade navigation"
        style={{ position: "absolute", zIndex: 2, right: "2rem", top: "50%", transform: "translateY(-50%)" }}
      >
        <EraTimeline />
      </nav>

      <section aria-label="Music player" style={{ position: "relative", zIndex: 2 }} />
    </main>
  );
}
