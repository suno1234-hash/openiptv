"use client"

import { useState, useEffect, useCallback } from "react"
import { Clock, Play, Rewind, Calendar, ChevronLeft, ChevronRight, History, ArrowLeft } from "lucide-react"
import { Channel } from "@/lib/types"
import { EPGProgram } from "@/lib/epg/types"
import { epgManager } from "@/lib/epg/epg-manager"
import { catchupManager } from "@/lib/catchup/catchup-manager"
import { cn } from "@/lib/utils"

interface CatchupPanelProps {
  channel: Channel
  onPlayProgram: (url: string, program: EPGProgram) => void
  onClose?: () => void
}

export function CatchupPanel({ channel, onPlayProgram, onClose }: CatchupPanelProps) {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date())
  const [schedule, setSchedule] = useState<{
    past: EPGProgram[]
    current: EPGProgram | null
    upcoming: EPGProgram[]
  }>({ past: [], current: null, upcoming: [] })
  const [isLoading, setIsLoading] = useState(true)

  const hasCatchup = catchupManager.hasCatchup(channel)
  const catchupDays = catchupManager.getCatchupDays(channel)

  // Load schedule for selected date
  useEffect(() => {
    setIsLoading(true)
    const programs = epgManager.getProgramsForDate(channel.name, selectedDate)
    
    const now = new Date()
    const isToday = selectedDate.toDateString() === now.toDateString()
    
    if (isToday) {
      setSchedule(epgManager.getTodaySchedule(channel.name))
    } else {
      // For past dates, all programs are "past"
      const isPastDate = selectedDate < now
      setSchedule({
        past: isPastDate ? programs : [],
        current: null,
        upcoming: isPastDate ? [] : programs,
      })
    }
    setIsLoading(false)
  }, [channel.name, selectedDate])

  const handlePlayProgram = useCallback((program: EPGProgram) => {
    const url = catchupManager.buildCatchupUrl(channel, program)
    if (url) {
      onPlayProgram(url, program)
    }
  }, [channel, onPlayProgram])

  const handleWatchFromStart = useCallback(() => {
    if (schedule.current) {
      const url = catchupManager.getWatchFromStartUrl(channel, schedule.current)
      if (url) {
        onPlayProgram(url, schedule.current)
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [channel, onPlayProgram])

  // Navigate dates
  const goToPreviousDay = () => {
    const newDate = new Date(selectedDate)
    newDate.setDate(newDate.getDate() - 1)
    
    // Don't go beyond catchup window
    const earliestDate = catchupManager.getEarliestCatchupTime(channel)
    if (earliestDate && newDate >= earliestDate) {
      setSelectedDate(newDate)
    }
  }

  const goToNextDay = () => {
    const newDate = new Date(selectedDate)
    newDate.setDate(newDate.getDate() + 1)
    
    // Don't go beyond today
    if (newDate <= new Date()) {
      setSelectedDate(newDate)
    }
  }

  const isToday = selectedDate.toDateString() === new Date().toDateString()
  const canGoPrevious = hasCatchup && selectedDate > (catchupManager.getEarliestCatchupTime(channel) || new Date())
  const canGoNext = !isToday

  if (!hasCatchup) {
    return (
      <div className="p-4 bg-card rounded-xl border space-y-3">
        {/* Back button */}
        {onClose && (
          <button
            onClick={onClose}
            className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </button>
        )}
        
        <div className="text-center">
          <History className="h-8 w-8 mx-auto text-muted-foreground" />
          <div className="mt-2">
            <p className="text-sm font-medium text-foreground">
              Catchup not available
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              This channel doesn&apos;t support catchup/timeshift.
            </p>
          </div>
          <div className="text-xs text-muted-foreground/70 pt-3 mt-3 border-t">
            <p>Catchup requires your IPTV provider to include</p>
            <p className="font-mono text-[10px] mt-1 bg-muted px-2 py-1 rounded inline-block">
              catchup=&quot;default&quot; catchup-days=&quot;7&quot;
            </p>
            <p className="mt-1">or similar attributes in the playlist.</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-card rounded-xl border overflow-hidden">
      {/* Header with Back Button */}
      <div className="p-4 border-b bg-gradient-to-r from-primary/10 to-transparent">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            {onClose && (
              <button
                onClick={onClose}
                className="p-1.5 -ml-1 rounded-lg hover:bg-accent transition-colors"
                title="Back to program info"
              >
                <ArrowLeft className="h-4 w-4" />
              </button>
            )}
            <History className="h-5 w-5 text-primary" />
            <h3 className="font-semibold">Catchup TV</h3>
            <span className="text-xs px-2 py-0.5 bg-primary/20 text-primary rounded-full">
              {catchupDays} days
            </span>
          </div>
        </div>

        {/* Date Navigation */}
        <div className="flex items-center justify-between">
          <button
            onClick={goToPreviousDay}
            disabled={!canGoPrevious}
            className={cn(
              "p-2 rounded-lg transition-colors",
              canGoPrevious ? "hover:bg-accent" : "opacity-50 cursor-not-allowed"
            )}
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <span className="font-medium">
              {isToday ? "Today" : selectedDate.toLocaleDateString(undefined, {
                weekday: "short",
                month: "short",
                day: "numeric",
              })}
            </span>
          </div>
          
          <button
            onClick={goToNextDay}
            disabled={!canGoNext}
            className={cn(
              "p-2 rounded-lg transition-colors",
              canGoNext ? "hover:bg-accent" : "opacity-50 cursor-not-allowed"
            )}
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* Watch from Start (for current program) */}
      {schedule.current && isToday && (
        <div className="p-3 border-b bg-gradient-to-r from-red-500/10 to-transparent">
          <button
            onClick={handleWatchFromStart}
            className="w-full flex items-center gap-3 p-3 rounded-lg bg-primary/10 hover:bg-primary/20 transition-colors"
          >
            <div className="p-2 rounded-full bg-primary/20">
              <Rewind className="h-5 w-5 text-primary" />
            </div>
            <div className="flex-1 text-left">
              <p className="font-medium text-sm">Watch from Start</p>
              <p className="text-xs text-muted-foreground">
                {schedule.current.title} • Started {epgManager.getTimeRemaining(schedule.current)} ago
              </p>
            </div>
            <Play className="h-5 w-5 text-primary" />
          </button>
        </div>
      )}

      {/* Program List */}
      <div className="max-h-[400px] overflow-y-auto">
        {isLoading ? (
          <div className="p-8 text-center text-muted-foreground">
            <div className="animate-spin w-6 h-6 border-2 border-primary border-t-transparent rounded-full mx-auto mb-2" />
            Loading schedule...
          </div>
        ) : (
          <>
            {/* Past Programs (available for catchup) */}
            {schedule.past.length > 0 && (
              <div className="p-2">
                <p className="px-2 py-1 text-xs font-medium text-muted-foreground uppercase">
                  Available to Watch
                </p>
                {schedule.past.map((program) => (
                  <ProgramItem
                    key={program.id}
                    program={program}
                    isAvailable={catchupManager.isProgramAvailable(channel, program)}
                    onPlay={() => handlePlayProgram(program)}
                  />
                ))}
              </div>
            )}

            {/* Current Program */}
            {schedule.current && isToday && (
              <div className="p-2 border-t">
                <p className="px-2 py-1 text-xs font-medium text-red-500 uppercase flex items-center gap-1">
                  <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                  Now Playing
                </p>
                <ProgramItem
                  program={schedule.current}
                  isLive
                  progress={epgManager.getProgramProgress(schedule.current)}
                />
              </div>
            )}

            {/* Upcoming Programs */}
            {schedule.upcoming.length > 0 && (
              <div className="p-2 border-t">
                <p className="px-2 py-1 text-xs font-medium text-muted-foreground uppercase">
                  Coming Up
                </p>
                {schedule.upcoming.slice(0, 5).map((program) => (
                  <ProgramItem
                    key={program.id}
                    program={program}
                    isUpcoming
                  />
                ))}
              </div>
            )}

            {schedule.past.length === 0 && !schedule.current && schedule.upcoming.length === 0 && (
              <div className="p-8 text-center text-muted-foreground">
                <Clock className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No program data available</p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}

interface ProgramItemProps {
  program: EPGProgram
  isLive?: boolean
  isUpcoming?: boolean
  isAvailable?: boolean
  progress?: number
  onPlay?: () => void
}

function ProgramItem({ program, isLive, isUpcoming, isAvailable = true, progress, onPlay }: ProgramItemProps) {
  const startTime = new Date(program.start).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
  const endTime = new Date(program.end).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
  const duration = epgManager.getProgramDuration(program)

  return (
    <div
      className={cn(
        "flex items-center gap-3 p-3 rounded-lg transition-all",
        isLive && "bg-red-500/10",
        isUpcoming && "opacity-60",
        !isLive && !isUpcoming && isAvailable && "hover:bg-accent cursor-pointer group",
        !isAvailable && "opacity-40"
      )}
      onClick={isAvailable && !isLive && !isUpcoming ? onPlay : undefined}
    >
      {/* Time */}
      <div className="w-16 flex-shrink-0 text-center">
        <p className={cn(
          "text-sm font-medium",
          isLive && "text-red-500"
        )}>
          {startTime}
        </p>
        <p className="text-xs text-muted-foreground">{duration}</p>
      </div>

      {/* Program Info */}
      <div className="flex-1 min-w-0">
        <p className={cn(
          "font-medium text-sm truncate",
          isLive && "text-red-500"
        )}>
          {program.title}
        </p>
        {program.category && (
          <p className="text-xs text-muted-foreground">{program.category}</p>
        )}
        
        {/* Progress bar for live */}
        {isLive && progress !== undefined && (
          <div className="mt-1 w-full bg-muted rounded-full h-1">
            <div
              className="bg-red-500 h-1 rounded-full transition-all"
              style={{ width: `${progress}%` }}
            />
          </div>
        )}
      </div>

      {/* Play button for available programs */}
      {!isLive && !isUpcoming && isAvailable && (
        <div className="opacity-0 group-hover:opacity-100 transition-opacity">
          <div className="p-2 rounded-full bg-primary/20 hover:bg-primary/30">
            <Play className="h-4 w-4 text-primary" />
          </div>
        </div>
      )}

      {/* Time ago for past programs */}
      {!isLive && !isUpcoming && (
        <p className="text-xs text-muted-foreground flex-shrink-0">
          {epgManager.getTimeAgo(program)}
        </p>
      )}
    </div>
  )
}
