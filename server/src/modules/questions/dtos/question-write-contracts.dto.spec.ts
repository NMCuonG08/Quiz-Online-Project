import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { CreateQuestionDto } from './create-question.dto';
import { UpdateQuestionDto } from './update-question.dto';

describe('question write DTO contracts', () => {
  it('rejects negative numeric fields on create and update', async () => {
    const create = plainToInstance(CreateQuestionDto, {
      quiz_id: '752825a4-9ee4-45c4-a6b7-10b12097cee3',
      question_text: 'AI là gì?',
      question_type: 'SINGLE_CHOICE',
      points: -1,
      time_limit: -1,
      sort_order: -1,
    });
    const update = plainToInstance(UpdateQuestionDto, {
      points: -1,
      time_limit: -1,
      sort_order: -1,
    });

    expect(await validate(create)).not.toHaveLength(0);
    expect(await validate(update)).not.toHaveLength(0);
  });
});
