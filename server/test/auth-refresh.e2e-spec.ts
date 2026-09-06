import { INestApplication, ValidationPipe, VersioningType } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import cookieParser from 'cookie-parser';
import { AppModule } from '../src/app.module';

describe('Authentication lifecycle (e2e)', () => {
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

  it('keeps a normal user authenticated through search, forbidden access, and cookie refresh', async () => {
    const stamp = Date.now();
    const credentials = {
      email: `auth-flow-${stamp}@example.test`,
      username: `auth_flow_${stamp}`,
      password: 'StrongPassword123!',
      full_name: 'Auth Flow Test',
    };

    const signup = await request(app.getHttpServer()).post('/api/auth/register').send(credentials);
    expect(signup.status).toBe(201);

    const login = await request(app.getHttpServer()).post('/api/auth/login').send({
      email: credentials.email,
      password: credentials.password,
    });
    expect(login.status).toBe(200);
    expect(login.body.accessToken).toBeDefined();
    const setCookie = login.headers['set-cookie'];
    const refreshCookie = Array.isArray(setCookie) ? setCookie[0] : setCookie;
    expect(refreshCookie).toContain('__refreshToken=');
    expect(refreshCookie).not.toContain('Secure');

    const token = login.body.accessToken as string;
    const me = await request(app.getHttpServer()).get('/api/auth/me').set('Authorization', `Bearer ${token}`).expect(200);
    await request(app.getHttpServer()).get('/api/user/search').query({ q: credentials.username }).set('Authorization', `Bearer ${token}`).expect(200);
    await request(app.getHttpServer()).get('/api/friendships/friends').set('Authorization', `Bearer ${token}`).expect(200);
    const relationship = await request(app.getHttpServer())
      .get(`/api/friendships/status/${me.body.id}`)
      .set('Authorization', `Bearer ${token}`)
      .expect(200);
    expect(relationship.body).toMatchObject({ status: 'SELF', friendshipId: null });

    await request(app.getHttpServer()).get('/api/admin/dashboard/stats').set('Authorization', `Bearer ${token}`).expect(403);
    await request(app.getHttpServer()).get('/api/auth/me').set('Authorization', `Bearer ${token}`).expect(200);

    const refreshed = await request(app.getHttpServer()).post('/api/auth/refresh-cookie').set('Cookie', refreshCookie).send({});
    expect(refreshed.status).toBe(200);
    expect(refreshed.body.accessToken).toBeDefined();
    await request(app.getHttpServer()).get('/api/auth/me').set('Authorization', `Bearer ${refreshed.body.accessToken}`).expect(200);
  });
});
