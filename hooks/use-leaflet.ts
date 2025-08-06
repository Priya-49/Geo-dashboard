//hooks/use-leaflet.ts
"use client"

import { useEffect, useRef, useState } from "react"

export function useLeaflet() {
  const [isLoaded, setIsLoaded] = useState(false)
  const loadingRef = useRef(false)

  useEffect(() => {
    const loadLeaflet = async () => {
      if (loadingRef.current || (window.L && window.L.Control?.Draw)) {
        setIsLoaded(true)
        return
      }

      loadingRef.current = true

      try {
        // Load Leaflet CSS
        if (!document.querySelector('link[href*="leaflet.css"]')) {
          const cssLink = document.createElement("link")
          cssLink.rel = "stylesheet"
          cssLink.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"
          cssLink.integrity = "sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY="
          cssLink.crossOrigin = ""
          document.head.appendChild(cssLink)
        }

        // Load Leaflet.draw CSS
        if (!document.querySelector('link[href*="leaflet.draw.css"]')) {
          const drawCssLink = document.createElement("link")
          drawCssLink.rel = "stylesheet"
          drawCssLink.href = "https://cdnjs.cloudflare.com/ajax/libs/leaflet.draw/1.0.4/leaflet.draw.css"
          drawCssLink.integrity =
            "sha512-gc3xjCmIy673V6MyOAZhIW93xhM9ei1I+gLbmV79c2frd2nQmMazpEN/8pnt5VbSqXjFgROQtHoGFCOL2W2NKQ=="
          drawCssLink.crossOrigin = "anonymous"
          document.head.appendChild(drawCssLink)
        }

        // Load Leaflet JS
        if (!window.L) {
          await new Promise((resolve, reject) => {
            const script = document.createElement("script")
            script.src = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"
            script.integrity = "sha256-20nQCchB9co0qIjJZRGuk2/Z9VM+kNiyxNV1lvTlZBo="
            script.crossOrigin = ""
            script.onload = resolve
            script.onerror = reject
            document.head.appendChild(script)
          })
        }

        // Load Leaflet.draw JS
        if (!window.L.Control?.Draw) {
          await new Promise((resolve, reject) => {
            const drawScript = document.createElement("script")
            drawScript.src = "https://cdnjs.cloudflare.com/ajax/libs/leaflet.draw/1.0.4/leaflet.draw.js"
            drawScript.integrity =
              "sha512-ozq8xQKq6urvuU6jNgkfqAmT7jKN2XumbrX1JiB3TnF7tI48DPI4Gy1GXKD/V3EExgAs1V+pRO7vwtS1LHg0Gw=="
            drawScript.crossOrigin = "anonymous"
            drawScript.onload = resolve
            drawScript.onerror = reject
            document.head.appendChild(drawScript)
          })
        }

        setIsLoaded(true)
      } catch (error) {
        console.error("Failed to load Leaflet and Leaflet.draw:", error)
      } finally {
        loadingRef.current = false
      }
    }

    loadLeaflet()
  }, [])

  return { isLoaded }
}
