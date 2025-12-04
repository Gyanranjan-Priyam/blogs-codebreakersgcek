"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { X, Plus, ArrowLeft, GripVertical } from "lucide-react";
import { toast } from "sonner";
import { ThumbnailUploader } from "../../create/_components/thumbnail-uploader";
import { RichTextEditor } from "../../create/_components/rich-text-editor";
import { ImageText } from "../../create/_components/image-text";
import { ContentImageUploader } from "../../create/_components/content-image-uploader";
import { VideoPlayer } from "../../create/_components/video-player";
import { TableEditor } from "../../create/_components/table-editor";
import { CodeEditor } from "../../create/_components/code-editor";
import { FloatingMenubar } from "../../create/_components/floating-menubar";
import Link from "next/link";
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

interface BlogComponent {
  id: string;
  type: string;
  order: number;
  content?: any;
  text?: string | null;
  imageKey?: string | null;
  alignment?: string | null;
  videoUrl?: string | null;
  videoType?: string | null;
}

interface Blog {
  id: string;
  title: string;
  slug: string;
  shortDescription: string;
  tags: string[];
  thumbnailKey: string | null;
  published: boolean;
  components: BlogComponent[];
  user: {
    id: string;
    name: string;
    username: string | null;
  };
}

interface EditBlogClientProps {
  blog: Blog;
}

interface SortableItemProps {
  component: BlogComponent;
  index: number;
  onUpdate: (index: number, updates: Partial<BlogComponent>) => void;
  onDelete: (index: number) => void;
  renderContent: (component: BlogComponent, index: number) => React.ReactNode;
}

function SortableItem({ component, index, onUpdate, onDelete, renderContent }: SortableItemProps) {
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

  const getComponentLabel = (type: string) => {
    switch (type) {
      case "richtext": return "Rich Text";
      case "imagetext": return "Image with Text";
      case "imageuploader": return "Image";
      case "videoplayer": return "Video";
      case "table": return "Table";
      case "code": return "Code Block";
      default: return "";
    }
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
            {getComponentLabel(component.type)}
          </span>
        </div>
        
        {/* Remove Button */}
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6 hover:bg-destructive hover:text-destructive-foreground"
          onClick={(e) => {
            e.stopPropagation();
            onDelete(index);
          }}
        >
          <X className="h-4 w-4" />
        </Button>
      </div>

      {/* Component Content */}
      <div className="p-4">{renderContent(component, index)}</div>
    </div>
  );
}

