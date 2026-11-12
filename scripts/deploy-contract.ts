import fs from 'node:fs';
import path from 'node:path';
import * as nearAPI from 'near-api-js';

const { connect, keyStores, KeyPair, utils } = nearAPI;

async function main() {
  const accountId = process.env.NEAR_DEPLOY_ACCOUNT_ID || process.env.NEAR_ACCOUNT_ID;
  const privateKey = process.env.NEAR_DEPLOY_PRIVATE_KEY || process.env.NEAR_PRIVATE_KEY;

  if (!accountId || !privateKey) {
    console.error('\n❌ Missing NEAR credentials in environment!');
    console.error('Please specify:');
    console.error('  NEAR_DEPLOY_ACCOUNT_ID=yourname.testnet');
    console.error('  NEAR_DEPLOY_PRIVATE_KEY=ed25519:...\n');
    process.exit(1);
  }

  // Find compiled WASM file
  const wasmPath = path.resolve(
    process.cwd(),
    'contracts/proofrail/target/wasm32-unknown-unknown/release/proofrail_contract.wasm'
  );

  if (!fs.existsSync(wasmPath)) {
    console.error(`\n❌ Compiled WASM file not found at: ${wasmPath}`);
    console.error('Please run cargo build first.\n');
    process.exit(1);
  }

  const wasmBinary = fs.readFileSync(wasmPath);
  console.log(`📦 Loaded contract WASM binary: ${(wasmBinary.length / 1024).toFixed(1)} KB`);

  console.log(`🌐 Connecting to NEAR Testnet RPC...`);
  const keyStore = new keyStores.InMemoryKeyStore();
  const keyPair = KeyPair.fromString(privateKey as any);
  await keyStore.setKey('testnet', accountId, keyPair);

  const near = await connect({
    networkId: 'testnet',
    nodeUrl: process.env.NEAR_RPC_URL || 'https://rpc.testnet.near.org',
    keyStore,
  });

  const account = await near.account(accountId);
  const balance = await account.getAccountBalance();
  console.log(`👤 Deploying as: ${accountId}`);
  console.log(`💰 Account Balance: ${utils.format.formatNearAmount(balance.available)} NEAR`);

  console.log(`\n🚀 Uploading & Deploying contract to ${accountId}...`);
  const deployResult = await account.deployContract(wasmBinary);
  console.log(`✅ Contract deployed! Tx: ${deployResult.transaction.hash}`);

  // Initialize contract
  try {
    console.log(`⚙️ Initializing contract state (new)...`);
    await account.functionCall({
      contractId: accountId,
      methodName: 'new',
      args: { admin_id: accountId },
      gas: BigInt('30000000000000'), // 30 Tgas
    });
    console.log(`✅ Contract state initialized with admin: ${accountId}`);
  } catch (err: any) {
    if (err.message?.includes('Already initialized')) {
      console.log(`ℹ️ Contract already initialized.`);
    } else {
      console.warn(`⚠️ Init call note:`, err.message);
    }
  }

  // Register verifier node
  try {
    console.log(`🛡️ Registering authorized verifier node...`);
    await account.functionCall({
      contractId: accountId,
      methodName: 'add_verifier',
      args: { verifier_id: 'verifier.proofrail.testnet' },
      gas: BigInt('30000000000000'),
    });
    console.log(`✅ Registered verifier: verifier.proofrail.testnet`);
  } catch (err: any) {
    console.warn(`⚠️ Verifier registration note:`, err.message);
  }

  console.log(`\n======================================================`);
  console.log(`🎉 PROOFRAIL CONTRACT IS OFFICIALLY LIVE ONCHAIN!`);
  console.log(`Contract ID: ${accountId}`);
  console.log(`NearBlocks: https://testnet.nearblocks.io/address/${accountId}`);
  console.log(`======================================================\n`);
}

main().catch(err => {
  console.error('\n❌ Deployment failed:', err);
  process.exit(1);
});
