import { AppError } from './app-error';

export class NotFoundError extends AppError {
  constructor(resource: string, identifier?: string | number) {
    const message = identifier
      ? `${resource} with ID ${identifier} not found`
      : `${resource} not found`;
    super(message, 404);
  }
}
