//timeline-slider.tsx
"use client"

import type React from "react"
import { useState, useRef, useCallback, useEffect } from "react"
import { Button } from "@/components/ui/button"

type SliderMode = "single" | "range"

interface TimelineSliderProps {
  className?: string
  onTimeRangeChange?: (startHour: number, endHour: number, startDate: Date, endDate: Date) => void
}

export function TimelineSlider({ className, onTimeRangeChange }: TimelineSliderProps) {
  const [mode, setMode] = useState<SliderMode>("single")
  const [isDragging, setIsDragging] = useState(false)
  const [dragTarget, setDragTarget] = useState<"single" | "start" | "end" | null>(null)

  // Timeline spans 30 days (15 before, 15 after today) with hourly resolution
  const totalHours = 30 * 24 // 720 hours
  const centerHour = totalHours / 2 // Current time position

  // Single handle position (hours from start) - snap to current hour
  const [singlePosition, setSinglePosition] = useState(Math.round(centerHour))

  // Range positions (hours from start) - snap to exact hours
  const [rangeStart, setRangeStart] = useState(Math.round(centerHour - 24)) // 1 day before
  const [rangeEnd, setRangeEnd] = useState(Math.round(centerHour + 24)) // 1 day after

  const sliderRef = useRef<HTMLDivElement>(null)

  // Convert hour position to date
  const getDateFromPosition = useCallback((position: number) => {
    const now = new Date()
    const startDate = new Date(now.getTime() - 15 * 24 * 60 * 60 * 1000) // 15 days ago
    return new Date(startDate.getTime() + position * 60 * 60 * 1000)
  }, [])

  // Instead, only notify when values actually change
  useEffect(() => {
    if (mode === "single") {
      const startDate = getDateFromPosition(singlePosition)
      const endDate = new Date(startDate.getTime() + 60 * 60 * 1000)
      onTimeRangeChange?.(singlePosition, singlePosition + 1, startDate, endDate)
    } else {
      const startDate = getDateFromPosition(rangeStart)
      const endDate = getDateFromPosition(rangeEnd)
      onTimeRangeChange?.(rangeStart, rangeEnd, startDate, endDate)
    }
  }, [mode, singlePosition, rangeStart, rangeEnd, getDateFromPosition, onTimeRangeChange])

  // Convert pixel position to hour position
  const getPositionFromPixel = useCallback(
    (pixelX: number) => {
      if (!sliderRef.current) return 0
      const rect = sliderRef.current.getBoundingClientRect()
      const relativeX = Math.max(0, Math.min(pixelX - rect.left, rect.width))
      return (relativeX / rect.width) * totalHours
    },
    [totalHours],
  )

  // Snap position to nearest hour
  const snapToHour = useCallback((position: number) => {
    return Math.round(position)
  }, [])

  // Handle mouse down
  const handleMouseDown = useCallback((e: React.MouseEvent, target: "single" | "start" | "end") => {
    e.preventDefault()
    setIsDragging(true)
    setDragTarget(target)
  }, [])

  // Handle mouse move
  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!isDragging || !dragTarget) return

      const newPosition = getPositionFromPixel(e.clientX)
      const clampedPosition = Math.max(0, Math.min(newPosition, totalHours))
      const snappedPosition = snapToHour(clampedPosition)

      if (dragTarget === "single") {
        setSinglePosition(snappedPosition)
      } else if (dragTarget === "start") {
        setRangeStart(Math.min(snappedPosition, rangeEnd - 1))
      } else if (dragTarget === "end") {
        setRangeEnd(Math.max(snappedPosition, rangeStart + 1))
      }
    },
    [isDragging, dragTarget, getPositionFromPixel, totalHours, rangeEnd, rangeStart, snapToHour],
  )

  // Handle mouse up
  const handleMouseUp = useCallback(() => {
    setIsDragging(false)
    setDragTarget(null)
  }, [])

  // Handle timeline click
  const handleTimelineClick = useCallback(
    (e: React.MouseEvent) => {
      if (isDragging) return

      const newPosition = getPositionFromPixel(e.clientX)
      const clampedPosition = Math.max(0, Math.min(newPosition, totalHours))
      const snappedPosition = snapToHour(clampedPosition)

      if (mode === "single") {
        setSinglePosition(snappedPosition)
      } else {
        // For range mode, set the closest handle
        const distToStart = Math.abs(snappedPosition - rangeStart)
        const distToEnd = Math.abs(snappedPosition - rangeEnd)

        if (distToStart < distToEnd) {
          setRangeStart(Math.min(snappedPosition, rangeEnd - 1))
        } else {
          setRangeEnd(Math.max(snappedPosition, rangeStart + 1))
        }
      }
    },
    [isDragging, getPositionFromPixel, totalHours, mode, rangeStart, rangeEnd, snapToHour],
  )

  // Add global mouse event listeners
  useEffect(() => {
    if (isDragging) {
      document.addEventListener("mousemove", handleMouseMove)
      document.addEventListener("mouseup", handleMouseUp)
      return () => {
        document.removeEventListener("mousemove", handleMouseMove)
        document.removeEventListener("mouseup", handleMouseUp)
      }
    }
  }, [isDragging, handleMouseMove, handleMouseUp])

  // Format date for display
  const formatSelectedTime = (date: Date) => {
    const today = new Date()
    const isToday = date.toDateString() === today.toDateString()

    // Create a new date with minutes set to 00
    const hourlyDate = new Date(date)
    hourlyDate.setMinutes(0, 0, 0)

    if (isToday) {
      return `Today ${hourlyDate.toLocaleTimeString("en-US", {
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
      })}`
    }

    return hourlyDate.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    })
  }

  const formatRangeTime = (startDate: Date, endDate: Date) => {
    const today = new Date()

    // Create new dates with minutes set to 00
    const hourlyStartDate = new Date(startDate)
    hourlyStartDate.setMinutes(0, 0, 0)

    const hourlyEndDate = new Date(endDate)
    hourlyEndDate.setMinutes(0, 0, 0)

    const isStartToday = hourlyStartDate.toDateString() === today.toDateString()
    const isEndToday = hourlyEndDate.toDateString() === today.toDateString()

    const formatTime = (date: Date, isToday: boolean) => {
      if (isToday) {
        return `Today ${date.toLocaleTimeString("en-US", {
          hour: "numeric",
          minute: "2-digit",
          hour12: true,
        })}`
      }
      return date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
      })
    }

    const hoursDiff = Math.abs(hourlyEndDate.getTime() - hourlyStartDate.getTime()) / (1000 * 60 * 60)
    const rangeText = `${formatTime(hourlyStartDate, isStartToday)} - ${formatTime(hourlyEndDate, isEndToday)}`
    const durationText = `(${Math.round(hoursDiff)} hours)`

    return `${rangeText} ${durationText}`
  }

  return (
    <div className={`bg-white rounded-lg border border-gray-200 p-6 ${className}`}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <h1 className="text-2xl font-semibold text-blue-600">Timeline Control</h1>
            
          </div>

          {/* Mode Toggle */}
          <Button
            variant="outline"
            onClick={() => setMode(mode === "single" ? "range" : "single")}
            className="text-gray-700 border-gray-300"
          >
            {mode === "single" ? "Switch to Range" : "Switch to Single"}
          </Button>
        </div>

        {/* Selected Time Display */}
        <div className="bg-blue-50 rounded-lg p-4">
          <div className="text-blue-700 font-medium">
            {mode === "single"
              ? formatSelectedTime(getDateFromPosition(singlePosition))
              : formatRangeTime(getDateFromPosition(rangeStart), getDateFromPosition(rangeEnd))}
          </div>
        </div>

        {/* Timeline Slider */}
        <div className="space-y-4">
          <div ref={sliderRef} className="relative h-2 cursor-pointer select-none" onClick={handleTimelineClick}>
            {/* Timeline track */}
            <div className="absolute top-1/2 left-0 right-0 h-1 bg-gray-800 rounded-full transform -translate-y-1/2" />

            {mode === "single" ? (
              /* Single Handle */
              <div
                className="absolute top-1/2 transform -translate-y-1/2 -translate-x-1/2 z-20"
                style={{ left: `${(singlePosition / totalHours) * 100}%` }}
              >
                <div
                  className="w-5 h-5 bg-white border-2 border-gray-800 rounded-full cursor-grab active:cursor-grabbing shadow-sm transition-transform duration-200 hover:scale-110"
                  onMouseDown={(e) => handleMouseDown(e, "single")}
                />
              </div>
            ) : (
              /* Range Handles */
              <>
                {/* Range track highlight */}
                <div
                  className="absolute top-1/2 h-1 bg-blue-600 rounded-full transform -translate-y-1/2"
                  style={{
                    left: `${(rangeStart / totalHours) * 100}%`,
                    width: `${((rangeEnd - rangeStart) / totalHours) * 100}%`,
                  }}
                />

                {/* Start handle */}
                <div
                  className="absolute top-1/2 transform -translate-y-1/2 -translate-x-1/2 z-20"
                  style={{ left: `${(rangeStart / totalHours) * 100}%` }}
                >
                  <div
                    className="w-5 h-5 bg-white border-2 border-blue-600 rounded-full cursor-grab active:cursor-grabbing shadow-sm transition-transform duration-200 hover:scale-110"
                    onMouseDown={(e) => handleMouseDown(e, "start")}
                  />
                </div>

                {/* End handle */}
                <div
                  className="absolute top-1/2 transform -translate-y-1/2 -translate-x-1/2 z-20"
                  style={{ left: `${(rangeEnd / totalHours) * 100}%` }}
                >
                  <div
                    className="w-5 h-5 bg-white border-2 border-blue-600 rounded-full cursor-grab active:cursor-grabbing shadow-sm transition-transform duration-200 hover:scale-110"
                    onMouseDown={(e) => handleMouseDown(e, "end")}
                  />
                </div>
              </>
            )}
          </div>

          {/* Timeline labels */}
          <div className="flex justify-between items-center text-sm text-gray-500">
            <span>-15d</span>
            <span className="font-medium">Today</span>
            <span>+15d</span>
          </div>
        </div>
      </div>
    </div>
  )
}

