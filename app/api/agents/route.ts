import { NextResponse } from 'next/server';
import { z } from 'zod';
import { store } from '@/lib/store';
import type { AgentCategory, AgentManifest } from '@/lib/types';

const AgentRegistrationSchema = z.object({
  name: z.string().min(3),
  slug: z.string().min(3),
  tagline: z.string().min(10),
  description: z.string().min(20),
  category: z.enum([
    'Software Development',
    'Quality Assurance',
    'Data Analysis',
    'Research',
    'Automation',
    'Security & Defense',
  ]),
  skills: z.array(z.string()).min(1),
  startingPriceNear: z.number().positive(),
  providerWallet: z.string().min(3),
  providerName: z.string().min(2),
  inputFormats: z.array(z.string()),
  outputFormats: z.array(z.string()),
  verificationType: z.enum(['DETERMINISTIC_TEST', 'SCHEMA_VALIDATION', 'HUMAN_REVIEW']),
});

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const category = searchParams.get('category');
  const query = searchParams.get('q')?.toLowerCase();

  let agents = store.getAgents();

  if (category && category !== 'All') {
    agents = agents.filter(a => a.category === category);
  }

  if (query) {
    agents = agents.filter(
      a =>
        a.name.toLowerCase().includes(query) ||
        a.description.toLowerCase().includes(query) ||
        a.skills.some(s => s.toLowerCase().includes(query))
    );
  }

  return NextResponse.json({ agents });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const validated = AgentRegistrationSchema.parse(body);

    const newAgent: AgentManifest = {
      id: `agent_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      slug: validated.slug,
      name: validated.name,
      tagline: validated.tagline,
      description: validated.description,
      category: validated.category as AgentCategory,
      version: '1.0.0',
      avatar: `https://avatar.vercel.sh/${validated.slug}`,
      provider: {
        id: `prov_${Date.now()}`,
        name: validated.providerName,
        walletAddress: validated.providerWallet,
        verified: false,
      },
      skills: validated.skills,
      startingPriceNear: validated.startingPriceNear,
      averageDurationSeconds: 15,
      capabilities: {
        inputFormats: validated.inputFormats,
        outputFormats: validated.outputFormats,
        maxExecutionTimeSeconds: 60,
        supportedVerification: [validated.verificationType],
      },
      pricing: [
        {
          tier: 'Standard',
          baseNear: validated.startingPriceNear,
          features: ['Standard autonomous execution', 'Independent verification', 'NEAR Escrow protection'],
        },
      ],
      stats: {
        verifiedJobsCount: 0,
        verifiedSuccessRate: 0,
        medianExecutionSeconds: 0,
        totalEarnedNear: 0,
        refundRatio: 0,
      },
      isBuiltInDemo: false,
    };

    store.registerAgent(newAgent);
    return NextResponse.json({ success: true, agent: newAgent });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.errors ? err.errors : err.message },
      { status: 400 }
    );
  }
}
