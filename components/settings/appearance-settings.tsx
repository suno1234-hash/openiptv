"use client"

import { Palette, Sun, Moon, Monitor, Check } from "lucide-react"
import { usePreferencesStore } from "@/lib/store/preferences-store"
import { cn } from "@/lib/utils"

const ACCENT_COLORS = [
  { name: "Blue", value: "#3b82f6" },
  { name: "Purple", value: "#8b5cf6" },
  { name: "Pink", value: "#ec4899" },
  { name: "Red", value: "#ef4444" },
  { name: "Orange", value: "#f97316" },
  { name: "Yellow", value: "#eab308" },
  { name: "Green", value: "#22c55e" },
  { name: "Teal", value: "#14b8a6" },
  { name: "Cyan", value: "#06b6d4" },
]

export function AppearanceSettings() {
  const { ui, setTheme, setAccentColor, setShowChannelNumbers, setShowStreamInfo, setCompactMode } = usePreferencesStore()

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-lg bg-primary/10">
          <Palette className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h3 className="font-semibold">Appearance</h3>
          <p className="text-sm text-muted-foreground">
            Customize the look and feel
          </p>
        </div>
      </div>

      {/* Theme Mode */}
      <div className="space-y-3">
        <h4 className="text-sm font-medium">Theme</h4>
        <div className="grid grid-cols-3 gap-2">
          <button
            onClick={() => setTheme("light")}
            className={cn(
              "p-3 rounded-lg border transition-all",
              ui.theme === "light"
                ? "border-primary bg-primary/10"
                : "border-border hover:bg-muted"
            )}
          >
            <Sun className="h-5 w-5 mx-auto mb-1" />
            <p className="text-xs text-center">Light</p>
          </button>
          
          <button
            onClick={() => setTheme("dark")}
            className={cn(
              "p-3 rounded-lg border transition-all",
              ui.theme === "dark"
                ? "border-primary bg-primary/10"
                : "border-border hover:bg-muted"
            )}
          >
            <Moon className="h-5 w-5 mx-auto mb-1" />
            <p className="text-xs text-center">Dark</p>
          </button>
          
          <button
            onClick={() => setTheme("system")}
            className={cn(
              "p-3 rounded-lg border transition-all",
              ui.theme === "system"
                ? "border-primary bg-primary/10"
                : "border-border hover:bg-muted"
            )}
          >
            <Monitor className="h-5 w-5 mx-auto mb-1" />
            <p className="text-xs text-center">System</p>
          </button>
        </div>
      </div>

      {/* Accent Color */}
      <div className="space-y-3">
        <h4 className="text-sm font-medium">Accent Color</h4>
        <div className="grid grid-cols-5 gap-2">
          {ACCENT_COLORS.map((color) => (
            <button
              key={color.value}
              onClick={() => setAccentColor(color.value)}
              className={cn(
                "w-full aspect-square rounded-lg transition-all relative",
                ui.accentColor === color.value && "ring-2 ring-offset-2 ring-offset-background ring-white"
              )}
              style={{ backgroundColor: color.value }}
              title={color.name}
            >
              {ui.accentColor === color.value && (
                <Check className="h-4 w-4 text-white absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Display Options */}
      <div className="space-y-3">
        <h4 className="text-sm font-medium">Display Options</h4>
        
        <label className="flex items-center justify-between p-3 bg-muted/50 rounded-lg cursor-pointer">
          <div>
            <p className="text-sm font-medium">Show Channel Numbers</p>
            <p className="text-xs text-muted-foreground">Display channel numbers in list</p>
          </div>
          <input
            type="checkbox"
            checked={ui.showChannelNumbers}
            onChange={(e) => setShowChannelNumbers(e.target.checked)}
            className="w-5 h-5 rounded border-gray-300"
          />
        </label>

        <label className="flex items-center justify-between p-3 bg-muted/50 rounded-lg cursor-pointer">
          <div>
            <p className="text-sm font-medium">Show Stream Info</p>
            <p className="text-xs text-muted-foreground">Display codec, bitrate overlay</p>
          </div>
          <input
            type="checkbox"
            checked={ui.showStreamInfo}
            onChange={(e) => setShowStreamInfo(e.target.checked)}
            className="w-5 h-5 rounded border-gray-300"
          />
        </label>

        <label className="flex items-center justify-between p-3 bg-muted/50 rounded-lg cursor-pointer">
          <div>
            <p className="text-sm font-medium">Compact Mode</p>
            <p className="text-xs text-muted-foreground">Reduce spacing for more content</p>
          </div>
          <input
            type="checkbox"
            checked={ui.compactMode}
            onChange={(e) => setCompactMode(e.target.checked)}
            className="w-5 h-5 rounded border-gray-300"
          />
        </label>
      </div>
    </div>
  )
}
