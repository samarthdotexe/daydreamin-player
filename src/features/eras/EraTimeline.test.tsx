import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { useEraStore } from "./eraStore";
import { EraTimeline } from "./EraTimeline";

let reducedMotion = false;
const motionListeners = new Set<() => void>();

function setReducedMotion(matches: boolean): void {
  reducedMotion = matches;
  vi.stubGlobal(
    "matchMedia",
    vi.fn().mockImplementation((query: string) => ({
      get matches() {
        return query === "(prefers-reduced-motion)" ? reducedMotion : false;
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

describe("EraTimeline", () => {
  beforeEach(() => {
    useEraStore.setState(useEraStore.getInitialState(), true);
    setReducedMotion(false);
  });

  it("exposes one selected decade in an accessible radiogroup", () => {
    render(<EraTimeline />);

    expect(screen.getByRole("radiogroup", { name: "Choose a decade" })).toBeInTheDocument();
    expect(screen.getAllByRole("radio")).toHaveLength(4);
    expect(screen.getByRole("radio", { name: /1940s/i })).toHaveAttribute(
      "aria-checked",
      "true",
    );
    expect(screen.getByRole("status")).toHaveTextContent("1940s selected");
  });

  it("selects a decade by click", async () => {
    const user = userEvent.setup();
    render(<EraTimeline />);

    await user.click(screen.getByRole("radio", { name: /2000s/i }));

    expect(useEraStore.getState().activeEra).toBe("2000s");
    expect(screen.getByRole("status")).toHaveTextContent("2000s selected");
  });

  it("supports Arrow, Home, and End keyboard navigation", () => {
    render(<EraTimeline />);
    const first = screen.getByRole("radio", { name: /1940s/i });

    fireEvent.keyDown(first, { key: "ArrowRight" });
    expect(useEraStore.getState().activeEra).toBe("1970s");
    fireEvent.keyDown(screen.getByRole("radio", { name: /1970s/i }), {
      key: "End",
    });
    expect(useEraStore.getState().activeEra).toBe("2020s");
    fireEvent.keyDown(screen.getByRole("radio", { name: /2020s/i }), {
      key: "Home",
    });
    expect(useEraStore.getState().activeEra).toBe("1940s");
  });

  it("marks the timeline when reduced motion is requested", () => {
    setReducedMotion(true);
    render(<EraTimeline />);

    expect(screen.getByRole("radiogroup", { name: "Choose a decade" })).toHaveAttribute(
      "data-reduced-motion",
      "true",
    );
  });
});
