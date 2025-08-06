//map-header.tsx
"use client"

import { Button } from "@/components/ui/button"
import { MapPin, Eye, Loader2 } from "lucide-react"

interface MapHeaderProps {
  isUpdatingPolygons: boolean
  polygonsCount: number
  onViewAllClick: () => void
}

export function MapHeader({ isUpdatingPolygons, polygonsCount, onViewAllClick }: MapHeaderProps) {
  return (
    <div className="flex items-center justify-between">
      <div className="space-y-1">
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <MapPin className="w-5 h-5" />
          Interactive Map
          {isUpdatingPolygons && <Loader2 className="w-4 h-4 animate-spin" />}
        </h2>
        <p className="text-sm text-muted-foreground">
          Real-time data visualization • Colors update automatically based on timeline and rules
        </p>
      </div>

      <div className="flex items-center gap-2">
        {polygonsCount > 0 && (
          <Button variant="outline" size="sm" onClick={onViewAllClick} className="gap-2 bg-transparent">
            <Eye className="w-4 h-4" />
            View All ({polygonsCount})
          </Button>
        )}
      </div>
    </div>
  )
}

