import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { AppException } from '../exceptions/app.exception';

@Catch() // ใส่ @Catch() ว่างๆ หมายถึงดักจับ Exception ทุกประเภท (ทั้งแบบที่เราตั้งใจโยน และแบบที่ระบบพังเอง)
export class GlobalExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(GlobalExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let errorCode = 'INTERNAL_SERVER_ERROR';
    let message = 'ເກີດຂໍ້ຜິດພາດພາຍໃນລະບົບ';
    let details = null;

    if (exception instanceof AppException) {
      status = exception.getStatus();
      errorCode = exception.errorCode;
      message = exception.message;
      details = exception.details;
    } else if (exception instanceof HttpException) {
      status = exception.getStatus();
      const responseBody = exception.getResponse() as any;

      if (
        status === HttpStatus.BAD_REQUEST &&
        Array.isArray(responseBody.message)
      ) {
        errorCode = 'VALIDATION_ERROR';
        message = 'ຂໍ້ມູນທີ່ສົ່ງມາບໍ່ຖືກຕ້ອງ';
        details = responseBody.message;
      } else {
        errorCode = `HTTP_ERROR_${status}`;
        message = responseBody.message || exception.message;
      }
    } else {
      this.logger.error(
        `[${request.method}] ${request.url} - ${exception instanceof Error ? exception.message : 'Unknown Error'}`,
        exception instanceof Error ? exception.stack : '',
      );
    }

    response.status(status).json({
      success: false,
      timestamp: new Date().toISOString(),
      path: request.url,
      error: {
        code: errorCode,
        message,
        details,
      },
    });
  }
}
