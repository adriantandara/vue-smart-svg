<template>
  <div class="app">
    <h1>Vue 3 SVG loader</h1>

    <h2>Component mode</h2>
    <div class="icons">
      <Icon class="icon" />
      <Icon class="icon" :size="32" title="Sample icon" :decorative="false" />
    </div>

    <h2>Raw SVG strings</h2>
    <p>?raw query import:</p>
    <pre class="code">{{ rawQueryPreview }}</pre>
    <p>.raw.svg suffix import:</p>
    <pre class="code">{{ rawSuffixPreview }}</pre>
  </div>
</template>

<script setup>
import Icon from "./icons/icon.svg";
import rawViaQuery from "./icons/icon.svg?raw";
import rawViaSuffix from "./icons/icon.raw.svg";

const preview = (value) => `${value.slice(0, 80)}...`;
const rawQueryPreview = preview(rawViaQuery);
const rawSuffixPreview = preview(rawViaSuffix);
</script>

<style>
.app {
  font-family: Arial, sans-serif;
  padding: 24px;
}

.icons {
  display: flex;
  gap: 12px;
  margin-bottom: 16px;
}

.icon {
  color: blue;
}

.code {
  background: #f4f4f5;
  border: 1px solid #e4e4e7;
  border-radius: 6px;
  padding: 12px;
  font-family: "SFMono-Regular", Consolas, "Liberation Mono", Menlo, monospace;
}
</style>
