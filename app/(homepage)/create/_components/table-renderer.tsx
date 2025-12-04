"use client";

import { cn } from "@/lib/utils";
import { TableData } from "./table-editor";

interface TableRendererProps {
  data: TableData;
  className?: string;
}

export function TableRenderer({ data, className }: TableRendererProps) {
  const { rows, headers, alignment, bordered = true, striped = false } = data;

  if (!rows || rows.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        No table data available
      </div>
    );
  }

  return (
    <div className={cn("overflow-x-auto", className)}>
      <table
        className={cn(
          "w-full table-auto",
          bordered && "border border-border",
          "bg-background"
        )}
      >
        {headers && headers.length > 0 && (
          <thead className="bg-muted/50">
            <tr>
              {headers.map((header, index) => (
                <th
                  key={index}
                  className={cn(
                    "p-3 font-semibold",
                    bordered && "border border-border",
                    alignment?.[index] === "center" && "text-center",
                    alignment?.[index] === "right" && "text-right",
                    alignment?.[index] === "left" && "text-left"
                  )}
                >
                  {header}
                </th>
              ))}
            </tr>
          </thead>
        )}
        <tbody>
          {rows.map((row, rowIndex) => (
            <tr
              key={rowIndex}
              className={cn(
                striped && rowIndex % 2 === 1 && "bg-muted/30",
                "hover:bg-muted/50 transition-colors"
              )}
            >
              {row.map((cell, colIndex) => (
                <td
                  key={colIndex}
                  className={cn(
                    "p-3",
                    bordered && "border border-border",
                    alignment?.[colIndex] === "center" && "text-center",
                    alignment?.[colIndex] === "right" && "text-right",
                    alignment?.[colIndex] === "left" && "text-left"
                  )}
                >
                  {cell || <span className="text-muted-foreground italic">Empty</span>}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
