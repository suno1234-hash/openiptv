"use client"

import { BarChart3, Clock, Tv, Calendar, TrendingUp, Trash2 } from "lucide-react"
import { useStatisticsStore, formatWatchTime } from "@/lib/store/statistics-store"

export function StatisticsPanel() {
  const {
    totalWatchTime,
    totalSessions,
    firstUseDate,
    getTopChannels,
    getWatchTimeToday,
    getWatchTimeThisWeek,
    getWatchTimeThisMonth,
    getDailyStats,
    clearStats,
  } = useStatisticsStore()

  const topChannels = getTopChannels(5)
  const dailyStats = getDailyStats(7)
  const watchToday = getWatchTimeToday()
  const watchThisWeek = getWatchTimeThisWeek()
  const watchThisMonth = getWatchTimeThisMonth()

  const handleClear = () => {
    if (confirm("Clear all statistics? This cannot be undone.")) {
      clearStats()
    }
  }

  // Calculate max for chart scaling
  const maxDaily = Math.max(...dailyStats.map(d => d.totalWatchTime), 1)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary/10">
            <BarChart3 className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h3 className="font-semibold">Watch Statistics</h3>
            <p className="text-sm text-muted-foreground">
              Your viewing activity
            </p>
          </div>
        </div>
        <button
          onClick={handleClear}
          className="p-2 text-muted-foreground hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-colors"
          title="Clear statistics"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 gap-3">
        <div className="p-4 bg-muted/50 rounded-lg">
          <div className="flex items-center gap-2 text-muted-foreground mb-1">
            <Clock className="h-4 w-4" />
            <span className="text-xs">Today</span>
          </div>
          <p className="text-xl font-bold">{formatWatchTime(watchToday)}</p>
        </div>
        
        <div className="p-4 bg-muted/50 rounded-lg">
          <div className="flex items-center gap-2 text-muted-foreground mb-1">
            <Calendar className="h-4 w-4" />
            <span className="text-xs">This Week</span>
          </div>
          <p className="text-xl font-bold">{formatWatchTime(watchThisWeek)}</p>
        </div>
        
        <div className="p-4 bg-muted/50 rounded-lg">
          <div className="flex items-center gap-2 text-muted-foreground mb-1">
            <TrendingUp className="h-4 w-4" />
            <span className="text-xs">This Month</span>
          </div>
          <p className="text-xl font-bold">{formatWatchTime(watchThisMonth)}</p>
        </div>
        
        <div className="p-4 bg-muted/50 rounded-lg">
          <div className="flex items-center gap-2 text-muted-foreground mb-1">
            <Tv className="h-4 w-4" />
            <span className="text-xs">Total Sessions</span>
          </div>
          <p className="text-xl font-bold">{totalSessions}</p>
        </div>
      </div>

      {/* Daily Chart */}
      {dailyStats.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-medium">Last 7 Days</h4>
          <div className="flex items-end gap-1 h-20">
            {dailyStats.map((day, i) => {
              const height = (day.totalWatchTime / maxDaily) * 100
              const date = new Date(day.date)
              const dayName = date.toLocaleDateString([], { weekday: "short" })
              
              return (
                <div key={day.date} className="flex-1 flex flex-col items-center gap-1">
                  <div
                    className="w-full bg-primary/20 rounded-t relative group cursor-pointer"
                    style={{ height: `${Math.max(height, 4)}%` }}
                  >
                    <div
                      className="absolute bottom-0 left-0 right-0 bg-primary rounded-t transition-all"
                      style={{ height: `${height}%` }}
                    />
                    {/* Tooltip */}
                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-popover border rounded text-xs opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
                      {formatWatchTime(day.totalWatchTime)}
                    </div>
                  </div>
                  <span className="text-[10px] text-muted-foreground">{dayName}</span>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Top Channels */}
      {topChannels.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-medium">Most Watched Channels</h4>
          <div className="space-y-2">
            {topChannels.map((channel, i) => (
              <div
                key={channel.channelId}
                className="flex items-center gap-3 p-2 bg-muted/30 rounded-lg"
              >
                <span className="w-5 h-5 flex items-center justify-center text-xs font-bold text-muted-foreground">
                  {i + 1}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{channel.channelName}</p>
                  <p className="text-xs text-muted-foreground">
                    {formatWatchTime(channel.totalWatchTime)} • {channel.sessionCount} sessions
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Empty State */}
      {totalSessions === 0 && (
        <div className="text-center py-8 text-muted-foreground">
          <BarChart3 className="h-12 w-12 mx-auto mb-3 opacity-30" />
          <p>No watch history yet</p>
          <p className="text-sm">Start watching to see your statistics</p>
        </div>
      )}

      {/* Footer */}
      {firstUseDate && (
        <p className="text-xs text-muted-foreground text-center">
          Tracking since {new Date(firstUseDate).toLocaleDateString()}
        </p>
      )}
    </div>
  )
}
