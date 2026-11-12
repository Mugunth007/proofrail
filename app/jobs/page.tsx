'use client';
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Briefcase,
  Plus,
  ArrowRight,
  ExternalLink,
  ShieldCheck,
  CheckCircle2,
  XCircle,
  Clock,
} from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { formatDate, formatNear } from '@/lib/utils';
import type { Job } from '@/lib/types';

export default function JobsDashboardPage() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  useEffect(() => {
    async function loadJobs() {
      try {
        const res = await fetch('/api/jobs');
        const data = await res.json();
        if (data.jobs) {
          setJobs(data.jobs);
        }
      } catch (err) {
        console.error('Failed to load jobs', err);
      } finally {
        setLoading(false);
      }
    }
    loadJobs();
  }, []);

  const totalJobs = jobs.length;
  const runningJobs = jobs.filter(j => ['FUNDED', 'ASSIGNED', 'RUNNING', 'SUBMITTED', 'VERIFYING'].includes(j.state)).length;
  const completedJobs = jobs.filter(j => j.state === 'PAID').length;
  const refundedJobs = jobs.filter(j => j.state === 'REFUNDED').length;
  const totalNearSpent = jobs
    .filter(j => j.state === 'PAID')
    .reduce((sum, j) => sum + j.priceNear, 0);

  const filteredJobs = jobs.filter(j => {
    if (statusFilter === 'ALL') return true;
    if (statusFilter === 'ACTIVE') {
      return ['FUNDED', 'ASSIGNED', 'RUNNING', 'SUBMITTED', 'VERIFYING'].includes(j.state);
    }
    if (statusFilter === 'COMPLETED') return j.state === 'PAID';
    if (statusFilter === 'REFUNDED') return j.state === 'REFUNDED';
    return true;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-8 mb-8 border-b border-surface-border gap-4">
        <div>
          <Badge variant="default" className="mb-2">Customer Workspace</Badge>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">
            My Autonomous Jobs
          </h1>
          <p className="text-text-secondary text-sm mt-1">
            Track live agent execution, inspect test verification proofs, and monitor NEAR escrow settlements.
          </p>
        </div>

        <Link href="/jobs/new">
          <Button variant="primary" className="gap-2">
            <Plus className="h-4 w-4" />
            Create & Fund New Job
          </Button>
        </Link>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
        <div className="p-4 rounded-2xl bg-surface-primary border border-surface-border">
          <div className="text-xs text-text-muted font-medium">TOTAL JOBS</div>
          <div className="text-2xl font-bold font-mono text-white mt-1">{totalJobs}</div>
        </div>
        <div className="p-4 rounded-2xl bg-surface-primary border border-surface-border">
          <div className="text-xs text-text-muted font-medium">ACTIVE / RUNNING</div>
          <div className="text-2xl font-bold font-mono text-cyan-400 mt-1">{runningJobs}</div>
        </div>
        <div className="p-4 rounded-2xl bg-surface-primary border border-surface-border">
          <div className="text-xs text-text-muted font-medium">VERIFIED & PAID</div>
          <div className="text-2xl font-bold font-mono text-emerald-400 mt-1">{completedJobs}</div>
        </div>
        <div className="p-4 rounded-2xl bg-surface-primary border border-surface-border">
          <div className="text-xs text-text-muted font-medium">ONCHAIN SETTLED</div>
          <div className="text-2xl font-bold font-mono text-near-green mt-1">
            {totalNearSpent.toFixed(1)} Ⓝ
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 mb-6">
        {['ALL', 'ACTIVE', 'COMPLETED', 'REFUNDED'].map(f => (
          <button
            key={f}
            onClick={() => setStatusFilter(f)}
            className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-colors border ${
              statusFilter === f
                ? 'bg-accent-primary text-white border-accent-primary'
                : 'bg-surface-primary text-text-secondary border-surface-border hover:text-white'
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      {/* Jobs Table */}
      {loading ? (
        <div className="py-20 text-center text-text-muted">Loading your jobs...</div>
      ) : filteredJobs.length === 0 ? (
        <div className="py-20 text-center rounded-2xl bg-surface-primary/40 border border-surface-border p-8">
          <Briefcase className="h-10 w-10 text-text-muted mx-auto mb-3" />
          <h3 className="text-base font-semibold text-white">No jobs found in this view</h3>
          <p className="text-xs text-text-secondary mt-1 mb-4">
            Post your first AI task and test proof-of-outcome verification on NEAR.
          </p>
          <Link href="/jobs/new">
            <Button variant="primary" size="sm">
              Post Task →
            </Button>
          </Link>
        </div>
      ) : (
        <div className="rounded-2xl border border-surface-border bg-surface-primary/60 overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-surface-elevated/80 border-b border-surface-border text-xs text-text-muted font-semibold uppercase tracking-wider">
                <tr>
                  <th className="py-3.5 px-4">Job Title & ID</th>
                  <th className="py-3.5 px-4">State</th>
                  <th className="py-3.5 px-4">Escrow (NEAR)</th>
                  <th className="py-3.5 px-4">Verification</th>
                  <th className="py-3.5 px-4">Created</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-border/60">
                {filteredJobs.map(job => (
                  <tr key={job.id} className="hover:bg-surface-elevated/40 transition-colors">
                    <td className="py-4 px-4">
                      <Link
                        href={`/jobs/${job.id}`}
                        className="font-semibold text-white hover:text-accent-secondary transition-colors block"
                      >
                        {job.title}
                      </Link>
                      <span className="text-xs font-mono text-text-muted">
                        {job.id}
                      </span>
                    </td>
                    <td className="py-4 px-4">
                      <Badge state={job.state}>{job.state}</Badge>
                    </td>
                    <td className="py-4 px-4 font-mono font-semibold text-near-green">
                      {job.priceNear} Ⓝ
                    </td>
                    <td className="py-4 px-4">
                      {job.verificationReport ? (
                        <div className="flex items-center gap-1.5">
                          {job.verificationReport.passed ? (
                            <>
                              <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                              <span className="text-xs text-emerald-300 font-mono">
                                100% Passed ({job.verificationReport.passedTests} tests)
                              </span>
                            </>
                          ) : (
                            <>
                              <XCircle className="h-4 w-4 text-rose-400" />
                              <span className="text-xs text-rose-300 font-mono">
                                Failed ({job.verificationReport.failedTests} failed)
                              </span>
                            </>
                          )}
                        </div>
                      ) : (
                        <span className="text-xs text-text-muted flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          Pending verification
                        </span>
                      )}
                    </td>
                    <td className="py-4 px-4 text-xs text-text-muted whitespace-nowrap">
                      {formatDate(job.createdAt)}
                    </td>
                    <td className="py-4 px-4 text-right">
                      <Link href={`/jobs/${job.id}`}>
                        <Button size="sm" variant="secondary" className="gap-1">
                          Workspace <ArrowRight className="h-3 w-3" />
                        </Button>
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
