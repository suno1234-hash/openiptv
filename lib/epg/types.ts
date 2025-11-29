/**
 * EPG (Electronic Program Guide) Types
 */

export interface EPGProgram {
  id: string
  channelId: string
  title: string
  description?: string
  start: Date
  end: Date
  category?: string
  rating?: string
  image?: string
}

export interface EPGChannel {
  id: string
  name: string
  icon?: string
  programs: EPGProgram[]
}

export interface EPGData {
  channels: EPGChannel[]
  lastUpdated: Date
}
