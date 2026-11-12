'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import * as nearAPI from 'near-api-js';
import type { WalletSelector, AccountState } from '@near-wallet-selector/core';
import { actionCreators } from '@near-wallet-selector/core';
import type { WalletSelectorModal } from '@near-wallet-selector/modal-ui';
import '@near-wallet-selector/modal-ui/styles.css';

export interface WalletTransactionResult {
  transactionHash: string;
  explorerUrl: string;
}

export interface NearWalletContextType {
  accountId: string | null;
  balance: number;
  balanceFormatted: string;
  isConnected: boolean;
  connectionType: 'selector' | 'private_key' | null;
  isLoading: boolean;
  contractId: string;
  networkId: string;
  connectSelector: () => Promise<void>;
  connectWithKey: (accountId: string, privateKey: string) => Promise<boolean>;
  disconnect: () => Promise<void>;
  refreshBalance: () => Promise<void>;
  signAndSendTransaction: (params: {
    receiverId?: string;
    methodName: string;
    args: Record<string, any>;
    depositNear?: number | string;
    gasTgas?: number;
  }) => Promise<WalletTransactionResult>;
  isModalOpen: boolean;
  setIsModalOpen: (open: boolean) => void;
}

const NearWalletContext = createContext<NearWalletContextType | undefined>(undefined);

const NETWORK_ID = 'testnet';
const RPC_NODE_URL = 'https://rpc.testnet.near.org';
const DEFAULT_CONTRACT_ID = process.env.NEXT_PUBLIC_NEAR_CONTRACT_ID || 'opentag4876.testnet';

