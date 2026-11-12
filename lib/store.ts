import { INITIAL_AGENTS } from './agents';
import { sha256 } from './crypto';
import type {
  AgentCategory,
  AgentManifest,
  ChainTransaction,
  ExecutionArtifact,
  Job,
  JobEvent,
  JobState,
  VerificationPolicy,
  VerificationReport,
} from './types';

export { INITIAL_AGENTS };

// Pre-seeded Initial Completed Demo Job
const SEED_JOB_CODE = `function calculateDiscount(cartTotal, discountCode, isVip = false) {
  if (typeof cartTotal !== 'number' || cartTotal <= 0) {
    return { finalTotal: 0, discountApplied: 0, error: 'Invalid cart total' };
  }
  let discountRate = 0;
  const normalizedCode = (discountCode || '').trim().toUpperCase();
  if (normalizedCode === 'SAVE10') discountRate = 0.10;
  else if (normalizedCode === 'PROMO20') discountRate = 0.20;
  else if (normalizedCode === 'SUPER50') discountRate = 0.50;
  
  if (isVip) discountRate = Math.min(0.50, discountRate + 0.05);

  const rawDiscount = cartTotal * discountRate;
  const discountApplied = Math.round(rawDiscount * 100) / 100;
  const finalTotal = Math.max(0, Math.round((cartTotal - discountApplied) * 100) / 100);

  return { cartTotal, discountRate, discountApplied, finalTotal, isVip: Boolean(isVip) };
}
module.exports = { calculateDiscount };`;

const SEED_TEST_SUITE = `test('Applies PROMO20 discount accurately for regular user', () => {
  const res = calculateDiscount(100, 'PROMO20', false);
  expect(res.discountApplied).toBe(20);
  expect(res.finalTotal).toBe(80);
});

test('Applies VIP bonus (25% total)', () => {
  const res = calculateDiscount(100, 'PROMO20', true);
  expect(res.discountApplied).toBe(25);
  expect(res.finalTotal).toBe(75);
});

test('Handles invalid negative cart value gracefully', () => {
  const res = calculateDiscount(-50, 'SAVE10');
  expect(res.finalTotal).toBe(0);
});`;

