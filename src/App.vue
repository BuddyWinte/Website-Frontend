<template>
  <header class="fixed top-0 left-0 right-0 z-50 bg-[var(--moonstone)]/90 backdrop-blur-xl border-b border-[var(--border-fade)] shadow-[var(--shadow-xs)]">
    <div class="max-w-5xl mx-auto px-6 h-16 flex items-center justify-between">
      <div class="flex items-center gap-3">
        <img src="/src/assets/wintepfp.png" alt="Profile Picture" class="w-10 h-10 rounded-full border-2 border-[var(--cerulean)] object-cover"/>
        <h1 class="text-xl font-bold tracking-tight text-[var(--text-plain)]">BuddyWinte</h1>
      </div>
      <button class="sm:hidden p-2 rounded-md text-[var(--text-plain)] hover:bg-[var(--surface-hover)] transition" @click="mobileOpen = !mobileOpen" aria-label="Toggle menu">
        <MenuIcon class="w-6 h-6"/>
      </button>
      <nav class="hidden sm:flex gap-6 items-center relative">
        <template v-for="item in currentNavItems" :key="item.name">
          <div v-if="!item.children">
            <router-link
              :to="item.path"
              class="flex items-center gap-1 px-3 py-2 rounded-md transition"
              :class="isActive(item.path) 
                ? 'bg-[var(--cerulean-soft)] text-[var(--cerulean-dark)]' 
                : 'text-[var(--text-plain)] hover:bg-[var(--surface-hover)] hover:text-[var(--cerulean)]'"
            >
              <component v-if="item.icon" :is="item.icon" class="w-5 h-5"/>
              {{ item.name }}
            </router-link>
          </div>
          <div v-else class="relative">
            <button 
              @click="toggleDropdown(item.name)" 
              class="flex items-center gap-1 px-3 py-2 rounded-md transition focus:outline-none"
              :class="isActive(item.path) 
                ? 'bg-[var(--cerulean-soft)] text-[var(--cerulean-dark)]' 
                : 'text-[var(--text-plain)] hover:bg-[var(--surface-hover)] hover:text-[var(--cerulean)]'"
            >
              <component v-if="item.icon" :is="item.icon" class="w-5 h-5"/>
              {{ item.name }}
              <ChevronDownIcon class="w-4 h-4 transition-transform" :class="{'rotate-180': isDropdownOpen(item.name)}"/>
            </button>
            <transition name="fade-slide">
              <div 
                v-show="isDropdownOpen(item.name)" 
                class="absolute left-0 mt-2 w-52 bg-[var(--surface-elevated)] border border-[var(--border-steel)] rounded-xl shadow-[var(--shadow-md)] overflow-hidden z-50 backdrop-blur-md"
              >
                <router-link
                  v-for="child in item.children"
                  :key="child.path"
                  :to="child.path"
                  class="block px-4 py-3 text-sm transition rounded-md"
                  :class="isActive(child.path) 
                    ? 'bg-[var(--cerulean-soft)] text-[var(--cerulean-dark)]' 
                    : 'text-[var(--text-plain)] hover:bg-[var(--surface-hover)] hover:text-[var(--cerulean)]'"
                >
                  {{ child.name }}
                </router-link>
              </div>
            </transition>
          </div>
        </template>
      </nav>
    </div>
    <transition name="fade-slide">
      <div v-show="mobileOpen" class="fixed inset-0 z-40 bg-[var(--midnight)]/95 flex flex-col items-center justify-center gap-6 sm:hidden p-4">
        <template v-for="item in currentNavItems" :key="item.name">
          <div v-if="!item.children">
            <router-link
              :to="item.path"
              class="text-2xl font-semibold transition"
              :class="isActive(item.path)
              ? 'bg-[var(--cerulean-soft)] text-[var(--cerulean-dark)]'
              : 'text-[var(--text-plain)] hover:bg-[var(--surface-hover)] hover:text-[var(--cerulean)]'"
            >
              {{ item.name }}
            </router-link>
          </div>
          <div v-else class="flex flex-col items-center gap-3">
            <span class="text-xl font-semibold text-[var(--text-plain)]">{{ item.name }}</span>
            <router-link
              v-for="child in item.children"
              :key="child.path"
              :to="child.path"
              class="text-lg transition"
              :class="isActive(child.path) ? 'text-[var(--cerulean)]' : 'text-[var(--text-plain)] hover:text-[var(--cerulean)]'"
            >
              {{ child.name }}
            </router-link>
          </div>
        </template>
      </div>
    </transition>
  </header>

  <transition name="fade-slide">
    <div
      v-if="alert.visible"
      class="fixed top-16 left-0 right-0 z-40 flex justify-center"
    >
      <div
        :class="[
          'w-full max-w-5xl px-6 py-3 rounded-b-md shadow-md flex justify-between items-center font-medium',
          alertClass(alert.type)
        ]"
      >
        <span>{{ alert.text }}</span>
        <button
          v-if="alert.dismissable"
          @click="alert.visible = false"
          class="ml-4 text-[var(--text-plain)] hover:opacity-80 transition cursor-pointer"
        >
          <XIcon class="w-5 h-5"/>
        </button>
      </div>
    </div>
  </transition>
  <main class="relative z-10 flex flex-col items-center justify-center text-center min-h-screen px-4 pt-20 sm:pt-32 bg-[var(--midnight)]">
    <router-view />
  </main>
