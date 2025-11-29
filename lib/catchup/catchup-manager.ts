import { Channel, CatchupInfo, CatchupType } from "../types"
import { EPGProgram } from "../epg/types"

/**
 * Catchup URL placeholders used by different providers:
 * - {utc} - Unix timestamp of program start
 * - {lutc} - Unix timestamp of program end
 * - {start} - Program start time
 * - {end} - Program end time
 * - {duration} - Program duration in seconds
 * - {timestamp} - Current timestamp
 * - {offset} - Offset from current time
 * - {Y}, {m}, {d}, {H}, {M}, {S} - Date/time components
 */

export interface CatchupRequest {
  channel: Channel
  program: EPGProgram
}

export interface CatchupResult {
  url: string
  isLive: boolean
  programTitle: string
  startTime: Date
  endTime: Date
}

class CatchupManager {
  /**
   * Check if a channel supports catchup
   */
  hasCatchup(channel: Channel): boolean {
    return !!channel.catchup && channel.catchup.days > 0
  }

  /**
   * Get the number of catchup days available for a channel
   */
  getCatchupDays(channel: Channel): number {
    return channel.catchup?.days || 0
  }

  /**
   * Check if a program is available for catchup
   * Program must be in the past but within the catchup window
   */
  isProgramAvailable(channel: Channel, program: EPGProgram): boolean {
    if (!this.hasCatchup(channel)) return false

    const now = new Date()
    const programEnd = new Date(program.end)
    const catchupDays = this.getCatchupDays(channel)
    
    // Program must have ended
    if (programEnd > now) return false
    
    // Program must be within catchup window
    const catchupWindowStart = new Date(now.getTime() - catchupDays * 24 * 60 * 60 * 1000)
    return programEnd > catchupWindowStart
  }

  /**
   * Check if a program is currently live
   */
  isLive(program: EPGProgram): boolean {
    const now = new Date()
    return new Date(program.start) <= now && new Date(program.end) > now
  }

  /**
   * Build catchup URL for a specific program
   */
  buildCatchupUrl(channel: Channel, program: EPGProgram): string | null {
    if (!channel.catchup) return null

    const { type, source } = channel.catchup
    const liveUrl = channel.url

    // Calculate timestamps
    const startUtc = Math.floor(new Date(program.start).getTime() / 1000)
    const endUtc = Math.floor(new Date(program.end).getTime() / 1000)
    const duration = endUtc - startUtc
    const now = Math.floor(Date.now() / 1000)
    const offset = now - startUtc

    // Date components
    const startDate = new Date(program.start)
    const Y = startDate.getFullYear().toString()
    const m = (startDate.getMonth() + 1).toString().padStart(2, "0")
    const d = startDate.getDate().toString().padStart(2, "0")
    const H = startDate.getHours().toString().padStart(2, "0")
    const M = startDate.getMinutes().toString().padStart(2, "0")
    const S = startDate.getSeconds().toString().padStart(2, "0")

    switch (type) {
      case "default":
        // Use catchup-source template if available
        if (source) {
          return this.replacePlaceholders(source, {
            utc: startUtc.toString(),
            lutc: endUtc.toString(),
            start: startUtc.toString(),
            end: endUtc.toString(),
            duration: duration.toString(),
            timestamp: now.toString(),
            offset: offset.toString(),
            Y, m, d, H, M, S,
          })
        }
        // Fallback: append to live URL
        return `${liveUrl}?utc=${startUtc}&lutc=${endUtc}`

      case "append":
        // Append query parameters to live URL
        const separator = liveUrl.includes("?") ? "&" : "?"
        return `${liveUrl}${separator}utc=${startUtc}&lutc=${endUtc}`

      case "shift":
      case "flussonic":
      case "fs":
        // Flussonic format: /timeshift_abs-{timestamp}.m3u8 or /archive-{start}-{duration}.m3u8
        if (source) {
          return this.replacePlaceholders(source, {
            utc: startUtc.toString(),
            lutc: endUtc.toString(),
            start: startUtc.toString(),
            end: endUtc.toString(),
            duration: duration.toString(),
            timestamp: startUtc.toString(),
            Y, m, d, H, M, S,
          })
        }
        // Default Flussonic format
        const baseUrl = liveUrl.replace(/\/[^/]*\.m3u8.*$/, "")
        return `${baseUrl}/timeshift_abs-${startUtc}.m3u8`

      case "xc":
        // Xtream Codes format
        // Typically: http://server/streaming/timeshift.php?username=X&password=X&stream=ID&start=TIMESTAMP&duration=DURATION
        if (source) {
          return this.replacePlaceholders(source, {
            utc: startUtc.toString(),
            start: startUtc.toString(),
            duration: duration.toString(),
            Y, m, d, H, M, S,
          })
        }
        // Try to build XC URL from live URL
        const xcUrl = new URL(liveUrl)
        xcUrl.pathname = "/streaming/timeshift.php"
        xcUrl.searchParams.set("start", startUtc.toString())
        xcUrl.searchParams.set("duration", duration.toString())
        return xcUrl.toString()

      case "vod":
        // VOD-style catchup (program has its own URL)
        return source || liveUrl

      default:
        return null
    }
  }

  /**
   * Replace placeholders in URL template
   */
  private replacePlaceholders(template: string, values: Record<string, string>): string {
    let result = template
    for (const [key, value] of Object.entries(values)) {
      result = result.replace(new RegExp(`\\{${key}\\}`, "g"), value)
    }
    return result
  }

  /**
   * Get catchup URL for "Watch from Start" feature
   * This is for currently live programs
   */
  getWatchFromStartUrl(channel: Channel, program: EPGProgram): string | null {
    if (!this.hasCatchup(channel)) return null
    if (!this.isLive(program)) return null
    
    return this.buildCatchupUrl(channel, program)
  }

  /**
   * Get the earliest available catchup time for a channel
   */
  getEarliestCatchupTime(channel: Channel): Date | null {
    if (!this.hasCatchup(channel)) return null
    
    const days = this.getCatchupDays(channel)
    return new Date(Date.now() - days * 24 * 60 * 60 * 1000)
  }

  /**
   * Format catchup availability for display
   */
  formatCatchupInfo(channel: Channel): string {
    if (!this.hasCatchup(channel)) return ""
    
    const days = this.getCatchupDays(channel)
    if (days === 1) return "1 day catchup"
    return `${days} days catchup`
  }
}

// Export singleton instance
export const catchupManager = new CatchupManager()