export default function EditBlogClient({ blog }: EditBlogClientProps) {
  const router = useRouter();
  const [title, setTitle] = useState(blog.title);
  const [shortDescription, setShortDescription] = useState(blog.shortDescription);
  const [tags, setTags] = useState<string[]>(blog.tags);
  const [tagInput, setTagInput] = useState("");
  const [thumbnailKey, setThumbnailKey] = useState<string | null>(blog.thumbnailKey);
  const [components, setComponents] = useState<BlogComponent[]>(blog.components);
  const [deletedImageKeys, setDeletedImageKeys] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);

  const handleAddTag = () => {
    if (tagInput.trim() && !tags.includes(tagInput.trim())) {
      setTags([...tags, tagInput.trim()]);
      setTagInput("");
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter(tag => tag !== tagToRemove));
  };

  const handleAddComponent = (type: string) => {
    const newComponent: BlogComponent = {
      id: `temp-${Date.now()}`,
      type,
      order: components.length,
      content: type === "richtext" ? null : undefined,
      text: type === "imagetext" ? "" : null,
      imageKey: ["imagetext", "imageuploader"].includes(type) ? null : undefined,
      alignment: type === "imagetext" ? "left" : null,
      videoUrl: type === "videoplayer" ? "" : null,
      videoType: type === "videoplayer" ? "youtube" : null,
    };
    setComponents([...components, newComponent]);
  };

  const handleUpdateComponent = (index: number, updates: Partial<BlogComponent>) => {
    const updated = [...components];
    const currentComponent = updated[index];
    
    // If updating imageKey and old one exists, mark it for deletion
    if ('imageKey' in updates && currentComponent.imageKey && updates.imageKey !== currentComponent.imageKey) {
      setDeletedImageKeys(prev => [...prev, currentComponent.imageKey!]);
    }
    
    updated[index] = { ...updated[index], ...updates };
    setComponents(updated);
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

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDeleteComponent = async (index: number) => {
    const component = components[index];
    
    // If component has an image, mark it for deletion
    if (component.imageKey) {
      setDeletedImageKeys(prev => [...prev, component.imageKey!]);
    }

    const updated = components.filter((_, i) => i !== index);
    // Reorder remaining components
    const reordered = updated.map((comp, idx) => ({ ...comp, order: idx }));
    setComponents(reordered);
  };

  const handleThumbnailDelete = async (key: string) => {
    setDeletedImageKeys(prev => [...prev, key]);
    setThumbnailKey(null);
  };

  const handleSave = async (publish: boolean) => {
    if (!title.trim()) {
      toast.error("Title is required");
      return;
    }

    if (!shortDescription.trim()) {
      toast.error("Short description is required");
      return;
    }

    if (tags.length === 0) {
      toast.error("At least one tag is required");
      return;
    }

    setSaving(true);

    try {
      // Delete removed images from S3
      if (deletedImageKeys.length > 0) {
        await fetch("/api/s3/delete", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ keys: deletedImageKeys }),
        });
      }

      // Update blog
      const response = await fetch(`/api/blogs/${blog.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          shortDescription,
          tags,
          thumbnailKey,
          components: components.map(({ id, ...comp }) => comp),
          published: publish,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to update blog");
      }

      const data = await response.json();
      toast.success(publish ? "Blog published successfully!" : "Blog saved as draft!");
      
      router.push(`/blogs/${data.blog.slug}`);
    } catch (error) {
      console.error("Error updating blog:", error);
      toast.error("Failed to update blog");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background/80 backdrop-blur border-b border-border">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href={`/blogs/${blog.slug}`}>
              <Button variant="ghost" size="sm">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
            </Link>
            <h1 className="text-xl font-bold">Edit Blog</h1>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleSave(false)}
              disabled={saving}
            >
              {saving ? "Saving..." : "Save Draft"}
            </Button>
            <Button
              variant="default"
              size="sm"
              onClick={() => handleSave(true)}
              disabled={saving}
            >
              {saving ? "Publishing..." : "Publish"}
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Title */}
        <div className="mb-6">
          <Label htmlFor="title" className="text-lg font-semibold mb-2">
            Blog Title
          </Label>
          <Input
            id="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Enter your blog title..."
            className="text-lg"
          />
        </div>

        {/* Short Description */}
        <div className="mb-6">
          <Label htmlFor="description" className="text-lg font-semibold mb-2">
            Short Description
          </Label>
          <Input
            id="description"
            value={shortDescription}
            onChange={(e) => setShortDescription(e.target.value)}
            placeholder="Brief description of your blog..."
          />
        </div>

        {/* Tags */}
        <div className="mb-6">
          <Label className="text-lg font-semibold mb-2">Tags</Label>
          <div className="flex gap-2 mb-2">
            <Input
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyPress={(e) => e.key === "Enter" && (e.preventDefault(), handleAddTag())}
              placeholder="Add a tag..."
            />
            <Button onClick={handleAddTag} variant="outline">
              <Plus className="h-4 w-4" />
            </Button>
          </div>
          <div className="flex flex-wrap gap-2">
            {tags.map((tag, index) => (
              <Badge key={index} variant="secondary" className="flex items-center gap-1">
                {tag}
                <X
                  className="h-3 w-3 cursor-pointer"
                  onClick={() => handleRemoveTag(tag)}
                />
              </Badge>
            ))}
          </div>
        </div>

        {/* Thumbnail */}
        <div className="mb-8">
          <Label className="text-lg font-semibold mb-2">Thumbnail Image</Label>
          {thumbnailKey ? (
            <div className="relative w-full h-64">
              <img
                src={`https://${process.env.NEXT_PUBLIC_S3_BUCKET_NAME_IMAGES}.t3.storage.dev/${thumbnailKey}`}
                alt="Thumbnail"
                className="w-full h-full object-cover rounded-lg"
              />
              <Button
                variant="destructive"
                size="sm"
                onClick={() => handleThumbnailDelete(thumbnailKey)}
                className="absolute top-2 right-2"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          ) : (
            <ThumbnailUploader
              onImageUpload={(imageKey: string) => setThumbnailKey(imageKey)}
            />
          )}
        </div>

        {/* Blog Components */}
        <div className="space-y-6 mb-8">
          <Label className="text-lg font-semibold">Blog Content</Label>
          
          <DndContext
            sensors={sensors}
            onDragEnd={handleDragEnd}
            collisionDetection={closestCenter}
          >
            <SortableContext
              items={components.map((c) => c.id)}
              strategy={verticalListSortingStrategy}
            >
              {components.map((component, index) => (
                <SortableItem
                  key={component.id}
                  component={component}
                  index={index}
                  onUpdate={handleUpdateComponent}
                  onDelete={handleDeleteComponent}
                  renderContent={(comp, idx) => {
                    if (comp.type === "richtext") {
                      return (
                        <RichTextEditor
                          content={JSON.stringify(comp.content)}
                          onChange={(content: string) => {
                            try {
                              const parsed = JSON.parse(content);
                              handleUpdateComponent(idx, { content: parsed });
                            } catch {
                              handleUpdateComponent(idx, { content });
                            }
                          }}
                        />
                      );
                    }

                    if (comp.type === "imagetext") {
                      return (
                        <ImageText
                          onContentChange={(data: any) => {
                            handleUpdateComponent(idx, {
                              text: data.text,
                              imageKey: data.imageKey,
                              alignment: data.alignment
                            });
                          }}
                          initialData={{
                            text: comp.text || "",
                            imageKey: comp.imageKey || undefined,
                            image: comp.imageKey ? `https://${process.env.NEXT_PUBLIC_S3_BUCKET_NAME_IMAGES}.t3.storage.dev/${comp.imageKey}` : undefined,
                            alignment: (comp.alignment as "left" | "right") || "left"
                          }}
                        />
                      );
                    }

                    if (comp.type === "imageuploader") {
                      return (
                        <ContentImageUploader
                          onImageUpload={(imageKey: string) => handleUpdateComponent(idx, { imageKey })}
                          initialData={{
                            key: comp.imageKey || undefined,
                            url: comp.imageKey ? `https://${process.env.NEXT_PUBLIC_S3_BUCKET_NAME_IMAGES}.t3.storage.dev/${comp.imageKey}` : undefined
                          }}
                        />
                      );
                    }

                    if (comp.type === "videoplayer") {
                      return (
                        <VideoPlayer
                          onVideoLoad={(url: string, type: string) => {
                            handleUpdateComponent(idx, {
                              videoUrl: url,
                              videoType: type
                            });
                          }}
                          initialData={{
                            url: comp.videoUrl || "",
                            type: comp.videoType || "youtube"
                          }}
                        />
                      );
                    }

                    if (comp.type === "table") {
                      return (
                        <TableEditor
                          initialData={comp.content as any}
                          onChange={(data: any) => {
                            handleUpdateComponent(idx, { content: data });
                          }}
                        />
                      );
                    }

                    if (comp.type === "code") {
                      return (
                        <CodeEditor
                          initialData={comp.content as any}
                          onChange={(data: any) => {
                            handleUpdateComponent(idx, { content: data });
                          }}
                        />
                      );
                    }

                    return null;
                  }}
                />
              ))}
            </SortableContext>
          </DndContext>
        </div>
      </div>

      {/* Floating Menubar */}
      <FloatingMenubar
        onInsert={(type) => handleAddComponent(type)}
      />
    </div>
  );
}
