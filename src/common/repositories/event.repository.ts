import { Notification } from '@prisma/client';
import {
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { ClassConstructor } from 'class-transformer';
import { ModuleRef } from '@nestjs/core';
import { Reflector } from '@nestjs/core';
import { ConfigRepository } from '@/common/repositories/config.repository';
import { LoggingRepository } from '@/common/repositories/logging.repository';
import { MetadataKey, projectWorker, QueueName } from '@/common/enums';
import { EventConfig } from '@/common/decorators';
import _ from 'lodash';
import { Server, Socket } from 'socket.io';
import { handlePromiseError } from '@/common/utils/misc';
import { AuthDto } from '@/modules/auth/dto';
import { SystemConfig } from '@/config/systemConfig';
import { JobItem } from '@/common/types';

type EmitHandlers = Partial<{ [T in EmitEvent]: Array<EventItem<T>> }>;

type Item<T extends EmitEvent> = {
  event: T;
  handler: EmitHandler<T>;
  priority: number;
  server: boolean;
  label: string;
};

type EventMap = {
  // app events
  AppBootstrap: [];
  AppShutdown: [];
  ConfigInit: [{ newConfig: SystemConfig }];
  // config events
  ConfigUpdate: [
    {
      newConfig: SystemConfig;
      oldConfig: SystemConfig;
    },
  ];
  UserLogin: [{ userId: string }];
  ConfigValidate: [{ newConfig: SystemConfig; oldConfig: SystemConfig }];
  Notification: [{ userId: string; message: string }];
  JobStart: [QueueName, JobItem];
  JobFailed: [{ job: JobItem; error: Error | any }];
  WebsocketConnect: [{ userId: string }];
  // cache invalidation events
  CategoryCacheInvalidated: [{ keys: string | string[] }];
  CategoryAllCacheInvalidated: [{ keys: string | string[] }];
  NotificationCacheInvalidated: [{ keys: string | string[] }];
  NotificationAllCacheInvalidated: [{ keys: string | string[] }];
  NotificationUserCacheInvalidated: [
    { keys: string | string[]; userId: string },
  ];
  NotificationUnreadCacheInvalidated: [
    { keys: string | string[]; userId: string },
  ];
  UserCacheInvalidated: [{ keys: string | string[]; userId: string }];
  TokenCacheInvalidated: [{ keys: string | string[] }];
  CustomCacheInvalidated: [{ keys: string | string[]; [key: string]: any }];
  // domain CRUD events
  CategoryCreated: [{ id: string }];
  CategoryUpdated: [{ id: string }];
  CategoryDeleted: [{ id: string }];
  QuizCreated: [{ id: string }];
  QuizUpdated: [{ id: string }];
  QuizDeleted: [{ id: string }];
  QuestionCreated: [{ id: string; quizId: string }];
  QuestionUpdated: [{ id: string; quizId: string }];
  QuestionDeleted: [{ id: string; quizId: string }];
  QuestionOptionCreated: [{ id: string; questionId: string }];
  QuestionOptionUpdated: [{ id: string; questionId: string }];
  QuestionOptionDeleted: [{ id: string; questionId: string }];
  RoomCreated: [{ id: string; ownerId: string }];
  RoomUpdated: [{ id: string; ownerId: string }];
  RoomDeleted: [{ id: string; ownerId: string }];
  UserCreated: [{ id: string }];
  UserUpdated: [{ id: string }];
  UserDeleted: [{ id: string }];
};

export type EventItem<T extends EmitEvent> = {
  event: T;
  handler: EmitHandler<T>;
  server: boolean;
};

export const serverEvents = ['ConfigUpdate'] as const;
export type ServerEvents = (typeof serverEvents)[number];

export type EmitEvent = keyof EventMap;
export type EmitHandler<T extends EmitEvent> = (
  ...args: ArgsOf<T>
) => Promise<void> | void;
export type ArgOf<T extends EmitEvent> = EventMap[T][0];
export type ArgsOf<T extends EmitEvent> = EventMap[T];
export type AuthFn = (client: Socket) => Promise<AuthDto>;

export interface ClientEventMap {
  on_user_delete: [string];
  on_asset_delete: [string];
  notification: [string];
  participants_list: [
    {
      roomId: string;
      participants: Array<{
        user_id: string;
        username?: string | null;
        full_name?: string | null;
        avatar_url?: string | null;
        joined_at: Date | string;
        status: string;
      }>;
    },
  ];
  //   on_asset_trash: [string[]];
  //   on_asset_hidden: [string];
  //   on_asset_restore: [string[]];
  //   on_asset_stack_update: string[];
  //   on_person_thumbnail: [string];
  //   on_config_update: [];
  //   on_new_release: [ReleaseNotification];
  //   on_notification: [NotificationDto];
  //   on_session_delete: [string];
  //   AssetUploadReadyV1: [{ asset: SyncAssetV1; exif: SyncAssetExifV1 }];
}

@WebSocketGateway({
  cors: true,
  path: '/api/socket.io',
  transports: ['websocket'],
})
export class EventRepository
  implements OnGatewayConnection, OnGatewayDisconnect, OnGatewayInit
{
  private emitHandlers: EmitHandlers = {};
  private static authFn?: AuthFn;
  private connectionTimestamps: Map<string, number> = new Map();

  @WebSocketServer()
  private server?: Server;

  constructor(
    private moduleRef: ModuleRef,
    private configRepository: ConfigRepository,
    private logger: LoggingRepository,
  ) {
    this.logger.setContext(EventRepository.name);
  }
  setup({
    services,
    moduleRef, // moduleRef từ bên ngoài truyền vào
  }: {
    services: ClassConstructor<unknown>[];
    moduleRef?: ModuleRef;
  }) {
    // ✅ Ưu tiên dùng moduleRef từ ngoài, nếu không có thì dùng this.moduleRef
    const targetModuleRef = moduleRef || this.moduleRef;

    const reflector = targetModuleRef.get(Reflector, { strict: false });
    const items: Item<EmitEvent>[] = [];
    const worker = this.configRepository.getWorker();

    if (!worker) {
      throw new Error('Unable to determine worker type');
    }

    for (const Service of services) {
      // ✅ Dùng targetModuleRef đã chọn ở trên
      const instance = targetModuleRef.get<any>(Service, { strict: false });

      const ctx = Object.getPrototypeOf(instance);

      for (const property of Object.getOwnPropertyNames(ctx)) {
        const descriptor = Object.getOwnPropertyDescriptor(ctx, property);
        if (!descriptor || descriptor.get || descriptor.set) {
          continue;
        }
        const handler = instance[property];
        if (typeof handler !== 'function') {
          continue;
        }
        const event = reflector.get<EventConfig>(
          MetadataKey.EventConfig,
          handler,
        );
        if (!event) {
          continue;
        }

        const workers = event.workers ?? Object.values(projectWorker);
        if (!workers.includes(worker)) {
          continue;
        }
        items.push({
          event: event.name,
          priority: event.priority || 0,
          server: event.server ?? false,
          handler: handler.bind(instance),
          label: `${Service.name}.${handler.name}`,
        });
      }
    }

    const handlers = _.orderBy(items, ['priority'], ['asc']);
    for (const handler of handlers) {
      this.addHandler(handler);
    }
  }
  afterInit(server: Server) {
    this.logger.log('Initialized websocket server');

    for (const event of serverEvents) {
      server.on(event, (...args: ArgsOf<any>) => {
        this.logger.debug(`Server event: ${event} (receive)`);
        handlePromiseError(
          this.onEvent({ name: event, args, server: true }),
          this.logger,
        );
      });
    }
  }

  async handleConnection(client: Socket) {
    try {
      this.logger.log(`Websocket Connect:    ${client.id}`);
      const auth = await this.authenticate(client);

      // Debounce: Check if user connected recently (within 1 second)
      const now = Date.now();
      const lastConnection = this.connectionTimestamps.get(auth.user.id);
      if (lastConnection && now - lastConnection < 1000) {
        client.disconnect();
        return;
      }
      this.connectionTimestamps.set(auth.user.id, now);

      // Disconnect other connections for the same user
      const room = this.server?.sockets.adapter.rooms.get(auth.user.id);
      if (room) {
        for (const socketId of room) {
          if (socketId !== client.id) {
            this.server?.sockets.sockets.get(socketId)?.disconnect();
          }
        }
      }

      await client.join(auth.user.id);

      // Không cần session khi dùng JWT - user đã được xác thực qua token
      await this.onEvent({
        name: 'WebsocketConnect',
        args: [{ userId: auth.user.id }],
        server: false,
      });
    } catch (error: Error | any) {
      this.logger.error(`Websocket connection error: ${error}`, error?.stack);
      client.emit('error', 'unauthorized');
      client.disconnect();
    }
  }

  async handleDisconnect(client: Socket) {
    this.logger.log(`Websocket Disconnect: ${client.id}`);
    await client.leave(client.nsp.name);
  }

  private addHandler<T extends EmitEvent>(item: Item<T>): void {
    const event = item.event;

    if (!this.emitHandlers[event]) {
      this.emitHandlers[event] = [];
    }

    this.emitHandlers[event].push(item);
  }

  emit<T extends EmitEvent>(event: T, ...args: ArgsOf<T>): Promise<void> {
    return this.onEvent({ name: event, args, server: false });
  }

  private async onEvent<T extends EmitEvent>(event: {
    name: T;
    args: ArgsOf<T>;
    server: boolean;
  }): Promise<void> {
    const handlers = this.emitHandlers[event.name] || [];

    for (const { handler, server } of handlers) {
      // exclude handlers that ignore server events
      if (!server && event.server) {
        continue;
      }

      await handler(...event.args);
    }
  }

  clientSend<T extends keyof ClientEventMap>(
    event: T,
    room: string,
    ...data: ClientEventMap[T]
  ) {
    this.server?.to(room).emit(event, ...data);
  }

  clientBroadcast<T extends keyof ClientEventMap>(
    event: T,
    ...data: ClientEventMap[T]
  ) {
    this.server?.emit(event, ...data);
  }

  async joinUserToRoom(userId: string, room: string): Promise<void> {
    // Fetch all sockets currently in the user's personal room (userId)
    const sockets = await this.server?.in(userId).fetchSockets();
    if (!sockets || sockets.length === 0) return;
    for (const socket of sockets) {
      await socket.join(room);
    }
  }

  async listSocketsInRoom(room: string): Promise<string[]> {
    const sockets = await this.server?.in(room).fetchSockets();
    if (!sockets) return [];
    return sockets.map((s) => s.id);
  }

  serverSend<T extends ServerEvents>(event: T, ...args: ArgsOf<T>): void {
    this.logger.debug(`Server event: ${event} (send)`);
    this.server?.serverSideEmit(event, ...args);
  }

  static setAuthFn(fn: AuthFn) {
    EventRepository.authFn = fn;
  }

  private async authenticate(client: Socket) {
    if (!EventRepository.authFn) {
      throw new Error('Auth function not set');
    }
    return EventRepository.authFn(client);
  }
}
