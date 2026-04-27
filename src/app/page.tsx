import { JSX } from "react";
import { Sidebar } from "@/components/sidebar";

export default async function Home(): Promise<JSX.Element> {
  return (
    <div className="flex flex-col md:flex-row h-screen w-full bg-background">
      <Sidebar />
      <main className="flex-1 h-full overflow-y-auto p-6 text-foreground">
        <h1 className="text-2xl font-bold">Chào mừng đến với BandoXanh</h1>
      </main>
    </div>
  );
}