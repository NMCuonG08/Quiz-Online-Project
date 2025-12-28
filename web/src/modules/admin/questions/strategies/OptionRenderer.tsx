import React from "react";
import { X } from "lucide-react";
import { Input } from "@/common/components/ui/input";
import { Checkbox } from "@/common/components/ui/checkbox";
import { Textarea } from "@/common/components/ui/textarea";
import { Button } from "@/common/components/ui/button";
import { UploadImage } from "@/common/components/ui/upload-image";
import type { QuestionOption } from "../types/admin.question";

// Strategy Pattern for Question Option UI Rendering
export interface OptionRenderer {
  render(
    option: QuestionOption,
    onChange: (patch: Partial<QuestionOption>) => void,
    onRemove?: () => void
  ): React.ReactNode;
}

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
            <div>
              <label className="text-xs text-gray-500 mb-1 block">Option Image (Optional)</label>
              <UploadImage
                value={option.media_url}
                onChange={(file) =>
                  onChange({
                    media_url: file,
                  })
                }
                placeholder="Upload option image"
                maxSize={2}
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
        <div className="flex items-center gap-3">
          <Checkbox
            checked={!!option.is_correct}
            onCheckedChange={(checked) =>
              onChange({
                is_correct: Boolean(checked),
              })
            }
          />
          <div className="flex-1">
            <div className="flex gap-2">
              <Button
                variant={option.option_text === "True" ? "default" : "outline"}
                size="sm"
                onClick={() => onChange({ option_text: "True" })}
              >
                True
              </Button>
              <Button
                variant={option.option_text === "False" ? "default" : "outline"}
                size="sm"
                onClick={() => onChange({ option_text: "False" })}
              >
                False
              </Button>
            </div>
            <Textarea
              value={option.explanation || ""}
              onChange={(e) =>
                onChange({
                  explanation: e.target.value,
                })
              }
              placeholder="Explanation (optional)"
              className="min-h-[56px] mt-2"
            />
          </div>
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
          <Input
            value={option.option_text || ""}
            onChange={(e) =>
              onChange({
                option_text: e.target.value,
              })
            }
            placeholder="Correct answer"
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

// Factory Pattern for creating Option Renderers
export class OptionRendererFactory {
  private static renderers: Map<string, OptionRenderer> = new Map([
    ["MULTIPLE_CHOICE", new MultipleChoiceOptionRenderer()],
    ["TRUE_FALSE", new TrueFalseOptionRenderer()],
    ["FILL_IN_BLANK", new FillInBlankOptionRenderer()],
    ["SHORT_ANSWER", new ShortAnswerOptionRenderer()],
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
