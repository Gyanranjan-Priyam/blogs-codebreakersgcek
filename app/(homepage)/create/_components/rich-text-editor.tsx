"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import Link from "@tiptap/extension-link";
import TextAlign from "@tiptap/extension-text-align";
import { TextStyle } from "@tiptap/extension-text-style";
import FontFamily from "@tiptap/extension-font-family";
import { Color } from "@tiptap/extension-color";
import Placeholder from "@tiptap/extension-placeholder";
import HorizontalRule from "@tiptap/extension-horizontal-rule";
import { FontSize } from "./extensions/font-size";
import {
  Bold,
  Italic,
  Underline as UnderlineIcon,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Link as LinkIcon,
  Type,
  X,
  Undo,
  Redo,
  List,
  ListOrdered,
  Minus,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Input } from "@/components/ui/input";
import { useState, useCallback, useEffect } from "react";
import { cn } from "@/lib/utils";

interface RichTextEditorProps {
  content?: string;
  onChange?: (content: string) => void;
  placeholder?: string;
  className?: string;
}

export function RichTextEditor({
  content = "",
  onChange,
  placeholder = "Start writing...",
  className,
}: RichTextEditorProps) {
  const [linkUrl, setLinkUrl] = useState("");
  const [showLinkInput, setShowLinkInput] = useState(false);

  // Parse content if it's a JSON string
  const getInitialContent = () => {
    if (!content) return "";
    try {
      // Try to parse as JSON
      const parsed = JSON.parse(content);
      return parsed;
    } catch {
      // If it's not valid JSON, return as is
      return content;
    }
  };

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3, 4, 5, 6],
        },
        horizontalRule: false, // Disable default to use custom
      }),
      Underline,
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: "text-blue-500 underline cursor-pointer",
        },
      }),
      TextAlign.configure({
        types: ["heading", "paragraph"],
        alignments: ["left", "center", "right"],
      }),
      TextStyle,
      FontFamily.configure({
        types: ["textStyle"],
      }),
      FontSize.configure({
        types: ["textStyle"],
      }),
      Color,
      HorizontalRule,
      Placeholder.configure({
        placeholder,
      }),
    ],
    content: getInitialContent(),
    editorProps: {
      attributes: {
        class:
          "prose prose-sm sm:prose lg:prose-lg xl:prose-2xl mx-auto focus:outline-none min-h-[400px] p-4 prose-ul:list-disc prose-ol:list-decimal prose-li:ml-4",
      },
    },
    onUpdate: ({ editor }) => {
      onChange?.(JSON.stringify(editor.getJSON()));
    },
  });

  // Update editor content when content prop changes
  useEffect(() => {
    if (editor && content !== JSON.stringify(editor.getJSON())) {
      const newContent = getInitialContent();
      editor.commands.setContent(newContent);
    }
  }, [content, editor]);

  const setLink = useCallback(() => {
    if (!editor || !linkUrl) return;

    if (linkUrl === "") {
      editor.chain().focus().extendMarkRange("link").unsetLink().run();
      return;
    }

    editor
      .chain()
      .focus()
      .extendMarkRange("link")
      .setLink({ href: linkUrl })
      .run();

    setLinkUrl("");
    setShowLinkInput(false);
  }, [editor, linkUrl]);

  const setFontSize = useCallback(
    (size: string) => {
      if (!editor) return;
      editor.chain().focus().setFontSize(size).run();
    },
    [editor]
  );

  const setFontFamily = useCallback(
    (font: string) => {
      if (!editor) return;
      editor.chain().focus().setFontFamily(font).run();
    },
    [editor]
  );

  if (!editor) {
    return null;
  }

  const MenuButton = ({
    onClick,
    isActive = false,
    children,
    tooltip,
  }: {
    onClick: () => void;
    isActive?: boolean;
    children: React.ReactNode;
    tooltip: string;
  }) => (
    <TooltipProvider delayDuration={300}>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onClick}
            className={cn(
              "h-8 w-8 p-0",
              isActive && "bg-accent text-accent-foreground"
            )}
          >
            {children}
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <p>{tooltip}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );

  return (
    <div className={cn("border border-border rounded-lg overflow-hidden", className)}>
      {/* Toolbar - Always visible above editor */}
      <div className="bg-muted/50 border-b border-border p-2 flex items-center gap-1 flex-wrap sticky top-0 z-10">
          {/* Undo/Redo */}
          <MenuButton
            onClick={() => editor.chain().focus().undo().run()}
            isActive={false}
            tooltip="Undo (Ctrl+Z)"
          >
            <Undo className="h-4 w-4" />
          </MenuButton>

          <MenuButton
            onClick={() => editor.chain().focus().redo().run()}
            isActive={false}
            tooltip="Redo (Ctrl+Y)"
          >
            <Redo className="h-4 w-4" />
          </MenuButton>

          <div className="w-px h-6 bg-border mx-1" />

          {/* Text Formatting */}
          <MenuButton
            onClick={() => editor.chain().focus().toggleBold().run()}
            isActive={editor.isActive("bold")}
            tooltip="Bold (Ctrl+B)"
          >
            <Bold className="h-4 w-4" />
          </MenuButton>

          <MenuButton
            onClick={() => editor.chain().focus().toggleItalic().run()}
            isActive={editor.isActive("italic")}
            tooltip="Italic (Ctrl+I)"
          >
            <Italic className="h-4 w-4" />
          </MenuButton>

          <MenuButton
            onClick={() => editor.chain().focus().toggleUnderline().run()}
            isActive={editor.isActive("underline")}
            tooltip="Underline (Ctrl+U)"
          >
            <UnderlineIcon className="h-4 w-4" />
          </MenuButton>

          <div className="w-px h-6 bg-border mx-1" />

          {/* Lists */}
          <MenuButton
            onClick={() => editor.chain().focus().toggleBulletList().run()}
            isActive={editor.isActive("bulletList")}
            tooltip="Bullet List"
          >
            <List className="h-4 w-4" />
          </MenuButton>

          <MenuButton
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
            isActive={editor.isActive("orderedList")}
            tooltip="Numbered List"
          >
            <ListOrdered className="h-4 w-4" />
          </MenuButton>

          <div className="w-px h-6 bg-border mx-1" />

          {/* Separator */}
          <MenuButton
            onClick={() => editor.chain().focus().setHorizontalRule().run()}
            isActive={false}
            tooltip="Horizontal Line"
          >
            <Minus className="h-4 w-4" />
          </MenuButton>

          <div className="w-px h-6 bg-border mx-1" />

          {/* Alignment */}
          <MenuButton
            onClick={() => editor.chain().focus().setTextAlign("left").run()}
            isActive={editor.isActive({ textAlign: "left" })}
            tooltip="Align Left"
          >
            <AlignLeft className="h-4 w-4" />
          </MenuButton>

          <MenuButton
            onClick={() => editor.chain().focus().setTextAlign("center").run()}
            isActive={editor.isActive({ textAlign: "center" })}
            tooltip="Align Center"
          >
            <AlignCenter className="h-4 w-4" />
          </MenuButton>

          <MenuButton
            onClick={() => editor.chain().focus().setTextAlign("right").run()}
            isActive={editor.isActive({ textAlign: "right" })}
            tooltip="Align Right"
          >
            <AlignRight className="h-4 w-4" />
          </MenuButton>

          <div className="w-px h-6 bg-border mx-1" />

          {/* Link */}
          {!showLinkInput ? (
            <MenuButton
              onClick={() => setShowLinkInput(true)}
              isActive={editor.isActive("link")}
              tooltip="Add Link"
            >
              <LinkIcon className="h-4 w-4" />
            </MenuButton>
          ) : (
            <div className="flex items-center gap-1">
              <Input
                type="url"
                placeholder="Enter URL"
                value={linkUrl}
                onChange={(e) => setLinkUrl(e.target.value)}
                className="h-8 w-48 text-xs"
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    setLink();
                  } else if (e.key === "Escape") {
                    setShowLinkInput(false);
                    setLinkUrl("");
                  }
                }}
                autoFocus
              />
              <Button
                type="button"
                size="sm"
                onClick={setLink}
                className="h-8 text-xs"
              >
                Add
              </Button>
              <Button
                type="button"
                size="sm"
                variant="ghost"
                onClick={() => {
                  setShowLinkInput(false);
                  setLinkUrl("");
                }}
                className="h-8 text-xs"
              >
                Cancel
              </Button>
            </div>
          )}

          <div className="w-px h-6 bg-border mx-1" />

          {/* Font Size */}
          <TooltipProvider delayDuration={300}>
            <Tooltip>
              <TooltipTrigger asChild>
                <Select onValueChange={setFontSize}>
                  <SelectTrigger className="h-8 w-20 text-xs">
                    <Type className="h-3 w-3 mr-1" />
                    <SelectValue placeholder="Size" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="12px">12px</SelectItem>
                    <SelectItem value="14px">14px</SelectItem>
                    <SelectItem value="16px">16px</SelectItem>
                    <SelectItem value="18px">18px</SelectItem>
                    <SelectItem value="20px">20px</SelectItem>
                    <SelectItem value="22px">22px</SelectItem>
                    <SelectItem value="24px">24px</SelectItem>
                    <SelectItem value="26px">26px</SelectItem>
                    <SelectItem value="28px">28px</SelectItem>
                    <SelectItem value="30px">30px</SelectItem>
                    <SelectItem value="32px">32px</SelectItem>
                  </SelectContent>
                </Select>
              </TooltipTrigger>
              <TooltipContent>
                <p>Font Size</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          {/* Font Family */}
          <TooltipProvider delayDuration={300}>
            <Tooltip>
              <TooltipTrigger asChild>
                <Select onValueChange={setFontFamily}>
                  <SelectTrigger className="h-8 w-28 text-xs">
                    <SelectValue placeholder="Font" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="monospace" className="font-mono">
                      Monospace
                    </SelectItem>
                    <SelectItem value="Inter" className="font-sans">
                      Inter
                    </SelectItem>
                    <SelectItem value="Comic Sans MS">
                      Comic Sans
                    </SelectItem>
                    <SelectItem value="serif" className="font-serif">
                      Serif
                    </SelectItem>
                  </SelectContent>
                </Select>
              </TooltipTrigger>
              <TooltipContent>
                <p>Font Family</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <div className="w-px h-6 bg-border mx-1" />

          {/* Character Counter */}
          <div className="text-xs text-muted-foreground px-2">
            {editor.storage.characterCount?.characters() || editor.state.doc.textContent.length} characters
          </div>
        </div>

      {/* Editor Content */}
      <EditorContent editor={editor} className="min-h-[400px]" />
    </div>
  );
}
