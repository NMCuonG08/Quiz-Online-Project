"use client";

import React, { useState, KeyboardEvent } from "react";
import { Button } from "@/common/components/ui/button";
import { X, Plus } from "lucide-react";
import { cn } from "@/lib/utils";

interface TagInputProps {
  label: string;
  placeholder?: string;
  value: string[];
  onChange: (tags: string[]) => void;
  error?: string;
  className?: string;
}

const TagInput: React.FC<TagInputProps> = ({
  label,
  placeholder = "Type a tag and press Enter",
  value = [],
  onChange,
  error,
  className,
}) => {
  const [inputValue, setInputValue] = useState("");

  const handleKeyPress = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      addTag();
    }
  };

  const addTag = () => {
    const trimmedValue = inputValue.trim();
    if (trimmedValue && !value.includes(trimmedValue)) {
      onChange([...value, trimmedValue]);
      setInputValue("");
    }
  };

  const removeTag = (tagToRemove: string) => {
    onChange(value.filter((tag) => tag !== tagToRemove));
  };

  return (
    <div className={cn("space-y-2", className)}>
      <label className="text-body-sm font-medium text-dark dark:text-white">
        {label}
      </label>

      <div className="space-y-3">
        {/* Input field */}
        <div className="flex gap-2">
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder={placeholder}
            className={cn(
              "flex h-10 w-full rounded-md border border-stroke bg-transparent px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 dark:border-dark-3",
              error && "border-red-500 focus-visible:ring-red-500"
            )}
          />
          <Button
            type="button"
            onClick={addTag}
            disabled={!inputValue.trim() || value.includes(inputValue.trim())}
            size="sm"
            className="px-3"
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>

        {/* Tags display */}
        {value.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {value.map((tag, index) => (
              <div
                key={index}
                className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-3 py-1 text-sm text-primary"
              >
                <span>{tag}</span>
                <button
                  type="button"
                  onClick={() => removeTag(tag)}
                  className="ml-1 rounded-full p-0.5 hover:bg-primary/20"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {error && (
        <p className="text-sm text-red-500 dark:text-red-400">{String(error)}</p>
      )}
    </div>
  );
};

export default TagInput;
