import { renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { useReducedMotionPolicy } from "./useReducedMotionPolicy";

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

describe("useReducedMotionPolicy", () => {
  beforeEach(() => {
    setReducedMotion(false);
  });

  it("allows ambient continuous movement by default", () => {
    const { result } = renderHook(() => useReducedMotionPolicy());

    expect(result.current).toEqual({ reduce: false, allowContinuous: true });
  });

  it("disables continuous movement when reduced motion is requested", () => {
    setReducedMotion(true);

    const { result } = renderHook(() => useReducedMotionPolicy());

    expect(result.current).toEqual({ reduce: true, allowContinuous: false });
  });
});
