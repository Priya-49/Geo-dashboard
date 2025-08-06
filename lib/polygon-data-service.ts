//lib/polygon-data-service.ts
import { OpenMeteoService } from "./open-meteo"
import type { DataSource, ThresholdRule } from "@/components/data-sidebar"

export interface PolygonDataResult {
  polygonId: string
  value: number | null
  color: string
  fieldName: string
  unit: string
  timestamp: string
  isAverage: boolean
  dataPoints: number
}

export class PolygonDataService {
  /**
   * Core function: Fetch data and apply color rules for a polygon
   */
  static async processPolygonData(
    polygonId: string,
    coordinates: [number, number][],
    dataSource: DataSource,
    startDate: Date,
    endDate: Date,
  ): Promise<PolygonDataResult> {
    try {
      // Step 1: Get polygon location (centroid)
      const centroid = OpenMeteoService.calculateCentroid(coordinates)

      // Step 2: Format dates for API
      const startDateStr = startDate.toISOString().split("T")[0]
      const endDateStr = endDate.toISOString().split("T")[0]

      // Step 3: Fetch weather data (using simulation for demo)
      const weatherData = OpenMeteoService.simulateWeatherData(
        centroid[0],
        centroid[1],
        startDateStr,
        endDateStr,
        dataSource.selectedField,
      )

      // Step 4: Calculate value (single hour or average for range)
      const isRange = Math.abs(endDate.getTime() - startDate.getTime()) > 60 * 60 * 1000 // More than 1 hour
      let value: number | null = null
      let dataPoints = 0

      if (isRange) {
        // Calculate average for time range
        value = OpenMeteoService.getValueForTimeRange(weatherData, dataSource.selectedField, startDate, endDate)
        // Count data points in range
        const times = weatherData.hourly.time.map((t) => new Date(t))
        dataPoints = times.filter((time) => time >= startDate && time <= endDate).length
      } else {
        // Get single hour value
        value = OpenMeteoService.getValueForTimeRange(weatherData, dataSource.selectedField, startDate, endDate)
        dataPoints = 1
      }

      // Step 5: Apply color rules to the value
      const color = this.applyColorRules(value, dataSource)

      // Step 6: Get field information
      const fieldInfo = dataSource.fields.find((f) => f.id === dataSource.selectedField)

      return {
        polygonId,
        value,
        color,
        fieldName: fieldInfo?.name || dataSource.selectedField,
        unit: fieldInfo?.unit || "",
        timestamp: new Date().toISOString(),
        isAverage: isRange,
        dataPoints,
      }
    } catch (error) {
      console.error(`Failed to process polygon data for ${polygonId}:`, error)

      // Return fallback result
      const fieldInfo = dataSource.fields.find((f) => f.id === dataSource.selectedField)
      return {
        polygonId,
        value: null,
        color: dataSource.baseColor,
        fieldName: fieldInfo?.name || dataSource.selectedField,
        unit: fieldInfo?.unit || "",
        timestamp: new Date().toISOString(),
        isAverage: false,
        dataPoints: 0,
      }
    }
  }

  /**
   * Apply threshold rules to determine polygon color
   */
  static applyColorRules(value: number | null, dataSource: DataSource): string {
    if (value === null || value === undefined || isNaN(value)) {
      return dataSource.baseColor
    }

    // Apply threshold rules in order - first match wins
    for (const rule of dataSource.thresholdRules) {
      if (this.evaluateRule(value, rule)) {
        return rule.color
      }
    }

    // No rules matched, return base color
    return dataSource.baseColor
  }

  /**
   * Evaluate a single threshold rule
   */
  private static evaluateRule(value: number, rule: ThresholdRule): boolean {
    switch (rule.operator) {
      case "=":
        return Math.abs(value - rule.value) < 0.01 // Allow for floating point precision
      case "<":
        return value < rule.value
      case ">":
        return value > rule.value
      case "<=":
        return value <= rule.value
      case ">=":
        return value >= rule.value
      default:
        return false
    }
  }

  /**
   * Process multiple polygons in parallel
   */
  static async processMultiplePolygons(
    polygons: Array<{
      id: string
      coordinates: [number, number][]
      dataSource: string
    }>,
    dataSources: DataSource[],
    startDate: Date,
    endDate: Date,
  ): Promise<PolygonDataResult[]> {
    const promises = polygons.map(async (polygon) => {
      const dataSource = dataSources.find((ds) => ds.name === polygon.dataSource && ds.enabled)
      if (!dataSource) {
        // Return default result if data source not found or disabled
        return {
          polygonId: polygon.id,
          value: null,
          color: "#cccccc",
          fieldName: "Unknown",
          unit: "",
          timestamp: new Date().toISOString(),
          isAverage: false,
          dataPoints: 0,
        }
      }

      return this.processPolygonData(polygon.id, polygon.coordinates, dataSource, startDate, endDate)
    })

    return Promise.all(promises)
  }

  /**
   * Get human-readable description of the data processing
   */
  static getProcessingDescription(result: PolygonDataResult): string {
    if (result.value === null) {
      return "No data available for this time period"
    }

    const valueText = `${result.value.toFixed(2)} ${result.unit}`
    const timeText = result.isAverage ? `averaged over ${result.dataPoints} hours` : "for selected hour"

    return `${result.fieldName}: ${valueText} (${timeText})`
  }

  /**
   * Validate if a data source can process the given field
   */
  static canProcessField(dataSource: DataSource, fieldId: string): boolean {
    return dataSource.fields.some((field) => field.id === fieldId)
  }

  /**
   * Get all available fields for enabled data sources
   */
  static getAvailableFields(dataSources: DataSource[]): Array<{ id: string; name: string; unit: string }> {
    const fields: Array<{ id: string; name: string; unit: string }> = []

    dataSources
      .filter((ds) => ds.enabled)
      .forEach((ds) => {
        ds.fields.forEach((field) => {
          if (!fields.some((f) => f.id === field.id)) {
            fields.push({
              id: field.id,
              name: field.name,
              unit: field.unit,
            })
          }
        })
      })

    return fields
  }
}
