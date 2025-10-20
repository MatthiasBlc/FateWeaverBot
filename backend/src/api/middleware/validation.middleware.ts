import { Request, Response, NextFunction } from "express";
import { ZodSchema, ZodError } from "zod";
import createHttpError from "http-errors";

export function validate(schema: ZodSchema) {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      schema.parse({
        body: req.body,
        params: req.params,
        query: req.query
      });
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        throw createHttpError(400, "Validation failed", {
          errors: error.issues
        });
      }
      next(error);
    }
  };
}
