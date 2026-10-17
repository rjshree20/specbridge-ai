import assert from 'node:assert/strict';
import test from 'node:test';
import { validatePrdInput } from './validate.js';

const validInput = {
  featureTitle: 'Account recovery',
  productName: 'SpecBridge',
  featureDescription: 'Let users recover access to their accounts.',
  targetUsers: 'Registered customers',
  prdText:
    'When a user cannot sign in, they can request a recovery link using their registered email address. The link expires after a defined period and can only be used once.',
  acceptanceCriteria: 'A valid link opens the account recovery flow.',
};

test('trims values and accepts a valid PRD', () => {
  const result = validatePrdInput({
    ...validInput,
    featureTitle: '  Account recovery  ',
    prdText: `  ${validInput.prdText}  `,
  });

  assert.equal(result.valid, true);
  assert.equal(result.normalizedInput.featureTitle, 'Account recovery');
  assert.equal(result.normalizedInput.prdText, validInput.prdText);
  assert.match(result.message ?? '', /ready for the upcoming logic-analysis stage/);
});

test('returns required-field errors for blank values', () => {
  const result = validatePrdInput({
    ...validInput,
    featureTitle: '  ',
    featureDescription: '',
    prdText: '',
  });

  assert.equal(result.valid, false);
  assert.ok(result.errors.featureTitle);
  assert.ok(result.errors.featureDescription);
  assert.ok(result.errors.prdText);
});

test('rejects PRD text shorter than 100 meaningful characters', () => {
  const result = validatePrdInput({ ...validInput, prdText: 'x'.repeat(99) });
  assert.equal(result.valid, false);
  assert.match(result.errors.prdText, /at least 100/);
});

test('rejects PRD text above 20,000 characters', () => {
  const result = validatePrdInput({
    ...validInput,
    prdText: 'x'.repeat(20_001),
  });
  assert.equal(result.valid, false);
  assert.match(result.errors.prdText, /20,000/);
});

test('does not require optional fields and rejects non-text values', () => {
  const { productName: _productName, targetUsers: _targetUsers, acceptanceCriteria: _acceptanceCriteria, ...required } =
    validInput;
  assert.equal(validatePrdInput(required).valid, true);

  const invalid = validatePrdInput({ ...required, featureTitle: 10 });
  assert.equal(invalid.valid, false);
  assert.match(invalid.errors.featureTitle, /must be text/);
});

test('rejects non-object request bodies', () => {
  const result = validatePrdInput(null);
  assert.equal(result.valid, false);
  assert.match(result.errors._form, /JSON object/);
});
