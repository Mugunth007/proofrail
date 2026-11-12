'use client';
import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  ShieldCheck,
  Cpu,
  Layers,
  Wallet,
  Briefcase,
  Terminal,
  ExternalLink,
  ChevronDown,
  RefreshCw,
  LogOut,
  Sparkles,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Badge } from './ui/Badge';
import { Button } from './ui/Button';
import { useNearWallet } from '@/context/NearWalletContext';
import { WalletModal } from './WalletModal';

export const Navbar = () => {
  const pathname = usePathname();
  const {
    accountId,
    balanceFormatted,
    isConnected,
    connectionType,
    setIsModalOpen,
    disconnect,
    refreshBalance,
  } = useNearWallet();

  const [showWalletMenu, setShowWalletMenu] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const navLinks = [
    { label: 'Explore', href: '/explore', icon: Cpu },
    { label: 'How It Works', href: '/how-it-works', icon: ShieldCheck },
    { label: 'My Jobs', href: '/jobs', icon: Briefcase },
    { label: 'Wallet', href: '/wallet', icon: Wallet },
    { label: 'Developers', href: '/developer', icon: Terminal },
  ];

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await refreshBalance();
    setIsRefreshing(false);
  };

  return (
    <>
      <header className="sticky top-0 z-40 w-full border-b border-surface-border bg-background/80 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          {/* Brand */}
          <div className="flex items-center gap-8">
            <Link href="/" className="flex items-center gap-2.5 group">
              <div className="h-9 w-9 rounded-xl bg-gradient-to-tr from-accent-primary to-accent-secondary flex items-center justify-center shadow-lg shadow-accent-primary/25 group-hover:scale-105 transition-transform">
                <ShieldCheck className="h-5 w-5 text-white" />
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xl font-bold tracking-tight text-white group-hover:text-accent-secondary transition-colors">
                  Proof<span className="text-accent-primary">Rail</span>
                </span>
                <Badge variant="near" className="text-[10px] py-0 px-2">
                  NEAR TESTNET
                </Badge>
              </div>
            </Link>

            {/* Navigation items */}
            <nav className="hidden md:flex items-center gap-1">
              {navLinks.map((link) => {
                const Icon = link.icon;
                const isActive =
                  pathname === link.href ||
                  (link.href !== '/' && pathname.startsWith(link.href));
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={cn(
                      'flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors',
                      isActive
                        ? 'bg-surface-elevated text-accent-secondary'
                        : 'text-text-secondary hover:text-text-main hover:bg-surface-primary'
                    )}
                  >
                    <Icon className="h-4 w-4" />
                    {link.label}
                  </Link>
                );
              })}
            </nav>
          </div>

          {/* Right CTA & Wallet */}
          <div className="flex items-center gap-3">
            <Link href="/jobs/new" className="hidden sm:inline-flex">
              <Button
                size="sm"
                variant="outline"
                className="border-accent-primary/40 text-accent-secondary hover:border-accent-primary"
              >
                + Post Task
              </Button>
            </Link>

            {/* Wallet Connect / Menu */}
            {isConnected ? (
              <div className="relative">
                <button
                  onClick={() => setShowWalletMenu(!showWalletMenu)}
                  className="flex items-center gap-2.5 px-3 py-1.5 rounded-xl bg-surface-primary border border-near-green/40 hover:border-near-green text-xs font-mono transition-all shadow-sm shadow-near-green/10"
                >
                  <div className="h-2 w-2 rounded-full bg-near-green animate-pulse" />
                  <span className="text-text-main font-semibold truncate max-w-[130px]">
                    {accountId}
                  </span>
                  <span className="text-near-green font-medium">
                    {balanceFormatted} Ⓝ
                  </span>
                  <ChevronDown className="h-3 w-3 text-text-muted" />
                </button>

                {showWalletMenu && (
                  <div className="absolute right-0 mt-2 w-80 rounded-2xl bg-surface-primary border border-surface-border shadow-2xl p-4 z-50 animate-in fade-in zoom-in-95">
                    <div className="flex items-center justify-between mb-3 pb-2 border-b border-surface-border">
                      <span className="text-xs font-semibold text-text-secondary uppercase tracking-wider">
                        Active Wallet
                      </span>
                      <div className="flex items-center gap-1.5">
                        <Badge variant="near">
                          {connectionType === 'private_key' ? 'KEY SIGNER' : 'SELECTOR'}
                        </Badge>
                      </div>
                    </div>

                    <div className="mb-4">
                      <div className="text-xs text-text-muted">Account ID</div>
                      <div className="text-sm font-mono text-white font-medium truncate flex items-center justify-between">
                        <span>{accountId}</span>
                        <a
                          href={`https://testnet.nearblocks.io/address/${accountId}`}
                          target="_blank"
                          rel="noreferrer"
                          className="text-text-muted hover:text-near-green"
                          title="View on NearBlocks"
                        >
                          <ExternalLink className="h-3.5 w-3.5" />
                        </a>
                      </div>
                      <div className="flex items-center justify-between mt-2">
                        <div className="text-xl font-bold font-mono text-near-green">
                          {balanceFormatted} Ⓝ
                        </div>
                        <button
                          onClick={handleRefresh}
                          disabled={isRefreshing}
                          className="text-text-muted hover:text-white p-1 rounded transition-colors"
                          title="Refresh balance"
                        >
                          <RefreshCw
                            className={cn('h-3.5 w-3.5', isRefreshing && 'animate-spin text-near-green')}
                          />
                        </button>
                      </div>
                    </div>

                    <div className="space-y-2 mb-4 pt-2 border-t border-surface-border/60">
                      <button
                        onClick={() => {
                          setShowWalletMenu(false);
                          setIsModalOpen(true);
                        }}
                        className="w-full flex items-center justify-between p-2 rounded-xl text-left text-xs bg-surface-elevated hover:bg-surface-border text-white transition-colors"
                      >
                        <span className="flex items-center gap-2">
                          <Wallet className="h-3.5 w-3.5 text-accent-secondary" />
                          Switch / Connect Wallet
                        </span>
                        <Sparkles className="h-3 w-3 text-text-muted" />
                      </button>

                      <button
                        onClick={async () => {
                          await disconnect();
                          setShowWalletMenu(false);
                        }}
                        className="w-full flex items-center justify-between p-2 rounded-xl text-left text-xs text-red-400 hover:bg-red-500/10 transition-colors"
                      >
                        <span className="flex items-center gap-2">
                          <LogOut className="h-3.5 w-3.5" />
                          Disconnect Wallet
                        </span>
                      </button>
                    </div>

                    <Link
                      href="/wallet"
                      onClick={() => setShowWalletMenu(false)}
                      className="w-full block text-center py-2 text-xs font-medium bg-surface-elevated hover:bg-surface-border text-text-main rounded-xl transition-colors"
                    >
                      View Escrow History & Ledger →
                    </Link>
                  </div>
                )}
              </div>
            ) : (
              <Button
                size="sm"
                onClick={() => setIsModalOpen(true)}
                className="flex items-center gap-2 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-medium shadow-md shadow-emerald-500/20"
              >
                <Wallet className="h-4 w-4" />
                Connect Wallet
              </Button>
            )}
          </div>
        </div>
      </header>

      {/* Global Wallet Connect Modal */}
      <WalletModal />
    </>
  );
};
