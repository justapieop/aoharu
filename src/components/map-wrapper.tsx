"use client";

import dynamic from "next/dynamic";

const MapComponent = dynamic(() => import("./vietmap"), { 
  ssr: false,
  loading: () => <div className="h-full w-full bg-default-100 animate-pulse rounded-2xl flex items-center justify-center text-default-500">Đang tải bản đồ...</div>
});

export default function MapWrapper() {
  return <MapComponent />;
}
