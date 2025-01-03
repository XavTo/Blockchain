import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const { asset, quantity } = await request.json();

  return NextResponse.json({
    message: `Échange de ${quantity} ${asset} réussi !`,
  });
}
