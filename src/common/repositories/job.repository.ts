import { getQueueToken } from '@nestjs/bullmq';
import { Injectable } from '@nestjs/common';
import { ModuleRef, Reflector } from '@nestjs/core';
import { JobsOptions, Queue, Worker } from 'bullmq';
import { ClassConstructor } from 'class-transformer';
import { setTimeout } from 'node:timers/promises';
import { JobConfig } from '@/common/decorators';
import {
  JobName,
  JobStatus,
  MetadataKey,
  QueueCleanType,
  QueueName,
} from '@/common/enums';
import { ConfigRepository } from '@/common/repositories/config.repository';
import { MockEventRepository } from '@/common/repositories/mock-event.repository';
import { LoggingRepository } from '@/common/repositories/logging.repository';
import { JobCounts, JobItem, JobOf, QueueStatus } from '@/common/types';
import {
  getKeyByValue,
  getMethodNames,
  ProjetStartupError,
} from '@/common/utils/misc';

type JobMapItem = {
  jobName: JobName;
  queueName: QueueName;
  handler: (job: JobOf<any>) => Promise<JobStatus>;
  label: string;
};

@Injectable()
export class JobRepository {
  private workers: Partial<Record<QueueName, Worker>> = {};
  private handlers: Partial<Record<JobName, JobMapItem>> = {};

  constructor(
    private moduleRef: ModuleRef,
    private configRepository: ConfigRepository,
    private eventRepository: MockEventRepository,
    private logger: LoggingRepository,
  ) {
    this.logger.setContext(JobRepository.name);
  }

  setup(services: ClassConstructor<unknown>[]) {
    const reflector = this.moduleRef.get(Reflector, { strict: false });

    // discovery
    for (const Service of services) {
      const instance = this.moduleRef.get<any>(Service);
      this.setupService(instance, reflector);
    }

    this.validateAllHandlers();
  }

  setupWithInstances(instances: any[]) {
    const reflector = this.moduleRef.get(Reflector, { strict: false });

    // discovery
    for (const instance of instances) {
      this.setupService(instance, reflector);
    }

    this.validateAllHandlers();
  }

  private validateAllHandlers() {
    // no missing handlers
    for (const [jobKey, jobName] of Object.entries(JobName)) {
      const item = this.handlers[jobName];
      if (!item) {
        const errorMessage = `Failed to find job handler for Job.${jobKey} ("${jobName}")`;
        this.logger.error(
          `${errorMessage}. Make sure to add the @OnJob({ name: JobName.${jobKey}, queue: QueueName.XYZ }) decorator for the new job.`,
        );
        throw new ProjetStartupError(errorMessage);
      }
    }
  }

  private setupService(instance: any, reflector: Reflector) {
    for (const methodName of getMethodNames(instance)) {
      const handler = instance[methodName];
      const config = reflector.get<JobConfig>(MetadataKey.JobConfig, handler);
      if (!config) {
        continue;
      }

      const { name: jobName, queue: queueName } = config;
      const label = `${instance.constructor.name}.${handler.name}`;

      // one handler per job
      if (this.handlers[jobName]) {
        const jobKey = getKeyByValue(JobName, jobName);
        const errorMessage = `Failed to add job handler for ${label}`;
        this.logger.error(
          `${errorMessage}. JobName.${jobKey} is already handled by ${this.handlers[jobName].label}.`,
        );
        throw new ProjetStartupError(errorMessage);
      }

      this.handlers[jobName] = {
        label,
        jobName,
        queueName,
        handler: handler.bind(instance),
      };

      this.logger.verbose(`Added job handler: ${jobName} => ${label}`);
    }
  }

  startWorkers() {
    const redisConfig = this.configRepository.getEnv().redis;
    for (const queueName of Object.values(QueueName)) {
      this.logger.debug(`Starting worker for queue: ${queueName}`);
      this.workers[queueName] = new Worker(
        queueName,
        async (job) => {
          this.logger.debug(`Processing job: ${job.name} with data:`, job.data);
          this.eventRepository.emit('JobStart', queueName, job as JobItem);
          const result = await this.run({
            name: job.name as any,
            data: job.data,
          });
          this.logger.debug(`Job ${job.name} completed with result:`, result);
          return result;
        },
        {
          connection: redisConfig,
          concurrency: 1,
        },
      );
    }
  }

