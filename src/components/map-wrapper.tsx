"use client";

import dynamic from "next/dynamic";

export interface MapPinType {
  name: string;
  icon: string;
}

export interface MapPin {
  id: string;
  name: string;
  lat: number;
  long: number;
  address: string | null;
  description: string | null;
  sponsored: boolean;
  /** 7-bit mask. Bit 0 = T2 (Mon) … Bit 6 = CN (Sun). */
  openingDaysMask: number;
  imageUrl: string | null;
  pinType: MapPinType;
}

const MapComponent = dynamic(() => import("./vietmap"), {
  ssr: false,
  loading: () => (
    <div className="h-full w-full bg-default-100 animate-pulse rounded-2xl flex items-center justify-center text-default-500">
      Đang tải bản đồ...
    </div>
  ),
});

export default function MapWrapper({ pins }: { pins: MapPin[] }) {
  return <MapComponent pins={pins} />;
}
