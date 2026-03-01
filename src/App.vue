<template>
  <main class="site-shell">
    <aside class="window sidebar-window">
      <header class="title-bar">
        <span>BuddyWinte</span>
      </header>

      <div class="window-body">
        <section class="profile-block">
          <img class="avatar" :src="ProfilePng" alt="BuddyWinte avatar" />
          <p>BuddyWinte</p>
        </section>

        <nav class="sidebar-nav">
          <RouterLink class="geo-btn nav-link" to="/">
            <img class="pixel-icon" :src="HomeIcon" alt="" />
            Home
          </RouterLink>

          <RouterLink class="geo-btn nav-link" to="/guestbook" @mouseover="GuestbookHovered = true" @mouseleave="GuestbookHovered = false">
            <img class="pixel-icon" :src="GuestbookHovered ? GuestbookIconOpen : GuestbookIcon" alt="" />
            Guestbook
          </RouterLink>
        </nav>

        <div class="construction-wrap">
          <img class="pixel-icon" :src="ConstructionGif" alt="Under construction" /> Under Construction
        </div>
      </div>

      <!--<footer class="status-bar">
        text
      </footer>-->
    </aside>

    <section class="window main-window">
      <header class="title-bar hot">
        <span>Page Title</span>
        <!--<span>_ [] X</span>-->
      </header>

      <div class="window-body">
        <!--<p class="marquee-strip">
          <span>
            Welcome to Winte's portal !! guestbook soon !! web rings soon !! midi probably later !!
          </span>
        </p>-->
        <RouterView />
      </div>

      <footer class="status-bar">
        Last updated: February 28, 2026
      </footer>
    </section>

    <aside class="window ads-window">
      <header class="title-bar">
        <span>Neko Ads</span>
      </header>

      <div class="window-body">
        <p v-if="currentAd && !isAdsBlocked" class="ads-meta">Sponsored by {{ currentAd.name }}</p>

        <a
          v-if="currentAd && !isAdsBlocked"
          class="ads-link"
          :href="currentAd.websiteUrl"
          target="_blank"
          rel="noreferrer"
        >
          <img
            class="ads-image pixel-icon"
            :src="currentAd.adUrl"
            :alt="`Advertisement for ${currentAd.name}`"
            @error="onAdImageError"
          />
        </a>

        <p v-else class="marquee-strip">
          <span>{{ adsBlockedMessage }}</span>
        </p>
      </div>
    </aside>
  </main>
</template>

<script lang="ts" setup>
import { onMounted, onUnmounted, ref } from 'vue'
import ConstructionGif from './assets/icons/bonus/animated/icons/construction.gif'
import HomeIcon from './assets/icons/icons/home.png'
import GuestbookIcon from './assets/icons/icons/address-book.png'
import GuestbookIconOpen from './assets/icons/icons/address-book-open.png'
import ProfilePng from './assets/wintepfp.png'
import { LanyardData, type LanyardPayload } from './lanyard'

const GuestbookHovered = ref(false)

type LanyardGatewayMessage = {
  op: number
  t?: string
  d?: unknown
}

type LanyardHelloData = {
  heartbeat_interval: number
}

type LanyardDiscordUser = {
  id?: string
}

type LanyardPresenceData = {
  discord_user?: LanyardDiscordUser
} & LanyardPayload

type NekoAd = {
  name: string
  websiteUrl: string
  adUrl: string
}

const LANYARD_SOCKET_URL = 'wss://api.lanyard.rest/socket'
const LANYARD_USER_ID = '1357429661834936510'
const ADS_FEED_URL = 'https://cdn.buddywinte.xyz/ads/ads.json'
const ADS_ROTATION_MS = 10_000

let socket: WebSocket | null = null
let heartbeatIntervalId: number | null = null
let reconnectTimeoutId: number | null = null
let reconnectAttempts = 0
let isUnmounted = false
let adsRotationIntervalId: number | null = null

