import { SetMetadata } from '@nestjs/common';
import { projectWorker, JobName, MetadataKey, QueueName } from '@/common/enums';
import { EmitEvent } from '@/common/repositories/event.repository';

export const Telemetry = (options: { enabled?: boolean }) =>
  SetMetadata(MetadataKey.TelemetryEnabled, options?.enabled ?? true);
export type EventConfig = {
  name: EmitEvent;
  /** handle socket.io server events as well  */
  server?: boolean;
  /** lower value has higher priority, defaults to 0 */
  priority?: number;
  /** register events for these workers, defaults to all workers */
  workers?: projectWorker[];
};
export const OnEvent = (config: EventConfig) =>
  SetMetadata(MetadataKey.EventConfig, config);

export type JobConfig = {
  name: JobName;
  queue: QueueName;
};
export const OnJob = (config: JobConfig) =>
  SetMetadata(MetadataKey.JobConfig, config);
