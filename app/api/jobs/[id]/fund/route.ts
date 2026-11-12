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
    const job = store.getJobById(id);

    if (!job) {
      return NextResponse.json({ error: 'Job not found' }, { status: 404 });
    }

    if (job.state !== 'DRAFT' && job.state !== 'QUOTED' && job.state !== 'FUNDING_PENDING') {
      return NextResponse.json(
        { error: `Job cannot be funded in state ${job.state}` },
        { status: 400 }
      );
    }

    const agent = store.getAgentById(job.agentId);
    const buyerWallet = body.buyerWallet || job.buyerWallet;

    // Escrow deposit on NEAR Smart Contract
    const { transaction } = await nearClient.createFundedJob({
      jobId: job.id,
      buyerId: buyerWallet,
      providerId: agent?.provider.walletAddress,
      verifierId: 'verifier.proofrail.testnet',
      amountNear: job.priceNear,
      policyHash: job.verificationPolicy.policyHash,
    });

    const updatedTransactions = [...job.transactions, transaction];

    store.updateJob(job.id, {
      state: 'ASSIGNED',
      buyerWallet,
      transactions: updatedTransactions,
    });

    store.addJobEvent(job.id, {
      eventType: 'job.funded',
      title: 'Escrow Deposit Confirmed on NEAR',
      message: `${job.priceNear} NEAR successfully locked in contract (proofrail.testnet). Tx: ${transaction.transactionHash.slice(0, 16)}...`,
      details: {
        txHash: transaction.transactionHash,
        blockHeight: transaction.blockHeight,
        explorerUrl: transaction.explorerUrl,
      },
    });

    const updated = store.getJobById(job.id);
    return NextResponse.json({ success: true, job: updated, transaction });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
