"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Copy, Check } from "lucide-react";
import { cn } from "@/lib/utils";

interface CodeEditorProps {
  onChange?: (data: CodeData) => void;
  initialData?: CodeData;
}

export interface CodeData {
  code: string;
  language: string;
  showLineNumbers?: boolean;
  fileName?: string;
}

const LANGUAGES = [
  { value: "javascript", label: "JavaScript" },
  { value: "typescript", label: "TypeScript" },
  { value: "python", label: "Python" },
  { value: "java", label: "Java" },
  { value: "cpp", label: "C++" },
  { value: "c", label: "C" },
  { value: "csharp", label: "C#" },
  { value: "php", label: "PHP" },
  { value: "ruby", label: "Ruby" },
  { value: "go", label: "Go" },
  { value: "rust", label: "Rust" },
  { value: "swift", label: "Swift" },
  { value: "kotlin", label: "Kotlin" },
  { value: "sql", label: "SQL" },
  { value: "html", label: "HTML" },
  { value: "css", label: "CSS" },
  { value: "json", label: "JSON" },
  { value: "yaml", label: "YAML" },
  { value: "markdown", label: "Markdown" },
  { value: "bash", label: "Bash/Shell" },
  { value: "plaintext", label: "Plain Text" },
];

export function CodeEditor({ onChange, initialData }: CodeEditorProps) {
  const [code, setCode] = useState(initialData?.code || "");
  const [language, setLanguage] = useState(initialData?.language || "javascript");
  const [showLineNumbers, setShowLineNumbers] = useState(initialData?.showLineNumbers ?? true);
  const [fileName, setFileName] = useState(initialData?.fileName || "");

  const updateData = (updates: Partial<CodeData>) => {
    const newData: CodeData = {
      code: updates.code !== undefined ? updates.code : code,
      language: updates.language !== undefined ? updates.language : language,
      showLineNumbers: updates.showLineNumbers !== undefined ? updates.showLineNumbers : showLineNumbers,
      fileName: updates.fileName !== undefined ? updates.fileName : fileName,
    };
    onChange?.(newData);
  };

  const handleCodeChange = (value: string) => {
    setCode(value);
    updateData({ code: value });
  };

  const calculateHeight = () => {
    const lineCount = code.split("\n").length;
    const minHeight = 100; // Minimum height in pixels
    const lineHeight = 24; // Height per line in pixels (matching leading-6)
    const padding = 32; // Top and bottom padding (p-4 = 16px * 2)
    const calculatedHeight = lineCount * lineHeight + padding;
    return Math.max(minHeight, Math.min(calculatedHeight, 600)); // Max 600px
  };

  const handleLanguageChange = (value: string) => {
    setLanguage(value);
    updateData({ language: value });
  };

  const handleToggleLineNumbers = () => {
    const newValue = !showLineNumbers;
    setShowLineNumbers(newValue);
    updateData({ showLineNumbers: newValue });
  };

  const handleFileNameChange = (value: string) => {
    setFileName(value);
    updateData({ fileName: value });
  };

  return (
    <div className="space-y-3">
      {/* Toolbar */}
      <div className="flex items-center gap-3 flex-wrap">
        <Select value={language} onValueChange={handleLanguageChange}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Language" />
          </SelectTrigger>
          <SelectContent>
            {LANGUAGES.map((lang) => (
              <SelectItem key={lang.value} value={lang.value}>
                {lang.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <input
          type="text"
          value={fileName}
          onChange={(e) => handleFileNameChange(e.target.value)}
          placeholder="filename.ext (optional)"
          className="flex h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 w-48"
        />

        <label className="flex items-center gap-2 text-sm cursor-pointer">
          <input
            type="checkbox"
            checked={showLineNumbers}
            onChange={handleToggleLineNumbers}
            className="rounded border-gray-300"
          />
          Line Numbers
        </label>
      </div>

      {/* Code Editor */}
      <div className="relative">
        <textarea
          value={code}
          onChange={(e) => handleCodeChange(e.target.value)}
          placeholder="Enter your code here..."
          style={{ height: `${calculateHeight()}px` }}
          className={cn(
            "w-full p-4 font-mono text-sm leading-6",
            "bg-muted/50 border border-border rounded-lg",
            "focus:outline-none focus:ring-2 focus:ring-ring",
            "resize-none overflow-auto",
            showLineNumbers && "pl-12"
          )}
          spellCheck={false}
        />
        {showLineNumbers && code && (
          <div className="absolute left-0 top-0 p-4 pr-2 text-sm font-mono text-muted-foreground select-none pointer-events-none">
            {code.split("\n").map((_, index) => (
              <div key={index} className="text-right leading-6">
                {index + 1}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Info */}
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span>
          {code.split("\n").length} lines · {code.length} characters
        </span>
        <span className="font-medium">{LANGUAGES.find(l => l.value === language)?.label}</span>
      </div>
    </div>
  );
}
