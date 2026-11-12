'use client';
import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  ShieldCheck,
  Cpu,
  Coins,
  ArrowRight,
  Code2,
  CheckCircle2,
  Lock,
  Layers,
  Sparkles,
} from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { INITIAL_AGENTS } from '@/lib/agents';
import type { AgentManifest } from '@/lib/types';
import { useNearWallet } from '@/context/NearWalletContext';

function CreateJobForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialAgentSlug = searchParams.get('agent') || 'codefix-v1';

  const {
    accountId,
    isConnected,
    balanceFormatted,
    setIsModalOpen,
  } = useNearWallet();

  const [selectedAgentSlug, setSelectedAgentSlug] = useState<string>(initialAgentSlug);
  const [title, setTitle] = useState<string>(
    'Repair calculateDiscount Function in Checkout Flow'
  );
  const [description, setDescription] = useState<string>(
    'The checkout module incorrectly calculates a 20% discount on boundary cart totals and VIP bonus calculations. Analyze the calculateDiscount function, patch the defect, and verify with unit tests.'
  );
  const [testSuite, setTestSuite] = useState<string>(`test('Calculates 20% discount correctly for standard customer', () => {
  const result = calculateDiscount(100, 'PROMO20', false);
  expect(result.discountApplied).toBe(20);
  expect(result.finalTotal).toBe(80);
});

test('Applies VIP bonus correctly (+5%)', () => {
  const result = calculateDiscount(100, 'PROMO20', true);
  expect(result.discountApplied).toBe(25);
  expect(result.finalTotal).toBe(75);
});

test('Safely handles invalid or negative cart totals', () => {
  const result = calculateDiscount(-10, 'SAVE10');
  expect(result.finalTotal).toBe(0);
});`);

  const [verificationType, setVerificationType] = useState<
    'DETERMINISTIC_CODE' | 'STRUCTURED_DATA' | 'HUMAN_REVIEW'
  >('DETERMINISTIC_CODE');
  const [enableDelegation, setEnableDelegation] = useState<boolean>(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selectedAgent =
    INITIAL_AGENTS.find(a => a.slug === selectedAgentSlug) || INITIAL_AGENTS[0];

  const handleCreateAndFund = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    if (!isConnected || !accountId) {
      setIsModalOpen(true);
      setError('Please connect your NEAR wallet before funding the escrow.');
      return;
    }

    try {
      // 1. Create Job Quote
      const createRes = await fetch('/api/jobs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          description,
          agentSlug: selectedAgentSlug,
          buyerWallet: accountId,
          testSuite,
          verificationType,
          priceNear: selectedAgent.startingPriceNear,
          enableDelegation,
        }),
      });

      const createData = await createRes.json();
      if (!createRes.ok || !createData.job) {
        throw new Error(createData.error || 'Failed to initialize job quote');
      }

      const jobId = createData.job.id;

      // 2. Deposit escrow funds on NEAR
      const fundRes = await fetch(`/api/jobs/${jobId}/fund`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ buyerWallet: accountId }),
      });

      if (!fundRes.ok) {
        const errJson = await fundRes.json().catch(() => ({}));
        throw new Error(errJson.error || 'Failed to lock escrow deposit on NEAR contract');
      }

      // Redirect to live workspace
      router.push(`/jobs/${jobId}`);
    } catch (err: any) {
      setError(err.message || 'Error creating job');
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      {/* Header */}
      <div className="mb-8">
        <Badge variant="near" className="mb-2">NEAR Smart Contract Escrow</Badge>
        <h1 className="text-3xl font-extrabold text-white tracking-tight">
          Hire an AI Agent & Authorize Escrow
        </h1>
        <p className="text-text-secondary text-sm mt-1">
          Define your task specifications and test criteria. Funds are held in NEAR escrow until independent software verifies the outcome.
        </p>
      </div>

      <form onSubmit={handleCreateAndFund} className="space-y-8">
        {error && (
          <div className="p-4 rounded-xl bg-status-error/20 border border-status-error/40 text-rose-300 text-sm">
            {error}
          </div>
        )}

        {/* 1. Agent Selection */}
        <div className="p-6 rounded-2xl bg-surface-primary border border-surface-border space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <Cpu className="h-4 w-4 text-accent-secondary" />
              1. Select AI Service Provider
            </h2>
            <Badge variant="near">
              Starting {selectedAgent.startingPriceNear} Ⓝ
            </Badge>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {INITIAL_AGENTS.map(agent => {
              const isSelected = selectedAgentSlug === agent.slug;
              return (
                <div
                  key={agent.id}
                  onClick={() => setSelectedAgentSlug(agent.slug)}
                  className={`cursor-pointer p-4 rounded-xl border transition-all flex flex-col justify-between ${
                    isSelected
                      ? 'bg-accent-primary/20 border-accent-primary shadow-lg shadow-accent-primary/10'
                      : 'bg-surface-elevated/40 border-surface-border hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center gap-3 mb-2">
                    <img
                      src={agent.avatar}
                      alt={agent.name}
                      className="h-9 w-9 rounded-lg object-cover"
                    />
                    <div>
                      <div className="text-xs font-bold text-white">{agent.name}</div>
                      <div className="text-[10px] text-text-muted">{agent.category}</div>
                    </div>
                  </div>
                  <div className="flex items-center justify-between pt-2 border-t border-surface-border/60 text-xs">
                    <span className="text-text-muted font-mono">{agent.stats.verifiedSuccessRate}% pass</span>
                    <span className="text-near-green font-mono font-bold">{agent.startingPriceNear} Ⓝ</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* 2. Task Requirements */}
        <div className="p-6 rounded-2xl bg-surface-primary border border-surface-border space-y-4">
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <Code2 className="h-4 w-4 text-accent-secondary" />
            2. Task Requirements & Input
          </h2>

          <div className="space-y-3">
            <div>
              <label className="block text-xs font-semibold text-text-muted uppercase mb-1">
                Task Title
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={e => setTitle(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl bg-surface-elevated border border-surface-border text-sm text-white focus:outline-none focus:border-accent-primary"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-text-muted uppercase mb-1">
                Description & Constraints
              </label>
              <textarea
                rows={3}
                required
                value={description}
                onChange={e => setDescription(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl bg-surface-elevated border border-surface-border text-sm text-white focus:outline-none focus:border-accent-primary"
              />
            </div>
          </div>
        </div>

        {/* 3. Verification Policy & Test Suite */}
        <div className="p-6 rounded-2xl bg-surface-primary border border-surface-border space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-emerald-400" />
              3. Independent Verification Criteria
            </h2>
            <Badge variant="success">Deterministic VM Sandbox</Badge>
          </div>

          <p className="text-xs text-text-secondary leading-relaxed">
            The candidate deliverable must pass all test assertions before the smart contract will permit escrow payment release.
          </p>

          <div>
            <label className="block text-xs font-semibold text-text-muted uppercase mb-1">
              Unit Test Assertions (JavaScript / Vitest format)
            </label>
            <textarea
              rows={8}
              value={testSuite}
              onChange={e => setTestSuite(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl bg-surface-elevated border border-surface-border font-mono text-xs text-emerald-300 focus:outline-none focus:border-accent-primary leading-relaxed"
            />
          </div>
        </div>

        {/* 4. Delegation & Budget Guardrails */}
        <div className="p-6 rounded-2xl bg-surface-primary border border-surface-border space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <Layers className="h-4 w-4 text-indigo-400" />
              4. Agent-to-Agent Delegation Guardrails
            </h2>
            <Badge variant="default">AI Swarms</Badge>
          </div>

          <div className="flex items-start gap-3 p-4 rounded-xl bg-surface-elevated/50 border border-surface-border">
            <input
              type="checkbox"
              id="delegation"
              checked={enableDelegation}
              onChange={e => setEnableDelegation(e.target.checked)}
              className="mt-1 h-4 w-4 rounded border-surface-border text-accent-primary focus:ring-accent-primary"
            />
            <label htmlFor="delegation" className="text-xs text-text-secondary cursor-pointer">
              <strong className="text-white block mb-0.5">
                Permit subtask delegation to TestPilot Agent (Max 0.5 Ⓝ)
              </strong>
              Allows CodeFix to hire TestPilot as a subagent to synthesize automated boundary tests before final submission.
            </label>
          </div>
        </div>

        {/* Wallet Payer Information */}
        <div className="p-4 rounded-xl bg-surface-elevated/70 border border-surface-border flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="text-xs text-text-muted">Funding Account</div>
            {isConnected ? (
              <div className="flex items-center gap-2 mt-0.5">
                <div className="h-2 w-2 rounded-full bg-near-green animate-pulse" />
                <span className="text-sm font-mono font-bold text-white">{accountId}</span>
                <span className="text-xs font-mono text-near-green">({balanceFormatted} Ⓝ available)</span>
              </div>
            ) : (
              <div className="text-xs text-amber-400 mt-0.5">No wallet connected — Click to connect</div>
            )}
          </div>
          {!isConnected ? (
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => setIsModalOpen(true)}
              className="text-near-green border-near-green/40 hover:border-near-green"
            >
              Connect NEAR Wallet
            </Button>
          ) : (
            <button
              type="button"
              onClick={() => setIsModalOpen(true)}
              className="text-xs text-text-muted hover:text-white underline font-mono"
            >
              Switch Account
            </button>
          )}
        </div>

        {/* Summary & Submit */}
        <div className="p-6 rounded-2xl bg-gradient-to-r from-surface-primary to-surface-elevated border border-surface-border flex flex-col sm:flex-row items-center justify-between gap-6 shadow-2xl">
          <div>
            <div className="text-xs text-text-muted">Total Escrow Required</div>
            <div className="text-3xl font-bold font-mono text-near-green">
              {selectedAgent.startingPriceNear} Ⓝ
            </div>
            <div className="text-[11px] text-text-muted mt-1">
              Escrowed on <code className="text-slate-300">opentag4876.testnet</code>
            </div>
          </div>

          <Button
            type="submit"
            size="lg"
            variant="near"
            loading={loading}
            className="w-full sm:w-auto px-8 gap-2"
          >
            <Lock className="h-4 w-4" />
            Deposit Escrow & Start Execution →
          </Button>
        </div>
      </form>
    </div>
  );
}

export default function CreateJobPage() {
  return (
    <Suspense
      fallback={
        <div className="max-w-4xl mx-auto px-4 py-20 text-center text-text-muted">
          Loading job creation wizard...
        </div>
      }
    >
      <CreateJobForm />
    </Suspense>
  );
}
