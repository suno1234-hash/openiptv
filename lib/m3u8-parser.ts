import { Channel, CatchupInfo, CatchupType } from "./types"

export interface M3U8ParseResult {
  channels: Channel[]
  totalParsed: number
  errors: string[]
  catchupChannels: number // Count of channels with catchup support
}

/**
 * Parse M3U8 playlist content and extract channel information
 */
export async function parseM3U8(content: string): Promise<M3U8ParseResult> {
  const lines = content.split("\n").map(line => line.trim())
  const channels: Channel[] = []
  const errors: string[] = []
  
  let currentInfo: Partial<Channel> = {}
  let currentCatchup: CatchupInfo | undefined
  let order = 0
  let catchupCount = 0

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    
    // Skip empty lines and comments (except EXTINF)
    if (!line || line.startsWith("#") && !line.startsWith("#EXTINF")) {
      continue
    }

    // Parse EXTINF line
    if (line.startsWith("#EXTINF")) {
      try {
        const { info, catchup } = parseExtinf(line)
        currentInfo = {
          ...info,
          order: order++,
          isFavorite: false,
          isHidden: false,
        }
        currentCatchup = catchup
      } catch (error) {
        errors.push(`Error parsing line ${i + 1}: ${error}`)
      }
    } 
    // Parse stream URL (supports http, https, rtmp, rtsp, mms, udp protocols)
    else if (/^(https?|rtmp|rtsp|mms|udp):\/\//i.test(line)) {
      if (currentInfo.name) {
        // Detect VOD content
        const vodInfo = detectVodContent(currentInfo.name, currentInfo.group, line)
        
        const channel: Channel = {
          id: generateChannelId(currentInfo.name, line),
          name: currentInfo.name,
          url: line,
          logo: currentInfo.logo,
          group: currentInfo.group,
          tvgId: currentInfo.tvgId,
          tvgName: currentInfo.tvgName,
          tvgChno: currentInfo.tvgChno,
          order: currentInfo.order || order++,
          isFavorite: false,
          isHidden: false,
          ...vodInfo,
        }
        
        // Add catchup info if available
        if (currentCatchup) {
          channel.catchup = currentCatchup
          catchupCount++
        }
        
        channels.push(channel)
        currentInfo = {}
        currentCatchup = undefined
      }
    }
  }

  return {
    channels,
    totalParsed: channels.length,
    errors,
    catchupChannels: catchupCount,
  }
}

interface ParsedExtinf {
  info: Partial<Channel>
  catchup?: CatchupInfo
}

/**
 * Parse EXTINF line to extract channel metadata and catchup info
 */
