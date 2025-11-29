/**
 * Custom Folders Store
 * Manages user-created folders and channel organization
 */

import { create } from "zustand"
import { persist } from "zustand/middleware"

export interface CustomFolder {
  id: string
  name: string
  channelIds: string[]
  color?: string
  icon?: string
  order: number
}

interface CustomFoldersStore {
  folders: CustomFolder[]
  
  // Folder operations
  createFolder: (name: string, color?: string) => string
  renameFolder: (folderId: string, newName: string) => void
  deleteFolder: (folderId: string) => void
  reorderFolders: (folderIds: string[]) => void
  
  // Channel operations
  addChannelToFolder: (folderId: string, channelId: string) => void
  removeChannelFromFolder: (folderId: string, channelId: string) => void
  moveChannelToFolder: (channelId: string, fromFolderId: string | null, toFolderId: string) => void
  getChannelFolder: (channelId: string) => CustomFolder | null
  
  // Getters
  getFolders: () => CustomFolder[]
  getFolder: (folderId: string) => CustomFolder | undefined
  getFolderChannels: (folderId: string) => string[]
}

export const useCustomFoldersStore = create<CustomFoldersStore>()(
  persist(
    (set, get) => ({
      folders: [],

      createFolder: (name: string, color?: string) => {
        const id = `folder_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
        const folder: CustomFolder = {
          id,
          name,
          channelIds: [],
          color: color || "#3b82f6",
          order: get().folders.length,
        }
        
        set((state) => ({
          folders: [...state.folders, folder],
        }))
        
        return id
      },

      renameFolder: (folderId: string, newName: string) => {
        set((state) => ({
          folders: state.folders.map((folder) =>
            folder.id === folderId ? { ...folder, name: newName } : folder
          ),
        }))
      },

      deleteFolder: (folderId: string) => {
        set((state) => ({
          folders: state.folders.filter((folder) => folder.id !== folderId),
        }))
      },

      reorderFolders: (folderIds: string[]) => {
        set((state) => {
          const folderMap = new Map(state.folders.map((f) => [f.id, f]))
          const reordered = folderIds
            .map((id) => folderMap.get(id))
            .filter((f): f is CustomFolder => f !== undefined)
            .map((folder, index) => ({ ...folder, order: index }))
          
          return { folders: reordered }
        })
      },

      addChannelToFolder: (folderId: string, channelId: string) => {
        set((state) => ({
          folders: state.folders.map((folder) =>
            folder.id === folderId && !folder.channelIds.includes(channelId)
              ? { ...folder, channelIds: [...folder.channelIds, channelId] }
              : folder
          ),
        }))
      },

      removeChannelFromFolder: (folderId: string, channelId: string) => {
        set((state) => ({
          folders: state.folders.map((folder) =>
            folder.id === folderId
              ? { ...folder, channelIds: folder.channelIds.filter((id) => id !== channelId) }
              : folder
          ),
        }))
      },

      moveChannelToFolder: (channelId: string, fromFolderId: string | null, toFolderId: string) => {
        set((state) => {
          let updatedFolders = [...state.folders]
          
          // Remove from old folder
          if (fromFolderId) {
            updatedFolders = updatedFolders.map((folder) =>
              folder.id === fromFolderId
                ? { ...folder, channelIds: folder.channelIds.filter((id) => id !== channelId) }
                : folder
            )
          }
          
          // Add to new folder
          updatedFolders = updatedFolders.map((folder) =>
            folder.id === toFolderId && !folder.channelIds.includes(channelId)
              ? { ...folder, channelIds: [...folder.channelIds, channelId] }
              : folder
          )
          
          return { folders: updatedFolders }
        })
      },

      getChannelFolder: (channelId: string) => {
        const folders = get().folders
        return folders.find((folder) => folder.channelIds.includes(channelId)) || null
      },

      getFolders: () => {
        return get().folders.sort((a, b) => a.order - b.order)
      },

      getFolder: (folderId: string) => {
        return get().folders.find((folder) => folder.id === folderId)
      },

      getFolderChannels: (folderId: string) => {
        const folder = get().folders.find((f) => f.id === folderId)
        return folder?.channelIds || []
      },
    }),
    {
      name: "custom-folders",
    }
  )
)
