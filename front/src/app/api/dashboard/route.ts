// src/app/api/dashboard/route.ts

import { NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { NextRequest } from "next/server";

export async function GET(req: NextRequest) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });

  if (!token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Simulez vos données ici
  const data = {
    totalAssets: 120,
    assetsForSale: 45,
    assetsExchanged: 75,
  };

  return NextResponse.json(data);
}
