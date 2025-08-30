import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../infrastructure/database/prisma.service';
import { Permission } from '../enums/permisson';

@Injectable()
export class RbacService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Get all roles
   */
  async getRoles() {
    return this.prisma.role.findMany({
      include: {
        rolePermissions: {
          include: {
            permission: true,
          },
        },
      },
    });
  }

  /**
   * Get role by name
   */
  async getRoleByName(name: string) {
    return this.prisma.role.findUnique({
      where: { name },
      include: {
        rolePermissions: {
          include: {
            permission: true,
          },
        },
      },
    });
  }

  /**
   * Get all permissions
   */
  async getPermissions() {
    return this.prisma.appPermission.findMany({
      include: {
        rolePermissions: {
          include: {
            role: true,
          },
        },
      },
    });
  }

  /**
   * Get permission by key
   */
  async getPermissionByKey(key: string) {
    return this.prisma.appPermission.findUnique({
      where: { key },
      include: {
        rolePermissions: {
          include: {
            role: true,
          },
        },
      },
    });
  }

  /**
   * Get user roles
   */
  async getUserRoles(userId: string) {
    return this.prisma.userRole.findMany({
      where: { userId },
      include: {
        role: {
          include: {
            rolePermissions: {
              include: {
                permission: true,
              },
            },
          },
        },
      },
    });
  }

  /**
   * Get user permissions
   */
  async getUserPermissions(userId: string): Promise<string[]> {
    const userRoles = await this.prisma.userRole.findMany({
      where: { userId },
      include: {
        role: {
          include: {
            rolePermissions: {
              include: {
                permission: true,
              },
            },
          },
        },
      },
    });

    const permissions = new Set<string>();
    
    userRoles.forEach(userRole => {
      userRole.role.rolePermissions.forEach(rolePermission => {
        permissions.add(rolePermission.permission.key);
      });
    });

    return Array.from(permissions);
  }

  /**
   * Check if user has permission
   */
  async hasPermission(userId: string, permission: string): Promise<boolean> {
    const userPermissions = await this.getUserPermissions(userId);
    return userPermissions.includes(permission) || userPermissions.includes(Permission.All);
  }

  /**
   * Check if user has any of the permissions
   */
  async hasAnyPermission(userId: string, permissions: string[]): Promise<boolean> {
    const userPermissions = await this.getUserPermissions(userId);
    
    if (userPermissions.includes(Permission.All)) {
      return true;
    }

    return permissions.some(permission => userPermissions.includes(permission));
  }

  /**
   * Check if user has all permissions
   */
  async hasAllPermissions(userId: string, permissions: string[]): Promise<boolean> {
    const userPermissions = await this.getUserPermissions(userId);
    
    if (userPermissions.includes(Permission.All)) {
      return true;
    }

    return permissions.every(permission => userPermissions.includes(permission));
  }

  /**
   * Assign role to user
   */
  async assignRoleToUser(userId: string, roleId: string) {
    return this.prisma.userRole.create({
      data: {
        userId,
        roleId,
      },
      include: {
        role: true,
      },
    });
  }

  /**
   * Remove role from user
   */
  async removeRoleFromUser(userId: string, roleId: string) {
    return this.prisma.userRole.delete({
      where: {
        userId_roleId: {
          userId,
          roleId,
        },
      },
    });
  }

  /**
   * Assign permission to role
   */
  async assignPermissionToRole(roleId: string, permissionId: string) {
    return this.prisma.rolePermission.create({
      data: {
        roleId,
        permissionId,
      },
      include: {
        permission: true,
      },
    });
  }

  /**
   * Remove permission from role
   */
  async removePermissionFromRole(roleId: string, permissionId: string) {
    return this.prisma.rolePermission.delete({
      where: {
        roleId_permissionId: {
          roleId,
          permissionId,
        },
      },
    });
  }

  /**
   * Create new role
   */
  async createRole(name: string, description?: string) {
    return this.prisma.role.create({
      data: {
        name,
        description,
      },
    });
  }

  /**
   * Update role
   */
  async updateRole(roleId: string, data: { name?: string; description?: string }) {
    return this.prisma.role.update({
      where: { id: roleId },
      data,
    });
  }

  /**
   * Delete role
   */
  async deleteRole(roleId: string) {
    // First delete all role permissions
    await this.prisma.rolePermission.deleteMany({
      where: { roleId },
    });

    // Then delete all user roles
    await this.prisma.userRole.deleteMany({
      where: { roleId },
    });

    // Finally delete the role
    return this.prisma.role.delete({
      where: { id: roleId },
    });
  }

  /**
   * Get role statistics
   */
  async getRoleStatistics() {
    const roles = await this.prisma.role.findMany({
      include: {
        _count: {
          select: {
            users: true,
            rolePermissions: true,
          },
        },
      },
    });

    return roles.map(role => ({
      id: role.id,
      name: role.name,
      description: role.description,
      userCount: role._count.users,
      permissionCount: role._count.rolePermissions,
      createdAt: role.created_at,
      updatedAt: role.updated_at,
    }));
  }
} 