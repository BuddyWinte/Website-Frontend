<template>
  <article class="w-full max-w-3xl mx-auto px-6 py-24 text-left">
    <header class="mb-10">
      <h1 class="text-4xl sm:text-5xl font-bold tracking-tight text-[var(--text-plain)] mb-3">
        Hello World!
      </h1>
      <div class="flex items-center gap-3 text-sm text-[var(--text-faded)]">
        <span>{{ formatDate("2026-02-14") }}</span>
        <span>•</span>
        <span>5 min read</span>
      </div>
    </header>
    <section class="space-y-6 text-[var(--text-muted)] leading-relaxed">
      <p>Hello World! This is a test blog so I can test the website. The first blog on the website!</p>
    </section>
  </article>
</template>
<script setup lang="ts">
function formatDate(date: string) {
  return new Date(date).toLocaleDateString(undefined, {
    year: "numeric",
    month: "long",
    day: "numeric"
  })
}
</script>