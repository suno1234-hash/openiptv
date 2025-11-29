"use client"

import { useState, useEffect } from "react"
import { Download, Trash2, Clock, HardDrive, Video } from "lucide-react"
import { streamRecorder, Recording } from "@/lib/recording/recorder"
import { cn } from "@/lib/utils"

export function RecordingsPanel() {
  const [recordings, setRecordings] = useState<Recording[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadRecordings()
  }, [])

  const loadRecordings = async () => {
    try {
      const recs = await streamRecorder.getAllRecordings()
      setRecordings(recs.sort((a, b) => b.startTime.getTime() - a.startTime.getTime()))
    } catch (error) {
      console.error("Failed to load recordings:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleDownload = (recording: Recording) => {
    streamRecorder.downloadRecording(recording)
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this recording?")) return

    try {
      await streamRecorder.deleteRecording(id)
      await loadRecordings()
    } catch (error) {
      console.error("Failed to delete recording:", error)
      alert("Failed to delete recording")
    }
  }

  const getTotalSize = () => {
    return recordings.reduce((total, rec) => total + rec.size, 0)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-pulse">Loading recordings...</div>
      </div>
    )
  }

  if (recordings.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-center">
        <Video className="h-12 w-12 mb-3 opacity-50 text-muted-foreground" />
        <p className="text-sm text-muted-foreground mb-2">No recordings yet</p>
        <p className="text-xs text-muted-foreground">
          Click the record button (○) while watching to start recording
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Summary */}
      <div className="grid grid-cols-2 gap-4">
        <div className="p-4 bg-muted rounded-lg">
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
            <Video className="h-4 w-4" />
            <span>Total Recordings</span>
          </div>
          <p className="text-2xl font-bold">{recordings.length}</p>
        </div>
        <div className="p-4 bg-muted rounded-lg">
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
            <HardDrive className="h-4 w-4" />
            <span>Total Size</span>
          </div>
          <p className="text-2xl font-bold">{streamRecorder.formatSize(getTotalSize())}</p>
        </div>
      </div>

      {/* Recordings List */}
      <div className="space-y-2">
        {recordings.map((recording) => (
          <div
            key={recording.id}
            className="p-4 rounded-lg border hover:border-primary transition-colors"
          >
            <div className="flex items-start justify-between mb-2">
              <div className="flex-1 min-w-0">
                <h4 className="font-semibold truncate">{recording.channelName}</h4>
                <div className="flex items-center gap-3 text-sm text-muted-foreground mt-1">
                  <span className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {streamRecorder.formatDuration(recording.duration)}
                  </span>
                  <span className="flex items-center gap-1">
                    <HardDrive className="h-3 w-3" />
                    {streamRecorder.formatSize(recording.size)}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {new Date(recording.startTime).toLocaleString()}
                </p>
              </div>

              <div className="flex items-center gap-2 ml-4">
                <span
                  className={cn(
                    "px-2 py-1 text-xs rounded",
                    recording.status === "completed"
                      ? "bg-green-500/10 text-green-500"
                      : recording.status === "recording"
                      ? "bg-red-500/10 text-red-500"
                      : "bg-yellow-500/10 text-yellow-500"
                  )}
                >
                  {recording.status}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => handleDownload(recording)}
                className="flex items-center gap-2 px-3 py-1.5 text-sm bg-primary text-primary-foreground rounded hover:bg-primary/90 transition-colors"
              >
                <Download className="h-4 w-4" />
                Download
              </button>
              <button
                onClick={() => handleDelete(recording.id)}
                className="flex items-center gap-2 px-3 py-1.5 text-sm bg-destructive/10 text-destructive rounded hover:bg-destructive/20 transition-colors"
              >
                <Trash2 className="h-4 w-4" />
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Info */}
      <div className="p-4 bg-muted/50 rounded-lg text-sm text-muted-foreground">
        <p className="font-medium mb-2">⚠️ Important Notes:</p>
        <ul className="space-y-1 text-xs">
          <li>• Recordings are stored in your browser (IndexedDB)</li>
          <li>• Browser storage is limited (typically 50MB-5GB)</li>
          <li>• Clearing browser data will delete recordings</li>
          <li>• Download recordings to save them permanently</li>
          <li>• Format: WebM (compatible with most players)</li>
        </ul>
      </div>
    </div>
  )
}
