'use client';
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import {
  ShieldCheck,
  CheckCircle2,
  XCircle,
  ArrowLeft,
  FileCode,
  Lock,
  Copy,
  Check,
  ExternalLink,
} from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { formatDate } from '@/lib/utils';
import type { Job } from '@/lib/types';

export default function VerificationReportPage() {
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
    return <div className="py-20 text-center text-text-muted">Loading verification report...</div>;
  }

  if (!job || !job.verificationReport) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20 text-center">
        <h2 className="text-xl font-bold text-white mb-2">No Verification Report Found</h2>
        <p className="text-sm text-text-secondary mb-4">
          This task has not yet undergone independent verification.
        </p>
        <Link href={`/jobs/${id}`}>
          <Button variant="primary">Return to Workspace</Button>
        </Link>
      </div>
    );
  }

  const report = job.verificationReport;

  const copyAttestation = () => {
    navigator.clipboard.writeText(JSON.stringify(report, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <Link
        href={`/jobs/${job.id}`}
        className="inline-flex items-center gap-1.5 text-xs text-text-muted hover:text-white mb-6 font-mono"
      >
        <ArrowLeft className="h-3 w-3" />
        Back to Job Workspace
      </Link>

      {/* Header */}
      <div className="flex items-start justify-between pb-6 mb-8 border-b border-surface-border gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Badge variant="success">Attestation Authority: {report.verifierId}</Badge>
            <span className="text-xs font-mono text-text-muted">
              {formatDate(report.timestamp)}
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white">
            Independent Verification Attestation
          </h1>
          <p className="text-xs text-text-secondary font-mono mt-1">
            Target Task: {job.title} ({job.id})
          </p>
        </div>

        <button
          onClick={copyAttestation}
          className="flex items-center gap-1 text-xs text-text-secondary hover:text-white px-3 py-1.5 rounded-xl bg-surface-primary border border-surface-border"
        >
          {copied ? <Check className="h-3.5 w-3.5 text-near-green" /> : <Copy className="h-3.5 w-3.5" />}
          <span>{copied ? 'Copied JSON' : 'Export Proof JSON'}</span>
        </button>
      </div>

      {/* Proof Highlights */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
        <div className="p-4 rounded-xl bg-surface-primary border border-surface-border text-center">
          <div className="text-[10px] text-text-muted">VERDICT</div>
          <div className="text-xl font-bold font-mono text-emerald-400 mt-1 flex items-center justify-center gap-1">
            {report.passed ? (
              <>
                <CheckCircle2 className="h-5 w-5" /> PASSED
              </>
            ) : (
              <>
                <XCircle className="h-5 w-5 text-rose-400" /> FAILED
              </>
            )}
          </div>
        </div>

        <div className="p-4 rounded-xl bg-surface-primary border border-surface-border text-center">
          <div className="text-[10px] text-text-muted">SCORE</div>
          <div className="text-xl font-bold font-mono text-white mt-1">
            {report.score}/100
          </div>
        </div>

        <div className="p-4 rounded-xl bg-surface-primary border border-surface-border text-center">
          <div className="text-[10px] text-text-muted">TESTS EVALUATED</div>
          <div className="text-xl font-bold font-mono text-accent-secondary mt-1">
            {report.passedTests} / {report.totalTests}
          </div>
        </div>

        <div className="p-4 rounded-xl bg-surface-primary border border-surface-border text-center">
          <div className="text-[10px] text-text-muted">EXECUTION DURATION</div>
          <div className="text-xl font-bold font-mono text-near-green mt-1">
            {report.executionDurationMs}ms
          </div>
        </div>
      </div>

      {/* Raw Sandboxed Test Output */}
      <div className="p-6 rounded-2xl bg-surface-primary border border-surface-border mb-8 space-y-3">
        <h3 className="text-xs font-semibold text-text-muted uppercase tracking-wider">
          Sandboxed Test Runner Console Output
        </h3>
        <pre className="p-4 rounded-xl bg-background border border-surface-border font-mono text-xs text-emerald-300 leading-relaxed overflow-x-auto whitespace-pre-wrap">
          {report.testOutput}
        </pre>
      </div>

      {/* Cryptographic Hashes & Signatures */}
      <div className="p-6 rounded-2xl bg-surface-primary border border-surface-border space-y-4">
        <h3 className="text-xs font-semibold text-text-muted uppercase tracking-wider">
          Cryptographic Integrity & Evidence Bundle
        </h3>

        <div className="space-y-3 text-xs font-mono">
          <div className="p-3 rounded-xl bg-surface-elevated/40 border border-surface-border">
            <div className="text-text-muted text-[10px] uppercase mb-0.5">Canonical Evidence Digest (SHA-256)</div>
            <div className="text-near-green font-bold break-all">{report.evidenceDigest}</div>
          </div>

          <div className="p-3 rounded-xl bg-surface-elevated/40 border border-surface-border">
            <div className="text-text-muted text-[10px] uppercase mb-0.5">Artifact Content Hash (SHA-256)</div>
            <div className="text-accent-secondary break-all">{report.artifactDigest}</div>
          </div>

          <div className="p-3 rounded-xl bg-surface-elevated/40 border border-surface-border">
            <div className="text-text-muted text-[10px] uppercase mb-0.5">Policy Hash (SHA-256)</div>
            <div className="text-white break-all">{report.policyHash}</div>
          </div>

          <div className="p-3 rounded-xl bg-surface-elevated/40 border border-surface-border">
            <div className="text-text-muted text-[10px] uppercase mb-0.5">Verifier Attestation Signature</div>
            <div className="text-amber-300 break-all">{report.attestationSignature}</div>
          </div>
        </div>
      </div>
    </div>
  );
}
