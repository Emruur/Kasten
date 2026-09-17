<script setup lang="ts">
defineProps<{
  name: string
  visible?: boolean
}>()
</script>

<template>
  <div class="location-card" :class="{ 'is-visible': visible }">
    <div class="inner">
      <span class="name">{{ name }}</span>
    </div>
  </div>
</template>

<style scoped>
/* Sits on top of the art card sharing its cell; the opaque page
   background hides the artwork underneath. */
.location-card {
  aspect-ratio: 4 / 5;
  position: relative;
  overflow: hidden;
  z-index: 1;
  background-color: var(--bg);
  color: var(--wordmark);
  container-type: size;
}

/* Stacked downward, reading top to bottom. */
.inner {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  font-size: min(14cqw, 8cqh);
  font-weight: 700;
  letter-spacing: 0.05em;
  text-transform: uppercase;
  opacity: 0;
  transition: opacity var(--blink-fade, 0.8s) ease-in-out;
}

.name {
  writing-mode: vertical-rl;
  text-orientation: upright;
}

.location-card.is-visible .inner {
  opacity: 1;
}

@media (prefers-reduced-motion: reduce) {
  .inner {
    opacity: 1;
    transition: none;
  }
}
</style>
