import { create } from "zustand"
import { persist } from "zustand/middleware"

interface ChannelStats {
  channelId: string
  channelName: string
  totalWatchTime: number // in seconds
  sessionCount: number
  lastWatched: number
}

interface DailyStats {
  date: string // YYYY-MM-DD
  totalWatchTime: number
  channelsWatched: number
  sessions: number
}

interface StatisticsStore {
  channelStats: Record<string, ChannelStats>
  dailyStats: DailyStats[]
  totalWatchTime: number
  totalSessions: number
  firstUseDate: number | null
  
  // Actions
  recordWatchSession: (channelId: string, channelName: string, duration: number) => void
  getTopChannels: (limit?: number) => ChannelStats[]
  getWatchTimeToday: () => number
  getWatchTimeThisWeek: () => number
  getWatchTimeThisMonth: () => number
  getDailyStats: (days?: number) => DailyStats[]
  clearStats: () => void
}

const getTodayKey = () => new Date().toISOString().split('T')[0]

export const useStatisticsStore = create<StatisticsStore>()(
  persist(
    (set, get) => ({
      channelStats: {},
      dailyStats: [],
      totalWatchTime: 0,
      totalSessions: 0,
      firstUseDate: null,

      recordWatchSession: (channelId, channelName, duration) => {
        if (duration < 10) return // Ignore very short sessions
        
        const today = getTodayKey()
        
        set((state) => {
          // Update channel stats
          const existingChannel = state.channelStats[channelId] || {
            channelId,
            channelName,
            totalWatchTime: 0,
            sessionCount: 0,
            lastWatched: Date.now(),
          }
          
          const updatedChannelStats = {
            ...state.channelStats,
            [channelId]: {
              ...existingChannel,
              channelName, // Update name in case it changed
              totalWatchTime: existingChannel.totalWatchTime + duration,
              sessionCount: existingChannel.sessionCount + 1,
              lastWatched: Date.now(),
            }
          }
          
          // Update daily stats
          let dailyStats = [...state.dailyStats]
          const todayIndex = dailyStats.findIndex(d => d.date === today)
          
          if (todayIndex >= 0) {
            dailyStats[todayIndex] = {
              ...dailyStats[todayIndex],
              totalWatchTime: dailyStats[todayIndex].totalWatchTime + duration,
              sessions: dailyStats[todayIndex].sessions + 1,
              channelsWatched: Object.keys(updatedChannelStats).filter(id => 
                updatedChannelStats[id].lastWatched > new Date(today).getTime()
              ).length
            }
          } else {
            dailyStats.push({
              date: today,
              totalWatchTime: duration,
              channelsWatched: 1,
              sessions: 1,
            })
          }
          
          // Keep only last 90 days
          dailyStats = dailyStats
            .sort((a, b) => b.date.localeCompare(a.date))
            .slice(0, 90)
          
          return {
            channelStats: updatedChannelStats,
            dailyStats,
            totalWatchTime: state.totalWatchTime + duration,
            totalSessions: state.totalSessions + 1,
            firstUseDate: state.firstUseDate || Date.now(),
          }
        })
      },

      getTopChannels: (limit = 10) => {
        const stats = Object.values(get().channelStats)
        return stats
          .sort((a, b) => b.totalWatchTime - a.totalWatchTime)
          .slice(0, limit)
      },

      getWatchTimeToday: () => {
        const today = getTodayKey()
        const todayStats = get().dailyStats.find(d => d.date === today)
        return todayStats?.totalWatchTime || 0
      },

      getWatchTimeThisWeek: () => {
        const now = new Date()
        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
        const weekAgoKey = weekAgo.toISOString().split('T')[0]
        
        return get().dailyStats
          .filter(d => d.date >= weekAgoKey)
          .reduce((sum, d) => sum + d.totalWatchTime, 0)
      },

      getWatchTimeThisMonth: () => {
        const now = new Date()
        const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
        const monthAgoKey = monthAgo.toISOString().split('T')[0]
        
        return get().dailyStats
          .filter(d => d.date >= monthAgoKey)
          .reduce((sum, d) => sum + d.totalWatchTime, 0)
      },

      getDailyStats: (days = 7) => {
        return get().dailyStats.slice(0, days)
      },

      clearStats: () => set({
        channelStats: {},
        dailyStats: [],
        totalWatchTime: 0,
        totalSessions: 0,
        firstUseDate: null,
      }),
    }),
    {
      name: "openiptv-statistics",
    }
  )
)

// Helper to format watch time
export function formatWatchTime(seconds: number): string {
  if (seconds < 60) return `${seconds}s`
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m`
  const hours = Math.floor(seconds / 3600)
  const mins = Math.floor((seconds % 3600) / 60)
  return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`
}
