"use client";

import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Upload, X, Loader2, Image as ImageIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import Image from "next/image";
import { toast } from "sonner";

interface ContentImageUploaderProps {
  onImageUpload?: (imageKey: string, imageUrl: string) => void;
  initialData?: { key?: string; url?: string };
  className?: string;
}

export function ContentImageUploader({ 
  onImageUpload,
  initialData,
  className 
}: ContentImageUploaderProps) {
  const [imagePreview, setImagePreview] = useState<string | null>(initialData?.url || null);
  const [imageKey, setImageKey] = useState<string>(initialData?.key || "");
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setUploading(true);
      console.log("=== CONTENT IMAGE UPLOADER: Starting upload ===");
      toast.loading("Uploading image to blog content...", { id: "content-image-upload" });

      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);

      // Create FormData for upload
      const formData = new FormData();
      formData.append("file", file);
      formData.append("type", "blog-content");

      console.log("ContentImageUploader: Uploading with type: blog-content");

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
      console.log("ContentImageUploader: Upload response:", data);
      
      setImageKey(data.key);
      
      // Call the callback with uploaded image key and URL
      onImageUpload?.(data.key, data.url);
      
      toast.success(`Image uploaded to content! (${data.key})`, { id: "content-image-upload" });
    } catch (error) {
      console.error("Upload error:", error);
      toast.error("Failed to upload image. Please try again.", { id: "content-image-upload" });
      setImagePreview(null);
    } finally {
      setUploading(false);
    }
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
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <div className={cn("border border-border rounded-lg overflow-hidden", className)}>
      <div className="p-4">
        {imagePreview ? (
          <div className="space-y-3">
            <div className="relative w-full aspect-video rounded-lg overflow-hidden group border border-border">
              <Image
                src={imagePreview}
                alt="Content image preview"
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
            <p className="text-xs text-muted-foreground text-center">
              Image uploaded successfully
            </p>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center min-h-[250px] border-2 border-dashed border-border rounded-lg">
            <ImageIcon className="h-16 w-16 text-muted-foreground mb-3" />
            <p className="text-sm font-medium text-foreground mb-1">Upload Blog Image</p>
            <p className="text-xs text-muted-foreground mb-4">Add an image to your blog content</p>
            <label htmlFor="content-image-upload-input" className="cursor-pointer">
              <Button 
                type="button" 
                size="default" 
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
                id="content-image-upload-input"
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
