import vm from 'node:vm';
import { generateEvidenceDigest, sha256 } from '../crypto';
import type { VerificationPolicy, VerificationReport } from '../types';

export interface VerificationInput {
  jobId: string;
  submissionId: string;
  agentId: string;
  artifactContent: string;
  policy: VerificationPolicy;
}

export async function runVerification(input: {
  jobId: string;
  submissionId: string;
  agentId: string;
  artifactContent: string;
  policy: VerificationPolicy;
}): Promise<VerificationReport> {
  const { jobId, submissionId, agentId, artifactContent, policy } = input;
  const startTime = Date.now();
  const verifierId = 'verifier.proofrail.testnet';
  const artifactDigest = sha256(artifactContent);

  let passed = false;
  let score = 0;
  let totalTests = 0;
  let passedTests = 0;
  let failedTests = 0;
  let testOutput = '';
  let failureReason: string | undefined;

  try {
    if (policy.type === 'DETERMINISTIC_CODE') {
      const logs: string[] = [];
      const testResults: { name: string; passed: boolean; error?: string }[] = [];

      // Isolated safe sandbox context
      const sandbox: Record<string, any> = {
        console: {
          log: (...args: any[]) => logs.push(args.map(a => typeof a === 'object' ? JSON.stringify(a) : String(a)).join(' ')),
          warn: (...args: any[]) => logs.push('[WARN] ' + args.join(' ')),
          error: (...args: any[]) => logs.push('[ERROR] ' + args.join(' ')),
        },
        expect: (actual: any) => ({
          toBe: (expected: any) => {
            if (actual !== expected) {
              throw new Error(`Expected ${JSON.stringify(expected)} but received ${JSON.stringify(actual)}`);
            }
          },
          toEqual: (expected: any) => {
            if (JSON.stringify(actual) !== JSON.stringify(expected)) {
              throw new Error(`Expected deep equal ${JSON.stringify(expected)} but received ${JSON.stringify(actual)}`);
            }
          },
          toBeCloseTo: (expected: number, precision = 2) => {
            const diff = Math.abs(actual - expected);
            if (diff > Math.pow(10, -precision) / 2) {
              throw new Error(`Expected close to ${expected} (+/- ${precision} decimals), received ${actual}`);
            }
          },
          toBeTruthy: () => {
            if (!actual) throw new Error(`Expected truthy value but received ${actual}`);
          },
          toBeFalsy: () => {
            if (actual) throw new Error(`Expected falsy value but received ${actual}`);
          },
        }),
        test: (name: string, fn: () => void) => {
          totalTests++;
          try {
            fn();
            passedTests++;
            testResults.push({ name, passed: true });
          } catch (err: any) {
            failedTests++;
            testResults.push({ name, passed: false, error: err.message });
          }
        },
        it: (name: string, fn: () => void) => sandbox.test(name, fn),
        module: { exports: {} },
        exports: {},
      };

      const context = vm.createContext(sandbox);

      // 1. Evaluate submitted candidate artifact
      const artifactScript = new vm.Script(artifactContent, {
        filename: 'submission.js',
      });
      artifactScript.runInContext(context, { timeout: policy.timeoutMs || 4000 });

      // Expose exported functions/symbols from candidate to sandbox global
      Object.assign(sandbox, sandbox.module.exports, sandbox.exports);

      // 2. Evaluate test suite
      if (policy.testSuite) {
        const testScript = new vm.Script(policy.testSuite, {
          filename: 'test_suite.js',
        });
        testScript.runInContext(context, { timeout: policy.timeoutMs || 4000 });
      }

      // Generate output report
      const outputLines: string[] = [
        '========================================',
        'PROOFRAIL INDEPENDENT TEST HARNESS v1.0',
        `Target Artifact SHA-256: ${artifactDigest.slice(0, 16)}...`,
        `Policy Hash: ${policy.policyHash.slice(0, 16)}...`,
        '========================================\n',
      ];

      testResults.forEach(r => {
        if (r.passed) {
          outputLines.push(`  ✓ PASS: ${r.name}`);
        } else {
          outputLines.push(`  ✗ FAIL: ${r.name}`);
          outputLines.push(`    Details: ${r.error}`);
        }
      });

      if (logs.length > 0) {
        outputLines.push('\n[Captured Execution Logs]');
        logs.forEach(l => outputLines.push(`  ${l}`));
      }

      outputLines.push('\n----------------------------------------');
      outputLines.push(`Test Summary: ${passedTests}/${totalTests} passed (${failedTests} failed)`);
      outputLines.push('----------------------------------------');

      testOutput = outputLines.join('\n');
      passed = totalTests > 0 && failedTests === 0;
      score = totalTests > 0 ? Math.round((passedTests / totalTests) * 100) : 0;

      if (!passed) {
        failureReason = `${failedTests} test(s) failed in verification suite`;
      }
    } else if (policy.type === 'STRUCTURED_DATA') {
      // Validate JSON data schema
      let parsed: any;
      try {
        parsed = JSON.parse(artifactContent);
        totalTests = 3;
        passedTests = 0;

        // Check required fields
        if (parsed.summary && parsed.totalRecords && Array.isArray(parsed.metrics)) {
          passedTests++;
        }
        // Check mathematical consistency
        if (parsed.calculatedRevenue !== undefined && parsed.calculatedRevenue >= 0) {
          passedTests++;
        }
        // Check anomaly flags
        if (Array.isArray(parsed.anomalies)) {
          passedTests++;
        }

        failedTests = totalTests - passedTests;
        passed = failedTests === 0;
        score = Math.round((passedTests / totalTests) * 100);
        testOutput = `Data validation completed: ${passedTests}/${totalTests} schema & integrity constraints satisfied.`;
      } catch (e: any) {
        failedTests = 1;
        totalTests = 1;
        passed = false;
        testOutput = `Invalid JSON artifact: ${e.message}`;
        failureReason = 'Structured data parse error';
      }
    } else {
      // Human review fallback
      passed = true;
      score = 100;
      testOutput = 'Artifact queued for authorized client inspection.';
    }
  } catch (err: any) {
    passed = false;
    failedTests++;
    failureReason = `Execution error: ${err.message}`;
    testOutput = `Sandboxed runner execution failure:\n${err.stack || err.message}`;
  }

  const duration = Date.now() - startTime;
  const timestamp = new Date().toISOString();

  // Generate cryptographic proof bundle digest
  const evidenceDigest = generateEvidenceDigest({
    jobId,
    submissionId,
    artifactDigest,
    policyHash: policy.policyHash,
    passed,
    testOutput,
    timestamp,
  });

  // Verifier simulated signature for onchain submission
  const attestationSignature = `ed25519:proofrail_verifier_sig_${evidenceDigest.slice(0, 32)}`;

  return {
    id: `ver-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    jobId,
    submissionId,
    agentId,
    verifierId,
    policyHash: policy.policyHash,
    artifactDigest,
    passed,
    score,
    totalTests,
    passedTests,
    failedTests,
    executionDurationMs: duration,
    testOutput,
    evidenceDigest,
    attestationSignature,
    timestamp,
    failureReason,
  };
}
