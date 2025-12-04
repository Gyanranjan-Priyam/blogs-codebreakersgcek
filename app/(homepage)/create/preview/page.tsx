"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Edit, Send } from "lucide-react";
import { BlogPreview } from "../_components/blog-preview";
import { authClient } from "@/lib/auth-client";
import { toast } from "sonner";

interface ComponentInstance {
  id: string;
  type: "richtext" | "imagetext" | "imageuploader" | "videoplayer";
  data?: any;
}

interface BlogData {
  title: string;
  slug: string;
  shortDescription: string;
  tags: string;
  thumbnail: string;
  thumbnailKey: string;
  components: ComponentInstance[];
  componentData: Record<string, any>;
}

export default function PreviewPage() {
  const router = useRouter();
  const { data: session } = authClient.useSession();
  const [blogData, setBlogData] = useState<BlogData | null>(null);
  const [publishing, setPublishing] = useState(false);

  useEffect(() => {
    // Load blog data from localStorage
    const savedData = localStorage.getItem("blogDraft");
    if (savedData) {
      setBlogData(JSON.parse(savedData));
    } else {
      // No data found, redirect back to create
      router.push("/create");
    }
  }, [router]);

  const handleModify = () => {
    // Go back to create page (data is still in localStorage)
    router.push("/create");
  };

  const handlePost = async () => {
    if (!blogData || !session?.user) {
      toast.error("Please login to publish your blog");
      return;
    }

    try {
      setPublishing(true);
      toast.loading("Publishing your blog...", { id: "publish-blog" });

      // Create the blog post
      const response = await fetch("/api/blogs/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: blogData.title,
          slug: blogData.slug,
          shortDescription: blogData.shortDescription,
          tags: blogData.tags.split(",").map(t => t.trim()).filter(Boolean),
          thumbnail: blogData.thumbnail,
          thumbnailKey: blogData.thumbnailKey,
          content: {
            components: blogData.components,
            componentData: blogData.componentData,
          },
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to publish blog");
      }

      const result = await response.json();
      
      // Clear localStorage
      localStorage.removeItem("blogDraft");
      
      toast.success("Blog published successfully!", { id: "publish-blog" });
      
      // Redirect to homepage after successful publish
      setTimeout(() => {
        router.push("/");
      }, 1000);
      
    } catch (error: any) {
      console.error("Publish error:", error);
      toast.error(error.message || "Failed to publish blog", { id: "publish-blog" });
    } finally {
      setPublishing(false);
    }
  };

  if (!blogData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-muted-foreground">Loading preview...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header with Actions */}
      <div className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/60">
        <div className="container mx-auto px-4 py-3 md:py-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push("/create")}
              className="gap-2 w-full sm:w-auto"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Create
            </Button>

            <div className="flex items-center gap-2 sm:gap-3 w-full sm:w-auto">
              <Button
                variant="outline"
                onClick={handleModify}
                className="gap-2 flex-1 sm:flex-none"
              >
                <Edit className="h-4 w-4" />
                <span className="hidden sm:inline">Modify</span>
                <span className="sm:hidden">Edit</span>
              </Button>
              <Button
                onClick={handlePost}
                disabled={publishing}
                className="gap-2 flex-1 sm:flex-none"
              >
                <Send className="h-4 w-4" />
                <span className="hidden sm:inline">{publishing ? "Publishing..." : "Publish Blog"}</span>
                <span className="sm:hidden">{publishing ? "Publishing..." : "Publish"}</span>
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Preview Content */}
      <div className="container mx-auto px-3 sm:px-4 py-6 sm:py-8">
        <div className="max-w-4xl mx-auto">
          <div className="mb-4 sm:mb-6 p-3 sm:p-4 bg-muted/50 rounded-lg border">
            <p className="text-xs sm:text-sm text-muted-foreground text-center">
              📝 This is a preview of your blog post. You can modify it or publish it to make it live.
            </p>
          </div>
          
          <BlogPreview
            title={blogData.title}
            thumbnail={blogData.thumbnail}
            shortDescription={blogData.shortDescription}
            tags={blogData.tags}
            components={blogData.components}
            componentData={blogData.componentData}
            authorName={session?.user?.name || "Anonymous"}
            publishedDate={new Date().toISOString()}
          />
        </div>
      </div>
    </div>
  );
}
