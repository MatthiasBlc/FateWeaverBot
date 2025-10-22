import { Request, Response, NextFunction } from 'express';
import { AppError, ValidationError } from '../../shared/errors';

export function errorHandler(
  error: Error,
  req: Request,
  res: Response,
  next: NextFunction
) {
  // Handle custom AppError instances
  if (error instanceof AppError) {
    const response: any = {
      error: error.message
    };

    // Add validation errors if present
    if (error instanceof ValidationError && error.errors) {
      response.errors = error.errors;
    }

    return res.status(error.statusCode).json(response);
  }

  // Handle unexpected errors
  console.error('Unexpected error:', error);
  res.status(500).json({
    error: 'Internal server error'
  });
}
