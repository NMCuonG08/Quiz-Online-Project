import {
  Injectable,
  OnApplicationBootstrap,
  OnModuleInit,
  UnauthorizedException,
  Logger,
} from '@nestjs/common';
import { EventRepository } from '@/common/repositories/event.repository';
import { AuthService } from '@/modules/auth/services/auth.service';
import { Socket } from 'socket.io';
import { AuthDto } from '@/modules/auth/dto';
import { LazyModuleLoader, ModuleRef } from '@nestjs/core';
import { NotificationService } from '@/modules/notification/services/notification.service';
import { ClassConstructor } from 'class-transformer';
import { NotificationModule } from '@/modules/notification/notification.module';

@Injectable()
export class WebSocketSetupService
  implements OnApplicationBootstrap, OnModuleInit
{
  private readonly logger = new Logger(WebSocketSetupService.name);

  constructor(
    private eventRepository: EventRepository,
    private authService: AuthService,
    private moduleRef: ModuleRef,
    private readonly lazyModuleLoader: LazyModuleLoader,
  ) {
    this.logger.log('WebSocketSetupService constructor called');
  }

  onApplicationBootstrap(): void {
    EventRepository.setAuthFn(this.authenticateSocket.bind(this));
    this.logger.log('✅ Auth function registered in static setter');
  }

  onModuleInit(): void {
    // Setup EventRepository after module initialization
    this.setupEventRepository();
  }

  private setupEventRepository(): void {
    try {
      // ✅ Chỉ cần pass class
      this.eventRepository.setup({
        services: [NotificationService],
      });
      this.logger.log('✅ WebSocket EventRepository setup completed');
    } catch (error) {
      this.logger.error('❌ Failed to setup EventRepository:', error.message);
    }
  }

  private async authenticateSocket(client: Socket): Promise<AuthDto> {
    const token = client.handshake.auth?.token as string;
    this.logger.debug(`Authenticating WebSocket client: ${client.id}`);
    this.logger.debug(`Token received: ${token}`);
    let lastError: Error | null = null;
    // Try with provided token first
    if (token) {
      try {
        const authDto = await this.authService.authenticate({
          headers: {
            authorization: `Bearer ${token}`,
            cookie: client.handshake.headers.cookie || '',
          },
          queryParams: {},
          metadata: {
            sharedLinkRoute: false,
            adminRoute: false,
            permission: false,
            uri: '/websocket',
          },
        });
        this.logger.log(`✅ User authenticated: ${authDto.user.id}`);
        return authDto;
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        this.logger.warn(
          `Token invalid, will try refreshToken if available. Reason: ${lastError.message}`,
        );
      }
    }
    // If token invalid, try refreshToken from cookie
    const cookie = client.handshake.headers.cookie || '';
    const refreshMatch = cookie.match(/refreshToken=([^;]+)/);
    const refreshToken = refreshMatch ? refreshMatch[1] : null;
    if (refreshToken) {
      try {
        const { accessToken } =
          await this.authService.refreshAccessToken(refreshToken);
        this.logger.log('Refreshed accessToken from refreshToken in cookie');
        // Try authenticate again with new accessToken
        const authDto = await this.authService.authenticate({
          headers: {
            authorization: `Bearer ${accessToken}`,
            cookie,
          },
          queryParams: {},
          metadata: {
            sharedLinkRoute: false,
            adminRoute: false,
            permission: false,
            uri: '/websocket',
          },
        });
        this.logger.log(
          `✅ User authenticated (via refresh): ${authDto.user.id}`,
        );
        return authDto;
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        this.logger.error(
          `❌ Refresh token also invalid: ${lastError.message}`,
        );
      }
    }
    // If all fail
    this.logger.error(
      `❌ Authentication failed: ${lastError?.message || 'No valid token or refreshToken'}`,
    );
    throw new UnauthorizedException('Invalid token');
  }
}
