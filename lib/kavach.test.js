import test from 'node:test';
import assert from 'node:assert/strict';
import { redactIndianPII } from './kavach.js';

test('redactIndianPII masks Aadhaar, PAN, IFSC, UPI, email, and Indian phone numbers', () => {
  const sample =
    'KYC: Aadhaar 2345 6789 0123, PAN ABCDE1234F, IFSC SBIN0001234, UPI rahul@okicici, phone +91 9876543210, mail rahul@example.com';
  const result = redactIndianPII(sample);

  assert.equal(result.count, 6);
  assert.equal(
    result.masked,
    'KYC: Aadhaar [AADHAAR_1], PAN [PAN_1], IFSC [IFSC_1], UPI [UPI_1], phone [PHONE_1], mail [EMAIL_1]'
  );
  assert.deepEqual(
    result.entities.map((e) => e.token),
    ['[AADHAAR_1]', '[PAN_1]', '[IFSC_1]', '[UPI_1]', '[PHONE_1]', '[EMAIL_1]']
  );
});

test('redactIndianPII increments entity indices per type and preserves safe text', () => {
  const result = redactIndianPII('Send PAN ABCDE1234F or ZYXWV9876A to team.');
  assert.equal(result.count, 2);
  assert.equal(result.masked, 'Send PAN [PAN_1] or [PAN_2] to team.');

  const clean = redactIndianPII('No sensitive data here, just open source code.');
  assert.equal(clean.count, 0);
  assert.equal(clean.masked, 'No sensitive data here, just open source code.');
});