</template>

<script setup lang="ts">
import type { Component } from 'vue'
import { ref, reactive, computed, onMounted, onBeforeUnmount, watch } from 'vue'
import { useRoute } from 'vue-router'
import { HomeIcon, UserIcon, FolderIcon, ChevronDownIcon, MenuIcon, XIcon, Rss } from 'lucide-vue-next'

type NavChild = { name: string; path: string }
type NavItem = { name: string; path: string; icon?: Component; children?: NavChild[] }
type AppRouteMeta = { title?: string; description?: string; navItems?: NavItem[] }

const mobileOpen = ref(false)
const dropdownsOpen = reactive<Record<string, boolean>>({})

const route = useRoute()

const defaultNavItems: NavItem[] = [
  { name: 'Home', path: '/', icon: HomeIcon },
  { name: 'Webmaster', path: '/about', icon: UserIcon },
  { name: 'Blog', path: '/blog', icon: Rss },
  { 
    name: 'Projects', path: '/projects', icon: FolderIcon,
    children: [
      { name: 'Project One', path: '/projects/project-one' },
      { name: 'Project Two', path: '/projects/project-two' },
      { name: 'All Projects', path: '/projects' },
    ]
  }
]

const currentNavItems = computed<NavItem[]>(() => {
  const routeMeta = route.meta as AppRouteMeta
  return routeMeta.navItems && routeMeta.navItems.length > 0 ? routeMeta.navItems : defaultNavItems
})

const alert = reactive({ visible: false, type: 'info', text: '', dismissable: true })

function alertClass(type: string) {
  switch(type){
    case 'success': return 'bg-[var(--success-bg)] text-[var(--success)] border border-[var(--success)]'
    case 'error': return 'bg-[var(--error-bg)] text-[var(--error)] border border-[var(--error)]'
    case 'warning': return 'bg-[var(--warning-bg)] text-[var(--warning)] border border-[var(--warning)]'
    default: return 'bg-[var(--info-bg)] text-[var(--info)] border border-[var(--info)]'
  }
}

function isActive(path: string) {
  return route.path === path
}

function toggleDropdown(name: string) {
  Object.keys(dropdownsOpen).forEach(k => { if(k !== name) dropdownsOpen[k] = false })
  dropdownsOpen[name] = !dropdownsOpen[name]
}

function isDropdownOpen(name: string) {
  return !!dropdownsOpen[name]
}

function onClickOutsideDropdown(e: MouseEvent) {
  const target = e.target as HTMLElement
  if (!document.querySelector('header')?.contains(target)) {
    Object.keys(dropdownsOpen).forEach(k => dropdownsOpen[k] = false)
  }
}

function onKeyDown(e: KeyboardEvent) {
  if (e.key === 'Escape') { Object.keys(dropdownsOpen).forEach(k => dropdownsOpen[k] = false) }
}

function syncHeadFromRoute() {
  const routeMeta = route.meta as AppRouteMeta
  const pageTitle = routeMeta.title
  const pageDescription = routeMeta.description ?? "Welcome to Winte's Portal."
  const fullTitle = pageTitle ? `${pageTitle} - Winte's Portal` : "Winte's Portal"

  document.title = fullTitle

  const setMeta = (attr: 'name' | 'property', key: string, content: string) => {
    let metaTag = document.querySelector(`meta[${attr}="${key}"]`) as HTMLMetaElement | null
    if (!metaTag) {
      metaTag = document.createElement('meta')
      metaTag.setAttribute(attr, key)
      document.head.appendChild(metaTag)
    }
    metaTag.setAttribute('content', content)
  }

  setMeta('name', 'description', pageDescription)
  setMeta('property', 'og:title', fullTitle)
  setMeta('property', 'og:description', pageDescription)
  setMeta('name', 'twitter:title', fullTitle)
  setMeta('name', 'twitter:description', pageDescription)
}

watch(
  () => route.fullPath,
  () => {
    mobileOpen.value = false
    Object.keys(dropdownsOpen).forEach(k => dropdownsOpen[k] = false)
    syncHeadFromRoute()
  },
  { immediate: true },
)

onMounted(() => {
  window.addEventListener('keydown', onKeyDown)
  window.addEventListener('click', onClickOutsideDropdown)
})

onBeforeUnmount(() => {
  window.removeEventListener('keydown', onKeyDown)
  window.removeEventListener('click', onClickOutsideDropdown)
})
</script>

<style>
.fade-slide-enter-active, .fade-slide-leave-active { transition: all 0.2s ease; }
.fade-slide-enter-from, .fade-slide-leave-to { opacity: 0; transform: translateY(-5px); }
.fade-slide-enter-to, .fade-slide-leave-from { opacity: 1; transform: translateY(0); }
</style>
