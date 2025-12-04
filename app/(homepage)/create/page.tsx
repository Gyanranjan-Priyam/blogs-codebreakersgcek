"use client";

import { useState, useMemo, useEffect } from "react";
import { RichTextEditor } from "./_components/rich-text-editor";
import { RenderDescription } from "./_components/render-description";
import { ImageText } from "./_components/image-text";
import { ThumbnailUploader } from "./_components/thumbnail-uploader";
import { ContentImageUploader } from "./_components/content-image-uploader";
import { VideoPlayer } from "./_components/video-player";
import { FloatingMenubar } from "./_components/floating-menubar";
import { CreateHeader } from "./_components/create-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { X, GripVertical } from "lucide-react";
import { authClient } from "@/lib/auth-client";
import { BlogPreview } from "./_components/blog-preview";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

type ComponentType = "richtext" | "imagetext" | "imageuploader" | "videoplayer";

interface ComponentInstance {
  id: string;
  type: ComponentType;
  data?: any;
}

interface SortableItemProps {
  component: ComponentInstance;
  onRemove: (id: string) => void;
  getLabel: (type: ComponentType) => string;
  renderContent: (component: ComponentInstance) => React.ReactNode;
}

function SortableItem({ component, onRemove, getLabel, renderContent }: SortableItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: component.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="relative border rounded-lg group hover:border-primary transition-colors bg-background"
    >
      {/* Drag Handle - Top Bar */}
      <div className="flex items-center gap-2 px-4 py-2 border-b bg-muted/30 rounded-t-lg">
        <div
          {...attributes}
          {...listeners}
          className="flex items-center gap-2 flex-1 cursor-grab active:cursor-grabbing"
        >
          <GripVertical className="h-4 w-4 text-muted-foreground" />
          <span className="text-xs font-medium text-muted-foreground">
            {getLabel(component.type)}
          </span>
        </div>
        
        {/* Remove Button */}
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6 hover:bg-destructive hover:text-destructive-foreground"
          onClick={(e) => {
            e.stopPropagation();
            onRemove(component.id);
          }}
        >
          <X className="h-4 w-4" />
        </Button>
      </div>

      {/* Component Content */}
      <div className="p-4">{renderContent(component)}</div>
    </div>
  );
}

