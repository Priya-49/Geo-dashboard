"use client"

import { useRef, useState, useCallback } from "react"
import { OpenMeteoService } from "@/lib/open-meteo"

interface PendingPolygon {
  layer: any
  points: number
  area: number
  coordinates: [number, number][]
  centroid: [number, number]
}

export function usePolygonDrawing(mapInstance: any) {
  const [isDrawing, setIsDrawing] = useState(false)
  const [drawingPoints, setDrawingPoints] = useState(0)
  const [canFinish, setCanFinish] = useState(false)
  const drawControlRef = useRef<any>(null)
  const drawnItemsRef = useRef<any>(null)
  const activeDrawerRef = useRef<any>(null)
  // Track all drawn layers for better cleanup
  const allDrawnLayersRef = useRef<Set<any>>(new Set())

  const calculatePolygonArea = useCallback((coordinates: number[][]) => {
    let area = 0
    const n = coordinates.length

    for (let i = 0; i < n; i++) {
      const j = (i + 1) % n
      area += coordinates[i][0] * coordinates[j][1]
      area -= coordinates[j][0] * coordinates[i][1]
    }

    return (Math.abs(area) / 2) * 111000 * 111000
  }, [])

  const initializeDrawControl = useCallback(
    (onComplete: (polygon: PendingPolygon) => void) => {
      if (!mapInstance || !window.L?.Control?.Draw) return

      console.log("🎨 Initializing draw control...")

      // Create a feature group to store drawn items if it doesn't exist
      if (!drawnItemsRef.current) {
        drawnItemsRef.current = new window.L.FeatureGroup()
        mapInstance.addLayer(drawnItemsRef.current)
        console.log("📁 Created new FeatureGroup for drawn items")
      }

      // Remove existing event handlers to prevent duplicates
      mapInstance.off(window.L.Draw.Event.DRAWSTART)
      mapInstance.off(window.L.Draw.Event.DRAWVERTEX)
      mapInstance.off(window.L.Draw.Event.DRAWSTOP)
      mapInstance.off(window.L.Draw.Event.CREATED)

      // Handle draw events
      mapInstance.on(window.L.Draw.Event.DRAWSTART, () => {
        console.log("🖊️ Drawing started")
        setIsDrawing(true)
        setDrawingPoints(0)
        setCanFinish(false)
      })

      mapInstance.on(window.L.Draw.Event.DRAWVERTEX, (e: any) => {
        const pointCount = e.layers.getLayers().length
        console.log(`📍 Drawing vertex added, total points: ${pointCount}`)
        setDrawingPoints(pointCount)
        setCanFinish(pointCount >= 3)
      })

      mapInstance.on(window.L.Draw.Event.DRAWSTOP, () => {
        console.log("🛑 Drawing stopped")
        setIsDrawing(false)
        setDrawingPoints(0)
        setCanFinish(false)
        activeDrawerRef.current = null
      })

      mapInstance.on(window.L.Draw.Event.CREATED, (e: any) => {
        console.log("✅ Polygon created!")
        const layer = e.layer
        const coordinates = layer.getLatLngs()[0].map((latlng: any) => [latlng.lat, latlng.lng])

        console.log(`📐 Polygon coordinates:`, coordinates)

        const area = calculatePolygonArea(coordinates)
        const centroid = OpenMeteoService.calculateCentroid(coordinates)

        console.log(`📏 Calculated area: ${area} m²`)
        console.log(`🎯 Calculated centroid:`, centroid)

        // Add to tracking systems
        drawnItemsRef.current.addLayer(layer)
        allDrawnLayersRef.current.add(layer)
        console.log(
          `🗺️ Layer added to FeatureGroup and tracking set. Total tracked layers: ${allDrawnLayersRef.current.size}`,
        )

        const pendingPolygon: PendingPolygon = {
          layer: layer,
          points: coordinates.length,
          area: area,
          coordinates: coordinates,
          centroid: centroid,
        }

        setIsDrawing(false)
        setDrawingPoints(0)
        setCanFinish(false)
        activeDrawerRef.current = null

        console.log("🎁 Calling onComplete with pending polygon:", pendingPolygon)
        onComplete(pendingPolygon)
      })
    },
    [mapInstance, calculatePolygonArea],
  )

  const startDrawing = useCallback(
    (onComplete: (polygon: PendingPolygon) => void) => {
      if (!mapInstance || isDrawing) {
        console.log("❌ Cannot start drawing - map not ready or already drawing")
        return
      }

      console.log("🚀 Starting polygon drawing...")
      initializeDrawControl(onComplete)

      // Create and start polygon drawing
      const polygonDrawer = new window.L.Draw.Polygon(mapInstance, {
        allowIntersection: false,
        drawError: {
          color: "#e1e100",
          message: "<strong>Error:</strong> Shape edges cannot cross!",
        },
        shapeOptions: {
          color: "#3b82f6",
          fillColor: "#3b82f6",
          fillOpacity: 0.25,
          weight: 3,
          opacity: 0.8,
        },
        showLength: true,
        showArea: true,
        metric: true,
        feet: false,
        nautic: false,
      })

      activeDrawerRef.current = polygonDrawer
      polygonDrawer.enable()
      console.log("✏️ Polygon drawer enabled")
    },
    [mapInstance, isDrawing, initializeDrawControl],
  )

  const finishDrawing = useCallback(() => {
    console.log("🏁 Attempting to finish drawing...")
    if (activeDrawerRef.current && canFinish) {
      console.log("✅ Completing shape...")
      activeDrawerRef.current.completeShape()
    } else {
      console.log("❌ Cannot finish - no active drawer or not enough points")
    }
  }, [canFinish])

  const cancelDrawing = useCallback(() => {
    console.log("❌ Cancelling drawing...")
    if (activeDrawerRef.current) {
      activeDrawerRef.current.disable()
    }
    if (mapInstance && isDrawing) {
      mapInstance.fire(window.L.Draw.Event.DRAWSTOP)
      setIsDrawing(false)
      setDrawingPoints(0)
      setCanFinish(false)
      activeDrawerRef.current = null
    }
  }, [mapInstance, isDrawing])

  // New function to clear all drawn layers (including orphaned ones)
  const clearAllDrawnLayers = useCallback(() => {
    console.log(`🧹 Clearing all drawn layers. Tracked layers: ${allDrawnLayersRef.current.size}`)

    // Clear from FeatureGroup
    if (drawnItemsRef.current) {
      drawnItemsRef.current.clearLayers()
      console.log("🗑️ Cleared FeatureGroup layers")
    }

    // Remove all tracked layers from map
    allDrawnLayersRef.current.forEach((layer) => {
      try {
        if (mapInstance && mapInstance.hasLayer(layer)) {
          mapInstance.removeLayer(layer)
          console.log("🗑️ Removed tracked layer from map")
        }
      } catch (error) {
        console.warn("⚠️ Error removing layer:", error)
      }
    })

    // Clear the tracking set
    allDrawnLayersRef.current.clear()
    console.log("✅ All drawn layers cleared and tracking reset")
  }, [mapInstance])

  // Function to register a layer (for layers created outside the drawing system)
  const registerLayer = useCallback((layer: any) => {
    if (drawnItemsRef.current) {
      drawnItemsRef.current.addLayer(layer)
    }
    allDrawnLayersRef.current.add(layer)
    console.log(`📝 Registered layer. Total tracked: ${allDrawnLayersRef.current.size}`)
  }, [])

  // Function to unregister a layer
  const unregisterLayer = useCallback(
    (layer: any) => {
      if (drawnItemsRef.current && drawnItemsRef.current.hasLayer(layer)) {
        drawnItemsRef.current.removeLayer(layer)
      }
      allDrawnLayersRef.current.delete(layer)
      if (mapInstance && mapInstance.hasLayer(layer)) {
        mapInstance.removeLayer(layer)
      }
      console.log(`🗑️ Unregistered layer. Total tracked: ${allDrawnLayersRef.current.size}`)
    },
    [mapInstance],
  )

  return {
    isDrawing,
    drawingPoints,
    canFinish,
    startDrawing,
    finishDrawing,
    cancelDrawing,
    clearAllDrawnLayers,
    registerLayer,
    unregisterLayer,
    getTotalTrackedLayers: () => allDrawnLayersRef.current.size,
  }
}

