'use client';
import React, { useState, useEffect } from 'react';
import {
  Wallet,
  Coins,
  ArrowUpRight,
  ArrowDownLeft,
  RefreshCw,
  ExternalLink,
  ShieldCheck,
  CheckCircle2,
  Clock,
} from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { formatDate } from '@/lib/utils';
import type { ChainTransaction } from '@/lib/types';
import { useNearWallet } from '@/context/NearWalletContext';

export default function WalletPage() {
  const {
    accountId: connectedAccountId,
    balance: connectedBalance,
    isConnected,
    setIsModalOpen,
    refreshBalance,
  } = useNearWallet();

  const [transactions, setTransactions] = useState<ChainTransaction[]>([]);
  const [networkInfo, setNetworkInfo] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [selectedAccount, setSelectedAccount] = useState<string>('opentag4876.testnet');

  useEffect(() => {
    if (connectedAccountId) {
      setSelectedAccount(connectedAccountId);
    }
  }, [connectedAccountId]);

  const demoAccounts = [
    { accountId: 'alice_buyer.testnet', role: 'Buyer / Client', balance: 45.2 },
    { accountId: 'bob_agent_user.testnet', role: 'Buyer / Client', balance: 12.8 },
    { accountId: 'codefix.near', role: 'Agent Provider', balance: 428.5 },
    { accountId: 'testpilot.near', role: 'Agent Provider', balance: 156.0 },
    { accountId: 'verifier.proofrail.testnet', role: 'Verifier Node', balance: 25.0 },
  ];

  const fetchLedger = async () => {
    try {
      const res = await fetch('/api/near');
      const data = await res.json();
      setNetworkInfo(data);
      if (data.transactions) setTransactions(data.transactions);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLedger();
  }, []);

  const accounts = (networkInfo?.walletDemoAccounts && networkInfo.walletDemoAccounts.length > 0)
    ? networkInfo.walletDemoAccounts.map((a: any) => ({
        accountId: a.accountId,
        role: a.role,
        balance: a.balanceNear,
        isOnchain: a.isOnchain,
      }))
    : demoAccounts;

  const activeAccount =
    accounts.find((a: any) => a.accountId === selectedAccount) || accounts[0];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-8 mb-8 border-b border-surface-border gap-4">
        <div>
          <Badge variant="near" className="mb-2">NEAR Testnet</Badge>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">
            Wallet & Escrow Ledger
          </h1>
          <p className="text-text-secondary text-sm mt-1">
            Track testnet balances, smart contract escrow deposits, and conditional payouts.
          </p>
        </div>

        <button
          onClick={fetchLedger}
          className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-surface-primary border border-surface-border text-xs text-text-secondary hover:text-white transition-colors"
        >
          <RefreshCw className="h-3.5 w-3.5" />
          Refresh Onchain State
        </button>
      </div>

      {/* Account Persona Selector & Balance Card */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
        {/* Balance Card */}
        <div className="p-6 rounded-2xl bg-gradient-to-tr from-surface-primary to-surface-elevated border border-surface-border">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-semibold text-text-muted uppercase">Active Balance</span>
            <Badge variant="near">TESTNET</Badge>
          </div>
          <div className="text-3xl sm:text-4xl font-extrabold font-mono text-near-green">
            {activeAccount.balance.toFixed(2)} Ⓝ
          </div>
          <div className="text-xs font-mono text-text-muted mt-2 truncate">
            {selectedAccount}
          </div>
        </div>

        {/* Network State */}
        <div className="p-6 rounded-2xl bg-surface-primary border border-surface-border">
          <div className="text-xs font-semibold text-text-muted uppercase mb-4">Network Info</div>
          <div className="space-y-2 text-xs font-mono">
            <div className="flex justify-between">
              <span className="text-text-muted">RPC Node</span>
              <span className="text-white truncate max-w-[160px]">rpc.testnet.near.org</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-text-muted">Contract</span>
              <a
                href={`https://testnet.nearblocks.io/address/${networkInfo?.contractId || 'opentag4876.testnet'}`}
                target="_blank"
                rel="noreferrer"
                className="text-accent-secondary hover:underline flex items-center gap-1 font-mono"
              >
                {networkInfo?.contractId || 'opentag4876.testnet'}
                <ExternalLink className="h-3 w-3" />
              </a>
            </div>
            <div className="flex justify-between">
              <span className="text-text-muted">Current Block</span>
              <span className="text-near-green font-bold">
                #{networkInfo?.blockHeight || '276,887,200'}
              </span>
            </div>
          </div>
        </div>

        {/* Switch Persona / Wallet */}
        <div className="p-6 rounded-2xl bg-surface-primary border border-surface-border">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-text-muted uppercase">
              Wallets & Personas
            </span>
            <button
              onClick={() => setIsModalOpen(true)}
              className="text-[11px] text-near-green hover:underline flex items-center gap-1 font-mono font-medium"
            >
              <Wallet className="h-3 w-3" /> Connect / Switch
            </button>
          </div>
          <div className="space-y-1.5">
            {accounts.map((acc: any) => (
              <button
                key={acc.accountId}
                onClick={() => setSelectedAccount(acc.accountId)}
                className={`w-full flex items-center justify-between p-2 rounded-xl text-left text-xs transition-colors font-mono ${
                  activeAccount.accountId === acc.accountId
                    ? 'bg-accent-primary/20 text-white font-semibold border border-accent-primary/40'
                    : 'hover:bg-surface-elevated text-text-muted'
                }`}
              >
                <span className="truncate flex items-center gap-1.5">
                  {acc.isOnchain && (
                    <span className="h-1.5 w-1.5 rounded-full bg-near-green animate-pulse" />
                  )}
                  {acc.accountId}
                </span>
                <span className="text-near-green">{acc.balance} Ⓝ</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Transactions Ledger */}
      <div>
        <h2 className="text-xl font-bold text-white mb-4">Onchain Escrow Transactions</h2>
        {transactions.length === 0 ? (
          <div className="py-16 text-center rounded-2xl bg-surface-primary/40 border border-surface-border text-text-muted text-sm">
            No onchain transactions recorded yet.
          </div>
        ) : (
          <div className="rounded-2xl border border-surface-border bg-surface-primary overflow-hidden shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-mono">
                <thead className="bg-surface-elevated border-b border-surface-border text-text-muted uppercase font-semibold">
                  <tr>
                    <th className="py-3.5 px-4">Type</th>
                    <th className="py-3.5 px-4">Amount</th>
                    <th className="py-3.5 px-4">From</th>
                    <th className="py-3.5 px-4">To</th>
                    <th className="py-3.5 px-4">Block</th>
                    <th className="py-3.5 px-4">Tx Hash & Explorer</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-surface-border/60">
                  {transactions.map(tx => (
                    <tr key={tx.id} className="hover:bg-surface-elevated/40 transition-colors">
                      <td className="py-3.5 px-4 font-sans">
                        <Badge
                          variant={
                            tx.type === 'SETTLEMENT_PAYOUT'
                              ? 'success'
                              : tx.type === 'REFUND_TRANSFER'
                              ? 'error'
                              : 'near'
                          }
                        >
                          {tx.type}
                        </Badge>
                      </td>
                      <td className="py-3.5 px-4 font-bold text-near-green">
                        {tx.amountNear} Ⓝ
                      </td>
                      <td className="py-3.5 px-4 text-text-muted truncate max-w-[140px]">
                        {tx.fromAccount}
                      </td>
                      <td className="py-3.5 px-4 text-text-muted truncate max-w-[140px]">
                        {tx.toAccount}
                      </td>
                      <td className="py-3.5 px-4 text-text-main">
                        #{tx.blockHeight}
                      </td>
                      <td className="py-3.5 px-4">
                        <a
                          href={tx.explorerUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="text-near-green hover:underline inline-flex items-center gap-1"
                        >
                          {tx.transactionHash.slice(0, 14)}... <ExternalLink className="h-3 w-3" />
                        </a>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
