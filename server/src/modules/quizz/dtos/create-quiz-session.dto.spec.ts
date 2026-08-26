import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { CreateQuizSessionDto } from './create-quiz-session.dto';

describe('CreateQuizSessionDto', () => {
  const quizId = '752825a4-9ee4-45c4-a6b7-10b12097cee3';

  it('requires exactly one quiz identifier', async () => {
    expect(
      await validate(plainToInstance(CreateQuizSessionDto, {})),
    ).not.toHaveLength(0);
    expect(
      await validate(
        plainToInstance(CreateQuizSessionDto, {
          quiz_id: quizId,
          quiz_slug: 'ai-for-beginner',
        }),
      ),
    ).not.toHaveLength(0);
  });

  it('accepts either a valid id or a non-empty slug', async () => {
    expect(
      await validate(
        plainToInstance(CreateQuizSessionDto, { quiz_id: quizId }),
      ),
    ).toHaveLength(0);
    expect(
      await validate(
        plainToInstance(CreateQuizSessionDto, { quiz_slug: 'ai-for-beginner' }),
      ),
    ).toHaveLength(0);
  });
});
