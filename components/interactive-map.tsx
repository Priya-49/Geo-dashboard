// interactive-map.tsx
"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PolygonDataService } from "@/lib/polygon-data-service";
import type { DataSource } from "./data-sidebar";
import { useLeaflet } from "@/hooks/use-leaflet";
import { usePolygonDrawing } from "@/hooks/use-polygon-drawing";
import { MapHeader } from "./map/map-header";
import { MapStatus } from "./map/map-status";
import { DataSourceDialog } from "./map/data-source-dialog";
import { PolygonListDialog } from "./map/polygon-list-dialog";
import { Pencil, Square, X } from "lucide-react";
import type { Polygon } from "@/types/polygon";
import type { Map, LatLngExpression, Layer, Polygon as LeafletPolygon } from 'leaflet';

interface PendingPolygonData {
  layer: Layer;
  points: number;
  area: number;
  coordinates: [number, number][];
  centroid: [number, number];
}

interface InteractiveMapProps {
  className?: string;
  dataSources?: DataSource[];
  selectedTimeRange?: { start: Date; end: Date };
  onPolygonUpdate?: (polygons: Polygon[]) => void;
}

export function InteractiveMap({
  className,
  dataSources = [],
  selectedTimeRange,
  onPolygonUpdate,
}: InteractiveMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<Map | null>(null);
  const [isMapReady, setIsMapReady] = useState(false);
  const [polygons, setPolygons] = useState<Polygon[]>([]);
  const [showDataSourceDialog, setShowDataSourceDialog] = useState(false);
  const [pendingPolygon, setPendingPolygon] = useState<PendingPolygonData | null>(null);
  const [showPolygonList, setShowPolygonList] = useState(false);
  const [isUpdatingPolygons, setIsUpdatingPolygons] = useState(false);
  const [processingStatus, setProcessingStatus] = useState<string>("");

  const pendingPolygonRef = useRef<PendingPolygonData | null>(null);

  const defaultCenter: LatLngExpression = [37.7749, -122.4194];
  const defaultZoom = 14;

  const enabledDataSources = dataSources.filter((ds) => ds.enabled);

  const { isLoaded: isLeafletLoaded } = useLeaflet();
  const {
    isDrawing,
    drawingPoints,
    canFinish,
    startDrawing,
    finishDrawing,
    cancelDrawing,
    registerLayer,
    unregisterLayer,
  } = usePolygonDrawing(mapInstanceRef.current);

  const updatePolygonColor = async (polygon: Polygon): Promise<Polygon> => {
    if (!selectedTimeRange) {
      return polygon;
    }

    const dataSource = dataSources.find((ds) => ds.name === polygon.dataSource);
    if (!dataSource || !dataSource.enabled) {
      polygon.layer.setStyle({
        color: "#cccccc",
        fillColor: "#cccccc",
        fillOpacity: 0.2,
        weight: 2,
      });
      return { ...polygon, currentColor: "#cccccc", currentValue: null, lastProcessedResult: null };
    }

    try {
      const result = await PolygonDataService.processPolygonData(
        polygon.id,
        polygon.coordinates,
        dataSource,
        selectedTimeRange.start,
        selectedTimeRange.end,
      );

      polygon.layer.setStyle({
        color: result.color,
        fillColor: result.color,
        fillOpacity: 0.3,
        weight: 3,
        opacity: 0.8,
      });

      return {
        ...polygon,
        currentValue: result.value,
        currentColor: result.color,
        lastProcessedResult: result,
      };
    } catch {
      polygon.layer.setStyle({
        color: "#ff0000",
        fillColor: "#ff0000",
        fillOpacity: 0.2,
        weight: 2,
      });
      return { ...polygon, currentColor: "#ff0000", currentValue: null, lastProcessedResult: null };
    }
  };

  // This useCallback is no longer needed since the logic is in the effect now
  // const updateAllPolygonColors = useCallback(async () => { ... });

  useEffect(() => {
    if (isLeafletLoaded && mapRef.current && !mapInstanceRef.current) {
      console.log("🗺️ Initializing map...");
      const map = window.L.map(mapRef.current, {
        center: defaultCenter,
        zoom: defaultZoom,
        zoomControl: false,
        scrollWheelZoom: false,
        doubleClickZoom: false,
        touchZoom: false,
        boxZoom: false,
        keyboard: false,
        dragging: true,
      });

      window.L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "© OpenStreetMap contributors",
        maxZoom: 18,
      }).addTo(map);

      mapInstanceRef.current = map;
      setIsMapReady(true);

      polygons.forEach((polygon) => {
        if (polygon.layer && mapInstanceRef.current) {
          if (!mapInstanceRef.current.hasLayer(polygon.layer)) {
            polygon.layer.addTo(mapInstanceRef.current);
          }
          registerLayer(polygon.layer);
        }
      });
    }

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [isLeafletLoaded, polygons, registerLayer]);

  // The critical change is here: The logic is now entirely within the effect
  useEffect(() => {
    if (selectedTimeRange && polygons.length > 0) {
      const updatePolygons = async () => {
        setIsUpdatingPolygons(true);
        setProcessingStatus(`Processing ${polygons.length} polygons...`);

        try {
          const updatedPolygons = await Promise.all(
            polygons.map(async (polygon, index) => {
              setProcessingStatus(`Processing polygon ${index + 1}/${polygons.length}...`);
              return await updatePolygonColor(polygon);
            })
          );
          
          setPolygons(updatedPolygons);
          onPolygonUpdate?.(updatedPolygons);

          setProcessingStatus("All polygons updated successfully!");
          setTimeout(() => setProcessingStatus(""), 2000);
        } catch {
          setProcessingStatus("Error updating polygons");
          setTimeout(() => setProcessingStatus(""), 3000);
        } finally {
          setIsUpdatingPolygons(false);
        }
      };

      const timeoutId = setTimeout(() => {
        updatePolygons();
      }, 100);

      return () => clearTimeout(timeoutId);
    }
  }, [
    selectedTimeRange?.start?.getTime(),
    selectedTimeRange?.end?.getTime(),
    dataSources
      .map((ds) => `${ds.id}-${ds.enabled}-${ds.selectedField}-${JSON.stringify(ds.thresholdRules)}`)
      .join(","),
    // Removed the dependency on updateAllPolygonColors and polygons state
    // Now this effect only runs on changes to time range or data sources
  ]);

  const handleStartDrawing = () => {
    startDrawing((pendingPolygonData: PendingPolygonData) => {
      const typedPendingPolygonData = {
        ...pendingPolygonData,
        layer: pendingPolygonData.layer as LeafletPolygon,
      };

      setPendingPolygon(typedPendingPolygonData);
      pendingPolygonRef.current = typedPendingPolygonData;

      if (enabledDataSources.length > 1) {
        setShowDataSourceDialog(true);
      } else if (enabledDataSources.length === 1) {
        setTimeout(() => {
          handleDataSourceSelection(enabledDataSources[0].id);
        }, 0);
      } else {
        alert("No data sources enabled! Please enable at least one data source in the sidebar.");
        if (typedPendingPolygonData?.layer) {
          unregisterLayer(typedPendingPolygonData.layer);
        }
        setPendingPolygon(null);
        pendingPolygonRef.current = null;
      }
    });
  };

  const handleDataSourceSelection = async (dataSourceId: string) => {
    const currentPendingPolygon = pendingPolygonRef.current || pendingPolygon;

    if (!currentPendingPolygon) {
      return;
    }

    const dataSource = enabledDataSources.find((ds) => ds.id === dataSourceId);
    if (!dataSource) {
      return;
    }

    const newPolygon: Polygon = {
      id: `polygon-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      name: `${dataSource.name} Region ${polygons.length + 1}`,
      dataSource: dataSource.name,
      layer: currentPendingPolygon.layer as LeafletPolygon,
      points: currentPendingPolygon.points,
      area: currentPendingPolygon.area,
      coordinates: currentPendingPolygon.coordinates,
      centroid: currentPendingPolygon.centroid,
      currentValue: null,
      currentColor: dataSource.baseColor,
      lastProcessedResult: null,
      createdAt: new Date(),
    };

    newPolygon.layer.setStyle({
      color: dataSource.baseColor,
      fillColor: dataSource.baseColor,
      fillOpacity: 0.3,
      weight: 3,
      opacity: 0.8,
    });

    let updatedPolygon = newPolygon;
    if (selectedTimeRange) {
      setProcessingStatus(`Processing new polygon: ${newPolygon.name}...`);
      updatedPolygon = await updatePolygonColor(newPolygon);
      setProcessingStatus("Polygon created and colored successfully!");
      setTimeout(() => setProcessingStatus(""), 2000);
    }
    
    // Add the new polygon to the list using the functional update
    // to prevent the infinite loop
    setPolygons(prevPolygons => {
        const newPolygonsList = [...prevPolygons, updatedPolygon];
        onPolygonUpdate?.(newPolygonsList);
        return newPolygonsList;
    });

    setPendingPolygon(null);
    pendingPolygonRef.current = null;
    setShowDataSourceDialog(false);
  };

  const deletePolygon = (polygonId: string) => {
    const polygon = polygons.find((p) => p.id === polygonId);
    if (polygon) {
      unregisterLayer(polygon.layer);
      const updatedPolygons = polygons.filter((p) => p.id !== polygonId);
      setPolygons(updatedPolygons);
      onPolygonUpdate?.(updatedPolygons);
    }
  };

  const handleLocatePolygon = (polygon: Polygon) => {
    if (mapInstanceRef.current) {
      mapInstanceRef.current.setView(polygon.centroid, defaultZoom);
    }
  };

  return (
    <Card className={`p-6 ${className}`}>
      <div className="space-y-4">
        <MapHeader
          isUpdatingPolygons={isUpdatingPolygons}
          polygonsCount={polygons.length}
          onViewAllClick={() => {
            setShowPolygonList(true);
          }}
        />

        <MapStatus
          processingStatus={processingStatus}
          isDrawing={isDrawing}
          drawingPoints={drawingPoints}
          onCancelDrawing={cancelDrawing}
          enabledDataSourcesCount={enabledDataSources.length}
        />

        <div className="relative">
          <div
            ref={mapRef}
            className="w-full h-96 rounded-lg border border-border bg-muted"
            style={{ minHeight: "400px" }}
          />

          {!isMapReady && (
            <div className="absolute inset-0 flex items-center justify-center bg-muted rounded-lg">
              <div className="text-center space-y-2">
                <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
                <p className="text-sm text-muted-foreground">Loading map...</p>
              </div>
            </div>
          )}
        </div>

        <div className="flex gap-4 p-4 bg-gray-50 rounded-lg border px-4 items-center justify-start">
          <Button
            onClick={handleStartDrawing}
            disabled={!isMapReady || isDrawing || enabledDataSources.length === 0}
            className="gap-2 px-6"
            variant={isDrawing ? "secondary" : "default"}
          >
            <Pencil className="w-4 h-4" />
            {isDrawing ? "Drawing..." : "Start Drawing"}
          </Button>

          <Button
            onClick={finishDrawing}
            disabled={!isDrawing || !canFinish}
            className="gap-2 px-6 bg-transparent"
            variant="outline"
          >
            <Square className="w-4 h-4" />
            Finish Polygon
          </Button>

          {isDrawing && (
            <Button onClick={cancelDrawing} className="gap-2 px-4 bg-black text-white hover:bg-gray-800" size="sm">
              <X className="w-4 h-4" />
              Cancel
            </Button>
          )}
        </div>

        {enabledDataSources.length === 0 && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <p className="text-yellow-800 text-sm">
              No data sources enabled. Enable at least one data source in the sidebar to draw polygons.
            </p>
          </div>
        )}
      </div>

      <DataSourceDialog
        open={showDataSourceDialog}
        onOpenChange={setShowDataSourceDialog}
        enabledDataSources={enabledDataSources}
        onDataSourceSelect={handleDataSourceSelection}
      />

      <PolygonListDialog
        open={showPolygonList}
        onOpenChange={(open) => {
          console.log(`📋 Polygon list dialog ${open ? "opened" : "closed"}`);
          setShowPolygonList(open);
        }}
        polygons={polygons}
        onLocatePolygon={handleLocatePolygon}
        onDeletePolygon={deletePolygon}
      />
    </Card>
  );
}