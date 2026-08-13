
import { ExceptionFilter, Catch, ArgumentsHost, HttpException } from '@nestjs/common';
import { Request, Response } from 'express';

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
    catch(exception: unknown, host: ArgumentsHost) {
        const ctx = host.switchToHttp();
        const response = ctx.getResponse<Response>();
        const request = ctx.getRequest<Request>();

        const isHttpException = exception instanceof HttpException;
        const status = isHttpException ? exception.getStatus() : 500;
        const exceptionResponse = isHttpException ? exception.getResponse() : 'Internal server error';

        const message = typeof exceptionResponse === 'string' ? exceptionResponse : (exceptionResponse as any).message;

        if(!isHttpException) {
            console.error(exception);
        }

        response
        .status(status)
        .json({
            statusCode : status,
            message : message,
            timestamp: new Date().toISOString(),
            path: request.url
        });
    }
}
