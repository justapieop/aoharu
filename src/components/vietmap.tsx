"use client";

import { useState } from "react";
import Map, { Marker, NavigationControl, Popup } from "react-map-gl/maplibre";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { MapPinIcon } from "@heroicons/react/24/outline";
import type { MapPin } from "./map-wrapper";

const DAY_LABELS = ["T2", "T3", "T4", "T5", "T6", "T7", "CN"];

function normalizeCoords(pin: MapPin): { lat: number; long: number } | null {
  let lat = pin.lat;
  let long = pin.long;

  // Auto-correct if the user accidentally swapped lat and long in the database.
  if (Math.abs(lat) > 90 && Math.abs(long) <= 90) {
    lat = pin.long;
    long = pin.lat;
  }

  if (Math.abs(lat) > 90 || Math.abs(long) > 180) {
    return null;
  }

  return { lat, long };
}

export default function VietmapComponent({ pins = [] }: { pins?: MapPin[] }) {
  const apiKey = process.env.NEXT_PUBLIC_VIETMAP_API_KEY || "";
  const mapStyle = `https://maps.vietmap.vn/api/maps/raster/styles.json?apikey=${apiKey}`;

  const [viewState, setViewState] = useState({
    longitude: 105.8521,
    latitude: 21.0227,
    zoom: 13,
  });
  const [selectedPinId, setSelectedPinId] = useState<string | null>(null);

  if (!apiKey) {
    return (
      <div className="h-full w-full rounded-2xl border border-default-200 shadow-sm flex flex-col items-center justify-center bg-default-100 text-default-500">
        <span className="text-4xl mb-2">🗺️</span>
        <p className="font-bold">Bản đồ chưa được cấu hình</p>
        <p className="text-sm">Vui lòng thêm NEXT_PUBLIC_VIETMAP_API_KEY vào file .env</p>
      </div>
    );
  }

  const selectedPin = selectedPinId ? pins.find((p) => p.id === selectedPinId) ?? null : null;
  const selectedPinCoords = selectedPin ? normalizeCoords(selectedPin) : null;

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
          const coords = normalizeCoords(pin);
          if (!coords) return null;

          return (
            <Marker
              key={pin.id}
              longitude={coords.long}
              latitude={coords.lat}
              anchor="bottom"
              onClick={(e) => {
                e.originalEvent?.stopPropagation();
                setSelectedPinId(pin.id);
              }}
            >
              <div className="flex flex-col items-center cursor-pointer transform hover:scale-110 transition-transform">
                <span className="text-3xl drop-shadow-md">{pin.pinType.icon}</span>
                <div className="bg-emerald-600 text-white text-[10px] px-2 py-0.5 rounded-full font-bold mt-1 shadow-md whitespace-nowrap max-w-[120px] truncate">
                  {pin.name}
                </div>
              </div>
            </Marker>
          );
        })}

        {selectedPin && selectedPinCoords && (
          <Popup
            longitude={selectedPinCoords.long}
            latitude={selectedPinCoords.lat}
            anchor="bottom"
            offset={36}
            closeOnClick={false}
            closeButton={false}
            maxWidth="320px"
            onClose={() => setSelectedPinId(null)}
            className="vietmap-pin-popup"
          >
            <PinPopupContent pin={selectedPin} onClose={() => setSelectedPinId(null)} />
          </Popup>
        )}
      </Map>

      {/* Override MapLibre's default popup chrome so our card looks clean. */}
      <style jsx global>{`
        .vietmap-pin-popup .maplibregl-popup-content {
          padding: 0;
          background: transparent;
          box-shadow: none;
          border-radius: 16px;
        }
        .vietmap-pin-popup .maplibregl-popup-tip {
          border-top-color: white;
        }
      `}</style>
    </div>
  );
}

function PinPopupContent({ pin, onClose }: { pin: MapPin; onClose: () => void }) {
  return (
    <div className="w-[300px] max-w-[80vw] flex flex-col bg-white rounded-2xl overflow-hidden shadow-xl border border-default-200">
      <div className="relative">
        {pin.imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={pin.imageUrl}
            alt={pin.name}
            className="w-full h-32 object-cover"
          />
        ) : (
          <div className="w-full h-20 bg-gradient-to-br from-emerald-100 to-emerald-50 flex items-center justify-center text-3xl">
            {pin.pinType.icon}
          </div>
        )}

        <button
          type="button"
          aria-label="Đóng"
          onClick={onClose}
          className="absolute top-2 right-2 h-7 w-7 rounded-full bg-black/40 text-white text-sm font-bold backdrop-blur hover:bg-black/60 transition-colors"
        >
          ×
        </button>

        {pin.sponsored && (
          <span className="absolute top-2 left-2 bg-amber-400 text-amber-950 text-[10px] px-2 py-0.5 rounded-full font-bold shadow">
            Tài trợ
          </span>
        )}
      </div>

      <div className="flex flex-col gap-2 p-3">
        <div className="flex items-start gap-2">
          {pin.imageUrl && <span className="text-xl shrink-0 leading-none mt-0.5">{pin.pinType.icon}</span>}
          <div className="flex-1 min-w-0">
            <h3 className="font-bold text-sm leading-tight text-foreground">{pin.name}</h3>
            {pin.pinType.name && (
              <p className="text-[11px] text-default-500 mt-0.5">{pin.pinType.name}</p>
            )}
          </div>
        </div>

        {pin.address && (
          <div className="flex items-start gap-1.5 text-xs text-default-700">
            <MapPinIcon className="w-3.5 h-3.5 shrink-0 mt-0.5 text-default-400" />
            <span className="leading-snug">{pin.address}</span>
          </div>
        )}

        {pin.openingDaysMask > 0 && (
          <div className="flex flex-wrap gap-1">
            {DAY_LABELS.map((label, i) => {
              const open = ((pin.openingDaysMask >> i) & 1) === 1;
              return (
                <span
                  key={label}
                  className={`text-[10px] px-1.5 py-0.5 rounded font-semibold border ${
                    open
                      ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                      : "bg-default-50 text-default-400 border-default-200"
                  }`}
                >
                  {label}
                </span>
              );
            })}
          </div>
        )}

        {pin.description && pin.description.trim().length > 0 && (
          <div
            className="text-xs text-default-700 leading-relaxed max-h-40 overflow-y-auto prose prose-sm max-w-none [&_*]:!text-xs [&_p]:!my-1 [&_ul]:!my-1 [&_ol]:!my-1"
            dangerouslySetInnerHTML={{ __html: pin.description }}
          />
        )}
      </div>
    </div>
  );
}
