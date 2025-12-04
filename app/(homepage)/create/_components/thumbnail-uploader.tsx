"use client";

import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Upload, X, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import Image from "next/image";
import { toast } from "sonner";

interface ThumbnailUploaderProps {
  onImageUpload?: (imageKey: string, imageUrl: string) => void;
  className?: string;
}

export function ThumbnailUploader({ 
  onImageUpload, 
  className 
}: ThumbnailUploaderProps) {
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setUploading(true);
      console.log("=== THUMBNAIL UPLOADER: Starting upload ===");
      toast.loading("Uploading thumbnail...", { id: "thumbnail-upload" });

      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);

      // Create FormData for upload
      const formData = new FormData();
      formData.append("file", file);
      formData.append("type", "blog-thumbnail");

      console.log("ThumbnailUploader: Uploading with type: blog-thumbnail");

      // Upload to S3
      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error("Upload failed:", errorData);
        throw new Error(errorData.error || "Upload failed");
      }

      const data = await response.json();
      console.log("ThumbnailUploader: Upload response:", data);
      
      // Call the callback with uploaded image key and URL
      onImageUpload?.(data.key, data.url);
      
      toast.success(`Thumbnail uploaded! (${data.key})`, { id: "thumbnail-upload" });
    } catch (error) {
      console.error("Upload error:", error);
      toast.error("Failed to upload thumbnail. Please try again.", { id: "thumbnail-upload" });
      setImagePreview(null);
    } finally {
      setUploading(false);
    }
  };

  const handleRemoveImage = () => {
    setImagePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <div className={cn("border border-border rounded-lg overflow-hidden", className)}>
      <div className="p-4">
        {imagePreview ? (
          <div className="relative w-full h-48 rounded-lg overflow-hidden group">
            <Image
              src={imagePreview}
              alt="Thumbnail preview"
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
        ) : (
          <div className="flex flex-col items-center justify-center min-h-[200px] border-2 border-dashed border-border rounded-lg">
            <Upload className="h-12 w-12 text-muted-foreground mb-2" />
            <p className="text-sm text-muted-foreground mb-4">Upload a thumbnail image</p>
            <label htmlFor="thumbnail-upload-input" className="cursor-pointer">
              <Button 
                type="button" 
                size="sm" 
                variant="outline" 
                className="gap-2" 
                disabled={uploading}
                asChild
              >
                <span>
                  {uploading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Uploading...
                    </>
                  ) : (
                    <>
                      <Upload className="h-4 w-4" />
                      Select Image
                    </>
                  )}
                </span>
              </Button>
              <input
                ref={fileInputRef}
                id="thumbnail-upload-input"
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                className="hidden"
                disabled={uploading}
              />
            </label>
          </div>
        )}
      </div>
    </div>
  );
}
