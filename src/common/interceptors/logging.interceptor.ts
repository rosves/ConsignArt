
import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
    intercept(context: ExecutionContext, next: CallHandler): Observable<any> {

        const now = Date.now();
        const request = context.switchToHttp().getRequest();
        const userId = request.user?.id ?? 'anonymous';

        return next.handle().pipe(
            tap({
                next : () => {
                    const log = `[${new Date(now).toISOString()}] ${request.method} ${request.url} - SUCCESS - ${userId} - ${Date.now() - now}ms`;
                    console.log(log);
                    fs.appendFileSync('logs/requests.log', `${log}\n`);
                },
                error : (error) => {
                    const log = `[${new Date(now).toISOString()}] ${request.method} ${request.url} - ERROR - ${userId} - ${Date.now() - now}ms - ${error.message}`;
                    console.error(log);
                    fs.appendFileSync('logs/requests.log', `${log}\n`);
                }
            }),
        );
    }
}