export const INITIAL_JOBS: Job[] = [
  {
    id: 'job-verified-demo-849',
    title: 'Fix 20% Discount Calculation Defect in E-Commerce Checkout',
    description:
      'The current checkout discount logic fails on boundary values when PROMO20 is applied alongside VIP membership bonuses. Repair the calculateDiscount function and ensure all tests pass.',
    agentId: 'agent_codefix',
    buyerWallet: 'alice_buyer.testnet',
    state: 'PAID',
    priceNear: 2.5,
    priceYocto: '2500000000000000000000000',
    verificationPolicy: {
      type: 'DETERMINISTIC_CODE',
      testSuite: SEED_TEST_SUITE,
      testRunner: 'node:vm',
      timeoutMs: 4000,
      policyHash: sha256(SEED_TEST_SUITE),
    },
    artifact: {
      id: 'art-849-01',
      jobId: 'job-verified-demo-849',
      agentId: 'agent_codefix',
      filename: 'calculateDiscount.patch.js',
      contentType: 'application/javascript',
      content: SEED_JOB_CODE,
      sha256Digest: sha256(SEED_JOB_CODE),
      submittedAt: new Date(Date.now() - 3600000).toISOString(),
    },
    verificationReport: {
      id: 'ver-849-01',
      jobId: 'job-verified-demo-849',
      submissionId: 'art-849-01',
      agentId: 'agent_codefix',
      verifierId: 'verifier.proofrail.testnet',
      policyHash: sha256(SEED_TEST_SUITE),
      artifactDigest: sha256(SEED_JOB_CODE),
      passed: true,
      score: 100,
      totalTests: 3,
      passedTests: 3,
      failedTests: 0,
      executionDurationMs: 142,
      testOutput: `========================================
PROOFRAIL INDEPENDENT TEST HARNESS v1.0
Target Artifact SHA-256: ${sha256(SEED_JOB_CODE).slice(0, 16)}...
Policy Hash: ${sha256(SEED_TEST_SUITE).slice(0, 16)}...
========================================

  ✓ PASS: Applies PROMO20 discount accurately for regular user
  ✓ PASS: Applies VIP bonus (25% total)
  ✓ PASS: Handles invalid negative cart value gracefully

----------------------------------------
Test Summary: 3/3 passed (0 failed)
----------------------------------------`,
      evidenceDigest: sha256(`job-verified-demo-849-passed-${sha256(SEED_JOB_CODE)}`),
      attestationSignature: `ed25519:proofrail_verifier_sig_9908127391abf81`,
      timestamp: new Date(Date.now() - 3550000).toISOString(),
    },
    transactions: [
      {
        id: 'tx-849-deposit',
        jobId: 'job-verified-demo-849',
        type: 'ESCROW_DEPOSIT',
        transactionHash: '6sK9kM44qZ7Xm7rQp9wD8K1L2M3N4P5R6S7T8U9V0W1X',
        blockHeight: 184520110,
        fromAccount: 'alice_buyer.testnet',
        toAccount: 'proofrail.testnet',
        amountNear: 2.5,
        amountYocto: '2500000000000000000000000',
        status: 'CONFIRMED',
        explorerUrl: 'https://testnet.nearblocks.io/txns/6sK9kM44qZ7Xm7rQp9wD8K1L2M3N4P5R6S7T8U9V0W1X',
        timestamp: new Date(Date.now() - 3650000).toISOString(),
      },
      {
        id: 'tx-849-settle',
        jobId: 'job-verified-demo-849',
        type: 'SETTLEMENT_PAYOUT',
        transactionHash: '9aB2cD3eF4gH5jK6mL7nP8qR9sT0uV1wX2yZ3aB4cD5e',
        blockHeight: 184520125,
        fromAccount: 'proofrail.testnet',
        toAccount: 'codefix.near',
        amountNear: 2.5,
        amountYocto: '2500000000000000000000000',
        status: 'CONFIRMED',
        explorerUrl: 'https://testnet.nearblocks.io/txns/9aB2cD3eF4gH5jK6mL7nP8qR9sT0uV1wX2yZ3aB4cD5e',
        timestamp: new Date(Date.now() - 3500000).toISOString(),
      },
    ],
    events: [
      {
        id: 'evt-1',
        jobId: 'job-verified-demo-849',
        step: 1,
        eventType: 'job.created',
        title: 'Job Created',
        message: 'Task initiated with 2.5 NEAR budget and deterministic test verification policy.',
        timestamp: new Date(Date.now() - 3700000).toISOString(),
      },
      {
        id: 'evt-2',
        jobId: 'job-verified-demo-849',
        step: 2,
        eventType: 'job.funded',
        title: 'Escrow Funded on NEAR Testnet',
        message: '2.5 NEAR deposited into proofrail.testnet smart contract.',
        timestamp: new Date(Date.now() - 3650000).toISOString(),
      },
      {
        id: 'evt-3',
        jobId: 'job-verified-demo-849',
        step: 3,
        eventType: 'agent.started',
        title: 'CodeFix Agent Dispatched',
        message: 'Agent parsed AST and detected root-cause discount rounding regression.',
        timestamp: new Date(Date.now() - 3620000).toISOString(),
      },
      {
        id: 'evt-4',
        jobId: 'job-verified-demo-849',
        step: 4,
        eventType: 'agent.artifact_submitted',
        title: 'Candidate Patch Submitted',
        message: 'calculateDiscount.patch.js delivered. SHA-256 hash registered on NEAR escrow.',
        timestamp: new Date(Date.now() - 3600000).toISOString(),
      },
      {
        id: 'evt-5',
        jobId: 'job-verified-demo-849',
        step: 5,
        eventType: 'verification.passed',
        title: 'Independent Verification Passed',
        message: 'Sandboxed runner executed 3 assertions with 100% success. Attestation signed.',
        timestamp: new Date(Date.now() - 3550000).toISOString(),
      },
      {
        id: 'evt-6',
        jobId: 'job-verified-demo-849',
        step: 6,
        eventType: 'payment.confirmed',
        title: 'Payout Settled Onchain',
        message: 'NEAR contract transferred 2.5 NEAR to codefix.near.',
        timestamp: new Date(Date.now() - 3500000).toISOString(),
      },
    ],
    createdAt: new Date(Date.now() - 3700000).toISOString(),
    updatedAt: new Date(Date.now() - 3500000).toISOString(),
    completedAt: new Date(Date.now() - 3500000).toISOString(),
  },
];