function parseExtinf(line: string): ParsedExtinf {
  const info: Partial<Channel> = {}
  let catchup: CatchupInfo | undefined
  
  // Extract standard attributes from the line
  const tvgIdMatch = line.match(/tvg-id="([^"]*)"/)
  const tvgNameMatch = line.match(/tvg-name="([^"]*)"/)
  const tvgLogoMatch = line.match(/tvg-logo="([^"]*)"/)
  const groupTitleMatch = line.match(/group-title="([^"]*)"/)
  const tvgChnoMatch = line.match(/tvg-chno="([^"]*)"/)
  const channelNumberMatch = line.match(/channel-number="([^"]*)"/)
  
  if (tvgIdMatch) info.tvgId = tvgIdMatch[1]
  if (tvgNameMatch) info.tvgName = tvgNameMatch[1]
  if (tvgLogoMatch) info.logo = tvgLogoMatch[1]
  if (groupTitleMatch) info.group = groupTitleMatch[1]
  
  // Channel number
  const chnoStr = tvgChnoMatch?.[1] || channelNumberMatch?.[1]
  if (chnoStr) {
    const chno = parseInt(chnoStr, 10)
    if (!isNaN(chno)) info.tvgChno = chno
  }
  
  // Extract catchup/timeshift attributes (multiple formats supported)
  // Format 1: catchup="default" catchup-days="7" catchup-source="..."
  const catchupMatch = line.match(/catchup="([^"]*)"/)
  const catchupTypeMatch = line.match(/catchup-type="([^"]*)"/)
  const catchupDaysMatch = line.match(/catchup-days="([^"]*)"/)
  const timeshiftMatch = line.match(/timeshift="([^"]*)"/)
  const catchupSourceMatch = line.match(/catchup-source="([^"]*)"/)
  
  // Format 2: tvg-rec="3" (days of recording available)
  const tvgRecMatch = line.match(/tvg-rec="([^"]*)"/)
  
  // Format 3: catchup-length="..." (in hours or with unit)
  const catchupLengthMatch = line.match(/catchup-length="([^"]*)"/)
  
  // Format 4: archive="1" archive-days="7"
  const archiveMatch = line.match(/archive="([^"]*)"/)
  const archiveDaysMatch = line.match(/archive-days="([^"]*)"/)
  
  // Determine catchup type
  const catchupType = catchupMatch?.[1] || catchupTypeMatch?.[1] || (archiveMatch?.[1] === "1" ? "default" : null)
  
  // Determine catchup days from various sources
  let catchupDaysValue: number | null = null
  if (catchupDaysMatch?.[1]) {
    catchupDaysValue = parseInt(catchupDaysMatch[1], 10)
  } else if (timeshiftMatch?.[1]) {
    catchupDaysValue = parseInt(timeshiftMatch[1], 10)
  } else if (tvgRecMatch?.[1]) {
    catchupDaysValue = parseInt(tvgRecMatch[1], 10)
  } else if (archiveDaysMatch?.[1]) {
    catchupDaysValue = parseInt(archiveDaysMatch[1], 10)
  } else if (catchupLengthMatch?.[1]) {
    // catchup-length can be in hours (e.g., "72" or "72h") or days (e.g., "3d")
    const lengthStr = catchupLengthMatch[1]
    if (lengthStr.endsWith('d')) {
      catchupDaysValue = parseInt(lengthStr, 10)
    } else {
      // Assume hours, convert to days
      const hours = parseInt(lengthStr, 10)
      catchupDaysValue = Math.ceil(hours / 24)
    }
  }
  
  // Create catchup info if we have type or days
  if (catchupType || catchupDaysValue) {
    catchup = {
      type: (catchupType as CatchupType) || "default",
      days: catchupDaysValue || 7,
      source: catchupSourceMatch?.[1],
    }
  }
  
  // Extract channel name (after the comma)
  const commaIndex = line.lastIndexOf(",")
  if (commaIndex !== -1) {
    info.name = line.substring(commaIndex + 1).trim()
  }
  
  // Fallback to tvg-name if name is empty
  if (!info.name && info.tvgName) {
    info.name = info.tvgName
  }
  
  return { info, catchup }
}

/**
 * Generate a unique channel ID based on name and URL
 */
function generateChannelId(name: string, url: string): string {
  const str = `${name}-${url}`
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash = hash & hash // Convert to 32-bit integer
  }
  return `ch_${Math.abs(hash).toString(36)}`
}

/**
 * Detect if content is VOD (Movie/Series) based on name, group, and URL
 */
