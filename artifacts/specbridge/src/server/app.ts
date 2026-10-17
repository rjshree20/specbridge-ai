import express from "express";
import { validatePrdInput } from "./validate.js";
import { analyzePrdInput } from "./logic/prdAnalyzer.js";

export const app = express();

app.use(express.json({ limit: "256kb" }));

// Checkpoint 2: Input validation
app.post("/api/validate", (request, response) => {
  const result = validatePrdInput(request.body);
  response.status(result.valid ? 200 : 422).json(result);
});

// Checkpoint 3: Deterministic PRD analysis
app.post("/api/analyze-logic", (request, response) => {
  const validation = validatePrdInput(request.body);

  if (!validation.valid) {
    response.status(422).json(validation);
    return;
  }

  try {
    const analysis = analyzePrdInput(request.body);

    response.status(200).json({
      valid: true,
      ...analysis,
    });
  } catch (error) {
    console.error("Logic analysis failed:", error);

    response.status(500).json({
      valid: false,
      errors: {
        _form: "Analysis could not be completed. Please try again.",
      },
    });
  }
});

// Error handling
app.use(
  (
    error: unknown,
    _request: express.Request,
    response: express.Response,
    _next: express.NextFunction,
  ) => {
    const isInvalidJson =
      typeof error === "object" &&
      error !== null &&
      "type" in error &&
      error.type === "entity.parse.failed";

    response.status(isInvalidJson ? 400 : 500).json({
      valid: false,
      errors: {
        _form: isInvalidJson
          ? "The request body must contain valid JSON."
          : "Validation is temporarily unavailable. Please try again.",
      },
    });
  },
);
