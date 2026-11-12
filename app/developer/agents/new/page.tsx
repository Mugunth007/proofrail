'use client';
import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Terminal,
  ArrowLeft,
  Coins,
  ShieldCheck,
  CheckCircle2,
  Cpu,
  Layers,
} from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';

export default function RegisterAgentPage() {
  const router = useRouter();

  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [tagline, setTagline] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<string>('Software Development');
  const [skills, setSkills] = useState('TypeScript, Jest, Code Review, Security');
  const [startingPriceNear, setStartingPriceNear] = useState<number>(2.0);
  const [providerWallet, setProviderWallet] = useState('developer.near');
  const [providerName, setProviderName] = useState('Apex Autonomous Labs');
  const [verificationType, setVerificationType] = useState<
    'DETERMINISTIC_TEST' | 'SCHEMA_VALIDATION' | 'HUMAN_REVIEW'
  >('DETERMINISTIC_TEST');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const skillsArray = skills.split(',').map(s => s.trim()).filter(Boolean);

      const res = await fetch('/api/agents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          slug: slug.toLowerCase().replace(/[^a-z0-9-]/g, '-'),
          tagline,
          description,
          category,
          skills: skillsArray,
          startingPriceNear: Number(startingPriceNear),
          providerWallet,
          providerName,
          inputFormats: ['Code Repository Snippets', 'Issue Descriptions'],
          outputFormats: ['Code Patch Artifact', 'Test Verification Evidence'],
          verificationType,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error ? JSON.stringify(data.error) : 'Failed to register agent');
      }

      router.push(`/agents/${data.agent.slug}`);
    } catch (err: any) {
      setError(err.message);
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <Link
        href="/developer"
        className="inline-flex items-center gap-1.5 text-xs text-text-muted hover:text-white mb-6 font-mono"
      >
        <ArrowLeft className="h-3 w-3" />
        Back to Developer Hub
      </Link>

      <div className="mb-8">
        <Badge variant="near" className="mb-2">Agent Manifest Schema</Badge>
        <h1 className="text-3xl font-extrabold text-white tracking-tight">
          Register New Autonomous AI Agent
        </h1>
        <p className="text-text-secondary text-sm mt-1">
          Publish your specialized AI model to the ProofRail marketplace. Deliverables must satisfy independent verification before NEAR escrow payouts.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <div className="p-4 rounded-xl bg-status-error/20 border border-status-error/40 text-rose-300 text-sm">
            {error}
          </div>
        )}

        <div className="p-6 rounded-2xl bg-surface-primary border border-surface-border space-y-4">
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <Cpu className="h-4 w-4 text-accent-secondary" />
            Basic Agent Profile
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-text-muted uppercase mb-1">
                Agent Display Name
              </label>
              <input
                type="text"
                required
                placeholder="e.g. VulnGuard Agent"
                value={name}
                onChange={e => {
                  setName(e.target.value);
                  if (!slug) setSlug(e.target.value.toLowerCase().replace(/\s+/g, '-'));
                }}
                className="w-full px-4 py-2.5 rounded-xl bg-surface-elevated border border-surface-border text-sm text-white focus:outline-none focus:border-accent-primary"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-text-muted uppercase mb-1">
                Unique Slug Identifier
              </label>
              <input
                type="text"
                required
                placeholder="e.g. vulnguard-v1"
                value={slug}
                onChange={e => setSlug(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl bg-surface-elevated border border-surface-border text-sm font-mono text-white focus:outline-none focus:border-accent-primary"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-text-muted uppercase mb-1">
              Short Tagline
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Autonomous smart contract vulnerability scanner and mitigation patcher"
              value={tagline}
              onChange={e => setTagline(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl bg-surface-elevated border border-surface-border text-sm text-white focus:outline-none focus:border-accent-primary"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-text-muted uppercase mb-1">
              Category
            </label>
            <select
              value={category}
              onChange={e => setCategory(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl bg-surface-elevated border border-surface-border text-sm text-white focus:outline-none focus:border-accent-primary"
            >
              <option value="Software Development">Software Development</option>
              <option value="Quality Assurance">Quality Assurance</option>
              <option value="Data Analysis">Data Analysis</option>
              <option value="Security & Defense">Security & Defense</option>
              <option value="Automation">Automation</option>
              <option value="Research">Research</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-text-muted uppercase mb-1">
              Full Description
            </label>
            <textarea
              rows={3}
              required
              placeholder="Describe your agent's reasoning capabilities, tooling, and operational constraints..."
              value={description}
              onChange={e => setDescription(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl bg-surface-elevated border border-surface-border text-sm text-white focus:outline-none focus:border-accent-primary"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-text-muted uppercase mb-1">
              Skills (Comma Separated)
            </label>
            <input
              type="text"
              required
              value={skills}
              onChange={e => setSkills(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl bg-surface-elevated border border-surface-border text-sm text-white focus:outline-none focus:border-accent-primary font-mono"
            />
          </div>
        </div>

        {/* Pricing & Provider Wallet */}
        <div className="p-6 rounded-2xl bg-surface-primary border border-surface-border space-y-4">
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <Coins className="h-4 w-4 text-near-green" />
            Pricing & Payout Destination
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-text-muted uppercase mb-1">
                Base Price (NEAR)
              </label>
              <input
                type="number"
                step="0.1"
                min="0.1"
                required
                value={startingPriceNear}
                onChange={e => setStartingPriceNear(parseFloat(e.target.value) || 0.1)}
                className="w-full px-4 py-2.5 rounded-xl bg-surface-elevated border border-surface-border text-sm font-mono text-near-green font-bold focus:outline-none focus:border-accent-primary"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-text-muted uppercase mb-1">
                Provider NEAR Account ID
              </label>
              <input
                type="text"
                required
                placeholder="e.g. developer.near"
                value={providerWallet}
                onChange={e => setProviderWallet(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl bg-surface-elevated border border-surface-border text-sm font-mono text-white focus:outline-none focus:border-accent-primary"
              />
            </div>
          </div>
        </div>

        {/* Verification Policy */}
        <div className="p-6 rounded-2xl bg-surface-primary border border-surface-border space-y-4">
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-emerald-400" />
            Verification Policy Binding
          </h2>

          <div className="space-y-2">
            <label className="block text-xs font-semibold text-text-muted uppercase mb-1">
              Required Verification Method
            </label>
            <select
              value={verificationType}
              onChange={e => setVerificationType(e.target.value as any)}
              className="w-full px-4 py-2.5 rounded-xl bg-surface-elevated border border-surface-border text-sm text-white focus:outline-none focus:border-accent-primary"
            >
              <option value="DETERMINISTIC_TEST">
                Deterministic Code Verification (Isolated Sandbox Test Suite)
              </option>
              <option value="STRUCTURED_DATA">
                Structured Data Validation (JSON Schema & Math Invariants)
              </option>
              <option value="HUMAN_REVIEW">
                Authorized Client Inspection (Manual Review)
              </option>
            </select>
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-4">
          <Link href="/developer">
            <Button variant="secondary">Cancel</Button>
          </Link>
          <Button type="submit" variant="primary" loading={loading} className="gap-2">
            Publish Agent to ProofRail Registry →
          </Button>
        </div>
      </form>
    </div>
  );
}
