"use client";

import { useState } from "react";
import { Copy, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { CodeData } from "./code-editor";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneDark, oneLight } from "react-syntax-highlighter/dist/esm/styles/prism";
import { useTheme } from "next-themes";

interface CodeRendererProps {
  data: CodeData;
  className?: string;
}

const LANGUAGE_LABELS: Record<string, string> = {
  javascript: "JavaScript",
  typescript: "TypeScript",
  python: "Python",
  java: "Java",
  cpp: "C++",
  c: "C",
  csharp: "C#",
  php: "PHP",
  ruby: "Ruby",
  go: "Go",
  rust: "Rust",
  swift: "Swift",
  kotlin: "Kotlin",
  sql: "SQL",
  html: "HTML",
  css: "CSS",
  json: "JSON",
  yaml: "YAML",
  markdown: "Markdown",
  bash: "Bash/Shell",
  plaintext: "Plain Text",
};

// Map our language codes to Prism language codes
const PRISM_LANGUAGE_MAP: Record<string, string> = {
  javascript: "javascript",
  typescript: "typescript",
  python: "python",
  java: "java",
  cpp: "cpp",
  c: "c",
  csharp: "csharp",
  php: "php",
  ruby: "ruby",
  go: "go",
  rust: "rust",
  swift: "swift",
  kotlin: "kotlin",
  sql: "sql",
  html: "markup",
  css: "css",
  json: "json",
  yaml: "yaml",
  markdown: "markdown",
  bash: "bash",
  plaintext: "text",
};

export function CodeRenderer({ data, className }: CodeRendererProps) {
  const [copied, setCopied] = useState(false);
  const { theme } = useTheme();
  const { code, language = "plaintext", showLineNumbers = true, fileName } = data;

  if (!code) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        No code available
      </div>
    );
  }

  const handleCopy = async () => {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const prismLanguage = PRISM_LANGUAGE_MAP[language] || "text";
  const syntaxTheme = theme === "dark" ? oneDark : oneLight;

  return (
    <div className={cn("rounded-lg overflow-hidden border border-border", className)}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2 bg-muted/50 border-b border-border">
        <div className="flex items-center gap-3">
          <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
            {LANGUAGE_LABELS[language] || language}
          </span>
          {fileName && (
            <>
              <span className="text-muted-foreground/50">·</span>
              <span className="text-xs font-mono text-foreground">{fileName}</span>
            </>
          )}
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleCopy}
          className="h-7 text-xs"
        >
          {copied ? (
            <>
              <Check className="h-3 w-3 mr-1" />
              Copied
            </>
          ) : (
            <>
              <Copy className="h-3 w-3 mr-1" />
              Copy
            </>
          )}
        </Button>
      </div>

      {/* Code Block with Syntax Highlighting */}
      <div className="relative overflow-x-auto">
        <SyntaxHighlighter
          language={prismLanguage}
          style={syntaxTheme}
          showLineNumbers={showLineNumbers}
          customStyle={{
            margin: 0,
            borderRadius: 0,
            background: "transparent",
            fontSize: "0.875rem",
            lineHeight: "1.5rem",
          }}
          codeTagProps={{
            style: {
              fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
            },
          }}
        >
          {code}
        </SyntaxHighlighter>
      </div>
    </div>
  );
}
