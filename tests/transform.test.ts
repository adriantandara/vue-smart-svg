import { describe, expect, it } from "vitest";
import { normalizeSvg, stripWidthHeight, toCurrentColor } from "../src/transform";

describe("stripWidthHeight", () => {
  it("removes width and height from the root svg", () => {
    const svg = '<svg width="24" height="24" viewBox="0 0 24 24"><path d="M0 0" /></svg>';
    const result = stripWidthHeight(svg);
    expect(result).not.toMatch(/width=/i);
    expect(result).not.toMatch(/height=/i);
    expect(result).toMatch(/viewBox=/i);
  });
});

describe("toCurrentColor", () => {
  it("replaces fill and stroke values except none", () => {
    const svg = '<svg><path fill="#000" stroke="none" /><path fill="none" stroke="red" /></svg>';
    const result = toCurrentColor(svg);
    expect(result).toContain('fill="currentColor"');
    expect(result).toContain('stroke="currentColor"');
    expect(result).toContain('fill="none"');
    expect(result).toContain('stroke="none"');
  });
});

describe("normalizeSvg", () => {
  it("removes newlines", () => {
    const svg = "<svg>\n  <path />\n</svg>";
    expect(normalizeSvg(svg)).toBe("<svg>  <path /></svg>");
  });
});