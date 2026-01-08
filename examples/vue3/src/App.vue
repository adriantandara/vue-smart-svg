<template>
  <div class="min-h-screen flex justify-center items-center min-h-full bg-gradient-to-b from-slate-950 via-slate-930 to-slate-900 text-slate-100">
    <div class="max-w-5xl mx-auto px-6 py-10 space-y-10">
      <header class="text-center space-y-3">
        <p class="text-xs font-semibold text-emerald-300">vue-smart-svg · Vue 3</p>
        <h1 class="text-4xl font-bold tracking-tight">Smart SVG Loader</h1>
        <p class="text-slate-400 text-sm">Test replaceColors per icon and raw imports in a compact theme</p>
      </header>

      <section class="rounded-2xl border border-slate-800 bg-slate-900/70 backdrop-blur p-6 space-y-4">
        <div class="flex flex-col items-center gap-3 text-center sm:flex-row sm:justify-between sm:text-left">
          <div>
            <h2 class="text-xl font-semibold">Generated components</h2>
            <p class="text-slate-400 text-sm">Same icon, three different behaviors</p>
          </div>
          <span class="text-xs text-slate-400">Source stroke: #a855f7</span>
        </div>
        <div class="grid gap-3 md:grid-cols-3">
          <article
            v-for="row in rows"
            :key="row.id"
            class="rounded-xl border border-slate-800 bg-slate-900 p-4 space-y-3 text-center"
          >
            <div class="flex flex-col items-center gap-3">
              <Icon
                class="w-12 h-12"
                :class="row.iconClass"
                :replaceColors="row.replaceColors"
                :title="row.title"
              />
              <span class="font-semibold">{{ row.title }}</span>
              <p class="text-slate-400 text-sm">{{ row.subtitle }}</p>
            </div>
            <dl class="space-y-2 text-sm text-slate-300">
              <div class="flex items-center justify-center gap-2">
                <dt class="text-slate-500">class</dt>
                <dd><code class="rounded bg-slate-800 px-2 py-1 font-mono text-xs">{{ row.iconClass }}</code></dd>
              </div>
              <div class="flex items-center justify-center gap-2">
                <dt class="text-slate-500">replaceColors</dt>
                <dd><code class="rounded bg-slate-800 px-2 py-1 font-mono text-xs">{{ row.replaceColorsLabel }}</code></dd>
              </div>
            </dl>
            <p class="text-sm text-slate-200">{{ row.note }}</p>
          </article>
        </div>
      </section>

      <section class="rounded-2xl border border-slate-800 bg-slate-900/70 backdrop-blur p-6 space-y-4">
        <div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 class="text-xl font-semibold">Remote SVG (runtime)</h2>
            <p class="text-slate-400 text-sm">Fetched from CDN, still sized and colorized</p>
          </div>
          <span class="text-xs text-slate-400 break-all">{{ remoteSrc }}</span>
        </div>
        <div class="grid gap-4 md:grid-cols-2">
          <article
            v-for="row in remoteRows"
            :key="row.id"
            class="rounded-xl border border-slate-800 bg-slate-900 p-4 space-y-3 text-center"
          >
            <div class="flex flex-col items-center gap-3">
              <RemoteSvg
                :src="remoteSrc"
                :security="remoteSecurity"
                class="w-12 h-12"
                :class="row.iconClass"
                :replaceColors="row.replaceColors"
                :title="row.title"
              />
              <span class="font-semibold">{{ row.title }}</span>
              <p class="text-slate-400 text-sm">{{ row.subtitle }}</p>
            </div>
            <p class="text-sm text-slate-200">{{ row.note }}</p>
          </article>
        </div>
        <p class="text-xs text-slate-500">
          Needs CORS on the CDN; falls back silently if fetch fails (check console). Optional security
          is disabled in this demo because the CDN does not send signatures.
        </p>
      </section>

      <section class="grid gap-4 md:grid-cols-2">
        <article class="rounded-2xl border border-slate-800 bg-slate-900/80 p-5 space-y-3">
          <div class="flex items-center justify-between">
            <div>
              <h3 class="text-lg font-semibold">Raw SVG (?raw)</h3>
              <p class="text-slate-400 text-sm">Query flag import as string</p>
            </div>
            <span class="text-[11px] rounded-md bg-slate-800 px-2 py-1 text-slate-300 border border-slate-700">?raw</span>
          </div>
          <pre class="overflow-x-auto rounded-lg bg-slate-950 px-3 py-3 text-xs text-emerald-100 border border-slate-800 scroll-dark">{{ rawQueryPreview }}</pre>
        </article>
        <article class="rounded-2xl border border-slate-800 bg-slate-900/80 p-5 space-y-3">
          <div class="flex items-center justify-between">
            <div>
              <h3 class="text-lg font-semibold">Raw SVG (.raw.svg)</h3>
              <p class="text-slate-400 text-sm">Suffix import as string</p>
            </div>
            <span class="text-[11px] rounded-md bg-slate-800 px-2 py-1 text-slate-300 border border-slate-700">.raw.svg</span>
          </div>
          <pre class="overflow-x-auto rounded-lg bg-slate-950 px-3 py-3 text-xs text-emerald-100 border border-slate-800 scroll-dark">{{ rawSuffixPreview }}</pre>
        </article>
      </section>
    </div>
  </div>
