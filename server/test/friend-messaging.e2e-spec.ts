import { INestApplication, ValidationPipe, VersioningType } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import cookieParser from 'cookie-parser';
import { AppModule } from '../src/app.module';

describe('Friend messaging (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = moduleRef.createNestApplication();
    app.use(cookieParser());
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
    app.enableVersioning({ type: VersioningType.URI, prefix: 'v' });
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('allows accepted friends to create a direct conversation and send a message', async () => {
    const stamp = Date.now();
    const createUser = async (suffix: string) => {
      const credentials = {
        email: `friend-chat-${suffix}-${stamp}@example.test`,
        username: `friend_chat_${suffix}_${stamp}`,
        password: 'StrongPassword123!',
        full_name: `Friend Chat ${suffix}`,
      };
      await request(app.getHttpServer()).post('/api/auth/register').send(credentials).expect(201);
      const login = await request(app.getHttpServer()).post('/api/auth/login').send({
        email: credentials.email,
        password: credentials.password,
      }).expect(200);
      const me = await request(app.getHttpServer()).get('/api/auth/me')
        .set('Authorization', `Bearer ${login.body.accessToken}`).expect(200);
      return { id: me.body.id as string, token: login.body.accessToken as string };
    };

    const first = await createUser('first');
    const second = await createUser('second');
    const friendship = await request(app.getHttpServer()).post('/api/friendships/request')
      .set('Authorization', `Bearer ${first.token}`).send({ friendId: second.id }).expect(201);
    await request(app.getHttpServer()).post(`/api/friendships/accept/${friendship.body.id}`)
      .set('Authorization', `Bearer ${second.token}`).expect(201);

    const conversation = await request(app.getHttpServer()).post('/api/conversations')
      .set('Authorization', `Bearer ${first.token}`).send({ otherUserId: second.id }).expect(201);
    const conversationId = conversation.body.id as string;
    expect(conversationId).toBeDefined();

    await request(app.getHttpServer()).post(`/api/conversations/${conversationId}/messages`)
      .set('Authorization', `Bearer ${first.token}`)
      .send({ body: 'Chào bạn!', clientMessageId: `test-${stamp}` })
      .expect(201);
    const messages = await request(app.getHttpServer()).get(`/api/conversations/${conversationId}/messages`)
      .set('Authorization', `Bearer ${second.token}`).expect(200);
    expect(messages.body).toHaveLength(1);
    expect(messages.body[0]).toMatchObject({ body: 'Chào bạn!', sender_id: first.id });
  });
});
