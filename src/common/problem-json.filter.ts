import { ArgumentsHost, Catch, ExceptionFilter, HttpException } from '@nestjs/common';
import { QueryFailedError } from 'typeorm';

const TITLES: Record<number, string> = {
  400: 'Bad Request',
  404: 'Not Found',
  409: 'Conflict',
  500: 'Internal Server Error',
};

@Catch()
export class ProblemJsonFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const res = ctx.getResponse();
    const req = ctx.getRequest();

    let status = 500;
    let detail = 'Unexpected error';
    let errors: string[] | undefined;

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const body: any = exception.getResponse();
      if (typeof body === 'string') {
        detail = body;
      } else if (Array.isArray(body.message)) {
        errors = body.message;
        detail = 'Validation failed';
      } else {
        detail = body.message ?? exception.message;
      }
    } else if (exception instanceof QueryFailedError) {
      const code = (exception as any).driverError?.code;
      if (code === '23505') {
        status = 409;
        detail = 'Duplicate value violates unique constraint';
      } else if (code === '23514') {
        status = 400;
        detail = 'Value violates check constraint';
      }
    }

    res
      .status(status)
      .type('application/problem+json')
      .json({
        type: 'about:blank',
        title: TITLES[status] ?? 'Error',
        status,
        detail,
        instance: req.url,
        ...(errors && { errors }),
      });
  }
}