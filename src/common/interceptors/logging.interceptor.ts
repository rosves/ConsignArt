
import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { error } from 'console';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
    intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
        console.log('interceptor called');

        const now = Date.now();
        const request = context.switchToHttp().getRequest();
        const response = context.switchToHttp().getResponse();
        const userId = request.user?.id ?? 'anonymous';

        return next.handle().pipe(
            tap({
                next : () => {console.log(`[${new Date(now).toISOString()}] logInterceptor : ${request.method} - ${request.url} - SUCCESS - ${userId} - ${Date.now() - now}ms`)},
                error : (error) => {
                    const duration = Date.now() - now;
                    console.error(`[${new Date(now).toISOString()}] logInterceptor : ${request.method} ${request.url} - ERROR - ${duration}ms - user: ${userId} - ${error.message}`);
                }
            }),
        );
    }
}
