import { JobName, QueueName } from '@/common/enums';

export interface JobCounts {
  active: number;
  completed: number;
  failed: number;
  delayed: number;
  waiting: number;
  paused: number;
}
export interface IBaseJob {
  force?: boolean;
}
export type JobSource = 'upload' | 'sidecar-write' | 'copy';

export interface IEntityJob extends IBaseJob {
  id: string;
  source?: JobSource;
  notify?: boolean;
}

export interface IUploadImageJob extends IBaseJob {
  id: string;
  image: Express.Multer.File;
}

export interface QueueStatus {
  isActive: boolean;
  isPaused: boolean;
}
export type JobItem =
  | { name: JobName.VersionCheck; data: IBaseJob }
  | { name: JobName.UploadImage; data: IUploadImageJob };
// // Backups
// | { name: JobName.DatabaseBackup; data?: IBaseJob }

// // Transcoding
// | { name: JobName.AssetEncodeVideoQueueAll; data: IBaseJob }
// | { name: JobName.AssetEncodeVideo; data: IEntityJob };
export type Jobs = { [K in JobItem['name']]: (JobItem & { name: K })['data'] };

export type JobOf<T extends JobItem['name']> = Jobs[T];
export interface QueueStatus {
  isActive: boolean;
  isPaused: boolean;
}
export type ConcurrentQueueName = Exclude<
  QueueName,
  | QueueName.StorageTemplateMigration
  | QueueName.FacialRecognition
  | QueueName.DuplicateDetection
  | QueueName.BackupDatabase
>;
