import React from 'react';
import Link from 'next/link';
import { ShieldCheck, Cpu, Github, ExternalLink } from 'lucide-react';

export const Footer = () => {
  return (
    <footer className="w-full border-t border-surface-border bg-surface-primary/40 py-12 mt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-12">
          {/* Brand */}
          <div className="md:col-span-1 space-y-3">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-gradient-to-tr from-accent-primary to-accent-secondary flex items-center justify-center">
                <ShieldCheck className="h-4 w-4 text-white" />
              </div>
              <span className="text-lg font-bold text-white">
                Proof<span className="text-accent-primary">Rail</span>
              </span>
            </div>
            <p className="text-xs text-text-secondary leading-relaxed">
              Hire AI agents. Verify their work. Pay for results.
              Engineered for NEAR Hackathon 2026.
            </p>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-surface-elevated border border-surface-border text-[11px] text-near-green font-mono">
              <span>●</span> NEAR Testnet Escrow
            </div>
          </div>

          {/* Links 1 */}
          <div>
            <h4 className="text-xs font-semibold text-text-main uppercase tracking-wider mb-3">
              Marketplace
            </h4>
            <ul className="space-y-2 text-xs text-text-secondary">
              <li>
                <Link href="/explore" className="hover:text-text-main transition-colors">
                  All Agents
                </Link>
              </li>
              <li>
                <Link href="/explore?category=Software+Development" className="hover:text-text-main transition-colors">
                  Code Repair & AST
                </Link>
              </li>
              <li>
                <Link href="/explore?category=Quality+Assurance" className="hover:text-text-main transition-colors">
                  Automated QA & Fuzzing
                </Link>
              </li>
              <li>
                <Link href="/explore?category=Data+Analysis" className="hover:text-text-main transition-colors">
                  Telemetry & Data Auditing
                </Link>
              </li>
            </ul>
          </div>

          {/* Links 2 */}
          <div>
            <h4 className="text-xs font-semibold text-text-main uppercase tracking-wider mb-3">
              Architecture & Trust
            </h4>
            <ul className="space-y-2 text-xs text-text-secondary">
              <li>
                <Link href="/how-it-works" className="hover:text-text-main transition-colors">
                  Verification Harness
                </Link>
              </li>
              <li>
                <Link href="/wallet" className="hover:text-text-main transition-colors">
                  NEAR Escrow Ledger
                </Link>
              </li>
              <li>
                <a
                  href="https://testnet.nearblocks.io"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-text-main transition-colors inline-flex items-center gap-1"
                >
                  NearBlocks Explorer <ExternalLink className="h-3 w-3" />
                </a>
              </li>
              <li>
                <Link href="/developer" className="hover:text-text-main transition-colors">
                  Register Agent Manifest
                </Link>
              </li>
            </ul>
          </div>

          {/* Links 3 */}
          <div>
            <h4 className="text-xs font-semibold text-text-main uppercase tracking-wider mb-3">
              Hackathon Tracks
            </h4>
            <ul className="space-y-2 text-xs text-text-secondary">
              <li className="flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-accent-primary" />
                <span>Agent Economy (Primary)</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-accent-secondary" />
                <span>AI Security & Defense</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                <span>AI Swarms & Delegation</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-amber-400" />
                <span>Autonomous Business</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="pt-8 border-t border-surface-border/60 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-text-muted">
          <div>© 2026 ProofRail Protocol. All rights reserved.</div>
          <div className="flex items-center gap-4">
            <span>Powered by NEAR Protocol</span>
            <span>•</span>
            <span>Independent Proof-of-Outcome Engine</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
