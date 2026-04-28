import Link from "next/link";
import { Surface } from "@heroui/react";
import { ShieldCheckIcon } from "@heroicons/react/24/outline";

export type AdminNavbarActivePage = "dashboard" | "pins";

interface AdminNavbarProps {
  activePage: AdminNavbarActivePage;
  title: string;
  subtitle: string;
}

export function AdminNavbar({ activePage, title, subtitle }: AdminNavbarProps) {
  const dashboardActive = activePage === "dashboard";
  const pinsActive = activePage === "pins";

  return (
    <Surface variant="default" className="sticky top-0 z-40 w-full rounded-none border-b border-white/15 bg-accent text-white shadow-md">
      <div className="mx-auto flex h-16 w-full max-w-7xl flex-row items-center justify-between px-4 sm:px-6">
        <div className="flex items-center gap-3">
          <div className="rounded-lg bg-white/15 p-2">
            <ShieldCheckIcon className="h-5 w-5" />
          </div>
          <div className="flex flex-col leading-tight">
            <span className="text-sm font-semibold uppercase tracking-wide text-white/80">Admin Panel</span>
            <span className="text-base font-bold text-white">{subtitle}</span>
          </div>
        </div>

        <div className="flex flex-row gap-2">
          <Link
            href="/admin"
            className={`rounded-lg px-3 py-2 text-sm transition-colors ${
              dashboardActive
                ? "bg-white/15 font-semibold text-white"
                : "font-medium text-white/80 hover:bg-white/10 hover:text-white"
            }`}
            aria-current={dashboardActive ? "page" : undefined}
          >
            Tổng quan
          </Link>
          <Link
            href="/admin/pins"
            className={`rounded-lg px-3 py-2 text-sm transition-colors ${
              pinsActive
                ? "bg-white/15 font-semibold text-white"
                : "font-medium text-white/80 hover:bg-white/10 hover:text-white"
            }`}
            aria-current={pinsActive ? "page" : undefined}
          >
            Marker
          </Link>
        </div>
      </div>
    </Surface>
  );
}
