<script setup lang="ts">
defineProps<{
  src: string
  visible?: boolean
}>()
</script>

<template>
  <div class="art-card" :class="{ 'is-visible': visible }">
    <img :src="src" alt="" loading="lazy" decoding="async" />
  </div>
</template>

<style scoped>
/* Blank (page-background) until blinked visible or hovered. */
.art-card {
  aspect-ratio: 4 / 5;
  overflow: hidden;
  background-color: var(--bg);
}

.art-card img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
  opacity: 0;
  /* Keep the image on its own compositor layer so fades never wait on
     layer promotion or repaints (thumbnails keep the memory cost low). */
  will-change: opacity;
  transition:
    opacity var(--blink-fade, 0.8s) ease-in-out,
    transform 0.4s ease;
}

.art-card.is-visible img,
.art-card:hover img {
  opacity: 1;
}

.art-card:hover img {
  transform: scale(1.04);
}

@media (prefers-reduced-motion: reduce) {
  .art-card img {
    opacity: 1;
    transition: none;
  }
}
</style>
