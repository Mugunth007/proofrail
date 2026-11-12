import { NextResponse } from 'next/server';
import { nearClient } from '@/lib/near/client';
import { store } from '@/lib/store';
import { runVerification } from '@/lib/verifier/runner';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const job = store.getJobById(id);

    if (!job) {
      return NextResponse.json({ error: 'Job not found' }, { status: 404 });
    }

    if (job.state !== 'SUBMITTED' && job.state !== 'VERIFYING') {
      return NextResponse.json(
        { error: `Job must be in SUBMITTED state to verify. Current: ${job.state}` },
        { status: 400 }
      );
    }

    if (!job.artifact) {
      return NextResponse.json({ error: 'No deliverable artifact found to verify' }, { status: 400 });
    }

    // Move to VERIFYING
    store.updateJob(job.id, { state: 'VERIFYING' });
    store.addJobEvent(job.id, {
      eventType: 'verification.started',
      title: 'Independent Verification Dispatched',
      message: 'Sandboxed runner spawned with isolated VM context and resource timeout constraints.',
    });

    // Run independent verification
    const report = await runVerification({
      jobId: job.id,
      submissionId: job.artifact.id,
      agentId: job.agentId,
      artifactContent: job.artifact.content,
      policy: job.verificationPolicy,
    });

    // Submit attestation to NEAR Smart Contract
    await nearClient.attestVerification({
      jobId: job.id,
      verifierId: report.verifierId,
      passed: report.passed,
      evidenceHash: report.evidenceDigest,
    });

    const nextState = report.passed ? 'PASSED' : 'FAILED';

    store.updateJob(job.id, {
      state: nextState,
      verificationReport: report,
    });

    if (report.passed) {
      store.addJobEvent(job.id, {
        eventType: 'verification.passed',
        title: 'Verification Succeeded — 100% Tests Passed',
        message: `All ${report.totalTests} tests passed in ${report.executionDurationMs}ms. Evidence Digest: ${report.evidenceDigest.slice(0, 16)}... Authorized on NEAR escrow.`,
        details: {
          score: report.score,
          evidenceDigest: report.evidenceDigest,
          attestationSignature: report.attestationSignature,
        },
      });
    } else {
      store.addJobEvent(job.id, {
        eventType: 'verification.failed',
        title: 'Verification Failed',
        message: `Outcome failed: ${report.failedTests} test(s) failed. Payout blocked. Eligible for full escrow refund.`,
        details: {
          failureReason: report.failureReason,
          evidenceDigest: report.evidenceDigest,
        },
      });
    }

    const updatedJob = store.getJobById(job.id);
    return NextResponse.json({
      success: true,
      job: updatedJob,
      report,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
