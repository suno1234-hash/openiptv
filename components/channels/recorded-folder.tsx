"use client"

import { useState, memo } from "react"
import { ChevronRight, Video } from "lucide-react"
import { ChannelItem } from "./channel-item"
import { useRecordingsStore } from "@/lib/store/recordings-store"
import { usePlaylistStore } from "@/lib/store/playlist-store"
import { cn } from "@/lib/utils"

type ViewMode = "grid" | "list"

interface RecordedFolderProps {
  viewMode: ViewMode
  currentChannelId?: string
  defaultExpanded?: boolean
}

export const RecordedFolder = memo(function RecordedFolder({
  viewMode,
  currentChannelId,
  defaultExpanded = false
}: RecordedFolderProps) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded)
  const { recordings, recordingsByChannel } = useRecordingsStore()
  const { getVisibleChannels } = usePlaylistStore()
  
  // Get channels that have recordings
  const channelsWithRecordings = getVisibleChannels().filter(
    channel => recordingsByChannel[channel.id]?.length > 0
  )
  
  const totalRecordings = recordings.length
  
  // Don't render if no recordings
  if (channelsWithRecordings.length === 0) {
    return null
  }

  return (
    <div className="mb-1">
      {/* Folder Header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className={cn(
          "w-full flex items-center gap-2 p-2 rounded-lg hover:bg-accent/50 transition-colors",
          isExpanded && "bg-accent/30"
        )}
      >
        <ChevronRight 
          className={cn(
            "h-4 w-4 transition-transform duration-200",
            isExpanded && "rotate-90"
          )}
        />
        <Video className="h-4 w-4 text-red-500" />
        <span className="font-medium flex-1 text-left">Recorded</span>
        <span className="text-xs text-muted-foreground bg-red-500/10 text-red-400 px-2 py-0.5 rounded-full">
          {totalRecordings} recording{totalRecordings !== 1 ? 's' : ''}
        </span>
        <span className="text-xs text-muted-foreground">
          {channelsWithRecordings.length} channel{channelsWithRecordings.length !== 1 ? 's' : ''}
        </span>
      </button>
      
      {/* Channel List */}
      {isExpanded && (
        <div className={cn(
          "ml-6 mt-1",
          viewMode === "grid"
            ? "grid grid-cols-1 sm:grid-cols-2 gap-2"
            : "space-y-1"
        )}>
          {channelsWithRecordings.map((channel) => (
            <ChannelItem
              key={channel.id}
              channel={channel}
              viewMode={viewMode}
              isActive={currentChannelId === channel.id}
            />
          ))}
        </div>
      )}
    </div>
  )
})
