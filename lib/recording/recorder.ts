/**
 * Client-Side Stream Recorder using MediaRecorder API
 */

import { Channel } from "../types"

export interface Recording {
  id: string
  channelName: string
  channelId: string
  startTime: Date
  endTime?: Date
  duration: number
  size: number
  status: "recording" | "completed" | "failed"
  chunks: Blob[]
}

class StreamRecorder {
  private mediaRecorder: MediaRecorder | null = null
  private chunks: Blob[] = []
  private currentRecording: Recording | null = null
  private startTime: Date | null = null

  /**
   * Start recording the current video stream
   */
  async startRecording(channel: Channel, videoElement: HTMLVideoElement): Promise<string> {
    if (this.mediaRecorder && this.mediaRecorder.state === "recording") {
      throw new Error("Already recording")
    }

    try {
      // Capture the video stream
      const stream = (videoElement as any).captureStream 
        ? (videoElement as any).captureStream()
        : (videoElement as any).mozCaptureStream?.();

      if (!stream) {
        throw new Error("Browser doesn't support stream capture")
      }

      // Create recorder
      const options: MediaRecorderOptions = {
        mimeType: this.getSupportedMimeType(),
        videoBitsPerSecond: 2500000, // 2.5 Mbps
      }

      this.mediaRecorder = new MediaRecorder(stream, options)
      this.chunks = []
      this.startTime = new Date()

      // Handle data chunks
      this.mediaRecorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          this.chunks.push(event.data)
          this.updateRecording()
        }
      }

      // Handle stop
      this.mediaRecorder.onstop = () => {
        this.finalizeRecording()
      }

      // Handle errors
      this.mediaRecorder.onerror = (event) => {
        console.error("Recording error:", event)
        this.stopRecording()
      }

      // Create recording entry
      const recordingId = `rec_${Date.now()}`
      this.currentRecording = {
        id: recordingId,
        channelName: channel.name,
        channelId: channel.id,
        startTime: this.startTime,
        duration: 0,
        size: 0,
        status: "recording",
        chunks: [],
      }

      // Start recording (collect data every 1 second)
      this.mediaRecorder.start(1000)

      console.log("Recording started:", recordingId)
      return recordingId
    } catch (error) {
      console.error("Failed to start recording:", error)
      throw error
    }
  }

  /**
   * Stop recording
   */
  stopRecording(): Recording | null {
    if (!this.mediaRecorder || this.mediaRecorder.state === "inactive") {
      return null
    }

    this.mediaRecorder.stop()
    return this.currentRecording
  }

  /**
   * Get supported MIME type
   */
  private getSupportedMimeType(): string {
    const types = [
      "video/webm;codecs=vp9,opus",
      "video/webm;codecs=vp8,opus",
      "video/webm",
      "video/mp4",
    ]

    for (const type of types) {
      if (MediaRecorder.isTypeSupported(type)) {
        return type
      }
    }

    return ""
  }

  /**
   * Update recording metadata
   */
  private updateRecording(): void {
    if (!this.currentRecording || !this.startTime) return

    const now = new Date()
    this.currentRecording.duration = now.getTime() - this.startTime.getTime()
    this.currentRecording.size = this.chunks.reduce((total, chunk) => total + chunk.size, 0)
  }

  /**
   * Finalize recording and save to IndexedDB
   */
  private async finalizeRecording(): Promise<void> {
    if (!this.currentRecording) return

    try {
      this.currentRecording.endTime = new Date()
      this.currentRecording.status = "completed"
      this.currentRecording.chunks = this.chunks

      // Save to IndexedDB
      await this.saveRecording(this.currentRecording)

      console.log("Recording completed:", this.currentRecording.id)
    } catch (error) {
      console.error("Failed to finalize recording:", error)
      if (this.currentRecording) {
        this.currentRecording.status = "failed"
      }
    }
  }

  /**
   * Open or create the recordings database
   */
  private openDatabase(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open("OpenIPTV_Recordings", 2) // Increment version to trigger upgrade

      request.onerror = () => reject(request.error)

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result
        if (!db.objectStoreNames.contains("recordings")) {
          db.createObjectStore("recordings", { keyPath: "id" })
        }
      }

      request.onsuccess = () => {
        resolve(request.result)
      }
    })
  }

  /**
   * Save recording to IndexedDB
   */
  private async saveRecording(recording: Recording): Promise<void> {
    const db = await this.openDatabase()
    
    return new Promise((resolve, reject) => {
      try {
        const transaction = db.transaction(["recordings"], "readwrite")
        const store = transaction.objectStore("recordings")

        const addRequest = store.put(recording)

        addRequest.onsuccess = () => {
          db.close()
          resolve()
        }

        addRequest.onerror = () => {
          db.close()
          reject(addRequest.error)
        }
      } catch (error) {
        db.close()
        reject(error)
      }
    })
  }

  /**
   * Get all recordings
   */
  async getAllRecordings(): Promise<Recording[]> {
    const db = await this.openDatabase()
    
    return new Promise((resolve, reject) => {
      try {
        const transaction = db.transaction(["recordings"], "readonly")
        const store = transaction.objectStore("recordings")
        const getAllRequest = store.getAll()

        getAllRequest.onsuccess = () => {
          db.close()
          resolve(getAllRequest.result || [])
        }

        getAllRequest.onerror = () => {
          db.close()
          reject(getAllRequest.error)
        }
      } catch (error) {
        db.close()
        // If store doesn't exist, return empty array
        resolve([])
      }
    })
  }

  /**
   * Delete recording
   */
  async deleteRecording(id: string): Promise<void> {
    const db = await this.openDatabase()
    
    return new Promise((resolve, reject) => {
      try {
        const transaction = db.transaction(["recordings"], "readwrite")
        const store = transaction.objectStore("recordings")
        const deleteRequest = store.delete(id)

        deleteRequest.onsuccess = () => {
          db.close()
          resolve()
        }

        deleteRequest.onerror = () => {
          db.close()
          reject(deleteRequest.error)
        }
      } catch (error) {
        db.close()
        resolve() // If store doesn't exist, nothing to delete
      }
    })
  }

  /**
   * Download recording as file
   */
  downloadRecording(recording: Recording): void {
    const blob = new Blob(recording.chunks, { type: "video/webm" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `${recording.channelName}_${recording.startTime.toISOString()}.webm`
    a.click()
    URL.revokeObjectURL(url)
  }

  /**
   * Get current recording status
   */
  getCurrentRecording(): Recording | null {
    return this.currentRecording
  }

  /**
   * Check if currently recording
   */
  isRecording(): boolean {
    return this.mediaRecorder !== null && this.mediaRecorder.state === "recording"
  }

  /**
   * Format duration
   */
  formatDuration(ms: number): string {
    const seconds = Math.floor(ms / 1000)
    const minutes = Math.floor(seconds / 60)
    const hours = Math.floor(minutes / 60)

    if (hours > 0) {
      return `${hours}h ${minutes % 60}m ${seconds % 60}s`
    } else if (minutes > 0) {
      return `${minutes}m ${seconds % 60}s`
    } else {
      return `${seconds}s`
    }
  }

  /**
   * Format file size
   */
  formatSize(bytes: number): string {
    if (bytes < 1024) return bytes + " B"
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + " KB"
    if (bytes < 1024 * 1024 * 1024) return (bytes / (1024 * 1024)).toFixed(2) + " MB"
    return (bytes / (1024 * 1024 * 1024)).toFixed(2) + " GB"
  }
}

export const streamRecorder = new StreamRecorder()
