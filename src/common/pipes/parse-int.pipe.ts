import { PipeTransform, Injectable } from '@nestjs/common';
import { ValidationException } from '@/common/exceptions';

@Injectable()
export class ParseIntPipe implements PipeTransform {
  transform(value: string) {
    const val = parseInt(value, 10);
    if (isNaN(val)) {
      throw new ValidationException('Invalid number');
    }
    return val;
  }
}
