import { reactive } from 'vue'

export type LanyardStatus = 'idle' | 'connecting' | 'connected' | 'reconnecting' | 'error'
export type LanyardPayload = Record<string, unknown>

export interface LanyardGlobalState {
  connected: boolean
  status: LanyardStatus
  userId: string | null
  data: LanyardPayload | null
  users: Record<string, LanyardPayload>
  lastEvent: string | null
  updatedAt: string | null
  error: string | null
}

function createInitialState(): LanyardGlobalState {
  return {
    connected: false,
    status: 'idle',
    userId: null,
    data: null,
    users: {},
    lastEvent: null,
    updatedAt: null,
    error: null
  }
}

declare global {
  interface Window {
    LanyardData: LanyardGlobalState
  }
}

const existingState = window.LanyardData
export const LanyardData = existingState ?? reactive(createInitialState())

if (!existingState) {
  window.LanyardData = LanyardData
}

