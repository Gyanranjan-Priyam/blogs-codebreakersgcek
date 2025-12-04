"use client";

import { RenderDescription } from "./render-description";
import { TableRenderer } from "./table-renderer";
import { CodeRenderer } from "./code-renderer";
import Image from "next/image";
import Link from "next/link";

interface ComponentInstance {
  id: string;
  type: "richtext" | "imagetext" | "imageuploader" | "videoplayer" | "table" | "code";
  data?: any;
}

interface BlogPreviewProps {
  title: string;
  thumbnail: string;
  shortDescription: string;
  tags: string;
  components: ComponentInstance[];
  componentData: Record<string, any>;
  authorName?: string;
  authorUsername?: string | null;
  publishedDate?: string;
}

export function BlogPreview({
  title,
  thumbnail,
  shortDescription,
  tags,
  components,
  componentData,
  authorName,
  authorUsername,
  publishedDate,
}: BlogPreviewProps) {
  const tagList = tags.split(",").map((t) => t.trim()).filter(Boolean);

  const renderPreviewComponent = (component: ComponentInstance) => {
    const data = componentData[component.id];

    switch (component.type) {
      case "richtext":
        if (!data) return null;
        try {
          const content = typeof data === "string" ? JSON.parse(data) : data;
          return (
            <div className="prose prose-lg max-w-none dark:prose-invert">
              <RenderDescription content={content} />
            </div>
          );
        } catch {
          return null;
        }

      case "imagetext":
        if (!data?.text && !data?.image) return null;
        return (
          <div className="clear-both">
            {data.image && (
              <img
                src={data.image}
                alt="Content"
                className={`
                  w-full sm:w-1/2 md:w-2/5 lg:w-1/3
                  h-auto object-cover rounded-lg mb-4 sm:mb-0
                  ${data.alignment === "right" 
                    ? "sm:float-right sm:ml-6" 
                    : "sm:float-left sm:mr-6"
                  }
                `}
              />
            )}
            {data.text && (
              <div className="text-base leading-relaxed whitespace-pre-wrap">
                {data.text}
              </div>
            )}
            <div className="clear-both"></div>
          </div>
        );

      case "imageuploader":
        if (!data?.url) return null;
        return (
          <div className="w-full rounded-lg overflow-hidden">
            <img
              src={data.url}
              alt="Blog content"
              className="w-full h-auto object-cover"
            />
          </div>
        );

      case "videoplayer":
        if (!data?.url) return null;
        return (
          <div className="w-full aspect-video rounded-lg overflow-hidden bg-black">
            <iframe
              src={data.url}
              className="w-full h-full"
              allowFullScreen
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            />
          </div>
        );

      case "table":
        if (!data) return null;
        return <TableRenderer data={data} className="my-6" />;

      case "code":
        if (!data) return null;
        return <CodeRenderer data={data} className="my-6" />;

      default:
        return null;
    }
  };

  return (
    <article className="max-w-4xl mx-auto bg-background">
      {/* Header */}
      <header className="mb-8">
        {thumbnail && (
          <div className="w-full h-64 md:h-96 rounded-xl overflow-hidden mb-6">
            <img
              src={thumbnail}
              alt={title}
              className="w-full h-full object-cover"
            />
          </div>
        )}
        
        <h1 className="text-4xl md:text-5xl font-bold mb-4 leading-tight">
          {title || "Untitled Blog Post"}
        </h1>
        
        {shortDescription && (
          <p className="text-xl text-muted-foreground mb-4">
            {shortDescription}
          </p>
        )}
        
        {/* Author and Date */}
        {(authorName || publishedDate) && (
          <div className="flex items-center gap-3 text-sm text-muted-foreground mb-4">
            {authorName && (
              <div className="flex items-center gap-2">
                {authorUsername ? (
                  <Link href={`/profile/${authorUsername}`} className="hover:underline">
                    <span className="font-medium text-foreground">By {authorName}</span>
                  </Link>
                ) : (
                  <span className="font-medium text-foreground">By {authorName}</span>
                )}
              </div>
            )}
            {authorName && publishedDate && (
              <span className="text-muted-foreground/60">•</span>
            )}
            {publishedDate && (
              <time dateTime={publishedDate}>
                {new Date(publishedDate).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </time>
            )}
          </div>
        )}
        
        {tagList.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {tagList.map((tag, index) => (
              <span
                key={index}
                className="px-3 py-1 bg-primary/10 text-primary rounded-full text-sm font-medium"
              >
                #{tag}
              </span>
            ))}
          </div>
        )}
      </header>

      {/* Content */}
      <div className="space-y-8">
        {components.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <p>No content added yet</p>
          </div>
        ) : (
          components.map((component) => (
            <div key={component.id} className="animate-in fade-in">
              {renderPreviewComponent(component)}
            </div>
          ))
        )}
      </div>
    </article>
  );
}
