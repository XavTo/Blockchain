import { NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { NextRequest } from "next/server";

export async function POST(req: NextRequest) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });

  if (!token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // Récupération des nftoken_ids depuis le corps de la requête
    const body = await req.json();
    const nftoken_ids = body.nftoken_ids;
    const sellers = body.sellers;

    if (!Array.isArray(nftoken_ids) || nftoken_ids.length === 0) {
      return NextResponse.json(
        { error: "nftoken_ids doit être une liste non vide." },
        { status: 400 }
      );
    }

    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/api/get_nfts/`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token.jwt}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ nftoken_ids, sellers }),
      }
    );

    if (!response.ok) {
      const backendError = await response.json();
      return NextResponse.json(
        {
          error:
            backendError.error ||
            "Erreur lors de l'appel au backend pour les NFTs.",
        },
        { status: response.status }
      );
    }

    const data = await response.json();
    console.log(data);
    return NextResponse.json(data);
  } catch (error) {
    console.error("Erreur lors de l'appel au backend pour les NFTs:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
