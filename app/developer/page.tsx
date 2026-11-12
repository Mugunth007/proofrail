'use client';
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Terminal,
  Plus,
  Coins,
  Cpu,
  ShieldCheck,
  CheckCircle2,
  ExternalLink,
  Layers,
  Key,
} from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { GlowingCard } from '@/components/ui/GlowingEffect';
import type { AgentManifest } from '@/lib/types';

export default function DeveloperDashboardPage() {
  const [agents, setAgents] = useState<AgentManifest[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch('/api/agents');
        const data = await res.json();
        if (data.agents) setAgents(data.agents);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const totalEarned = agents.reduce((acc, a) => acc + (a.stats.totalEarnedNear || 0), 0);
  const totalCompleted = agents.reduce((acc, a) => acc + (a.stats.verifiedJobsCount || 0), 0);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-8 mb-8 border-b border-surface-border gap-4">
        <div>
          <Badge variant="near" className="mb-2">Agent Provider Hub</Badge>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">
            Developer & Provider Portal
          </h1>
          <p className="text-text-secondary text-sm mt-1">
            Register your autonomous agents, configure verification policies, and track NEAR testnet earnings.
          </p>
        </div>

        <Link href="/developer/agents/new">
          <Button variant="primary" className="gap-2">
            <Plus className="h-4 w-4" />
            Register Agent Manifest
          </Button>
        </Link>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-10">
        <div className="p-4 rounded-2xl bg-surface-primary border border-surface-border">
          <div className="text-xs text-text-muted font-medium">REGISTERED AGENTS</div>
          <div className="text-2xl font-bold font-mono text-white mt-1">{agents.length}</div>
        </div>
        <div className="p-4 rounded-2xl bg-surface-primary border border-surface-border">
          <div className="text-xs text-text-muted font-medium">VERIFIED DELIVERIES</div>
          <div className="text-2xl font-bold font-mono text-emerald-400 mt-1">{totalCompleted}</div>
        </div>
        <div className="p-4 rounded-2xl bg-surface-primary border border-surface-border">
          <div className="text-xs text-text-muted font-medium">TOTAL NEAR EARNED</div>
          <div className="text-2xl font-bold font-mono text-near-green mt-1">
            {totalEarned.toFixed(1)} Ⓝ
          </div>
        </div>
        <div className="p-4 rounded-2xl bg-surface-primary border border-surface-border">
          <div className="text-xs text-text-muted font-medium">ESCROW CONTRACT</div>
          <div className="text-xs font-mono text-accent-secondary mt-2 truncate">
            proofrail.testnet
          </div>
        </div>
      </div>

      {/* Registered Agents List */}
      <div className="space-y-6 mb-12">
        <h2 className="text-xl font-bold text-white">Your Registered AI Services</h2>

        {loading ? (
          <div className="text-center py-12 text-text-muted">Loading providers...</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {agents.map(agent => (
              <GlowingCard key={agent.id} className="flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-mono text-text-muted">{agent.category}</span>
                    <Badge variant="near">{agent.startingPriceNear} Ⓝ</Badge>
                  </div>

                  <div className="flex items-center gap-3 mb-3">
                    <img
                      src={agent.avatar}
                      alt={agent.name}
                      className="h-10 w-10 rounded-xl object-cover"
                    />
                    <div>
                      <h3 className="font-bold text-white text-base">{agent.name}</h3>
                      <div className="text-[11px] font-mono text-text-muted">
                        {agent.provider.walletAddress}
                      </div>
                    </div>
                  </div>

                  <p className="text-xs text-text-secondary line-clamp-2 mb-4 leading-relaxed">
                    {agent.description}
                  </p>
                </div>

                <div className="pt-4 border-t border-surface-border/60">
                  <div className="flex justify-between items-center text-xs mb-3">
                    <span className="text-text-muted">Completed Deliveries</span>
                    <span className="font-mono text-emerald-400 font-semibold">
                      {agent.stats.verifiedJobsCount} jobs
                    </span>
                  </div>

                  <Link href={`/agents/${agent.slug}`}>
                    <Button variant="secondary" size="sm" className="w-full">
                      View Public Profile
                    </Button>
                  </Link>
                </div>
              </GlowingCard>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
