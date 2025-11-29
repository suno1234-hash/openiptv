import { create } from "zustand"
import { persist } from "zustand/middleware"

interface PlayerPreferences {
  volume: number
  muted: boolean
  autoplay: boolean
  autoNextChannel: boolean
  autoNextDelay: number // seconds before auto-switching
  preferredQuality: "auto" | "high" | "medium" | "low"
  showChannelInfo: boolean
  channelInfoDuration: number // seconds to show channel info overlay
  // Buffer settings
  bufferLength: number // seconds of buffer (5-60)
  maxBufferLength: number // max buffer before pausing (30-120)
  lowLatencyMode: boolean
  // Subtitle/Audio
  preferredAudioLanguage: string
  preferredSubtitleLanguage: string
  subtitlesEnabled: boolean
  // Resume
  lastChannelId: string | null
  resumeLastChannel: boolean
  // Sleep timer
  sleepTimerMinutes: number | null
  sleepTimerEndTime: number | null
}

interface UIPreferences {
  viewMode: "grid" | "list"
  showHiddenChannels: boolean
  channelListWidth: number
  theme: "dark" | "light" | "system"
  accentColor: string // hex color
  animationsEnabled: boolean
  compactMode: boolean
  showChannelNumbers: boolean
  showStreamInfo: boolean
  // EPG
  epgCompactView: boolean
}

interface PreferencesStore {
  player: PlayerPreferences
  ui: UIPreferences
  
  // Player Actions
  setVolume: (volume: number) => void
  setMuted: (muted: boolean) => void
  setAutoplay: (autoplay: boolean) => void
  setAutoNextChannel: (enabled: boolean) => void
  setAutoNextDelay: (seconds: number) => void
  setPreferredQuality: (quality: PlayerPreferences["preferredQuality"]) => void
  setShowChannelInfo: (show: boolean) => void
  setBufferSettings: (buffer: number, maxBuffer: number, lowLatency: boolean) => void
  setAudioLanguage: (lang: string) => void
  setSubtitleLanguage: (lang: string) => void
  setSubtitlesEnabled: (enabled: boolean) => void
  setLastChannel: (channelId: string | null) => void
  setResumeLastChannel: (enabled: boolean) => void
  setSleepTimer: (minutes: number | null) => void
  clearSleepTimer: () => void
  
  // UI Actions
  setViewMode: (mode: UIPreferences["viewMode"]) => void
  setChannelListWidth: (width: number) => void
  setCompactMode: (compact: boolean) => void
  setTheme: (theme: UIPreferences["theme"]) => void
  setAccentColor: (color: string) => void
  setShowChannelNumbers: (show: boolean) => void
  setShowStreamInfo: (show: boolean) => void
  setEpgCompactView: (compact: boolean) => void
  
  resetToDefaults: () => void
}

const defaultPlayerPreferences: PlayerPreferences = {
  volume: 1,
  muted: false,
  autoplay: true,
  autoNextChannel: false,
  autoNextDelay: 5,
  preferredQuality: "auto",
  showChannelInfo: true,
  channelInfoDuration: 5,
  // Buffer
  bufferLength: 30,
  maxBufferLength: 60,
  lowLatencyMode: false,
  // Subtitle/Audio
  preferredAudioLanguage: "en",
  preferredSubtitleLanguage: "en",
  subtitlesEnabled: false,
  // Resume
  lastChannelId: null,
  resumeLastChannel: true,
  // Sleep timer
  sleepTimerMinutes: null,
  sleepTimerEndTime: null,
}

const defaultUIPreferences: UIPreferences = {
  viewMode: "grid",
  showHiddenChannels: false,
  channelListWidth: 320,
  theme: "dark",
  accentColor: "#3b82f6", // Blue
  animationsEnabled: true,
  compactMode: false,
  showChannelNumbers: true,
  showStreamInfo: false,
  epgCompactView: true,
}

export const usePreferencesStore = create<PreferencesStore>()(
  persist(
    (set) => ({
      player: defaultPlayerPreferences,
      ui: defaultUIPreferences,

      setVolume: (volume) =>
        set((state) => ({
          player: { ...state.player, volume: Math.max(0, Math.min(1, volume)) },
        })),

      setMuted: (muted) =>
        set((state) => ({
          player: { ...state.player, muted },
        })),

      setAutoplay: (autoplay) =>
        set((state) => ({
          player: { ...state.player, autoplay },
        })),

      setAutoNextChannel: (enabled) =>
        set((state) => ({
          player: { ...state.player, autoNextChannel: enabled },
        })),

      setAutoNextDelay: (seconds) =>
        set((state) => ({
          player: { ...state.player, autoNextDelay: Math.max(1, seconds) },
        })),

      setPreferredQuality: (quality) =>
        set((state) => ({
          player: { ...state.player, preferredQuality: quality },
        })),

      setShowChannelInfo: (show) =>
        set((state) => ({
          player: { ...state.player, showChannelInfo: show },
        })),

      setBufferSettings: (buffer, maxBuffer, lowLatency) =>
        set((state) => ({
          player: { 
            ...state.player, 
            bufferLength: Math.max(5, Math.min(60, buffer)),
            maxBufferLength: Math.max(30, Math.min(120, maxBuffer)),
            lowLatencyMode: lowLatency,
          },
        })),

      setAudioLanguage: (lang) =>
        set((state) => ({
          player: { ...state.player, preferredAudioLanguage: lang },
        })),

      setSubtitleLanguage: (lang) =>
        set((state) => ({
          player: { ...state.player, preferredSubtitleLanguage: lang },
        })),

      setSubtitlesEnabled: (enabled) =>
        set((state) => ({
          player: { ...state.player, subtitlesEnabled: enabled },
        })),

      setLastChannel: (channelId) =>
        set((state) => ({
          player: { ...state.player, lastChannelId: channelId },
        })),

      setResumeLastChannel: (enabled) =>
        set((state) => ({
          player: { ...state.player, resumeLastChannel: enabled },
        })),

      setSleepTimer: (minutes) =>
        set((state) => ({
          player: { 
            ...state.player, 
            sleepTimerMinutes: minutes,
            sleepTimerEndTime: minutes ? Date.now() + minutes * 60 * 1000 : null,
          },
        })),

      clearSleepTimer: () =>
        set((state) => ({
          player: { 
            ...state.player, 
            sleepTimerMinutes: null,
            sleepTimerEndTime: null,
          },
        })),

      setViewMode: (mode) =>
        set((state) => ({
          ui: { ...state.ui, viewMode: mode },
        })),

      setChannelListWidth: (width) =>
        set((state) => ({
          ui: { ...state.ui, channelListWidth: Math.max(200, Math.min(600, width)) },
        })),

      setCompactMode: (compact) =>
        set((state) => ({
          ui: { ...state.ui, compactMode: compact },
        })),

      setTheme: (theme) =>
        set((state) => ({
          ui: { ...state.ui, theme },
        })),

      setAccentColor: (color) =>
        set((state) => ({
          ui: { ...state.ui, accentColor: color },
        })),

      setShowChannelNumbers: (show) =>
        set((state) => ({
          ui: { ...state.ui, showChannelNumbers: show },
        })),

      setShowStreamInfo: (show) =>
        set((state) => ({
          ui: { ...state.ui, showStreamInfo: show },
        })),

      setEpgCompactView: (compact) =>
        set((state) => ({
          ui: { ...state.ui, epgCompactView: compact },
        })),

      resetToDefaults: () =>
        set({
          player: defaultPlayerPreferences,
          ui: defaultUIPreferences,
        }),
    }),
    {
      name: "openiptv-preferences",
    }
  )
)
