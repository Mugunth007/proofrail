'use client';
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import {
  ShieldCheck,
  CheckCircle2,
  Clock,
  Coins,
  ArrowRight,
  Cpu,
  Layers,
  Terminal,
  ExternalLink,
  Award,
} from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Tabs } from '@/components/ui/Tabs';
import { GlowingCard } from '@/components/ui/GlowingEffect';
import type { AgentManifest, Job } from '@/lib/types';

export default function AgentProfilePage() {
  const params = useParams();
  const slug = params?.slug as string;

  const [agent, setAgent] = useState<AgentManifest | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadAgent() {
      try {
        const res = await fetch(`/api/agents/${slug}`);
        const data = await res.json();
        if (data.agent) {
          setAgent(data.agent);
        }
      } catch (err) {
        console.error('Failed to load agent profile', err);
      } finally {
        setLoading(false);
      }
    }
    if (slug) loadAgent();
  }, [slug]);

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-20 text-center text-text-muted">
        Loading agent profile...
      </div>
    );
  }

  if (!agent) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-20 text-center">
        <h2 className="text-xl font-bold text-white mb-2">Agent Not Found</h2>
        <p className="text-sm text-text-secondary mb-4">
          The requested agent "{slug}" does not exist in the ProofRail registry.
        </p>
        <Link href="/explore">
          <Button variant="primary">Return to Marketplace</Button>
        </Link>
      </div>
    );
  }

  const tabs = [
    {
      id: 'overview',
      label: 'Overview & Capabilities',
      content: (
        <div className="space-y-6">
          <div>
            <h3 className="text-base font-semibold text-white mb-2">About {agent.name}</h3>
            <p className="text-sm text-text-secondary leading-relaxed">
              {agent.description}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 rounded-xl bg-surface-primary border border-surface-border">
              <h4 className="text-xs font-semibold text-text-main uppercase tracking-wider mb-2">
                Supported Input Formats
              </h4>
              <ul className="space-y-1.5 text-xs text-text-secondary">
                {agent.capabilities.inputFormats.map(fmt => (
                  <li key={fmt} className="flex items-center gap-2">
                    <span className="h-1.5 w-1.5 rounded-full bg-accent-primary" />
                    <span>{fmt}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="p-4 rounded-xl bg-surface-primary border border-surface-border">
              <h4 className="text-xs font-semibold text-text-main uppercase tracking-wider mb-2">
                Expected Deliverable Outputs
              </h4>
              <ul className="space-y-1.5 text-xs text-text-secondary">
                {agent.capabilities.outputFormats.map(fmt => (
                  <li key={fmt} className="flex items-center gap-2">
                    <span className="h-1.5 w-1.5 rounded-full bg-near-green" />
                    <span>{fmt}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div>
            <h4 className="text-xs font-semibold text-text-main uppercase tracking-wider mb-3">
              Core Skills & Tools
            </h4>
            <div className="flex flex-wrap gap-2">
              {agent.skills.map(skill => (
                <span
                  key={skill}
                  className="px-3 py-1 rounded-lg bg-surface-primary border border-surface-border text-xs font-mono text-text-secondary"
                >
                  {skill}
                </span>
              ))}
            </div>
          </div>
        </div>
      ),
    },
    {
      id: 'services',
      label: 'Services & Pricing',
      content: (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {agent.pricing.map(pkg => (
            <div
              key={pkg.tier}
              className="p-6 rounded-2xl bg-surface-primary border border-surface-border flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-4">
                  <Badge variant="default">{pkg.tier} Service</Badge>
                  <div className="text-xl font-bold font-mono text-near-green">
                    {pkg.baseNear} Ⓝ
                  </div>
                </div>

                <ul className="space-y-2 mb-6 text-xs text-text-secondary">
                  {pkg.features.map(f => (
                    <li key={f} className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <Link href={`/jobs/new?agent=${agent.slug}&tier=${pkg.tier}`}>
                <Button variant="primary" className="w-full">
                  Hire at {pkg.baseNear} NEAR
                </Button>
              </Link>
            </div>
          ))}
        </div>
      ),
    },
    {
      id: 'performance',
      label: 'Verified Performance',
      content: (
        <div className="space-y-6">
          <div className="p-4 rounded-xl bg-surface-primary border border-surface-border">
            <h4 className="text-xs font-semibold text-text-main uppercase tracking-wider mb-2">
              Verification Policy Compliance
            </h4>
            <p className="text-xs text-text-secondary leading-relaxed mb-4">
              This provider’s deliverables are evaluated by independent, sandboxed test runners before smart contract funds are released.
            </p>
            <div className="flex items-center gap-3">
              <Badge variant="success">Deterministic Sandboxed VM</Badge>
              <Badge variant="near">Conditional Escrow Payouts</Badge>
              <Badge variant="outline">0 Auto-approvals</Badge>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="p-4 rounded-xl bg-surface-primary border border-surface-border text-center">
              <div className="text-[10px] text-text-muted">SUCCESS RATE</div>
              <div className="text-2xl font-bold text-emerald-400 font-mono mt-1">
                {agent.stats.verifiedSuccessRate}%
              </div>
            </div>
            <div className="p-4 rounded-xl bg-surface-primary border border-surface-border text-center">
              <div className="text-[10px] text-text-muted">TOTAL EARNED</div>
              <div className="text-2xl font-bold text-near-green font-mono mt-1">
                {agent.stats.totalEarnedNear} Ⓝ
              </div>
            </div>
            <div className="p-4 rounded-xl bg-surface-primary border border-surface-border text-center">
              <div className="text-[10px] text-text-muted">MEDIAN SPEED</div>
              <div className="text-2xl font-bold text-accent-secondary font-mono mt-1">
                {agent.stats.medianExecutionSeconds}s
              </div>
            </div>
            <div className="p-4 rounded-xl bg-surface-primary border border-surface-border text-center">
              <div className="text-[10px] text-text-muted">REFUND RATIO</div>
              <div className="text-2xl font-bold text-rose-400 font-mono mt-1">
                {agent.stats.refundRatio}%
              </div>
            </div>
          </div>
        </div>
      ),
    },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      {/* Top Profile Header */}
      <div className="flex flex-col md:flex-row items-start justify-between gap-6 pb-8 border-b border-surface-border mb-8">
        <div className="flex items-start gap-5">
          <img
            src={agent.avatar}
            alt={agent.name}
            className="h-20 w-20 sm:h-24 sm:w-24 rounded-2xl object-cover border-2 border-surface-border shadow-xl"
          />
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h1 className="text-2xl sm:text-3xl font-extrabold text-white">
                {agent.name}
              </h1>
              <Badge variant="near">v{agent.version}</Badge>
            </div>
            <p className="text-sm text-text-secondary max-w-xl mb-3">
              {agent.tagline}
            </p>
            <div className="flex items-center gap-3 text-xs text-text-muted">
              <span>Category: <strong className="text-text-main">{agent.category}</strong></span>
              <span>•</span>
              <span>Provider: <strong className="text-text-main">{agent.provider.name}</strong></span>
              <span>•</span>
              <a
                href={`https://testnet.nearblocks.io/address/${agent.provider.walletAddress}`}
                target="_blank"
                rel="noreferrer"
                className="text-near-green font-mono hover:underline inline-flex items-center gap-1"
              >
                {agent.provider.walletAddress} <ExternalLink className="h-3 w-3" />
              </a>
            </div>
          </div>
        </div>

        {/* Action card */}
        <div className="p-4 rounded-2xl bg-surface-primary border border-surface-border flex flex-row md:flex-col items-center justify-between gap-4 w-full md:w-64">
          <div>
            <div className="text-xs text-text-muted">Starting Escrow Price</div>
            <div className="text-2xl font-bold font-mono text-near-green">
              {agent.startingPriceNear} Ⓝ
            </div>
          </div>
          <Link href={`/jobs/new?agent=${agent.slug}`} className="w-full">
            <Button variant="primary" size="lg" className="w-full">
              Hire Agent →
            </Button>
          </Link>
        </div>
      </div>

      {/* Tabs */}
      <Tabs tabs={tabs} defaultTab="overview" />
    </div>
  );
}
