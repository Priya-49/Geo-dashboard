//lib/open-meteo.ts
export interface WeatherData {
  latitude: number
  longitude: number
  hourly: {
    time: string[]
    temperature_2m: number[]
    relative_humidity_2m: number[]
    precipitation: number[]
    wind_speed_10m: number[]
    surface_pressure: number[]
  }
}

export interface PolygonWeatherData {
  polygonId: string
  averageValue: number
  dataField: string
  timestamp: string
  coordinates: [number, number]
}

export class OpenMeteoService {
  private static readonly BASE_URL = "https://archive-api.open-meteo.com/v1/archive"

  static async fetchWeatherData(
    latitude: number,
    longitude: number,
    startDate: string,
    endDate: string,
    fields: string[] = ["temperature_2m"],
  ): Promise<WeatherData | null> {
    try {
      const params = new URLSearchParams({
        latitude: latitude.toString(),
        longitude: longitude.toString(),
        start_date: startDate,
        end_date: endDate,
        hourly: fields.join(","),
        timezone: "auto",
      })

      const response = await fetch(`${this.BASE_URL}?${params}`)

      if (!response.ok) {
        throw new Error(`Weather API error: ${response.status}`)
      }

      return await response.json()
    } catch (error) {
      console.error("Failed to fetch weather data:", error)
      return null
    }
  }

  static async fetchPolygonWeatherData(
    coordinates: [number, number][],
    startDate: string,
    endDate: string,
    field = "temperature_2m",
  ): Promise<{ centroid: [number, number]; data: WeatherData | null }> {
    // Calculate polygon centroid
    const centroid = this.calculateCentroid(coordinates)

    // Fetch weather data for centroid
    const data = await this.fetchWeatherData(centroid[0], centroid[1], startDate, endDate, [field])

    return { centroid, data }
  }

  static calculateCentroid(coordinates: [number, number][]): [number, number] {
    const n = coordinates.length
    let lat = 0
    let lng = 0

    for (const [latVal, lngVal] of coordinates) {
      lat += latVal
      lng += lngVal
    }

    return [lat / n, lng / n]
  }

  static calculateBoundingBox(coordinates: [number, number][]): {
    north: number
    south: number
    east: number
    west: number
  } {
    let north = -90,
      south = 90,
      east = -180,
      west = 180

    for (const [lat, lng] of coordinates) {
      north = Math.max(north, lat)
      south = Math.min(south, lat)
      east = Math.max(east, lng)
      west = Math.min(west, lng)
    }

    return { north, south, east, west }
  }

  static getValueForTimeRange(data: WeatherData, field: string, startTime: Date, endTime: Date): number | null {
    if (!data.hourly || !data.hourly[field as keyof typeof data.hourly]) {
      return null
    }

    const times = data.hourly.time.map((t) => new Date(t))
    const values = data.hourly[field as keyof typeof data.hourly] as number[]

    // Filter values within time range
    const relevantValues: number[] = []

    for (let i = 0; i < times.length; i++) {
      const time = times[i]
      if (time >= startTime && time <= endTime) {
        const value = values[i]
        if (value !== null && value !== undefined && !isNaN(value)) {
          relevantValues.push(value)
        }
      }
    }

    if (relevantValues.length === 0) {
      return null
    }

    // Return average for time range
    return relevantValues.reduce((sum, val) => sum + val, 0) / relevantValues.length
  }

  // Simulate data for development/demo purposes
  static simulateWeatherData(
    latitude: number,
    longitude: number,
    startDate: string,
    endDate: string,
    field = "temperature_2m",
  ): WeatherData {
    const start = new Date(startDate)
    const end = new Date(endDate)
    const hours = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60))

    const times: string[] = []
    const values: number[] = []

    for (let i = 0; i < hours; i++) {
      const time = new Date(start.getTime() + i * 60 * 60 * 1000)
      times.push(time.toISOString())

      // Generate realistic values based on field type
      let value: number
      switch (field) {
        case "temperature_2m":
          value = 15 + Math.sin((i / 24) * 2 * Math.PI) * 10 + Math.random() * 5
          break
        case "relative_humidity_2m":
          value = 50 + Math.random() * 40
          break
        case "precipitation":
          value = Math.random() < 0.1 ? Math.random() * 5 : 0
          break
        case "wind_speed_10m":
          value = 5 + Math.random() * 15
          break
        case "surface_pressure":
          value = 1013 + Math.random() * 20 - 10
          break
        default:
          value = Math.random() * 100
      }
      values.push(Math.round(value * 100) / 100)
    }

    return {
      latitude,
      longitude,
      hourly: {
        time: times,
        temperature_2m: field === "temperature_2m" ? values : [],
        relative_humidity_2m: field === "relative_humidity_2m" ? values : [],
        precipitation: field === "precipitation" ? values : [],
        wind_speed_10m: field === "wind_speed_10m" ? values : [],
        surface_pressure: field === "surface_pressure" ? values : [],
      },
    }
  }
}
