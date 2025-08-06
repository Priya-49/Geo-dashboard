// polygon-list.tsx
"use client"

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { MapPin, Trash2 } from "lucide-react"
import { PolygonDataService } from "@/lib/polygon-data-service"
import { useEffect } from "react"
import type { Polygon } from "@/types/polygon" 

interface PolygonListDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  polygons: Polygon[]
  onLocatePolygon: (polygon: Polygon) => void
  onDeletePolygon: (polygonId: string) => void
}

export function PolygonListDialog({
  open,
  onOpenChange,
  polygons,
  onLocatePolygon,
  onDeletePolygon,
}: PolygonListDialogProps) {
  // Debug: Log when dialog opens/closes and polygon data
  useEffect(() => {
    if (open) {
      console.log(`📋 PolygonListDialog opened with ${polygons.length} polygons:`)
      polygons.forEach((polygon, index) => {
        console.log(`   ${index + 1}. ${polygon.name} (${polygon.dataSource})`)
        console.log(`    - Color: ${polygon.currentColor}`)
        console.log(`    - Value: ${polygon.lastProcessedResult?.value || "No data"}`)
        console.log(`    - Created: ${polygon.createdAt.toLocaleString()}`)
      })
    }
  }, [open, polygons])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl z-[9999] bg-white max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>Drawn Polygons - Real-time Data</DialogTitle>
          <DialogDescription>
            All polygons with live data values and processing information. Colors update automatically with timeline
            changes.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto">
          <div className="space-y-4 pr-2">
            {polygons.length > 0 ? (
              polygons.map((polygon, index) => {
                const result = polygon.lastProcessedResult
                const description = result
                  ? PolygonDataService.getProcessingDescription(result)
                  : "No data processed yet"

                return (
                  <div
                    key={polygon.id}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center gap-3 flex-1">
                      <div className="flex flex-col items-center">
                        <div
                          className="w-6 h-6 rounded-full border-2 border-white shadow-sm"
                          style={{ backgroundColor: polygon.currentColor }}
                        />
                        <span className="text-xs text-muted-foreground mt-1">#{index + 1}</span>
                      </div>
                      <div className="flex-1">
                        <h4 className="font-medium text-base">{polygon.name}</h4>
                        <p className="text-sm text-blue-700 font-medium mb-1">{description}</p>
                        <div className="grid grid-cols-2 gap-x-6 gap-y-1 text-xs text-muted-foreground">
                          <span>
                            <strong>Data Source:</strong> {polygon.dataSource}
                          </span>
                          <span>
                            <strong>Processing:</strong>{" "}
                            {result?.isAverage ? `Average (${result.dataPoints}h)` : "Single hour"}
                          </span>
                          <span>
                            <strong>Points:</strong> {polygon.points}
                          </span>
                          <span>
                            <strong>Area:</strong> {(polygon.area / 1000000).toFixed(3)} km²
                          </span>
                          <span>
                            <strong>Created:</strong> {polygon.createdAt.toLocaleDateString()}
                          </span>
                          <span>
                            <strong>Last Update:</strong>{" "}
                            {result ? new Date(result.timestamp).toLocaleTimeString() : "Never"}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          onLocatePolygon(polygon)
                          onOpenChange(false)
                        }}
                        className="gap-2"
                      >
                        <MapPin className="w-4 h-4" />
                        Locate
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          console.log(`🗑️ Deleting polygon: ${polygon.name}`)
                          onDeletePolygon(polygon.id)
                        }}
                        className="gap-2 text-destructive hover:text-destructive"
                      >
                        <Trash2 className="w-4 h-4" />
                        Delete
                      </Button>
                    </div>
                  </div>
                )
              })
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <div className="text-lg mb-2">No polygons drawn yet</div>
                <div className="text-sm">Start drawing to see real-time data visualization.</div>
              </div>
            )}
          </div>
        </div>

        {/* Summary Footer */}
        {polygons.length > 0 && (
          <div className="border-t pt-4 mt-4">
            <div className="text-sm text-muted-foreground">
              <strong>Summary:</strong> {polygons.length} polygon{polygons.length !== 1 ? "s" : ""} drawn •
              {polygons.filter((p) => p.lastProcessedResult?.value !== null).length} with data • Total area:{" "}
              {(polygons.reduce((sum, p) => sum + p.area, 0) / 1000000).toFixed(3)} km²
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
