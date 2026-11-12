'use client';
import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import confetti from 'canvas-confetti';
import {
  ShieldCheck,
  Cpu,
  Coins,
  CheckCircle2,
  XCircle,
  Clock,
  ArrowRight,
  ExternalLink,
  Code2,
  FileCode,
  Lock,
  Layers,
  Sparkles,
  Terminal,
  Play,
  RotateCcw,
  Copy,
  Check,
  AlertCircle,
} from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { formatDate, truncateHash } from '@/lib/utils';
import type { Job, JobEvent, AgentManifest } from '@/lib/types';

export default function JobWorkspacePage() {
  const params = useParams();
  const id = params?.id as string;

  const [job, setJob] = useState<Job | null>(null);
  const [agent, setAgent] = useState<AgentManifest | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedHash, setCopiedHash] = useState(false);

  const eventEndRef = useRef<HTMLDivElement>(null);

  // Fetch Job details
  const fetchJob = async () => {
    try {
      const res = await fetch(`/api/jobs/${id}`);
      const data = await res.json();
      if (data.job) {
        setJob(data.job);
        if (data.agent) setAgent(data.agent);
      }
    } catch (err) {
      console.error('Failed to fetch job', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) fetchJob();
  }, [id]);

  // Connect to Server-Sent Events (SSE) for live streaming execution updates
  useEffect(() => {
    if (!id) return;
    const eventSource = new EventSource(`/api/jobs/${id}/stream`);

    eventSource.onmessage = event => {
      try {
        const payload = JSON.parse(event.data);
        if (payload.type === 'event' && payload.event) {
          setJob(prev => {
            if (!prev) return prev;
            // Append new event if not already present
            const exists = prev.events.some(e => e.id === payload.event.id);
            const events = exists ? prev.events : [...prev.events, payload.event];
            return {
              ...prev,
              state: payload.jobState || prev.state,
              events,
            };
          });
        }
      } catch (err) {
        console.error('SSE parse error', err);
      }
    };

    return () => {
      eventSource.close();
    };
  }, [id]);

  // Scroll to latest event
  useEffect(() => {
    eventEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [job?.events?.length]);

  // Trigger Execution
  const handleExecute = async () => {
    if (!job) return;
    setActionLoading(true);
    try {
      await fetch(`/api/jobs/${job.id}/execute`, { method: 'POST' });
      await fetchJob();
    } catch (err) {
      console.error(err);
    } finally {
      setActionLoading(false);
    }
  };

  // Trigger Independent Verification
  const handleVerify = async () => {
    if (!job) return;
    setActionLoading(true);
    try {
      await fetch(`/api/jobs/${job.id}/verify`, { method: 'POST' });
      await fetchJob();
    } catch (err) {
      console.error(err);
    } finally {
      setActionLoading(false);
    }
  };

  // Trigger Settlement (Payout or Refund)
  const handleSettle = async (action: 'payout' | 'refund') => {
    if (!job) return;
    setActionLoading(true);
    try {
      const res = await fetch(`/api/jobs/${job.id}/settle`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      });
      const data = await res.json();
      if (data.success && action === 'payout') {
        confetti({
          particleCount: 80,
          spread: 60,
          origin: { y: 0.6 },
        });
      }
      await fetchJob();
    } catch (err) {
      console.error(err);
    } finally {
      setActionLoading(false);
    }
  };

  const copyDeliverable = () => {
    if (!job?.artifact?.content) return;
    navigator.clipboard.writeText(job.artifact.content);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-20 text-center text-text-muted">
        Loading live job workspace...
      </div>
    );
  }

  if (!job) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-20 text-center">
        <h2 className="text-xl font-bold text-white mb-2">Job Not Found</h2>
        <Link href="/jobs">
          <Button variant="primary">Return to Jobs</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Workspace Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between pb-6 mb-8 border-b border-surface-border gap-4">
        <div>
          <div className="flex items-center gap-3 mb-1.5">
            <h1 className="text-2xl font-bold text-white">{job.title}</h1>
            <Badge state={job.state}>{job.state}</Badge>
          </div>
          <div className="flex flex-wrap items-center gap-3 text-xs text-text-muted font-mono">
            <span>ID: {job.id}</span>
            <span>•</span>
            <span>Buyer: {job.buyerWallet}</span>
            <span>•</span>
            <span>Created: {formatDate(job.createdAt)}</span>
          </div>
        </div>

        {/* Quick links to verification report & receipt */}
        <div className="flex items-center gap-2">
          {job.verificationReport && (
            <Link href={`/jobs/${job.id}/verification`}>
              <Button size="sm" variant="outline" className="gap-1.5 text-xs">
                <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" />
                Proof Report
              </Button>
            </Link>
          )}

          {job.state === 'PAID' && (
            <Link href={`/jobs/${job.id}/receipt`}>
              <Button size="sm" variant="outline" className="gap-1.5 text-xs text-near-green">
                <Coins className="h-3.5 w-3.5" />
                Onchain Receipt
              </Button>
            </Link>
          )}
        </div>
      </div>

      {/* 3-Column Desktop Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* LEFT PANEL (3 Cols): Task Specs & Escrow Details */}
        <div className="lg:col-span-3 space-y-6">
          {/* Agent Card */}
          <div className="p-5 rounded-2xl bg-surface-primary border border-surface-border">
            <h3 className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-3">
              Assigned AI Agent
            </h3>
            {agent ? (
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <img
                    src={agent.avatar}
                    alt={agent.name}
                    className="h-10 w-10 rounded-xl object-cover border border-surface-border"
                  />
                  <div>
                    <div className="text-sm font-bold text-white">{agent.name}</div>
                    <div className="text-[11px] text-text-muted">{agent.provider.name}</div>
                  </div>
                </div>
                <div className="text-xs text-text-secondary leading-relaxed">
                  {agent.tagline}
                </div>
                <div className="pt-2 border-t border-surface-border/60 flex items-center justify-between text-xs">
                  <span className="text-text-muted">Pass Rate</span>
                  <span className="font-mono text-emerald-400 font-semibold">
                    {agent.stats.verifiedSuccessRate}%
                  </span>
                </div>
              </div>
            ) : (
              <div className="text-xs text-text-muted">Agent details loading...</div>
            )}
          </div>

          {/* Budget & Policy */}
          <div className="p-5 rounded-2xl bg-surface-primary border border-surface-border space-y-4">
            <div>
              <div className="text-xs text-text-muted font-medium">ESCROW BUDGET</div>
              <div className="text-2xl font-bold font-mono text-near-green mt-0.5">
                {job.priceNear} Ⓝ
              </div>
              <div className="text-[10px] font-mono text-text-muted mt-1 truncate">
                {job.priceYocto} yoctoNEAR
              </div>
            </div>

            <div className="pt-3 border-t border-surface-border/60">
              <div className="text-xs text-text-muted font-medium mb-1">
                VERIFICATION POLICY
              </div>
              <Badge variant="success" className="text-[11px] mb-2">
                {job.verificationPolicy.type}
              </Badge>
              <div className="text-[10px] font-mono text-text-muted break-all">
                Policy Hash: {job.verificationPolicy.policyHash.slice(0, 24)}...
              </div>
            </div>

            {/* Delegation Info */}
            {job.delegation && (
              <div className="pt-3 border-t border-surface-border/60">
                <div className="text-xs text-text-muted font-medium mb-1 flex items-center gap-1.5">
                  <Layers className="h-3 w-3 text-indigo-400" />
                  DELEGATED SUBTASK
                </div>
                <div className="text-xs text-indigo-300 font-medium">
                  {job.delegation.subtaskTitle}
                </div>
                <div className="text-[11px] font-mono text-near-green mt-0.5">
                  Sub-budget: {job.delegation.allocatedBudgetNear} Ⓝ
                </div>
              </div>
            )}
          </div>

          {/* Task Specs */}
          <div className="p-5 rounded-2xl bg-surface-primary border border-surface-border">
            <h3 className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-2">
              Task Specification
            </h3>
            <p className="text-xs text-text-secondary leading-relaxed">
              {job.description}
            </p>
          </div>
        </div>

        {/* CENTER PANEL (6 Cols): Live Execution Timeline & Deliverable */}
        <div className="lg:col-span-6 space-y-6">
          {/* Execution Timeline Card */}
          <div className="p-6 rounded-2xl bg-surface-primary border border-surface-border">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-surface-border">
              <div className="flex items-center gap-2">
                <Terminal className="h-4 w-4 text-accent-secondary" />
                <h3 className="text-sm font-bold text-white">Live Execution Stream</h3>
              </div>
              <div className="flex items-center gap-1.5 text-[11px] text-text-muted font-mono">
                <span className="h-2 w-2 rounded-full bg-near-green animate-pulse" />
                <span>SSE Connected</span>
              </div>
            </div>

            {/* Event Timeline List */}
            <div className="space-y-4 max-h-[360px] overflow-y-auto pr-1">
              {job.events.map((evt, idx) => (
                <div key={evt.id || idx} className="flex items-start gap-3 text-xs">
                  <div className="mt-0.5 h-5 w-5 rounded-full bg-surface-elevated border border-surface-border flex items-center justify-center font-mono text-[10px] text-accent-secondary shrink-0">
                    {evt.step}
                  </div>
                  <div className="flex-1 bg-surface-elevated/40 p-3 rounded-xl border border-surface-border/60">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-semibold text-text-main">{evt.title}</span>
                      <span className="text-[10px] text-text-muted font-mono">
                        {formatDate(evt.timestamp)}
                      </span>
                    </div>
                    <p className="text-text-secondary leading-relaxed">{evt.message}</p>
                    {evt.details && (
                      <div className="mt-2 pt-2 border-t border-surface-border/40 font-mono text-[11px] text-text-muted">
                        {evt.details.txHash && (
                          <div className="truncate text-near-green">
                            Tx: {evt.details.txHash}
                          </div>
                        )}
                        {evt.details.artifactDigest && (
                          <div className="truncate text-accent-secondary">
                            Digest: {evt.details.artifactDigest}
                          </div>
                        )}
                        {evt.details.toolResult && (
                          <div className="text-indigo-300">
                            Result: {evt.details.toolResult}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              ))}
              <div ref={eventEndRef} />
            </div>
          </div>

          {/* Candidate Deliverable Artifact */}
          {job.artifact && (
            <div className="p-6 rounded-2xl bg-surface-primary border border-surface-border">
              <div className="flex items-center justify-between mb-3 pb-3 border-b border-surface-border">
                <div className="flex items-center gap-2">
                  <FileCode className="h-4 w-4 text-emerald-400" />
                  <span className="text-sm font-bold text-white">
                    Delivered Artifact: {job.artifact.filename}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={copyDeliverable}
                    className="flex items-center gap-1 text-xs text-text-muted hover:text-white px-2 py-1 rounded bg-surface-elevated"
                  >
                    {copiedCode ? <Check className="h-3 w-3 text-near-green" /> : <Copy className="h-3 w-3" />}
                    <span>{copiedCode ? 'Copied' : 'Copy'}</span>
                  </button>
                </div>
              </div>

              <pre className="p-4 rounded-xl bg-background border border-surface-border text-xs font-mono text-emerald-300 overflow-x-auto max-h-[300px] leading-relaxed">
                <code>{job.artifact.content}</code>
              </pre>

              <div className="mt-3 text-[11px] font-mono text-text-muted flex items-center justify-between">
                <span>SHA-256: {job.artifact.sha256Digest.slice(0, 32)}...</span>
                <span>Submitted: {formatDate(job.artifact.submittedAt)}</span>
              </div>
            </div>
          )}
        </div>

        {/* RIGHT PANEL (3 Cols): NEAR Escrow, Verifier Sandbox & Actions */}
        <div className="lg:col-span-3 space-y-6">
          {/* Action Control Panel */}
          <div className="p-5 rounded-2xl bg-surface-primary border border-surface-border space-y-3">
            <h3 className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-2">
              State Machine Controls
            </h3>

            {/* Step 1: Run AI Agent */}
            {(job.state === 'ASSIGNED' || job.state === 'FUNDED') && (
              <Button
                variant="primary"
                className="w-full gap-2"
                loading={actionLoading}
                onClick={handleExecute}
              >
                <Play className="h-4 w-4" />
                Dispatch AI Agent Worker
              </Button>
            )}

            {/* Step 2: Run Verification */}
            {job.state === 'SUBMITTED' && (
              <Button
                variant="primary"
                className="w-full gap-2 bg-amber-600 hover:bg-amber-500"
                loading={actionLoading}
                onClick={handleVerify}
              >
                <ShieldCheck className="h-4 w-4" />
                Run Independent Verifier
              </Button>
            )}

            {/* Step 3: Payout */}
            {(job.state === 'PASSED' || job.state === 'SETTLEMENT_PENDING') && (
              <Button
                variant="near"
                className="w-full gap-2"
                loading={actionLoading}
                onClick={() => handleSettle('payout')}
              >
                <Coins className="h-4 w-4" />
                Release NEAR Payout to Agent
              </Button>
            )}

            {/* Step 4: Refund */}
            {(job.state === 'FAILED' || job.state === 'REFUND_ELIGIBLE') && (
              <Button
                variant="danger"
                className="w-full gap-2"
                loading={actionLoading}
                onClick={() => handleSettle('refund')}
              >
                <RotateCcw className="h-4 w-4" />
                Claim Full Escrow Refund
              </Button>
            )}

            {job.state === 'PAID' && (
              <div className="p-3 rounded-xl bg-emerald-950/60 border border-emerald-800/80 text-emerald-300 text-xs text-center font-medium">
                ✓ Payout settled on NEAR Testnet
              </div>
            )}

            {job.state === 'REFUNDED' && (
              <div className="p-3 rounded-xl bg-rose-950/60 border border-rose-800/80 text-rose-300 text-xs text-center font-medium">
                ↺ Escrow refunded to {job.buyerWallet}
              </div>
            )}
          </div>

          {/* Test Runner & Sandbox Log */}
          {job.verificationReport && (
            <div className="p-5 rounded-2xl bg-surface-primary border border-surface-border space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-semibold text-text-muted uppercase tracking-wider">
                  Test Sandbox Output
                </h3>
                {job.verificationReport.passed ? (
                  <Badge variant="success">PASS</Badge>
                ) : (
                  <Badge variant="error">FAIL</Badge>
                )}
              </div>

              <div className="p-3 rounded-xl bg-background border border-surface-border text-[11px] font-mono text-slate-300 leading-snug max-h-48 overflow-y-auto whitespace-pre-wrap">
                {job.verificationReport.testOutput}
              </div>

              <div className="text-[10px] font-mono text-text-muted space-y-1 pt-1 border-t border-surface-border/60">
                <div className="truncate">
                  Evidence: {job.verificationReport.evidenceDigest.slice(0, 24)}...
                </div>
                <div className="truncate text-emerald-400">
                  Sig: {job.verificationReport.attestationSignature.slice(0, 24)}...
                </div>
              </div>
            </div>
          )}

          {/* NEAR Onchain Transactions */}
          <div className="p-5 rounded-2xl bg-surface-primary border border-surface-border space-y-3">
            <h3 className="text-xs font-semibold text-text-muted uppercase tracking-wider">
              NEAR Testnet Transactions
            </h3>

            {job.transactions.length === 0 ? (
              <div className="text-xs text-text-muted">No transactions recorded yet.</div>
            ) : (
              <div className="space-y-2">
                {job.transactions.map(tx => (
                  <div
                    key={tx.id}
                    className="p-2.5 rounded-xl bg-surface-elevated/40 border border-surface-border text-xs"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-semibold text-white">{tx.type}</span>
                      <span className="font-mono text-near-green font-bold">
                        {tx.amountNear} Ⓝ
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-[10px] font-mono text-text-muted">
                      <span>Block #{tx.blockHeight}</span>
                      <a
                        href={tx.explorerUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="text-near-green hover:underline flex items-center gap-1"
                      >
                        NearBlocks <ExternalLink className="h-2.5 w-2.5" />
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
