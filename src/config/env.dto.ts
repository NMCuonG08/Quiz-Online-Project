import { Transform, Type } from 'class-transformer';
import { IsEnum, IsInt, IsString, Matches } from 'class-validator';
import { DatabaseSslMode, projectEnvironment, LogLevel } from '@/common/enums';
import { IsIPRange, Optional, ValidateBoolean } from '@/config/validation';

export class EnvDto {
  @IsInt()
  @Optional()
  @Type(() => Number)
  project_API_METRICS_PORT?: number;

  @IsString()
  @Optional()
  project_BUILD_DATA?: string;

  @IsString()
  @Optional()
  project_BUILD?: string;

  @IsString()
  @Optional()
  project_BUILD_URL?: string;

  @IsString()
  @Optional()
  project_BUILD_IMAGE?: string;

  @IsString()
  @Optional()
  project_BUILD_IMAGE_URL?: string;

  @IsString()
  @Optional()
  project_CONFIG_FILE?: string;

  @IsEnum(projectEnvironment)
  @Optional()
  project_ENV?: projectEnvironment;

  @IsString()
  @Optional()
  project_HOST?: string;

  @ValidateBoolean({ optional: true })
  project_IGNORE_MOUNT_CHECK_ERRORS?: boolean;

  @IsEnum(LogLevel)
  @Optional()
  project_LOG_LEVEL?: LogLevel;

  @Optional()
  @Matches(/^\//, {
    message: 'project_MEDIA_LOCATION must be an absolute path',
  })
  project_MEDIA_LOCATION?: string;

  @IsInt()
  @Optional()
  @Type(() => Number)
  project_MICROSERVICES_METRICS_PORT?: number;

  @IsInt()
  @Optional()
  @Type(() => Number)
  project_PORT?: number;

  @IsString()
  @Optional()
  project_REPOSITORY?: string;

  @IsString()
  @Optional()
  project_REPOSITORY_URL?: string;

  @IsString()
  @Optional()
  project_SOURCE_REF?: string;

  @IsString()
  @Optional()
  project_SOURCE_COMMIT?: string;

  @IsString()
  @Optional()
  project_SOURCE_URL?: string;

  @IsString()
  @Optional()
  project_TELEMETRY_INCLUDE?: string;

  @IsString()
  @Optional()
  project_TELEMETRY_EXCLUDE?: string;

  @IsString()
  @Optional()
  project_THIRD_PARTY_SOURCE_URL?: string;

  @IsString()
  @Optional()
  project_THIRD_PARTY_BUG_FEATURE_URL?: string;

  @IsString()
  @Optional()
  project_THIRD_PARTY_DOCUMENTATION_URL?: string;

  @IsString()
  @Optional()
  project_THIRD_PARTY_SUPPORT_URL?: string;

  @IsIPRange({ requireCIDR: false }, { each: true })
  @Transform(({ value }) =>
    value && typeof value === 'string'
      ? value
          .split(',')
          .map((value) => value.trim())
          .filter(Boolean)
      : value,
  )
  @Optional()
  project_TRUSTED_PROXIES?: string[];

  @IsString()
  @Optional()
  project_WORKERS_INCLUDE?: string;

  @IsString()
  @Optional()
  project_WORKERS_EXCLUDE?: string;

  @IsString()
  @Optional()
  DB_DATABASE_NAME?: string;

  @IsString()
  @Optional()
  DB_HOSTNAME?: string;

  @IsString()
  @Optional()
  DB_PASSWORD?: string;

  @IsInt()
  @Optional()
  @Type(() => Number)
  DB_PORT?: number;

  @ValidateBoolean({ optional: true })
  DB_SKIP_MIGRATIONS?: boolean;

  @IsEnum(DatabaseSslMode)
  @Optional()
  DB_SSL_MODE?: DatabaseSslMode;

  @IsString()
  @Optional()
  DB_URL?: string;

  @IsString()
  @Optional()
  DB_USERNAME?: string;

  @IsEnum(['pgvector', 'pgvecto.rs', 'vectorchord'])
  @Optional()
  DB_VECTOR_EXTENSION?: 'pgvector' | 'pgvecto.rs' | 'vectorchord';

  @IsString()
  @Optional()
  NO_COLOR?: string;

  @IsString()
  @Optional()
  REDIS_HOST?: string;

  @IsInt()
  @Optional()
  @Type(() => Number)
  REDIS_PORT?: number;

  @IsInt()
  @Optional()
  @Type(() => Number)
  REDIS_DBINDEX?: number;

  @IsString()
  @Optional()
  REDIS_USERNAME?: string;

  @IsString()
  @Optional()
  REDIS_PASSWORD?: string;

  @IsString()
  @Optional()
  REDIS_SOCKET?: string;

  @IsString()
  @Optional()
  REDIS_URL?: string;
}
