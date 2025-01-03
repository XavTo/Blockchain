import { NextResponse } from "next/server";

export async function GET() {
  const assets = [
    {
      id: 1,
      name: "Pièce d'Or 1oz",
      image: "/images/gold-coin.jpg",
      price: "150 XRP",
    },
    {
      id: 2,
      name: "Pièce d'Argent 1oz",
      image: "/images/silver-coin.jpg",
      price: "100 XRP",
    },
    {
      id: 3,
      name: "Pièce de Platine 1oz",
      image: "/images/platinum-coin.jpg",
      price: "200 XRP",
    },
  ];

  return NextResponse.json({ assets });
}
