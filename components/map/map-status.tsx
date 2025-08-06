// map/map-status.tsx
"use client"

import { Badge } from "@/components/ui/badge"
import { Activity } from "lucide-react"

interface MapStatusProps {
  processingStatus?: string
  isDrawing: boolean
  drawingPoints: number
  onCancelDrawing: () => void
  enabledDataSourcesCount: number
}

export function MapStatus({
  processingStatus,
  isDrawing,
  drawingPoints,
}: MapStatusProps) {
  return (
    <div className="space-y-4">
      {/* Processing Status */}
      {processingStatus && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-3">
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-green-600" />
            <span className="text-green-800 text-sm font-medium">{processingStatus}</span>
          </div>
        </div>
      )}

      {/* Drawing Status - Simplified */}
      {isDrawing && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-blue-600 rounded-full animate-pulse" />
            <span className="text-blue-800 font-medium">Drawing Mode Active</span>
            {drawingPoints > 0 && (
              <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                {drawingPoints} points
              </Badge>
            )}
            {drawingPoints >= 3 && (
              <Badge variant="secondary" className="bg-green-100 text-green-800">
                Ready to finish
              </Badge>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

