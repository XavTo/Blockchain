// src/app/api/dashboard/route.ts
import { NextResponse } from "next/server";

export async function GET() {
  const data = {
    totalAssets: 120,
    assetsForSale: 45,
    assetsExchanged: 75,
  };

  return NextResponse.json(data);
}
