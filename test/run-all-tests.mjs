process.env.TEST_MODE = '1';
process.env.NODE_ENV = 'test';
import assert from 'node:assert';
import { runVerification } from '../lib/verifier/runner.ts';
import { nearClient } from '../lib/near/client.ts';
import { nearToYocto, yoctoToNear, sha256 } from '../lib/crypto.ts';

async function main() {
  console.log('====================================================');
  console.log('🧪 RUNNING PROOFRAIL INTEGRATED AUTOMATED TEST SUITE');
  console.log('====================================================\n');

  let passedCount = 0;
  let failedCount = 0;

  async function test(name, fn) {
    try {
      await fn();
      console.log(`  ✓ PASS: ${name}`);
      passedCount++;
    } catch (err) {
      console.error(`  ✗ FAIL: ${name}`);
      console.error(`    ${err.message}`);
      failedCount++;
    }
  }

  // 1. Math and Crypto Tests
  console.log('[1/3] Hashing & Integer yoctoNEAR Math:');
  await test('SHA-256 canonical hashing produces deterministic 64-char hex', () => {
    const h1 = sha256('proofrail-near-2026');
    const h2 = sha256('proofrail-near-2026');
    assert.strictEqual(h1, h2);
    assert.strictEqual(h1.length, 64);
  });

  await test('Converts NEAR to exact 24-decimal integer yoctoNEAR string', () => {
    const yocto = nearToYocto(2.5);
    assert.strictEqual(yocto, '2500000000000000000000000');
    assert.strictEqual(yoctoToNear(yocto), 2.5);
  });

  // 2. Verification Sandbox Engine
  console.log('\n[2/3] Independent Sandbox Verification Engine:');
  await test('Correctly verifies valid code deliverable against unit tests', async () => {
    const validCode = `
      function calculateDiscount(cartTotal, discountCode) {
        if (discountCode === 'PROMO20') return cartTotal * 0.8;
        return cartTotal;
      }
      module.exports = { calculateDiscount };
    `;
    const testSuite = `
      test('20% discount on 100', () => {
        expect(calculateDiscount(100, 'PROMO20')).toBe(80);
      });
      test('zero discount on empty code', () => {
        expect(calculateDiscount(50, '')).toBe(50);
      });
    `;

    const report = await runVerification({
      jobId: 'job-t1',
      submissionId: 'sub-t1',
      agentId: 'codefix-v1',
      artifactContent: validCode,
      policy: {
        type: 'DETERMINISTIC_CODE',
        testSuite,
        timeoutMs: 3000,
        policyHash: sha256(testSuite),
      },
    });

    assert.strictEqual(report.passed, true);
    assert.strictEqual(report.score, 100);
    assert.strictEqual(report.passedTests, 2);
    assert.strictEqual(report.failedTests, 0);
    assert.ok(report.evidenceDigest);
    assert.ok(report.attestationSignature.includes('ed25519:proofrail_verifier_sig'));
  });

  await test('Rejects broken or fraudulent candidate deliverable with failure', async () => {
    const brokenCode = `
      function calculateDiscount(cartTotal, discountCode) {
        return 0; // Broken logic
      }
      module.exports = { calculateDiscount };
    `;
    const testSuite = `
      test('20% discount on 100', () => {
        expect(calculateDiscount(100, 'PROMO20')).toBe(80);
      });
    `;

    const report = await runVerification({
      jobId: 'job-t2',
      submissionId: 'sub-t2',
      agentId: 'codefix-v1',
      artifactContent: brokenCode,
      policy: {
        type: 'DETERMINISTIC_CODE',
        testSuite,
        timeoutMs: 3000,
        policyHash: sha256(testSuite),
      },
    });

    assert.strictEqual(report.passed, false);
    assert.strictEqual(report.score, 0);
    assert.strictEqual(report.failedTests, 1);
  });

  // 3. NEAR Smart Contract Escrow
  console.log('\n[3/3] NEAR Smart Contract Escrow & Settlement Mechanics:');
  await test('Creates funded job and locks deposit on contract', async () => {
    const jobId = `job-escrow-test-${Date.now()}`;
    const { transaction, job } = await nearClient.createFundedJob({
      jobId,
      buyerId: 'alice.testnet',
      providerId: 'codefix.near',
      amountNear: 2.5,
      policyHash: 'hash-xyz',
    });

    assert.strictEqual(transaction.type, 'ESCROW_DEPOSIT');
    assert.strictEqual(transaction.amountNear, 2.5);
    assert.strictEqual(job.state, 'ASSIGNED');
  });

  await test('Prevents payout if verification failed and allows full refund', async () => {
    const jobId = `job-fail-payout-${Date.now()}`;
    await nearClient.createFundedJob({
      jobId,
      buyerId: 'bob.testnet',
      providerId: 'codefix.near',
      amountNear: 3.0,
      policyHash: 'hash-fail',
    });

    await nearClient.recordSubmission(jobId, 'codefix.near', 'artifact-bad');
    await nearClient.attestVerification({
      jobId,
      verifierId: 'verifier.proofrail.testnet',
      passed: false,
      evidenceHash: 'evidence-fail',
    });

    // Payout MUST fail
    let payoutFailed = false;
    try {
      await nearClient.settleJob(jobId);
    } catch {
      payoutFailed = true;
    }
    assert.strictEqual(payoutFailed, true, 'Smart contract must forbid payout on failed verification');

    // Refund MUST succeed
    const { transaction } = await nearClient.refundJob(jobId, 'bob.testnet');
    assert.strictEqual(transaction.type, 'REFUND_TRANSFER');
    assert.strictEqual(transaction.toAccount, 'bob.testnet');
    assert.strictEqual(transaction.amountNear, 3.0);
  });

  await test('Releases payout to provider when verification passes', async () => {
    const jobId = `job-pass-payout-${Date.now()}`;
    await nearClient.createFundedJob({
      jobId,
      buyerId: 'carol.testnet',
      providerId: 'codefix.near',
      amountNear: 5.0,
      policyHash: 'hash-pass',
    });

    await nearClient.recordSubmission(jobId, 'codefix.near', 'artifact-good');
    await nearClient.attestVerification({
      jobId,
      verifierId: 'verifier.proofrail.testnet',
      passed: true,
      evidenceHash: 'evidence-good',
    });

    const { transaction } = await nearClient.settleJob(jobId);
    assert.strictEqual(transaction.type, 'SETTLEMENT_PAYOUT');
    assert.strictEqual(transaction.toAccount, 'codefix.near');
    assert.strictEqual(transaction.amountNear, 5.0);
  });

  console.log('\n====================================================');
  console.log(`Summary: ${passedCount} passed, ${failedCount} failed`);
  console.log('====================================================\n');

  if (failedCount > 0) process.exit(1);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
