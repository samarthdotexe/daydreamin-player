import type { JSX } from "react";

export function App(): JSX.Element {
  return (
    <main>
      <header>
        <p>Travel through music history.</p>
        <h1>Daydreamin&apos;</h1>
      </header>

      <nav aria-label="Decade navigation" />

      <section aria-label="Music player" />
    </main>
  );
}
