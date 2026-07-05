import { GraphQLError } from 'graphql';

export enum ErrorCode {
  NOT_FOUND = 'NOT_FOUND',
  UNAUTHORIZED = 'UNAUTHORIZED',
  FORBIDDEN = 'FORBIDDEN',
  BAD_REQUEST = 'BAD_REQUEST',
  CONFLICT = 'CONFLICT',
  INTERNAL = 'INTERNAL_SERVER_ERROR',
}

export class ErrorUtils extends Error {
  public readonly code: ErrorCode;
  public readonly statusCode: number;
  public readonly isOperational: boolean;

  constructor(message: string, code: ErrorCode = ErrorCode.INTERNAL, statusCode = 500) {
    super(message);
    this.name = 'ErrorUtils';
    this.code = code;
    this.statusCode = statusCode;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }

  static notFound(resource = 'Resource'): ErrorUtils {
    return new ErrorUtils(`${resource} not found`, ErrorCode.NOT_FOUND, 404);
  }

  static unauthorized(message = 'Unauthorized'): ErrorUtils {
    return new ErrorUtils(message, ErrorCode.UNAUTHORIZED, 401);
  }

  static forbidden(message = 'Forbidden'): ErrorUtils {
    return new ErrorUtils(message, ErrorCode.FORBIDDEN, 403);
  }

  static badRequest(message: string): ErrorUtils {
    return new ErrorUtils(message, ErrorCode.BAD_REQUEST, 400);
  }

  static conflict(message: string): ErrorUtils {
    return new ErrorUtils(message, ErrorCode.CONFLICT, 409);
  }

  static internal(message: string): ErrorUtils {
    return new ErrorUtils(message, ErrorCode.INTERNAL, 500);
  }

  toGraphQLError(): GraphQLError {
    return new GraphQLError(this.message, {
      extensions: {
        code: this.code,
        statusCode: this.statusCode,
      },
    });
  }
}
