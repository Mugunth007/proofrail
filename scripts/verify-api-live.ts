async function main() {
  console.log('Testing live Next.js API at http://localhost:3000...');

  // 1. GET /api/near
  const nearRes = await fetch('http://localhost:3000/api/near');
  const nearData = await nearRes.json();
  console.log('Contract ID:', nearData.contractId);
  console.log('Network:', nearData.network);
  console.log('Live Block Height:', nearData.blockHeight);

  // 2. POST /api/jobs (Create a job)
  console.log('\nCreating task for CodeFix Agent...');
  const createJobRes = await fetch('http://localhost:3000/api/jobs', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      agentSlug: 'codefix-v1',
      title: 'Fix cart discount boundary check',
      description: 'Repair discount calculation function so PROMO20 gives 20% discount and zero discount on empty code.',
      buyerWallet: 'opentag4876.testnet',
    }),
  });
  const createdJobData = await createJobRes.json();
  if (!createdJobData.success) {
    console.error('Failed to create job:', createdJobData);
    process.exit(1);
  }
  const job = createdJobData.job;
  console.log(`Job Created: ${job.id} (State: ${job.state})`);

  // 3. Fund Escrow: POST /api/jobs/{id}/fund
  console.log(`\nFunding escrow onchain for job ${job.id}...`);
  const fundRes = await fetch(`http://localhost:3000/api/jobs/${job.id}/fund`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ buyerWallet: 'opentag4876.testnet' }),
  });
  const fundData = await fundRes.json();
  if (!fundData.success) {
    console.error('Failed to fund job:', fundData);
    process.exit(1);
  }
  console.log(`✅ Funded! Tx Hash: ${fundData.transaction?.transactionHash}`);
  console.log(`Explorer: ${fundData.transaction?.explorerUrl}`);

  // 4. Execute AI Task: POST /api/jobs/{id}/execute
  console.log(`\nExecuting NEAR AI Cloud inference & recording deliverable submission onchain...`);
  const execRes = await fetch(`http://localhost:3000/api/jobs/${job.id}/execute`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ enableDelegation: false }),
  });
  const execData = await execRes.json();
  if (!execData.success) {
    console.error('Failed to execute job:', execData);
    process.exit(1);
  }
  console.log(`✅ Execution Complete! State: ${execData.job?.state}`);
  console.log(`Artifact Digest: ${execData.artifact?.sha256Digest}`);

  // 5. Verify Artifact: POST /api/jobs/{id}/verify
  console.log(`\nRunning independent sandboxed verification & attesting onchain...`);
  const verifyRes = await fetch(`http://localhost:3000/api/jobs/${job.id}/verify`, {
    method: 'POST',
  });
  const verifyData = await verifyRes.json();
  if (!verifyData.success) {
    console.error('Failed to verify job:', verifyData);
    process.exit(1);
  }
  console.log(`✅ Verification Result: ${verifyData.report?.passed ? 'PASSED ✅' : 'FAILED ❌'}`);
  console.log(`Score: ${verifyData.report?.score}% | Duration: ${verifyData.report?.executionDurationMs}ms`);

  // 6. Settle Escrow Payout: POST /api/jobs/{id}/settle
  if (verifyData.report?.passed) {
    console.log(`\nSettling escrow payout onchain to agent provider...`);
    const settleRes = await fetch(`http://localhost:3000/api/jobs/${job.id}/settle`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'payout' }),
    });
    const settleData = await settleRes.json();
    if (!settleData.success) {
      console.error('Failed to settle job:', settleData);
      process.exit(1);
    }
    console.log(`✅ Payout Settled! Tx Hash: ${settleData.transaction?.transactionHash}`);
    console.log(`Explorer: ${settleData.transaction?.explorerUrl}`);
  }

  console.log('\n🎉 FULL END-TO-END ONCHAIN PIPELINE VERIFIED SUCCESSFULLY!');
}

main().catch(err => {
  console.error('Error testing live pipeline:', err);
  process.exit(1);
});
