import express from 'express';
import { validatePrdInput } from './validate.js';

export const app = express();

app.use(express.json({ limit: '256kb' }));

app.post('/api/validate', (request, response) => {
  const result = validatePrdInput(request.body);
  response.status(result.valid ? 200 : 422).json(result);
});

app.use(
  (
    error: unknown,
    _request: express.Request,
    response: express.Response,
    _next: express.NextFunction,
  ) => {
    const isInvalidJson =
      typeof error === 'object' &&
      error !== null &&
      'type' in error &&
      error.type === 'entity.parse.failed';

    response.status(isInvalidJson ? 400 : 500).json({
      valid: false,
      errors: {
        _form: isInvalidJson
          ? 'The request body must contain valid JSON.'
          : 'Validation is temporarily unavailable. Please try again.',
      },
    });
  },
);
