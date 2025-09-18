import {
  Injectable,
  UnauthorizedException,
  ForbiddenException,
  ConflictException,
} from '@nestjs/common';

import { IncomingHttpHeaders } from 'http';
import { AuthDto, LoginDto, SignupDto } from '../dto';
import { ImmichHeader } from '@/common/enums';
import { Permission } from '@/common/enums';
import { isGranted } from '@/common/utils/access';
import { BaseService } from '@/common/base/base.service';

export type ValidateRequest = {
  headers: IncomingHttpHeaders;
  queryParams: Record<string, string>;
  metadata: {
    sharedLinkRoute: boolean;
    adminRoute: boolean;
    /** `false` explicitly means no permission is required, which otherwise defaults to `all` */
    permission?: Permission | false;
    uri: string;
  };
};

export interface JwtPayload {
  sub: string; // user ID
}

interface UserData {
  id: string;
  email: string;
  username?: string;
  full_name?: string;
  isAdmin?: boolean;
  deletedAt?: Date;
}

@Injectable()
export class AuthService extends BaseService {
  // Login method
  async login(loginDto: LoginDto) {
    const { email, password } = loginDto;

    // Find user by email
    const user = await this.userRepository.findByEmail(email);
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Check if user is active
    if (user.deletedAt) {
      throw new UnauthorizedException('User account is deactivated');
    }

    // Verify password
    if (
      !this.cryptoRepository.compareBcrypt(
        String(password),
        String(user.password),
      )
    ) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Generate tokens
    const accessToken = await this.generateAccessToken(user.id);
    const refreshToken = await this.generateRefreshToken(user.id);

    // Get user roles for client payload
    const roles = await this.getUserRoles(user.id);

    return {
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        full_name: user.full_name,
        isAdmin: user.isAdmin || false,
        roles,
      },
      accessToken,
      refreshToken,
    };
  }

  // Signup method
  async signup(signupDto: SignupDto) {
    const { email, password, full_name, username } = signupDto;

    // Check if email already exists
    const existingUser = await this.userRepository.findByEmail(email);
    if (existingUser) {
      throw new ConflictException('Email already exists');
    }

    // Check if username already exists (if provided)
    if (username) {
      const existingUsername =
        await this.userRepository.findByUsername(username);
      if (existingUsername) {
        throw new ConflictException('Username already exists');
      }
    }

    // Hash password
    const saltRounds = 10;
    const hashedPassword = await this.cryptoRepository.hashBcrypt(
      password,
      saltRounds,
    );

    // Create user
    const newUser = await this.userRepository.create({
      email,
      password: hashedPassword,
      full_name,
      username,
      isAdmin: false,
    });

    // Assign default role "user"
    try {
      await this.userRepository.assignRole(newUser.id, 'user');
    } catch (error: unknown) {
      let message = 'unknown error';
      if (typeof error === 'object' && error !== null) {
        const maybeMsg = (error as Record<string, unknown>).message;
        if (typeof maybeMsg === 'string') message = maybeMsg;
      }
      this.logger.warn(
        `Failed to assign default role to user ${newUser.id}: ${message}`,
      );
    }

    // Generate tokens
    const accessToken = await this.generateAccessToken(newUser.id);
    const refreshToken = await this.generateRefreshToken(newUser.id);

    // Get user roles for client payload
    const roles = await this.getUserRoles(newUser.id);

    return {
      user: {
        id: newUser.id,
        email: newUser.email,
        username: newUser.username,
        full_name: newUser.full_name,
        isAdmin: newUser.isAdmin || false,
        roles,
      },
      accessToken,
      refreshToken,
    };
  }

  // Logout method
  async logout(userId: string) {
    await this.userRepository.update(userId, {
      refreshToken: null,
    });
    return true;
  }

  // Get user permissions from DB via roles
  private async getUserPermissions(userId: string): Promise<Permission[]> {
    const user = await this.userRepository.findOne(userId);
    if (user?.isAdmin) {
      return Object.values(Permission);
    }
    const perms: Permission[] =
      await this.userRepository.getUserPermissions(userId);
    return perms;
  }

  // Public wrappers for controller
  async getUserRoles(userId: string): Promise<string[]> {
    const roles: string[] = await this.userRepository.getUserRoles(userId);
    return roles;
  }

  async getUserPermissionsPublic(userId: string): Promise<Permission[]> {
    const perms: Permission[] = await this.getUserPermissions(userId);
    return perms;
  }

  async authenticate({
    headers,
    queryParams,
    metadata,
  }: ValidateRequest): Promise<AuthDto> {
    const authDto = await this.validate({ headers, queryParams });
    const { adminRoute, sharedLinkRoute, uri } = metadata;
    const requestedPermission = metadata.permission ?? Permission.All;

    if (!authDto.user && adminRoute) {
      this.logger.warn(`Denied access to admin only route: ${uri}`);
      throw new ForbiddenException('Forbidden');
    }

    if (authDto.sharedLink && !sharedLinkRoute) {
      this.logger.warn(`Denied access to non-shared route: ${uri}`);
      throw new ForbiddenException('Forbidden');
    }

    // Check user permissions (fetch from DB each time)
    if (authDto.user && requestedPermission !== false) {
      const userPermissions = await this.getUserPermissions(authDto.user.id);
      if (
        !isGranted({
          requested: [requestedPermission],
          current: userPermissions,
        })
      ) {
        throw new ForbiddenException(
          `Missing required permission: ${requestedPermission}`,
        );
      }
    }

    // Check API key permissions (map roles -> permissions here if API keys are used)
    if (authDto.apiKey && requestedPermission !== false) {
      // Example: derive permissions from API key roles if needed
      const apiKeyPermissions: Permission[] = [];
      if (
        !isGranted({
          requested: [requestedPermission],
          current: apiKeyPermissions,
        })
      ) {
        throw new ForbiddenException(
          `Missing required permission: ${requestedPermission}`,
        );
      }
    }

    return authDto;
  }

  private async validate({
    headers,
  }: Omit<ValidateRequest, 'metadata'>): Promise<AuthDto> {
    const jwtToken = (headers[ImmichHeader.UserToken] ||
      this.getBearerToken(headers) ||
      this.getCookieToken(headers)) as string;

    if (jwtToken) {
      return this.validateJwtToken(jwtToken);
    }

    throw new UnauthorizedException('Authentication required');
  }

  private getBearerToken(headers: IncomingHttpHeaders): string | null {
    const [type, token] = (headers.authorization || '').split(' ');

    if (type.toLowerCase() === 'bearer') {
      return token;
    }
    return null;
  }

  private getCookieToken(headers: IncomingHttpHeaders): string | null {
    const cookies = headers.cookie || '';
    const accessTokenMatch = cookies.match(/accessToken=([^;]+)/);
    return accessTokenMatch ? accessTokenMatch[1] : null;
  }

  private async validateJwtToken(token: string): Promise<AuthDto> {
    try {
      // Verify JWT token
      const payload = await this.jwtService.verifyAsync<JwtPayload>(token, {
        secret: this.configService.get<string>('JWT_SECRET'),
      });

      // Check if user still exists in database
      const user = (await this.userRepository.findOne(payload.sub)) as UserData;
      if (!user) {
        throw new UnauthorizedException('User not found');
      }

      // Check if user is still active
      if (user.deletedAt) {
        throw new UnauthorizedException('User account is deactivated');
      }

      const roles = await this.getUserRoles(user.id);

      return {
        user: {
          id: user.id,
          roles,
          isAdmin: user.isAdmin || false,
          name: user.full_name || user.username || user.email,
          email: user.email,
          quotaUsageInBytes: 0, // You can impcement quota logic later
          quotaSizeInBytes: null,
        },
      };
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      throw new UnauthorizedException('Invalid or jxJired token');
    }
  }

  // JWT token generction methods
  async generateAccessToken(userId: string): Promise<string> {
    const payload: JwtPayload = { sub: userId };

    return this.jwtService.signAsync(payload, {
      secret: this.configService.get<string>('JWT_SECRET'),
      expiresIn: '7d',
    });
  }

  async generateRefreshToken(userId: string): Promise<string> {
    const payload = {
      sub: userId,
      type: 'refresh',
    };

    return this.jwtService.signAsync(payload, {
      secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
      expiresIn: '30d',
    });
  }

  async refreshAccessToken(refreshToken: string): Promise<string> {
    try {
      const payload = await this.jwtService.verifyAsync<{
        type: string;
        sub: string;
      }>(refreshToken, {
        secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
      });

      if (payload.type !== 'refresh') {
        throw new UnauthorizedException('Invalid refresh token');
      }

      const user = (await this.userRepository.findOne(payload.sub)) as UserData;
      if (!user) {
        throw new UnauthorizedException('User not found');
      }

      return this.generateAccessToken(user.id);
    } catch {
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  // Legacy placeholder methods removed to avoid signature conflicts with BaseService
}
