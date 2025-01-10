// src/app/marketplace/page.tsx

"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import withAuth from "../hoc/withAuth";
import Loader from "../components/Loader";

interface SellOffer {
  id: number;
  nftoken_id: string;
  seller: number; // User ID
  seller_username: string;
  amount: string; // en drops
  destination: string | null;
  offer_index: string;
  created_at: string;
  status: string; // 'active', 'accepted', 'canceled'
}

const Marketplace = () => {
  const { data: session } = useSession();
  const [sellOffers, setSellOffers] = useState<SellOffer[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string>("");

  const currentUserName = session?.user?.username || "";
  const currentUserAddress = session?.user?.address || "";

  const fetchSellOffers = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/all_sell_offers/", { method: "GET" });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Erreur lors de la récupération des offres.");
      } else {
        setSellOffers(data.sell_offers);
      }
    } catch (err) {
      console.error("Erreur lors de la récupération des offres:", err);
      setError("Erreur lors de la récupération des offres.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (session) {
      fetchSellOffers();
    }
  }, [session]);

  const handleAcceptOffer = async (offerIndex: string) => {
    if (!offerIndex) return;

    try {
      const res = await fetch("/api/accept_sell_offer/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ offer_index: offerIndex }),
      });

      const data = await res.json();

      if (!res.ok) {
        setMessage(data.error || "Erreur lors de l'acceptation de l'offre.");
      } else {
        setMessage("Offre acceptée avec succès !");
        // Rafraîchir les offres du marketplace
        setSellOffers(
          sellOffers.filter((offer) => offer.offer_index !== offerIndex)
        );
      }
    } catch (err) {
      console.error("Erreur lors de l'acceptation de l'offre:", err);
      setMessage("Erreur lors de l'acceptation de l'offre.");
    }
  };

  const handleCancelOffer = async (offerIndex: string) => {
    if (!offerIndex) return;

    try {
      const res = await fetch("/api/cancel_sell_offer/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ offer_index: offerIndex }),
      });

      const data = await res.json();

      if (!res.ok) {
        setMessage(data.error || "Erreur lors de l'annulation de l'offre.");
      } else {
        setMessage("Offre annulée avec succès !");
        // Rafraîchir les offres du marketplace
        setSellOffers(
          sellOffers.filter((offer) => offer.offer_index !== offerIndex)
        );
      }
    } catch (err) {
      console.error("Erreur lors de l'annulation de l'offre:", err);
      setMessage("Erreur lors de l'annulation de l'offre.");
    }
  };

  const formatDrops = (drops: string) => {
    const xrp = parseInt(drops, 10) / 1_000_000;
    return `${xrp} XRP`;
  };

  const truncateText = (text: string, maxLength: number) => {
    if (text.length <= maxLength) {
      return text;
    }
    const start = text.slice(0, Math.ceil(maxLength / 2));
    const end = text.slice(-Math.floor(maxLength / 2));
    return `${start}...${end}`;
  };

  // Filtre A : Mes Offres (Vendeur OU Destination)
  const myActiveOffers = sellOffers.filter((offer) => {
    const isMeSeller = offer.seller_username === currentUserName;
    const isMeDestination = offer.destination === currentUserAddress;
    return (isMeSeller || isMeDestination) && offer.status === "active";
  });

  // Filtre B : Toutes les Offres Sauf les Miennes
  const otherActiveOffers = sellOffers.filter((offer) => {
    const isMeSeller = offer.seller_username === currentUserName;
    const isMeDestination = offer.destination === currentUserAddress;
    return !isMeSeller && !isMeDestination && offer.status === "active";
  });

  return (
    <div className="relative flex flex-col items-center justify-center w-full h-full">
      {loading && <Loader />} {/* Afficher le Loader si loading */}
      <div className="max-w-6xl w-full px-4">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-200">
            Marketplace
          </h1>
        </div>

        {message && <p className="text-green-500 mb-3">{message}</p>}

        {/* Mes Offres de Vente */}
        <div className="mb-8">
          <h2 className="text-2xl font-semibold text-gray-800 dark:text-gray-200 mb-4">
            Mes Offres de Vente
          </h2>
          {error ? (
            <p className="text-red-500">{error}</p>
          ) : myActiveOffers.length === 0 ? (
            <p className="text-gray-700 dark:text-gray-300">
              Aucune offre de vente active.
            </p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
              {myActiveOffers.map((offer) => (
                <div
                  key={offer.id}
                  className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow"
                >
                  <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-200 mb-2">
                    {truncateText(offer.nftoken_id, 20)}
                  </h3>

                  <p className="text-gray-600 dark:text-gray-400 mb-2">
                    Prix : {formatDrops(offer.amount)}
                  </p>
                  {offer.destination && (
                    <p className="text-gray-600 dark:text-gray-400 mb-2">
                      Destination : {offer.destination}
                    </p>
                  )}
                  <button
                    onClick={() => handleCancelOffer(offer.offer_index)}
                    className="mt-2 w-full bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 transition-colors"
                  >
                    Annuler l'Offre
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Toutes les Offres de Vente */}
        <div>
          <h2 className="text-2xl font-semibold text-gray-800 dark:text-gray-200 mb-4">
            Toutes les Offres de Vente
          </h2>
          {error ? (
            <p className="text-red-500">{error}</p>
          ) : otherActiveOffers.length === 0 ? (
            <p className="text-gray-700 dark:text-gray-300">
              Aucune offre disponible.
            </p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
              {otherActiveOffers.map((offer) => (
                <div
                  key={offer.id}
                  className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow"
                >
                  <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-200 mb-2">
                    {truncateText(offer.nftoken_id, 20)}
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400 mb-2">
                    Vendeur : {offer.seller_username}
                  </p>
                  <p className="text-gray-600 dark:text-gray-400 mb-2">
                    Prix : {formatDrops(offer.amount)}
                  </p>
                  {offer.destination && (
                    <p className="text-gray-600 dark:text-gray-400 mb-2">
                      Destination : {offer.destination}
                    </p>
                  )}
                  <button
                    onClick={() => handleAcceptOffer(offer.offer_index)}
                    disabled={offer.seller_username === currentUserName}
                    className={`mt-2 w-full ${
                      offer.seller_username === currentUserName
                        ? "bg-gray-400 cursor-not-allowed"
                        : "bg-blue-600 hover:bg-blue-700"
                    } text-white px-4 py-2 rounded transition-colors`}
                  >
                    Accepter l'Offre
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const ProtectedMarketplace = withAuth(Marketplace);
export default ProtectedMarketplace;
