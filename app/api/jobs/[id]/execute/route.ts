import { NextResponse } from 'next/server';
import { aiProvider } from '@/lib/ai/provider';
import { sha256 } from '@/lib/crypto';
import { nearClient } from '@/lib/near/client';
import { store } from '@/lib/store';
import type { ExecutionArtifact, JobDelegation } from '@/lib/types';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json().catch(() => ({}));
    const job = store.getJobById(id);

    if (!job) {
      return NextResponse.json({ error: 'Job not found' }, { status: 404 });
    }

    if (job.state !== 'ASSIGNED' && job.state !== 'FUNDED') {
      return NextResponse.json(
        { error: `Job must be in FUNDED or ASSIGNED state to execute. Current: ${job.state}` },
        { status: 400 }
      );
    }

    const agent = store.getAgentById(job.agentId);
    if (!agent) {
      return NextResponse.json({ error: 'Agent not found' }, { status: 404 });
    }

    // Move to RUNNING
    store.updateJob(job.id, { state: 'RUNNING' });
    store.addJobEvent(job.id, {
      eventType: 'agent.started',
      title: `${agent.name} Execution Started`,
      message: `Analyzing task "${job.title}". Initializing tool environment and AST parser.`,
    });

    const enableDelegation = body.enableDelegation ?? true;

    // Run AI Agent task
    const executionResult = await aiProvider.executeAgentTask({
      agentSlug: agent.slug,
      taskTitle: job.title,
      taskDescription: job.description,
      testSuite: job.verificationPolicy.testSuite,
      enableDelegation,
    });

    // Record AI intermediate thoughts & actions
    for (const step of executionResult.steps) {
      if (step.toolName === 'proofrail_delegate_service') {
        store.addJobEvent(job.id, {
          eventType: 'agent.delegation_started',
          title: 'Agent-to-Agent Delegation Initiated',
          message: `${agent.name} hired TestPilot Agent for 0.5 NEAR sub-budget to construct edge-case test suite.`,
          details: {
            delegatedAgent: 'TestPilot Agent',
            budgetNear: 0.5,
            toolResult: step.toolResult,
          },
        });
      } else {
        store.addJobEvent(job.id, {
          eventType: 'agent.thought',
          title: step.action,
          message: step.thought,
          details: step.toolResult ? { toolResult: step.toolResult } : undefined,
        });
      }
    }

    let delegationRecord: JobDelegation | undefined;
    if (executionResult.subtaskRequested) {
      delegationRecord = {
        id: `dlg-${job.id}-testpilot`,
        parentJobId: job.id,
        childJobId: `child-${Date.now().toString(36)}`,
        parentAgentId: agent.id,
        childAgentId: 'agent_testpilot',
        subtaskTitle: executionResult.subtaskRequested.subtaskTitle,
        allocatedBudgetNear: executionResult.subtaskRequested.budgetNear,
        status: 'COMPLETED',
        resultArtifactId: `art-child-${Date.now()}`,
      };

      store.addJobEvent(job.id, {
        eventType: 'agent.delegation_completed',
        title: 'Delegated Subtask Verified & Ingested',
        message: 'TestPilot deliverable successfully verified and integrated into candidate solution.',
      });
    }

    // Create deliverable artifact
    const artifactDigest = sha256(executionResult.deliverableCode);
    const artifact: ExecutionArtifact = {
      id: `art-${job.id}-${Date.now().toString(36)}`,
      jobId: job.id,
      agentId: agent.id,
      filename: `${agent.slug}.deliverable.js`,
      contentType: 'application/javascript',
      content: executionResult.deliverableCode,
      sha256Digest: artifactDigest,
      submittedAt: new Date().toISOString(),
    };

    // Register submission on NEAR contract
    await nearClient.recordSubmission(
      job.id,
      agent.provider.walletAddress,
      artifactDigest
    );

    store.updateJob(job.id, {
      state: 'SUBMITTED',
      artifact,
      delegation: delegationRecord,
    });

    store.addJobEvent(job.id, {
      eventType: 'agent.artifact_submitted',
      title: 'Work Artifact Submitted',
      message: `Artifact ${artifact.filename} submitted. SHA-256: ${artifactDigest.slice(0, 20)}... Recorded on NEAR escrow.`,
      details: {
        artifactDigest,
        summary: executionResult.deliverableSummary,
      },
    });

    const updatedJob = store.getJobById(job.id);
    return NextResponse.json({
      success: true,
      job: updatedJob,
      artifact,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
