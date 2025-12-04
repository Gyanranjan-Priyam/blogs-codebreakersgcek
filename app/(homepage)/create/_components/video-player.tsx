"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { AlertCircle, Video } from "lucide-react";

interface VideoPlayerProps {
  onVideoLoad?: (url: string, type: string) => void;
  initialData?: { url?: string; type?: string };
  className?: string;
}

type VideoType = "youtube" | "drive" | "cloudinary" | "direct" | null;

export function VideoPlayer({ onVideoLoad, initialData, className }: VideoPlayerProps) {
  const [videoUrl, setVideoUrl] = useState(initialData?.url || "");
  const [embedUrl, setEmbedUrl] = useState(initialData?.url || "");
  const [videoType, setVideoType] = useState<VideoType>((initialData?.type as VideoType) || null);
  const [error, setError] = useState("");

  const getYouTubeId = (url: string): string | null => {
    const patterns = [
      /(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\n?#]+)/,
      /youtube\.com\/embed\/([^&\n?#]+)/,
      /youtube\.com\/v\/([^&\n?#]+)/,
    ];

    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match) return match[1];
    }
    return null;
  };

  const getGoogleDriveId = (url: string): string | null => {
    const patterns = [
      /\/file\/d\/([^\/]+)/,
      /id=([^&\n?#]+)/,
      /\/open\?id=([^&\n?#]+)/,
    ];

    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match) return match[1];
    }
    return null;
  };

  const isCloudinaryUrl = (url: string): boolean => {
    return url.includes("cloudinary.com") || url.includes("res.cloudinary.com");
  };

  const isDirectVideoUrl = (url: string): boolean => {
    const videoExtensions = [".mp4", ".webm", ".ogg", ".mov", ".avi"];
    return videoExtensions.some((ext) => url.toLowerCase().includes(ext));
  };

  const handleLoadVideo = () => {
    setError("");
    setEmbedUrl("");
    setVideoType(null);

    if (!videoUrl.trim()) {
      setError("Please enter a video URL");
      return;
    }

    try {
      // Check for YouTube
      const youtubeId = getYouTubeId(videoUrl);
      if (youtubeId) {
        const embed = `https://www.youtube.com/embed/${youtubeId}`;
        setEmbedUrl(embed);
        setVideoType("youtube");
        onVideoLoad?.(embed, "youtube");
        return;
      }

      // Check for Google Drive
      const driveId = getGoogleDriveId(videoUrl);
      if (driveId) {
        const embed = `https://drive.google.com/file/d/${driveId}/preview`;
        setEmbedUrl(embed);
        setVideoType("drive");
        onVideoLoad?.(embed, "drive");
        return;
      }

      // Check for Cloudinary
      if (isCloudinaryUrl(videoUrl)) {
        setEmbedUrl(videoUrl);
        setVideoType("cloudinary");
        onVideoLoad?.(videoUrl, "cloudinary");
        return;
      }

      // Check for direct video URL
      if (isDirectVideoUrl(videoUrl)) {
        setEmbedUrl(videoUrl);
        setVideoType("direct");
        onVideoLoad?.(videoUrl, "direct");
        return;
      }

      setError("Invalid video URL. Please provide a YouTube, Google Drive, Cloudinary, or direct video link.");
    } catch (err) {
      setError("Failed to load video. Please check the URL and try again.");
    }
  };

  const handleClear = () => {
    setVideoUrl("");
    setEmbedUrl("");
    setVideoType(null);
    setError("");
  };

  return (
    <div className={className}>
      <Card className="p-6">
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Video className="h-5 w-5 text-muted-foreground" />
            <h3 className="text-lg font-semibold">Video Player</h3>
          </div>

          <div className="flex gap-2">
            <Input
              type="text"
              placeholder="Paste YouTube, Google Drive, Cloudinary, or direct video URL..."
              value={videoUrl}
              onChange={(e) => setVideoUrl(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleLoadVideo()}
              className="flex-1"
            />
            <Button onClick={handleLoadVideo}>Load Video</Button>
            {embedUrl && (
              <Button variant="outline" onClick={handleClear}>
                Clear
              </Button>
            )}
          </div>

          {error && (
            <div className="flex items-center gap-2 text-sm text-destructive">
              <AlertCircle className="h-4 w-4" />
              <span>{error}</span>
            </div>
          )}

          {videoType && (
            <div className="text-sm text-muted-foreground">
              <span className="font-medium">Source: </span>
              {videoType === "youtube" && "YouTube"}
              {videoType === "drive" && "Google Drive"}
              {videoType === "cloudinary" && "Cloudinary"}
              {videoType === "direct" && "Direct Video"}
            </div>
          )}

          {embedUrl && (
            <div className="relative w-full aspect-video rounded-lg overflow-hidden bg-black">
              {(videoType === "youtube" || videoType === "drive") && (
                <iframe
                  src={embedUrl}
                  className="w-full h-full"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  title="Video player"
                />
              )}
              {(videoType === "cloudinary" || videoType === "direct") && (
                <video
                  src={embedUrl}
                  controls
                  className="w-full h-full"
                  controlsList="nodownload"
                >
                  Your browser does not support the video tag.
                </video>
              )}
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}
