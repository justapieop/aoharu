"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Tooltip } from "@heroui/react";
import { 
  MapIcon, 
  ViewfinderCircleIcon, 
  UserGroupIcon, 
  FireIcon, 
  TrophyIcon,
  ChevronLeftIcon,
  ChevronRightIcon
} from "@heroicons/react/24/outline";

const navItems = [
  {
    name: "Bản đồ Xanh",
    href: "/",
    icon: MapIcon
  },
  {
    name: "Công cụ AI",
    href: "/scan",
    icon: ViewfinderCircleIcon
  },
  {
    name: "Cộng đồng",
    href: "/community",
    icon: UserGroupIcon
  },
  {
    name: "Thử thách",
    href: "/challenges",
    icon: FireIcon
  },
  {
    name: "BXH",
    href: "/leaderboard",
    icon: TrophyIcon
  }
];

export function Sidebar() {
  const pathname = usePathname();
  const [isCollapsed, setIsCollapsed] = useState(true);

  return (
    <aside 
      className={`${
        isCollapsed ? "md:w-20" : "md:w-64"
      } w-full h-15 md:h-full shrink-0 bg-background border-t md:border-t-0 md:border-r border-default-200 flex flex-row md:flex-col sticky bottom-0 md:top-0 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] md:shadow-sm z-50 transition-all duration-300 order-last md:order-first`}
    >
      <Link 
        href="/" 
        className={`hidden md:flex h-16 items-center border-b border-default-100 hover:opacity-80 transition-opacity overflow-hidden ${
          isCollapsed ? "justify-center" : "px-6"
        }`}
      >
        <Image
          src="/logo.png"
          alt="BandoXanh Logo"
          width={32}
          height={32}
          className="rounded-lg shrink-0"
          style={{ width: "auto", height: "auto" }}
        />
        {!isCollapsed && (
          <span className="font-bold text-xl text-accent tracking-wide ml-3 whitespace-nowrap">
            Bản đồ xanh
          </span>
        )}
      </Link>

      <nav className={`flex-1 flex flex-row md:flex-col justify-center items-center md:gap-1.5 md:py-4 overflow-hidden px-2 md:px-3`}>
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;
          
          const linkContent = (
            <Link
              href={item.href}
              className={`flex items-center rounded-xl transition-all duration-200 group ${
                isCollapsed ? "justify-center w-10 h-10 md:w-11 md:h-11 mx-auto" : "justify-center md:justify-start w-10 h-10 md:w-full md:px-3 md:py-2.5 mx-auto md:mx-0"
              } ${
                isActive 
                  ? "bg-accent/10 text-accent font-semibold" 
                  : "text-default-600 hover:bg-default-100 hover:text-foreground font-medium"
              }`}
            >
              <span className={`flex items-center justify-center ${isActive ? "text-accent" : "text-default-500 group-hover:text-foreground"}`}>
                <Icon className="w-6 h-6 md:w-6 md:h-6 shrink-0" />
              </span>
              {!isCollapsed && (
                <span className="hidden md:block ml-3 whitespace-nowrap truncate text-sm">
                  {item.name}
                </span>
              )}
            </Link>
          );

          return (
            <div key={item.href} className="w-full flex justify-center">
              {isCollapsed ? (
                <div className="hidden md:block">
                  <Tooltip delay={300}>
                    <Tooltip.Trigger>
                      {linkContent}
                    </Tooltip.Trigger>
                    <Tooltip.Content placement="right" className="bg-surface text-foreground shadow-lg border border-default-200 font-medium px-3 py-1.5 rounded-lg text-sm ml-2">
                      {item.name}
                    </Tooltip.Content>
                  </Tooltip>
                </div>
              ) : (
                <div className="hidden md:block w-full">{linkContent}</div>
              )}
              {/* For mobile, just show the link directly without tooltip */}
              <div className="md:hidden">
                {linkContent}
              </div>
            </div>
          );
        })}
      </nav>

      <div className="hidden md:flex p-3 border-t border-default-200 justify-center">
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="p-2 rounded-lg text-default-500 hover:bg-default-100 transition-colors w-full flex justify-center"
          title={isCollapsed ? "Mở rộng (Expand)" : "Thu gọn (Collapse)"}
        >
          {isCollapsed ? (
            <ChevronRightIcon className="w-5 h-5 shrink-0" />
          ) : (
            <ChevronLeftIcon className="w-5 h-5 shrink-0" />
          )}
        </button>
      </div>
    </aside>
  );
}
