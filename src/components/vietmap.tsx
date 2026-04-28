"use client";

import { useState } from "react";
import Map, { Marker, NavigationControl } from "react-map-gl/maplibre";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";

export default function VietmapComponent() {
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
        
        <Marker longitude={105.8521} latitude={21.0227} anchor="bottom">
          <div className="flex flex-col items-center cursor-pointer transform hover:scale-110 transition-transform">
            <span className="text-3xl drop-shadow-md">🌳</span>
            <div className="bg-emerald-600 text-white text-[10px] px-2 py-0.5 rounded-full font-bold mt-1 shadow-md">
              Khu vực xanh
            </div>
          </div>
        </Marker>
      </Map>
    </div>
  );
}