</template>

<script setup>
import Icon from "./icons/icon.svg";
import rawViaQuery from "./icons/icon.svg?raw";
import rawViaSuffix from "./icons/icon.raw.svg";
import RemoteSvg from "vue-smart-svg/remote";
// Optional global security config (call once before mount):
// import { setRemoteSvgSecurity } from "vue-smart-svg/remote";
// setRemoteSvgSecurity({
//   publicKey: "BASE64_PUBLIC_KEY",
//   signatureHeader: "X-Asset-Signature",
//   maxAgeMs: 5 * 60 * 1000,
//   maxBytes: 256 * 1024
// });

const rows = [
  {
    id: "themed",
    title: "Tailwind color",
    subtitle: "Class overrides the purple stroke",
    replaceColors: true,
    replaceColorsLabel: "true",
    iconClass: "text-emerald-400",
    note: "Stroke becomes green from the class."
  },
  {
    id: "original",
    title: "Original color",
    subtitle: "Ignores the Tailwind class",
    replaceColors: false,
    replaceColorsLabel: "false",
    iconClass: "text-green-400",
    note: "Keeps the purple stroke from the SVG."
  },
  {
    id: "default",
    title: "Loader default",
    subtitle: "No prop (true)",
    replaceColors: undefined,
    replaceColorsLabel: "default (true)",
    iconClass: "text-sky-400",
    note: "Matches the default colorize behavior."
  }
];

const remoteSrc = "https://ls.city/cdn/user.svg";
const remoteSecurity = undefined;
const remoteRows = [
  {
    id: "remote-colored",
    title: "Current color",
    subtitle: "Tailwind overrides remote strokes",
    replaceColors: true,
    iconClass: "text-indigo-400",
    note: "Remote SVG uses currentColor, so theme classes apply."
  },
  {
    id: "remote-original",
    title: "Original remote colors",
    subtitle: "Leave CDN colors untouched",
    replaceColors: false,
    iconClass: "text-emerald-400",
    note: "Pass replaceColors=false to keep the CDN styling."
  }
];

const preview = (value) => `${String(value).slice(0, 110)}...`;
const rawQueryPreview = preview(rawViaQuery);
const rawSuffixPreview = preview(rawViaSuffix);
</script>

<style>
.scroll-dark::-webkit-scrollbar {
  height: 10px;
}
.scroll-dark::-webkit-scrollbar-track {
  background: #0f172a;
}
.scroll-dark::-webkit-scrollbar-thumb {
  background: #1f2937;
  border-radius: 9999px;
  border: 1px solid #0f172a;
}
.scroll-dark::-webkit-scrollbar-thumb:hover {
  background: #334155;
}
</style>
