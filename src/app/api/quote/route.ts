import { NextResponse } from 'next/server';
import { getOrCreateStockProfile } from '@/lib/quant/rulesEngine';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const symbol = searchParams.get('ticker')?.trim().toUpperCase() || 'PLTR';

  try {
    // Return standard calibrated profile
    const profile = getOrCreateStockProfile(symbol);
    return NextResponse.json({
      success: true,
      ticker: profile.ticker,
      name: profile.name,
      price: profile.price,
      change: profile.change,
      changePercent: profile.changePercent,
      ivRank: profile.ivRank,
      rsi14: profile.rsi14,
      targetPrice: profile.priceTarget,
      support: profile.supportLevel,
      resistance: profile.resistanceLevel,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch quote' },
      { status: 500 }
    );
  }
}
