import { BadRequestException } from '@nestjs/common';
import { parseQuestionOptions } from './question.service';

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
    expect(() => parseQuestionOptions([
      { is_correct: true, sort_order: 1 },
      { is_correct: false, sort_order: 2 },
    ])).toThrow(BadRequestException);
  });

  it('rejects malformed JSON instead of silently dropping options', () => {
    expect(() => parseQuestionOptions('[{"option_text":]')).toThrow(
      'Dữ liệu đáp án không phải JSON hợp lệ',
    );
  });
});
