import assert from 'node:assert';
import { describe, it } from 'node:test';
import { runVerification } from '../lib/verifier/runner';

describe('Independent Verification Engine', () => {
  it('correctly verifies passing candidate code in isolated sandbox', async () => {
    const validCode = `
      function calculateDiscount(cartTotal, discountCode) {
        if (discountCode === 'PROMO20') return cartTotal * 0.8;
        return cartTotal;
      }
      module.exports = { calculateDiscount };
    `;

    const testSuite = `
      test('applies 20% discount', () => {
        expect(calculateDiscount(100, 'PROMO20')).toBe(80);
      });
      test('returns normal price for unknown code', () => {
        expect(calculateDiscount(50, 'NONE')).toBe(50);
      });
    `;

    const report = await runVerification({
      jobId: 'job-test-1',
      submissionId: 'sub-test-1',
      agentId: 'codefix-v1',
      artifactContent: validCode,
      policy: {
        type: 'DETERMINISTIC_CODE',
        testSuite,
        timeoutMs: 3000,
        policyHash: 'hash-test-policy',
      },
    });

    assert.strictEqual(report.passed, true);
    assert.strictEqual(report.score, 100);
    assert.strictEqual(report.totalTests, 2);
    assert.strictEqual(report.passedTests, 2);
    assert.strictEqual(report.failedTests, 0);
    assert.ok(report.evidenceDigest);
    assert.ok(report.attestationSignature.includes('ed25519:proofrail_verifier_sig'));
  });

  it('correctly fails and rejects broken or fraudulent candidate code', async () => {
    const brokenCode = `
      function calculateDiscount(cartTotal, discountCode) {
        return 0;
      }
      module.exports = { calculateDiscount };
    `;

    const testSuite = `
      test('applies 20% discount', () => {
        expect(calculateDiscount(100, 'PROMO20')).toBe(80);
      });
    `;

    const report = await runVerification({
      jobId: 'job-test-2',
      submissionId: 'sub-test-2',
      agentId: 'codefix-v1',
      artifactContent: brokenCode,
      policy: {
        type: 'DETERMINISTIC_CODE',
        testSuite,
        timeoutMs: 3000,
        policyHash: 'hash-test-policy',
      },
    });

    assert.strictEqual(report.passed, false);
    assert.strictEqual(report.failedTests, 1);
    assert.strictEqual(report.score, 0);
    assert.ok(report.failureReason?.includes('test(s) failed'));
  });
});
