# vue-smart-svg

Webpack loader that turns `.svg` files into Vue 2 and Vue 3 components, with `?raw` support and automatic Vue version detection.

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
            options: { vueVersion: 3 }
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
            options: { vueVersion: 2 }
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
</template>
```

### Raw SVG string

```js
import raw from "./icon.svg?raw";
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

## Loader options

- `svgo` (default `true`): optimize SVGs with SVGO.
- `defaultSize` (default `24`): fallback size for the `size` prop.
- `replaceColors` (default `true`): replace `fill`/`stroke` with `currentColor` (except `none`).
- `keepViewBox` (default `true`): keep `viewBox` when optimizing.
- `vueVersion` (`2` | `3` | `"auto"`, default `"auto"`): auto-detect; falls back to Vue 3 if `vue/package.json` cannot be found.

## Security note

SVGs are injected via `innerHTML`; use trusted assets only.

## Scripts

- `npm run build` / `pnpm run build`
- `npm run test` / `pnpm run test`
- `npm run dev` / `pnpm run dev` (vitest watch)
