import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { AppModule } from '@/app.module';
import { PrismaService } from '@/infrastructure/database/prisma.service';

describe('UserModule (Integration)', () => {
  let app: INestApplication;
  let prisma: PrismaService;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    prisma = app.get<PrismaService>(PrismaService);
    await app.init();
    
    // Optional: Clean database before testing
    // await prisma.user.deleteMany();
  });

  afterAll(async () => {
    await app.close();
  });

  it('should create and retrieve a user from the real database', async () => {
    const email = `test-${Date.now()}@example.com`;
    
    // Create via service or directly via prisma for integration
    const user = await prisma.user.create({
      data: {
        email,
        username: `user-${Date.now()}`,
        password: 'password123',
      },
    });

    expect(user.id).toBeDefined();
    expect(user.email).toBe(email);

    const foundUser = await prisma.user.findUnique({
      where: { id: user.id },
    });
    expect(foundUser).not.toBeNull();
    expect(foundUser?.email).toBe(email);
  });
});
