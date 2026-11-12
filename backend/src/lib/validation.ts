import { z } from 'zod';
import { ApiError } from './api-error.js';

export function parseInput<T extends z.ZodType>(
  schema: T,
  input: unknown,
): z.infer<T> {
  const result = schema.safeParse(input);

  if (!result.success) {
    throw new ApiError(400, 'VALIDATION_ERROR', 'The submitted data is invalid.');
  }

  return result.data;
}
