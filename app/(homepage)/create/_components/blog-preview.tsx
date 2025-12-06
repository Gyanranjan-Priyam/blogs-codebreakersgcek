"use client";

import { useState, useEffect, useRef } from "react";
import { RenderDescription } from "./render-description";
import { TableRenderer } from "./table-renderer";
import { CodeRenderer } from "./code-renderer";
import Image from "next/image";
import Link from "next/link";
import { Volume2, VolumeX, ChevronDown, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Heading {
  id: string;
  text: string;
  level: number;
  children?: Heading[];
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
  const [collapsedHeadings, setCollapsedHeadings] = useState<Set<string>>(new Set());
  const contentRef = useRef<HTMLDivElement>(null);
  const headingCounterRef = useRef(0);

  // Build hierarchical structure for headings
  const buildHeadingHierarchy = (flatHeadings: Heading[]): Heading[] => {
    const hierarchy: Heading[] = [];
    const stack: Heading[] = [];

    flatHeadings.forEach((heading) => {
      const newHeading = { ...heading, children: [] };

      while (stack.length > 0 && stack[stack.length - 1].level >= newHeading.level) {
        stack.pop();
      }

      if (stack.length === 0) {
        hierarchy.push(newHeading);
      } else {
        const parent = stack[stack.length - 1];
        if (!parent.children) parent.children = [];
        parent.children.push(newHeading);
      }

      stack.push(newHeading);
    });

    return hierarchy;
  };

  // Extract headings from components
  useEffect(() => {
    headingCounterRef.current = 0;
    const extractedHeadings: Heading[] = [];
    
    components.forEach((component) => {
      const data = componentData[component.id];
      
      if (component.type === "richtext" && data) {
        try {
          const content = typeof data === "string" ? JSON.parse(data) : data;
          const extractHeadingsFromNode = (node: any) => {
            if (!node) return;
            
            if (node.type === "heading" && node.content) {
              const text = node.content.map((n: any) => n.text || "").join("");
              if (text.trim()) {
                const id = `heading-${headingCounterRef.current++}`;
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
    
    const hierarchicalHeadings = buildHeadingHierarchy(extractedHeadings);
    setHeadings(hierarchicalHeadings);
  }, [components, componentData]);

  // Track active heading on scroll
  useEffect(() => {
    if (typeof window === "undefined") return;

    // Get all heading IDs in flat structure
    const getAllHeadingIds = (headingList: Heading[]): string[] => {
      const ids: string[] = [];
      headingList.forEach(h => {
        ids.push(h.id);
        if (h.children) {
          ids.push(...getAllHeadingIds(h.children));
        }
      });
      return ids;
    };

    const allHeadingIds = getAllHeadingIds(headings);
    if (allHeadingIds.length === 0) return;

    const handleScroll = () => {
      const headingElements = allHeadingIds
        .map(id => ({ id, element: document.getElementById(id) }))
        .filter(item => item.element !== null);
      
      if (headingElements.length === 0) return;

      const scrollPosition = window.scrollY + 150;
      
      for (let i = headingElements.length - 1; i >= 0; i--) {
        const { id, element } = headingElements[i];
        if (element && element.offsetTop <= scrollPosition) {
          setActiveHeadingId(id);
          return;
        }
      }
      
      if (headingElements[0]) {
        setActiveHeadingId(headingElements[0].id);
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    // Delay initial check to ensure DOM is ready
    const timer = setTimeout(handleScroll, 100);
    
    return () => {
      window.removeEventListener("scroll", handleScroll);
      clearTimeout(timer);
    };
  }, [headings]);

  // Add IDs to headings in the rendered content
  useEffect(() => {
    if (!contentRef.current) return;

    // Wait for content to render
    const timer = setTimeout(() => {
      if (!contentRef.current) return;

      const allHeadings = contentRef.current.querySelectorAll("h1, h2, h3, h4, h5, h6");
      
      // Get all heading IDs in order
      const getAllHeadingsFlat = (headingList: Heading[]): Heading[] => {
        const flat: Heading[] = [];
        headingList.forEach(h => {
          flat.push(h);
          if (h.children) {
            flat.push(...getAllHeadingsFlat(h.children));
          }
        });
        return flat;
      };

      const flatHeadings = getAllHeadingsFlat(headings);
      let headingIndex = 0;

      allHeadings.forEach((element) => {
        const text = element.textContent?.trim();
        if (text && headingIndex < flatHeadings.length) {
          const heading = flatHeadings[headingIndex];
          if (heading.text === text) {
            element.id = heading.id;
            element.setAttribute('data-heading-id', heading.id);
            headingIndex++;
          }
        }
      });
    }, 200);

    return () => clearTimeout(timer);
  }, [headings, components, componentData]);

  const scrollToHeading = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      const yOffset = -100;
      const y = element.getBoundingClientRect().top + window.pageYOffset + yOffset;
      window.scrollTo({ top: y, behavior: "smooth" });
      
      setHighlightedHeadingId(id);
      setTimeout(() => {
        setHighlightedHeadingId("");
      }, 2500);
    }
  };

  const toggleCollapse = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setCollapsedHeadings(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  // Add highlight effect to clicked heading
  useEffect(() => {
    if (!highlightedHeadingId) return;
    
    const element = document.getElementById(highlightedHeadingId);
    if (element) {
      const originalBg = element.style.background;
      element.style.background = "linear-gradient(180deg, transparent 60%, rgba(59, 130, 246, 0.4) 60%)";
      element.style.transition = "background 0.3s ease";
      
      setTimeout(() => {
        element.style.background = originalBg;
      }, 2500);
    }
  }, [highlightedHeadingId]);

  // Render TOC items recursively
  const renderTOCItem = (heading: Heading, depth: number = 0) => {
    const hasChildren = heading.children && heading.children.length > 0;
    const isCollapsed = collapsedHeadings.has(heading.id);
    const isActive = activeHeadingId === heading.id;

    return (
      <li key={heading.id}>
        <div className="flex items-start gap-1">
          {hasChildren && (
            <button
              onClick={(e) => toggleCollapse(heading.id, e)}
              className="shrink-0 mt-1 cursor-pointer hover:text-primary transition-colors"
              aria-label={isCollapsed ? "Expand" : "Collapse"}
            >
              {isCollapsed ? (
                <ChevronRight className="h-3 w-3" />
              ) : (
                <ChevronDown className="h-3 w-3" />
              )}
            </button>
          )}
          <button
            onClick={() => scrollToHeading(heading.id)}
            className={`
              text-left flex-1 text-sm transition-all cursor-pointer py-1 px-2 rounded
              ${!hasChildren ? 'ml-4' : ''}
              ${isActive 
                ? "text-primary font-medium bg-primary/10 border-l-2 border-primary pl-2" 
                : "text-muted-foreground hover:text-foreground hover:bg-accent/50"
              }
              ${heading.level === 1 ? "font-semibold" : ""}
            `}
          >
            {heading.text}
          </button>
        </div>
        {hasChildren && !isCollapsed && (
          <ul className="ml-3 mt-1 space-y-1 border-l border-border/50 pl-2">
            {heading.children!.map(child => renderTOCItem(child, depth + 1))}
          </ul>
        )}
      </li>
    );
  };

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
        <aside className="hidden xl:block fixed left-8 top-32 w-80 z-10">
          <div 
            className="bg-card border border-border rounded-lg p-4 shadow-sm max-h-96 flex flex-col"
            onWheel={(e) => {
              const target = e.currentTarget.querySelector('nav');
              if (target) {
                const { scrollTop, scrollHeight, clientHeight } = target;
                const isAtTop = scrollTop === 0;
                const isAtBottom = scrollTop + clientHeight >= scrollHeight - 1;
                
                if ((e.deltaY < 0 && isAtTop) || (e.deltaY > 0 && isAtBottom)) {
                  return; // Allow page scroll when at boundaries
                }
                e.stopPropagation();
              }
            }}
          >
            <h3 className="font-semibold text-base mb-3 text-foreground shrink-0">On This Page</h3>
            <nav className="overflow-y-auto flex-1 pr-2 space-y-1 scrollbar-thin scrollbar-thumb-border scrollbar-track-transparent hover:scrollbar-thumb-primary/40">
              <ul className="space-y-1">
                {headings.map(heading => renderTOCItem(heading))}
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