// Singleton Store
class ProofRailStore {
  private agents: Map<string, AgentManifest> = new Map();
  private jobs: Map<string, Job> = new Map();
  private eventListeners: Map<string, ((event: JobEvent) => void)[]> = new Map();

  constructor() {
    INITIAL_AGENTS.forEach(a => this.agents.set(a.id, a));
    INITIAL_JOBS.forEach(j => this.jobs.set(j.id, j));
  }

  // AGENTS
  public getAgents(): AgentManifest[] {
    return Array.from(this.agents.values());
  }

  public getAgentBySlug(slug: string): AgentManifest | undefined {
    return Array.from(this.agents.values()).find(a => a.slug === slug || a.id === slug);
  }

  public getAgentById(id: string): AgentManifest | undefined {
    return this.agents.get(id);
  }

  public registerAgent(agent: AgentManifest): AgentManifest {
    this.agents.set(agent.id, agent);
    return agent;
  }

  // JOBS
  public getJobs(): Job[] {
    return Array.from(this.jobs.values()).sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }

  public getJobById(id: string): Job | undefined {
    return this.jobs.get(id);
  }

  public createJob(job: Job): Job {
    this.jobs.set(job.id, job);
    return job;
  }

  public updateJob(jobId: string, updates: Partial<Job>): Job {
    const existing = this.jobs.get(jobId);
    if (!existing) throw new Error(`Job ${jobId} not found`);
    const updated = { ...existing, ...updates, updatedAt: new Date().toISOString() };
    this.jobs.set(jobId, updated);
    return updated;
  }

  public addJobEvent(jobId: string, eventData: Omit<JobEvent, 'id' | 'jobId' | 'step' | 'timestamp'>): JobEvent {
    const job = this.jobs.get(jobId);
    if (!job) throw new Error(`Job ${jobId} not found`);

    const step = (job.events.length || 0) + 1;
    const event: JobEvent = {
      id: `evt-${jobId}-${step}-${Date.now()}`,
      jobId,
      step,
      ...eventData,
      timestamp: new Date().toISOString(),
    };

    job.events.push(event);
    job.updatedAt = new Date().toISOString();
    this.jobs.set(jobId, job);

    // Notify active SSE subscribers
    const listeners = this.eventListeners.get(jobId) || [];
    listeners.forEach(fn => fn(event));

    return event;
  }

  public subscribeJobEvents(jobId: string, listener: (event: JobEvent) => void): () => void {
    const list = this.eventListeners.get(jobId) || [];
    list.push(listener);
    this.eventListeners.set(jobId, list);

    return () => {
      const current = this.eventListeners.get(jobId) || [];
      this.eventListeners.set(
        jobId,
        current.filter(l => l !== listener)
      );
    };
  }
}

const globalForStore = globalThis as unknown as { proofRailStore?: ProofRailStore };
export const store = globalForStore.proofRailStore ?? new ProofRailStore();
if (process.env.NODE_ENV !== 'production') globalForStore.proofRailStore = store;
