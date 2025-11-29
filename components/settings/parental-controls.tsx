"use client"

import { useState } from "react"
import { Lock, Unlock, Shield, Eye, EyeOff, Check, X, AlertTriangle } from "lucide-react"
import { useParentalStore } from "@/lib/store/parental-store"
import { usePlaylistStore } from "@/lib/store/playlist-store"
import { cn } from "@/lib/utils"

export function ParentalControls() {
  const { 
    isEnabled, 
    pin, 
    isLocked, 
    blockedChannelIds, 
    blockedGroups,
    setPin, 
    removePin, 
    unlock, 
    lock,
    toggleGroupBlock,
  } = useParentalStore()
  
  const { playlists } = usePlaylistStore()
  
  const [showSetupPin, setShowSetupPin] = useState(false)
  const [showUnlock, setShowUnlock] = useState(false)
  const [newPin, setNewPin] = useState("")
  const [confirmPin, setConfirmPin] = useState("")
  const [unlockPin, setUnlockPin] = useState("")
  const [error, setError] = useState("")

  // Get all unique groups
  const allGroups = Array.from(
    new Set(
      playlists.flatMap(p => p.channels.map(c => c.group).filter(Boolean) as string[])
    )
  ).sort()

  const handleSetPin = () => {
    if (newPin.length < 4) {
      setError("PIN must be at least 4 digits")
      return
    }
    if (newPin !== confirmPin) {
      setError("PINs don't match")
      return
    }
    setPin(newPin)
    setShowSetupPin(false)
    setNewPin("")
    setConfirmPin("")
    setError("")
  }

  const handleUnlock = () => {
    if (unlock(unlockPin)) {
      setShowUnlock(false)
      setUnlockPin("")
      setError("")
    } else {
      setError("Incorrect PIN")
    }
  }

  const handleRemovePin = () => {
    if (confirm("Remove parental controls? This will unblock all channels.")) {
      removePin()
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-lg bg-primary/10">
          <Shield className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h3 className="font-semibold">Parental Controls</h3>
          <p className="text-sm text-muted-foreground">
            Block channels and groups with a PIN
          </p>
        </div>
      </div>

      {/* Status */}
      {!isEnabled ? (
        <div className="p-4 bg-muted/50 rounded-lg">
          <p className="text-sm text-muted-foreground mb-3">
            Parental controls are not enabled. Set a PIN to get started.
          </p>
          <button
            onClick={() => setShowSetupPin(true)}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium"
          >
            Set Up PIN
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Lock Status */}
          <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
            <div className="flex items-center gap-3">
              {isLocked ? (
                <Lock className="h-5 w-5 text-orange-500" />
              ) : (
                <Unlock className="h-5 w-5 text-green-500" />
              )}
              <div>
                <p className="font-medium">
                  {isLocked ? "Locked" : "Unlocked"}
                </p>
                <p className="text-xs text-muted-foreground">
                  {isLocked 
                    ? "Blocked content is hidden"
                    : "All content is visible"
                  }
                </p>
              </div>
            </div>
            {isLocked ? (
              <button
                onClick={() => setShowUnlock(true)}
                className="px-3 py-1.5 bg-primary text-primary-foreground rounded text-sm"
              >
                Unlock
              </button>
            ) : (
              <button
                onClick={lock}
                className="px-3 py-1.5 bg-orange-500 text-white rounded text-sm"
              >
                Lock
              </button>
            )}
          </div>

          {/* Blocked Groups */}
          {!isLocked && (
            <div className="space-y-3">
              <h4 className="text-sm font-medium">Block Groups</h4>
              <div className="grid grid-cols-2 gap-2 max-h-[200px] overflow-y-auto">
                {allGroups.map(group => (
                  <button
                    key={group}
                    onClick={() => toggleGroupBlock(group)}
                    className={cn(
                      "p-2 text-sm text-left rounded-lg border transition-colors",
                      blockedGroups.includes(group)
                        ? "bg-red-500/10 border-red-500/30 text-red-500"
                        : "bg-muted/50 hover:bg-muted"
                    )}
                  >
                    <div className="flex items-center justify-between">
                      <span className="truncate">{group}</span>
                      {blockedGroups.includes(group) && (
                        <Lock className="h-3 w-3 flex-shrink-0" />
                      )}
                    </div>
                  </button>
                ))}
              </div>
              <p className="text-xs text-muted-foreground">
                {blockedChannelIds.length} channels and {blockedGroups.length} groups blocked
              </p>
            </div>
          )}

          {/* Remove PIN */}
          {!isLocked && (
            <button
              onClick={handleRemovePin}
              className="w-full p-3 text-sm text-red-500 hover:bg-red-500/10 rounded-lg transition-colors"
            >
              Remove Parental Controls
            </button>
          )}
        </div>
      )}

      {/* Setup PIN Modal */}
      {showSetupPin && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-card p-6 rounded-xl border shadow-xl w-full max-w-sm mx-4">
            <h3 className="text-lg font-semibold mb-4">Set Up PIN</h3>
            
            <div className="space-y-4">
              <div>
                <label className="text-sm text-muted-foreground">New PIN</label>
                <input
                  type="password"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={6}
                  value={newPin}
                  onChange={(e) => setNewPin(e.target.value.replace(/\D/g, ""))}
                  className="w-full mt-1 p-3 bg-muted rounded-lg text-center text-2xl tracking-widest"
                  placeholder="••••"
                />
              </div>
              
              <div>
                <label className="text-sm text-muted-foreground">Confirm PIN</label>
                <input
                  type="password"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={6}
                  value={confirmPin}
                  onChange={(e) => setConfirmPin(e.target.value.replace(/\D/g, ""))}
                  className="w-full mt-1 p-3 bg-muted rounded-lg text-center text-2xl tracking-widest"
                  placeholder="••••"
                />
              </div>

              {error && (
                <p className="text-sm text-red-500 flex items-center gap-1">
                  <AlertTriangle className="h-4 w-4" />
                  {error}
                </p>
              )}

              <div className="flex gap-2">
                <button
                  onClick={() => {
                    setShowSetupPin(false)
                    setNewPin("")
                    setConfirmPin("")
                    setError("")
                  }}
                  className="flex-1 p-3 bg-muted rounded-lg text-sm"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSetPin}
                  className="flex-1 p-3 bg-primary text-primary-foreground rounded-lg text-sm font-medium"
                >
                  Set PIN
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Unlock Modal */}
      {showUnlock && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-card p-6 rounded-xl border shadow-xl w-full max-w-sm mx-4">
            <h3 className="text-lg font-semibold mb-4">Enter PIN</h3>
            
            <div className="space-y-4">
              <input
                type="password"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={6}
                value={unlockPin}
                onChange={(e) => setUnlockPin(e.target.value.replace(/\D/g, ""))}
                className="w-full p-3 bg-muted rounded-lg text-center text-2xl tracking-widest"
                placeholder="••••"
                autoFocus
              />

              {error && (
                <p className="text-sm text-red-500 flex items-center gap-1">
                  <AlertTriangle className="h-4 w-4" />
                  {error}
                </p>
              )}

              <div className="flex gap-2">
                <button
                  onClick={() => {
                    setShowUnlock(false)
                    setUnlockPin("")
                    setError("")
                  }}
                  className="flex-1 p-3 bg-muted rounded-lg text-sm"
                >
                  Cancel
                </button>
                <button
                  onClick={handleUnlock}
                  className="flex-1 p-3 bg-primary text-primary-foreground rounded-lg text-sm font-medium"
                >
                  Unlock
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
