"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import Link from "@tiptap/extension-link";
import TextAlign from "@tiptap/extension-text-align";
import { TextStyle } from "@tiptap/extension-text-style";
import FontFamily from "@tiptap/extension-font-family";
import { Color } from "@tiptap/extension-color";
import { FontSize } from "./extensions/font-size";
import { cn } from "@/lib/utils";
import { useEffect } from "react";

interface RenderDescriptionProps {
  content: string;
  className?: string;
}

export function RenderDescription({ content, className }: RenderDescriptionProps) {
  let jsonContent;
  
  try {
    jsonContent = typeof content === "string" ? JSON.parse(content) : content;
  } catch (error) {
    // If parsing fails, treat it as plain text
    jsonContent = {
      type: "doc",
      content: [
        {
          type: "paragraph",
          content: [{ type: "text", text: content }],
        },
      ],
    };
  }

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3, 4, 5, 6],
        },
      }),
      Underline,
      Link.configure({
        openOnClick: true,
        HTMLAttributes: {
          class: "text-blue-500 underline cursor-pointer hover:text-blue-600",
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
    ],
    content: jsonContent,
    editable: false,
    editorProps: {
      attributes: {
        class: "prose prose-sm sm:prose lg:prose-lg xl:prose-2xl mx-auto focus:outline-none",
      },
    },
  });

  // Update editor content when content prop changes
  useEffect(() => {
    if (editor && content) {
      try {
        const parsedContent = typeof content === "string" ? JSON.parse(content) : content;
        editor.commands.setContent(parsedContent);
      } catch (error) {
        // If parsing fails, set as plain text
        editor.commands.setContent({
          type: "doc",
          content: [
            {
              type: "paragraph",
              content: [{ type: "text", text: content }],
            },
          ],
        });
      }
    }
  }, [content, editor]);

  if (!editor) {
    return null;
  }

  return (
    <div className={cn("rounded-lg", className)}>
      <EditorContent editor={editor} />
    </div>
  );
}
