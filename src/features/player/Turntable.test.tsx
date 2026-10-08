import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { getEra } from "../eras/eras";
import { Turntable } from "./Turntable";

let reducedMotion = false;
const motionListeners = new Set<() => void>();

function setReducedMotion(matches: boolean): void {
  reducedMotion = matches;
  vi.stubGlobal(
    "matchMedia",
    vi.fn().mockImplementation((query: string) => ({
      get matches() {
        return query === "(prefers-reduced-motion)" && reducedMotion;
      },
      media: query,
      onchange: null,
      addEventListener: (_event: string, listener: () => void) =>
        motionListeners.add(listener),
      removeEventListener: (_event: string, listener: () => void) =>
        motionListeners.delete(listener),
      addListener: vi.fn(),
      removeListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  );
  motionListeners.forEach((listener) => listener());
}

describe("Turntable", () => {
  beforeEach(() => {
    setReducedMotion(false);
  });

  it("provides an accessible play control", async () => {
    const onTogglePlayback = vi.fn();
    const user = userEvent.setup();
    render(
      <Turntable
        era={getEra("1940s")}
        status="paused"
        onTogglePlayback={onTogglePlayback}
      />,
    );

    await user.click(screen.getByRole("button", { name: "Play" }));

    expect(onTogglePlayback).toHaveBeenCalledOnce();
  });

  it("moves the tonearm between resting and playing states", () => {
    const { rerender } = render(
      <Turntable era={getEra("1970s")} status="paused" onTogglePlayback={vi.fn()} />,
    );

    expect(screen.getByTestId("tonearm")).toHaveAttribute("data-state", "resting");

    rerender(
      <Turntable era={getEra("1970s")} status="playing" onTogglePlayback={vi.fn()} />,
    );

    expect(screen.getByTestId("tonearm")).toHaveAttribute("data-state", "playing");
    expect(screen.getByRole("button", { name: "Pause" })).toBeInTheDocument();
  });

  it("updates the record label without changing playback state", () => {
    const { rerender } = render(
      <Turntable era={getEra("1940s")} status="playing" onTogglePlayback={vi.fn()} />,
    );

    rerender(
      <Turntable era={getEra("2000s")} status="playing" onTogglePlayback={vi.fn()} />,
    );

    expect(screen.getByText("BURNED AT HOME")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Pause" })).toBeInTheDocument();
    expect(screen.getByTestId("vinyl")).toHaveAttribute("data-spinning", "true");
  });

  it("disables continuous rotation in reduced-motion mode", () => {
    setReducedMotion(true);

    render(
      <Turntable era={getEra("2020s")} status="playing" onTogglePlayback={vi.fn()} />,
    );

    expect(screen.getByTestId("vinyl")).toHaveAttribute("data-spinning", "false");
    expect(screen.getByTestId("turntable")).toHaveAttribute(
      "data-reduced-motion",
      "true",
    );
  });
});
