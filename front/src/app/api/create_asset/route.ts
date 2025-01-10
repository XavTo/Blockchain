// src/app/api/create_asset/route.ts

import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";

export async function POST(req: NextRequest) {
  // On récupère le token stocké par NextAuth
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });

  if (!token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // Récupération des données envoyées par le frontend
    const body = await req.json();
    const { URI } = body;

    // On appelle ensuite notre backend Django
    console.log("URI", URI);
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/api/asset/`, // NOTEZ LE SLASH FINAL
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token.jwt}`, // Transmission du JWT
        },
        body: JSON.stringify({ URI }),
      }
    );

    // Si la réponse n’est pas OK, on renvoie l’erreur
    if (!response.ok) {
      const errorData = await response.json();
      return NextResponse.json(errorData, { status: response.status });
    }

    // En cas de succès, on renvoie la réponse du backend
    const data = await response.json();
    console.log("data", data);
    return NextResponse.json(data);
  } catch (error) {
    console.error("Erreur lors de la création d'asset :", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
