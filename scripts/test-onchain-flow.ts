import * as nearAPI from 'near-api-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const { connect, keyStores, KeyPair, utils } = nearAPI;

async function testOnChain() {
  const accountId = process.env.NEAR_DEPLOY_ACCOUNT_ID || 'opentag4876.testnet';
  const privateKey = process.env.NEAR_DEPLOY_PRIVATE_KEY!;
  const contractId = process.env.NEAR_CONTRACT_ID || 'opentag4876.testnet';
  const nodeUrl = process.env.NEAR_RPC_URL || 'https://rpc.testnet.near.org';

  console.log(`Connecting to ${nodeUrl} as ${accountId}...`);
  const keyStore = new keyStores.InMemoryKeyStore();
  const keyPair = KeyPair.fromString(privateKey as any);
  await keyStore.setKey('testnet', accountId, keyPair);

  const near = await connect({
    networkId: 'testnet',
    nodeUrl,
    keyStore,
  });

  const account = await near.account(accountId);
  const balance = await account.getAccountBalance();
  console.log(`Account balance: ${utils.format.formatNearAmount(balance.available)} NEAR`);

  const testJobId = `job-test-${Date.now().toString(36)}`;
  console.log(`\n1. Creating onchain funded escrow for ${testJobId}...`);
  
  // create_funded_job
  const createRes = await account.functionCall({
    contractId,
    methodName: 'create_funded_job',
    args: {
      job_id: testJobId,
      provider_id: accountId, // self for test
      verifier_id: accountId, // admin account is authorized verifier
      policy_hash: 'f87a32e18584824838421034c56e300d832960683058a91443cc603bf9bc86c1',
      duration_blocks: 1000,
    },
    gas: BigInt('30000000000000'), // 30 Tgas
    attachedDeposit: BigInt(utils.format.parseNearAmount('0.05')!), // 0.05 NEAR deposit
  });

  console.log(`✅ Escrow funded! Tx Hash: ${createRes.transaction.hash}`);
  console.log(`Explorer: https://testnet.nearblocks.io/txns/${createRes.transaction.hash}`);

  // Query view method get_job
  const jobState1 = await account.viewFunction({
    contractId,
    methodName: 'get_job',
    args: { job_id: testJobId },
  });
  console.log(`Current onchain state:`, jobState1.state);

  // 2. record_submission
  console.log(`\n2. Recording artifact submission onchain...`);
  const subRes = await account.functionCall({
    contractId,
    methodName: 'record_submission',
    args: {
      job_id: testJobId,
      artifact_hash: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
    },
    gas: BigInt('30000000000000'),
  });
  console.log(`✅ Artifact submitted! Tx Hash: ${subRes.transaction.hash}`);

  // 3. attest_verification
  console.log(`\n3. Attesting verification pass onchain...`);
  const verRes = await account.functionCall({
    contractId,
    methodName: 'attest_verification',
    args: {
      job_id: testJobId,
      passed: true,
      evidence_hash: '9f86d081884c7d659a2feaa0c55ad015a3bf4f1b2b0b822cd15d6c15b0f00a08',
    },
    gas: BigInt('30000000000000'),
  });
  console.log(`✅ Verification attested! Tx Hash: ${verRes.transaction.hash}`);

  // 4. settle_job
  console.log(`\n4. Settling job onchain (payout release)...`);
  const settleRes = await account.functionCall({
    contractId,
    methodName: 'settle_job',
    args: {
      job_id: testJobId,
    },
    gas: BigInt('60000000000000'), // 60 Tgas for transfer promise
  });
  console.log(`✅ Job settled & funds released! Tx Hash: ${settleRes.transaction.hash}`);
  console.log(`Explorer: https://testnet.nearblocks.io/txns/${settleRes.transaction.hash}`);

  // Query final view
  const finalJob = await account.viewFunction({
    contractId,
    methodName: 'get_job',
    args: { job_id: testJobId },
  });
  console.log(`\nFinal onchain job state:`, finalJob);
  console.log(`\n🎉 Full onchain contract verification lifecycle succeeded on NEAR Testnet!`);
}

testOnChain().catch(err => {
  console.error('Test failed:', err);
  process.exit(1);
});
