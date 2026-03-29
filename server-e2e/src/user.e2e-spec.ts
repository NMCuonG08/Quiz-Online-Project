import { INestApplication } from '@nestjs/common';
import { createTestApp } from './support/test-setup';
import { UserApi } from './api-services/user.api';

describe('UserModule (E2E API Test)', () => {
  let app: INestApplication;
  let userApi: UserApi;

  beforeAll(async () => {
    app = await createTestApp();
    userApi = new UserApi(app);
  });

  afterAll(async () => {
    await app.close();
  });

  it('GET /api/user (Should respond with standardized response)', async () => {
    const response = await userApi.getAllUsers();
    
    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBe(true);
  });
});
