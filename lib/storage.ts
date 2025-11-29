import { Playlist } from "./types"

const STORAGE_KEYS = {
  PLAYLISTS: "openiptv_playlists",
  CURRENT_PLAYLIST: "openiptv_current_playlist",
  CURRENT_CHANNEL: "openiptv_current_channel",
}

/**
 * Storage utility for IndexedDB with localStorage fallback
 */
class Storage {
  private dbName = "openiptv"
  private dbVersion = 1
  private db: IDBDatabase | null = null

  async init(): Promise<void> {
    if (typeof window === "undefined") return

    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.dbVersion)

      request.onerror = () => {
        console.warn("IndexedDB failed, falling back to localStorage")
        resolve()
      }

      request.onsuccess = () => {
        this.db = request.result
        resolve()
      }

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result
        
        if (!db.objectStoreNames.contains("playlists")) {
          db.createObjectStore("playlists", { keyPath: "id" })
        }
      }
    })
  }

  async getPlaylists(): Promise<Playlist[]> {
    if (this.db) {
      return new Promise((resolve, reject) => {
        const transaction = this.db!.transaction(["playlists"], "readonly")
        const store = transaction.objectStore("playlists")
        const request = store.getAll()

        request.onsuccess = () => resolve(request.result || [])
        request.onerror = () => reject(request.error)
      })
    }

    // Fallback to localStorage
    const data = localStorage.getItem(STORAGE_KEYS.PLAYLISTS)
    return data ? JSON.parse(data) : []
  }

  async savePlaylists(playlists: Playlist[]): Promise<void> {
    if (this.db) {
      return new Promise((resolve, reject) => {
        const transaction = this.db!.transaction(["playlists"], "readwrite")
        const store = transaction.objectStore("playlists")
        
        // Clear existing
        store.clear()
        
        // Add all playlists
        playlists.forEach(playlist => store.add(playlist))

        transaction.oncomplete = () => resolve()
        transaction.onerror = () => reject(transaction.error)
      })
    }

    // Fallback to localStorage
    localStorage.setItem(STORAGE_KEYS.PLAYLISTS, JSON.stringify(playlists))
  }

  async saveCurrentPlaylist(playlistId: string | null): Promise<void> {
    if (typeof window === "undefined") return
    
    if (playlistId) {
      localStorage.setItem(STORAGE_KEYS.CURRENT_PLAYLIST, playlistId)
    } else {
      localStorage.removeItem(STORAGE_KEYS.CURRENT_PLAYLIST)
    }
  }

  async getCurrentPlaylist(): Promise<string | null> {
    if (typeof window === "undefined") return null
    return localStorage.getItem(STORAGE_KEYS.CURRENT_PLAYLIST)
  }

  async saveCurrentChannel(channelId: string | null): Promise<void> {
    if (typeof window === "undefined") return
    
    if (channelId) {
      localStorage.setItem(STORAGE_KEYS.CURRENT_CHANNEL, channelId)
    } else {
      localStorage.removeItem(STORAGE_KEYS.CURRENT_CHANNEL)
    }
  }

  async getCurrentChannel(): Promise<string | null> {
    if (typeof window === "undefined") return null
    return localStorage.getItem(STORAGE_KEYS.CURRENT_CHANNEL)
  }
}

export const storage = new Storage()
