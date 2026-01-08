export type RemoteSvgPayloadInput = {
  svgBytes: Uint8Array;
  url: string;
  contentType: string;
  timestamp: string;
};

export type RemoteSvgSecurityOptions = {
  enabled?: boolean;
  publicKey?: string | Uint8Array;
  signatureHeader?: string;
  maxAgeMs?: number;
  maxBytes?: number;
  requireSignature?: boolean;
  sanitize?: boolean;
  pathMode?: "pathname" | "pathname+search";
  payloadBuilder?: (input: RemoteSvgPayloadInput) => Uint8Array | string;
};

type RemoteSvgSecurityResolved = Required<
  Omit<RemoteSvgSecurityOptions, "publicKey" | "payloadBuilder">
> & {
  publicKey?: string | Uint8Array;
  payloadBuilder?: (input: RemoteSvgPayloadInput) => Uint8Array | string;
};

export type RemoteSvgFetchResult = {
  text: string;
  bytes: Uint8Array;
  contentType: string;
  headers: Headers;
  url: string;
};

const DEFAULT_SIGNATURE_HEADER = "X-Asset-Signature";
const DEFAULT_MAX_AGE_MS = 5 * 60 * 1000;
const DEFAULT_MAX_BYTES = 256 * 1024;
const DEFAULT_PATH_MODE: RemoteSvgSecurityResolved["pathMode"] = "pathname+search";
let globalSecurityOptions: RemoteSvgSecurityOptions | null = null;

const FETCH_CACHE = new Map<string, Promise<RemoteSvgFetchResult>>();

const DEFAULT_ALLOWED_TAGS = new Set([
  "svg",
  "g",
  "path",
  "rect",
  "circle",
  "ellipse",
  "line",
  "polyline",
  "polygon",
  "defs",
  "use",
  "symbol",
  "title",
  "desc",
  "lineargradient",
  "radialgradient",
  "stop",
  "clippath",
  "mask",
  "pattern"
]);

const DEFAULT_ALLOWED_ATTRS = new Set([
  "xmlns",
  "xmlns:xlink",
  "viewbox",
  "width",
  "height",
  "x",
  "y",
  "x1",
  "y1",
  "x2",
  "y2",
  "cx",
  "cy",
  "r",
  "rx",
  "ry",
  "d",
  "points",
  "fill",
  "fill-rule",
  "fill-opacity",
  "stroke",
  "stroke-width",
  "stroke-linecap",
  "stroke-linejoin",
  "stroke-miterlimit",
  "stroke-dasharray",
  "stroke-dashoffset",
  "stroke-opacity",
  "opacity",
  "transform",
  "pathlength",
  "clip-path",
  "mask",
  "filter",
  "id",
  "class",
  "preserveaspectratio",
  "vector-effect",
  "shape-rendering",
  "marker-start",
  "marker-mid",
  "marker-end",
  "gradientunits",
  "gradienttransform",
  "offset",
  "stop-color",
  "stop-opacity",
  "href",
  "xlink:href",
  "role",
  "focusable",
  "aria-hidden",
  "aria-label"
]);

type ParsedSignature = {
  algorithm: string;
  version?: string;
  timestamp?: string;
  signature?: string;
};

export function resolveSecurityOptions(
  security?: RemoteSvgSecurityOptions | null,
  fallback?: RemoteSvgSecurityOptions | null
): RemoteSvgSecurityResolved | null {
  const resolvedInput = security === undefined ? fallback : security;
  if (!resolvedInput || resolvedInput.enabled === false) {
    return null;
  }

  return {
    enabled: true,
    publicKey: resolvedInput.publicKey,
    signatureHeader: resolvedInput.signatureHeader || DEFAULT_SIGNATURE_HEADER,
    maxAgeMs: resolvedInput.maxAgeMs ?? DEFAULT_MAX_AGE_MS,
    maxBytes: resolvedInput.maxBytes ?? DEFAULT_MAX_BYTES,
    requireSignature: resolvedInput.requireSignature !== false,
    sanitize: resolvedInput.sanitize !== false,
    pathMode: resolvedInput.pathMode || DEFAULT_PATH_MODE,
    payloadBuilder: resolvedInput.payloadBuilder
  };
}

export function buildCacheKey(src: string, security: RemoteSvgSecurityResolved | null): string {
  return security ? `secure:${src}` : src;
}

export function setRemoteSvgSecurity(options: RemoteSvgSecurityOptions | null): void {
  globalSecurityOptions = options ?? null;
}

export function getRemoteSvgSecurity(): RemoteSvgSecurityOptions | null {
  return globalSecurityOptions;
}

