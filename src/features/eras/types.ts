export type EraId = "1940s" | "1970s" | "2000s" | "2020s";

export interface EraPalette {
  background: string;
  surface: string;
  ink: string;
  muted: string;
  accent: string;
  glow: string;
}

export interface EraDefinition {
  id: EraId;
  label: string;
  displayYear: string;
  tagline: string;
  palette: EraPalette;
  sceneUrl: string;
  recordLabel: string;
  recommendationQueries: readonly string[];
}
