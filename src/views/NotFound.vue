<template>
  <div
    class="flex flex-col items-center justify-center text-center
           gap-5 px-6"
  >
    <h2
      class="text-6xl sm:text-7xl font-extrabold tracking-tight
             bg-gradient-to-r from-[var(--cerulean)] to-[var(--cerulean-light)]
             bg-clip-text text-transparent"
    >
      404
    </h2>

    <p class="text-xl sm:text-2xl text-[var(--text-plain)]">
      We Looked Far and Wide
    </p>

    <div class="h-px w-16 bg-[var(--border)] opacity-50" />

    <p class="text-sm sm:text-base text-[var(--text-muted)] max-w-md leading-relaxed">
      Whatever you're looking for doesn't exist anymore,
      <span class="text-[var(--text-faded)]">
        or maybe it never did.
      </span>
    </p>

    <router-link
      to="/"
      class="mt-6 inline-flex items-center gap-2
             px-5 py-2.5 rounded-md font-medium
             bg-[var(--cerulean)]/15 text-[var(--cerulean)]
             hover:bg-[var(--cerulean)]/25
             hover:-translate-y-[1px]
             active:translate-y-0
             focus-visible:outline-none
             focus-visible:ring-2
             focus-visible:ring-[var(--border-steel)]
             transition-all duration-200"
    >
      Return Home
    </router-link>
  </div>
</template>

<script setup lang="ts">
</script>