import * as nearAPI from 'near-api-js';

const { KeyPair } = nearAPI;

function main() {
  const keyPair = KeyPair.fromRandom('ed25519');
  console.log('========================================================');
  console.log('🔑 GENERATED FRESH NEAR TESTNET KEYPAIR');
  console.log('========================================================\n');
  console.log('Public Key:');
  console.log(keyPair.getPublicKey().toString());
  console.log('\nPrivate Key:');
  console.log(keyPair.toString());
  console.log('\n========================================================');
  console.log('To activate this key on NEAR Testnet:');
  console.log('1. Import into Meteor Wallet (testnet.meteorwallet.app), OR');
  console.log('2. Request testnet funding from: https://faucet.testnet.near.org');
  console.log('========================================================\n');
}

main();
