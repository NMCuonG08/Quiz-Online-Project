import { PipeTransform, Injectable } from '@nestjs/common';
import { isUUID } from 'class-validator';
import { ValidationException } from '@/common/exceptions';

@Injectable()
export class UuidPipe implements PipeTransform {
  transform(value: string) {
    if (!isUUID(value)) {
      throw new ValidationException(`Invalid UUID format: ${value}`);
    }
    return value;
  }
}
