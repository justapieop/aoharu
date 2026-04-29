import { JSX } from "react";
import { Sidebar } from "@/components/sidebar";
import MapWrapper, { type MapPin } from "@/components/map-wrapper";
import { createClient } from "@/lib/supabase/server";

interface RawPinTypeJoin {
  name: string | null;
  icon: string | null;
}

interface RawPinRow {
  id: string;
  name: string | null;
  lat: number | null;
  long: number | null;
  address: string | null;
  description: string | null;
  opening_days: string | null;
  sponsored: boolean | null;
  image_id: string | null;
  pin_types: RawPinTypeJoin | RawPinTypeJoin[] | null;
}

function decodeOpeningDaysMask(value: string | null): number {
  if (!value) return 0;
  try {
    const buf = Buffer.from(value, "base64");
    return buf[0] ?? 0;
  } catch {
    return 0;
  }
}

async function fetchMapPins(): Promise<MapPin[]> {
  const supabase = await createClient();

  const { data: pinRows } = await supabase
    .from("pins")
    .select(
      "id, name, lat, long, address, description, opening_days, sponsored, image_id, pin_types(name, icon)",
    )
    .returns<RawPinRow[]>();

  if (!pinRows || pinRows.length === 0) {
    return [];
  }

  return Promise.all(
    pinRows.map(async (pin): Promise<MapPin> => {
      const pinType = Array.isArray(pin.pin_types) ? pin.pin_types[0] : pin.pin_types;

      let imageUrl: string | null = null;
      if (pin.image_id) {
        const folder = `pins/${pin.id}`;
        const { data: files } = await supabase.storage
          .from("assets")
          .list(folder, { limit: 100 });

        const matchedFile = (files ?? []).find((file) => file.id === pin.image_id);
        if (matchedFile) {
          const { data: publicData } = supabase.storage
            .from("assets")
            .getPublicUrl(`${folder}/${matchedFile.name}`);
          imageUrl = publicData?.publicUrl ?? null;
        }
      }

      return {
        id: pin.id,
        name: pin.name ?? "Khu vực xanh",
        lat: Number(pin.lat ?? 0),
        long: Number(pin.long ?? 0),
        address: pin.address ?? null,
        description: pin.description ?? null,
        sponsored: !!pin.sponsored,
        openingDaysMask: decodeOpeningDaysMask(pin.opening_days),
        imageUrl,
        pinType: {
          name: pinType?.name ?? "",
          icon: pinType?.icon ?? "📍",
        },
      };
    }),
  );
}

export default async function Home(): Promise<JSX.Element> {
  const pins = await fetchMapPins();

  return (
    <div className="flex flex-col md:flex-row h-screen w-full bg-background">
      <Sidebar />
      <main className="flex-1 h-full overflow-y-auto p-6 text-foreground flex flex-col">
        <h1 className="text-2xl font-bold mb-6">Chào mừng đến với Bản đồ Xanh</h1>

        <div className="flex-1 min-h-125 w-full">
          <MapWrapper pins={pins} />
        </div>
      </main>
    </div>
  );
}
