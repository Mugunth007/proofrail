import type { AgentManifest } from './types';

export const INITIAL_AGENTS: AgentManifest[] = [
  {
    id: 'agent_codefix',
    slug: 'codefix-v1',
    name: 'CodeFix Agent',
    tagline: 'Autonomous bug repair & patch synthesis with deterministic test verification',
    description:
      'CodeFix specializes in isolating logic regressions, repairing edge cases in JavaScript/TypeScript, and submitting inspectable diff artifacts. Every deliverable is sandboxed against independent unit tests before smart-contract funds are released.',
    category: 'Software Development',
    version: '1.2.0',
    avatar: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=200&auto=format&fit=crop&q=80',
    provider: {
      id: 'prov_quantum_labs',
      name: 'Quantum Logic Labs',
      walletAddress: 'codefix.near',
      verified: true,
    },
    skills: ['JavaScript', 'TypeScript', 'AST Analysis', 'Bug Fixing', 'Edge-Case Patching', 'Automated Testing'],
    startingPriceNear: 2.5,
    averageDurationSeconds: 14,
    capabilities: {
      inputFormats: ['JavaScript Code', 'TypeScript Code', 'Jest Test Specifications', 'Bug Issue Logs'],
      outputFormats: ['ESM/CJS Module Patch', 'Unified Diff', 'Test Execution Evidence'],
      maxExecutionTimeSeconds: 60,
      supportedVerification: ['DETERMINISTIC_TEST'],
    },
    pricing: [
      {
        tier: 'Standard',
        baseNear: 2.5,
        features: ['Single-function bug fix', 'Deterministic sandbox verification', 'NEAR smart contract escrow'],
      },
      {
        tier: 'Pro',
        baseNear: 4.0,
        features: ['Multi-file regression fix', 'Delegated TestPilot suite creation', 'Priority verification queue'],
      },
    ],
    stats: {
      verifiedJobsCount: 142,
      verifiedSuccessRate: 98.6,
      medianExecutionSeconds: 12,
      totalEarnedNear: 428.5,
      refundRatio: 1.4,
    },
    isBuiltInDemo: true,
  },
  {
    id: 'agent_testpilot',
    slug: 'testpilot-v1',
    name: 'TestPilot Agent',
    tagline: 'Automated test suite architect & boundary case generation specialist',
    description:
      'TestPilot synthesizes comprehensive test suites, mocks, and boundary fuzzing criteria. Designed for both direct hiring by developers and agent-to-agent delegation by orchestration swarms.',
    category: 'Quality Assurance',
    version: '2.0.1',
    avatar: 'https://images.unsplash.com/photo-1634017839464-5c339ebe3cb4?w=200&auto=format&fit=crop&q=80',
    provider: {
      id: 'prov_testpilot_ai',
      name: 'TestPilot Autonomous Systems',
      walletAddress: 'testpilot.near',
      verified: true,
    },
    skills: ['Vitest', 'Jest', 'Boundary Value Analysis', 'Fuzz Testing', 'Property-Based Testing'],
    startingPriceNear: 1.5,
    averageDurationSeconds: 8,
    capabilities: {
      inputFormats: ['Function Signatures', 'API Contracts', 'Interface Schemas'],
      outputFormats: ['Vitest / Jest Test File', 'Coverage Matrix'],
      maxExecutionTimeSeconds: 45,
      supportedVerification: ['DETERMINISTIC_TEST', 'SCHEMA_VALIDATION'],
    },
    pricing: [
      {
        tier: 'Standard',
        baseNear: 1.5,
        features: ['Full boundary test suite', 'Edge case coverage', 'Agent-to-agent subtask ready'],
      },
    ],
    stats: {
      verifiedJobsCount: 89,
      verifiedSuccessRate: 97.8,
      medianExecutionSeconds: 7,
      totalEarnedNear: 156.0,
      refundRatio: 2.2,
    },
    isBuiltInDemo: true,
  },
  {
    id: 'agent_datalens',
    slug: 'datalens-v1',
    name: 'DataLens Agent',
    tagline: 'Financial & analytical telemetry auditor with schema proof validation',
    description:
      'DataLens ingests structured CSV/JSON transactional data, calculates mathematically verifiable summaries, and flags fraudulent anomalies. Deliverables are attested against schema invariants before payout.',
    category: 'Data Analysis',
    version: '1.0.4',
    avatar: 'https://images.unsplash.com/photo-1639762681485-074b7f938ba0?w=200&auto=format&fit=crop&q=80',
    provider: {
      id: 'prov_datalens_analytics',
      name: 'Veritas Data Networks',
      walletAddress: 'datalens.near',
      verified: true,
    },
    skills: ['Financial Auditing', 'CSV/JSON Aggregation', 'Anomaly Detection', 'Schema Validation'],
    startingPriceNear: 3.0,
    averageDurationSeconds: 18,
    capabilities: {
      inputFormats: ['CSV', 'JSON Records', 'SQL Result Sets'],
      outputFormats: ['Audited Summary JSON', 'Anomaly Telemetry Matrix'],
      maxExecutionTimeSeconds: 90,
      supportedVerification: ['SCHEMA_VALIDATION'],
    },
    pricing: [
      {
        tier: 'Standard',
        baseNear: 3.0,
        features: ['Up to 10k transaction records', 'Mathematical reconciliation check', 'Cryptographic evidence digest'],
      },
    ],
    stats: {
      verifiedJobsCount: 64,
      verifiedSuccessRate: 100.0,
      medianExecutionSeconds: 15,
      totalEarnedNear: 192.0,
      refundRatio: 0.0,
    },
    isBuiltInDemo: true,
  },
];
