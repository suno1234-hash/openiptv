import { create } from "zustand"
import { persist } from "zustand/middleware"

interface ParentalStore {
  isEnabled: boolean
  pin: string | null
  isLocked: boolean
  blockedChannelIds: string[]
  blockedGroups: string[]
  ageRating: number // 0 = all, 12, 16, 18
  
  // Actions
  setPin: (pin: string) => void
  removePin: () => void
  unlock: (pin: string) => boolean
  lock: () => void
  toggleChannelBlock: (channelId: string) => void
  toggleGroupBlock: (group: string) => void
  setAgeRating: (rating: number) => void
  isChannelBlocked: (channelId: string, group?: string) => boolean
}

export const useParentalStore = create<ParentalStore>()(
  persist(
    (set, get) => ({
      isEnabled: false,
      pin: null,
      isLocked: true,
      blockedChannelIds: [],
      blockedGroups: [],
      ageRating: 0,

      setPin: (pin) => set({ pin, isEnabled: true, isLocked: true }),
      
      removePin: () => set({ 
        pin: null, 
        isEnabled: false, 
        isLocked: false,
        blockedChannelIds: [],
        blockedGroups: [],
        ageRating: 0
      }),
      
      unlock: (pin) => {
        if (get().pin === pin) {
          set({ isLocked: false })
          return true
        }
        return false
      },
      
      lock: () => set({ isLocked: true }),
      
      toggleChannelBlock: (channelId) => set((state) => ({
        blockedChannelIds: state.blockedChannelIds.includes(channelId)
          ? state.blockedChannelIds.filter(id => id !== channelId)
          : [...state.blockedChannelIds, channelId]
      })),
      
      toggleGroupBlock: (group) => set((state) => ({
        blockedGroups: state.blockedGroups.includes(group)
          ? state.blockedGroups.filter(g => g !== group)
          : [...state.blockedGroups, group]
      })),
      
      setAgeRating: (rating) => set({ ageRating: rating }),
      
      isChannelBlocked: (channelId, group) => {
        const state = get()
        if (!state.isEnabled || !state.isLocked) return false
        if (state.blockedChannelIds.includes(channelId)) return true
        if (group && state.blockedGroups.includes(group)) return true
        return false
      },
    }),
    {
      name: "openiptv-parental",
    }
  )
)
