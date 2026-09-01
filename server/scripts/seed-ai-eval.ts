import { DifficultyLevel, PrismaClient, QuestionType, QuizType } from '@prisma/client';

const prisma = new PrismaClient();

const quizzes = [
  {
    title: 'Distributed Systems Fundamentals',
    slug: 'ai-eval-distributed-systems',
    description:
      'Scalability, reliability, replication, consistency and failure handling in distributed systems.',
    question: {
      text: 'Which technique keeps copies of data on multiple nodes?',
      options: ['Replication', 'Recursion', 'Compression', 'Serialization'],
      correct: 0,
    },
  },
  {
    title: 'Python Basics',
    slug: 'ai-eval-python-basics',
    description:
      'Python variables, functions, lists and basic control flow for beginners.',
    question: {
      text: 'Which keyword defines a function in Python?',
      options: ['func', 'def', 'function', 'lambda-only'],
      correct: 1,
    },
  },
];

async function main() {
  const owner = await prisma.user.upsert({
    where: { email: 'ai-eval@example.test' },
    update: {},
    create: {
      email: 'ai-eval@example.test',
      username: 'ai-eval',
      full_name: 'AI Evaluation Fixture',
      password: 'not-for-login',
    },
  });
  const category = await prisma.category.findFirst({
    where: { slug: 'ai-eval' },
  }) || await prisma.category.create({
    data: {
      name: 'AI Evaluation',
      slug: 'ai-eval',
      description: 'Deterministic fixtures for retrieval evaluation only.',
    },
  });

  for (const quiz of quizzes) {
    const { question, ...quizFields } = quiz;
    const existing = await prisma.quiz.findFirst({
      where: { slug: quiz.slug },
      select: { id: true },
    });
    const data = {
      ...quizFields,
      category_id: category.id,
      creator_id: owner.id,
      difficulty_level: DifficultyLevel.EASY,
      quiz_type: QuizType.PRACTICE,
      time_limit: 600,
      max_attempts: 1,
      passing_score: 0,
      is_active: true,
      is_public: true,
      instructions: 'Retrieval evaluation fixture.',
    };
    const savedQuiz = existing
      ? await prisma.quiz.update({ where: { id: existing.id }, data })
      : await prisma.quiz.create({ data });
    const existingQuestion = await prisma.question.findFirst({
      where: { quiz_id: savedQuiz.id, sort_order: 0 },
      select: { id: true },
    });
    const savedQuestion = existingQuestion
      ? await prisma.question.update({
          where: { id: existingQuestion.id },
          data: {
            question_text: question.text,
            question_type: QuestionType.SINGLE_CHOICE,
            points: 1,
            difficulty_level: DifficultyLevel.EASY,
            is_required: true,
          },
        })
      : await prisma.question.create({
          data: {
            quiz_id: savedQuiz.id,
            question_text: question.text,
            question_type: QuestionType.SINGLE_CHOICE,
            points: 1,
            difficulty_level: DifficultyLevel.EASY,
            sort_order: 0,
            is_required: true,
          },
        });
    await prisma.questionOption.deleteMany({ where: { question_id: savedQuestion.id } });
    await prisma.questionOption.createMany({
      data: question.options.map((option, index) => ({
        question_id: savedQuestion.id,
        option_text: option,
        is_correct: index === question.correct,
        sort_order: index,
      })),
    });
  }
  console.log(JSON.stringify({ seeded_quizzes: quizzes.map((quiz) => quiz.slug) }));
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
