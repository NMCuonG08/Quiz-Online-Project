import React from "react";
import { X, Image as ImageIcon } from "lucide-react";
import { Input } from "@/common/components/ui/input";
import { Checkbox } from "@/common/components/ui/checkbox";
import { Textarea } from "@/common/components/ui/textarea";
import { Button } from "@/common/components/ui/button";
import { UploadImage } from "@/common/components/ui/upload-image";
import type { QuestionOption } from "../types";

// Strategy Pattern for Question Option UI Rendering
export interface OptionRenderer {
  render(
    option: QuestionOption,
    onChange: (patch: Partial<QuestionOption>) => void,
    onRemove?: () => void
  ): React.ReactNode;
}

// Compact Image Upload Component to save space
const CompactImageUpload: React.FC<{
  value: any;
  onChange: (file: File | null) => void;
}> = ({ value, onChange }) => {
  const [showUpload, setShowUpload] = React.useState(!!value);

  // Update showUpload if value changes externally (like when clearing)
  React.useEffect(() => {
    if (value) setShowUpload(true);
  }, [value]);

  if (!showUpload) {
    return (
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="h-8 text-xs gap-1.5 bg-blue-50 text-blue-600 hover:bg-blue-100 hover:text-blue-700 border-blue-200 dark:bg-blue-900/20 dark:text-blue-400 dark:hover:bg-blue-900/40 dark:border-blue-800/50"
        onClick={() => setShowUpload(true)}
      >
        <ImageIcon className="w-3.5 h-3.5" />
        Add Image (Optional)
      </Button>
    );
  }

  return (
    <div className="space-y-1 mt-1 border rounded-md p-2 bg-gray-50/50 dark:bg-[#020D1A] border-dashed border-gray-200 dark:border-[#1e293b]">
      <div className="flex items-center justify-between mb-1">
        <span className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest flex items-center gap-1.5">
          <ImageIcon className="w-3 h-3" />
          Option Image
        </span>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-5 w-5 p-0 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20"
          onClick={() => {
            onChange(null);
            setShowUpload(false);
          }}
          title="Remove property"
        >
          <X className="h-3 w-3" />
        </Button>
      </div>
      <UploadImage
        value={value}
        onChange={onChange}
        placeholder="Drop or click to upload"
        maxSize={2}
        className="!h-24 dark:!bg-[#020D1A]" // Force background
      />
    </div>
  );
};

// Multiple Choice Option Renderer
export class MultipleChoiceOptionRenderer implements OptionRenderer {
  render(
    option: QuestionOption,
    onChange: (patch: Partial<QuestionOption>) => void,
    onRemove?: () => void
  ): React.ReactNode {
    return (
      <div className="relative rounded-md border dark:border-dark-4 p-3">
        {onRemove && (
          <button
            type="button"
            onClick={onRemove}
            className="absolute top-1 right-1 text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 transition-colors z-10 p-1 hover:bg-red-50 dark:hover:bg-red-900/20 rounded"
            title="Remove Option"
          >
            <X className="h-4 w-4" />
          </button>
        )}
        <div className="flex items-start gap-3">
          <Checkbox
            checked={!!option.is_correct}
            onCheckedChange={(checked) =>
              onChange({
                is_correct: Boolean(checked),
              })
            }
            className="mt-2"
          />
          <div className="flex-1 space-y-2">
            <Input
              value={option.option_text || ""}
              onChange={(e) =>
                onChange({
                  option_text: e.target.value,
                })
              }
              placeholder="Option text"
            />
            <CompactImageUpload
              value={option.media_url}
              onChange={(file) =>
                onChange({
                  media_url: file,
                })
              }
            />
            <Textarea
              value={option.explanation || ""}
              onChange={(e) =>
                onChange({
                  explanation: e.target.value,
                })
              }
              placeholder="Explanation (optional)"
              className="min-h-[56px]"
            />
          </div>
        </div>
      </div>
    );
  }
}

// Single Choice Option Renderer
export class SingleChoiceOptionRenderer implements OptionRenderer {
  render(
    option: QuestionOption,
    onChange: (patch: Partial<QuestionOption>) => void,
    onRemove?: () => void
  ): React.ReactNode {
    return (
      <div className="relative rounded-md border dark:border-dark-4 p-3">
        {onRemove && (
          <button
            type="button"
            onClick={onRemove}
            className="absolute top-1 right-1 text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 transition-colors z-10 p-1 hover:bg-red-50 dark:hover:bg-red-900/20 rounded"
            title="Remove Option"
          >
            <X className="h-4 w-4" />
          </button>
        )}
        <div className="flex items-start gap-3">
          <div
            className={`mt-2 w-5 h-5 rounded-full border-2 flex items-center justify-center cursor-pointer transition-colors ${option.is_correct
              ? "border-primary bg-primary"
              : "border-gray-300 dark:border-dark-5"
              }`}
            onClick={() => onChange({ is_correct: true })}
          >
            {option.is_correct && (
              <div className="w-2 h-2 rounded-full bg-white" />
            )}
          </div>
          <div className="flex-1 space-y-2">
            <Input
              value={option.option_text || ""}
              onChange={(e) =>
                onChange({
                  option_text: e.target.value,
                })
              }
              placeholder="Option text"
            />
            <CompactImageUpload
              value={option.media_url}
              onChange={(file) =>
                onChange({
                  media_url: file,
                })
              }
            />
            <Textarea
              value={option.explanation || ""}
              onChange={(e) =>
                onChange({
                  explanation: e.target.value,
                })
              }
              placeholder="Explanation (optional)"
              className="min-h-[56px]"
            />
          </div>
        </div>
      </div>
    );
  }
}


