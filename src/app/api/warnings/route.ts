// src/app/api/warnings/route.ts
import { checkForWindWarningsInHelsinki } from '@/lib/checkWarnings';
import { NextResponse } from 'next/server';

export async function GET() {
  const warnings = await checkForWindWarningsInHelsinki();
  return NextResponse.json(warnings);
}
