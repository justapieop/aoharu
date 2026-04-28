import { JSX } from "react";
import { Sidebar } from "@/components/sidebar";
import MapWrapper from "@/components/map-wrapper";

export default async function Home(): Promise<JSX.Element> {
  return (
    <div className="flex flex-col md:flex-row h-screen w-full bg-background">
      <Sidebar />
      <main className="flex-1 h-full overflow-y-auto p-6 text-foreground flex flex-col">
        <h1 className="text-2xl font-bold mb-6">Chào mừng đến với Bản đồ Xanh</h1>
        
        <div className="flex-1 min-h-[500px] w-full">
            <MapWrapper />
        </div>
      </main>
    </div>
  );
}