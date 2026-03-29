import { BaseApi } from './base.api';

export class AuthApi extends BaseApi {
  async login(loginDto: any) {
    return this.agent.post('/api/auth/login').send(loginDto);
  }

  async signup(signupDto: any) {
    return this.agent.post('/api/auth/register').send(signupDto);
  }

  async getMe(token: string) {
    return this.agent.get('/api/auth/me').set('Authorization', `Bearer ${token}`);
  }
}
