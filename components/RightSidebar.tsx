"use client";

import { Button } from "@/components/ui/button";
import { Home, Bell, User, Edit } from "lucide-react";
import Link from "next/link";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

interface RightSidebarProps {
  user: any;
  onPostClick: () => void;
}

export function RightSidebar({ user, onPostClick }: RightSidebarProps) {
  const pathname = usePathname();

  const navItems = [
    {
      icon: Home,
      label: "Home",
      href: "/",
      active: pathname === "/" || pathname === "/blog-homepage",
    },
    {
      icon: Bell,
      label: "Notifications",
      href: "/notifications",
      active: pathname === "/notifications",
      badge: 0, // You can add notification count here
    },
    {
      icon: User,
      label: "Profile",
      href: user?.username ? `/profile/${user.username}` : "#",
      active: pathname?.includes("/profile"),
    },
  ];

  return (
    <div className="w-20 xl:w-64 flex flex-col h-screen sticky top-0 border-r border-border">
      <div className="flex flex-col gap-2 p-3 xl:p-4 flex-1">
        {/* Logo */}
        <div className="mb-4 px-2">
          <div className="w-12 h-12 rounded-full bg-blue-500 flex items-center justify-center">
            <span className="text-white text-xl font-bold">CB</span>
          </div>
        </div>

        {/* Navigation Items */}
        <nav className="space-y-2 flex-1">
          {navItems.map((item) => (
            <Link key={item.href} href={item.href}>
              <Button
                variant="ghost"
                className={cn(
                  "w-full justify-start xl:justify-start gap-4 h-12 xl:h-auto xl:py-3 px-3 xl:px-4 rounded-full transition-colors",
                  item.active && "bg-accent font-bold"
                )}
              >
                <div className="relative">
                  <item.icon className="h-6 w-6" />
                  {item.badge && item.badge > 0 && (
                    <span className="absolute -top-1 -right-1 bg-blue-500 text-white text-xs rounded-full h-4 w-4 flex items-center justify-center">
                      {item.badge > 9 ? "9+" : item.badge}
                    </span>
                  )}
                </div>
                <span className="hidden xl:inline text-lg">{item.label}</span>
              </Button>
            </Link>
          ))}
        </nav>

        {/* Post Button */}
        <Button
          onClick={onPostClick}
          className="w-full bg-blue-500 hover:bg-blue-600 text-white rounded-full h-12 xl:h-auto xl:py-3 font-bold text-base shadow-lg"
        >
          <Edit className="h-5 w-5 xl:hidden" />
          <span className="hidden xl:inline">Post</span>
        </Button>

        {/* User Profile at Bottom */}
        {user && (
          <div className="mt-auto">
            <Button
              variant="ghost"
              className="w-full justify-start xl:justify-start gap-3 h-auto py-3 px-2 xl:px-3 rounded-full hover:bg-accent"
              asChild
            >
              <Link href={user.username ? `/profile/${user.username}` : "#"}>
                <Avatar className="h-10 w-10">
                  <AvatarImage src={user.image || undefined} />
                  <AvatarFallback>{user.name?.[0] || "U"}</AvatarFallback>
                </Avatar>
                <div className="hidden xl:flex flex-col items-start flex-1 overflow-hidden">
                  <span className="text-sm font-semibold truncate w-full">
                    {user.name}
                  </span>
                  <span className="text-xs text-muted-foreground truncate w-full">
                    @{user.username || user.email?.split("@")[0]}
                  </span>
                </div>
              </Link>
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
