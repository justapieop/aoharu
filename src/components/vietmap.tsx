"use client";

import { useState } from "react";
import Map, { Marker, NavigationControl } from "react-map-gl/maplibre";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";

export default function VietmapComponent({ pins = [] }: { pins?: any[] }) {
  // Use a fallback key or empty string if not defined yet
  const apiKey = process.env.NEXT_PUBLIC_VIETMAP_API_KEY || "";
  
  // Use Vietmap's official Raster style JSON to avoid decoding and vector errors
  const mapStyle = `https://maps.vietmap.vn/api/maps/raster/styles.json?apikey=${apiKey}`;
  const [viewState, setViewState] = useState({
    longitude: 105.8521,
    latitude: 21.0227,
    zoom: 13
  });

  if (!apiKey) {
    return (
      <div className="h-full w-full rounded-2xl border border-default-200 shadow-sm flex flex-col items-center justify-center bg-default-100 text-default-500">
        <span className="text-4xl mb-2">🗺️</span>
        <p className="font-bold">Bản đồ chưa được cấu hình</p>
        <p className="text-sm">Vui lòng thêm NEXT_PUBLIC_VIETMAP_API_KEY vào file .env</p>
      </div>
    );
  }

  return (
    <div className="h-full w-full rounded-2xl overflow-hidden border border-default-200 shadow-sm relative">
      <Map
        {...viewState}
        onMove={(evt: any) => setViewState(evt.viewState)}
        mapLib={maplibregl as any}
        mapStyle={mapStyle}
        style={{ width: "100%", height: "100%" }}
      >
        <NavigationControl position="top-right" />
        
        {pins.map((pin) => {
          const pinType = Array.isArray(pin.pin_types) ? pin.pin_types[0] : pin.pin_types;
          const icon = pinType?.icon || "📍";
          const name = pin.name || "Khu vực xanh";
          let lat = pin.lat;
          let long = pin.long;
          
          // Auto-correct if the user accidentally swapped lat and long in the database
          if (Math.abs(lat) > 90 && Math.abs(long) <= 90) {
            lat = pin.long;
            long = pin.lat;
          }

          // Safety check to prevent crashing the whole map
          if (Math.abs(lat) > 90 || Math.abs(long) > 180) return null;

          return (
            <Marker key={pin.id} longitude={long} latitude={lat} anchor="bottom">
              <div className="flex flex-col items-center cursor-pointer transform hover:scale-110 transition-transform">
                <span className="text-3xl drop-shadow-md">{icon}</span>
                <div className="bg-emerald-600 text-white text-[10px] px-2 py-0.5 rounded-full font-bold mt-1 shadow-md whitespace-nowrap max-w-[120px] truncate">
                  {name}
                </div>
              </div>
            </Marker>
          );
        })}
      </Map>
    </div>
  );
}