const nekoAds = ref<NekoAd[]>([])
const currentAd = ref<NekoAd | null>(null)
const isAdsBlocked = ref(false)
const adsBlockedMessage = ref('Your adblocker is blocking ads content.')
const failedAdUrls = new Set<string>()

function clearHeartbeat() {
  if (heartbeatIntervalId !== null) {
    window.clearInterval(heartbeatIntervalId)
    heartbeatIntervalId = null
  }
}

function clearReconnectTimeout() {
  if (reconnectTimeoutId !== null) {
    window.clearTimeout(reconnectTimeoutId)
    reconnectTimeoutId = null
  }
}

function sendHeartbeat() {
  if (socket?.readyState === WebSocket.OPEN) {
    socket.send(JSON.stringify({ op: 3 }))
  }
}

function clearAdsRotation() {
  if (adsRotationIntervalId !== null) {
    window.clearInterval(adsRotationIntervalId)
    adsRotationIntervalId = null
  }
}

function chooseRandomAd() {
  if (!nekoAds.value.length) {
    currentAd.value = null
    return
  }

  const availableAds = nekoAds.value.filter((ad) => !failedAdUrls.has(ad.adUrl))
  if (!availableAds.length) {
    isAdsBlocked.value = true
    currentAd.value = null
    adsBlockedMessage.value = 'Your adblocker is blocking ad media.'
    clearAdsRotation()
    return
  }

  const currentUrl = currentAd.value?.adUrl
  const candidatePool = availableAds.length > 1
    ? availableAds.filter((ad) => ad.adUrl !== currentUrl)
    : availableAds
  const randomIndex = Math.floor(Math.random() * candidatePool.length)
  currentAd.value = candidatePool[randomIndex] ?? null
}

function onAdImageError() {
  if (!currentAd.value) {
    return
  }

  failedAdUrls.add(currentAd.value.adUrl)
  chooseRandomAd()
}

function isNekoAd(value: unknown): value is NekoAd {
  if (!value || typeof value !== 'object') {
    return false
  }

  const candidate = value as Record<string, unknown>
  return (
    typeof candidate.name === 'string' &&
    typeof candidate.websiteUrl === 'string' &&
    typeof candidate.adUrl === 'string'
  )
}

