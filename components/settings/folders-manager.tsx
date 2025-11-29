"use client"

import { useState } from "react"
import { FolderPlus, Edit, Trash2, Folder } from "lucide-react"
import { useCustomFoldersStore } from "@/lib/store/custom-folders-store"
import { cn } from "@/lib/utils"

const FOLDER_COLORS = [
  "#3b82f6", // blue
  "#10b981", // green
  "#f59e0b", // amber
  "#ef4444", // red
  "#8b5cf6", // purple
  "#ec4899", // pink
  "#06b6d4", // cyan
  "#f97316", // orange
]

export function FoldersManager() {
  const { folders, createFolder, renameFolder, deleteFolder, getFolders } = useCustomFoldersStore()
  const [isCreating, setIsCreating] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [newName, setNewName] = useState("")
  const [selectedColor, setSelectedColor] = useState(FOLDER_COLORS[0])

  const sortedFolders = getFolders()

  const handleCreate = () => {
    if (newName.trim()) {
      createFolder(newName.trim(), selectedColor)
      setNewName("")
      setIsCreating(false)
      setSelectedColor(FOLDER_COLORS[0])
    }
  }

  const handleRename = (folderId: string) => {
    if (newName.trim()) {
      renameFolder(folderId, newName.trim())
      setEditingId(null)
      setNewName("")
    }
  }

  const handleDelete = (folderId: string) => {
    const folder = folders.find((f) => f.id === folderId)
    if (folder && confirm(`Delete folder "${folder.name}"?\n\nChannels will not be deleted, just removed from this folder.`)) {
      deleteFolder(folderId)
    }
  }

  const startEditing = (folderId: string, currentName: string) => {
    setEditingId(folderId)
    setNewName(currentName)
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-semibold">Custom Folders</h3>
          <p className="text-sm text-muted-foreground">
            Create folders to organize your channels
          </p>
        </div>
        <button
          onClick={() => setIsCreating(true)}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
        >
          <FolderPlus className="h-4 w-4" />
          New Folder
        </button>
      </div>

      {/* Create Form */}
      {isCreating && (
        <div className="p-4 border rounded-lg bg-muted/50">
          <h4 className="font-medium mb-3">Create New Folder</h4>
          <div className="space-y-3">
            <div>
              <label className="text-sm font-medium mb-2 block">Folder Name</label>
              <input
                type="text"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="e.g., Sports, News, Kids..."
                className="w-full px-3 py-2 border rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleCreate()
                  if (e.key === "Escape") {
                    setIsCreating(false)
                    setNewName("")
                  }
                }}
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Color</label>
              <div className="flex gap-2">
                {FOLDER_COLORS.map((color) => (
                  <button
                    key={color}
                    onClick={() => setSelectedColor(color)}
                    className={cn(
                      "w-8 h-8 rounded-full border-2 transition-all",
                      selectedColor === color ? "border-foreground scale-110" : "border-transparent"
                    )}
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleCreate}
                disabled={!newName.trim()}
                className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors disabled:opacity-50"
              >
                Create
              </button>
              <button
                onClick={() => {
                  setIsCreating(false)
                  setNewName("")
                }}
                className="px-4 py-2 border rounded-md hover:bg-accent transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Folders List */}
      <div className="space-y-2">
        {sortedFolders.length === 0 ? (
          <div className="text-center p-8 text-muted-foreground">
            <Folder className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p>No custom folders yet</p>
            <p className="text-sm mt-1">Create a folder to organize your channels</p>
          </div>
        ) : (
          sortedFolders.map((folder) => (
            <div
              key={folder.id}
              className="flex items-center gap-3 p-3 border rounded-lg hover:border-primary transition-colors"
            >
              <Folder className="h-5 w-5 flex-shrink-0" style={{ color: folder.color }} />

              {editingId === folder.id ? (
                <input
                  type="text"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="flex-1 px-2 py-1 border rounded bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                  autoFocus
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleRename(folder.id)
                    if (e.key === "Escape") {
                      setEditingId(null)
                      setNewName("")
                    }
                  }}
                  onBlur={() => handleRename(folder.id)}
                />
              ) : (
                <div className="flex-1">
                  <p className="font-medium">{folder.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {folder.channelIds.length} channel{folder.channelIds.length !== 1 ? "s" : ""}
                  </p>
                </div>
              )}

              <div className="flex items-center gap-1">
                <button
                  onClick={() => startEditing(folder.id, folder.name)}
                  className="p-2 rounded hover:bg-accent transition-colors"
                  title="Rename"
                >
                  <Edit className="h-4 w-4" />
                </button>
                <button
                  onClick={() => handleDelete(folder.id)}
                  className="p-2 rounded hover:bg-destructive/10 transition-colors"
                  title="Delete"
                >
                  <Trash2 className="h-4 w-4 text-destructive" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Instructions */}
      <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg text-sm">
        <p className="font-medium mb-2">💡 How to use custom folders:</p>
        <ul className="space-y-1 text-muted-foreground ml-4 list-disc">
          <li><strong>Drag & Drop:</strong> Drag channels onto folders in the channel list</li>
          <li><strong>Right-Click:</strong> Right-click any channel → Move to Folder</li>
          <li><strong>Organize:</strong> Channels can be in one folder at a time</li>
          <li><strong>Remove:</strong> Right-click → Remove from Folder</li>
        </ul>
      </div>
    </div>
  )
}
