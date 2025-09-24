import {
  ApiBearerAuth,
  ApiCookieAuth,
  ApiExtension,
  ApiQuery,
  ApiSecurity,
} from '@nestjs/swagger';
import {
  applyDecorators,
  CanActivate,
  createParamDecorator,
  ExecutionContext,
  Injectable,
  SetMetadata,
} from '@nestjs/common';
import {
  MetadataKey,
  Permission,
  ApiCustomExtension,
  projectQuery,
} from '@/common/enums';
import { AuthDto } from '@/modules/auth/dto/base-auth.dto';
import { Request } from 'express';
import { LoggingRepository } from '@/common/repositories/logging.repository';
import { Reflector } from '@nestjs/core';
import { AuthService } from '@/modules/auth/services/auth.service';

type AdminRoute = { admin?: true };
type SharedLinkRoute = { sharedLink?: true };
type AuthenticatedOptions = { permission?: Permission | false } & (
  | AdminRoute
  | SharedLinkRoute
);

export const Authenticated = (
  options: AuthenticatedOptions = {},
): MethodDecorator => {
  const decorators: MethodDecorator[] = [
    ApiBearerAuth(),
    ApiCookieAuth(),
    ApiSecurity(MetadataKey.ApiKeySecurity),
    SetMetadata(MetadataKey.AuthRoute, options),
  ];

  if ((options as AdminRoute).admin) {
    decorators.push(ApiExtension(ApiCustomExtension.AdminOnly, true));
  }

  if (options?.permission) {
    decorators.push(
      ApiExtension(ApiCustomExtension.Permission, options.permission),
    );
  }

  if ((options as SharedLinkRoute)?.sharedLink) {
    decorators.push(
      ApiQuery({
        name: projectQuery.SharedLinkKey,
        type: String,
        required: false,
      }),
      ApiQuery({
        name: projectQuery.SharedLinkSlug,
        type: String,
        required: false,
      }),
    );
  }

  return applyDecorators(...decorators);
};
export const Auth = createParamDecorator(
  (data: unknown, context: ExecutionContext): AuthDto => {
    return context.switchToHttp().getRequest<AuthenticatedRequest>().user;
  },
);

export interface AuthRequest extends Request {
  user?: AuthDto;
}

export interface AuthenticatedRequest extends Request {
  user: AuthDto;
}

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private logger: LoggingRepository,
    private reflector: Reflector,
    private authService: AuthService,
  ) {
    this.logger.setContext(AuthGuard.name);
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const targets = [context.getHandler()];

    const options = this.reflector.getAllAndOverride<
      AuthenticatedOptions | undefined
    >(MetadataKey.AuthRoute, targets);
    if (!options) {
      return true;
    }

    const {
      admin: adminRoute,
      sharedLink: sharedLinkRoute,
      permission,
    } = { sharedLink: false, admin: false, ...options };
    const request = context.switchToHttp().getRequest<AuthRequest>();

    request.user = await this.authService.authenticate({
      headers: request.headers,
      queryParams: request.query as Record<string, string>,
      metadata: { adminRoute, sharedLinkRoute, permission, uri: request.path },
    });

    return true;
  }
}
