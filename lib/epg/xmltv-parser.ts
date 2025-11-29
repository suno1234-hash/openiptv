/**
 * XMLTV EPG Parser
 * Parses XMLTV format EPG data
 */

import { EPGProgram, EPGChannel } from "./types"

interface XMLTVProgram {
  "@_start": string
  "@_stop": string
  "@_channel": string
  title: string | { "#text": string }
  desc?: string | { "#text": string }
  category?: string | { "#text": string }
  icon?: { "@_src": string }
}

interface XMLTVChannel {
  "@_id": string
  "display-name": string | { "#text": string }
  icon?: { "@_src": string }
}

/**
 * Parse XMLTV timestamp to Date
 * Format: 20231013120000 +0300
 */
function parseXMLTVDate(dateStr: string): Date {
  // Extract the date part (first 14 digits: YYYYMMDDHHmmss)
  const year = parseInt(dateStr.substring(0, 4))
  const month = parseInt(dateStr.substring(4, 6)) - 1 // JS months are 0-indexed
  const day = parseInt(dateStr.substring(6, 8))
  const hour = parseInt(dateStr.substring(8, 10))
  const minute = parseInt(dateStr.substring(10, 12))
  const second = parseInt(dateStr.substring(12, 14))

  return new Date(year, month, day, hour, minute, second)
}

/**
 * Extract text from XMLTV element (can be string or object)
 */
function extractText(value: string | { "#text": string } | undefined): string {
  if (!value) return ""
  if (typeof value === "string") return value
  return value["#text"] || ""
}

/**
 * Parse XMLTV XML to EPG data
 */
export async function parseXMLTV(xmlText: string): Promise<Map<string, EPGChannel>> {
  const epgData = new Map<string, EPGChannel>()

  try {
    // Use browser's DOMParser
    const parser = new DOMParser()
    const xmlDoc = parser.parseFromString(xmlText, "text/xml")

    // Check for parsing errors
    const parseError = xmlDoc.querySelector("parsererror")
    if (parseError) {
      throw new Error("XML parsing error: " + parseError.textContent)
    }

    // Parse channels
    const channels = xmlDoc.querySelectorAll("channel")
    const channelMap = new Map<string, { name: string; icon?: string }>()

    channels.forEach((channel) => {
      const id = channel.getAttribute("id")
      const displayName = channel.querySelector("display-name")?.textContent
      const icon = channel.querySelector("icon")?.getAttribute("src") ?? undefined

      if (id && displayName) {
        channelMap.set(id, { name: displayName, icon })
      }
    })

    // Parse programmes
    const programmes = xmlDoc.querySelectorAll("programme")

    programmes.forEach((programme) => {
      const channelId = programme.getAttribute("channel")
      const start = programme.getAttribute("start")
      const stop = programme.getAttribute("stop")
      const title = programme.querySelector("title")?.textContent
      const desc = programme.querySelector("desc")?.textContent ?? undefined
      const category = programme.querySelector("category")?.textContent ?? undefined
      const icon = programme.querySelector("icon")?.getAttribute("src") ?? undefined

      if (!channelId || !start || !stop || !title) return

      const channelInfo = channelMap.get(channelId)
      if (!channelInfo) return

      // Get or create channel in EPG data
      if (!epgData.has(channelId)) {
        epgData.set(channelId, {
          id: channelId,
          name: channelInfo.name,
          icon: channelInfo.icon,
          programs: [],
        })
      }

      const channel = epgData.get(channelId)!

      // Add program
      channel.programs.push({
        id: `${channelId}_${start}`,
        channelId,
        title,
        description: desc,
        start: parseXMLTVDate(start),
        end: parseXMLTVDate(stop),
        category,
        image: icon,
      })
    })

    // Sort programs by start time for each channel
    epgData.forEach((channel) => {
      channel.programs.sort((a, b) => a.start.getTime() - b.start.getTime())
    })

    return epgData
  } catch (error) {
    console.error("Failed to parse XMLTV:", error)
    throw error
  }
}

/**
 * Fetch EPG from URL
 */
export async function fetchXMLTVFromURL(url: string): Promise<Map<string, EPGChannel>> {
  try {
    const response = await fetch(url)
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`)
    }

    const xmlText = await response.text()
    return await parseXMLTV(xmlText)
  } catch (error) {
    console.error("Failed to fetch XMLTV from URL:", error)
    throw error
  }
}

/**
 * Common EPG sources (examples)
 */
export const EPG_SOURCES = {
  // Add your EPG source URLs here
  // Example: "https://iptv-org.github.io/epg/guides/il.xml"
  
  // User can provide their own XMLTV URL
  custom: (url: string) => url,
}
