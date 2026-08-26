import 'reflect-metadata';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import {
  DuplicateQuestionDto,
  ReorderQuestionsDto,
} from './question-actions.dto';

describe('question action DTO contracts', () => {
  it('rejects empty or malformed reorder payloads', async () => {
    expect(
      await validate(
        plainToInstance(ReorderQuestionsDto, { questionOrders: [] }),
      ),
    ).not.toHaveLength(0);
    expect(
      await validate(
        plainToInstance(ReorderQuestionsDto, {
          questionOrders: [{ id: 'not-a-uuid', sort_order: -1 }],
        }),
      ),
    ).not.toHaveLength(0);
  });

  it('validates duplicate target quiz ids', async () => {
    expect(
      await validate(
        plainToInstance(DuplicateQuestionDto, { newQuizId: 'not-a-uuid' }),
      ),
    ).not.toHaveLength(0);
  });
});
