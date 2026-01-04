<template>
  <div class="app">
    <h1>Vue 3 SVG loader</h1>
    <Icon class="icon" />
    <Icon class="icon" :size="32" title="Sample icon" :decorative="false" />
  </div>
</template>

<script setup>
import Icon from "./icon.svg";
</script>

<style>
.app {
  font-family: Arial, sans-serif;
  padding: 24px;
}

.icon {
  color: blue;
  margin-right: 12px;
}
</style>
