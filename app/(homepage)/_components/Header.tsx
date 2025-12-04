"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { LogOut, LogIn, User, Moon, Sun, Search, PenSquare, X } from "lucide-react";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { LoginForm } from "@/app/(auth)/login/_components/LoginForm";
import Image from "next/image";
import Link from "next/link";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useTheme } from "next-themes";
import { ThemeToggle } from "@/components/ui/theme-toggle";

interface HeaderProps {
  user: any;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  loginDialogOpen: boolean;
  setLoginDialogOpen: (open: boolean) => void;
  handleLogout: () => void;
  hideCreateButton?: boolean;
}

export function Header({
  user,
  searchQuery,
  setSearchQuery,
  loginDialogOpen,
  setLoginDialogOpen,
  handleLogout,
  hideCreateButton = false,
}: HeaderProps) {
  const { theme, setTheme } = useTheme();
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);

  return (
    <div className="sticky top-0 z-10 bg-background/80 backdrop-blur border-b border-border">
      <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
        {/* Mobile Search Overlay */}
        {mobileSearchOpen && (
          <div className="absolute inset-0 bg-background flex items-center gap-2 px-4 md:hidden z-20">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search blogs..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 bg-muted/50 border-border focus-visible:ring-blue-500"
                autoFocus
              />
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setMobileSearchOpen(false)}
            >
              <X className="h-5 w-5" />
            </Button>
          </div>
        )}

        {/* Left: Logo and Brand */}
          <Link href="/" className="flex items-center gap-3">
          <Image
            src="/assets/logo.png"
            alt="CodeBreakers Logo"
            width={40}
            height={40}
            priority
          />
          <h1 className="text-xl font-bold hidden md:block">CodeBreakers Blogs</h1>
          <h1 className="text-lg font-bold md:hidden">Blogs</h1>
          </Link>

        {/* Center: Search (Desktop Only) */}
        <div className="flex-1 max-w-md hidden md:block">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search blogs..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-muted/50 border-border focus-visible:ring-blue-500"
            />
          </div>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-2">
          {/* Mobile Search Icon */}
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            onClick={() => setMobileSearchOpen(true)}
          >
            <Search className="h-5 w-5" />
          </Button>

          {/* User Profile or Login */}
          {user ? (
            <>
              {/* Create Blog Button */}
              {!hideCreateButton && (
                <>
                  <Button asChild variant="default" size="sm" className="hidden sm:flex">
                    <Link href="/create">
                      <PenSquare className="h-4 w-4 mr-2" />
                      Create Blog
                    </Link>
                  </Button>
                  
                  {/* Mobile Create Blog Icon */}
                  <Button asChild variant="default" size="icon" className="sm:hidden">
                    <Link href="/create">
                      <PenSquare className="h-5 w-5" />
                    </Link>
                  </Button>
                </>
              )}

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="flex items-center gap-3 h-auto py-2">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={user.image || undefined} />
                      <AvatarFallback>{user.name?.[0] || "U"}</AvatarFallback>
                    </Avatar>
                    <div className="hidden md:flex flex-col items-start">
                      <span className="text-sm font-medium">{user.name}</span>
                      <span className="text-xs text-muted-foreground">@{(user as any).username || user.email}</span>
                    </div>
                  </Button>
                </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>My Account</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {(user as any).username && (
                  <DropdownMenuItem asChild>
                    <Link href={`/profile/${(user as any).username}`} className="cursor-pointer">
                      <User className="mr-2 h-4 w-4" />
                      <span>Profile</span>
                    </Link>
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem onClick={() => setTheme(theme === "dark" ? "light" : "dark")}>
                  {theme === "dark" ? (
                    <Sun className="mr-2 h-4 w-4" />
                  ) : (
                    <Moon className="mr-2 h-4 w-4" />
                  )}
                  <span>{theme === "dark" ? "Light Mode" : "Dark Mode"}</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout}>
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Logout</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </>
        ) : (
          <>
            <ThemeToggle />
            <Dialog open={loginDialogOpen} onOpenChange={setLoginDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="default" size="sm">
                  <LogIn className="h-4 w-4 mr-2" />
                  Login
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md">
                <LoginForm />
              </DialogContent>
            </Dialog>
          </>
        )}
        </div>
      </div>
    </div>
  );
}
