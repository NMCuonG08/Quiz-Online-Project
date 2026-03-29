import { INestApplication } from '@nestjs/common';
import { createTestApp } from './support/test-setup';
import { AuthApi } from './api-services/auth.api';

describe('AuthModule (E2E)', () => {
  let app: INestApplication;
  let authApi: AuthApi;

  beforeAll(async () => {
    app = await createTestApp();
    authApi = new AuthApi(app);
  });

  afterAll(async () => {
    await app.close();
  });

  it('should register and then login successfully', async () => {
    const signupData = {
      email: `test-${Date.now()}@example.com`,
      username: `user-${Date.now()}`,
      password: 'StrongPassword123!',
      fullName: 'Test User'
    };

    // 1. Signup
    const signupRes = await authApi.signup(signupData);
    expect(signupRes.status).toBe(201);
    expect(signupRes.body.user.email).toBe(signupData.email);

    // 2. Login
    const loginData = {
      email: signupData.email,
      password: signupData.password
    };
    const loginRes = await authApi.login(loginData);
    expect(loginRes.status).toBe(200);
    expect(loginRes.body.accessToken).toBeDefined();

    // 3. Get profile with token
    const meRes = await authApi.getMe(loginRes.body.accessToken);
    expect(meRes.status).toBe(200);
    expect(meRes.body.email).toBe(signupData.email);
  });
});
