/**
 * Backup and Restore functionality for OpenIPTV
 * Exports/imports all user data including playlists, preferences, favorites, etc.
 */

export interface BackupData {
  version: string
  createdAt: string
  data: {
    playlists: unknown
    preferences: unknown
    parental: unknown
    statistics: unknown
    watchHistory: unknown
    epgUrl?: string
  }
}

const BACKUP_VERSION = "1.0.0"

/**
 * Create a backup of all user data
 */
export async function createBackup(): Promise<BackupData> {
  const playlists = localStorage.getItem("openiptv-playlists")
  const preferences = localStorage.getItem("openiptv-preferences")
  const parental = localStorage.getItem("openiptv-parental")
  const statistics = localStorage.getItem("openiptv-statistics")
  const watchHistory = localStorage.getItem("openiptv-watch-history")
  const epgUrl = localStorage.getItem("epg_url")

  const backup: BackupData = {
    version: BACKUP_VERSION,
    createdAt: new Date().toISOString(),
    data: {
      playlists: playlists ? JSON.parse(playlists) : null,
      preferences: preferences ? JSON.parse(preferences) : null,
      parental: parental ? JSON.parse(parental) : null,
      statistics: statistics ? JSON.parse(statistics) : null,
      watchHistory: watchHistory ? JSON.parse(watchHistory) : null,
      epgUrl: epgUrl || undefined,
    },
  }

  return backup
}

/**
 * Download backup as JSON file
 */
export function downloadBackup(backup: BackupData): void {
  const blob = new Blob([JSON.stringify(backup, null, 2)], { type: "application/json" })
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = `openiptv-backup-${new Date().toISOString().split("T")[0]}.json`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

/**
 * Restore data from backup
 */
export async function restoreBackup(backup: BackupData): Promise<{ success: boolean; errors: string[] }> {
  const errors: string[] = []

  try {
    // Validate backup version
    if (!backup.version) {
      errors.push("Invalid backup file: missing version")
      return { success: false, errors }
    }

    // Restore each data type
    if (backup.data.playlists) {
      try {
        localStorage.setItem("openiptv-playlists", JSON.stringify(backup.data.playlists))
      } catch (e) {
        errors.push(`Failed to restore playlists: ${e}`)
      }
    }

    if (backup.data.preferences) {
      try {
        localStorage.setItem("openiptv-preferences", JSON.stringify(backup.data.preferences))
      } catch (e) {
        errors.push(`Failed to restore preferences: ${e}`)
      }
    }

    if (backup.data.parental) {
      try {
        localStorage.setItem("openiptv-parental", JSON.stringify(backup.data.parental))
      } catch (e) {
        errors.push(`Failed to restore parental settings: ${e}`)
      }
    }

    if (backup.data.statistics) {
      try {
        localStorage.setItem("openiptv-statistics", JSON.stringify(backup.data.statistics))
      } catch (e) {
        errors.push(`Failed to restore statistics: ${e}`)
      }
    }

    if (backup.data.watchHistory) {
      try {
        localStorage.setItem("openiptv-watch-history", JSON.stringify(backup.data.watchHistory))
      } catch (e) {
        errors.push(`Failed to restore watch history: ${e}`)
      }
    }

    if (backup.data.epgUrl) {
      localStorage.setItem("epg_url", backup.data.epgUrl)
    }

    return { success: errors.length === 0, errors }
  } catch (e) {
    errors.push(`Restore failed: ${e}`)
    return { success: false, errors }
  }
}

/**
 * Read backup file
 */
export function readBackupFile(file: File): Promise<BackupData> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string
        const backup = JSON.parse(content) as BackupData
        resolve(backup)
      } catch (error) {
        reject(new Error("Invalid backup file format"))
      }
    }
    reader.onerror = () => reject(new Error("Failed to read file"))
    reader.readAsText(file)
  })
}

/**
 * Get backup file size estimate
 */
export function getStorageSize(): { total: number; breakdown: Record<string, number> } {
  const keys = [
    "openiptv-playlists",
    "openiptv-preferences", 
    "openiptv-parental",
    "openiptv-statistics",
    "openiptv-watch-history",
    "epg_url",
  ]

  const breakdown: Record<string, number> = {}
  let total = 0

  for (const key of keys) {
    const value = localStorage.getItem(key)
    const size = value ? new Blob([value]).size : 0
    breakdown[key] = size
    total += size
  }

  return { total, breakdown }
}

/**
 * Format bytes to human readable
 */
export function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 B"
  const k = 1024
  const sizes = ["B", "KB", "MB", "GB"]
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`
}
