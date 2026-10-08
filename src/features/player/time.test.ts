import { describe, expect, it } from "vitest";

import { formatTime } from "./time";

describe("formatTime", () => {
  it.each([
    [0, "0:00"],
    [65, "1:05"],
    [Number.POSITIVE_INFINITY, "0:00"],
    [Number.NaN, "0:00"],
    [-8, "0:00"],
  ])("formats %s seconds as %s", (seconds, expected) => {
    expect(formatTime(seconds)).toBe(expected);
  });
});
