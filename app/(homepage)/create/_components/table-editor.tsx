"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Trash2, ArrowUp, ArrowDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface TableEditorProps {
  onChange?: (data: TableData) => void;
  initialData?: TableData;
}

export interface TableData {
  rows: string[][];
  headers?: string[];
  alignment?: ("left" | "center" | "right")[];
  bordered?: boolean;
  striped?: boolean;
}

export function TableEditor({ onChange, initialData }: TableEditorProps) {
  const [headers, setHeaders] = useState<string[]>(
    initialData?.headers || ["Column 1", "Column 2", "Column 3"]
  );
  const [rows, setRows] = useState<string[][]>(
    initialData?.rows || [
      ["", "", ""],
      ["", "", ""],
    ]
  );
  const [alignment, setAlignment] = useState<("left" | "center" | "right")[]>(
    initialData?.alignment || headers.map(() => "left")
  );
  const [bordered, setBordered] = useState(initialData?.bordered ?? true);
  const [striped, setStriped] = useState(initialData?.striped ?? false);

  const updateTableData = (
    newRows: string[][],
    newHeaders: string[],
    newAlignment: ("left" | "center" | "right")[]
  ) => {
    const data: TableData = {
      rows: newRows,
      headers: newHeaders,
      alignment: newAlignment,
      bordered,
      striped,
    };
    onChange?.(data);
  };

  const addColumn = () => {
    const newHeaders = [...headers, `Column ${headers.length + 1}`];
    const newRows = rows.map((row) => [...row, ""]);
    const newAlignment = [...alignment, "left" as const];
    setHeaders(newHeaders);
    setRows(newRows);
    setAlignment(newAlignment);
    updateTableData(newRows, newHeaders, newAlignment);
  };

  const removeColumn = (index: number) => {
    if (headers.length <= 1) return;
    const newHeaders = headers.filter((_, i) => i !== index);
    const newRows = rows.map((row) => row.filter((_, i) => i !== index));
    const newAlignment = alignment.filter((_, i) => i !== index);
    setHeaders(newHeaders);
    setRows(newRows);
    setAlignment(newAlignment);
    updateTableData(newRows, newHeaders, newAlignment);
  };

  const addRow = () => {
    const newRow = headers.map(() => "");
    const newRows = [...rows, newRow];
    setRows(newRows);
    updateTableData(newRows, headers, alignment);
  };

  const removeRow = (index: number) => {
    if (rows.length <= 1) return;
    const newRows = rows.filter((_, i) => i !== index);
    setRows(newRows);
    updateTableData(newRows, headers, alignment);
  };

  const moveRow = (index: number, direction: "up" | "down") => {
    if (direction === "up" && index === 0) return;
    if (direction === "down" && index === rows.length - 1) return;

    const newRows = [...rows];
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    [newRows[index], newRows[targetIndex]] = [newRows[targetIndex], newRows[index]];
    setRows(newRows);
    updateTableData(newRows, headers, alignment);
  };

  const updateHeader = (index: number, value: string) => {
    const newHeaders = [...headers];
    newHeaders[index] = value;
    setHeaders(newHeaders);
    updateTableData(rows, newHeaders, alignment);
  };

  const updateCell = (rowIndex: number, colIndex: number, value: string) => {
    const newRows = [...rows];
    newRows[rowIndex][colIndex] = value;
    setRows(newRows);
    updateTableData(newRows, headers, alignment);
  };

  const updateAlignment = (index: number, value: "left" | "center" | "right") => {
    const newAlignment = [...alignment];
    newAlignment[index] = value;
    setAlignment(newAlignment);
    updateTableData(rows, headers, newAlignment);
  };

  const toggleBordered = () => {
    const newBordered = !bordered;
    setBordered(newBordered);
    updateTableData(rows, headers, alignment);
  };

  const toggleStriped = () => {
    const newStriped = !striped;
    setStriped(newStriped);
    updateTableData(rows, headers, alignment);
  };

  return (
    <div className="space-y-4">
      {/* Table Options */}
      <div className="flex items-center gap-4 flex-wrap">
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={bordered}
            onChange={toggleBordered}
            className="rounded border-gray-300"
          />
          Bordered
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={striped}
            onChange={toggleStriped}
            className="rounded border-gray-300"
          />
          Striped Rows
        </label>
        <Button onClick={addColumn} size="sm" variant="outline">
          <Plus className="h-4 w-4 mr-1" />
          Add Column
        </Button>
        <Button onClick={addRow} size="sm" variant="outline">
          <Plus className="h-4 w-4 mr-1" />
          Add Row
        </Button>
      </div>

      {/* Table Editor */}
      <div className="overflow-x-auto">
        <table
          className={cn(
            "w-full table-auto",
            bordered && "border border-border",
            "bg-background"
          )}
        >
          <thead className="bg-muted/50">
            <tr>
              <th className="w-12"></th>
              {headers.map((header, colIndex) => (
                <th
                  key={colIndex}
                  className={cn(
                    "p-2",
                    bordered && "border border-border"
                  )}
                >
                  <div className="space-y-2">
                    <div className="flex items-center gap-1">
                      <Input
                        value={header}
                        onChange={(e) => updateHeader(colIndex, e.target.value)}
                        className="h-8 text-sm font-semibold"
                        placeholder={`Column ${colIndex + 1}`}
                      />
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 hover:bg-destructive hover:text-destructive-foreground"
                        onClick={() => removeColumn(colIndex)}
                        disabled={headers.length <= 1}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                    <Select
                      value={alignment[colIndex]}
                      onValueChange={(value: "left" | "center" | "right") =>
                        updateAlignment(colIndex, value)
                      }
                    >
                      <SelectTrigger className="h-7 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="left">Left</SelectItem>
                        <SelectItem value="center">Center</SelectItem>
                        <SelectItem value="right">Right</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, rowIndex) => (
              <tr
                key={rowIndex}
                className={cn(
                  striped && rowIndex % 2 === 1 && "bg-muted/30"
                )}
              >
                <td className="p-1">
                  <div className="flex flex-col gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6"
                      onClick={() => moveRow(rowIndex, "up")}
                      disabled={rowIndex === 0}
                    >
                      <ArrowUp className="h-3 w-3" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6"
                      onClick={() => moveRow(rowIndex, "down")}
                      disabled={rowIndex === rows.length - 1}
                    >
                      <ArrowDown className="h-3 w-3" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 hover:bg-destructive hover:text-destructive-foreground"
                      onClick={() => removeRow(rowIndex)}
                      disabled={rows.length <= 1}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </td>
                {row.map((cell, colIndex) => (
                  <td
                    key={colIndex}
                    className={cn(
                      "p-2",
                      bordered && "border border-border",
                      alignment[colIndex] === "center" && "text-center",
                      alignment[colIndex] === "right" && "text-right"
                    )}
                  >
                    <Input
                      value={cell}
                      onChange={(e) => updateCell(rowIndex, colIndex, e.target.value)}
                      className="h-8 text-sm"
                      placeholder="Enter text"
                    />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
