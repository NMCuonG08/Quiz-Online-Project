import { Test, TestingModule } from '@nestjs/testing';
import { UsersService } from './user.service';
import { PrismaService } from '@/infrastructure/database/prisma.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { ResourceNotFoundException } from '@/common/middlewares';
import { createTestUser } from '../../../test/setup';

describe('UsersService', () => {
  let service: UsersService;
  let prismaService: PrismaService;

  const mockPrismaService = {
    user: {
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
    prismaService = module.get<PrismaService>(PrismaService);

    // Reset all mocks
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    const createUserDto: CreateUserDto = {
      email: 'test@example.com',
      username: 'testuser',
      fullName: 'Test User',
      password: 'hashed-password',
      avatar: 'avatar-url',
      age: 25,
    };

    it('should create a new user successfully', async () => {
      const mockUser = createTestUser({
        email: createUserDto.email,
        username: createUserDto.username,
        full_name: createUserDto.fullName,
        password: createUserDto.password,
        avatar: createUserDto.avatar,
      });

      mockPrismaService.user.create.mockResolvedValue(mockUser);

      const result = await service.create(createUserDto);

      expect(result).toEqual(mockUser);
      expect(prismaService.user.create).toHaveBeenCalledWith({
        data: {
          email: createUserDto.email,
          username: createUserDto.username,
          full_name: createUserDto.fullName,
          password: createUserDto.password,
          avatar: createUserDto.avatar,
        },
      });
    });

    it('should create user with minimal required data', async () => {
      const minimalDto = {
        email: 'minimal@example.com',
        password: 'hashed-password',
      } as CreateUserDto;

      const mockUser = createTestUser({
        email: minimalDto.email,
        password: minimalDto.password,
      });

      mockPrismaService.user.create.mockResolvedValue(mockUser);

      const result = await service.create(minimalDto);

      expect(result).toEqual(mockUser);
      expect(prismaService.user.create).toHaveBeenCalledWith({
        data: {
          email: minimalDto.email,
          username: undefined,
          full_name: undefined,
          password: minimalDto.password,
          avatar: undefined,
        },
      });
    });

    it('should handle undefined optional fields correctly', async () => {
      const dtoWithUndefined = {
        email: 'test@example.com',
        password: 'hashed-password',
        username: undefined,
        fullName: undefined,
        avatar: undefined,
      } as CreateUserDto;

      const mockUser = createTestUser({
        email: dtoWithUndefined.email,
        password: dtoWithUndefined.password,
      });

      mockPrismaService.user.create.mockResolvedValue(mockUser);

      const result = await service.create(dtoWithUndefined);

      expect(result).toEqual(mockUser);
      expect(prismaService.user.create).toHaveBeenCalledWith({
        data: {
          email: dtoWithUndefined.email,
          username: undefined,
          full_name: undefined,
          password: dtoWithUndefined.password,
          avatar: undefined,
        },
      });
    });

    it('should handle prisma service errors', async () => {
      const error = new Error('Database connection failed');
      mockPrismaService.user.create.mockRejectedValue(error);

      await expect(service.create(createUserDto)).rejects.toThrow(error);
      expect(prismaService.user.create).toHaveBeenCalledWith({
        data: {
          email: createUserDto.email,
          username: createUserDto.username,
          full_name: createUserDto.fullName,
          password: createUserDto.password,
          avatar: createUserDto.avatar,
        },
      });
    });
  });

  describe('findAll', () => {
    it('should return all users ordered by creation date', async () => {
      const mockUsers = [
        createTestUser({ id: 'user-1', email: 'user1@example.com' }),
        createTestUser({ id: 'user-2', email: 'user2@example.com' }),
      ];

      mockPrismaService.user.findMany.mockResolvedValue(mockUsers);

      const result = await service.findAll();

      expect(result).toEqual(mockUsers);
      expect(prismaService.user.findMany).toHaveBeenCalledWith({
        orderBy: { created_at: 'desc' },
      });
    });

    it('should return empty array when no users exist', async () => {
      mockPrismaService.user.findMany.mockResolvedValue([]);

      const result = await service.findAll();

      expect(result).toEqual([]);
      expect(prismaService.user.findMany).toHaveBeenCalledWith({
        orderBy: { created_at: 'desc' },
      });
    });

    it('should handle prisma service errors', async () => {
      const error = new Error('Database query failed');
      mockPrismaService.user.findMany.mockRejectedValue(error);

      await expect(service.findAll()).rejects.toThrow(error);
      expect(prismaService.user.findMany).toHaveBeenCalledWith({
        orderBy: { created_at: 'desc' },
      });
    });
  });

  describe('findOne', () => {
    const userId = 'test-user-id';

    it('should return a user when found', async () => {
      const mockUser = createTestUser({ id: userId });

      mockPrismaService.user.findUnique.mockResolvedValue(mockUser);

      const result = await service.findOne(userId);

      expect(result).toEqual(mockUser);
      expect(prismaService.user.findUnique).toHaveBeenCalledWith({
        where: { id: userId },
      });
    });

    it('should throw ResourceNotFoundException when user not found', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(null);

      await expect(service.findOne(userId)).rejects.toThrow(
        new ResourceNotFoundException('User', userId),
      );

      expect(prismaService.user.findUnique).toHaveBeenCalledWith({
        where: { id: userId },
      });
    });

    it('should handle prisma service errors', async () => {
      const error = new Error('Database query failed');
      mockPrismaService.user.findUnique.mockRejectedValue(error);

      await expect(service.findOne(userId)).rejects.toThrow(error);
      expect(prismaService.user.findUnique).toHaveBeenCalledWith({
        where: { id: userId },
      });
    });

    it('should handle empty string ID', async () => {
      const emptyId = '';

      mockPrismaService.user.findUnique.mockResolvedValue(null);

      await expect(service.findOne(emptyId)).rejects.toThrow(
        new ResourceNotFoundException('User', emptyId),
      );

      expect(prismaService.user.findUnique).toHaveBeenCalledWith({
        where: { id: emptyId },
      });
    });
  });

  describe('update', () => {
    const userId = 'test-user-id';
    const updateUserDto: UpdateUserDto = {
      email: 'updated@example.com',
      username: 'updateduser',
      fullName: 'Updated User',
      password: 'new-hashed-password',
      avatar: 'new-avatar-url',
    };

    it('should update user with all fields', async () => {
      const mockUpdatedUser = createTestUser({
        id: userId,
        ...updateUserDto,
        full_name: updateUserDto.fullName,
      });

      mockPrismaService.user.update.mockResolvedValue(mockUpdatedUser);

      const result = await service.update(userId, updateUserDto);

      expect(result).toEqual(mockUpdatedUser);
      expect(prismaService.user.update).toHaveBeenCalledWith({
        where: { id: userId },
        data: {
          email: updateUserDto.email,
          username: updateUserDto.username,
          full_name: updateUserDto.fullName,
          password: updateUserDto.password,
          avatar: updateUserDto.avatar,
        },
      });
    });

    it('should update user with partial data', async () => {
      const partialDto = {
        email: 'partial@example.com',
        username: 'partialuser',
      } as UpdateUserDto;

      const mockUpdatedUser = createTestUser({
        id: userId,
        email: partialDto.email,
        username: partialDto.username,
      });

      mockPrismaService.user.update.mockResolvedValue(mockUpdatedUser);

      const result = await service.update(userId, partialDto);

      expect(result).toEqual(mockUpdatedUser);
      expect(prismaService.user.update).toHaveBeenCalledWith({
        where: { id: userId },
        data: {
          email: partialDto.email,
          username: partialDto.username,
          full_name: undefined,
          password: undefined,
          avatar: undefined,
        },
      });
    });

    it('should handle undefined fields correctly', async () => {
      const dtoWithUndefined = {
        email: 'test@example.com',
        username: undefined,
        fullName: undefined,
        password: undefined,
        avatar: undefined,
      } as UpdateUserDto;

      const mockUpdatedUser = createTestUser({
        id: userId,
        email: dtoWithUndefined.email,
      });

      mockPrismaService.user.update.mockResolvedValue(mockUpdatedUser);

      const result = await service.update(userId, dtoWithUndefined);

      expect(result).toEqual(mockUpdatedUser);
      expect(prismaService.user.update).toHaveBeenCalledWith({
        where: { id: userId },
        data: {
          email: dtoWithUndefined.email,
          username: undefined,
          full_name: undefined,
          password: undefined,
          avatar: undefined,
        },
      });
    });

    it('should handle prisma service errors', async () => {
      const error = new Error('Database update failed');
      mockPrismaService.user.update.mockRejectedValue(error);

      await expect(service.update(userId, updateUserDto)).rejects.toThrow(
        error,
      );
      expect(prismaService.user.update).toHaveBeenCalledWith({
        where: { id: userId },
        data: {
          email: updateUserDto.email,
          username: updateUserDto.username,
          full_name: updateUserDto.fullName,
          password: updateUserDto.password,
          avatar: updateUserDto.avatar,
        },
      });
    });

    it('should handle empty string ID', async () => {
      const emptyId = '';
      const error = new Error('Database update failed');
      mockPrismaService.user.update.mockRejectedValue(error);

      await expect(service.update(emptyId, updateUserDto)).rejects.toThrow(
        error,
      );
      expect(prismaService.user.update).toHaveBeenCalledWith({
        where: { id: emptyId },
        data: {
          email: updateUserDto.email,
          username: updateUserDto.username,
          full_name: updateUserDto.fullName,
          password: updateUserDto.password,
          avatar: updateUserDto.avatar,
        },
      });
    });
  });

  describe('remove', () => {
    const userId = 'test-user-id';

    it('should delete user successfully', async () => {
      const mockDeletedUser = createTestUser({ id: userId });

      mockPrismaService.user.delete.mockResolvedValue(mockDeletedUser);

      const result = await service.remove(userId);

      expect(result).toEqual(mockDeletedUser);
      expect(prismaService.user.delete).toHaveBeenCalledWith({
        where: { id: userId },
      });
    });

    it('should handle prisma service errors', async () => {
      const error = new Error('Database deletion failed');
      mockPrismaService.user.delete.mockRejectedValue(error);

      await expect(service.remove(userId)).rejects.toThrow(error);
      expect(prismaService.user.delete).toHaveBeenCalledWith({
        where: { id: userId },
      });
    });

    it('should handle empty string ID', async () => {
      const emptyId = '';
      const error = new Error('Database deletion failed');
      mockPrismaService.user.delete.mockRejectedValue(error);

      await expect(service.remove(emptyId)).rejects.toThrow(error);
      expect(prismaService.user.delete).toHaveBeenCalledWith({
        where: { id: emptyId },
      });
    });
  });

  describe('Edge cases', () => {
    it('should handle null values in DTOs', async () => {
      const dtoWithNull = {
        email: 'test@example.com',
        password: 'hashed-password',
        username: null,
        fullName: null,
        avatar: null,
      } as any;

      const mockUser = createTestUser({
        email: dtoWithNull.email,
        password: dtoWithNull.password,
      });

      mockPrismaService.user.create.mockResolvedValue(mockUser);

      const result = await service.create(dtoWithNull);

      expect(result).toEqual(mockUser);
      expect(prismaService.user.create).toHaveBeenCalledWith({
        data: {
          email: dtoWithNull.email,
          username: undefined,
          full_name: undefined,
          password: dtoWithNull.password,
          avatar: undefined,
        },
      });
    });

    it('should handle very long string values', async () => {
      const longString = 'a'.repeat(1000);
      const dtoWithLongValues = {
        email: 'test@example.com',
        password: 'hashed-password',
        username: longString,
        fullName: longString,
        avatar: longString,
      } as CreateUserDto;

      const mockUser = createTestUser({
        email: dtoWithLongValues.email,
        password: dtoWithLongValues.password,
        username: longString,
        full_name: longString,
        avatar: longString,
      });

      mockPrismaService.user.create.mockResolvedValue(mockUser);

      const result = await service.create(dtoWithLongValues);

      expect(result).toEqual(mockUser);
      expect(prismaService.user.create).toHaveBeenCalledWith({
        data: {
          email: dtoWithLongValues.email,
          username: longString,
          full_name: longString,
          password: dtoWithLongValues.password,
          avatar: longString,
        },
      });
    });

    it('should handle special characters in strings', async () => {
      const specialChars = '!@#$%^&*()_+-=[]{}|;:,.<>?';
      const dtoWithSpecialChars = {
        email: 'test@example.com',
        password: 'hashed-password',
        username: specialChars,
        fullName: specialChars,
        avatar: specialChars,
      } as CreateUserDto;

      const mockUser = createTestUser({
        email: dtoWithSpecialChars.email,
        password: dtoWithSpecialChars.password,
        username: specialChars,
        full_name: specialChars,
        avatar: specialChars,
      });

      mockPrismaService.user.create.mockResolvedValue(mockUser);

      const result = await service.create(dtoWithSpecialChars);

      expect(result).toEqual(mockUser);
      expect(prismaService.user.create).toHaveBeenCalledWith({
        data: {
          email: dtoWithSpecialChars.email,
          username: specialChars,
          full_name: specialChars,
          password: dtoWithSpecialChars.password,
          avatar: specialChars,
        },
      });
    });
  });

  describe('Service method calls', () => {
    it('should call prisma service methods with correct parameters', async () => {
      const createUserDto: CreateUserDto = {
        email: 'test@example.com',
        password: 'hashed-password',
      };

      const mockUser = createTestUser({
        email: createUserDto.email,
        password: createUserDto.password,
      });

      mockPrismaService.user.create.mockResolvedValue(mockUser);

      await service.create(createUserDto);

      expect(prismaService.user.create).toHaveBeenCalledWith({
        data: {
          email: createUserDto.email,
          username: undefined,
          full_name: undefined,
          password: createUserDto.password,
          avatar: undefined,
        },
      });
    });

    it('should not call prisma service methods when not invoked', async () => {
      expect(prismaService.user.create).not.toHaveBeenCalled();
      expect(prismaService.user.findMany).not.toHaveBeenCalled();
      expect(prismaService.user.findUnique).not.toHaveBeenCalled();
      expect(prismaService.user.update).not.toHaveBeenCalled();
      expect(prismaService.user.delete).not.toHaveBeenCalled();
    });
  });
});