export function NearWalletProvider({ children }: { children: React.ReactNode }) {
  const [selector, setSelector] = useState<WalletSelector | null>(null);
  const [modal, setModal] = useState<WalletSelectorModal | null>(null);
  const [accountId, setAccountId] = useState<string | null>(null);
  const [balance, setBalance] = useState<number>(0);
  const [balanceFormatted, setBalanceFormatted] = useState<string>('0.00');
  const [connectionType, setConnectionType] = useState<'selector' | 'private_key' | null>(null);
  const [privateKeyAccount, setPrivateKeyAccount] = useState<nearAPI.Account | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);

  // Helper: Query live balance via RPC
  const fetchLiveBalance = useCallback(async (accId: string): Promise<number> => {
    try {
      const res = await fetch(RPC_NODE_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jsonrpc: '2.0',
          id: 'bal_query',
          method: 'query',
          params: {
            request_type: 'view_account',
            finality: 'final',
            account_id: accId,
          },
        }),
      });
      const data = await res.json();
      if (data.result?.amount) {
        const nearStr = nearAPI.utils.format.formatNearAmount(data.result.amount);
        const parsed = parseFloat(nearStr);
        return isNaN(parsed) ? 0 : parsed;
      }
    } catch (e) {
      console.warn('[NearWallet] Failed to fetch balance:', e);
    }
    return 0;
  }, []);

  const refreshBalance = useCallback(async () => {
    if (!accountId) return;
    const b = await fetchLiveBalance(accountId);
    setBalance(b);
    setBalanceFormatted(b.toFixed(2));
  }, [accountId, fetchLiveBalance]);

  // Connect using private key into near-api-js memory keyStore
  const connectWithKey = useCallback(
    async (accId: string, privKey: string): Promise<boolean> => {
      try {
        setIsLoading(true);
        const keyStore = new nearAPI.keyStores.InMemoryKeyStore();
        const keyPair = nearAPI.KeyPair.fromString(privKey as any);
        await keyStore.setKey(NETWORK_ID, accId, keyPair);

        const near = await nearAPI.connect({
          networkId: NETWORK_ID,
          nodeUrl: RPC_NODE_URL,
          keyStore,
        });

        const account = await near.account(accId);
        // Verify account exists
        await account.state();

        setPrivateKeyAccount(account);
        setAccountId(accId);
        setConnectionType('private_key');

        const bal = await fetchLiveBalance(accId);
        setBalance(bal);
        setBalanceFormatted(bal.toFixed(2));

        setIsModalOpen(false);
        return true;
      } catch (err: any) {
        console.error('[NearWallet] Failed to connect with key:', err);
        alert(`Failed to connect account: ${err.message}`);
        return false;
      } finally {
        setIsLoading(false);
      }
    },
    [fetchLiveBalance]
  );

  // Initialize Wallet Selector dynamically on client
  useEffect(() => {
    let isMounted = true;

    async function init() {
      if (typeof window === 'undefined') return;

      try {
        const { setupWalletSelector } = await import('@near-wallet-selector/core');
        const { setupModal } = await import('@near-wallet-selector/modal-ui');
        const { setupMyNearWallet } = await import('@near-wallet-selector/my-near-wallet');
        const { setupMeteorWallet } = await import('@near-wallet-selector/meteor-wallet');

        const _selector = await setupWalletSelector({
          network: NETWORK_ID,
          modules: [setupMyNearWallet(), setupMeteorWallet()],
        });

        const _modal = setupModal(_selector, {
          contractId: DEFAULT_CONTRACT_ID,
          description: 'Connect your NEAR Testnet Wallet to interact with ProofRail Escrow',
        });

        if (!isMounted) return;
        setSelector(_selector);
        setModal(_modal);

        const state = _selector.store.getState();
        const activeAccount = state.accounts.find((acc: AccountState) => acc.active) || state.accounts[0];
        if (activeAccount) {
          setAccountId(activeAccount.accountId);
          setConnectionType('selector');
          const bal = await fetchLiveBalance(activeAccount.accountId);
          setBalance(bal);
          setBalanceFormatted(bal.toFixed(2));
        }
      } catch (e) {
        console.error('[NearWallet] Selector init error:', e);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    init();

    return () => {
      isMounted = false;
    };
  }, [fetchLiveBalance]);

  // Listen to selector account changes
  useEffect(() => {
    if (!selector) return;
    const subscription = selector.store.observable.subscribe((state) => {
      if (connectionType === 'selector') {
        const active = state.accounts.find((a: AccountState) => a.active) || state.accounts[0];
        if (active) {
          setAccountId(active.accountId);
          fetchLiveBalance(active.accountId).then((b) => {
            setBalance(b);
            setBalanceFormatted(b.toFixed(2));
          });
        } else {
          setAccountId(null);
          setBalance(0);
          setBalanceFormatted('0.00');
        }
      }
    });

    return () => subscription.unsubscribe();
  }, [selector, connectionType, fetchLiveBalance]);

  // Open Wallet Selector modal (MyNearWallet, Meteor)
  const connectSelector = useCallback(async () => {
    if (!modal) {
      alert('Wallet Selector is initializing, please try again in a moment.');
      return;
    }
    setConnectionType('selector');
    if (typeof window !== 'undefined') {
      localStorage.setItem('proofrail_near_conn_type', 'selector');
    }
    setIsModalOpen(false);
    modal.show();
  }, [modal]);

  // Disconnect
  const disconnect = useCallback(async () => {
    try {
      if (connectionType === 'selector' && selector) {
        const wallet = await selector.wallet();
        await wallet.signOut();
      }
    } catch (e) {
      console.warn('SignOut warning:', e);
    }
    setAccountId(null);
    setBalance(0);
    setBalanceFormatted('0.00');
    setConnectionType(null);
    setPrivateKeyAccount(null);
    if (typeof window !== 'undefined') {
      localStorage.removeItem('proofrail_near_conn_type');
      localStorage.removeItem('proofrail_near_account_id');
      localStorage.removeItem('proofrail_near_priv_key');
    }
  }, [connectionType, selector]);

  // Universal transaction signer (works whether connected via Selector or Private Key)
  const signAndSendTransaction = useCallback(
    async ({
      receiverId = DEFAULT_CONTRACT_ID,
      methodName,
      args,
      depositNear = '0',
      gasTgas = 30,
    }: {
      receiverId?: string;
      methodName: string;
      args: Record<string, any>;
      depositNear?: number | string;
      gasTgas?: number;
    }): Promise<WalletTransactionResult> => {
      const yoctoDeposit =
        typeof depositNear === 'number'
          ? nearAPI.utils.format.parseNearAmount(depositNear.toString()) || '0'
          : nearAPI.utils.format.parseNearAmount(depositNear) || '0';

      const gasUnits = BigInt(gasTgas) * BigInt('1000000000000'); // Tgas to gas

      // Scenario A: Connected via Private Key
      if (connectionType === 'private_key' && privateKeyAccount) {
        const outcome = await privateKeyAccount.functionCall({
          contractId: receiverId,
          methodName,
          args,
          gas: gasUnits,
          attachedDeposit: BigInt(yoctoDeposit),
        });

        const txHash = outcome.transaction.hash;
        await refreshBalance();
        return {
          transactionHash: txHash,
          explorerUrl: `https://testnet.nearblocks.io/txns/${txHash}`,
        };
      }

      // Scenario B: Connected via NEAR Wallet Selector (MyNearWallet / Meteor)
      if (connectionType === 'selector' && selector) {
        const wallet = await selector.wallet();
        const action = actionCreators.functionCall(
          methodName,
          args,
          gasUnits,
          BigInt(yoctoDeposit)
        );
        const outcome = await wallet.signAndSendTransaction({
          receiverId,
          actions: [action],
        });

        const txHash =
          outcome && typeof outcome === 'object' && 'transaction' in outcome
            ? (outcome as any).transaction.hash
            : (outcome as any)?.transaction_outcome?.id || 'tx_confirmed';

        await refreshBalance();
        return {
          transactionHash: txHash,
          explorerUrl: `https://testnet.nearblocks.io/txns/${txHash}`,
        };
      }

      throw new Error('No NEAR wallet connected. Please connect your wallet first.');
    },
    [connectionType, privateKeyAccount, selector, refreshBalance]
  );

  return (
    <NearWalletContext.Provider
      value={{
        accountId,
        balance,
        balanceFormatted,
        isConnected: !!accountId,
        connectionType,
        isLoading,
        contractId: DEFAULT_CONTRACT_ID,
        networkId: NETWORK_ID,
        connectSelector,
        connectWithKey,
        disconnect,
        refreshBalance,
        signAndSendTransaction,
        isModalOpen,
        setIsModalOpen,
      }}
    >
      {children}
    </NearWalletContext.Provider>
  );
}

export function useNearWallet() {
  const context = useContext(NearWalletContext);
  if (!context) {
    throw new Error('useNearWallet must be used within a NearWalletProvider');
  }
  return context;
}
