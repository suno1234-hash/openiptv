import { create } from "zustand"
import { persist } from "zustand/middleware"
import { Channel } from "@/lib/types"

export interface WatchHistoryEntry {
  channel: Channel
  lastWatched: number
  watchCount: number
  totalWatchTime: number // in seconds
}

interface WatchHistoryStore {
  history: WatchHistoryEntry[]
  maxHistorySize: number
  
  // Actions
  addToHistory: (channel: Channel) => void
  updateWatchTime: (channelId: string, seconds: number) => void
  removeFromHistory: (channelId: string) => void
  clearHistory: () => void
  getRecentlyWatched: (limit?: number) => WatchHistoryEntry[]
  getMostWatched: (limit?: number) => WatchHistoryEntry[]
}

export const useWatchHistoryStore = create<WatchHistoryStore>()(
  persist(
    (set, get) => ({
      history: [],
      maxHistorySize: 50,

      addToHistory: (channel: Channel) => {
        set((state) => {
          const existingIndex = state.history.findIndex(
            (h) => h.channel.id === channel.id
          )

          let newHistory: WatchHistoryEntry[]

          if (existingIndex >= 0) {
            // Update existing entry
            newHistory = [...state.history]
            newHistory[existingIndex] = {
              ...newHistory[existingIndex],
              channel, // Update channel info in case it changed
              lastWatched: Date.now(),
              watchCount: newHistory[existingIndex].watchCount + 1,
            }
          } else {
            // Add new entry
            newHistory = [
              {
                channel,
                lastWatched: Date.now(),
                watchCount: 1,
                totalWatchTime: 0,
              },
              ...state.history,
            ]

            // Limit history size
            if (newHistory.length > state.maxHistorySize) {
              newHistory = newHistory.slice(0, state.maxHistorySize)
            }
          }

          return { history: newHistory }
        })
      },

      updateWatchTime: (channelId: string, seconds: number) => {
        set((state) => {
          const index = state.history.findIndex(
            (h) => h.channel.id === channelId
          )
          if (index < 0) return state

          const newHistory = [...state.history]
          newHistory[index] = {
            ...newHistory[index],
            totalWatchTime: newHistory[index].totalWatchTime + seconds,
          }

          return { history: newHistory }
        })
      },

      removeFromHistory: (channelId: string) => {
        set((state) => ({
          history: state.history.filter((h) => h.channel.id !== channelId),
        }))
      },

      clearHistory: () => {
        set({ history: [] })
      },

      getRecentlyWatched: (limit = 10) => {
        return get()
          .history.sort((a, b) => b.lastWatched - a.lastWatched)
          .slice(0, limit)
      },

      getMostWatched: (limit = 10) => {
        return get()
          .history.sort((a, b) => b.watchCount - a.watchCount)
          .slice(0, limit)
      },
    }),
    {
      name: "openiptv-watch-history",
    }
  )
)
