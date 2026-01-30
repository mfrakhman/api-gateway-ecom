import { ExceptionFilter, Catch, ArgumentsHost } from '@nestjs/common';
import { HttpException } from '@nestjs/common';
import { Response } from 'express';

@Catch()
export class GatewayExceptionFilter implements ExceptionFilter {
  catch(exception: any, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const res = ctx.getResponse<Response>();

    // Axios / upstream error
    if (exception?.response?.status && exception?.response?.data) {
      const { status, data } = exception.response;

      if (status >= 400 && status < 500) {
        return res.status(status).json({
          statusCode: status,
          message: data.message ?? 'Request failed',
          code: data.code,
          service: data.service,
          timestamp: new Date().toISOString(),
        });
      }

      return res.status(502).json({
        statusCode: 502,
        message: 'Upstream service failure',
        service: data.service,
        timestamp: new Date().toISOString(),
      });
    }

    // Native Nest HttpException
    if (exception instanceof HttpException) {
      const response = exception.getResponse();
      const body =
        typeof response === 'string' ? { message: response } : response;

      return res.status(exception.getStatus()).json({
        ...body,
        timestamp: new Date().toISOString(),
      });
    }

    // Fallback
    return res.status(502).json({
      statusCode: 502,
      message: 'Bad Gateway',
      timestamp: new Date().toISOString(),
    });
  }
}
