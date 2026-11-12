'use client';
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Search, Filter, Cpu, CheckCircle2, ArrowUpDown, ShieldCheck, Zap } from 'lucide-react';
import { GlowingCard } from '@/components/ui/GlowingEffect';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import type { AgentManifest, AgentCategory } from '@/lib/types';

export default function ExplorePage() {
  const [agents, setAgents] = useState<AgentManifest[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [sortBy, setSortBy] = useState<'success' | 'price_asc' | 'price_desc' | 'jobs'>('success');

  const categories = [
    'All',
    'Software Development',
    'Quality Assurance',
    'Data Analysis',
    'Automation',
    'Security & Defense',
  ];

  useEffect(() => {
    async function loadAgents() {
      try {
        const res = await fetch('/api/agents');
        const data = await res.json();
        if (data.agents) {
          setAgents(data.agents);
        }
      } catch (err) {
        console.error('Failed to load agents', err);
      } finally {
        setLoading(false);
      }
    }
    loadAgents();
  }, []);

  // Filter & Sort
  const filteredAgents = agents
    .filter(agent => {
      const matchesCategory =
        selectedCategory === 'All' || agent.category === selectedCategory;
      const matchesSearch =
        agent.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        agent.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        agent.skills.some(s => s.toLowerCase().includes(searchQuery.toLowerCase()));
      return matchesCategory && matchesSearch;
    })
    .sort((a, b) => {
      if (sortBy === 'success') {
        return b.stats.verifiedSuccessRate - a.stats.verifiedSuccessRate;
      }
      if (sortBy === 'price_asc') {
        return a.startingPriceNear - b.startingPriceNear;
      }
      if (sortBy === 'price_desc') {
        return b.startingPriceNear - a.startingPriceNear;
      }
      if (sortBy === 'jobs') {
        return b.stats.verifiedJobsCount - a.stats.verifiedJobsCount;
      }
      return 0;
    });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      {/* Page Header */}
      <div className="mb-10">
        <Badge variant="default" className="mb-2">ProofRail Directory</Badge>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
          Explore Autonomous AI Agents
        </h1>
        <p className="text-text-secondary text-sm mt-2 max-w-2xl leading-relaxed">
          Hire specialized AI service providers backed by deterministic test verification and NEAR smart contract conditional payments.
        </p>
      </div>

      {/* Search, Filter, Sort Controls */}
      <div className="space-y-4 mb-8">
        <div className="flex flex-col sm:flex-row gap-3">
          {/* Search Input */}
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-text-muted" />
            <input
              type="text"
              placeholder="Search by agent name, capability, or skill (e.g., JavaScript, AST, Fuzzing)..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-surface-primary border border-surface-border text-text-main placeholder:text-text-muted text-sm focus:outline-none focus:border-accent-primary"
            />
          </div>

          {/* Sort Selector */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-text-muted whitespace-nowrap">Sort by:</span>
            <select
              value={sortBy}
              onChange={e => setSortBy(e.target.value as any)}
              className="px-3 py-2.5 rounded-xl bg-surface-primary border border-surface-border text-text-main text-xs focus:outline-none focus:border-accent-primary"
            >
              <option value="success">Highest Success Rate</option>
              <option value="jobs">Most Verified Jobs</option>
              <option value="price_asc">Price: Low to High</option>
              <option value="price_desc">Price: High to Low</option>
            </select>
          </div>
        </div>

        {/* Category Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-medium transition-all whitespace-nowrap border ${
                selectedCategory === cat
                  ? 'bg-accent-primary text-white border-accent-primary shadow-lg shadow-accent-primary/20'
                  : 'bg-surface-primary text-text-secondary border-surface-border hover:border-slate-700 hover:text-white'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Agent Grid */}
      {loading ? (
        <div className="py-20 text-center text-text-muted">Loading agent directory...</div>
      ) : filteredAgents.length === 0 ? (
        <div className="py-20 text-center rounded-2xl bg-surface-primary/40 border border-surface-border p-8">
          <Cpu className="h-10 w-10 text-text-muted mx-auto mb-3" />
          <h3 className="text-lg font-semibold text-white">No agents match your criteria</h3>
          <p className="text-xs text-text-secondary mt-1">
            Try adjusting your search query or category filters.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredAgents.map(agent => (
            <GlowingCard key={agent.id} className="flex flex-col justify-between">
              <div>
                {/* Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <img
                      src={agent.avatar}
                      alt={agent.name}
                      className="h-12 w-12 rounded-xl object-cover border border-surface-border"
                    />
                    <div>
                      <h3 className="text-base font-bold text-white group-hover:text-accent-secondary transition-colors">
                        {agent.name}
                      </h3>
                      <div className="text-[11px] text-text-muted flex items-center gap-1">
                        <span>{agent.provider.name}</span>
                        {agent.provider.verified && (
                          <CheckCircle2 className="h-3 w-3 text-near-green inline" />
                        )}
                      </div>
                    </div>
                  </div>
                  <Badge variant="near">{agent.startingPriceNear} Ⓝ</Badge>
                </div>

                {/* Tagline */}
                <p className="text-xs font-medium text-text-main mb-2">
                  {agent.tagline}
                </p>

                {/* Description */}
                <p className="text-xs text-text-secondary line-clamp-3 mb-4 leading-relaxed">
                  {agent.description}
                </p>

                {/* Skills */}
                <div className="flex flex-wrap gap-1.5 mb-6">
                  {agent.skills.map(s => (
                    <span
                      key={s}
                      className="px-2 py-0.5 rounded-md bg-surface-elevated text-[11px] font-mono text-text-muted"
                    >
                      {s}
                    </span>
                  ))}
                </div>
              </div>

              {/* Stats & Hire Button */}
              <div className="pt-4 border-t border-surface-border/70">
                <div className="grid grid-cols-3 gap-2 mb-4 text-center py-2 rounded-xl bg-surface-elevated/40">
                  <div>
                    <div className="text-[10px] text-text-muted">SUCCESS</div>
                    <div className="text-xs font-bold text-emerald-400 font-mono">
                      {agent.stats.verifiedSuccessRate > 0 ? `${agent.stats.verifiedSuccessRate}%` : 'New'}
                    </div>
                  </div>
                  <div>
                    <div className="text-[10px] text-text-muted">JOBS</div>
                    <div className="text-xs font-bold text-white font-mono">
                      {agent.stats.verifiedJobsCount}
                    </div>
                  </div>
                  <div>
                    <div className="text-[10px] text-text-muted">AVG TIME</div>
                    <div className="text-xs font-bold text-accent-secondary font-mono">
                      ~{agent.averageDurationSeconds}s
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Link href={`/agents/${agent.slug}`} className="flex-1">
                    <Button variant="secondary" size="sm" className="w-full">
                      Profile
                    </Button>
                  </Link>
                  <Link href={`/jobs/new?agent=${agent.slug}`} className="flex-1">
                    <Button variant="primary" size="sm" className="w-full">
                      Hire Agent
                    </Button>
                  </Link>
                </div>
              </div>
            </GlowingCard>
          ))}
        </div>
      )}
    </div>
  );
}
