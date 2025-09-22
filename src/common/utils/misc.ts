import { LoggingRepository } from '@/common/repositories/logging.repository';

export const getKeyByValue = (
  object: Record<string, unknown>,
  value: unknown,
) => Object.keys(object).find((key) => object[key] === value);
export const getMethodNames = (instance: any) => {
  const ctx = Object.getPrototypeOf(instance);
  const methods: string[] = [];
  for (const property of Object.getOwnPropertyNames(ctx)) {
    const descriptor = Object.getOwnPropertyDescriptor(ctx, property);
    if (!descriptor || descriptor.get || descriptor.set) {
      continue;
    }

    const handler = instance[property];
    if (typeof handler !== 'function') {
      continue;
    }

    methods.push(property);
  }

  return methods;
};

export const handlePromiseError = <T>(
  promise: Promise<T>,
  logger: LoggingRepository,
): void => {
  promise.catch((error: Error | any) =>
    logger.error(`Promise error: ${error}`, error?.stack),
  );
};

export class ProjetStartupError extends Error {}