function detectVodContent(name: string, group?: string, url?: string): Partial<Channel> {
  const lowerName = name.toLowerCase()
  const lowerGroup = (group || "").toLowerCase()
  const lowerUrl = (url || "").toLowerCase()
  
  // VOD group patterns
  const vodGroupPatterns = [
    /movies?/i, /films?/i, /vod/i, /series/i, /shows?/i, 
    /tv\s*series/i, /episodes?/i, /seasons?/i
  ]
  
  // Check if group indicates VOD
  const isVodGroup = vodGroupPatterns.some(p => p.test(lowerGroup))
  
  // Check URL patterns for VOD
  const vodUrlPatterns = [/\/movie\//i, /\/series\//i, /\/vod\//i, /\.mp4$/i, /\.mkv$/i, /\.avi$/i]
  const isVodUrl = vodUrlPatterns.some(p => p.test(lowerUrl))
  
  if (!isVodGroup && !isVodUrl) {
    return {}
  }
  
  // Detect series with S01E01 pattern
  const seriesMatch = name.match(/(.+?)\s*[Ss](\d{1,2})\s*[Ee](\d{1,3})/)
  if (seriesMatch) {
    return {
      isVod: true,
      vodType: "episode",
      seriesInfo: {
        name: seriesMatch[1].trim(),
        season: parseInt(seriesMatch[2], 10),
        episode: parseInt(seriesMatch[3], 10),
      }
    }
  }
  
  // Detect series with "Season X Episode Y" pattern
  const seasonMatch = name.match(/(.+?)\s*Season\s*(\d+)\s*Episode\s*(\d+)/i)
  if (seasonMatch) {
    return {
      isVod: true,
      vodType: "episode",
      seriesInfo: {
        name: seasonMatch[1].trim(),
        season: parseInt(seasonMatch[2], 10),
        episode: parseInt(seasonMatch[3], 10),
      }
    }
  }
  
  // Detect movies (year in title)
  const movieMatch = name.match(/(.+?)\s*\((\d{4})\)/)
  if (movieMatch || lowerGroup.includes("movie") || lowerGroup.includes("film")) {
    return {
      isVod: true,
      vodType: "movie",
    }
  }
  
  // Generic series detection
  if (lowerGroup.includes("series") || lowerGroup.includes("show")) {
    return {
      isVod: true,
      vodType: "series",
    }
  }
  
  // Default VOD
  return {
    isVod: true,
  }
}

/**
 * Fetch and parse M3U8 playlist from URL
 */
export async function fetchAndParseM3U8(url: string): Promise<M3U8ParseResult> {
  try {
    // Use our API proxy to bypass CORS issues
    const proxyUrl = `/api/proxy-playlist?url=${encodeURIComponent(url)}`
    const response = await fetch(proxyUrl)
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(errorData.error || `HTTP error! status: ${response.status}`)
    }
    
    const content = await response.text()
    
    if (!content || content.trim().length === 0) {
      throw new Error("Empty playlist received")
    }
    
    return await parseM3U8(content)
  } catch (error) {
    throw new Error(`Failed to fetch playlist: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

/**
 * Validate M3U/M3U8 playlist URL format
 * Accepts URLs with .m3u, .m3u8 extension or common IPTV URL patterns
 */
export function isValidM3U8Url(url: string): boolean {
  try {
    const parsed = new URL(url)
    const validProtocols = ["http:", "https:"]
    
    if (!validProtocols.includes(parsed.protocol)) {
      return false
    }
    
    // Check for common playlist extensions
    const pathname = parsed.pathname.toLowerCase()
    if (pathname.endsWith(".m3u8") || pathname.endsWith(".m3u")) {
      return true
    }
    
    // Check for common IPTV URL patterns (e.g., get.php, playlist, iptv)
    const commonPatterns = [
      /get\.php/i,
      /playlist/i,
      /iptv/i,
      /channels/i,
      /live/i,
      /stream/i,
      /tv/i,
    ]
    
    const fullUrl = url.toLowerCase()
    return commonPatterns.some(pattern => pattern.test(fullUrl))
  } catch {
    return false
  }
}

/**
 * Check if a URL is a valid stream URL (for channel entries)
 */
export function isValidStreamUrl(url: string): boolean {
  try {
    const parsed = new URL(url)
    const validProtocols = ["http:", "https:", "rtmp:", "rtsp:", "mms:", "udp:"]
    return validProtocols.includes(parsed.protocol)
  } catch {
    return false
  }
}
