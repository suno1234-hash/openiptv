"use client"

import { useState, useEffect, useMemo } from "react"
import { Search, X, Calendar, Clock, Play, Tv } from "lucide-react"
import { epgManager } from "@/lib/epg/epg-manager"
import { EPGProgram } from "@/lib/epg/types"
import { Channel } from "@/lib/types"
import { cn } from "@/lib/utils"

interface SearchResult {
  program: EPGProgram
  channelName: string
  channelId?: string
}

interface EPGSearchProps {
  channels: Channel[]
  onSelectProgram: (channelName: string, program: EPGProgram) => void
  isOpen: boolean
  onClose: () => void
}

export function EPGSearch({ channels, onSelectProgram, isOpen, onClose }: EPGSearchProps) {
  const [query, setQuery] = useState("")
  const [results, setResults] = useState<SearchResult[]>([])
  const [isSearching, setIsSearching] = useState(false)

  // Debounced search
  useEffect(() => {
    if (!query || query.length < 2) {
      setResults([])
      return
    }

    setIsSearching(true)
    const timer = setTimeout(() => {
      const searchResults: SearchResult[] = []
      const lowerQuery = query.toLowerCase()

      // Search through all channels' programs
      for (const channel of channels) {
        const channelName = channel.tvgName || channel.name
        const schedule = epgManager.getTodaySchedule(channelName)
        const programs = [...schedule.past, ...(schedule.current ? [schedule.current] : []), ...schedule.upcoming]

        for (const program of programs) {
          const titleMatch = program.title.toLowerCase().includes(lowerQuery)
          const descMatch = program.description?.toLowerCase().includes(lowerQuery)
          const categoryMatch = program.category?.toLowerCase().includes(lowerQuery)

          if (titleMatch || descMatch || categoryMatch) {
            searchResults.push({
              program,
              channelName: channel.name,
              channelId: channel.id,
            })
          }
        }
      }

      // Sort by start time
      searchResults.sort((a, b) => a.program.start.getTime() - b.program.start.getTime())

      setResults(searchResults.slice(0, 50)) // Limit results
      setIsSearching(false)
    }, 300)

    return () => clearTimeout(timer)
  }, [query, channels])

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
  }

  const formatDate = (date: Date) => {
    const today = new Date()
    if (date.toDateString() === today.toDateString()) {
      return "Today"
    }
    return date.toLocaleDateString([], { weekday: "short", month: "short", day: "numeric" })
  }

  const isPast = (program: EPGProgram) => program.end < new Date()
  const isLive = (program: EPGProgram) => {
    const now = new Date()
    return program.start <= now && program.end > now
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 bg-black/50 backdrop-blur-sm">
      <div className="w-full max-w-2xl mx-4 bg-card rounded-xl border shadow-2xl overflow-hidden">
        {/* Search Header */}
        <div className="p-4 border-b">
          <div className="flex items-center gap-3">
            <Search className="h-5 w-5 text-muted-foreground" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search programs, movies, shows..."
              className="flex-1 bg-transparent outline-none text-lg"
              autoFocus
            />
            <button
              onClick={onClose}
              className="p-2 hover:bg-accent rounded-lg transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Results */}
        <div className="max-h-[60vh] overflow-y-auto">
          {isSearching ? (
            <div className="p-8 text-center text-muted-foreground">
              <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-2" />
              Searching...
            </div>
          ) : results.length > 0 ? (
            <div className="divide-y">
              {results.map((result, index) => (
                <button
                  key={`${result.channelId}-${result.program.start.getTime()}-${index}`}
                  onClick={() => onSelectProgram(result.channelName, result.program)}
                  className="w-full p-4 text-left hover:bg-accent/50 transition-colors"
                >
                  <div className="flex items-start gap-3">
                    <div className="p-2 rounded-lg bg-muted flex-shrink-0">
                      <Tv className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-medium truncate">{result.program.title}</h4>
                        {isLive(result.program) && (
                          <span className="px-1.5 py-0.5 text-[10px] font-bold bg-red-500 text-white rounded">
                            LIVE
                          </span>
                        )}
                        {isPast(result.program) && (
                          <span className="text-xs text-muted-foreground">(Ended)</span>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground truncate">
                        {result.channelName}
                      </p>
                      <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                        <Calendar className="h-3 w-3" />
                        <span>{formatDate(result.program.start)}</span>
                        <Clock className="h-3 w-3 ml-2" />
                        <span>
                          {formatTime(result.program.start)} - {formatTime(result.program.end)}
                        </span>
                        {result.program.category && (
                          <span className="ml-2 px-2 py-0.5 bg-primary/10 text-primary rounded">
                            {result.program.category}
                          </span>
                        )}
                      </div>
                    </div>
                    <Play className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                  </div>
                </button>
              ))}
            </div>
          ) : query.length >= 2 ? (
            <div className="p-8 text-center text-muted-foreground">
              <Search className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>No programs found for &quot;{query}&quot;</p>
              <p className="text-sm mt-1">Try different keywords</p>
            </div>
          ) : (
            <div className="p-8 text-center text-muted-foreground">
              <Search className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>Type at least 2 characters to search</p>
              <p className="text-sm mt-1">Search by title, description, or category</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-3 border-t bg-muted/50 text-xs text-muted-foreground text-center">
          {results.length > 0 && `Found ${results.length} programs`}
        </div>
      </div>
    </div>
  )
}
