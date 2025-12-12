"use client";

import { Question } from "../../do-quiz/types/quiz.types";
import { IQuestionRendererStrategy } from "../strategies/IQuestionRendererStrategy";
import { MultipleChoiceStrategy } from "../strategies/MultipleChoiceStrategy";
import { TrueFalseStrategy } from "../strategies/TrueFalseStrategy";
import { FillBlankStrategy } from "../strategies/FillBlankStrategy";
import { EssayStrategy } from "../strategies/EssayStrategy";

export class QuestionRendererFactory {
  private static strategies: Map<string, IQuestionRendererStrategy> = new Map([
    ["multiple_choice", new MultipleChoiceStrategy()],
    ["true_false", new TrueFalseStrategy()],
    ["fill_blank", new FillBlankStrategy()],
    ["essay", new EssayStrategy()],
  ]);

  /**
   * Get the appropriate renderer strategy for a question type
   */
  static getStrategy(questionType: string): IQuestionRendererStrategy {
    const strategy = this.strategies.get(questionType);
    
    if (!strategy) {
      console.warn(`No strategy found for question type: ${questionType}, using MultipleChoiceStrategy as default`);
      return this.strategies.get("multiple_choice")!;
    }

    return strategy;
  }

  /**
   * Get strategy for a question object
   */
  static getStrategyForQuestion(question: Question): IQuestionRendererStrategy {
    return this.getStrategy(question.question_type);
  }

  /**
   * Register a new strategy (for extensibility)
   */
  static registerStrategy(
    questionType: string,
    strategy: IQuestionRendererStrategy
  ): void {
    this.strategies.set(questionType, strategy);
  }

  /**
   * Get all available question types
   */
  static getAvailableTypes(): string[] {
    return Array.from(this.strategies.keys());
  }
}

