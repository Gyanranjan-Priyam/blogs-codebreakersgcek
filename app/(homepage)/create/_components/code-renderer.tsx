"use client";

import { useState } from "react";
import { Copy, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { CodeData } from "./code-editor";

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

export function CodeRenderer({ data, className }: CodeRendererProps) {
  const [copied, setCopied] = useState(false);
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

  const lines = code.split("\n");

  return (
    <div className={cn("rounded-lg overflow-hidden border border-border bg-muted/30", className)}>
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

      {/* Code Block */}
      <div className="relative overflow-x-auto">
        <pre className="p-4 text-sm font-mono leading-6 bg-muted/50">
          <code className="block">
            {showLineNumbers ? (
              <table className="w-full border-collapse">
                <tbody>
                  {lines.map((line, index) => (
                    <tr key={index}>
                      <td className="pr-4 text-right text-muted-foreground select-none w-12 align-top">
                        {index + 1}
                      </td>
                      <td className="whitespace-pre-wrap break-all">
                        {line || "\n"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="whitespace-pre-wrap break-all">{code}</div>
            )}
          </code>
        </pre>
      </div>
    </div>
  );
}
