import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

export interface ResponseFormat<T> {
  success: boolean;
  message: string;
  data: T;
}

@Injectable()
export class TransformInterceptor<T>
  implements NestInterceptor<T, ResponseFormat<T>>
{
  intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Observable<ResponseFormat<T>> {
    return next.handle().pipe(
      map((res) => {
        // If already formatted, return as-is
        if (res && typeof res === 'object' && 'success' in res && 'data' in res) {
          return res;
        }

        let message = 'Operation successful';
        let data = res;

        if (res && typeof res === 'object' && 'message' in res && 'data' in res) {
          message = res.message;
          data = res.data;
        } else if (res && typeof res === 'object' && 'message' in res && Object.keys(res).length === 1) {
          message = res.message;
          data = null;
        }

        return {
          success: true,
          message,
          data,
        };
      }),
    );
  }
}