async function initNekoAds() {
  clearAdsRotation()
  failedAdUrls.clear()

  try {
    const response = await fetch(ADS_FEED_URL, {
      cache: 'no-store'
    })
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`)
    }

    const payload = await response.json()
    if (!Array.isArray(payload)) {
      throw new Error('Invalid ads payload')
    }

    const parsedAds = payload.filter(isNekoAd)
    if (!parsedAds.length) {
      throw new Error('No valid ads found')
    }

    nekoAds.value = parsedAds
    isAdsBlocked.value = false
    adsBlockedMessage.value = ''
    chooseRandomAd()
    adsRotationIntervalId = window.setInterval(chooseRandomAd, ADS_ROTATION_MS)
  } catch {
    currentAd.value = null
    nekoAds.value = []
    isAdsBlocked.value = true
    adsBlockedMessage.value = 'Your adblocker is blocking ads. Please disable it for this site.'
  }
}

function publishUpdate(eventName?: string) {
  if (eventName) {
    LanyardData.lastEvent = eventName
  }
  LanyardData.updatedAt = new Date().toISOString()
  window.dispatchEvent(new CustomEvent('lanyard:update', { detail: LanyardData }))
}

function setSinglePresence(presence: LanyardPresenceData) {
  const presenceId = presence.discord_user?.id
  if (presenceId) {
    LanyardData.users[presenceId] = presence
  }
  if (!LanyardData.userId && presenceId) {
    LanyardData.userId = presenceId
  }
  LanyardData.data = presence
}

function applyInitState(data: unknown) {
  if (!data || typeof data !== 'object') {
    return
  }

  if (LANYARD_USER_ID && !(LANYARD_USER_ID in (data as Record<string, unknown>))) {
    setSinglePresence(data as LanyardPresenceData)
    return
  }

  const map = data as Record<string, LanyardPayload>
  LanyardData.users = { ...LanyardData.users, ...map }

  if (LANYARD_USER_ID) {
    LanyardData.data = map[LANYARD_USER_ID] ?? null
    LanyardData.userId = LANYARD_USER_ID
    return
  }

  const firstUserId = Object.keys(map)[0]
  if (firstUserId) {
    LanyardData.userId = firstUserId
    LanyardData.data = map[firstUserId] ?? null
  }
}

function applyPresenceUpdate(data: unknown) {
  if (!data || typeof data !== 'object') {
    return
  }

  const presence = data as LanyardPresenceData
  const presenceId = presence.discord_user?.id
  if (presenceId) {
    LanyardData.users[presenceId] = presence
  }

  if (!LanyardData.userId && presenceId) {
    LanyardData.userId = presenceId
  }

  if (!LANYARD_USER_ID || LANYARD_USER_ID === presenceId) {
    LanyardData.data = presence
  }
}

function subscribeToLanyard() {
  if (!socket || socket.readyState !== WebSocket.OPEN) {
    return
  }

  socket.send(
    JSON.stringify({
      op: 2,
      d: LANYARD_USER_ID
        ? { subscribe_to_id: LANYARD_USER_ID }
        : { subscribe_to_all: true }
    })
  )
}

function scheduleReconnect() {
  if (isUnmounted) {
    return
  }

  clearReconnectTimeout()
  const delay = Math.min(30_000, 1_500 * 2 ** reconnectAttempts)
  reconnectAttempts += 1
  LanyardData.status = 'reconnecting'
  reconnectTimeoutId = window.setTimeout(connectToLanyard, delay)
}

function cleanupSocket() {
  clearHeartbeat()
  clearReconnectTimeout()

  if (socket) {
    socket.onopen = null
    socket.onmessage = null
    socket.onerror = null
    socket.onclose = null
    socket.close()
    socket = null
  }
}

function connectToLanyard() {
  if (isUnmounted) {
    return
  }

  clearHeartbeat()
  clearReconnectTimeout()

  LanyardData.status = reconnectAttempts > 0 ? 'reconnecting' : 'connecting'
  LanyardData.connected = false
  LanyardData.error = null
  LanyardData.userId = LANYARD_USER_ID || null
  publishUpdate()

  socket = new WebSocket(LANYARD_SOCKET_URL)

  socket.onopen = () => {
    reconnectAttempts = 0
    LanyardData.status = 'connected'
    LanyardData.connected = true
    publishUpdate('SOCKET_OPEN')
  }

  socket.onmessage = (event) => {
    let payload: LanyardGatewayMessage
    try {
      payload = JSON.parse(event.data) as LanyardGatewayMessage
    } catch {
      return
    }

    if (payload.op === 1) {
      const helloData = payload.d as LanyardHelloData | undefined
      const interval = helloData?.heartbeat_interval
      if (typeof interval === 'number' && interval > 0) {
        clearHeartbeat()
        heartbeatIntervalId = window.setInterval(sendHeartbeat, interval)
        sendHeartbeat()
      }
      subscribeToLanyard()
      publishUpdate('HELLO')
      return
    }

    if (payload.op !== 0 || !payload.t) {
      return
    }

    if (payload.t === 'INIT_STATE') {
      applyInitState(payload.d)
      publishUpdate(payload.t)
      return
    }

    if (payload.t === 'PRESENCE_UPDATE') {
      applyPresenceUpdate(payload.d)
      publishUpdate(payload.t)
    }
  }

  socket.onerror = () => {
    LanyardData.status = 'error'
    LanyardData.error = 'Lanyard socket error'
    publishUpdate('SOCKET_ERROR')
  }

  socket.onclose = () => {
    LanyardData.connected = false
    LanyardData.status = 'reconnecting'
    publishUpdate('SOCKET_CLOSED')
    scheduleReconnect()
  }
}

onMounted(() => {
  connectToLanyard()
  void initNekoAds()
})

onUnmounted(() => {
  isUnmounted = true
  clearAdsRotation()
  cleanupSocket()
})
</script>
