import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { UnauthorizedException, ConflictException } from '@nestjs/common';
import { AuthService } from './auth.service';
import { UserRepository } from '@/modules/user/repositories/user.repository';
import { CryptoRepository } from '@/common/repositories/crypto.repository';
import { EventRepository } from '@/common/repositories/event.repository';
import { LoginDto, SignupDto } from '../dto';

describe('AuthService', () => {
  let service: AuthService;
  let eventRepository: EventRepository;
  let userRepository: UserRepository;
  let cryptoRepository: CryptoRepository;

  const mockUser = {
    id: 'user-123',
    email: 'test@example.com',
    username: 'testuser',
    full_name: 'Test User',
    password: 'hashedPassword',
    isAdmin: false,
    deletedAt: null,
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: JwtService,
          useValue: {
            signAsync: jest.fn().mockResolvedValue('mock-jwt-token'),
            verifyAsync: jest.fn().mockResolvedValue({
              sub: 'user-123',
              exp: Date.now() / 1000 + 3600,
            }),
          },
        },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn().mockImplementation((key: string) => {
              const config = {
                JWT_SECRET: 'test-secret',
                JWT_EXPIRES_IN: '7d',
                JWT_REFRESH_SECRET: 'test-refresh-secret',
              };
              return config[key];
            }),
          },
        },
        {
          provide: UserRepository,
          useValue: {
            findByEmail: jest.fn(),
            findByUsername: jest.fn(),
            create: jest.fn(),
            findOne: jest.fn(),
            update: jest.fn(),
            assignRole: jest.fn(),
            getUserRoles: jest.fn().mockResolvedValue(['user']),
            getUserPermissions: jest.fn().mockResolvedValue([]),
          },
        },
        {
          provide: CryptoRepository,
          useValue: {
            hashBcrypt: jest.fn().mockResolvedValue('hashedPassword'),
            compareBcrypt: jest.fn().mockReturnValue(true),
          },
        },
        {
          provide: EventRepository,
          useValue: {
            emit: jest.fn(),
          },
        },
        // Mock all other dependencies
        { provide: 'LoggingRepository', useValue: {} },
        { provide: 'QuizRepository', useValue: {} },
        { provide: 'CategoryRepository', useValue: {} },
        { provide: 'CloudinaryService', useValue: {} },
        { provide: 'JobRepository', useValue: {} },
        { provide: 'RedisService', useValue: {} },
        { provide: 'AuthCacheService', useValue: {} },
        { provide: 'EmailRepository', useValue: {} },
        { provide: 'NotificationRepository', useValue: {} },
        { provide: 'PrismaService', useValue: {} },
        { provide: 'QuestionRepository', useValue: {} },
        { provide: 'QuestionOptionRepository', useValue: {} },
        { provide: 'RoomRepository', useValue: {} },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    eventRepository = module.get<EventRepository>(EventRepository);
    userRepository = module.get<UserRepository>(UserRepository);
    cryptoRepository = module.get<CryptoRepository>(CryptoRepository);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('login', () => {
    it('should login successfully and emit UserLogin event', async () => {
      const loginDto: LoginDto = {
        email: 'test@example.com',
        password: 'password123',
      };

      jest.spyOn(userRepository, 'findByEmail').mockResolvedValue(mockUser);
      jest.spyOn(cryptoRepository, 'compareBcrypt').mockReturnValue(true);
      jest.spyOn(userRepository, 'getUserRoles').mockResolvedValue(['user']);
      jest.spyOn(eventRepository, 'emit').mockResolvedValue(undefined);

      const result = await service.login(loginDto);

      expect(result).toBeDefined();
      expect(result.user.id).toBe('user-123');
      expect(result.accessToken).toBe('mock-jwt-token');
      expect(result.refreshToken).toBe('mock-jwt-token');

      // Verify UserLogin event was emitted
      expect(eventRepository.emit).toHaveBeenCalledWith('UserLogin', {
        userId: 'user-123',
      });
    });

    it('should throw UnauthorizedException for invalid credentials', async () => {
      const loginDto: LoginDto = {
        email: 'test@example.com',
        password: 'wrongpassword',
      };

      jest.spyOn(userRepository, 'findByEmail').mockResolvedValue(mockUser);
      jest.spyOn(cryptoRepository, 'compareBcrypt').mockReturnValue(false);

      await expect(service.login(loginDto)).rejects.toThrow(
        UnauthorizedException,
      );
      expect(eventRepository.emit).not.toHaveBeenCalled();
    });
  });

  describe('logout', () => {
    it('should logout successfully and emit UserCacheInvalidated event', async () => {
      const userId = 'user-123';

      jest.spyOn(userRepository, 'update').mockResolvedValue(mockUser);
      jest.spyOn(eventRepository, 'emit').mockResolvedValue(undefined);

      const result = await service.logout(userId);

      expect(result).toBe(true);
      expect(userRepository.update).toHaveBeenCalledWith(userId, {
        refreshToken: null,
      });

      // Verify UserCacheInvalidated event was emitted
      expect(eventRepository.emit).toHaveBeenCalledWith(
        'UserCacheInvalidated',
        {
          keys: [`auth:permissions:${userId}`, `auth:roles:${userId}`],
          userId,
        },
      );
    });
  });
});
