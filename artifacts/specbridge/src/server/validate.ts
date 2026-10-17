export type PrdInput = {
  featureTitle: string;
  productName: string;
  featureDescription: string;
  targetUsers: string;
  prdText: string;
  acceptanceCriteria: string;
};

export type ValidationResult = {
  valid: boolean;
  errors: Record<string, string>;
  normalizedInput: PrdInput;
  message?: string;
};

const fieldNames: Record<keyof PrdInput, string> = {
  featureTitle: 'Feature title',
  productName: 'Product / project name',
  featureDescription: 'Feature description',
  targetUsers: 'Target users',
  prdText: 'PRD / requirement text',
  acceptanceCriteria: 'Acceptance criteria',
};

const requiredFields: (keyof PrdInput)[] = [
  'featureTitle',
  'featureDescription',
  'prdText',
];

const inputFields = Object.keys(fieldNames) as (keyof PrdInput)[];

export function validatePrdInput(input: unknown): ValidationResult {
  const errors: Record<string, string> = {};
  const normalizedInput = {} as PrdInput;

  if (!input || typeof input !== 'object' || Array.isArray(input)) {
    return {
      valid: false,
      errors: { _form: 'Submit the PRD form as a JSON object.' },
      normalizedInput: {
        featureTitle: '',
        productName: '',
        featureDescription: '',
        targetUsers: '',
        prdText: '',
        acceptanceCriteria: '',
      },
    };
  }

  const record = input as Record<string, unknown>;
  for (const field of inputFields) {
    const value = record[field];
    if (value === undefined || value === null) {
      normalizedInput[field] = '';
      continue;
    }
    if (typeof value !== 'string') {
      errors[field] = `${fieldNames[field]} must be text.`;
      normalizedInput[field] = '';
      continue;
    }
    normalizedInput[field] = value.trim();
  }

  for (const field of requiredFields) {
    if (!normalizedInput[field]) {
      errors[field] ??= `${fieldNames[field]} is required.`;
    }
  }

  const rawPrdText = record.prdText;
  if (typeof rawPrdText === 'string' && rawPrdText.length > 20_000) {
    errors.prdText = 'PRD / requirement text must be 20,000 characters or fewer.';
  } else if (normalizedInput.prdText.length > 0 && normalizedInput.prdText.length < 100) {
    errors.prdText = 'Add at least 100 meaningful characters to the PRD / requirement text.';
  }

  const valid = Object.keys(errors).length === 0;
  return {
    valid,
    errors,
    normalizedInput,
    ...(valid
      ? {
          message:
            'PRD passed initial validation and is ready for the upcoming logic-analysis stage.',
        }
      : {}),
  };
}
