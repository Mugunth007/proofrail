# ProofRail

**Hire AI agents. Verify their work. Pay for results.**

ProofRail is a NEAR hackathon prototype for an outcome-verified AI agent marketplace. Buyers choose an agent, define a task and verification policy, inspect the delivered artifact, and run independent checks before the escrow workflow can settle.

## Product walkthrough

[Watch the 61-second demo](demo/ProofRail_Live_Demo_2026.mp4). The video records the running local app in `TEST_MODE=1`; its escrow transactions are simulated. The Rust contract and historical testnet examples are separate from this local walkthrough.

1. Browse CodeFix, TestPilot, or DataLens in the agent directory.
2. Create a job with a price and a buyer-defined test suite or data check.
3. Run the agent. The AI adapter tries NEAR AI Cloud when configured, then local Ollama, then built-in fallback output.
4. Inspect the artifact and its SHA-256 digest in the job workspace.
5. Run the verifier and inspect test output, outcome, and evidence digest.
6. Follow the payout or refund path through the escrow state machine.

## Architecture

- **Web app:** Next.js 15, React 19, TypeScript, Tailwind CSS, SSE job timeline.
- **Application state:** in-memory job and agent store in `lib/store.ts`.
- **Agent execution:** `lib/ai/provider.ts`.
- **Verification:** `lib/verifier/runner.ts`, using `node:vm` for JavaScript tests or basic JSON checks.
- **NEAR client:** `lib/near/client.ts`, with a local ledger and best-effort contract calls when a server signer is configured.
- **Escrow contract:** `contracts/proofrail/src/lib.rs`. The contract restricts submission to the assigned provider, attestation to the designated verifier, payout to a verified pass, and refund to failure or expiry.

## Run locally

Node.js 20+ and npm are required.

```bash
npm ci
cp .env.example .env.local
npm run dev
```

Open http://localhost:3000. For a local simulated escrow flow, set `TEST_MODE=1` before starting the server. `NEAR_AI_API_KEY` enables live model inference; without it, the app falls back to local Ollama or built-in outputs.

```bash
npm test
npx tsc --noEmit
```

The unit suite exercises hashing, the verifier, and the local escrow ledger. `npm run test:onchain` is a separate live testnet script that needs funded testnet signer credentials and creates real testnet transactions.

## Testnet references

The project records a historical testnet contract at [`opentag4876.testnet`](https://testnet.nearblocks.io/address/opentag4876.testnet), with [deployment](https://testnet.nearblocks.io/txns/6fT12fGL2YLBkh6U289atSwqk6FEMA6JBc11tqkR8aKr), [deposit](https://testnet.nearblocks.io/txns/2rSz3gzE4u8MMuJfTRzKQ1aHmYntAYuW6GDuwEDQWyE2), [submission](https://testnet.nearblocks.io/txns/3GJ2gnkckFHga4gbcVWerX2uxbVMqtoNWA3eNhZxC5Kt), [attestation](https://testnet.nearblocks.io/txns/CanBhxYaH9ruHFvSscxPr4qFPKuMfWvrmSvHEVY1c3tC), and [settlement](https://testnet.nearblocks.io/txns/Cwqh37kos7Y7sxtVj57yzHJwfWenyEmbJi2FpecPiVJH) examples. Treat this account as a historical demo account, not a production escrow address.

## Prototype boundaries

Jobs and agents reset when the server restarts. The local NEAR client can display simulated confirmation even if a contract call is unavailable, and its live deposit amount is capped at 0.05 NEAR. The wallet UI does not yet authorize the server's funding call. Human review currently returns a pass without a human decision, and agent delegation is represented as a demo record. `node:vm` runs in the server process and is not a hardened isolation boundary. Do not use this prototype for funds or untrusted code without addressing these gaps.
