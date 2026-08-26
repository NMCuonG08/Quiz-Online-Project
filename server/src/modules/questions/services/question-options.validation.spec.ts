import { BadRequestException } from '@nestjs/common';
import {
  parseQuestionOptions,
  validateQuestionOptions,
} from './question.service';
import { QuestionTypeEnum } from '@/common/enums';

describe('parseQuestionOptions', () => {
  it('normalizes supported text aliases', () => {
    const options = parseQuestionOptions([
      { content: 'Trí tuệ nhân tạo', is_correct: true, sort_order: 1 },
      { text: 'Một hệ điều hành', is_correct: false, sort_order: 2 },
    ]);

    expect(options?.map((option) => option.option_text)).toEqual([
      'Trí tuệ nhân tạo',
      'Một hệ điều hành',
    ]);
  });

  it('rejects missing option text before Prisma', () => {
    expect(() =>
      parseQuestionOptions([
        { is_correct: true, sort_order: 1 },
        { is_correct: false, sort_order: 2 },
      ]),
    ).toThrow(BadRequestException);
  });

  it('rejects malformed JSON instead of silently dropping options', () => {
    expect(() => parseQuestionOptions('[{"option_text":]')).toThrow(
      'Dữ liệu đáp án không phải JSON hợp lệ',
    );
  });

  it('enforces correct-answer rules before the repository transaction', () => {
    const options = parseQuestionOptions([
      { option_text: 'A', is_correct: false, sort_order: 1 },
      { option_text: 'B', is_correct: false, sort_order: 2 },
    ]);

    expect(() =>
      validateQuestionOptions(QuestionTypeEnum.SINGLE_CHOICE, options),
    ).toThrow('Câu hỏi một đáp án cần đúng 1 đáp án đúng');
  });
});
