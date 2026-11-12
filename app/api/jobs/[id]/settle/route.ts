import { NextResponse } from 'next/server';
import { nearClient } from '@/lib/near/client';
import { store } from '@/lib/store';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json().catch(() => ({}));
    const action = body.action || 'payout'; // 'payout' | 'refund'
    const job = store.getJobById(id);

    if (!job) {
      return NextResponse.json({ error: 'Job not found' }, { status: 404 });
    }

    const agent = store.getAgentById(job.agentId);

    if (action === 'payout') {
      if (job.state !== 'PASSED' && job.state !== 'SETTLEMENT_PENDING') {
        return NextResponse.json(
          { error: `Cannot settle payout in state ${job.state}. Must be verified PASSED.` },
          { status: 400 }
        );
      }

      // Execute onchain settlement release
      const { transaction } = await nearClient.settleJob(job.id);
      const updatedTransactions = [...job.transactions, transaction];

      store.updateJob(job.id, {
        state: 'PAID',
        transactions: updatedTransactions,
        completedAt: new Date().toISOString(),
      });

      store.addJobEvent(job.id, {
        eventType: 'payment.confirmed',
        title: 'NEAR Escrow Released to Provider',
        message: `${job.priceNear} NEAR successfully transferred to provider (${agent?.provider.walletAddress}). Tx: ${transaction.transactionHash.slice(0, 16)}...`,
        details: {
          txHash: transaction.transactionHash,
          blockHeight: transaction.blockHeight,
          toAccount: agent?.provider.walletAddress,
          explorerUrl: transaction.explorerUrl,
        },
      });

      // Update provider verified jobs stats
      if (agent) {
        agent.stats.verifiedJobsCount += 1;
        agent.stats.totalEarnedNear += job.priceNear;
        store.registerAgent(agent);
      }

      const updatedJob = store.getJobById(job.id);
      return NextResponse.json({ success: true, job: updatedJob, transaction });
    } else if (action === 'refund') {
      if (job.state !== 'FAILED' && job.state !== 'REFUND_ELIGIBLE') {
        return NextResponse.json(
          { error: `Job is not eligible for refund in state ${job.state}` },
          { status: 400 }
        );
      }

      // Execute onchain refund
      const { transaction } = await nearClient.refundJob(job.id, job.buyerWallet);
      const updatedTransactions = [...job.transactions, transaction];

      store.updateJob(job.id, {
        state: 'REFUNDED',
        transactions: updatedTransactions,
        completedAt: new Date().toISOString(),
      });

      store.addJobEvent(job.id, {
        eventType: 'job.refunded',
        title: 'Escrow Refunded to Buyer',
        message: `${job.priceNear} NEAR returned to ${job.buyerWallet} after failed verification. Tx: ${transaction.transactionHash.slice(0, 16)}...`,
        details: {
          txHash: transaction.transactionHash,
          blockHeight: transaction.blockHeight,
          refundedTo: job.buyerWallet,
          explorerUrl: transaction.explorerUrl,
        },
      });

      const updatedJob = store.getJobById(job.id);
      return NextResponse.json({ success: true, job: updatedJob, transaction });
    } else {
      return NextResponse.json({ error: 'Invalid settlement action' }, { status: 400 });
    }
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
