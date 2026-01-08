import { describe, expect, it } from "vitest";
import { resolveSecurityOptions, sanitizeSvg } from "../src/remote-security";

describe("remote security helpers", () => {
  it("uses fallback defaults when security is undefined", () => {
    const fallback = { publicKey: "test-key" };
    const resolved = resolveSecurityOptions(undefined, fallback);

    expect(resolved).not.toBeNull();
    expect(resolved?.publicKey).toBe("test-key");
    expect(resolved?.signatureHeader).toBe("X-Asset-Signature");
    expect(resolved?.requireSignature).toBe(true);
    expect(resolved?.sanitize).toBe(true);
  });

  it("disables security when explicitly null", () => {
    const fallback = { publicKey: "test-key" };
    const resolved = resolveSecurityOptions(null, fallback);
    expect(resolved).toBeNull();
  });

  it("returns empty string in strict mode without DOMParser", () => {
    const original = (globalThis as any).DOMParser;
    const originalSerializer = (globalThis as any).XMLSerializer;
    try {
      delete (globalThis as any).DOMParser;
      delete (globalThis as any).XMLSerializer;
      const result = sanitizeSvg("<svg></svg>", true);
      expect(result).toBe("");
    } finally {
      if (original) (globalThis as any).DOMParser = original;
      if (originalSerializer) (globalThis as any).XMLSerializer = originalSerializer;
    }
  });

  it("returns raw svg when strict=false and no DOMParser", () => {
    const original = (globalThis as any).DOMParser;
    const originalSerializer = (globalThis as any).XMLSerializer;
    try {
      delete (globalThis as any).DOMParser;
      delete (globalThis as any).XMLSerializer;
      const raw = "<svg></svg>";
      const result = sanitizeSvg(raw, false);
      expect(result).toBe(raw);
    } finally {
      if (original) (globalThis as any).DOMParser = original;
      if (originalSerializer) (globalThis as any).XMLSerializer = originalSerializer;
    }
  });
});
