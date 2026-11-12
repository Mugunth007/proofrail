'use client';

import React, { useState } from 'react';
import { useNearWallet } from '@/context/NearWalletContext';
import {
  X,
  Wallet,
  Key,
  ShieldCheck,
  ExternalLink,
  CheckCircle2,
  Cpu,
  ArrowRight,
  Sparkles,
} from 'lucide-react';
import { Badge } from './ui/Badge';
import { Button } from './ui/Button';

export function WalletModal() {
  const {
    isModalOpen,
    setIsModalOpen,
    accountId,
    isConnected,
    balanceFormatted,
    connectionType,
    connectSelector,
    connectWithKey,
    disconnect,
  } = useNearWallet();

  const [activeTab, setActiveTab] = useState<'selector' | 'custom'>('selector');
  const [customAccountId, setCustomAccountId] = useState('');
  const [customPrivateKey, setCustomPrivateKey] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isModalOpen) return null;

  const handleCustomKeySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customAccountId || !customPrivateKey) return;
    setIsSubmitting(true);
    await connectWithKey(customAccountId.trim(), customPrivateKey.trim());
    setIsSubmitting(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg bg-surface-primary border border-surface-border rounded-2xl shadow-2xl overflow-hidden p-6">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-surface-border">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-near-green/10 text-near-green flex items-center justify-center">
              <Wallet className="h-4 w-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                Connect NEAR Wallet
                <Badge variant="near" className="text-[10px] py-0 px-1.5">
                  TESTNET
                </Badge>
              </h3>
              <p className="text-xs text-text-muted">
                Authorize escrow deposits and conditional smart contract settlements
              </p>
            </div>
          </div>
          <button
            onClick={() => setIsModalOpen(false)}
            className="text-text-muted hover:text-white p-1 rounded-lg transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Status if already connected */}
        {isConnected && (
          <div className="mt-4 p-3.5 rounded-xl bg-surface-elevated/70 border border-near-green/30 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-2.5 w-2.5 rounded-full bg-near-green animate-pulse" />
              <div>
                <div className="text-xs text-text-muted">Currently Connected</div>
                <div className="text-sm font-mono font-bold text-white">{accountId}</div>
              </div>
            </div>
            <div className="text-right">
              <div className="text-xs font-mono font-bold text-near-green">{balanceFormatted} Ⓝ</div>
              <button
                onClick={disconnect}
                className="text-[11px] text-red-400 hover:text-red-300 underline"
              >
                Disconnect
              </button>
            </div>
          </div>
        )}

        {/* Tab switchers */}
        <div className="flex gap-1.5 p-1 bg-surface-elevated rounded-xl mt-4 mb-4 text-xs font-medium">
          <button
            onClick={() => setActiveTab('selector')}
            className={`flex-1 py-1.5 rounded-lg transition-colors ${
              activeTab === 'selector' ? 'bg-surface-primary text-white shadow-sm font-semibold' : 'text-text-muted hover:text-white'
            }`}
          >
            🌐 MyNearWallet / Meteor
          </button>
          <button
            onClick={() => setActiveTab('custom')}
            className={`flex-1 py-1.5 rounded-lg transition-colors ${
              activeTab === 'custom' ? 'bg-surface-primary text-white shadow-sm font-semibold' : 'text-text-muted hover:text-white'
            }`}
          >
            🔑 Custom Key
          </button>
        </div>

        {/* Tab 2: Wallet Selector */}
        {activeTab === 'selector' && (
          <div className="space-y-4 animate-in fade-in">
            <p className="text-xs text-text-muted">
              Connect using official web or browser extension wallets via the NEAR Wallet Selector.
            </p>

            <div className="grid grid-cols-2 gap-3">
              <div className="p-3.5 rounded-xl bg-surface-elevated border border-surface-border flex items-center gap-2.5">
                <div className="h-7 w-7 rounded-lg bg-surface-primary flex items-center justify-center font-bold text-xs text-near-green">
                  Ⓝ
                </div>
                <div className="text-xs font-medium text-white">MyNearWallet</div>
              </div>
              <div className="p-3.5 rounded-xl bg-surface-elevated border border-surface-border flex items-center gap-2.5">
                <div className="h-7 w-7 rounded-lg bg-surface-primary flex items-center justify-center font-bold text-xs text-purple-400">
                  ☄️
                </div>
                <div className="text-xs font-medium text-white">Meteor Wallet</div>
              </div>
            </div>

            <Button
              className="w-full flex items-center justify-center gap-2"
              onClick={connectSelector}
            >
              <Wallet className="h-4 w-4" />
              Open NEAR Wallet Selector Modal
            </Button>
          </div>
        )}

        {/* Tab 3: Custom Key */}
        {activeTab === 'custom' && (
          <form onSubmit={handleCustomKeySubmit} className="space-y-3 animate-in fade-in">
            <div>
              <label className="block text-xs font-medium text-text-secondary mb-1">
                NEAR Testnet Account ID
              </label>
              <input
                type="text"
                placeholder="e.g. alice.testnet"
                value={customAccountId}
                onChange={(e) => setCustomAccountId(e.target.value)}
                required
                className="w-full px-3 py-2 bg-surface-elevated border border-surface-border rounded-xl text-xs font-mono text-white focus:outline-none focus:border-accent-primary"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-text-secondary mb-1">
                Private Key
              </label>
              <input
                type="password"
                placeholder="ed25519:..."
                value={customPrivateKey}
                onChange={(e) => setCustomPrivateKey(e.target.value)}
                required
                className="w-full px-3 py-2 bg-surface-elevated border border-surface-border rounded-xl text-xs font-mono text-white focus:outline-none focus:border-accent-primary"
              />
            </div>

            <Button
              type="submit"
              disabled={isSubmitting}
              className="w-full flex items-center justify-center gap-2 mt-2"
            >
              <Key className="h-4 w-4" />
              {isSubmitting ? 'Verifying Account...' : 'Import & Connect Key'}
            </Button>
          </form>
        )}

        {/* Footer Info */}
        <div className="mt-5 pt-3 border-t border-surface-border flex items-center justify-between text-[11px] text-text-muted">
          <span>Target Contract: opentag4876.testnet</span>
          <a
            href="https://testnet.nearblocks.io/address/opentag4876.testnet"
            target="_blank"
            rel="noreferrer"
            className="text-near-green hover:underline inline-flex items-center gap-1"
          >
            Explorer <ExternalLink className="h-3 w-3" />
          </a>
        </div>
      </div>
    </div>
  );
}
