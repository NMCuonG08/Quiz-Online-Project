import {
  Controller,
  Get,
  Post,
  Body,
  UseGuards,
  HttpCode,
  HttpStatus,
  Res,
  Req,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Response, Request } from 'express';
import type { AuthLoginResult } from '../services/auth.service';

interface RequestWithCookies extends Request {
  cookies: {
    __refreshToken?: string;
  };
}
import { AuthService } from '../services/auth.service';
import { LoginDto, SignupDto, RefreshTokenDto, AuthDto } from '../dto';
import { AuthGuard } from '@/common/guards/auth.guard';
import { Authenticated, Auth } from '@/common/guards/auth.guard';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { Permission } from '@/common/enums';
import { ForgotPasswordDto } from '../dto';

@ApiTags('Authentication')
@Controller('/api/auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly configService: ConfigService,
  ) {}

  @Post('google')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Login with Google OAuth code' })
  @ApiResponse({ status: 200, description: 'Google login successful' })
  async loginWithGoogle(
    @Body('code') code: string,
    @Res({ passthrough: true }) res: Response,
  ) {
    const result: AuthLoginResult =
      await this.authService.loginWithGoogle(code);

    const isProduction =
      this.configService.get<string>('NODE_ENV') === 'production';
    const domain = this.configService.get<string>('COOKIE_DOMAIN') || undefined;

    res.cookie('__refreshToken', result.refreshToken, {
      httpOnly: true,
      secure: isProduction,
      sameSite: isProduction ? 'none' : 'lax',
      domain,
      path: '/',
      maxAge: 30 * 24 * 60 * 60 * 1000,
    });

    return { user: result.user, accessToken: result.accessToken };
  }

  // Compatibility route for clients posting to /auth/google/callback
  @Post('google/callback')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Google OAuth callback (compat)' })
  async loginWithGoogleCallback(
    @Body('code') code: string,
    @Res({ passthrough: true }) res: Response,
  ) {
    const result: AuthLoginResult =
      await this.authService.loginWithGoogle(code);

    const isProduction =
      this.configService.get<string>('NODE_ENV') === 'production';
    const domain = this.configService.get<string>('COOKIE_DOMAIN') || undefined;

    res.cookie('__refreshToken', result.refreshToken, {
      httpOnly: true,
      secure: isProduction,
      sameSite: isProduction ? 'none' : 'lax',
      domain,
      path: '/',
      maxAge: 30 * 24 * 60 * 60 * 1000,
    });

    return { user: result.user, accessToken: result.accessToken };
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'User login' })
  @ApiResponse({
    status: 200,
    description: 'Login successful',
    schema: {
      type: 'object',
      properties: {
        user: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            email: { type: 'string' },
            username: { type: 'string' },
            full_name: { type: 'string' },
            isAdmin: { type: 'boolean' },
            permissions: { type: 'array', items: { type: 'string' } },
          },
        },
        accessToken: { type: 'string' },
        refreshToken: { type: 'string' },
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Invalid credentials' })
  async login(
    @Body() loginDto: LoginDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const result: AuthLoginResult = await this.authService.login(loginDto);

    const isProduction =
      this.configService.get<string>('NODE_ENV') === 'production';
    const domain = this.configService.get<string>('COOKIE_DOMAIN') || undefined;

    // Only set refresh token in cookie
    res.cookie('__refreshToken', result.refreshToken, {
      httpOnly: true,
      secure: isProduction,
      sameSite: isProduction ? 'none' : 'lax',
      domain,
      path: '/',
      maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
    });

    return { user: result.user, accessToken: result.accessToken };
  }

  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'User registration' })
  @ApiResponse({
    status: 201,
    description: 'Registration successful',
    schema: {
      type: 'object',
      properties: {
        user: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            email: { type: 'string' },
            username: { type: 'string' },
            full_name: { type: 'string' },
            isAdmin: { type: 'boolean' },
            permissions: { type: 'array', items: { type: 'string' } },
          },
        },
        accessToken: { type: 'string' },
        refreshToken: { type: 'string' },
      },
    },
  })
  @ApiResponse({ status: 409, description: 'Email or username already exists' })
  async signup(@Body() signupDto: SignupDto) {
    const result: AuthLoginResult = await this.authService.signup(signupDto);
    return { user: result.user, accessToken: result.accessToken };
  }

  @Post('logout')
  @UseGuards(AuthGuard)
  @Authenticated({ permission: Permission.ActivityRead })
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'User logout' })
  @ApiResponse({ status: 200, description: 'Logout successful' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async logout(
    @Auth() auth: AuthDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const result = await this.authService.logout(auth.user.id);

    const isProduction =
      this.configService.get<string>('NODE_ENV') === 'production';
    const domain = this.configService.get<string>('COOKIE_DOMAIN') || undefined;

    // Clear refresh token cookies on client
    res.clearCookie('__refreshToken', {
      httpOnly: true,
      secure: isProduction,
      sameSite: isProduction ? 'none' : 'lax',
      domain,
      path: '/',
    });

    return result;
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Refresh access token using refresh token from body',
  })
  @ApiResponse({
    status: 200,
    description: 'Token refreshed successfully',
    schema: {
      type: 'object',
      properties: {
        user: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            email: { type: 'string' },
            username: { type: 'string' },
            full_name: { type: 'string' },
            isAdmin: { type: 'boolean' },
            roles: { type: 'array', items: { type: 'string' } },
          },
        },
        accessToken: { type: 'string' },
        refreshToken: { type: 'string' },
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Invalid refresh token' })
  async refreshToken(@Body() refreshTokenDto: RefreshTokenDto) {
    const { refreshToken } = refreshTokenDto;
    const result = await this.authService.refreshAccessToken(refreshToken);

    return { accessToken: result.accessToken };
  }

  @Post('refresh-cookie')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Refresh access token using refresh token from cookie',
  })
  @ApiResponse({
    status: 200,
    description: 'Token refreshed successfully',
    schema: {
      type: 'object',
      properties: {
        user: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            email: { type: 'string' },
            username: { type: 'string' },
            full_name: { type: 'string' },
            isAdmin: { type: 'boolean' },
            roles: { type: 'array', items: { type: 'string' } },
          },
        },
        accessToken: { type: 'string' },
        refreshToken: { type: 'string' },
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Invalid refresh token' })
  async refreshTokenFromCookie(@Req() req: RequestWithCookies) {
    const refreshToken = req.cookies?.__refreshToken;

    if (!refreshToken) {
      throw new UnauthorizedException('Refresh token not found in cookies');
    }

    const result = await this.authService.refreshAccessToken(refreshToken);

    return { accessToken: result.accessToken };
  }

  @Get('me')
  @UseGuards(AuthGuard)
  @Authenticated({ permission: Permission.ActivityRead })
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current user info' })
  @ApiResponse({
    status: 200,
    description: 'Current user information',
    schema: {
      type: 'object',
      properties: {
        id: { type: 'string' },
        email: { type: 'string' },
        username: { type: 'string' },
        full_name: { type: 'string' },
        isAdmin: { type: 'boolean' },
        permissions: { type: 'array', items: { type: 'string' } },
      },
    },
  })
  @Authenticated({ permission: Permission.ActivityRead })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  getCurrentUser(@Auth() auth: AuthDto) {
    return auth.user;
  }

  @Get('me/roles')
  @UseGuards(AuthGuard)
  @Authenticated({ permission: Permission.ActivityRead })
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current user roles' })
  getMyRoles(@Auth() auth: AuthDto) {
    return this.authService.getUserRoles(auth.user.id);
  }

  @Get('me/permissions')
  @UseGuards(AuthGuard)
  @Authenticated({ permission: Permission.ActivityRead })
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current user permissions' })
  getMyPermissions(@Auth() auth: AuthDto) {
    return this.authService.getUserPermissionsPublic(auth.user.id);
  }

  @Post('forgot-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Forgot password' })
  @ApiResponse({ status: 200, description: 'Forgot password successful' })
  @ApiResponse({ status: 401, description: 'Invalid email' })
  async forgotPassword(@Body() forgotPasswordDto: ForgotPasswordDto) {
    return await this.authService.forgotPassword(forgotPasswordDto);
  }
}
