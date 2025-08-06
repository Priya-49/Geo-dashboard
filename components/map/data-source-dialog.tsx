"use client"

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import type { DataSource } from "../data-sidebar"

interface DataSourceDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  enabledDataSources: DataSource[]
  onDataSourceSelect: (dataSourceId: string) => void
}

export function DataSourceDialog({
  open,
  onOpenChange,
  enabledDataSources,
  onDataSourceSelect,
}: DataSourceDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="z-[10000] bg-white max-w-md">
        <DialogHeader>
          <DialogTitle>Select Data Source</DialogTitle>
          <DialogDescription>
            Choose which data source to associate with this polygon. The polygon will immediately fetch data and apply
            color rules.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <Select onValueChange={onDataSourceSelect}>
            <SelectTrigger className="w-full h-12">
              <SelectValue placeholder="Select a data source" />
            </SelectTrigger>
            <SelectContent className="z-[10001] bg-white border shadow-lg max-h-60">
              {enabledDataSources.map((source) => (
                <SelectItem key={source.id} value={source.id} className="py-3 px-4 hover:bg-gray-50">
                  <div className="flex items-center gap-3 w-full">
                    <div
                      className="w-4 h-4 rounded-full border border-gray-200 flex-shrink-0"
                      style={{ backgroundColor: source.baseColor }}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-sm text-gray-900 truncate">{source.name}</div>
                      <div className="text-xs text-gray-500 mt-0.5">
                        Field: {source.fields.find((f) => f.id === source.selectedField)?.name} •{" "}
                        {source.thresholdRules.length} rules
                      </div>
                    </div>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </DialogContent>
    </Dialog>
  )
}
