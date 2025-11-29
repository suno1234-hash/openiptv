/**
 * Channel Management Store
 * Handles hiding, deleting, and restoring channels
 */

import { create } from "zustand"
import { persist } from "zustand/middleware"

interface DeletedChannel {
  id: string
  name: string
  url: string
  logo?: string
  group?: string
  deletedAt: Date
}

interface ChannelManagementStore {
  hiddenChannels: Set<string>
  deletedChannels: DeletedChannel[]
  
  // Hide/Show
  hideChannel: (channelId: string) => void
  showChannel: (channelId: string) => void
  isChannelHidden: (channelId: string) => boolean
  
  // Delete/Restore
  deleteChannel: (channel: { id: string; name: string; url: string; logo?: string; group?: string }) => void
  restoreChannel: (channelId: string) => void
  permanentlyDeleteChannel: (channelId: string) => void
  
  // Bulk operations
  deleteCountryChannels: (countryCode: string, channels: any[]) => void
  restoreAll: () => void
  emptyTrash: () => void
  
  // Getters
  getDeletedChannels: () => DeletedChannel[]
  getHiddenChannelIds: () => string[]
}

export const useChannelManagementStore = create<ChannelManagementStore>()(
  persist(
    (set, get) => ({
      hiddenChannels: new Set<string>(),
      deletedChannels: [],

      hideChannel: (channelId: string) => {
        set((state) => ({
          hiddenChannels: new Set([...state.hiddenChannels, channelId]),
        }))
      },

      showChannel: (channelId: string) => {
        set((state) => {
          const newHidden = new Set(state.hiddenChannels)
          newHidden.delete(channelId)
          return { hiddenChannels: newHidden }
        })
      },

      isChannelHidden: (channelId: string) => {
        return get().hiddenChannels.has(channelId)
      },

      deleteChannel: (channel) => {
        set((state) => ({
          deletedChannels: [
            ...state.deletedChannels,
            {
              ...channel,
              deletedAt: new Date(),
            },
          ],
          hiddenChannels: new Set([...state.hiddenChannels, channel.id]),
        }))
        
        // Trigger custom event to notify components
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('channelDeleted'))
        }
      },

      restoreChannel: (channelId: string) => {
        set((state) => {
          const newHidden = new Set(state.hiddenChannels)
          newHidden.delete(channelId)
          
          return {
            hiddenChannels: newHidden,
            deletedChannels: state.deletedChannels.filter((ch) => ch.id !== channelId),
          }
        })
        
        // Trigger custom event to notify components
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('channelDeleted'))
        }
      },

      permanentlyDeleteChannel: (channelId: string) => {
        set((state) => ({
          deletedChannels: state.deletedChannels.filter((ch) => ch.id !== channelId),
        }))
      },

      deleteCountryChannels: (countryCode: string, channels: any[]) => {
        const now = new Date()
        set((state) => ({
          deletedChannels: [
            ...state.deletedChannels,
            ...channels.map((ch) => ({
              id: ch.id,
              name: ch.name,
              url: ch.url,
              logo: ch.logo,
              group: `${countryCode} - ${ch.group || ""}`,
              deletedAt: now,
            })),
          ],
          hiddenChannels: new Set([
            ...state.hiddenChannels,
            ...channels.map((ch) => ch.id),
          ]),
        }))
      },

      restoreAll: () => {
        set((state) => {
          const restoredIds = state.deletedChannels.map((ch) => ch.id)
          const newHidden = new Set(state.hiddenChannels)
          restoredIds.forEach((id) => newHidden.delete(id))
          
          return {
            hiddenChannels: newHidden,
            deletedChannels: [],
          }
        })
      },

      emptyTrash: () => {
        set({ deletedChannels: [] })
      },

      getDeletedChannels: () => {
        return get().deletedChannels
      },

      getHiddenChannelIds: () => {
        return Array.from(get().hiddenChannels)
      },
    }),
    {
      name: "channel-management",
      // Custom serialization for Set
      partialize: (state) => ({
        hiddenChannels: Array.from(state.hiddenChannels),
        deletedChannels: state.deletedChannels,
      }),
      merge: (persistedState: any, currentState) => ({
        ...currentState,
        hiddenChannels: new Set(persistedState.hiddenChannels || []),
        deletedChannels: persistedState.deletedChannels || [],
      }),
    }
  )
)
