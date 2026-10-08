import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  build: {
    // Firestore is an on-demand route chunk; the anonymous player stays below 425 kB.
    chunkSizeWarningLimit: 650,
  },
  server: {
    port: 5173,
  },
});
