import { describe, expect, it } from "vitest";

import { ERAS, getAdjacentEra, getEra } from "./eras";

describe("era definitions", () => {
  it("keeps the four eras in chronological product order", () => {
    expect(ERAS.map((era) => era.id)).toEqual([
      "1940s",
      "1970s",
      "2000s",
      "2020s",
    ]);
  });

  it("gives every era distinct presentation and recommendation data", () => {
    expect(new Set(ERAS.map((era) => era.label)).size).toBe(4);
    expect(new Set(ERAS.map((era) => era.sceneUrl)).size).toBe(4);
    expect(new Set(ERAS.map((era) => era.palette.accent)).size).toBe(4);

    for (const era of ERAS) {
      expect(era.recommendationQueries.length).toBeGreaterThan(0);
      expect(era.recommendationQueries.every((query) => query.trim().length > 0)).toBe(
        true,
      );
    }
  });

  it("finds an era by its stable ID", () => {
    expect(getEra("1970s").displayYear).toBe("1977");
  });

  it("steps through eras and clamps at both ends", () => {
    expect(getAdjacentEra("1940s", -1)).toBe("1940s");
    expect(getAdjacentEra("1940s", 1)).toBe("1970s");
    expect(getAdjacentEra("2020s", -1)).toBe("2000s");
    expect(getAdjacentEra("2020s", 1)).toBe("2020s");
  });
});
