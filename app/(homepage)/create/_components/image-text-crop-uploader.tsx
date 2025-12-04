"use client";

import { useState, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Upload, X, Crop, Check, ZoomIn, ZoomOut, Move } from "lucide-react";
import { cn } from "@/lib/utils";
import Image from "next/image";
import ReactCrop, { Crop as CropType, PixelCrop } from "react-image-crop";
import "react-image-crop/dist/ReactCrop.css";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface ImageTextCropUploaderProps {
  onImageUpload?: (imageKey: string, imageUrl: string) => void;
  className?: string;
}

type AspectRatioType = "16:9" | "9:16" | "3:4" | "1:1" | "free";

const ASPECT_RATIOS: Record<AspectRatioType, number | undefined> = {
  "16:9": 16 / 9,
  "9:16": 9 / 16,
  "3:4": 3 / 4,
  "1:1": 1,
  "free": undefined,
};

const ASPECT_RATIO_LABELS: Record<AspectRatioType, string> = {
  "16:9": "Landscape (16:9)",
  "9:16": "Portrait (9:16)",
  "3:4": "Portrait (3:4)",
  "1:1": "Square (1:1)",
  "free": "Free",
};

export function ImageTextCropUploader({ 
  onImageUpload,
  className 
}: ImageTextCropUploaderProps) {
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [crop, setCrop] = useState<CropType>();
  const [completedCrop, setCompletedCrop] = useState<PixelCrop>();
  const [selectedRatio, setSelectedRatio] = useState<AspectRatioType>("16:9");
  const [showCropper, setShowCropper] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [imageDimensions, setImageDimensions] = useState<{ width: number; height: number } | null>(null);
  const [imagePosition, setImagePosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [isDragMode, setIsDragMode] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const img = new window.Image();
        img.onload = () => {
          setImageDimensions({ width: img.width, height: img.height });
        };
        img.src = reader.result as string;
        
        setImagePreview(reader.result as string);
        setShowCropper(true);
        setZoom(1);
        // Initialize crop with selected aspect ratio
        const aspectRatio = ASPECT_RATIOS[selectedRatio];
        setCrop({
          unit: "%",
          width: 50,
          height: aspectRatio ? 50 / aspectRatio : 50,
          x: 25,
          y: 25,
        });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveImage = () => {
    setImagePreview(null);
    setShowCropper(false);
    setCrop(undefined);
    setCompletedCrop(undefined);
    setZoom(1);
    setImageDimensions(null);
    setImagePosition({ x: 0, y: 0 });
    setIsDragging(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleRatioChange = (ratio: AspectRatioType) => {
    setSelectedRatio(ratio);
    if (crop && ASPECT_RATIOS[ratio]) {
      setCrop({
        ...crop,
        height: crop.width / ASPECT_RATIOS[ratio]!,
      });
    }
  };

  const getCroppedImg = useCallback(
    async (image: HTMLImageElement, crop: PixelCrop): Promise<Blob> => {
      const canvas = document.createElement("canvas");
      const scaleX = image.naturalWidth / image.width;
      const scaleY = image.naturalHeight / image.height;
      const ctx = canvas.getContext("2d");

      if (!ctx) {
        throw new Error("No 2d context");
      }

      canvas.width = crop.width * scaleX;
      canvas.height = crop.height * scaleY;

      ctx.drawImage(
        image,
        crop.x * scaleX,
        crop.y * scaleY,
        crop.width * scaleX,
        crop.height * scaleY,
        0,
        0,
        crop.width * scaleX,
        crop.height * scaleY
      );

      return new Promise((resolve, reject) => {
        canvas.toBlob(
          (blob) => {
            if (blob) {
              resolve(blob);
            } else {
              reject(new Error("Canvas is empty"));
            }
          },
          "image/jpeg",
          0.95
        );
      });
    },
    []
  );

  const handleUpload = async () => {
    if (!completedCrop || !imgRef.current) {
      toast.error("Please select a crop area first");
      return;
    }

    try {
      setUploading(true);
      console.log(`=== IMAGE-TEXT CROP UPLOADER: Starting upload ===`);
      toast.loading(`Uploading to Image-Text (blog-content folder)...`, { id: "image-upload" });

      // Get cropped image blob
      const croppedImageBlob = await getCroppedImg(imgRef.current, completedCrop);

      // Create FormData for upload
      const formData = new FormData();
      formData.append("file", croppedImageBlob, "cropped-image.jpg");
      formData.append("type", "blog-content");

      console.log(`ImageTextCropUploader: Uploading with type: blog-content`);

      // Upload to your backend/S3
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
      console.log(`ImageTextCropUploader: Upload response:`, data);
      
      // Call the callback with uploaded image key and URL
      onImageUpload?.(data.key, data.url);

      // Reset state
      handleRemoveImage();
      
      toast.success(`Image uploaded to Image-Text! (${data.key})`, { id: "image-upload" });
    } catch (error) {
      console.error("Upload error:", error);
      toast.error("Failed to upload image. Please try again.", { id: "image-upload" });
    } finally {
      setUploading(false);
    }
  };

  const handleZoomIn = () => {
    setZoom((prev) => Math.min(prev + 0.1, 3));
    setImagePosition({ x: 0, y: 0 }); // Reset position when zooming
  };

  const handleZoomOut = () => {
    setZoom((prev) => Math.max(prev - 0.1, 0.5));
    setImagePosition({ x: 0, y: 0 }); // Reset position when zooming
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (isDragMode && e.button === 0) { // Left mouse button and drag mode enabled
      setIsDragging(true);
      setDragStart({
        x: e.clientX - imagePosition.x,
        y: e.clientY - imagePosition.y,
      });
      e.preventDefault();
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging) {
      setImagePosition({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y,
      });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleMouseLeave = () => {
    setIsDragging(false);
  };

  return (
    <>
      <div className={cn("border border-border rounded-lg overflow-hidden", className)}>
        {/* Upload Button */}
        <div className="p-4">
          <div className="flex flex-col items-center justify-center min-h-[200px] border-2 border-dashed border-border rounded-lg">
            <Crop className="h-12 w-12 text-muted-foreground mb-2" />
            <p className="text-sm text-muted-foreground mb-4">Upload an image to crop</p>
            <label htmlFor="image-uploader-upload" className="cursor-pointer">
              <Button type="button" size="sm" variant="outline" className="gap-2" asChild>
                <span>
                  <Upload className="h-4 w-4" />
                  Select Image
                </span>
              </Button>
              <input
                ref={fileInputRef}
                id="image-uploader-upload"
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                className="hidden"
              />
            </label>
          </div>
        </div>
      </div>

      {/* Crop Dialog */}
      <Dialog open={showCropper} onOpenChange={setShowCropper}>
        <DialogContent className="max-w-4xl max-h-[90vh] p-0 gap-0 flex flex-col overflow-hidden">
          <div className="p-6 pb-4 border-b shrink-0">
            <div className="flex items-start justify-between gap-4">
              <DialogHeader className="flex-1">
                <DialogTitle>Crop Image</DialogTitle>
                <DialogDescription>
                  Select aspect ratio and adjust the crop area
                  {imageDimensions && (
                    <span className="block mt-1 text-xs">
                      Original Size: {imageDimensions.width} × {imageDimensions.height} px
                    </span>
                  )}
                </DialogDescription>
              </DialogHeader>
              
              {/* Action Icons in Header */}
              <div className="flex items-center gap-2">
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        type="button"
                        size="icon"
                        variant="outline"
                        onClick={handleUpload}
                        disabled={!completedCrop || uploading}
                        className="h-9 w-9"
                      >
                        <Check className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Upload Cropped Image</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>

                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        type="button"
                        size="icon"
                        variant="outline"
                        onClick={handleRemoveImage}
                        disabled={uploading}
                        className="h-9 w-9"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Cancel</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
            </div>
          </div>

          {/* Aspect Ratio Selection */}
          <div className="flex items-center gap-2 flex-wrap px-6 py-3 border-b shrink-0 bg-muted/30">
            <span className="text-sm font-medium">Crop Size:</span>
            {(Object.keys(ASPECT_RATIOS) as AspectRatioType[]).map((ratio) => (
              <Button
                key={ratio}
                type="button"
                variant={selectedRatio === ratio ? "default" : "outline"}
                size="sm"
                onClick={() => handleRatioChange(ratio)}
              >
                {ASPECT_RATIO_LABELS[ratio]}
              </Button>
            ))}
            
            <div className="flex-1" />
            
            {/* Zoom Controls */}
            <div className="flex items-center gap-2">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      type="button"
                      size="icon"
                      variant="outline"
                      onClick={handleZoomOut}
                      disabled={zoom <= 0.5}
                      className="h-8 w-8"
                    >
                      <ZoomOut className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Zoom Out</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
              
              <span className="text-xs text-muted-foreground min-w-12 text-center">
                {Math.round(zoom * 100)}%
              </span>
              
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      type="button"
                      size="icon"
                      variant="outline"
                      onClick={handleZoomIn}
                      disabled={zoom >= 3}
                      className="h-8 w-8"
                    >
                      <ZoomIn className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Zoom In</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
              
              {/* Drag Mode Toggle */}
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      type="button"
                      size="icon"
                      variant={isDragMode ? "default" : "outline"}
                      onClick={() => setIsDragMode(!isDragMode)}
                      className="h-8 w-8"
                    >
                      <Move className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>{isDragMode ? "Crop Mode" : "Drag Mode"}</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          </div>

          {/* Crop Area with ScrollArea - Takes remaining space */}
          <div className="flex-1 overflow-hidden">
            <ScrollArea className="h-full w-full">
              {imagePreview && (
                <div 
                  ref={containerRef}
                  className="p-6 relative"
                  onMouseDown={handleMouseDown}
                  onMouseMove={handleMouseMove}
                  onMouseUp={handleMouseUp}
                  onMouseLeave={handleMouseLeave}
                  style={{ cursor: isDragging ? 'grabbing' : (isDragMode ? 'grab' : 'default') }}
                >
                  <ReactCrop
                    crop={crop}
                    onChange={(c) => setCrop(c)}
                    onComplete={(c) => setCompletedCrop(c)}
                    aspect={ASPECT_RATIOS[selectedRatio]}
                    disabled={isDragMode}
                  >
                    <img
                      ref={imgRef}
                      src={imagePreview}
                      alt="Crop preview"
                      style={{
                        transform: `scale(${zoom}) translate(${imagePosition.x / zoom}px, ${imagePosition.y / zoom}px)`,
                        transformOrigin: 'center',
                        transition: isDragging ? 'none' : 'transform 0.2s',
                        pointerEvents: 'none',
                        userSelect: 'none',
                      }}
                      className="max-w-full h-auto"
                      draggable={false}
                    />
                  </ReactCrop>
                </div>
              )}
            </ScrollArea>
          </div>

          {/* Action Buttons - Always visible at bottom */}
          <div className="flex justify-end gap-2 px-6 py-4 border-t bg-background shrink-0">
            <Button
              type="button"
              variant="outline"
              onClick={handleRemoveImage}
              disabled={uploading}
            >
              <X className="h-4 w-4 mr-2" />
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleUpload}
              disabled={!completedCrop || uploading}
            >
              <Check className="h-4 w-4 mr-2" />
              {uploading ? "Uploading..." : "Upload"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
