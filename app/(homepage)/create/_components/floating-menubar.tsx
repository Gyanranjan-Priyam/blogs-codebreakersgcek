"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Type,
  Image as ImageIcon,
  Video,
  FileText,
  Table,
  Code,
} from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

interface FloatingMenubarProps {
  onInsert: (component: "richtext" | "imagetext" | "imageuploader" | "videoplayer" | "table" | "code") => void;
  className?: string;
}

export function FloatingMenubar({ onInsert, className }: FloatingMenubarProps) {
  const [activeComponent, setActiveComponent] = useState<string | null>(null);

  const handleInsert = (component: "richtext" | "imagetext" | "imageuploader" | "videoplayer" | "table" | "code") => {
    setActiveComponent(component);
    onInsert(component);
  };

  const menuItems = [
    {
      id: "richtext",
      icon: Type,
      label: "Rich Text Editor",
      description: "Add text with formatting",
    },
    {
      id: "imagetext",
      icon: FileText,
      label: "Image with Text",
      description: "Add image with text side-by-side",
    },
    {
      id: "imageuploader",
      icon: ImageIcon,
      label: "Image Uploader",
      description: "Upload and crop images",
    },
    {
      id: "videoplayer",
      icon: Video,
      label: "Video Player",
      description: "Embed YouTube, Drive, or Cloudinary videos",
    },
    {
      id: "table",
      icon: Table,
      label: "Table",
      description: "Create and edit tables with rows and columns",
    },
    {
      id: "code",
      icon: Code,
      label: "Code Block",
      description: "Add syntax-highlighted code snippets",
    },
  ];

  return (
    <div
      className={cn(
        "fixed bottom-8 left-1/2 -translate-x-1/2 z-50",
        "bg-background border rounded-full shadow-lg",
        "px-4 py-3 flex items-center gap-2",
        className
      )}
    >
      <TooltipProvider>
        {menuItems.map((item) => (
          <Tooltip key={item.id}>
            <TooltipTrigger asChild>
              <Button
                variant={activeComponent === item.id ? "default" : "ghost"}
                size="icon"
                onClick={() => handleInsert(item.id as any)}
                className={cn(
                  "h-10 w-10 rounded-full",
                  activeComponent === item.id && "bg-primary text-primary-foreground"
                )}
              >
                <item.icon className="h-5 w-5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="top" className="max-w-xs">
              <p className="font-semibold">{item.label}</p>
              <p className="text-xs text-muted-foreground">{item.description}</p>
            </TooltipContent>
          </Tooltip>
        ))}
      </TooltipProvider>
    </div>
  );
}
