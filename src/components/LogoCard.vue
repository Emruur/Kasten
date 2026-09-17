<script setup lang="ts">
withDefaults(
  defineProps<{
    variant?: 'black' | 'white'
  }>(),
  { variant: 'black' },
)
</script>

<template>
  <div class="logo-card" :class="variant">
    <img
      :src="variant === 'black' ? '/logo-yellow.png' : '/logo-black.png'"
      alt="Kasten Kolektif"
    />
  </div>
</template>

<style scoped>
.logo-card {
  aspect-ratio: 4 / 5;
  position: relative;
  overflow: hidden;
  /* Same as the page background, so the card blends into it. */
  background-color: var(--bg);
}

/* The wordmark is wide; rotated 90° it runs vertically, bottom to top.
   Card height is 125% of its width (4:5), so a 100%-wide image spans
   80% of the card height once rotated. */
.logo-card img {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 100%;
  /* --logo-shift slides the wordmark toward the left edge during the menu
     transition (set by HomeView); the outer translateX acts in screen space. */
  transform: translateX(var(--logo-shift, 0px)) translate(-50%, -50%) rotate(-90deg);
}
</style>
