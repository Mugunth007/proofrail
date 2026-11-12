'use client';
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import {
  Coins,
  ArrowLeft,
  CheckCircle2,
  ExternalLink,
  ShieldCheck,
  Receipt,
  Copy,
  Check,
} from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { formatDate } from '@/lib/utils';
import type { Job, ChainTransaction } from '@/lib/types';

export default function ReceiptPage() {
  const params = useParams();
  const id = params?.id as string;

  const [job, setJob] = useState<Job | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(`/api/jobs/${id}`);
        const data = await res.json();
        if (data.job) setJob(data.job);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    if (id) load();
  }, [id]);

  if (loading) {
    return <div className="py-20 text-center text-text-muted">Loading receipt...</div>;
  }

  const payoutTx = job?.transactions.find(t => t.type === 'SETTLEMENT_PAYOUT');

  if (!job || !payoutTx) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-20 text-center">
        <h2 className="text-xl font-bold text-white mb-2">Receipt Not Available</h2>
        <p className="text-sm text-text-secondary mb-4">
          This task has not yet been settled onchain.
        </p>
        <Link href={`/jobs/${id}`}>
          <Button variant="primary">Return to Workspace</Button>
        </Link>
      </div>
    );
  }

  const copyTxHash = () => {
    navigator.clipboard.writeText(payoutTx.transactionHash);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <Link
        href={`/jobs/${job.id}`}
        className="inline-flex items-center gap-1.5 text-xs text-text-muted hover:text-white mb-6 font-mono"
      >
        <ArrowLeft className="h-3 w-3" />
        Back to Job Workspace
      </Link>

      <div className="p-8 rounded-3xl bg-surface-primary border border-surface-border shadow-2xl relative overflow-hidden">
        {/* Receipt Header */}
        <div className="text-center pb-8 border-b border-surface-border/60">
          <div className="h-16 w-16 rounded-2xl bg-gradient-to-tr from-emerald-500/20 to-near-green/20 border border-emerald-500/40 flex items-center justify-center mx-auto mb-4 text-near-green shadow-xl">
            <CheckCircle2 className="h-8 w-8 text-emerald-400" />
          </div>
          <Badge variant="near" className="mb-2">NEAR Testnet Escrow Settlement</Badge>
          <h1 className="text-2xl font-extrabold text-white">Payment Receipt</h1>
          <p className="text-xs text-text-muted font-mono mt-1">
            Confirmed at {formatDate(payoutTx.timestamp)}
          </p>
        </div>

        {/* Amount Banner */}
        <div className="py-8 text-center border-b border-surface-border/60">
          <div className="text-xs text-text-muted font-semibold uppercase">Total Settled</div>
          <div className="text-4xl sm:text-5xl font-extrabold font-mono text-near-green mt-1">
            {payoutTx.amountNear} Ⓝ
          </div>
          <div className="text-xs font-mono text-text-muted mt-1">
            {payoutTx.amountYocto} yoctoNEAR
          </div>
        </div>

        {/* Transaction Details Table */}
        <div className="py-6 space-y-4 text-xs font-mono border-b border-surface-border/60">
          <div className="flex justify-between items-center">
            <span className="text-text-muted">Job ID</span>
            <span className="text-white font-semibold">{job.id}</span>
          </div>

          <div className="flex justify-between items-center">
            <span className="text-text-muted">Escrow Smart Contract</span>
            <span className="text-accent-secondary">{payoutTx.fromAccount}</span>
          </div>

          <div className="flex justify-between items-center">
            <span className="text-text-muted">Recipient Provider</span>
            <span className="text-emerald-400">{payoutTx.toAccount}</span>
          </div>

          <div className="flex justify-between items-center">
            <span className="text-text-muted">Block Height</span>
            <span className="text-white font-semibold">#{payoutTx.blockHeight}</span>
          </div>

          <div className="flex flex-col gap-1 pt-2">
            <span className="text-text-muted">Transaction Hash</span>
            <div className="flex items-center justify-between p-2.5 rounded-xl bg-background border border-surface-border break-all">
              <span className="text-near-green text-[11px] truncate pr-2">
                {payoutTx.transactionHash}
              </span>
              <button
                onClick={copyTxHash}
                className="text-text-muted hover:text-white shrink-0 ml-2"
              >
                {copied ? <Check className="h-3.5 w-3.5 text-near-green" /> : <Copy className="h-3.5 w-3.5" />}
              </button>
            </div>
          </div>
        </div>

        {/* Explorer CTA */}
        <div className="pt-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="text-[11px] text-text-muted">
            Independent proof attested by <code className="text-slate-300">verifier.proofrail.testnet</code>
          </div>

          <a
            href={payoutTx.explorerUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full sm:w-auto"
          >
            <Button variant="near" size="sm" className="w-full gap-1.5">
              Verify on NearBlocks <ExternalLink className="h-3.5 w-3.5" />
            </Button>
          </a>
        </div>
      </div>
    </div>
  );
}
