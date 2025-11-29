/**
 * Chromecast integration utilities
 */

declare global {
  interface Window {
    chrome: any
    cast: any
    __onGCastApiAvailable: (isAvailable: boolean) => void
  }
}

export interface CastDevice {
  friendlyName: string
  id: string
}

export type CastState = 
  | "NO_DEVICES_AVAILABLE"
  | "NOT_CONNECTED" 
  | "CONNECTING"
  | "CONNECTED"

class ChromecastManager {
  private castContext: any = null
  private currentSession: any = null
  private mediaPlayer: any = null
  private isInitialized = false
  private listeners: Set<(state: CastState) => void> = new Set()

  constructor() {
    this.initializeCastApi()
  }

  private initializeCastApi() {
    if (typeof window === "undefined") return

    window.__onGCastApiAvailable = (isAvailable: boolean) => {
      if (isAvailable) {
        this.setupCast()
      }
    }
  }

  private setupCast() {
    try {
      console.log("[Chromecast] Setting up Cast API...")
      
      if (!window.cast || !window.chrome) {
        console.warn("[Chromecast] Cast API not available - SDK not loaded")
        console.log("[Chromecast] window.cast:", window.cast)
        console.log("[Chromecast] window.chrome:", window.chrome)
        return
      }

      console.log("[Chromecast] Cast SDK loaded successfully!")
      this.castContext = window.cast.framework.CastContext.getInstance()
      
      this.castContext.setOptions({
        receiverApplicationId: window.chrome.cast.media.DEFAULT_MEDIA_RECEIVER_APP_ID,
        autoJoinPolicy: window.chrome.cast.AutoJoinPolicy.ORIGIN_SCOPED,
      })

      // Listen for session state changes
      this.castContext.addEventListener(
        window.cast.framework.CastContextEventType.SESSION_STATE_CHANGED,
        (event: any) => {
          this.handleSessionStateChange(event)
        }
      )

      this.isInitialized = true
      console.log("[Chromecast] Initialization complete")
      this.notifyListeners()
    } catch (error) {
      console.error("[Chromecast] Failed to initialize Cast:", error)
    }
  }

  private handleSessionStateChange(event: any) {
    const session = event.session

    switch (event.sessionState) {
      case window.cast.framework.SessionState.SESSION_STARTED:
      case window.cast.framework.SessionState.SESSION_RESUMED:
        this.currentSession = session
        this.mediaPlayer = new window.cast.framework.RemotePlayer()
        break
      case window.cast.framework.SessionState.SESSION_ENDED:
        this.currentSession = null
        this.mediaPlayer = null
        break
    }

    this.notifyListeners()
  }

  getCastState(): CastState {
    if (!this.isInitialized || !this.castContext) {
      console.log("[Chromecast] Not initialized yet")
      return "NO_DEVICES_AVAILABLE"
    }

    const state = this.castContext.getCastState()
    console.log("[Chromecast] Current cast state:", state)

    switch (state) {
      case window.cast.framework.CastState.NO_DEVICES_AVAILABLE:
        return "NO_DEVICES_AVAILABLE"
      case window.cast.framework.CastState.NOT_CONNECTED:
        return "NOT_CONNECTED"
      case window.cast.framework.CastState.CONNECTING:
        return "CONNECTING"
      case window.cast.framework.CastState.CONNECTED:
        return "CONNECTED"
      default:
        return "NO_DEVICES_AVAILABLE"
    }
  }

  isConnected(): boolean {
    return this.getCastState() === "CONNECTED"
  }

  async requestSession() {
    if (!this.castContext) {
      throw new Error("Cast not initialized")
    }

    try {
      await this.castContext.requestSession()
    } catch (error) {
      console.error("Failed to request cast session:", error)
      throw error
    }
  }

  endSession() {
    if (!this.currentSession) return

    try {
      this.currentSession.endSession(true)
    } catch (error) {
      console.error("Failed to end cast session:", error)
    }
  }

  async loadMedia(url: string, title: string, imageUrl?: string) {
    if (!this.currentSession) {
      throw new Error("No active cast session")
    }

    const mediaInfo = new window.chrome.cast.media.MediaInfo(url, "application/x-mpegURL")
    mediaInfo.metadata = new window.chrome.cast.media.GenericMediaMetadata()
    mediaInfo.metadata.title = title
    
    if (imageUrl) {
      mediaInfo.metadata.images = [
        new window.chrome.cast.Image(imageUrl)
      ]
    }

    const request = new window.chrome.cast.media.LoadRequest(mediaInfo)

    try {
      await this.currentSession.loadMedia(request)
    } catch (error) {
      console.error("Failed to load media:", error)
      throw error
    }
  }

  play() {
    if (this.mediaPlayer) {
      this.mediaPlayer.controller.playOrPause()
    }
  }

  pause() {
    if (this.mediaPlayer) {
      this.mediaPlayer.controller.playOrPause()
    }
  }

  stop() {
    if (this.mediaPlayer) {
      this.mediaPlayer.controller.stop()
    }
  }

  setVolume(level: number) {
    if (this.mediaPlayer) {
      this.mediaPlayer.volumeLevel = Math.max(0, Math.min(1, level))
      this.mediaPlayer.controller.setVolumeLevel()
    }
  }

  getCurrentDevice(): CastDevice | null {
    if (!this.currentSession) return null

    const receiver = this.currentSession.getCastDevice()
    return {
      friendlyName: receiver.friendlyName,
      id: receiver.deviceId,
    }
  }

  addStateListener(listener: (state: CastState) => void) {
    this.listeners.add(listener)
  }

  removeStateListener(listener: (state: CastState) => void) {
    this.listeners.delete(listener)
  }

  private notifyListeners() {
    const state = this.getCastState()
    this.listeners.forEach(listener => listener(state))
  }
}

// Singleton instance
export const chromecastManager = new ChromecastManager()
