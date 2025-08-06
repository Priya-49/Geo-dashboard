"use client"

import { useState, useCallback } from "react"
import { TimelineSlider } from "@/components/timeline-slider"
import { InteractiveMap } from "@/components/interactive-map"
import { DataSidebar, type DataSource } from "@/components/data-sidebar"

export default function Dashboard() {
  const [dataSources, setDataSources] = useState<DataSource[]>([])
  const [selectedTimeRange, setSelectedTimeRange] = useState<{ start: Date; end: Date } | undefined>()

  // Simplify the timeline change handler
  const handleTimelineChange = useCallback((startHour: number, endHour: number, startDate: Date, endDate: Date) => {
    // Only update if the time range actually changed
    const newTimeRange = { start: startDate, end: endDate }

    setSelectedTimeRange((prevRange) => {
      if (
        !prevRange ||
        prevRange.start.getTime() !== newTimeRange.start.getTime() ||
        prevRange.end.getTime() !== newTimeRange.end.getTime()
      ) {
        return newTimeRange
      }
      return prevRange
    })
  }, [])

  return (
    <div className="min-h-screen bg-background">
      <div className="flex">
        {/* Sidebar */}
        <div className="w-80 min-h-screen border-r bg-card">
          <DataSidebar onDataSourceChange={setDataSources} className="border-0 rounded-none h-full" />
        </div>

        {/* Main Content */}
        <div className="flex-1 p-6">
          <div className="max-w-6xl mx-auto space-y-6">
            <div className="space-y-2">
              <h1 className="text-3xl font-bold tracking-tight">Real-time Spatio-Temporal Analysis</h1>
              <p className="text-muted-foreground">
                Interactive timeline and spatial analysis with immediate data visualization and color-coded insights
              </p>
            </div>

            {/* Timeline Control */}
            <TimelineSlider onTimeRangeChange={handleTimelineChange} />

            {/* Interactive Map */}
            <InteractiveMap dataSources={dataSources} selectedTimeRange={selectedTimeRange} />

            {/* Real-time Status */}
            
          </div>
        </div>
      </div>
    </div>
  )
}

