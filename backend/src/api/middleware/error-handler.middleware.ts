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

  // Handle Prisma errors
  if (error instanceof Error && 'code' in error) {
    const prismaError = error as any;

    // P2002: Unique constraint failed
    if (prismaError.code === 'P2002') {
      const field = prismaError.meta?.target?.[0] || 'field';
      return res.status(400).json({
        error: `Un élément avec ce ${field === 'name' ? 'nom' : field} existe déjà.`
      });
    }

    // P2025: Record not found
    if (prismaError.code === 'P2025') {
      return res.status(404).json({
        error: 'Élément non trouvé.'
      });
    }

    // P2003: Foreign key constraint failed
    if (prismaError.code === 'P2003') {
      return res.status(400).json({
        error: 'Référence invalide - assurez-vous que tous les IDs existent.'
      });
    }
  }

  // Handle unexpected errors
  console.error('Unexpected error:', error);
  res.status(500).json({
    error: 'Internal server error'
  });
}
