# vue-smart-svg

Webpack loader that turns `.svg` files into Vue 2 and Vue 3 components, with raw string imports (`?raw` or `.raw.svg`) and automatic Vue version detection.

## Install

```bash
npm install -D vue-smart-svg
# or
pnpm add -D vue-smart-svg
```

## Webpack setup

### Vue 3

```js
const path = require("path");
const { VueLoaderPlugin } = require("vue-loader");

module.exports = {
  entry: "./src/main.js",
  output: {
    path: path.resolve(__dirname, "dist"),
    filename: "bundle.js",
    clean: true,
    publicPath: "/"
  },
  resolve: { extensions: [".js", ".vue"] },
  module: {
    rules: [
      { test: /\.vue$/, loader: "vue-loader" },
      {
        test: /\.svg$/i,
        resourceQuery: { not: [/url/] },
        use: [
          {
            loader: "vue-smart-svg/loader",
            options: { vueVersion: 3, rawMode: "both" }
          }
        ]
      },
      {
        test: /\.svg$/i,
        resourceQuery: /url/,
        type: "asset/resource"
      }
    ]
  },
  plugins: [new VueLoaderPlugin()]
};
```

### Vue 2

```js
const path = require("path");
const { VueLoaderPlugin } = require("vue-loader");

module.exports = {
  entry: "./src/main.js",
  output: {
    path: path.resolve(__dirname, "dist"),
    filename: "bundle.js",
    clean: true,
    publicPath: "/"
  },
  resolve: {
    extensions: [".js", ".vue"],
    alias: { vue$: "vue/dist/vue.esm.js" }
  },
  module: {
    rules: [
      { test: /\.vue$/, loader: "vue-loader" },
      {
        test: /\.svg$/i,
        resourceQuery: { not: [/url/] },
        use: [
          {
            loader: "vue-smart-svg/loader",
            options: { vueVersion: 2, rawMode: "both" }
          }
        ]
      },
      {
        test: /\.svg$/i,
        resourceQuery: /url/,
        type: "asset/resource"
      }
    ]
  },
  plugins: [new VueLoaderPlugin()]
};
```

## Usage

```vue
<script setup>
import Icon from "./icon.svg";
</script>

<template>
  <Icon class="text-red-500 w-6 h-6" />
  <Icon :size="32" />
  <Icon title="Settings" :decorative="false" />
  <Icon :replaceColors="false" />
</template>
```

### Remote SVG from a URL (runtime)

Use the bundled `RemoteSvg` component when the icon lives on a CDN and you still want sizing/currentColor/title. The loader cannot process `<component is="https://...">` because that string never goes through webpack.

Vue 3:
```vue
<script setup>
import RemoteSvg from "vue-smart-svg/remote";
</script>

<template>
  <RemoteSvg src="https://example.com/icon.svg" class="w-6 h-6 text-blue-500" :size="28" />
</template>
```

Vue 2:
```vue
<script>
import RemoteSvg from "vue-smart-svg/remote-v2";

export default { components: { RemoteSvg } };
</script>

<template>
  <RemoteSvg src="https://example.com/icon.svg" class="w-6 h-6 text-blue-500" :size="28" />
</template>
```

Notes: the component fetches at runtime (requires CORS), strips `width`/`height`, defaults to `currentColor` unless `:replaceColors="false"`, and still supports `title`/`decorative` for accessibility.

#### Optional security layer (signature + sanitization)

If you want stronger protection against CDN tampering/XSS, pass a `security`
object. When present, `RemoteSvg` verifies an Ed25519 signature header, enforces
content-type + size + timestamp checks, and sanitizes the SVG with a strict
allowlist before `innerHTML`.

```vue
<script setup>
import RemoteSvg from "vue-smart-svg/remote";

const security = {
  publicKey: "BASE64_PUBLIC_KEY",
  signatureHeader: "X-Asset-Signature",
  maxAgeMs: 5 * 60 * 1000,
  maxBytes: 256 * 1024
};
</script>

<template>
  <RemoteSvg
    src="https://cdn.example.com/icon.svg"
    class="w-6 h-6 text-blue-500"
    :security="security"
  />
</template>
```

You can also set a global default and omit the prop:

```js
import { setRemoteSvgSecurity } from "vue-smart-svg/remote";

setRemoteSvgSecurity({
  publicKey: "BASE64_PUBLIC_KEY",
  signatureHeader: "X-Asset-Signature",
  maxAgeMs: 5 * 60 * 1000,
  maxBytes: 256 * 1024
});
```

Call this once before mounting your app so the default applies to all
`RemoteSvg` instances.

Vue 2 import:

```js
import { setRemoteSvgSecurity } from "vue-smart-svg/remote-v2";
```

Per-icon `security` props override the global default; pass `:security="null"`
to explicitly disable security for a specific icon.

Expected header format:

```
X-Asset-Signature: ed25519;v=1;ts=1704720000;sig=BASE64(...)
```

Default payload (must match the server):

```
SVG_BYTES + "\n" + PATH + "\n" + CONTENT_TYPE + "\n" + TIMESTAMP
```

`PATH` is the URL pathname + search, `CONTENT_TYPE` is `image/svg+xml`, and
`TIMESTAMP` is the `ts` value from the signature header (seconds since epoch).
Only internal references like `href="#id"` or `url(#id)` survive sanitization.
Ed25519 verification uses WebCrypto; if unavailable, verification fails.
Omit the `security` prop (or set `enabled: false`) to keep the legacy behavior.

### Raw SVG string

```js
// Default: query flag
import rawQuery from "./icon.svg?raw";

// Enable suffix handling with `rawMode: "both"` or `rawMode: "suffix"`
import rawSuffix from "./icon.raw.svg";
```

### URL import

Add a separate rule for `?url`:

```js
{
  test: /\.svg$/i,
  resourceQuery: /url/,
  type: "asset/resource"
}
```

## Examples

Runnable Vue 2 and Vue 3 demos live in `examples/vue2` and `examples/vue3`, both configured with `rawMode: "both"` to showcase `?raw` and `.raw.svg`. Install deps inside each folder and run `npm run dev`.

## Loader options

- `svgo` (default `true`): optimize SVGs with SVGO.
- `defaultSize` (default `24`): fallback size for the `size` prop.
- `replaceColors` (default `true`): replace `fill`/`stroke` with `currentColor` (except `none`); this is also the default for the component prop, so set it to `false` to keep original colors by default and opt in per icon with the `replaceColors` prop.
- `keepViewBox` (default `true`): keep `viewBox` when optimizing.
- `vueVersion` (`2` | `3` | `"auto"`, default `"auto"`): auto-detect; falls back to Vue 3 if `vue/package.json` cannot be found.
- `rawMode` (`"query"` | `"suffix"` | `"both"`, default `"query"`): decide if raw imports are detected via `?raw`, `.raw.svg`, or both.

## Security note

SVGs are injected via `innerHTML`. Use trusted assets only, or enable the
optional `security` layer to enforce signature verification + sanitization.

## Scripts

- `npm run build` / `pnpm run build`
- `npm run test` / `pnpm run test`
- `npm run dev` / `pnpm run dev` (vitest watch)
