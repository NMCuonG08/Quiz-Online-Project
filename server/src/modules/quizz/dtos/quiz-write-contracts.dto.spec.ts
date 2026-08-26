import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { CreateQuizDto } from './create-quiz.dto';
import { UpdateQuizDto } from './update-quiz.dto';

describe('quiz write DTO contracts', () => {
  const base = {
    title: 'AI',
    slug: 'ai',
    category_id: '752825a4-9ee4-45c4-a6b7-10b12097cee3',
    difficulty_level: 'EASY',
    quiz_type: 'MULTIPLE_CHOICE',
    time_limit: 600,
  };

  it('rejects invalid time, attempt, and score ranges on create', async () => {
    const dto = plainToInstance(CreateQuizDto, {
      ...base,
      time_limit: 0,
      max_attempts: -1,
      passing_score: 101,
    });
    expect(await validate(dto)).not.toHaveLength(0);
  });

  it('rejects invalid ranges on update', async () => {
    const dto = plainToInstance(UpdateQuizDto, {
      time_limit: 0,
      max_attempts: -1,
      passing_score: -1,
    });
    expect(await validate(dto)).not.toHaveLength(0);
  });
});
