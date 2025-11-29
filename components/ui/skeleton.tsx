import { cn } from "@/lib/utils"

interface SkeletonProps {
  className?: string
}

export function Skeleton({ className }: SkeletonProps) {
  return (
    <div
      className={cn(
        "animate-pulse rounded-md bg-muted/50",
        className
      )}
    />
  )
}

export function ChannelCardSkeleton() {
  return (
    <div className="p-3 rounded-lg border bg-card">
      <div className="flex items-center gap-3">
        <Skeleton className="w-12 h-12 rounded-lg" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-3 w-1/2" />
        </div>
      </div>
    </div>
  )
}

export function ChannelGridSkeleton() {
  return (
    <div className="p-3 rounded-lg border bg-card">
      <Skeleton className="aspect-video w-full rounded-md mb-2" />
      <Skeleton className="h-4 w-3/4 mb-1" />
      <Skeleton className="h-3 w-1/2" />
    </div>
  )
}

export function ContinueWatchingSkeleton() {
  return (
    <div className="space-y-3">
      <Skeleton className="h-5 w-40" />
      <div className="flex gap-3 overflow-hidden">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="flex-shrink-0 w-40">
            <Skeleton className="aspect-video w-full rounded-t-lg" />
            <div className="p-2 space-y-1 bg-card rounded-b-lg border border-t-0">
              <Skeleton className="h-3 w-3/4" />
              <Skeleton className="h-2 w-1/2" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export function VideoPlayerSkeleton() {
  return (
    <div className="relative w-full h-full bg-black flex items-center justify-center">
      <div className="text-center">
        <div className="relative w-16 h-16 mx-auto mb-4">
          <div className="absolute inset-0 rounded-full border-4 border-primary/20" />
          <div className="absolute inset-0 rounded-full border-4 border-primary border-t-transparent animate-spin" />
        </div>
        <Skeleton className="h-4 w-32 mx-auto" />
      </div>
    </div>
  )
}

export function ChannelListSkeleton({ count = 8, viewMode = "list" }: { count?: number; viewMode?: "grid" | "list" }) {
  if (viewMode === "grid") {
    return (
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 p-4">
        {[...Array(count)].map((_, i) => (
          <ChannelGridSkeleton key={i} />
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-2 p-4">
      {[...Array(count)].map((_, i) => (
        <ChannelCardSkeleton key={i} />
      ))}
    </div>
  )
}
