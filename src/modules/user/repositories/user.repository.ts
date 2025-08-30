import { Injectable } from '@nestjs/common';
import { BaseRepository } from '@/common/base/base.repository';
import { PrismaService } from '@/infrastructure/database/prisma.service';
import { User } from '@prisma/client';
import { Permission } from '@/common/enums';

@Injectable()
export class UserRepository extends BaseRepository<User> {
  constructor(protected readonly prisma: PrismaService) {
    super(prisma);
  }

  protected get model() {
    return this.prisma.user;
  }

  async findOne(id: string) {
    return await this.model.findUnique({
      where: { id },
    });
  }

  async findByEmail(email: string) {
    return await this.model.findUnique({
      where: { email },
    });
  }

  async findByUsername(username: string) {
    return await this.model.findUnique({
      where: { username },
    });
  }

  async create(data: any) {
    return await this.model.create({
      data,
    });
  }

  async update(id: string, data: any) {
    return await this.model.update({
      where: { id },
      data,
    });
  }

  async delete(id: string): Promise<User> {
    return await this.model.delete({
      where: { id },
    });
  }

  async assignRole(userId: string, roleName: string) {
    const role = await this.prisma.role.findUnique({
      where: { name: roleName },
    });
    if (!role) throw new Error(`Role not found: ${roleName}`);
    await this.prisma.userRole.upsert({
      where: { userId_roleId: { userId, roleId: role.id } },
      create: { userId, roleId: role.id },
      update: {},
    });
    return true;
  }

  async getUserRoles(userId: string): Promise<string[]> {
    const roles = await this.prisma.userRole.findMany({
      where: { userId },
      include: { role: true },
    });
    return roles.map((ur) => ur.role.name);
  }

  async getUserPermissions(userId: string): Promise<Permission[]> {
    const rolePermissions = await this.prisma.rolePermission.findMany({
      where: {
        role: { users: { some: { userId } } },
      },
      include: { permission: true },
    });
    const keys = new Set<string>();
    for (const rp of rolePermissions) keys.add(rp.permission.key);
    return Array.from(keys) as Permission[];
  }
}
