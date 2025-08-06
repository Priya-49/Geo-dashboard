// types/polygon.ts
import type { Polygon as LeafletPolygon } from 'leaflet';
import type { PolygonDataResult } from "@/lib/polygon-data-service";

export interface Polygon {
  id: string;
  name: string;
  dataSource: string;
  layer: LeafletPolygon; 
  points: number;
  area: number;
  coordinates: [number, number][];
  centroid: [number, number];
  currentValue: number | null;
  currentColor: string;
  lastProcessedResult: PolygonDataResult | null;
  createdAt: Date;
}
