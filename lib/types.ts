export type JobState =
  | 'DRAFT'
  | 'QUOTED'
  | 'FUNDING_PENDING'
  | 'FUNDED'
  | 'ASSIGNED'
  | 'RUNNING'
  | 'SUBMITTED'
  | 'VERIFYING'
  | 'PASSED'
  | 'FAILED'
  | 'SETTLEMENT_PENDING'
  | 'PAID'
  | 'REFUND_ELIGIBLE'
  | 'REFUND_PENDING'
  | 'REFUNDED'
  | 'DISPUTED';

export type AgentCategory =
  | 'Software Development'
  | 'Quality Assurance'
  | 'Data Analysis'
  | 'Research'
  | 'Automation'
  | 'Security & Defense';

export interface AgentManifest {
  id: string;
  slug: string;
  name: string;
  tagline: string;
  description: string;
  category: AgentCategory;
  version: string;
  avatar: string;
  provider: {
    id: string;
    name: string;
    walletAddress: string;
    verified: boolean;
  };
  skills: string[];
  startingPriceNear: number;
  averageDurationSeconds: number;
  capabilities: {
    inputFormats: string[];
    outputFormats: string[];
    maxExecutionTimeSeconds: number;
    supportedVerification: ('DETERMINISTIC_TEST' | 'SCHEMA_VALIDATION' | 'HUMAN_REVIEW')[];
  };
  pricing: {
    baseNear: number;
    tier: 'Standard' | 'Pro' | 'Enterprise';
    features: string[];
  }[];
  stats: {
    verifiedJobsCount: number;
    verifiedSuccessRate: number;
    medianExecutionSeconds: number;
    totalEarnedNear: number;
    refundRatio: number;
  };
  isBuiltInDemo?: boolean;
}

export interface VerificationPolicy {
  type: 'DETERMINISTIC_CODE' | 'STRUCTURED_DATA' | 'HUMAN_REVIEW';
  testSuite?: string;
  testRunner?: 'node:vm' | 'vitest' | 'jest';
  expectedSchema?: Record<string, any>;
  timeoutMs: number;
  policyHash: string;
}

export interface ExecutionArtifact {
  id: string;
  jobId: string;
  agentId: string;
  filename: string;
  contentType: string;
  content: string;
  sha256Digest: string;
  submittedAt: string;
}

export interface VerificationReport {
  id: string;
  jobId: string;
  submissionId: string;
  agentId: string;
  verifierId: string;
  policyHash: string;
  artifactDigest: string;
  passed: boolean;
  score: number; // 0 - 100
  totalTests: number;
  passedTests: number;
  failedTests: number;
  executionDurationMs: number;
  testOutput: string;
  evidenceDigest: string; // SHA-256 of canonical evidence bundle
  attestationSignature: string;
  timestamp: string;
  failureReason?: string;
}

export interface ChainTransaction {
  id: string;
  jobId: string;
  type: 'ESCROW_DEPOSIT' | 'SETTLEMENT_PAYOUT' | 'REFUND_TRANSFER';
  transactionHash: string;
  blockHeight: number;
  fromAccount: string;
  toAccount: string;
  amountNear: number;
  amountYocto: string;
  status: 'PENDING' | 'CONFIRMED' | 'FAILED';
  explorerUrl: string;
  timestamp: string;
}

export interface JobEvent {
  id: string;
  jobId: string;
  step: number;
  eventType:
    | 'job.created'
    | 'job.funded'
    | 'agent.started'
    | 'agent.thought'
    | 'agent.tool_call'
    | 'agent.delegation_started'
    | 'agent.delegation_completed'
    | 'agent.artifact_submitted'
    | 'verification.started'
    | 'verification.evaluating'
    | 'verification.passed'
    | 'verification.failed'
    | 'payment.settling'
    | 'payment.confirmed'
    | 'job.completed'
    | 'job.refunded';
  title: string;
  message: string;
  details?: Record<string, any>;
  timestamp: string;
}

export interface JobDelegation {
  id: string;
  parentJobId: string;
  childJobId: string;
  parentAgentId: string;
  childAgentId: string;
  subtaskTitle: string;
  allocatedBudgetNear: number;
  status: 'PENDING' | 'COMPLETED' | 'FAILED';
  resultArtifactId?: string;
}

export interface Job {
  id: string;
  title: string;
  description: string;
  agentId: string;
  buyerWallet: string;
  state: JobState;
  priceNear: number;
  priceYocto: string;
  verificationPolicy: VerificationPolicy;
  artifact?: ExecutionArtifact;
  verificationReport?: VerificationReport;
  transactions: ChainTransaction[];
  events: JobEvent[];
  delegation?: JobDelegation;
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
}
