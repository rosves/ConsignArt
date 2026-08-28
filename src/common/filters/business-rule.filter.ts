import { ExceptionFilter, Catch, ArgumentsHost, HttpStatus } from '@nestjs/common';
import { Response } from 'express';
import { BusinessRuleException } from './business-rule.exception';

@Catch(BusinessRuleException)
export class BusinessRuleViolationFilter implements ExceptionFilter {
  catch(exception: BusinessRuleException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    response.status(HttpStatus.UNPROCESSABLE_ENTITY).json({
      statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
      message: exception.message,
      timestamp: new Date().toISOString(),
    });
  }
}