// True/False Option Renderer
export class TrueFalseOptionRenderer implements OptionRenderer {
  render(
    option: QuestionOption,
    onChange: (patch: Partial<QuestionOption>) => void,
    onRemove?: () => void
  ): React.ReactNode {
    const isTrue = option.option_text === "True";
    const isFalse = option.option_text === "False";

    return (
      <div
        className={`relative rounded-md border p-4 cursor-pointer transition-all ${option.is_correct
          ? "border-green-500 bg-green-50 dark:bg-green-900/20"
          : "border-gray-200 dark:border-dark-4 hover:border-gray-300"
          }`}
        onClick={() => onChange({ is_correct: true })}
      >
        <div className="flex items-center gap-3">
          <div
            className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${option.is_correct
              ? "border-green-500 bg-green-500"
              : "border-gray-300"
              }`}
          >
            {option.is_correct && (
              <div className="w-2 h-2 rounded-full bg-white" />
            )}
          </div>
          <span className={`font-medium ${option.is_correct ? "text-green-700 dark:text-green-300" : ""
            }`}>
            {option.option_text}
          </span>
          {option.is_correct && (
            <span className="ml-auto text-xs bg-green-100 dark:bg-green-800 text-green-700 dark:text-green-300 px-2 py-1 rounded">
              Correct Answer
            </span>
          )}
        </div>
      </div>
    );
  }
}

// Fill in Blank Option Renderer
export class FillInBlankOptionRenderer implements OptionRenderer {
  render(
    option: QuestionOption,
    onChange: (patch: Partial<QuestionOption>) => void,
    onRemove?: () => void
  ): React.ReactNode {
    return (
      <div className="relative rounded-md border dark:border-dark-4 p-3">
        {onRemove && (
          <button
            type="button"
            onClick={onRemove}
            className="absolute top-1 right-1 text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 transition-colors z-10 p-1 hover:bg-red-50 dark:hover:bg-red-900/20 rounded"
            title="Remove Option"
          >
            <X className="h-4 w-4" />
          </button>
        )}
        <div className="space-y-2">
          <div>
            <label className="text-xs text-gray-500 mb-1 block">Accepted Answer (will be marked as correct)</label>
            <Input
              value={option.option_text || ""}
              onChange={(e) =>
                onChange({
                  option_text: e.target.value,
                  is_correct: true, // Auto-mark as correct for fill-in-blank
                })
              }
              placeholder="Enter correct answer"
            />
          </div>
          <Textarea
            value={option.explanation || ""}
            onChange={(e) =>
              onChange({
                explanation: e.target.value,
              })
            }
            placeholder="Explanation (optional)"
            className="min-h-[56px]"
          />
        </div>
      </div>
    );
  }
}

// Short Answer Option Renderer
export class ShortAnswerOptionRenderer implements OptionRenderer {
  render(
    option: QuestionOption,
    onChange: (patch: Partial<QuestionOption>) => void,
    onRemove?: () => void
  ): React.ReactNode {
    return (
      <div className="relative rounded-md border dark:border-dark-4 p-3">
        {onRemove && (
          <button
            type="button"
            onClick={onRemove}
            className="absolute top-1 right-1 text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 transition-colors z-10 p-1 hover:bg-red-50 dark:hover:bg-red-900/20 rounded"
            title="Remove Option"
          >
            <X className="h-4 w-4" />
          </button>
        )}
        <div className="space-y-2">
          <Textarea
            value={option.option_text || ""}
            onChange={(e) =>
              onChange({
                option_text: e.target.value,
              })
            }
            placeholder="Sample answer"
            className="min-h-[80px]"
          />
          <Textarea
            value={option.explanation || ""}
            onChange={(e) =>
              onChange({
                explanation: e.target.value,
              })
            }
            placeholder="Explanation (optional)"
            className="min-h-[56px]"
          />
        </div>
      </div>
    );
  }
}

// Essay Option Renderer
export class EssayOptionRenderer implements OptionRenderer {
  render(
    option: QuestionOption,
    onChange: (patch: Partial<QuestionOption>) => void,
    onRemove?: () => void
  ): React.ReactNode {
    return (
      <div className="relative rounded-md border dark:border-dark-4 p-3">
        {onRemove && (
          <button
            type="button"
            onClick={onRemove}
            className="absolute top-1 right-1 text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 transition-colors z-10 p-1 hover:bg-red-50 dark:hover:bg-red-900/20 rounded"
            title="Remove Option"
          >
            <X className="h-4 w-4" />
          </button>
        )}
        <div className="space-y-2">
          <Textarea
            value={option.option_text || ""}
            onChange={(e) =>
              onChange({
                option_text: e.target.value,
              })
            }
            placeholder="Sample essay answer"
            className="min-h-[120px]"
          />
          <Textarea
            value={option.explanation || ""}
            onChange={(e) =>
              onChange({
                explanation: e.target.value,
              })
            }
            placeholder="Grading criteria (optional)"
            className="min-h-[80px]"
          />
        </div>
      </div>
    );
  }
}

// Matching Option Renderer - For matching pairs (left item -> right item)
export class MatchingOptionRenderer implements OptionRenderer {
  // Parse the option_text which stores JSON: { left: "...", right: "..." }
  private parseMatchingPair(optionText: string): { left: string; right: string } {
    try {
      const parsed = JSON.parse(optionText);
      return {
        left: parsed.left || "",
        right: parsed.right || "",
      };
    } catch {
      // If not valid JSON, treat the whole text as left side
      return { left: optionText || "", right: "" };
    }
  }

  // Serialize the pair back to JSON string
  private serializeMatchingPair(left: string, right: string): string {
    return JSON.stringify({ left, right });
  }

  render(
    option: QuestionOption,
    onChange: (patch: Partial<QuestionOption>) => void,
    onRemove?: () => void
  ): React.ReactNode {
    const pair = this.parseMatchingPair(option.option_text || "");

    const handleLeftChange = (value: string) => {
      onChange({
        option_text: this.serializeMatchingPair(value, pair.right),
        is_correct: true, // Matching pairs are always "correct" as they define the answer
      });
    };

    const handleRightChange = (value: string) => {
      onChange({
        option_text: this.serializeMatchingPair(pair.left, value),
        is_correct: true,
      });
    };

    return (
      <div className="relative rounded-lg border-2 border-dashed border-purple-300 dark:border-purple-700 bg-purple-50 dark:bg-purple-900/20 p-4">
        {onRemove && (
          <button
            type="button"
            onClick={onRemove}
            className="absolute top-2 right-2 text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 transition-colors z-10 p-1 hover:bg-red-50 dark:hover:bg-red-900/20 rounded"
            title="Remove Matching Pair"
          >
            <X className="h-4 w-4" />
          </button>
        )}

        <div className="flex items-center gap-2 mb-3">
          <span className="text-xs font-medium text-purple-700 dark:text-purple-300 bg-purple-200 dark:bg-purple-800 px-2 py-1 rounded">
            Pair #{option.sort_order}
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Left Side - Prompt */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2">
              <span className="w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-xs font-bold">
                L
              </span>
              Left Item (Prompt)
            </label>
            <Input
              value={pair.left}
              onChange={(e) => handleLeftChange(e.target.value)}
              placeholder="Enter the prompt/question"
              className="border-blue-300 focus:border-blue-500"
            />
          </div>

          {/* Arrow indicator */}
          <div className="hidden md:flex absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-10">
            <div className="bg-white dark:bg-gray-800 rounded-full p-2 shadow-md border">
              <svg className="w-5 h-5 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
              </svg>
            </div>
          </div>

          {/* Right Side - Match */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2">
              <span className="w-6 h-6 bg-green-500 text-white rounded-full flex items-center justify-center text-xs font-bold">
                R
              </span>
              Right Item (Match)
            </label>
            <Input
              value={pair.right}
              onChange={(e) => handleRightChange(e.target.value)}
              placeholder="Enter the matching answer"
              className="border-green-300 focus:border-green-500"
            />
          </div>
        </div>

        {/* Mobile arrow */}
        <div className="flex md:hidden justify-center my-2">
          <svg className="w-5 h-5 text-purple-500 rotate-90" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
          </svg>
        </div>

        {/* Explanation (optional) */}
        <div className="mt-4">
          <Textarea
            value={option.explanation || ""}
            onChange={(e) =>
              onChange({
                explanation: e.target.value,
              })
            }
            placeholder="Explanation for this matching pair (optional)"
            className="min-h-[60px]"
          />
        </div>
      </div>
    );
  }
}

// Factory Pattern for creating Option Renderers
export class OptionRendererFactory {
  private static renderers: Map<string, OptionRenderer> = new Map([
    ["SINGLE_CHOICE", new SingleChoiceOptionRenderer()],
    ["MULTIPLE_CHOICE", new MultipleChoiceOptionRenderer()],
    ["TRUE_FALSE", new TrueFalseOptionRenderer()],
    ["FILL_BLANK", new FillInBlankOptionRenderer()],
    ["MATCHING", new MatchingOptionRenderer()],
    ["ESSAY", new EssayOptionRenderer()],
  ]);

  static getRenderer(questionType: string): OptionRenderer {
    const renderer = this.renderers.get(questionType);
    if (!renderer) {
      // Default to Multiple Choice if type not found
      return this.renderers.get("MULTIPLE_CHOICE")!;
    }
    return renderer;
  }

  static getSupportedTypes(): string[] {
    return Array.from(this.renderers.keys());
  }
}

