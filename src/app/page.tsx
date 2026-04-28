import { JSX } from "react";
import { Sidebar } from "@/components/sidebar";
import MapWrapper from "@/components/map-wrapper";
import { createClient } from "@/lib/supabase/server";

export default async function Home(): Promise<JSX.Element> {
  const supabase = await createClient();
  const { data: pins } = await supabase
    .from("pins")
    .select("id, name, lat, long, pin_types(name, icon)");

  return (
    <div className="flex flex-col md:flex-row h-screen w-full bg-background">
      <Sidebar />
      <main className="flex-1 h-full overflow-y-auto p-6 text-foreground flex flex-col">
        <h1 className="text-2xl font-bold mb-6">Chào mừng đến với Bản đồ Xanh</h1>
        
        <div className="flex-1 min-h-125 w-full">
            <MapWrapper pins={pins || []} />
        </div>
      </main>
    </div>
  );
}