export async function fetchRemoteSvg(
  src: string,
  cacheKey: string
): Promise<RemoteSvgFetchResult> {
  if (typeof fetch !== "function") {
    throw new Error("fetch is not available in this environment");
  }

  if (!FETCH_CACHE.has(cacheKey)) {
    const promise = fetch(src).then(async (response) => {
      if (!response.ok) {
        throw new Error(`Request failed with status ${response.status}`);
      }

      const buffer = await response.arrayBuffer();
      const bytes = new Uint8Array(buffer);
      const decoder = new TextDecoder("utf-8", { fatal: false });
      const text = decoder.decode(bytes);
      const contentType = normalizeContentType(response.headers.get("content-type"));

      return {
        text,
        bytes,
        contentType,
        headers: response.headers,
        url: response.url || src
      };
    });

    FETCH_CACHE.set(cacheKey, promise);
  }

  try {
    return await FETCH_CACHE.get(cacheKey)!;
  } catch (err) {
    FETCH_CACHE.delete(cacheKey);
    throw err;
  }
}

export function clearRemoteSvgCache(cacheKey: string): void {
  FETCH_CACHE.delete(cacheKey);
}

export async function verifyRemoteSvg(
  result: RemoteSvgFetchResult,
  security: RemoteSvgSecurityResolved,
  src: string
): Promise<void> {
  if (security.maxBytes > 0 && result.bytes.byteLength > security.maxBytes) {
    throw new Error(`SVG exceeds max size (${security.maxBytes} bytes)`);
  }

  if (!result.contentType.startsWith("image/svg+xml")) {
    throw new Error(`Invalid content-type "${result.contentType || "unknown"}"`);
  }

  const headerValue = result.headers.get(security.signatureHeader);
  if (!headerValue) {
    if (security.requireSignature) {
      throw new Error(`Missing signature header "${security.signatureHeader}"`);
    }
    return;
  }

  const parsed = parseSignatureHeader(headerValue);
  if (!parsed || parsed.algorithm !== "ed25519") {
    throw new Error("Unsupported signature algorithm");
  }
  if (!parsed.signature) {
    throw new Error("Missing signature value");
  }
  if (!parsed.timestamp) {
    throw new Error("Missing signature timestamp");
  }

  const timestampMs = parseTimestampMs(parsed.timestamp);
  if (!timestampMs) {
    throw new Error("Invalid signature timestamp");
  }
  if (security.maxAgeMs > 0) {
    const age = Math.abs(Date.now() - timestampMs);
    if (age > security.maxAgeMs) {
      throw new Error("Signature timestamp is outside allowed window");
    }
  }

  if (!security.publicKey) {
    throw new Error("Missing public key for signature verification");
  }

  const payloadInput: RemoteSvgPayloadInput = {
    svgBytes: result.bytes,
    url: result.url || src,
    contentType: result.contentType,
    timestamp: parsed.timestamp
  };

  const payloadBytes = toBytes(
    security.payloadBuilder
      ? security.payloadBuilder(payloadInput)
      : buildDefaultPayload(payloadInput, security.pathMode)
  );

  const signatureBytes = base64ToBytes(parsed.signature);
  const publicKeyBytes = toBytes(security.publicKey);

  const valid = await verifyEd25519(publicKeyBytes, signatureBytes, payloadBytes);
  if (!valid) {
    throw new Error("Signature verification failed");
  }
}

export function sanitizeSvg(raw: string, strict = true): string {
  if (!raw) return "";
  if (typeof DOMParser === "undefined" || typeof XMLSerializer === "undefined") {
    return strict ? "" : raw;
  }

  const parser = new DOMParser();
  const doc = parser.parseFromString(raw, "image/svg+xml");
  if (!doc.documentElement || doc.getElementsByTagName("parsererror").length) {
    return "";
  }

  const root = doc.documentElement;
  if (root.nodeName.toLowerCase() !== "svg") {
    return "";
  }

  sanitizeElement(root);
  return new XMLSerializer().serializeToString(root);
}

function sanitizeElement(element: Element): void {
  const tagName = element.tagName.toLowerCase();
  if (!DEFAULT_ALLOWED_TAGS.has(tagName)) {
    element.remove();
    return;
  }

  const attributes = Array.from(element.attributes);
  for (const attr of attributes) {
    const name = attr.name;
    const lowerName = name.toLowerCase();
    const value = attr.value || "";

    if (lowerName.startsWith("on")) {
      element.removeAttribute(name);
      continue;
    }

    if (!DEFAULT_ALLOWED_ATTRS.has(lowerName) && !lowerName.startsWith("aria-")) {
      element.removeAttribute(name);
      continue;
    }

    if ((lowerName === "href" || lowerName === "xlink:href") && !isSafeHref(value)) {
      element.removeAttribute(name);
      continue;
    }

    if (value.toLowerCase().includes("url(") && !isSafeUrlReference(value)) {
      element.removeAttribute(name);
    }
  }

  const children = Array.from(element.childNodes);
  for (const child of children) {
    if (child.nodeType === 8) {
      child.remove();
      continue;
    }
    if (child.nodeType === 1) {
      sanitizeElement(child as Element);
    }
  }
}

