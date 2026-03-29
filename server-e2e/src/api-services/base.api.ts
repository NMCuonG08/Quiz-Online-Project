import request from 'supertest';
import { INestApplication } from '@nestjs/common';

export class BaseApi {
  constructor(protected readonly app: INestApplication) {}

  get agent() {
    return request(this.app.getHttpServer());
  }

  // Common helper to add auth headers if needed
  protected withAuth(token?: string) {
    const req = this.agent;
    if (token) {
      return (method: 'get' | 'post' | 'put' | 'delete' | 'patch', url: string) => 
        req[method](url).set('Authorization', `Bearer ${token}`);
    }
    return (method: 'get' | 'post' | 'put' | 'delete' | 'patch', url: string) => 
      req[method](url);
  }
}
