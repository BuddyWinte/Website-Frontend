<template>
  <h1 class="text-4xl sm:text-5xl font-bold text-[var(--text-plain)] mb-4 flex items-center justify-center gap-3">
    <span class="wave-emoji">👋</span>
    <span>
      Hello, I'm
      <span class="bg-gradient-to-r from-[var(--cerulean)] to-[var(--cerulean-light)] bg-clip-text text-transparent">
        BuddyWinte
      </span>
    </span>
  </h1>
  <p class="text-lg sm:text-xl text-[var(--text-muted)] max-w-xl mb-16 text-center">
    Lorem Impsum
  </p>
  <!--<section class="w-full max-w-6xl mx-auto mt-12 relative overflow-hidden">
    <div class="absolute left-0 top-0 bottom-0 w-32 bg-gradient-to-r from-[var(--midnight)] to-transparent z-20 pointer-events-none"></div>
    <div class="absolute right-0 top-0 bottom-0 w-32 bg-gradient-to-l from-[var(--midnight)] to-transparent z-20 pointer-events-none"></div>
    <div class="flex animate-marquee gap-8 min-w-full">
      <template v-for="(partner, index) in extendedPartners" :key="partner.name + '-' + index">
        <img
          :src="partner.icon"
          :alt="partner.name"
          class="w-48 h-24 object-contain rounded-xl shadow-lg"
        />
      </template>
    </div>
    <div class="flex animate-marquee gap-8 min-w-full absolute top-0 left-full">
      <template v-for="(partner, index) in extendedPartners" :key="'dup-' + partner.name + '-' + index">
        <img
          :src="partner.icon"
          :alt="partner.name"
          class="w-48 h-24 object-contain rounded-xl shadow-lg"
        />
      </template>
    </div>
  </section>-->
</template>
<script setup lang="ts">
import { ref, computed } from 'vue'

interface Partner {
  name: string
  icon: string
  route: string
}

const partners = ref<Partner[]>([
  {
    name: 'Ujina',
    icon: '/src/assets/partners/ujina.png',
    route: '',
  },
  {
    name: 'BloxVault',
    icon: '/src/assets/partners/BloxVault.png',
    route: '',
  },
])
const extendedPartners = computed(() => {
  if (!partners.value.length) return []
  const repeats = Math.ceil(10 / partners.value.length)
  const result: Partner[] = []
  for (let i = 0; i < repeats; i++) {
    partners.value.forEach(p => result.push(p))
  }
  return result
})
</script>
<style scoped>
.wave-emoji {
  user-select: none;
  transform-origin: 70% 70%;
  animation: wave 2.8s linear infinite;
}
@keyframes wave {
  0% { transform: rotate(-10deg); }
  25% { transform: rotate(0deg); }
  50% { transform: rotate(10deg); }
  75% { transform: rotate(0deg); }
  100% { transform: rotate(-10deg); }
}
@keyframes marquee {
  0% { transform: translateX(0); }
  100% { transform: translateX(-100%); }
}
.animate-marquee {
  display: flex;
  gap: 2rem;
  animation: marquee 20s linear infinite;
}
</style>