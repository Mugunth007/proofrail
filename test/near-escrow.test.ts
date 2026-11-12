import { describe, expect, it } from 'vitest';
import { nearToYocto, yoctoToNear } from '../lib/crypto';
import { nearClient } from '../lib/near/client';

describe('NEAR Escrow & Settlement Mechanics', () => {
  it('converts NEAR to integer yoctoNEAR accurately', () => {
    const yocto = nearToYocto(2.5);
    expect(yocto).toBe('2500000000000000000000000');
    expect(yoctoToNear(yocto)).toBe(2.5);
  });

  it('enforces that a failed task CANNOT settle payout to provider', async () => {
    const jobId = `job-escrow-${Date.now()}`;

    // 1. Create funded job
    await nearClient.createFundedJob({
      jobId,
      buyerId: 'alice.testnet',
      providerId: 'codefix.near',
      amountNear: 3.0,
      policyHash: 'policy-hash-xyz',
    });

    // 2. Submit artifact
    await nearClient.recordSubmission(jobId, 'codefix.near', 'artifact-sha256');

    // 3. Verifier attests FAILURE
    await nearClient.attestVerification({
      jobId,
      verifierId: 'verifier.proofrail.testnet',
      passed: false,
      evidenceHash: 'evidence-fail-hash',
    });

    // 4. Payout MUST fail
    await expect(nearClient.settleJob(jobId)).rejects.toThrow(
      'Cannot settle job in state FAILED: Must be PASSED by verifier'
    );

    // 5. Refund MUST succeed
    const { transaction } = await nearClient.refundJob(jobId, 'alice.testnet');
    expect(transaction.type).toBe('REFUND_TRANSFER');
    expect(transaction.toAccount).toBe('alice.testnet');
    expect(transaction.amountNear).toBe(3.0);
  });

  it('authorizes payout when verification passes', async () => {
    const jobId = `job-pass-${Date.now()}`;

    await nearClient.createFundedJob({
      jobId,
      buyerId: 'bob.testnet',
      providerId: 'codefix.near',
      amountNear: 4.5,
      policyHash: 'policy-hash-abc',
    });

    await nearClient.recordSubmission(jobId, 'codefix.near', 'artifact-hash-good');

    await nearClient.attestVerification({
      jobId,
      verifierId: 'verifier.proofrail.testnet',
      passed: true,
      evidenceHash: 'evidence-pass-hash',
    });

    const { transaction } = await nearClient.settleJob(jobId);
    expect(transaction.type).toBe('SETTLEMENT_PAYOUT');
    expect(transaction.toAccount).toBe('codefix.near');
    expect(transaction.amountNear).toBe(4.5);
  });
});
