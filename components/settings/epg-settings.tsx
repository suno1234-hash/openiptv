"use client"

import { useState } from "react"
import { Save, AlertCircle, CheckCircle, Loader2 } from "lucide-react"
import { epgManager } from "@/lib/epg/epg-manager"

export function EPGSettings() {
  const [epgUrl, setEpgUrl] = useState("")
  const [loading, setLoading] = useState(false)
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle")
  const [message, setMessage] = useState("")

  const handleSave = async () => {
    if (!epgUrl.trim()) {
      setStatus("error")
      setMessage("Please enter an EPG URL")
      return
    }

    setLoading(true)
    setStatus("idle")

    try {
      // Set the EPG source
      epgManager.setEPGSource(epgUrl)
      
      // Try to load it
      await epgManager.loadEPG([])
      
      // Save to localStorage
      localStorage.setItem("epg_url", epgUrl)
      
      setStatus("success")
      setMessage("EPG source configured successfully! Reload the page to see real program data.")
    } catch (error) {
      console.error("EPG configuration error:", error)
      setStatus("error")
      setMessage("Failed to load EPG: " + (error instanceof Error ? error.message : "Unknown error"))
    } finally {
      setLoading(false)
    }
  }

  const handleClear = () => {
    setEpgUrl("")
    epgManager.setEPGSource("")
    localStorage.removeItem("epg_url")
    setStatus("success")
    setMessage("EPG source cleared. Using mock data.")
  }

  // Load saved URL on mount
  useState(() => {
    const saved = localStorage.getItem("epg_url")
    if (saved) {
      setEpgUrl(saved)
    }
  })

  return (
    <div className="space-y-6">
      <div>
        <h3 className="font-semibold mb-3">EPG (Program Guide) Settings</h3>
        <p className="text-sm text-muted-foreground mb-4">
          Configure an XMLTV EPG source to show real TV program information
        </p>

        {/* EPG URL Input */}
        <div className="space-y-3">
          <div>
            <label className="text-sm font-medium mb-2 block">
              XMLTV EPG URL
            </label>
            <input
              type="url"
              value={epgUrl}
              onChange={(e) => setEpgUrl(e.target.value)}
              placeholder="https://example.com/epg.xml"
              className="w-full px-3 py-2 border rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-primary"
            />
            <p className="text-xs text-muted-foreground mt-1">
              Enter the URL to your XMLTV EPG file
            </p>
          </div>

          {/* Buttons */}
          <div className="flex gap-2">
            <button
              onClick={handleSave}
              disabled={loading}
              className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Loading...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" />
                  Save & Load EPG
                </>
              )}
            </button>
            
            <button
              onClick={handleClear}
              disabled={loading}
              className="px-4 py-2 border rounded-md hover:bg-accent transition-colors disabled:opacity-50"
            >
              Clear
            </button>
          </div>

          {/* Status Message */}
          {status !== "idle" && (
            <div
              className={`flex items-start gap-2 p-3 rounded-md ${
                status === "success"
                  ? "bg-green-500/10 text-green-500"
                  : "bg-red-500/10 text-red-500"
              }`}
            >
              {status === "success" ? (
                <CheckCircle className="h-5 w-5 flex-shrink-0" />
              ) : (
                <AlertCircle className="h-5 w-5 flex-shrink-0" />
              )}
              <p className="text-sm">{message}</p>
            </div>
          )}
        </div>
      </div>

      {/* Example Sources */}
      <div className="p-4 bg-muted/50 rounded-lg">
        <h4 className="font-medium mb-2">📺 EPG Sources</h4>
        <p className="text-sm text-muted-foreground mb-3">
          You need an XMLTV EPG file URL. Here are some options:
        </p>
        
        <div className="space-y-2 text-sm">
          <div className="p-2 bg-background rounded border">
            <p className="font-medium">Option 1: IPTV-Org EPG (Free)</p>
            <p className="text-xs text-muted-foreground mt-1">
              Check: <code className="text-xs">https://github.com/iptv-org/epg</code>
            </p>
            <p className="text-xs text-muted-foreground">
              Example: <code className="text-xs">https://iptv-org.github.io/epg/guides/il.xml</code> (Israel)
            </p>
          </div>

          <div className="p-2 bg-background rounded border">
            <p className="font-medium">Option 2: Your IPTV Provider</p>
            <p className="text-xs text-muted-foreground mt-1">
              Many IPTV services provide EPG URLs
            </p>
          </div>

          <div className="p-2 bg-background rounded border">
            <p className="font-medium">Option 3: Custom XMLTV File</p>
            <p className="text-xs text-muted-foreground mt-1">
              Host your own XMLTV file and provide the URL
            </p>
          </div>
        </div>
      </div>

      {/* Info */}
      <div className="text-xs text-muted-foreground space-y-1">
        <p>ℹ️ <strong>Note:</strong></p>
        <ul className="list-disc list-inside space-y-1 ml-2">
          <li>EPG data must be in XMLTV format</li>
          <li>The URL must be publicly accessible</li>
          <li>CORS must be enabled on the EPG server</li>
          <li>Large EPG files may take time to load</li>
          <li>EPG data is cached in browser memory</li>
        </ul>
      </div>
    </div>
  )
}
