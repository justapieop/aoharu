"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Tooltip, Avatar, Dropdown, Label } from "@heroui/react";
import { createClient } from "@/lib/supabase/client";
import { 
  MapIcon, 
  ShieldCheckIcon,
  ViewfinderCircleIcon, 
  UserGroupIcon, 
  FireIcon, 
  ChevronLeftIcon,
  ChevronRightIcon,
  UserIcon,
  ArrowRightEndOnRectangleIcon
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
  }
];

export function Sidebar() {
  const pathname = usePathname();
  const [isCollapsed, setIsCollapsed] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [userName, setUserName] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [avatarVersion, setAvatarVersion] = useState<number>(Date.now());

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(async ({ data }) => {
      if (!data?.user) {
        setUserId(null);
        setUserEmail(null);
        setUserName(null);
        setIsAdmin(false);
        return;
      }

      setUserId(data.user.id);
      setUserEmail(data.user.email ?? null);
      setUserName(data.user.user_metadata?.display_name ?? null);

      const { data: profile } = await supabase
        .from("profiles")
        .select("admin")
        .eq("id", data.user.id)
        .maybeSingle();

      setIsAdmin(profile?.admin === true);
    });

    const handleAvatarUpdate = () => {
      setAvatarVersion(Date.now());
    };
    window.addEventListener("avatarUpdated", handleAvatarUpdate);

    return () => {
      window.removeEventListener("avatarUpdated", handleAvatarUpdate);
    };
  }, []);

  const avatarUrl = userId 
    ? `/api/avatar/${userId}?v=${avatarVersion}` 
    : null;

  const router = useRouter();

  const handleDropdownAction = async (key: string | number) => {
    if (key === "logout") {
      const supabase = createClient();
      await supabase.auth.signOut();
      setUserEmail(null);
      setUserName(null);
      setUserId(null);
      setIsAdmin(false);
      router.push("/");
    } else if (key === "profile") {
      router.push("/profile");
    } else if (key === "admin") {
      router.push("/admin");
    }
  };

  return (
    <aside 
      className={`${
        isCollapsed ? "md:w-20" : "md:w-64"
      } w-full h-15 md:h-full shrink-0 bg-accent flex flex-row md:flex-col sticky bottom-0 md:top-0 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)] md:shadow-lg z-50 transition-all duration-300 order-last md:order-first`}
    >
      <Link 
        href="/" 
        className={`hidden md:flex h-16 items-center border-b border-white/15 hover:opacity-80 transition-opacity overflow-hidden ${
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
          <span className="font-bold text-xl text-white tracking-wide ml-3 whitespace-nowrap">
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
                  ? "bg-white/20 text-white font-semibold" 
                  : "text-white/70 hover:bg-white/10 hover:text-white font-medium"
              }`}
            >
              <span className={`flex items-center justify-center ${isActive ? "text-white" : "text-white/70 group-hover:text-white"}`}>
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
                    <Tooltip.Content placement="right" className="bg-overlay text-foreground shadow-lg border border-default-200 font-medium px-3 py-1.5 rounded-lg text-sm ml-2">
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

      <div className="flex md:flex-col p-1 md:p-3 md:border-t border-white/15 justify-center items-center md:gap-2 mr-1 md:mr-0 shrink-0">
          {userEmail ? (
            <Dropdown>
              <Dropdown.Trigger>
                <div tabIndex={0} className="p-2 rounded-xl md:rounded-lg text-white/80 hover:bg-white/10 transition-colors w-10 h-10 md:w-full md:h-auto mx-auto flex justify-center cursor-pointer items-center">
                  <Avatar size="sm" className="border border-white/30">
                    {avatarUrl && <Avatar.Image src={avatarUrl} alt="User Avatar" className="object-cover" />}
                    <Avatar.Fallback>{(userName || userEmail).charAt(0).toUpperCase()}</Avatar.Fallback>
                  </Avatar>
                  {!isCollapsed && (
                    <div className="hidden md:flex ml-3 items-center gap-2 min-w-0">
                      <span className="truncate text-sm text-white/90">
                        {userName || userEmail}
                      </span>
                      {isAdmin && (
                        <span className="shrink-0 rounded-full bg-white/20 border border-white/25 px-2 py-0.5 text-[10px] font-semibold text-white">
                          Quản trị viên
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </Dropdown.Trigger>
              <Dropdown.Popover placement="right" className="min-w-50 mb-2 md:mb-0">
                <Dropdown.Menu aria-label="User menu" onAction={(key) => handleDropdownAction(key)}>
                  <Dropdown.Item id="profile" textValue="Hồ sơ">
                    <div className="flex justify-between items-center w-full">
                    <Label>Hồ sơ</Label>
                      <UserIcon className="w-4 h-4 ml-2" />
                    </div>
                  </Dropdown.Item>
                  {isAdmin && (
                    <Dropdown.Item id="admin" textValue="Admin Panel">
                      <div className="flex justify-between items-center w-full">
                        <Label>Truy cập khu vực cho quản trị viên</Label>
                        <ShieldCheckIcon className="w-4 h-4 ml-2" />
                      </div>
                    </Dropdown.Item>
                  )}
                  <Dropdown.Item id="logout" textValue="Đăng xuất" variant="danger">
                    <div className="flex justify-between items-center w-full">
                      <Label>Đăng xuất</Label>
                    <ArrowRightEndOnRectangleIcon className="w-4 h-4 ml-2" />
                    </div>
                  </Dropdown.Item>
                </Dropdown.Menu>
              </Dropdown.Popover>
            </Dropdown>
          ) : (
            <Link href="/auth/login" className="w-auto md:w-full">
              <Tooltip delay={300}>
                <Tooltip.Trigger>
                  <div tabIndex={0} className="p-2 rounded-xl md:rounded-lg text-white/80 hover:bg-white/10 transition-colors w-10 h-10 md:w-full md:h-auto mx-auto flex justify-center cursor-pointer items-center">
                    <Avatar size="sm" className="bg-white/20">
                      <Avatar.Fallback>
                        <UserIcon className="w-4 h-4" />
                      </Avatar.Fallback>
                    </Avatar>
                    {!isCollapsed && (
                      <span className="hidden md:block ml-3 truncate text-sm text-white/90">
                        Đăng nhập
                      </span>
                    )}
                  </div>
                </Tooltip.Trigger>
                {isCollapsed && (
                  <Tooltip.Content placement="right" className="bg-overlay text-foreground shadow-lg border border-default-200 font-medium px-3 py-1.5 rounded-lg text-sm ml-2">
                    Đăng nhập
                  </Tooltip.Content>
                )}
              </Tooltip>
            </Link>
          )}
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="hidden md:flex p-2 rounded-lg text-white/60 hover:bg-white/10 hover:text-white/90 transition-colors w-full justify-center items-center"
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
