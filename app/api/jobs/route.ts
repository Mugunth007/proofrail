import { NextResponse } from 'next/server';
import { z } from 'zod';
import { nearToYocto, sha256 } from '@/lib/crypto';
import { store } from '@/lib/store';
import type { Job, VerificationPolicy } from '@/lib/types';

const CreateJobSchema = z.object({
  title: z.string().min(5),
  description: z.string().min(10),
  agentSlug: z.string(),
  buyerWallet: z.string().default('user.testnet'),
  testSuite: z.string().optional(),
  verificationType: z.enum(['DETERMINISTIC_CODE', 'STRUCTURED_DATA', 'HUMAN_REVIEW']).default('DETERMINISTIC_CODE'),
  priceNear: z.number().positive().optional(),
  enableDelegation: z.boolean().optional(),
});

export async function GET() {
  const jobs = store.getJobs();
  return NextResponse.json({ jobs });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const data = CreateJobSchema.parse(body);

    const agent = store.getAgentBySlug(data.agentSlug);
    if (!agent) {
      return NextResponse.json({ error: 'Selected agent not found' }, { status: 404 });
    }

    const priceNear = data.priceNear || agent.startingPriceNear;
    const priceYocto = nearToYocto(priceNear);

    // Provide default test suite for CodeFix if not provided
    let testSuite = data.testSuite;
    if (!testSuite && (agent.slug === 'codefix-v1' || agent.slug === 'codefix')) {
      testSuite = `test('Correctly calculates 20% discount on 100 total', () => {
  const result = calculateDiscount(100, 'PROMO20', false);
  expect(result.discountApplied).toBe(20);
  expect(result.finalTotal).toBe(80);
});

test('Applies VIP bonus (+5%) properly for PROMO20', () => {
  const result = calculateDiscount(100, 'PROMO20', true);
  expect(result.discountApplied).toBe(25);
  expect(result.finalTotal).toBe(75);
});

test('Rejects negative or invalid cart amount safely', () => {
  const result = calculateDiscount(-20, 'SAVE10');
  expect(result.finalTotal).toBe(0);
});`;
    }

    const policy: VerificationPolicy = {
      type: data.verificationType,
      testSuite,
      testRunner: 'node:vm',
      timeoutMs: 4000,
      policyHash: sha256(testSuite || data.description),
    };

    const jobId = `job-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;

    const newJob: Job = {
      id: jobId,
      title: data.title,
      description: data.description,
      agentId: agent.id,
      buyerWallet: data.buyerWallet,
      state: 'DRAFT',
      priceNear,
      priceYocto,
      verificationPolicy: policy,
      transactions: [],
      events: [
        {
          id: `evt-${jobId}-1`,
          jobId,
          step: 1,
          eventType: 'job.created',
          title: 'Job Initialized',
          message: `Created job quote for ${priceNear} NEAR with agent ${agent.name}. Awaiting smart contract funding.`,
          timestamp: new Date().toISOString(),
        },
      ],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    store.createJob(newJob);

    return NextResponse.json({ success: true, job: newJob });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.errors ? err.errors : err.message },
      { status: 400 }
    );
  }
}
