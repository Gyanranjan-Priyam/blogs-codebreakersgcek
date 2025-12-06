"use client";

import { useState, useEffect, useRef } from "react";
import { RenderDescription } from "./render-description";
import { TableRenderer } from "./table-renderer";
import { CodeRenderer } from "./code-renderer";
import Image from "next/image";
import Link from "next/link";
import { Volume2, VolumeX } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Heading {
  id: string;
  text: string;
  level: number;
}

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
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [headings, setHeadings] = useState<Heading[]>([]);
  const [activeHeadingId, setActiveHeadingId] = useState<string>("");
  const [highlightedHeadingId, setHighlightedHeadingId] = useState<string>("");
  const contentRef = useRef<HTMLDivElement>(null);

  // Extract headings from components
  useEffect(() => {
    const extractedHeadings: Heading[] = [];
    
    components.forEach((component, index) => {
      const data = componentData[component.id];
      
      if (component.type === "richtext" && data) {
        try {
          const content = typeof data === "string" ? JSON.parse(data) : data;
          const extractHeadingsFromNode = (node: any) => {
            if (!node) return;
            
            if (node.type === "heading" && node.content) {
              const text = node.content.map((n: any) => n.text || "").join("");
              if (text.trim()) {
                const id = `heading-${index}-${extractedHeadings.length}`;
                extractedHeadings.push({
                  id,
                  text: text.trim(),
                  level: node.attrs?.level || 1,
                });
              }
            }
            
            if (node.content && Array.isArray(node.content)) {
              node.content.forEach(extractHeadingsFromNode);
            }
          };
          
          extractHeadingsFromNode(content);
        } catch (e) {
          // Skip invalid content
        }
      }
    });
    
    setHeadings(extractedHeadings);
  }, [components, componentData]);

  // Track active heading on scroll
  useEffect(() => {
    if (typeof window === "undefined" || headings.length === 0) return;

    const handleScroll = () => {
      const headingElements = headings.map(h => document.getElementById(h.id)).filter(Boolean);
      
      if (headingElements.length === 0) return;

      const scrollPosition = window.scrollY + 100; // Offset for better UX
      
      for (let i = headingElements.length - 1; i >= 0; i--) {
        const element = headingElements[i];
        if (element && element.offsetTop <= scrollPosition) {
          setActiveHeadingId(headings[i].id);
          return;
        }
      }
      
      setActiveHeadingId(headings[0]?.id || "");
    };

    window.addEventListener("scroll", handleScroll);
    handleScroll(); // Initial check
    
    return () => window.removeEventListener("scroll", handleScroll);
  }, [headings]);

  // Add IDs to headings in the rendered content
  useEffect(() => {
    if (!contentRef.current) return;

    const allHeadings = contentRef.current.querySelectorAll("h1, h2, h3, h4, h5, h6");
    allHeadings.forEach((heading, index) => {
      const matchingHeading = headings.find((h) => 
        h.text === heading.textContent?.trim()
      );
      if (matchingHeading) {
        heading.id = matchingHeading.id;
      }
    });
  }, [headings, components]);

  const scrollToHeading = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      const yOffset = -80; // Offset for fixed header
      const y = element.getBoundingClientRect().top + window.pageYOffset + yOffset;
      window.scrollTo({ top: y, behavior: "smooth" });
      
      // Highlight the heading for 2 seconds
      setHighlightedHeadingId(id);
      setTimeout(() => {
        setHighlightedHeadingId("");
      }, 2000);
    }
  };

  // Add highlight effect to clicked heading
  useEffect(() => {
    if (!highlightedHeadingId) return;
    
    const element = document.getElementById(highlightedHeadingId);
    if (element) {
      // Apply marker-style highlighting
      element.style.background = "linear-gradient(180deg, transparent 50%, rgba(var(--primary-rgb, 99, 102, 241), 0.3) 50%)";
      element.style.transition = "all 0.3s ease";
      element.style.backgroundSize = "100% 200%";
      element.style.backgroundPosition = "0 0";
      
      // Animate the highlight
      setTimeout(() => {
        element.style.backgroundPosition = "0 100%";
      }, 50);
      
      // Remove highlight after 2 seconds
      setTimeout(() => {
        element.style.backgroundPosition = "0 0";
        setTimeout(() => {
          element.style.background = "";
          element.style.backgroundSize = "";
          element.style.backgroundPosition = "";
        }, 300);
      }, 2000);
    }
  }, [highlightedHeadingId]);

  const extractTextFromComponents = () => {
    let fullText = `${title}. ${shortDescription || ""}. `;
    
    components.forEach((component) => {
      const data = componentData[component.id];
      
      if (component.type === "richtext" && data) {
        try {
          const content = typeof data === "string" ? JSON.parse(data) : data;
          const extractTextFromNode = (node: any): string => {
            if (!node) return "";
            if (typeof node === "string") return node;
            
            let text = "";
            if (node.text) {
              text += node.text;
            }
            if (node.content && Array.isArray(node.content)) {
              text += node.content.map(extractTextFromNode).join(" ");
            }
            return text;
          };
          fullText += extractTextFromNode(content) + ". ";
        } catch (e) {
          // Skip invalid content
        }
      } else if (component.type === "imagetext" && data?.text) {
        fullText += data.text + ". ";
      }
    });
    
    return fullText;
  };

  const toggleTextToSpeech = () => {
    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    } else {
      const text = extractTextFromComponents();
      const utterance = new SpeechSynthesisUtterance(text);
      
      utterance.onend = () => {
        setIsSpeaking(false);
      };
      
      utterance.onerror = () => {
        setIsSpeaking(false);
      };
      
      window.speechSynthesis.speak(utterance);
      setIsSpeaking(true);
    }
  };

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
    <div className="relative">
      {/* Table of Contents - Desktop Only */}
      {headings.length > 0 && (
        <aside className="hidden xl:block fixed left-8 top-32 w-80 max-h-[calc(100vh-200px)]">
          <div className="bg-card border border-border rounded-lg p-4 shadow-sm h-full flex flex-col">
            <h3 className="font-semibold text-sm mb-3 text-foreground shrink-0">Table of Contents</h3>
            <nav className="overflow-y-auto flex-1 pr-2 scrollbar-thin scrollbar-thumb-primary/20 scrollbar-track-transparent">
              <ul className="space-y-2">
                {headings.map((heading) => (
                  <li key={heading.id}>
                    <button
                      onClick={() => scrollToHeading(heading.id)}
                      className={`
                        text-left w-full text-sm transition-all cursor-pointer
                        ${activeHeadingId === heading.id 
                          ? "text-primary font-medium border-l-2 border-primary pl-3" 
                          : "text-muted-foreground hover:text-foreground pl-3 border-l-2 border-transparent"
                        }
                        ${heading.level === 1 ? "font-semibold" : ""}
                        ${heading.level === 2 ? "pl-3" : ""}
                        ${heading.level === 3 ? "pl-5" : ""}
                        ${heading.level >= 4 ? "pl-7 text-xs" : ""}
                      `}
                      style={{
                        paddingLeft: `${(heading.level - 1) * 12 + 12}px`,
                      }}
                    >
                      {heading.text}
                    </button>
                  </li>
                ))}
              </ul>
            </nav>
          </div>
        </aside>
      )}

      <article className="max-w-4xl mx-auto bg-background" ref={contentRef}>
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
            <span className="text-muted-foreground/60">•</span>
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleTextToSpeech}
              className="flex items-center gap-1 h-auto p-1 cursor-pointer hover:text-primary"
              title={isSpeaking ? "Stop reading" : "Read blog aloud"}
            >
              {isSpeaking ? (
                <VolumeX className="h-5 w-5" />
              ) : (
                <Volume2 className="h-5 w-5" />
              )}
            </Button>
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
    </div>
  );
}