function isSafeHref(value: string): boolean {
  const trimmed = value.trim();
  return trimmed.startsWith("#");
}

function isSafeUrlReference(value: string): boolean {
  const regex = /url\(([^)]+)\)/gi;
  let match: RegExpExecArray | null;
  while ((match = regex.exec(value))) {
    const candidate = match[1].trim().replace(/^['"]|['"]$/g, "");
    if (!candidate.startsWith("#")) {
      return false;
    }
  }
  return true;
}

function parseSignatureHeader(value: string): ParsedSignature | null {
  const parts = value
    .split(";")
    .map((part) => part.trim())
    .filter(Boolean);

  if (!parts.length) return null;

  const algorithm = parts[0].toLowerCase();
  const result: ParsedSignature = { algorithm };

  for (const part of parts.slice(1)) {
    const [key, ...rest] = part.split("=");
    if (!key || rest.length === 0) continue;
    const valuePart = rest.join("=").trim();
    const lowerKey = key.trim().toLowerCase();
    if (lowerKey === "v") {
      result.version = valuePart;
    } else if (lowerKey === "ts") {
      result.timestamp = valuePart;
    } else if (lowerKey === "sig") {
      result.signature = unwrapBase64(valuePart);
    }
  }

  return result;
}

function unwrapBase64(value: string): string {
  const trimmed = value.trim();
  if (trimmed.startsWith("BASE64(") && trimmed.endsWith(")")) {
    return trimmed.slice(7, -1);
  }
  return trimmed;
}

function parseTimestampMs(value: string): number | null {
  const numeric = Number(value);
  if (!Number.isFinite(numeric) || numeric <= 0) {
    return null;
  }
  return numeric > 1e12 ? numeric : numeric * 1000;
}

function normalizeContentType(value: string | null): string {
  if (!value) return "";
  return value.split(";")[0].trim().toLowerCase();
}

function buildDefaultPayload(
  input: RemoteSvgPayloadInput,
  pathMode: RemoteSvgSecurityResolved["pathMode"]
): Uint8Array {
  const url = resolveUrl(input.url);
  const path = pathMode === "pathname" ? url.pathname : `${url.pathname}${url.search}`;
  const suffix = `\n${path}\n${input.contentType}\n${input.timestamp}`;
  const encoder = new TextEncoder();
  return concatBytes(input.svgBytes, encoder.encode(suffix));
}

function resolveUrl(value: string): URL {
  try {
    return new URL(value, typeof window !== "undefined" ? window.location.href : "http://localhost");
  } catch {
    return new URL("http://localhost");
  }
}

function concatBytes(first: Uint8Array, second: Uint8Array): Uint8Array {
  const merged = new Uint8Array(first.length + second.length);
  merged.set(first, 0);
  merged.set(second, first.length);
  return merged;
}

function toBytes(value: Uint8Array | ArrayBuffer | string): Uint8Array {
  if (value instanceof Uint8Array) return value;
  if (value instanceof ArrayBuffer) return new Uint8Array(value);

  const trimmed = value.trim();
  if (trimmed.startsWith("-----BEGIN")) {
    const base64 = trimmed.replace(/-----[^-]+-----/g, "").replace(/\s+/g, "");
    return base64ToBytes(base64);
  }

  if (/^[0-9a-f]+$/i.test(trimmed) && trimmed.length % 2 === 0) {
    return hexToBytes(trimmed);
  }

  return base64ToBytes(trimmed);
}

function base64ToBytes(base64: string): Uint8Array {
  if (typeof atob === "function") {
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i += 1) {
      bytes[i] = binary.charCodeAt(i);
    }
    return bytes;
  }

  if (typeof Buffer !== "undefined") {
    return Uint8Array.from(Buffer.from(base64, "base64"));
  }

  throw new Error("Base64 decoding is not available in this environment");
}

function hexToBytes(hex: string): Uint8Array {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < hex.length; i += 2) {
    bytes[i / 2] = parseInt(hex.slice(i, i + 2), 16);
  }
  return bytes;
}

async function verifyEd25519(
  publicKeyBytes: Uint8Array,
  signatureBytes: Uint8Array,
  payloadBytes: Uint8Array
): Promise<boolean> {
  if (typeof crypto === "undefined" || !crypto.subtle) {
    throw new Error("WebCrypto is not available for Ed25519 verification");
  }

  const publicKeyBuffer = Uint8Array.from(publicKeyBytes).buffer;
  const signatureBuffer = Uint8Array.from(signatureBytes).buffer;
  const payloadBuffer = Uint8Array.from(payloadBytes).buffer;

  const key = await crypto.subtle.importKey(
    "raw",
    publicKeyBuffer,
    { name: "Ed25519" },
    false,
    ["verify"]
  );

  return crypto.subtle.verify("Ed25519", key, signatureBuffer, payloadBuffer);
}
