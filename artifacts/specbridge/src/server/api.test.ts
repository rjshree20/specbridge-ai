import assert from 'node:assert/strict';
import { after, before, test } from 'node:test';
import type { AddressInfo } from 'node:net';
import type { Server } from 'node:http';
import { app } from './app.js';

const validInput = {
  featureTitle: 'Account recovery',
  featureDescription: 'Let users recover access to their accounts.',
  prdText:
    'When a user cannot sign in, they can request a recovery link using their registered email address. The link expires after a defined period and can only be used once.',
};

let server: Server;
let baseUrl: string;

before(async () => {
  server = app.listen(0, '127.0.0.1');
  await new Promise<void>((resolve, reject) => {
    server.once('listening', resolve);
    server.once('error', reject);
  });
  const address = server.address() as AddressInfo;
  baseUrl = `http://127.0.0.1:${address.port}`;
});

after(async () => {
  await new Promise<void>((resolve, reject) => {
    server.close((error) => (error ? reject(error) : resolve()));
  });
});

async function postValidation(body: object) {
  return fetch(`${baseUrl}/api/validate`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  });
}

test('POST /api/validate accepts valid input', async () => {
  const response = await postValidation(validInput);
  const result = await response.json();

  assert.equal(response.status, 200);
  assert.equal(result.valid, true);
  assert.match(result.message, /ready for the upcoming logic-analysis stage/);
});

test('POST /api/validate rejects each missing required field', async (t) => {
  for (const field of ['featureTitle', 'featureDescription', 'prdText'] as const) {
    await t.test(field, async () => {
      const body = { ...validInput };
      delete body[field];

      const response = await postValidation(body);
      const result = await response.json();

      assert.equal(response.status, 422);
      assert.equal(result.valid, false);
      assert.ok(result.errors[field]);
    });
  }
});

test('POST /api/validate rejects whitespace-only required values', async (t) => {
  for (const field of ['featureTitle', 'featureDescription', 'prdText'] as const) {
    await t.test(field, async () => {
      const response = await postValidation({ ...validInput, [field]: '   \n\t  ' });
      const result = await response.json();

      assert.equal(response.status, 422);
      assert.equal(result.valid, false);
      assert.ok(result.errors[field]);
    });
  }
});

test('POST /api/validate rejects PRD text below 100 characters', async () => {
  const response = await postValidation({ ...validInput, prdText: 'x'.repeat(99) });
  const result = await response.json();

  assert.equal(response.status, 422);
  assert.equal(result.valid, false);
  assert.match(result.errors.prdText, /at least 100/);
});

test('POST /api/validate rejects PRD text above 20,000 characters', async () => {
  const response = await postValidation({
    ...validInput,
    prdText: 'x'.repeat(20_001),
  });
  const result = await response.json();

  assert.equal(response.status, 422);
  assert.equal(result.valid, false);
  assert.match(result.errors.prdText, /20,000/);
});
