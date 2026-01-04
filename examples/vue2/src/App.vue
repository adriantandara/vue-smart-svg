<template>
  <div class="app">
    <h1>Vue 2 SVG loader</h1>

    <h2>Component mode</h2>
    <div class="icons">
      <Icon class="icon" />
      <Icon class="icon" :size="28" title="Sample icon" :decorative="false" />
    </div>

    <h2>Raw SVG strings</h2>
    <p>?raw query import:</p>
    <pre class="code">{{ rawQueryPreview }}</pre>
    <p>.raw.svg suffix import:</p>
    <pre class="code">{{ rawSuffixPreview }}</pre>
  </div>
</template>

<script>
import Icon from "./icons/icon.svg";
import rawViaQuery from "./icons/icon.svg?raw";
import rawViaSuffix from "./icons/icon.raw.svg";

export default {
  name: "App",
  components: { Icon },
  data() {
    const preview = (value) => `${value.slice(0, 80)}...`;

    return {
      rawQueryPreview: preview(rawViaQuery),
      rawSuffixPreview: preview(rawViaSuffix)
    };
  }
};
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
  color: #2563eb;
}

.code {
  background: #f4f4f5;
  border: 1px solid #e4e4e7;
  border-radius: 6px;
  padding: 12px;
  font-family: "SFMono-Regular", Consolas, "Liberation Mono", Menlo, monospace;
}
</style>
