"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Tooltip, Avatar } from "@heroui/react";
import { createClient } from "@/lib/supabase/client";
import { 
  MapIcon, 
  ViewfinderCircleIcon, 
  UserGroupIcon, 
  FireIcon, 
  TrophyIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  UserIcon
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
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [userName, setUserName] = useState<string | null>(null);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => {
      if (data?.user) {
        setUserEmail(data.user.email ?? null);
        setUserName(data.user.user_metadata?.display_name ?? null);
      }
    });
  }, []);

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
          className="rounded-lg shrink-0 w-auto h-auto"
        />
        {!isCollapsed && (
          <span className="font-bold text-xl text-accent tracking-wide ml-3 whitespace-nowrap">
            Bản đồ xanh
          </span>
        )}
      </Link>

      <nav className={`flex-1 w-full md:w-auto flex flex-row md:flex-col justify-around md:justify-center items-center md:gap-1.5 md:py-4 px-1 md:px-3`}>
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
            <div key={item.href} className="w-auto md:w-full flex justify-center">
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

      <div className="flex md:flex-col p-1 md:p-3 md:border-t border-default-200 justify-center items-center md:gap-2 mr-1 md:mr-0 shrink-0">
        <Link href={userEmail ? "#" : "/auth/login"} className="w-auto md:w-full">
          <Tooltip delay={300}>
            <Tooltip.Trigger>
              <div tabIndex={0} className="p-2 rounded-xl md:rounded-lg text-default-500 hover:bg-default-100 transition-colors w-10 h-10 md:w-full md:h-auto mx-auto flex justify-center cursor-pointer items-center">
                {userEmail ? (
                  <Avatar size="sm">
                    <Avatar.Fallback>{(userName || userEmail).charAt(0).toUpperCase()}</Avatar.Fallback>
                  </Avatar>
                ) : (
                  <Avatar size="sm" className="bg-default-200">
                    <Avatar.Fallback>
                      <UserIcon className="w-4 h-4" />
                    </Avatar.Fallback>
                  </Avatar>
                )}
                {!isCollapsed && (
                  <span className="hidden md:block ml-3 truncate text-sm">
                    {userEmail ? (userName || userEmail) : "Đăng nhập"}
                  </span>
                )}
              </div>
            </Tooltip.Trigger>
            {isCollapsed && (
              <Tooltip.Content placement="right" className="bg-surface text-foreground shadow-lg border border-default-200 font-medium px-3 py-1.5 rounded-lg text-sm ml-2">
                {userEmail ? `Chào mừng ${userName || userEmail}` : "Đăng nhập"}
              </Tooltip.Content>
            )}
          </Tooltip>
        </Link>
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="hidden md:flex p-2 rounded-lg text-default-500 hover:bg-default-100 transition-colors w-full justify-center items-center"
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
