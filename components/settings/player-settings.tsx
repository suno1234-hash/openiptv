"use client"

import { useState } from "react"
import { Play, Volume2, Clock, Subtitles, Zap, RotateCcw } from "lucide-react"
import { usePreferencesStore } from "@/lib/store/preferences-store"
import { cn } from "@/lib/utils"

const LANGUAGES = [
  { code: "en", name: "English" },
  { code: "es", name: "Spanish" },
  { code: "fr", name: "French" },
  { code: "de", name: "German" },
  { code: "it", name: "Italian" },
  { code: "pt", name: "Portuguese" },
  { code: "ru", name: "Russian" },
  { code: "ar", name: "Arabic" },
  { code: "zh", name: "Chinese" },
  { code: "ja", name: "Japanese" },
  { code: "ko", name: "Korean" },
  { code: "hi", name: "Hindi" },
]

const SLEEP_OPTIONS = [
  { value: null, label: "Off" },
  { value: 15, label: "15 min" },
  { value: 30, label: "30 min" },
  { value: 45, label: "45 min" },
  { value: 60, label: "1 hour" },
  { value: 90, label: "1.5 hours" },
  { value: 120, label: "2 hours" },
]

export function PlayerSettings() {
  const { 
    player, 
    setBufferSettings,
    setAudioLanguage,
    setSubtitleLanguage,
    setSubtitlesEnabled,
    setResumeLastChannel,
    setSleepTimer,
    clearSleepTimer,
    setAutoplay,
    setShowChannelInfo,
    resetToDefaults,
  } = usePreferencesStore()

  const [bufferLength, setBufferLengthLocal] = useState(player.bufferLength)
  const [maxBuffer, setMaxBufferLocal] = useState(player.maxBufferLength)

  const handleBufferSave = () => {
    setBufferSettings(bufferLength, maxBuffer, player.lowLatencyMode)
  }

  const remainingSleepTime = player.sleepTimerEndTime 
    ? Math.max(0, Math.floor((player.sleepTimerEndTime - Date.now()) / 60000))
    : null

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary/10">
            <Play className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h3 className="font-semibold">Player Settings</h3>
            <p className="text-sm text-muted-foreground">
              Playback and buffer options
            </p>
          </div>
        </div>
        <button
          onClick={resetToDefaults}
          className="p-2 text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition-colors"
          title="Reset to defaults"
        >
          <RotateCcw className="h-4 w-4" />
        </button>
      </div>

      {/* Playback */}
      <div className="space-y-3">
        <h4 className="text-sm font-medium">Playback</h4>
        
        <label className="flex items-center justify-between p-3 bg-muted/50 rounded-lg cursor-pointer">
          <div>
            <p className="text-sm font-medium">Autoplay</p>
            <p className="text-xs text-muted-foreground">Start playing when channel is selected</p>
          </div>
          <input
            type="checkbox"
            checked={player.autoplay}
            onChange={(e) => setAutoplay(e.target.checked)}
            className="w-5 h-5 rounded"
          />
        </label>

        <label className="flex items-center justify-between p-3 bg-muted/50 rounded-lg cursor-pointer">
          <div>
            <p className="text-sm font-medium">Resume Last Channel</p>
            <p className="text-xs text-muted-foreground">Auto-play last watched channel on startup</p>
          </div>
          <input
            type="checkbox"
            checked={player.resumeLastChannel}
            onChange={(e) => setResumeLastChannel(e.target.checked)}
            className="w-5 h-5 rounded"
          />
        </label>

        <label className="flex items-center justify-between p-3 bg-muted/50 rounded-lg cursor-pointer">
          <div>
            <p className="text-sm font-medium">Show Channel Info</p>
            <p className="text-xs text-muted-foreground">Display overlay when switching channels</p>
          </div>
          <input
            type="checkbox"
            checked={player.showChannelInfo}
            onChange={(e) => setShowChannelInfo(e.target.checked)}
            className="w-5 h-5 rounded"
          />
        </label>
      </div>

      {/* Buffer Settings */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Zap className="h-4 w-4 text-primary" />
          <h4 className="text-sm font-medium">Buffer Settings</h4>
        </div>
        
        <div className="p-4 bg-muted/50 rounded-lg space-y-4">
          <div>
            <div className="flex justify-between mb-2">
              <label className="text-sm">Buffer Length</label>
              <span className="text-sm text-muted-foreground">{bufferLength}s</span>
            </div>
            <input
              type="range"
              min={5}
              max={60}
              value={bufferLength}
              onChange={(e) => setBufferLengthLocal(Number(e.target.value))}
              className="w-full"
            />
            <p className="text-xs text-muted-foreground mt-1">
              Higher = smoother playback, lower = less delay
            </p>
          </div>

          <div>
            <div className="flex justify-between mb-2">
              <label className="text-sm">Max Buffer</label>
              <span className="text-sm text-muted-foreground">{maxBuffer}s</span>
            </div>
            <input
              type="range"
              min={30}
              max={120}
              value={maxBuffer}
              onChange={(e) => setMaxBufferLocal(Number(e.target.value))}
              className="w-full"
            />
          </div>

          <button
            onClick={handleBufferSave}
            className="w-full py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium"
          >
            Apply Buffer Settings
          </button>
        </div>
      </div>

      {/* Sleep Timer */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Clock className="h-4 w-4 text-primary" />
          <h4 className="text-sm font-medium">Sleep Timer</h4>
          {remainingSleepTime !== null && remainingSleepTime > 0 && (
            <span className="text-xs px-2 py-0.5 bg-primary/20 text-primary rounded-full">
              {remainingSleepTime}m remaining
            </span>
          )}
        </div>
        
        <div className="grid grid-cols-4 gap-2">
          {SLEEP_OPTIONS.map((option) => (
            <button
              key={option.label}
              onClick={() => option.value ? setSleepTimer(option.value) : clearSleepTimer()}
              className={cn(
                "p-2 text-sm rounded-lg border transition-colors",
                player.sleepTimerMinutes === option.value
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-border hover:bg-muted"
              )}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      {/* Audio & Subtitles */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Subtitles className="h-4 w-4 text-primary" />
          <h4 className="text-sm font-medium">Audio & Subtitles</h4>
        </div>
        
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Preferred Audio</label>
            <select
              value={player.preferredAudioLanguage}
              onChange={(e) => setAudioLanguage(e.target.value)}
              className="w-full p-2 bg-muted rounded-lg text-sm"
            >
              {LANGUAGES.map((lang) => (
                <option key={lang.code} value={lang.code}>{lang.name}</option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Preferred Subtitles</label>
            <select
              value={player.preferredSubtitleLanguage}
              onChange={(e) => setSubtitleLanguage(e.target.value)}
              className="w-full p-2 bg-muted rounded-lg text-sm"
            >
              {LANGUAGES.map((lang) => (
                <option key={lang.code} value={lang.code}>{lang.name}</option>
              ))}
            </select>
          </div>
        </div>

        <label className="flex items-center justify-between p-3 bg-muted/50 rounded-lg cursor-pointer">
          <div>
            <p className="text-sm font-medium">Enable Subtitles</p>
            <p className="text-xs text-muted-foreground">Show subtitles when available</p>
          </div>
          <input
            type="checkbox"
            checked={player.subtitlesEnabled}
            onChange={(e) => setSubtitlesEnabled(e.target.checked)}
            className="w-5 h-5 rounded"
          />
        </label>
      </div>
    </div>
  )
}
