import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';
import { RbacService } from '@/common/services/rbac.service';
import { PermissionGuard } from '@/common/guards/permission.guard';
import { RequirePermissions } from '@/common/decorators/permissions.decorator';
import { Permission } from '@/common/enums/permisson';

@Controller('rbac')
@UseGuards(PermissionGuard)
export class RbacController {
  constructor(private readonly rbacService: RbacService) {}

  @Get('roles')
  @RequirePermissions(Permission.AdminUserRead)
  async getRoles() {
    return this.rbacService.getRoles();
  }

  @Get('roles/:name')
  @RequirePermissions(Permission.AdminUserRead)
  async getRoleByName(@Param('name') name: string) {
    return this.rbacService.getRoleByName(name);
  }

  @Get('permissions')
  @RequirePermissions(Permission.AdminUserRead)
  async getPermissions() {
    return this.rbacService.getPermissions();
  }

  @Get('permissions/:key')
  @RequirePermissions(Permission.AdminUserRead)
  async getPermissionByKey(@Param('key') key: string) {
    return this.rbacService.getPermissionByKey(key);
  }

  @Get('users/:userId/roles')
  @RequirePermissions(Permission.AdminUserRead)
  async getUserRoles(@Param('userId') userId: string) {
    return this.rbacService.getUserRoles(userId);
  }

  @Get('users/:userId/permissions')
  @RequirePermissions(Permission.AdminUserRead)
  async getUserPermissions(@Param('userId') userId: string) {
    return this.rbacService.getUserPermissions(userId);
  }

  @Post('roles')
  @RequirePermissions(Permission.AdminUserCreate)
  async createRole(@Body() data: { name: string; description?: string }) {
    return this.rbacService.createRole(data.name, data.description);
  }

  @Put('roles/:roleId')
  @RequirePermissions(Permission.AdminUserUpdate)
  async updateRole(
    @Param('roleId') roleId: string,
    @Body() data: { name?: string; description?: string },
  ) {
    return this.rbacService.updateRole(roleId, data);
  }

  @Delete('roles/:roleId')
  @RequirePermissions(Permission.AdminUserDelete)
  async deleteRole(@Param('roleId') roleId: string) {
    return this.rbacService.deleteRole(roleId);
  }

  @Post('users/:userId/roles/:roleId')
  @RequirePermissions(Permission.AdminUserUpdate)
  async assignRoleToUser(
    @Param('userId') userId: string,
    @Param('roleId') roleId: string,
  ) {
    return this.rbacService.assignRoleToUser(userId, roleId);
  }

  @Delete('users/:userId/roles/:roleId')
  @RequirePermissions(Permission.AdminUserUpdate)
  async removeRoleFromUser(
    @Param('userId') userId: string,
    @Param('roleId') roleId: string,
  ) {
    return this.rbacService.removeRoleFromUser(userId, roleId);
  }

  @Post('roles/:roleId/permissions/:permissionId')
  @RequirePermissions(Permission.AdminUserUpdate)
  async assignPermissionToRole(
    @Param('roleId') roleId: string,
    @Param('permissionId') permissionId: string,
  ) {
    return this.rbacService.assignPermissionToRole(roleId, permissionId);
  }

  @Delete('roles/:roleId/permissions/:permissionId')
  @RequirePermissions(Permission.AdminUserUpdate)
  async removePermissionFromRole(
    @Param('roleId') roleId: string,
    @Param('permissionId') permissionId: string,
  ) {
    return this.rbacService.removePermissionFromRole(roleId, permissionId);
  }

  @Get('statistics')
  @RequirePermissions(Permission.AdminUserRead)
  async getRoleStatistics() {
    return this.rbacService.getRoleStatistics();
  }
}
