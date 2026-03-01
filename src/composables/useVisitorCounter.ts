import { ref } from 'vue'
const totalCount = ref<number | null>(null)
const todayCount = ref<number | null>(null)
const dashboardUrl = ref<string | null>(null)
const hasTracked = ref(false)
const trackedPaths = new Set<string>()
const isLoading = ref(false)
const error = ref<string | null>(null)
const API_BASE = 'https://visitor.6developer.com'
export function useVisitorStats() {
  async function trackVisit(domain: string) {
    const page_path = window.location.pathname
    if (trackedPaths.has(page_path)) return
    trackedPaths.add(page_path)
    if (hasTracked.value === false) {
      hasTracked.value = true
    }
    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone
    const page_title = document.title
    const referrer = document.referrer
    let search_query = ''
    if (referrer) {
      try {
        const url = new URL(referrer)
        if (url.hostname.includes('google.com')) {
          search_query = url.searchParams.get('q') || ''
        } else if (url.hostname.includes('bing.com')) {
          search_query = url.searchParams.get('q') || ''
        } else if (url.hostname.includes('yahoo.com')) {
          search_query = url.searchParams.get('p') || ''
        } else if (url.hostname.includes('duckduckgo.com')) {
          search_query = url.searchParams.get('q') || ''
        }
      } catch {
      }
    }
    try {
      const res = await fetch(`${API_BASE}/visit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          domain: encodeURIComponent(domain),
          timezone,
          page_path,
          page_title,
          referrer,
          search_query
        })
      })
      const data = await res.json()
      totalCount.value = data.totalCount
      todayCount.value = data.todayCount
    } catch (err) {
      console.error('Visitor tracking error:', err)
    }
  }
  async function fetchStats(domain: string) {
    isLoading.value = true
    error.value = null
    try {
      const res = await fetch(
        `${API_BASE}/visit?domain=${encodeURIComponent(domain)}`
      )
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const data = await res.json()
      totalCount.value = data.totalCount
      todayCount.value = data.todayCount
      dashboardUrl.value = data.dashboardUrl
    } catch (err) {
      error.value = 'Failed to load visitor stats'
      console.error(err)
    } finally {
      isLoading.value = false
    }
  }
  return {
    totalCount,
    todayCount,
    dashboardUrl,
    isLoading,
    error,
    trackVisit,
    fetchStats
  }
}