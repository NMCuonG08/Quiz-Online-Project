import { DifficultyLevel, PrismaClient, QuizType } from '@prisma/client';

const prisma = new PrismaClient();

const quizzes = [
  {
    title: 'Distributed Systems Fundamentals',
    slug: 'ai-eval-distributed-systems',
    description:
      'Scalability, reliability, replication, consistency and failure handling in distributed systems.',
  },
  {
    title: 'Python Basics',
    slug: 'ai-eval-python-basics',
    description:
      'Python variables, functions, lists and basic control flow for beginners.',
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
    const existing = await prisma.quiz.findFirst({
      where: { slug: quiz.slug },
      select: { id: true },
    });
    const data = {
      ...quiz,
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
    if (existing) {
      await prisma.quiz.update({ where: { id: existing.id }, data });
    } else {
      await prisma.quiz.create({ data });
    }
  }
  console.log(JSON.stringify({ seeded_quizzes: quizzes.map((quiz) => quiz.slug) }));
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
