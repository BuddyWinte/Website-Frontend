<template>
  <div class="w-full">
    <div class="sticky top-16 sm:top-20 z-20 px-6 py-4 max-w-5xl mx-auto">
      <div class="relative max-w-md mx-auto">
        <LucideSearch class="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--text-faded)] pointer-events-none"/>
        <input
          type="text"
          v-model="searchQuery"
          placeholder="Search posts..."
          class="w-full pl-10 pr-4 py-3 rounded-xl border border-[var(--border-steel)] bg-[var(--moonstone)] text-[var(--text-plain)] placeholder:text-[var(--text-faded)] focus:outline-none focus:ring-2 focus:ring-[var(--cerulean)] focus:border-transparent transition"
        />
      </div>
    </div>
    <div class="flex flex-col items-center justify-center px-6 py-24">
      <section class="mb-6 text-center max-w-3xl">
        <h1 class="text-4xl sm:text-5xl font-bold text-[var(--text-plain)] mb-2 tracking-tight">
          BuddyWinte's Blog
        </h1>
        <p class="text-lg text-[var(--text-muted)] leading-relaxed max-w-xl mx-auto">
          wee woah!!! a blog!!! <strong>here you can check out my projects, writing, (horrible) arts, and other fun stuff!</strong> hope you enjoy!
        </p>
      </section>
      <section class="space-y-6 w-full max-w-3xl">
        <router-link
          v-for="(post, index) in filteredPosts"
          :key="post.slug"
          :to="post.path"
          class="group block rounded-3xl p-6 transition transform hover:scale-[1.01] hover:shadow-lg shadow-black/5"
          :class="index === 0
            ? 'bg-[var(--cerulean-light)]/10 border border-[var(--cerulean)]'
            : 'bg-[var(--moonstone)] border border-[var(--border-steel)]'"
        >
          <div class="flex flex-col sm:flex-row sm:justify-between sm:items-baseline gap-2 sm:gap-4">
            <h3
              class="text-lg sm:text-xl font-semibold group-hover:text-[var(--cerulean)] transition"
              :class="index === 0 ? 'text-[var(--cerulean)]' : 'text-[var(--text-plain)]'"
            >
              {{ post.title }}
            </h3>
            <span class="text-sm text-[var(--text-faded)] whitespace-nowrap">
              {{ formatDate(post.date) }}
            </span>
          </div>
          <p class="text-sm text-[var(--text-muted)] mt-2 leading-relaxed max-w-2xl">
            {{ post.description }}
          </p>
        </router-link>
      </section>

      <div v-if="filteredPosts.length === 0" class="mt-12 text-center text-[var(--text-faded)]">
        No posts found.
      </div>
    </div>
  </div>
</template>
<script setup lang="ts">
import { ref, computed } from 'vue'
import { Search as LucideSearch } from 'lucide-vue-next'

interface BlogPost {
  slug: string
  title: string
  description: string
  date: string
  updatedAt?: string
  path: string
  visible?: boolean
}

const posts: BlogPost[] = [
  {
    slug: "hello-world",
    title: "Hello World!",
    description: "Test blog cause yk",
    date: "2026-02-14",
    path: "/blog/hello-world",
    visible: true
  }
]

const sortedPosts = [...posts]
  .filter(p => p.visible)
  .sort((a, b) => {
    const aDate = new Date(a.updatedAt ?? a.date).getTime()
    const bDate = new Date(b.updatedAt ?? b.date).getTime()
    return bDate - aDate
  })

const visiblePosts = sortedPosts
const searchQuery = ref('')

const filteredPosts = computed(() => {
  if (!searchQuery.value) return visiblePosts
  const query = searchQuery.value.toLowerCase()
  return visiblePosts.filter(post =>
    post.title.toLowerCase().includes(query) ||
    post.description.toLowerCase().includes(query)
  )
})

function formatDate(date: string) {
  return new Date(date).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric"
  })
}
</script>