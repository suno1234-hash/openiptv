"use client"

import { useState } from "react"
import { Tv, Plus, Loader2 } from "lucide-react"
import { usePlaylistStore } from "@/lib/store/playlist-store"
import { isValidM3U8Url } from "@/lib/m3u8-parser"

export function WelcomeScreen() {
  const [url, setUrl] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const { addPlaylist } = usePlaylistStore()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    if (!url.trim()) {
      setError("Please enter a playlist URL")
      return
    }

    if (!isValidM3U8Url(url)) {
      setError("Please enter a valid M3U8 URL (must end with .m3u8 or .m3u)")
      return
    }

    setIsLoading(true)
    
    try {
      await addPlaylist(url)
    } catch (err) {
      let errorMessage = "Failed to add playlist"
      
      if (err instanceof Error) {
        errorMessage = err.message
        
        // Provide helpful hints for common errors
        if (err.message.includes("Failed to fetch")) {
          errorMessage = "Unable to load playlist. The URL might be invalid or the server is not responding."
        } else if (err.message.includes("Empty playlist")) {
          errorMessage = "The playlist appears to be empty or invalid format."
        } else if (err.message.includes("No channels found")) {
          errorMessage = "No channels found in the playlist. Please check the URL."
        }
      }
      
      setError(errorMessage)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-background via-background to-primary/5">
      <div className="w-full max-w-md space-y-8 text-center">
        {/* Logo */}
        <div className="flex justify-center">
          <div className="relative">
            <div className="absolute inset-0 bg-primary/20 blur-3xl rounded-full" />
            <div className="relative bg-primary/10 p-6 rounded-2xl border border-primary/20">
              <Tv className="h-16 w-16 text-primary" />
            </div>
          </div>
        </div>

        {/* Title */}
        <div className="space-y-2">
          <h1 className="text-4xl font-bold tracking-tight">Welcome to OpenIPTV</h1>
          <p className="text-muted-foreground text-lg">
            Stream your favorite IPTV channels with a modern, beautiful interface
          </p>
        </div>

        {/* Features */}
        <div className="grid gap-4 text-sm text-left">
          <div className="flex items-start gap-3 p-4 rounded-lg bg-card border">
            <div className="text-primary mt-0.5">✓</div>
            <div>
              <div className="font-medium">M3U8 Playlist Support</div>
              <div className="text-muted-foreground">Import any M3U8 playlist URL</div>
            </div>
          </div>
          <div className="flex items-start gap-3 p-4 rounded-lg bg-card border">
            <div className="text-primary mt-0.5">✓</div>
            <div>
              <div className="font-medium">Channel Management</div>
              <div className="text-muted-foreground">Organize, favorite, and hide channels</div>
            </div>
          </div>
          <div className="flex items-start gap-3 p-4 rounded-lg bg-card border">
            <div className="text-primary mt-0.5">✓</div>
            <div>
              <div className="font-medium">Responsive Design</div>
              <div className="text-muted-foreground">Works perfectly on mobile and desktop</div>
            </div>
          </div>
        </div>

        {/* Add Playlist Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <input
              type="url"
              placeholder="Enter M3U8 playlist URL"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              disabled={isLoading}
              className="w-full px-4 py-3 rounded-lg border bg-background focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-50"
            />
            {error && (
              <p className="text-sm text-destructive">{error}</p>
            )}
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full px-6 py-3 rounded-lg bg-primary text-primary-foreground font-medium hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" />
                Loading Playlist...
              </>
            ) : (
              <>
                <Plus className="h-5 w-5" />
                Add Playlist
              </>
            )}
          </button>
        </form>

        {/* Example */}
        <div className="text-xs text-muted-foreground">
          <p>Example: http://example.com/playlist.m3u8</p>
        </div>
      </div>
    </div>
  )
}
