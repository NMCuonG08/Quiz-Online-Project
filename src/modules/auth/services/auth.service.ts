import {
  Injectable,
  UnauthorizedException,
  ForbiddenException,
  ConflictException,
} from '@nestjs/common';

import { IncomingHttpHeaders } from 'http';
import { AuthDto, LoginDto, SignupDto } from '../dto';
import { projectHeader } from '@/common/enums';
import { Permission } from '@/common/enums';
import { isGranted } from '@/common/utils/access';
import { BaseService } from '@/common/base/base.service';
import { randomBytes } from 'crypto';

type GoogleTokenResponse = {
  access_token: string;
  expires_in: number;
  refresh_token?: string;
  scope: string;
  token_type: string;
  id_token: string;
};

type GoogleUserInfo = {
  sub: string;
  email: string;
  email_verified: boolean;
  name?: string;
  given_name?: string;
  family_name?: string;
  picture?: string;
};

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

export type AuthLoginResult = {
  user: {
    id: string;
    email: string;
    username?: string | null;
    full_name?: string | null;
    isAdmin: boolean;
    roles: string[];
  };
  accessToken: string;
  refreshToken: string;
};

@Injectable()
export class AuthService extends BaseService {
  async loginWithGoogle(code: string): Promise<AuthLoginResult> {
    if (!code) {
      throw new UnauthorizedException('Missing authorization code');
    }

    const clientId = this.configService.get<string>('GOOGLE_CLIENT_ID');
    const clientSecret = this.configService.get<string>('GOOGLE_CLIENT_SECRET');
    const redirectUri = this.configService.get<string>('GOOGLE_REDIRECT_URI');

    if (!clientId || !clientSecret || !redirectUri) {
      throw new UnauthorizedException('Google OAuth is not configured');
    }

    // 1) Exchange code for tokens
    const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        grant_type: 'authorization_code',
      }),
    });

    if (!tokenRes.ok) {
      throw new UnauthorizedException('Failed to exchange code for token');
    }
    const tokenJson = (await tokenRes.json()) as GoogleTokenResponse;

    // 2) Verify token and get user info
    const userInfoRes = await fetch(
      'https://www.googleapis.com/oauth2/v3/userinfo',
      {
        headers: {
          Authorization: `Bearer ${tokenJson.access_token}`,
        },
      },
    );
    if (!userInfoRes.ok) {
      throw new UnauthorizedException('Failed to fetch Google user info');
    }
    const gUser = (await userInfoRes.json()) as GoogleUserInfo;

    if (!gUser.email || !gUser.email_verified) {
      throw new UnauthorizedException('Google email not verified');
    }

    // 3) Upsert user
    let user = await this.userRepository.findByEmail(gUser.email);
    if (!user) {
      const generatedPassword = randomBytes(16).toString('hex');
      const hashedPassword = await this.cryptoRepository.hashBcrypt(
        generatedPassword,
        10,
      );
      user = await this.userRepository.create({
        email: gUser.email,
        full_name: gUser.name ?? undefined,
        username: undefined,
        password: hashedPassword,
        avatar: gUser.picture ?? undefined,
        isAdmin: false,
      });

      try {
        await this.userRepository.assignRole(user.id, 'user');
      } catch {
        this.logger.warn(
          `Failed to assign default role to new Google user ${user.id}`,
        );
      }
    } else if (gUser.picture && user.avatar !== gUser.picture) {
      try {
        await this.userRepository.update(user.id, { avatar: gUser.picture });
      } catch {
        // no-op
      }
    }

    if (user.deletedAt) {
      throw new UnauthorizedException('User account is deactivated');
    }

    // 4) Issue app tokens
    const accessToken = await this.generateAccessToken(user.id);
    const refreshToken = await this.generateRefreshToken(user.id);

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
  // Login method
  async login(loginDto: LoginDto): Promise<AuthLoginResult> {
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
  async signup(signupDto: SignupDto): Promise<AuthLoginResult> {
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

    // Invalidate all user-related cache
    await this.authCacheService.invalidateAllUserTokens(userId);

    return true;
  }

  // Get user permissions from DB via roles
  private async getUserPermissions(userId: string): Promise<Permission[]> {
    // Try to get from cache first
    const cachedPermissions =
      await this.authCacheService.getCachedUserPermissions(userId);
    if (cachedPermissions) {
      return cachedPermissions;
    }

    // If not in cache, fetch from database
    const user = await this.userRepository.findOne(userId);
    let permissions: Permission[];

    if (user?.isAdmin) {
      permissions = Object.values(Permission);
    } else {
      permissions = await this.userRepository.getUserPermissions(userId);
    }

    // Cache the permissions
    await this.authCacheService.cacheUserPermissions(userId, permissions);
    return permissions;
  }

  // Public wrappers for controller
  async getUserRoles(userId: string): Promise<string[]> {
    // Try to get from cache first
    const cachedRoles = await this.authCacheService.getCachedUserRoles(userId);
    if (cachedRoles) {
      return cachedRoles;
    }

    // If not in cache, fetch from database
    const roles: string[] = await this.userRepository.getUserRoles(userId);

    // Cache the roles
    await this.authCacheService.cacheUserRoles(userId, roles);
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
    const jwtToken = (headers[projectHeader.UserToken] ||
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
      // First, check cache for complete auth data
      const cachedAuthData =
        await this.authCacheService.getCachedAuthData(token);
      if (cachedAuthData) {
        this.logger.debug('Using cached auth data for token validation');
        return cachedAuthData;
      }

      // Verify JWT token
      const payload = await this.jwtService.verifyAsync<JwtPayload>(token, {
        secret: this.configService.get<string>('JWT_SECRET'),
      });

      // Try to get roles and permissions from cache first
      let roles = await this.authCacheService.getCachedUserRoles(payload.sub);
      let permissions = await this.authCacheService.getCachedUserPermissions(
        payload.sub,
      );

      // If not in cache, fetch from database and cache it
      if (!roles || !permissions) {
        this.logger.debug('User data not in cache, fetching from database');

        // Check if user still exists in database
        const user = (await this.userRepository.findOne(
          payload.sub,
        )) as UserData;
        if (!user) {
          throw new UnauthorizedException('User not found');
        }

        // Check if user is still active
        if (user.deletedAt) {
          throw new UnauthorizedException('User account is deactivated');
        }

        // Fetch roles and permissions
        roles = await this.getUserRoles(user.id);
        permissions = await this.getUserPermissions(user.id);

        // Cache the data
        await this.authCacheService.cacheUserRoles(payload.sub, roles);
        await this.authCacheService.cacheUserPermissions(
          payload.sub,
          permissions,
        );
      }

      const authData: AuthDto = {
        user: {
          id: payload.sub,
          roles,
          isAdmin: permissions?.includes(Permission.All) || false,
          name: '', // Will be filled from user data if needed
          email: '', // Will be filled from user data if needed
          quotaUsageInBytes: 0,
          quotaSizeInBytes: null,
        },
      };

      // Cache the complete auth data for this token
      await this.authCacheService.cacheAuthData(token, authData);

      return authData;
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      throw new UnauthorizedException('Invalid or expired token');
    }
  }

  // JWT token generction methods
  async generateAccessToken(userId: string): Promise<string> {
    const payload: JwtPayload = { sub: userId };

    return this.jwtService.signAsync(payload, {
      secret: this.configService.get<string>('JWT_SECRET'),
      expiresIn: '15m',
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

  async refreshAccessToken(refreshToken: string): Promise<{
    accessToken: string;
  }> {
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

      // Check if user is still active
      if (user.deletedAt) {
        throw new UnauthorizedException('User account is deactivated');
      }

      // Generate new tokens
      const newAccessToken = await this.generateAccessToken(user.id);

      // Get user roles

      return {
        accessToken: newAccessToken,
      };
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  // Legacy placeholder methods removed to avoid signature conflicts with BaseService
}
