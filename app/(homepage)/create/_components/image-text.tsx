"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { AlignLeft, AlignRight, X } from "lucide-react";
import { cn } from "@/lib/utils";
import Image from "next/image";
import { ImageTextCropUploader } from "./image-text-crop-uploader";
import { toast } from "sonner";

interface ImageTextProps {
  onContentChange?: (data: { text: string; image: string; imageKey?: string; alignment: "left" | "right" }) => void;
  initialData?: { text?: string; image?: string; imageKey?: string; alignment?: "left" | "right" };
  className?: string;
}

export function ImageText({ onContentChange, initialData, className }: ImageTextProps) {
  const [text, setText] = useState(initialData?.text || "");
  const [imagePreview, setImagePreview] = useState<string | null>(initialData?.image || null);
  const [imageKey, setImageKey] = useState<string>(initialData?.imageKey || "");
  const [alignment, setAlignment] = useState<"left" | "right">(initialData?.alignment || "left");
  const [showUploader, setShowUploader] = useState(false);

  const handleImageUpload = (key: string, url: string) => {
    setImageKey(key);
    setImagePreview(url);
    setShowUploader(false);
    onContentChange?.({ text, image: url, imageKey: key, alignment });
  };

  const handleRemoveImage = async () => {
    if (imageKey) {
      try {
        await fetch("/api/s3/delete", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ key: imageKey }),
        });
        toast.success("Image removed");
      } catch (error) {
        console.error("Failed to delete image:", error);
      }
    }
    setImagePreview(null);
    setImageKey("");
    onContentChange?.({ text, image: "", alignment });
  };

  const handleTextChange = (value: string) => {
    setText(value);
    onContentChange?.({ text: value, image: imagePreview || "", imageKey, alignment });
  };

  const handleAlignmentChange = (newAlignment: "left" | "right") => {
    setAlignment(newAlignment);
    onContentChange?.({ text, image: imagePreview || "", imageKey, alignment: newAlignment });
  };

  return (
    <div className={cn("border border-border rounded-lg overflow-hidden", className)}>
      {/* Top Bar */}
      <div className="bg-muted/50 border-b border-border p-2 flex items-center gap-2">
        <span className="text-sm font-medium">Alignment:</span>
        
        <Button
          type="button"
          variant={alignment === "left" ? "default" : "outline"}
          size="sm"
          onClick={() => handleAlignmentChange("left")}
          className="gap-2"
        >
          <AlignLeft className="h-4 w-4" />
          Left
        </Button>

        <Button
          type="button"
          variant={alignment === "right" ? "default" : "outline"}
          size="sm"
          onClick={() => handleAlignmentChange("right")}
          className="gap-2"
        >
          <AlignRight className="h-4 w-4" />
          Right
        </Button>

        <div className="flex-1" />

        {/* Upload Image Button */}
        {!imagePreview && (
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={() => setShowUploader(!showUploader)}
          >
            {showUploader ? "Cancel" : "Add Image"}
          </Button>
        )}
      </div>

      {/* Content Section */}
      <div className="p-4">
        <div className="space-y-4">
          {/* Text Input Field */}
          <div>
            <label className="text-sm font-medium mb-2 block">Text Content</label>
            <Textarea
              value={text}
              onChange={(e) => handleTextChange(e.target.value)}
              placeholder="Enter your text here..."
              className="min-h-[150px] resize-none"
            />
          </div>

          {/* Image Uploader or Preview */}
          {showUploader && !imagePreview ? (
            <ImageTextCropUploader onImageUpload={handleImageUpload} />
          ) : imagePreview ? (
            <div
              className={cn(
                "flex gap-4 items-start",
                alignment === "right" ? "flex-row-reverse" : "flex-row"
              )}
            >
              {/* Text Display */}
              <div className="flex-1 p-4 border border-border rounded-lg bg-muted/20">
                <p className="text-sm whitespace-pre-wrap">{text || "Your text will appear here..."}</p>
              </div>

              {/* Image Side */}
              <div className="relative w-64 h-64 border border-border rounded-lg overflow-hidden group shrink-0">
                <Image
                  src={imagePreview}
                  alt="Preview"
                  fill
                  className="object-cover"
                />
                <Button
                  type="button"
                  variant="destructive"
                  size="icon"
                  className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={handleRemoveImage}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
