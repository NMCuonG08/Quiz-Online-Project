import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsUUID,
  IsBoolean,
  IsEnum,
} from 'class-validator';

export enum NotificationType {
  INFO = 'INFO',
  WARNING = 'WARNING',
  ERROR = 'ERROR',
  SUCCESS = 'SUCCESS',
}

export enum NotificationStatus {
  UNREAD = 'UNREAD',
  READ = 'READ',
  ARCHIVED = 'ARCHIVED',
}

export class CreateNotificationDto {
  @ApiProperty({ example: 'Notification Title' })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiProperty({ example: 'This is a notification message' })
  @IsString()
  @IsNotEmpty()
  message: string;

  @ApiProperty({
    example: NotificationType.INFO,
    enum: NotificationType,
  })
  @IsEnum(NotificationType)
  @IsNotEmpty()
  type: NotificationType;

  @ApiProperty({
    example: '5b3c4f8a-9d2c-4b2e-8f1a-1b2c3d4e5f6a',
    required: false,
  })
  @IsOptional()
  @IsUUID()
  user_id?: string;

  @ApiProperty({
    example: 'https://example.com/action',
    required: false,
  })
  @IsOptional()
  @IsString()
  action_url?: string;

  @ApiProperty({
    example: 'Action Button Text',
    required: false,
  })
  @IsOptional()
  @IsString()
  action_text?: string;
}

export class UpdateNotificationDto {
  @ApiProperty({ example: 'Updated Notification Title', required: false })
  @IsOptional()
  @IsString()
  title?: string;

  @ApiProperty({ example: 'Updated notification message', required: false })
  @IsOptional()
  @IsString()
  message?: string;

  @ApiProperty({
    example: NotificationType.WARNING,
    enum: NotificationType,
    required: false,
  })
  @IsOptional()
  @IsEnum(NotificationType)
  type?: NotificationType;

  @ApiProperty({
    example: NotificationStatus.READ,
    enum: NotificationStatus,
    required: false,
  })
  @IsOptional()
  @IsEnum(NotificationStatus)
  status?: NotificationStatus;

  @ApiProperty({
    example: 'https://example.com/updated-action',
    required: false,
  })
  @IsOptional()
  @IsString()
  action_url?: string;

  @ApiProperty({
    example: 'Updated Action Button Text',
    required: false,
  })
  @IsOptional()
  @IsString()
  action_text?: string;
}

export class NotificationResponseDto {
  @ApiProperty({ example: '5b3c4f8a-9d2c-4b2e-8f1a-1b2c3d4e5f6a' })
  id: string;

  @ApiProperty({ example: 'Notification Title' })
  title: string;

  @ApiProperty({ example: 'This is a notification message' })
  message: string;

  @ApiProperty({
    example: NotificationType.INFO,
    enum: NotificationType,
  })
  type: NotificationType;

  @ApiProperty({
    example: NotificationStatus.UNREAD,
    enum: NotificationStatus,
  })
  status: NotificationStatus;

  @ApiProperty({
    example: '5b3c4f8a-9d2c-4b2e-8f1a-1b2c3d4e5f6a',
    nullable: true,
  })
  user_id?: string;

  @ApiProperty({
    example: 'https://example.com/action',
    nullable: true,
  })
  action_url?: string;

  @ApiProperty({
    example: 'Action Button Text',
    nullable: true,
  })
  action_text?: string;

  @ApiProperty({ example: '2024-01-01T00:00:00.000Z' })
  created_at: Date;

  @ApiProperty({ example: '2024-01-01T00:00:00.000Z' })
  updated_at: Date;
}
