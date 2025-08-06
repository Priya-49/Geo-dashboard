//map-controls.tsx
"use client"

import { Button } from "@/components/ui/button"
import { RotateCcw, Pencil, Trash2 } from "lucide-react"

interface MapControlsProps {
  isMapReady: boolean
  isDrawing: boolean
  enabledDataSourcesCount: number
  polygonsCount: number
  onStartDrawing: () => void
  onResetCenter: () => void
  onClearAll: () => void
}

export function MapControls({
  isMapReady,
  isDrawing,
  enabledDataSourcesCount,
  polygonsCount,
  onStartDrawing,
  onResetCenter,
  onClearAll,
}: MapControlsProps) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2">
        <Button
          onClick={onStartDrawing}
          disabled={!isMapReady || isDrawing || enabledDataSourcesCount === 0}
          className="gap-2"
        >
          <Pencil className="w-4 h-4" />
          {isDrawing ? "Drawing..." : "Start Drawing Polygon"}
        </Button>

        <Button
          variant="outline"
          size="sm"
          onClick={onResetCenter}
          className="gap-2 bg-transparent"
          disabled={!isMapReady}
        >
          <RotateCcw className="w-4 h-4" />
          Reset Center
        </Button>

        {polygonsCount > 0 && (
          <Button
            variant="outline"
            size="sm"
            onClick={onClearAll}
            className="gap-2 text-destructive hover:text-destructive bg-transparent"
            disabled={!isMapReady}
          >
            <Trash2 className="w-4 h-4" />
            Clear All
          </Button>
        )}
      </div>
    </div>
  )
}
