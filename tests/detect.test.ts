import { describe, expect, it } from "vitest";
import { detectVueMajor } from "../src/detect";

describe("detectVueMajor", () => {
  it("detects Vue 2 and Vue 3", () => {
    expect(detectVueMajor("2.7.14")).toBe(2);
    expect(detectVueMajor("3.3.4")).toBe(3);
  });

  it("returns null for unknown versions", () => {
    expect(detectVueMajor("4.0.0")).toBeNull();
    expect(detectVueMajor("invalid")).toBeNull();
  });
});