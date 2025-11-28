import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  BadGatewayException,
} from '@nestjs/common';
import { catchError } from 'rxjs/operators';
import { throwError } from 'rxjs';

@Injectable()
export class AxiosErrorInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler) {
    return next.handle().pipe(
      catchError((err) => {
        if (err.response) {
          const { status, data } = err.response;
          return throwError(
            () =>
              new BadGatewayException({
                statusCode: status,
                message: data?.message || 'Upstream service error',
                error: data?.error || 'Bad Gateway',
              }),
          );
        }
        return throwError(() => err);
      }),
    );
  }
}