  async run({ name, data }: JobItem) {
    const item = this.handlers[name as JobName];
    if (!item) {
      this.logger.warn(`Skipping unknown job: "${name}"`);
      return JobStatus.Skipped;
    }

    return item.handler(data);
  }

  setConcurrency(queueName: QueueName, concurrency: number) {
    const worker = this.workers[queueName];
    if (!worker) {
      this.logger.warn(
        `Unable to set queue concurrency, worker not found: '${queueName}'`,
      );
      return;
    }

    worker.concurrency = concurrency;
  }

  async getQueueStatus(name: QueueName): Promise<QueueStatus> {
    const queue = this.getQueue(name);

    return {
      isActive: !!(await queue.getActiveCount()),
      isPaused: await queue.isPaused(),
    };
  }

  pause(name: QueueName) {
    return this.getQueue(name).pause();
  }

  resume(name: QueueName) {
    return this.getQueue(name).resume();
  }

  empty(name: QueueName) {
    return this.getQueue(name).drain();
  }

  clear(name: QueueName, type: QueueCleanType) {
    return this.getQueue(name).clean(0, 1000, type);
  }

  getJobCounts(name: QueueName): Promise<JobCounts> {
    return this.getQueue(name).getJobCounts(
      'active',
      'completed',
      'failed',
      'delayed',
      'waiting',
      'paused',
    ) as unknown as Promise<JobCounts>;
  }

  private getQueueName(name: JobName) {
    return (this.handlers[name] as JobMapItem).queueName;
  }

  async queueAll(items: JobItem[]): Promise<void> {
    if (items.length === 0) {
      return;
    }

    const promises: Promise<any>[] = [];
    const itemsByQueue = {} as Record<
      string,
      (JobItem & { data: any; options: JobsOptions | undefined })[]
    >;
    for (const item of items) {
      const queueName = this.getQueueName(item.name);
      const job = {
        name: item.name,
        data: item.data || {},
        options: this.getJobOptions(item) || undefined,
      } as JobItem & { data: any; options: JobsOptions | undefined };

      if (job.options?.jobId) {
        // need to use add() instead of addBulk() for jobId deduplication
        promises.push(
          this.getQueue(queueName).add(item.name, item.data, job.options),
        );
      } else {
        itemsByQueue[queueName] = itemsByQueue[queueName] || [];
        itemsByQueue[queueName].push(job);
      }
    }

    for (const [queueName, jobs] of Object.entries(itemsByQueue)) {
      const queue = this.getQueue(queueName as QueueName);
      promises.push(queue.addBulk(jobs));
    }

    await Promise.all(promises);
  }

  async queue(item: JobItem): Promise<void> {
    return this.queueAll([item]);
  }

  async waitForQueueCompletion(...queues: QueueName[]): Promise<void> {
    let activeQueue: QueueStatus | undefined;
    do {
      const statuses = await Promise.all(
        queues.map((name) => this.getQueueStatus(name)),
      );
      activeQueue = statuses.find((status) => status.isActive);
    } while (activeQueue);
    {
      this.logger.verbose(`Waiting for ${activeQueue} queue to stop...`);
      await setTimeout(1000);
    }
  }

  private getJobOptions(item: JobItem): JobsOptions | null {
    switch (item.name) {
      // case JobName.FacialRecognitionQueueAll: {
      //   return { jobId: JobName.FacialRecognitionQueueAll };
      // }
      default: {
        return null;
      }
    }
  }

  private getQueue(queue: QueueName): Queue {
    return this.moduleRef.get<Queue>(getQueueToken(queue), { strict: false });
  }

  /** @deprecated */
  // todo: remove this when asset notifications no longer need it.
  public async removeJob(name: JobName, jobID: string): Promise<void> {
    const existingJob = await this.getQueue(this.getQueueName(name)).getJob(
      jobID,
    );
    if (existingJob) {
      await existingJob.remove();
    }
  }
}
