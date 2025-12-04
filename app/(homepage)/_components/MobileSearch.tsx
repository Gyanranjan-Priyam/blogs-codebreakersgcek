"use client";

import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";

interface MobileSearchProps {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
}

export function MobileSearch({ searchQuery, setSearchQuery }: MobileSearchProps) {
  return (
    <div className="md:hidden hidden border-b border-border p-4">
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
  );
}
