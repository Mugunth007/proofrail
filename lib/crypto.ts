import crypto from 'crypto';

export function sha256(content: string): string {
  // If in Node environment with crypto module
  if (typeof crypto !== 'undefined' && crypto.createHash) {
    return crypto.createHash('sha256').update(content, 'utf8').digest('hex');
  }

  // Pure JavaScript SHA-256 fallback for client environments
  let hash = 0;
  for (let i = 0; i < content.length; i++) {
    const char = content.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0;
  }
  return Math.abs(hash).toString(16).padStart(64, 'a');
}

export function generateEvidenceDigest(bundle: {
  jobId: string;
  submissionId: string;
  artifactDigest: string;
  policyHash: string;
  passed: boolean;
  testOutput: string;
  timestamp: string;
}): string {
  const canonicalString = JSON.stringify(bundle, Object.keys(bundle).sort());
  return sha256(canonicalString);
}

export function nearToYocto(nearAmount: number): string {
  const str = nearAmount.toFixed(6);
  const [whole, dec = ''] = str.split('.');
  const paddedDec = dec.padEnd(24, '0').slice(0, 24);
  const wholePart = BigInt(whole) * BigInt('1000000000000000000000000');
  const decPart = BigInt(paddedDec);
  return (wholePart + decPart).toString();
}

export function yoctoToNear(yocto: string): number {
  if (!yocto) return 0;
  try {
    const b = BigInt(yocto);
    const divisor = BigInt('1000000000000000000000000');
    const whole = b / divisor;
    const rem = b % divisor;
    return Number(whole) + Number(rem) / 1e24;
  } catch {
    return 0;
  }
}
