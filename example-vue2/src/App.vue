<template>
  <div class="app">
    <h1>Vue 2 SVG loader</h1>
    <Icon class="icon" />
    <Icon class="icon" :size="28" title="Sample icon" :decorative="false" />
  </div>
</template>

<script>
import Icon from "./icon.svg";

export default {
  components: { Icon }
};
</script>

<style>
.app {
  font-family: Arial, sans-serif;
  padding: 24px;
}

.icon {
  color: #2563eb;
  margin-right: 12px;
}
</style>