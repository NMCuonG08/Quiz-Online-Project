import { SetMetadata } from '@nestjs/common';
import { MetadataKey } from '@/common/enums';

export const Telemetry = (options: { enabled?: boolean }) =>
  SetMetadata(MetadataKey.TelemetryEnabled, options?.enabled ?? true);
