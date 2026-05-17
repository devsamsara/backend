import { Request, Response, NextFunction } from 'express';
import { ErrorUtils } from '../utils/error.utils';
import dotenv from 'dotenv';
import { LoggerUtils } from '../utils/logger.utils';

dotenv.config();
export function errorHandler(
  err: Error,
  req: Request,
  res: Response,
  _next: NextFunction,
): void {
  if (err instanceof ErrorUtils && err.isOperational) {
    res.status(err.statusCode).json({
      status: 'error',
      code: err.code,
      message: err.message,
    });
    return;
  }

  // Unexpected error — log and hide details in production
  LoggerUtils.error('Unhandled error', {
    message: err.message,
    stack: err.stack,
    path: req.path,
  });

  res.status(500).json({
    status: 'error',
    code: 'INTERNAL_SERVER_ERROR',
    message: process.env.NODE_ENV === 'production' ? 'Something went wrong' : err.message,
  });
}

export function notFoundHandler(req: Request, res: Response): void {
  res.status(404).json({
    status: 'error',
    code: 'NOT_FOUND',
    message: `Route ${req.method} ${req.path} not found`,
  });
}