export default function CreateBlogPage() {
  const [components, setComponents] = useState<ComponentInstance[]>([]);
  const [componentData, setComponentData] = useState<Record<string, any>>({});
  const { data: session } = authClient.useSession();
  const user = session?.user;

  // Blog metadata
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [shortDescription, setShortDescription] = useState("");
  const [tags, setTags] = useState("");
  const [thumbnail, setThumbnail] = useState("");
  const [thumbnailKey, setThumbnailKey] = useState("");

  // Load draft from localStorage on mount
  useEffect(() => {
    const savedDraft = localStorage.getItem("blogDraft");
    if (savedDraft) {
      try {
        const blogData = JSON.parse(savedDraft);
        setTitle(blogData.title || "");
        setSlug(blogData.slug || "");
        setShortDescription(blogData.shortDescription || "");
        setTags(blogData.tags || "");
        setThumbnail(blogData.thumbnail || "");
        setThumbnailKey(blogData.thumbnailKey || "");
        setComponents(blogData.components || []);
        setComponentData(blogData.componentData || {});
      } catch (error) {
        console.error("Failed to load draft:", error);
      }
    }
  }, []);

  // Auto-generate slug from title
  const generateSlug = (text: string) => {
    return text
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-");
  };

  const handleTitleChange = (value: string) => {
    setTitle(value);
    setSlug(generateSlug(value));
  };

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleNext = () => {
    // Validate required fields
    if (!title.trim()) {
      alert("Please enter a blog title");
      return;
    }
    if (!shortDescription.trim()) {
      alert("Please enter a short description");
      return;
    }
    if (!tags.trim()) {
      alert("Please enter at least one tag");
      return;
    }

    // Save blog data to localStorage
    const blogData = {
      title,
      slug,
      shortDescription,
      tags,
      thumbnail,
      thumbnailKey,
      components,
      componentData,
    };
    
    localStorage.setItem("blogDraft", JSON.stringify(blogData));
    console.log("Blog saved to localStorage:", blogData);
    
    // Navigate to preview page
    window.location.href = "/create/preview";
  };

  const handleInsertComponent = (type: ComponentType) => {
    const newComponent: ComponentInstance = {
      id: `${type}-${Date.now()}`,
      type,
    };
    setComponents([...components, newComponent]);
  };

  const handleRemoveComponent = async (id: string) => {
    // Delete S3 image if component has one
    const componentToRemove = componentData[id];
    
    // Handle both direct key and imageKey (from ImageText component)
    const keyToDelete = componentToRemove?.key || componentToRemove?.imageKey;
    
    if (keyToDelete) {
      try {
        await fetch("/api/s3/delete", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ key: keyToDelete }),
        });
      } catch (error) {
        console.error("Failed to delete component image:", error);
      }
    }

    setComponents(components.filter((comp) => comp.id !== id));
    const newData = { ...componentData };
    delete newData[id];
    setComponentData(newData);
  };

  const handleComponentDataChange = (id: string, data: any) => {
    setComponentData({
      ...componentData,
      [id]: data,
    });
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      setComponents((items) => {
        const oldIndex = items.findIndex((item) => item.id === active.id);
        const newIndex = items.findIndex((item) => item.id === over.id);
        return arrayMove(items, oldIndex, newIndex);
      });
    }
  };

  const renderComponent = (component: ComponentInstance) => {
    switch (component.type) {
      case "richtext":
        return (
          <RichTextEditor
            content={componentData[component.id] || ""}
            onChange={(content) => handleComponentDataChange(component.id, content)}
            placeholder="Start writing your blog post..."
          />
        );
      case "imagetext":
        return (
          <ImageText
            initialData={componentData[component.id]}
            onContentChange={(data) => handleComponentDataChange(component.id, data)}
          />
        );
      case "imageuploader":
        return (
          <div>
            <ContentImageUploader
              initialData={componentData[component.id]}
              onImageUpload={(key, url) => {
                handleComponentDataChange(component.id, { key, url });
              }}
            />
            {componentData[component.id] && (
              <p className="text-xs text-muted-foreground mt-2">
                Image uploaded: {componentData[component.id].key}
              </p>
            )}
          </div>
        );
      case "videoplayer":
        return (
          <div>
            <VideoPlayer
              initialData={componentData[component.id]}
              onVideoLoad={(url, type) =>
                handleComponentDataChange(component.id, { url, type })
              }
            />
            {componentData[component.id]?.url && (
              <p className="text-xs text-muted-foreground mt-2">
                Video URL: {componentData[component.id].url} (
                {componentData[component.id].type})
              </p>
            )}
          </div>
        );
      default:
        return null;
    }
  };

  const getComponentLabel = (type: ComponentType) => {
    switch (type) {
      case "richtext":
        return "Rich Text Editor";
      case "imagetext":
        return "Image with Text";
      case "imageuploader":
        return "Image Uploader";
      case "videoplayer":
        return "Video Player";
      default:
        return "";
    }
  };

  const editorContent = useMemo(() => (
    <>
      {/* Blog Metadata Card */}
        <Card>
          <CardHeader>
            <CardTitle>Blog Information</CardTitle>
            <CardDescription>
              Enter the basic details about your blog post
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Title */}
            <div className="space-y-2">
              <Label htmlFor="title">
                Title <span className="text-destructive">*</span>
              </Label>
              <Input
                id="title"
                className="border-gray-400"
                placeholder="Enter blog title..."
                value={title}
                onChange={(e) => handleTitleChange(e.target.value)}
                required
              />
            </div>

            {/* Slug */}
            <div className="space-y-2">
              <Label htmlFor="slug">Slug (Auto-generated)</Label>
              <Input
                id="slug"
                placeholder="auto-generated-from-title"
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                className="font-mono text-sm border-gray-400"
              />
              <p className="text-xs text-muted-foreground">
                URL: /blog/{slug || "your-slug"}
              </p>
            </div>

            {/* Short Description */}
            <div className="space-y-2">
              <Label htmlFor="shortDescription">
                Short Description <span className="text-destructive">*</span>
              </Label>
              <Textarea
                id="shortDescription"
                className="border-gray-400"
                placeholder="Brief description of your blog post..."
                value={shortDescription}
                onChange={(e) => setShortDescription(e.target.value)}
                rows={3}
                required
              />
            </div>

            {/* Tags */}
            <div className="space-y-2">
              <Label htmlFor="tags">
                Tags <span className="text-destructive">*</span>
              </Label>
              <Input
                id="tags"
                className="border-gray-400"
                placeholder="javascript, react, nextjs (separated by commas)"
                value={tags}
                onChange={(e) => setTags(e.target.value)}
                required
              />
              <p className="text-xs text-muted-foreground">
                Separate tags with commas
              </p>
            </div>

            {/* Thumbnail */}
            <div className="space-y-2">
              <Label htmlFor="thumbnail">Thumbnail Image</Label>
              <div className="border border-gray-400 rounded-lg p-4">
                <ThumbnailUploader
                  onImageUpload={(key, url) => {
                    setThumbnailKey(key);
                    setThumbnail(url); // Use URL directly from API response
                  }}
                />
              </div>
              {thumbnail && (
                <div className="relative mt-2 w-full h-48 border rounded-lg overflow-hidden">
                  <img
                    src={thumbnail}
                    alt="Thumbnail preview"
                    className="w-full h-full object-cover"
                  />
                  <Button
                    variant="destructive"
                    size="icon"
                    className="absolute top-2 right-2 h-6 w-6"
                    onClick={async () => {
                      // Delete from S3
                      if (thumbnailKey) {
                        try {
                          await fetch("/api/s3/delete", {
                            method: "DELETE",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({ key: thumbnailKey }),
                          });
                        } catch (error) {
                          console.error("Failed to delete thumbnail:", error);
                        }
                      }
                      setThumbnail("");
                      setThumbnailKey("");
                    }}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Blog Content Canvas */}
        <Card>
          <CardHeader>
            <CardTitle>Blog Content</CardTitle>
            <CardDescription>
              Click the icons in the floating menu below to add components to your blog post.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Canvas Area - Dynamic Components */}
            {components.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <p>Click the floating menu icons to add components</p>
              </div>
            ) : (
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleDragEnd}
              >
                <SortableContext
                  items={components.map((c) => c.id)}
                  strategy={verticalListSortingStrategy}
                >
                  {components.map((component) => (
                    <SortableItem
                      key={component.id}
                      component={component}
                      onRemove={handleRemoveComponent}
                      getLabel={getComponentLabel}
                      renderContent={renderComponent}
                    />
                  ))}
                </SortableContext>
              </DndContext>
            )}

            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  setComponents([]);
                  setComponentData({});
                }}
              >
                Clear All
              </Button>
              <Button onClick={handleNext}>Next</Button>
            </div>
          </CardContent>
        </Card>
    </>
  ), [title, slug, shortDescription, tags, thumbnail, thumbnailKey, components, componentData, sensors]);

  return (
    <div className="min-h-screen bg-background pb-24">
      <CreateHeader user={user} />

      {/* Main Content */}
      <div className="max-w-5xl mx-auto p-8 space-y-6">
        {editorContent}
      </div>

      <FloatingMenubar onInsert={handleInsertComponent} />
    </div>
  );
}