import { describe, expect, it } from "vitest";
import { generateVue2ComponentCode, generateVue3ComponentCode } from "../src/generate";

const svg = '<svg viewBox="0 0 24 24"><path fill="#000" d="M0 0" /></svg>';

describe("generateVue2ComponentCode", () => {
  it("matches snapshot", () => {
    const code = generateVue2ComponentCode(svg, { defaultSize: 24, defaultReplaceColors: true });
    expect(code).toMatchSnapshot();
  });
});

describe("generateVue3ComponentCode", () => {
  it("matches snapshot", () => {
    const code = generateVue3ComponentCode(svg, { defaultSize: 24, defaultReplaceColors: true });
    expect(code).toMatchSnapshot();
  });
});
