import { create } from "zustand"
import { useShallow } from "zustand/react/shallow"
import { Recording, streamRecorder } from "@/lib/recording/recorder"

// Use Record instead of Map for better Zustand reactivity
type RecordingsByChannel = Record<string, Recording[]>

interface RecordingsState {
  recordings: Recording[]
  recordingsByChannel: RecordingsByChannel
  isLoading: boolean
}

interface RecordingsActions {
  initialize: () => Promise<void>
  refreshRecordings: () => Promise<void>
  deleteRecording: (id: string) => Promise<void>
}

type RecordingsStore = RecordingsState & RecordingsActions

// Helper: Group recordings by channel - O(n) instead of O(n²)
function groupByChannel(recordings: Recording[]): RecordingsByChannel {
  const result: RecordingsByChannel = {}
  for (const recording of recordings) {
    const channelId = recording.channelId
    if (!result[channelId]) {
      result[channelId] = []
    }
    result[channelId].push(recording)
  }
  return result
}

export const useRecordingsStore = create<RecordingsStore>((set, get) => ({
  recordings: [],
  recordingsByChannel: {},
  isLoading: false,

  initialize: async () => {
    set({ isLoading: true })
    try {
      const recordings = await streamRecorder.getAllRecordings()
      const recordingsByChannel = groupByChannel(recordings)
      set({ recordings, recordingsByChannel, isLoading: false })
    } catch (error) {
      console.error("Failed to load recordings:", error)
      set({ isLoading: false })
    }
  },

  refreshRecordings: async () => {
    await get().initialize()
  },

  deleteRecording: async (id: string) => {
    const { recordings } = get()
    
    // Optimistic update: remove from state immediately
    const updatedRecordings = recordings.filter(r => r.id !== id)
    const updatedByChannel = groupByChannel(updatedRecordings)
    set({ recordings: updatedRecordings, recordingsByChannel: updatedByChannel })
    
    try {
      await streamRecorder.deleteRecording(id)
    } catch (error) {
      console.error("Failed to delete recording:", error)
      // Rollback on error
      set({ recordings, recordingsByChannel: groupByChannel(recordings) })
    }
  },
}))

// ─────────────────────────────────────────────────────────────────────────────
// Memoized selectors - prevent unnecessary re-renders
// ─────────────────────────────────────────────────────────────────────────────

/** Select recordings for a specific channel */
export const useRecordingsForChannel = (channelId: string) =>
  useRecordingsStore((state) => state.recordingsByChannel[channelId] ?? [])

/** Check if a channel has any recordings */
export const useHasRecordings = (channelId: string) =>
  useRecordingsStore((state) => {
    const recs = state.recordingsByChannel[channelId]
    return recs !== undefined && recs.length > 0
  })

/** Get recording count for a channel */
export const useRecordingCount = (channelId: string) =>
  useRecordingsStore((state) => state.recordingsByChannel[channelId]?.length ?? 0)

/** Select multiple state values with shallow comparison */
export const useRecordingsState = () =>
  useRecordingsStore(
    useShallow((state) => ({
      recordings: state.recordings,
      isLoading: state.isLoading,
    }))
  )

/** Select only actions (stable references, no re-render on state change) */
export const useRecordingsActions = () =>
  useRecordingsStore(
    useShallow((state) => ({
      initialize: state.initialize,
      refreshRecordings: state.refreshRecordings,
      deleteRecording: state.deleteRecording,
    }))
  )
