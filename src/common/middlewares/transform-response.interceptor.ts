import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { map, Observable } from 'rxjs';
import { ResponseDto } from '@/common/dtos/responses/base.response';

@Injectable()
export class TransformResponseInterceptor<T>
  implements NestInterceptor<T, ResponseDto<T>>
{
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    // Check Graphql
    if (context.getType<'graphql'>() === 'graphql') {
      return next.handle();
    }

    return next
      .handle()
      .pipe(map((data) => new ResponseDto(200, 'Success', data)));
  }
}
