"use client"

import { useState, useRef } from "react"
import { Download, Upload, HardDrive, Check, AlertTriangle, FileJson } from "lucide-react"
import { 
  createBackup, 
  downloadBackup, 
  readBackupFile, 
  restoreBackup, 
  getStorageSize, 
  formatBytes,
  BackupData 
} from "@/lib/backup-restore"

export function BackupRestore() {
  const [isCreating, setIsCreating] = useState(false)
  const [isRestoring, setIsRestoring] = useState(false)
  const [status, setStatus] = useState<{ type: "success" | "error"; message: string } | null>(null)
  const [previewBackup, setPreviewBackup] = useState<BackupData | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const storageInfo = getStorageSize()

  const handleCreateBackup = async () => {
    setIsCreating(true)
    setStatus(null)
    try {
      const backup = await createBackup()
      downloadBackup(backup)
      setStatus({ type: "success", message: "Backup downloaded successfully!" })
    } catch (error) {
      setStatus({ type: "error", message: `Failed to create backup: ${error}` })
    } finally {
      setIsCreating(false)
    }
  }

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    try {
      const backup = await readBackupFile(file)
      setPreviewBackup(backup)
    } catch (error) {
      setStatus({ type: "error", message: `Invalid backup file: ${error}` })
    }

    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  const handleRestore = async () => {
    if (!previewBackup) return

    setIsRestoring(true)
    setStatus(null)
    try {
      const result = await restoreBackup(previewBackup)
      if (result.success) {
        setStatus({ type: "success", message: "Backup restored! Refreshing..." })
        setTimeout(() => window.location.reload(), 1500)
      } else {
        setStatus({ type: "error", message: `Restore completed with errors: ${result.errors.join(", ")}` })
      }
    } catch (error) {
      setStatus({ type: "error", message: `Restore failed: ${error}` })
    } finally {
      setIsRestoring(false)
      setPreviewBackup(null)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-lg bg-primary/10">
          <HardDrive className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h3 className="font-semibold">Backup & Restore</h3>
          <p className="text-sm text-muted-foreground">
            Export or import your settings and playlists
          </p>
        </div>
      </div>

      {/* Storage Info */}
      <div className="p-4 bg-muted/50 rounded-lg">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-muted-foreground">Storage Used</span>
          <span className="text-sm font-medium">{formatBytes(storageInfo.total)}</span>
        </div>
        <div className="space-y-1 text-xs text-muted-foreground">
          {Object.entries(storageInfo.breakdown).map(([key, size]) => (
            size > 0 && (
              <div key={key} className="flex justify-between">
                <span>{key.replace("openiptv-", "")}</span>
                <span>{formatBytes(size)}</span>
              </div>
            )
          ))}
        </div>
      </div>

      {/* Actions */}
      <div className="grid grid-cols-2 gap-3">
        <button
          onClick={handleCreateBackup}
          disabled={isCreating}
          className="p-4 bg-muted/50 hover:bg-muted rounded-lg transition-colors text-left"
        >
          <Download className="h-6 w-6 text-primary mb-2" />
          <p className="font-medium text-sm">Create Backup</p>
          <p className="text-xs text-muted-foreground mt-1">
            Download all your data
          </p>
        </button>

        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={isRestoring}
          className="p-4 bg-muted/50 hover:bg-muted rounded-lg transition-colors text-left"
        >
          <Upload className="h-6 w-6 text-primary mb-2" />
          <p className="font-medium text-sm">Restore Backup</p>
          <p className="text-xs text-muted-foreground mt-1">
            Import from file
          </p>
        </button>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept=".json"
        onChange={handleFileSelect}
        className="hidden"
      />

      {/* Status */}
      {status && (
        <div className={`p-3 rounded-lg flex items-center gap-2 ${
          status.type === "success" 
            ? "bg-green-500/10 text-green-500" 
            : "bg-red-500/10 text-red-500"
        }`}>
          {status.type === "success" ? (
            <Check className="h-4 w-4" />
          ) : (
            <AlertTriangle className="h-4 w-4" />
          )}
          <span className="text-sm">{status.message}</span>
        </div>
      )}

      {/* Backup Preview Modal */}
      {previewBackup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-card p-6 rounded-xl border shadow-xl w-full max-w-md">
            <div className="flex items-center gap-3 mb-4">
              <FileJson className="h-6 w-6 text-primary" />
              <div>
                <h3 className="font-semibold">Restore Backup</h3>
                <p className="text-xs text-muted-foreground">
                  Created: {new Date(previewBackup.createdAt).toLocaleString()}
                </p>
              </div>
            </div>

            <div className="space-y-2 mb-4 p-3 bg-muted/50 rounded-lg text-sm">
              <p className="flex justify-between">
                <span className="text-muted-foreground">Version</span>
                <span>{previewBackup.version}</span>
              </p>
              <p className="flex justify-between">
                <span className="text-muted-foreground">Playlists</span>
                <span>{previewBackup.data.playlists ? "Yes" : "No"}</span>
              </p>
              <p className="flex justify-between">
                <span className="text-muted-foreground">Preferences</span>
                <span>{previewBackup.data.preferences ? "Yes" : "No"}</span>
              </p>
              <p className="flex justify-between">
                <span className="text-muted-foreground">Watch History</span>
                <span>{previewBackup.data.watchHistory ? "Yes" : "No"}</span>
              </p>
              <p className="flex justify-between">
                <span className="text-muted-foreground">Statistics</span>
                <span>{previewBackup.data.statistics ? "Yes" : "No"}</span>
              </p>
            </div>

            <div className="p-3 bg-orange-500/10 rounded-lg mb-4">
              <p className="text-sm text-orange-500 flex items-start gap-2">
                <AlertTriangle className="h-4 w-4 flex-shrink-0 mt-0.5" />
                This will replace all your current data. The app will reload after restore.
              </p>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => setPreviewBackup(null)}
                className="flex-1 p-3 bg-muted rounded-lg text-sm"
              >
                Cancel
              </button>
              <button
                onClick={handleRestore}
                disabled={isRestoring}
                className="flex-1 p-3 bg-primary text-primary-foreground rounded-lg text-sm font-medium"
              >
                {isRestoring ? "Restoring..." : "Restore"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
