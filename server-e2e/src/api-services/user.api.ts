import { BaseApi } from './base.api';

export class UserApi extends BaseApi {
  async getAllUsers(token?: string) {
    const req = this.agent.get('/api/user');
    if (token) req.set('Authorization', `Bearer ${token}`);
    return req;
  }

  async getUserById(id: string, token?: string) {
    const req = this.agent.get(`/api/user/${id}`);
    if (token) req.set('Authorization', `Bearer ${token}`);
    return req;
  }

  async updateRoles(id: string, roleIds: string[], token: string) {
    return this.agent
      .patch(`/api/user/${id}/roles`)
      .set('Authorization', `Bearer ${token}`)
      .send({ roleIds });
  }
}
