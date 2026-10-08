import type { EraDefinition, EraId } from "./types";

export const ERAS = [
  {
    id: "1940s",
    label: "The golden hour",
    displayYear: "1946",
    tagline: "Big bands, velvet voices, and songs built to last.",
    palette: {
      background: "#251914",
      surface: "#6d4a34",
      ink: "#fff3da",
      muted: "#cdb995",
      accent: "#d7a44b",
      glow: "#ffcc73",
    },
    sceneUrl: "/assets/eras/1940s-scene.webp",
    recordLabel: "MIDNIGHT RADIO",
    recommendationQueries: [
      "iconic 1940s jazz standards",
      "1940s big band classics",
      "1940s vocal jazz essentials",
    ],
  },
  {
    id: "1970s",
    label: "Electric freedom",
    displayYear: "1977",
    tagline: "Soul, disco, rock, and warm analog afternoons.",
    palette: {
      background: "#2a160c",
      surface: "#8b4424",
      ink: "#fff1cf",
      muted: "#d8ae78",
      accent: "#ed6a32",
      glow: "#ff9f45",
    },
    sceneUrl: "/assets/eras/1970s-scene.webp",
    recordLabel: "SUNSET STEREO",
    recommendationQueries: [
      "iconic 1970s soul and disco",
      "1970s classic rock essentials",
      "1970s funk hits",
    ],
  },
  {
    id: "2000s",
    label: "Millennium mixtape",
    displayYear: "2004",
    tagline: "Burned CDs, music television, and instant nostalgia.",
    palette: {
      background: "#121d29",
      surface: "#7f9daf",
      ink: "#f5fbff",
      muted: "#b4cad6",
      accent: "#57b4d8",
      glow: "#8be0ff",
    },
    sceneUrl: "/assets/eras/2000s-scene.webp",
    recordLabel: "BURNED AT HOME",
    recommendationQueries: [
      "iconic 2000s pop songs",
      "2000s alternative rock essentials",
      "2000s rnb classics",
    ],
  },
  {
    id: "2020s",
    label: "Right now",
    displayYear: "2026",
    tagline: "Borderless sounds for the always-on generation.",
    palette: {
      background: "#101417",
      surface: "#4e625e",
      ink: "#f1fff9",
      muted: "#a5beb5",
      accent: "#68d7ad",
      glow: "#8effd4",
    },
    sceneUrl: "/assets/eras/2020s-scene.webp",
    recordLabel: "DAYDREAMIN' NOW",
    recommendationQueries: [
      "best 2020s songs",
      "2020s alternative pop essentials",
      "2020s global hits",
    ],
  },
] as const satisfies readonly EraDefinition[];

export function getEra(id: EraId): EraDefinition {
  const era = ERAS.find((candidate) => candidate.id === id);

  if (!era) {
    throw new Error(`Unknown era: ${id}`);
  }

  return era;
}

export function getAdjacentEra(id: EraId, direction: -1 | 1): EraId {
  const index = ERAS.findIndex((era) => era.id === id);
  const target = Math.min(Math.max(index + direction, 0), ERAS.length - 1);

  return ERAS[target].id;
}

export type { EraDefinition, EraId } from "./types";
