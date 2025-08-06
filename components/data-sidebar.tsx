// data-sidebar.tsx
"use client"

import { useState, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { GripVertical, Database } from "lucide-react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"

export interface DataSource {
  id: string
  name: string
  enabled: boolean
  required: boolean
  baseColor: string
  selectedField: string
  fields: DataField[]
  thresholdRules: ThresholdRule[]
}

export interface DataField {
  id: string
  name: string
  unit: string
  description: string
}

export interface ThresholdRule {
  id: string
  color: string
  operator: "=" | "<" | ">" | "<=" | ">="
  value: number
  label: string
}

interface DataSidebarProps {
  className?: string
  onDataSourceChange?: (dataSources: DataSource[]) => void
}

const PREDEFINED_COLORS = [
  "#ef4444",
  "#f97316",
  "#f59e0b",
  "#eab308",
  "#84cc16",
  "#22c55e",
  "#10b981",
  "#14b8a6",
  "#06b6d4",
  "#0ea5e9",
  "#3b82f6",
  "#6366f1",
  "#8b5cf6",
  "#a855f7",
  "#d946ef",
  "#ec4899",
  "#f43f5e",
]

const OPERATORS = [
  { value: "=", label: "=" },
  { value: "<", label: "<" },
  { value: ">", label: ">" },
  { value: "<=", label: "≤" },
  { value: ">=", label: "≥" },
]

export function DataSidebar({ className, onDataSourceChange }: DataSidebarProps) {
  const [dataSources, setDataSources] = useState<DataSource[]>([
    {
      id: "open-meteo",
      name: "Open-Meteo Weather",
      enabled: true,
      required: true,
      baseColor: "#3b82f6",
      selectedField: "temperature_2m",
      fields: [
        { id: "temperature_2m", name: "Temperature", unit: "°C", description: "2m above ground temperature" },
        { id: "relative_humidity_2m", name: "Humidity", unit: "%", description: "Relative humidity at 2m" },
        { id: "precipitation", name: "Precipitation", unit: "mm", description: "Total precipitation" },
        { id: "wind_speed_10m", name: "Wind Speed", unit: "m/s", description: "Wind speed at 10m height" },
        { id: "surface_pressure", name: "Pressure", unit: "hPa", description: "Surface air pressure" },
      ],
      thresholdRules: [
        { id: "1", color: "#3b82f6", operator: "<", value: 10, label: "Cold" },
        { id: "2", color: "#f59e0b", operator: "<", value: 25, label: "Mild" },
        { id: "3", color: "#ef4444", operator: ">=", value: 25, label: "Hot" },
      ],
    },
    {
      id: "traffic",
      name: "Traffic Data",
      enabled: false,
      required: false,
      baseColor: "#ef4444",
      selectedField: "congestion_level",
      fields: [
        { id: "congestion_level", name: "Congestion Level", unit: "%", description: "Traffic congestion percentage" },
        { id: "average_speed", name: "Average Speed", unit: "km/h", description: "Average vehicle speed" },
        { id: "vehicle_count", name: "Vehicle Count", unit: "vehicles/h", description: "Vehicles per hour" },
      ],
      thresholdRules: [
        { id: "1", color: "#22c55e", operator: "<", value: 30, label: "Light" },
        { id: "2", color: "#f59e0b", operator: "<", value: 70, label: "Moderate" },
        { id: "3", color: "#ef4444", operator: ">=", value: 70, label: "Heavy" },
      ],
    },
    {
      id: "environmental",
      name: "Environmental Sensors",
      enabled: false,
      required: false,
      baseColor: "#10b981",
      selectedField: "air_quality_index",
      fields: [
        { id: "air_quality_index", name: "Air Quality Index", unit: "AQI", description: "Air quality measurement" },
        { id: "noise_level", name: "Noise Level", unit: "dB", description: "Environmental noise level" },
        { id: "pm25", name: "PM2.5", unit: "μg/m³", description: "Fine particulate matter" },
      ],
      thresholdRules: [
        { id: "1", color: "#22c55e", operator: "<", value: 50, label: "Good" },
        { id: "2", color: "#f59e0b", operator: "<", value: 100, label: "Moderate" },
        { id: "3", color: "#ef4444", operator: ">=", value: 100, label: "Poor" },
      ],
    },
  ])

  const [colorPickerDialog, setColorPickerDialog] = useState<{
    open: boolean
    dataSourceId: string
    ruleId: string
    currentColor: string
  } | null>(null)

  useEffect(() => {
    onDataSourceChange?.(dataSources)
  }, [dataSources, onDataSourceChange])

  const toggleDataSource = (id: string) => {
    setDataSources((prev) => prev.map((ds) => (ds.id === id ? { ...ds, enabled: !ds.enabled } : ds)))
  }

  const updateDataSourceField = (id: string, fieldId: string) => {
    setDataSources((prev) => prev.map((ds) => (ds.id === id ? { ...ds, selectedField: fieldId } : ds)))
  }

  const updateThresholdRule = (dataSourceId: string, ruleId: string, updates: Partial<ThresholdRule>) => {
    setDataSources((prev) =>
      prev.map((ds) =>
        ds.id === dataSourceId
          ? {
              ...ds,
              thresholdRules: ds.thresholdRules.map((rule) => (rule.id === ruleId ? { ...rule, ...updates } : rule)),
            }
          : ds,
      ),
    )
  }

  const enabledSources = dataSources.filter((ds) => ds.enabled)

  return (
    <Card className={`p-6 ${className}`}>
      <div className="space-y-6">
        {/* Header */}
        <div className="space-y-2">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Database className="w-5 h-5" />
            Data Sources & Thresholds
          </h2>
          <p className="text-sm text-muted-foreground">
            Configure data sources and color-coding rules for polygon visualization
          </p>
          {enabledSources.length > 0 && (
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">Active:</span>
              {enabledSources.map((ds) => (
                <Badge key={ds.id} variant="secondary" className="text-xs">
                  {ds.name}
                </Badge>
              ))}
            </div>
          )}
        </div>

        {/* Data Sources */}
        <div className="space-y-4">
          {dataSources.map((dataSource) => (
            <div key={dataSource.id} className="border rounded-lg p-4 space-y-4">
              {/* Data Source Header */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Switch
                    checked={dataSource.enabled}
                    onCheckedChange={() => toggleDataSource(dataSource.id)}
                    disabled={dataSource.required}
                  />
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{dataSource.name}</span>
                      {dataSource.required && (
                        <Badge variant="destructive" className="text-xs">
                          Required
                        </Badge>
                      )}
                    </div>
                    
                  </div>
                </div>
              </div>

              {dataSource.enabled && (
                <>
                  {/* Field Selection */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Data Field</label>
                    <Select
                      value={dataSource.selectedField}
                      onValueChange={(value) => updateDataSourceField(dataSource.id, value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {dataSource.fields.map((field) => (
                          <SelectItem key={field.id} value={field.id}>
                            <div>
                              <div className="font-medium">
                                {field.name} ({field.unit})
                              </div>
                              <div className="text-xs text-muted-foreground">{field.description}</div>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Threshold Rules */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <label className="text-sm font-medium">Threshold Rules</label>
                      
                    </div>

                    <div className="space-y-2">
                      {dataSource.thresholdRules.map((rule) => (
                        <div key={rule.id} className="flex items-center gap-2 p-2 border rounded">
                          <GripVertical className="w-4 h-4 text-muted-foreground cursor-move" />

                          <div
                            className="w-6 h-6 rounded-full border cursor-pointer transition-transform duration-200 hover:scale-110"
                            style={{ backgroundColor: rule.color }}
                            onClick={() => {
                              setColorPickerDialog({
                                open: true,
                                dataSourceId: dataSource.id,
                                ruleId: rule.id,
                                currentColor: rule.color,
                              })
                            }}
                          />

                          <Select
                            value={rule.operator}
                            onValueChange={(value) =>
                              updateThresholdRule(dataSource.id, rule.id, {
                                operator: value as ThresholdRule["operator"],
                              })
                            }
                          >
                            <SelectTrigger className="w-16">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {OPERATORS.map((op) => (
                                <SelectItem key={op.value} value={op.value}>
                                  {op.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>

                          <Input
                            type="number"
                            value={rule.value}
                            onChange={(e) =>
                              updateThresholdRule(dataSource.id, rule.id, {
                                value: Number.parseFloat(e.target.value) || 0,
                              })
                            }
                            className="w-20"
                          />

                          
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </div>
          ))}
        </div>
      </div>
      {/* Color Picker Dialog */}
      {colorPickerDialog && (
        <Dialog open={colorPickerDialog.open} onOpenChange={(open) => !open && setColorPickerDialog(null)}>
          <DialogContent className="z-[9999] bg-white">
            <DialogHeader>
              <DialogTitle>Choose Color</DialogTitle>
              <DialogDescription>Select a color for this threshold rule</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-6 gap-3">
                {PREDEFINED_COLORS.map((color) => (
                  <button
                    key={color}
                    className={`w-12 h-12 rounded-lg border-2 transition-transform duration-200 hover:scale-110 ${
                      colorPickerDialog.currentColor === color
                        ? "border-gray-800 ring-2 ring-blue-500"
                        : "border-gray-300"
                    }`}
                    style={{ backgroundColor: color }}
                    onClick={() => {
                      updateThresholdRule(colorPickerDialog.dataSourceId, colorPickerDialog.ruleId, {
                        color: color,
                      })
                      setColorPickerDialog(null)
                    }}
                  />
                ))}
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Custom Color</label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={colorPickerDialog.currentColor}
                    onChange={(e) => {
                      updateThresholdRule(colorPickerDialog.dataSourceId, colorPickerDialog.ruleId, {
                        color: e.target.value,
                      })
                      setColorPickerDialog({
                        ...colorPickerDialog,
                        currentColor: e.target.value,
                      })
                    }}
                    className="w-12 h-8 rounded border cursor-pointer"
                  />
                  <span className="text-sm text-muted-foreground font-mono">{colorPickerDialog.currentColor}</span>
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </Card>
  )
}
