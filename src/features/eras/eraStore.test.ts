import { beforeEach, describe, expect, it } from "vitest";

import { usePlayerStore } from "../player/playerStore";
import { useEraStore } from "./eraStore";

describe("era store", () => {
  beforeEach(() => {
    useEraStore.setState(useEraStore.getInitialState(), true);
    usePlayerStore.setState(usePlayerStore.getInitialState(), true);
  });

  it("steps chronologically and clamps at the endpoints", () => {
    useEraStore.getState().stepEra(-1);
    expect(useEraStore.getState().activeEra).toBe("1940s");

    useEraStore.getState().stepEra(1);
    expect(useEraStore.getState().activeEra).toBe("1970s");
    useEraStore.getState().setEra("2020s");
    useEraStore.getState().stepEra(1);
    expect(useEraStore.getState().activeEra).toBe("2020s");
  });

  it("keeps only the final rapid selection and advances its version", () => {
    const { setEra } = useEraStore.getState();
    setEra("1970s");
    setEra("2000s");
    setEra("2020s");

    expect(useEraStore.getState()).toMatchObject({
      activeEra: "2020s",
      selectionVersion: 3,
    });
  });

  it("does not mutate the playing queue when the era changes", () => {
    usePlayerStore.getState().playNow({
      id: "song",
      provider: "youtube",
      title: "Still Playing",
      artist: "Daydreamin'",
      artwork: "https://example.com/song.jpg",
    });

    useEraStore.getState().setEra("2000s");

    expect(usePlayerStore.getState().queue.map((track) => track.id)).toEqual([
      "song",
    ]);
    expect(usePlayerStore.getState().currentIndex).toBe(0);
  });
});
