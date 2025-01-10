// src/app/my_sell_offers/page.tsx

"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import withAuth from "../hoc/withAuth";
import Loader from "../components/Loader"; // Import du Loader

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

const MySellOffers = () => {
  const { data: session } = useSession();
  const [sellOffers, setSellOffers] = useState<SellOffer[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string>("");

  useEffect(() => {
    const fetchMySellOffers = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch("/api/sell_offers_for_me/", { method: "GET" });
        const data = await res.json();

        if (!res.ok) {
          setError(
            data.error || "Erreur lors de la récupération de vos offres."
          );
        } else {
          setSellOffers(data.sell_offers);
        }
      } catch (err) {
        console.error("Erreur lors de la récupération de vos offres:", err);
        setError("Erreur lors de la récupération de vos offres.");
      } finally {
        setLoading(false);
      }
    };

    if (session) {
      fetchMySellOffers();
    }
  }, [session]);

  const handleAcceptOffer = async (offerIndex: string) => {
    if (!offerIndex) return;

    setLoading(true); // Commencer le chargement
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
        // Rafraîchir les offres dirigées à l'utilisateur
        setSellOffers(
          sellOffers.filter((offer) => offer.offer_index !== offerIndex)
        );
      }
    } catch (err) {
      console.error("Erreur lors de l'acceptation de l'offre:", err);
      setMessage("Erreur lors de l'acceptation de l'offre.");
    } finally {
      setLoading(false); // Fin du chargement
    }
  };

  const handleCancelOffer = async (offerIndex: string) => {
    if (!offerIndex) return;

    setLoading(true); // Commencer le chargement
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
        // Rafraîchir les offres dirigées à l'utilisateur
        setSellOffers(
          sellOffers.filter((offer) => offer.offer_index !== offerIndex)
        );
      }
    } catch (err) {
      console.error("Erreur lors de l'annulation de l'offre:", err);
      setMessage("Erreur lors de l'annulation de l'offre.");
    } finally {
      setLoading(false); // Fin du chargement
    }
  };

  const formatDrops = (drops: string) => {
    const xrp = parseInt(drops) / 1_000_000;
    return `${xrp} XRP`;
  };

  return (
    <div className="relative flex flex-col items-center justify-center w-full h-full">
      {loading && <Loader />} {/* Afficher le Loader si loading */}
      <div className="max-w-6xl w-full px-4">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-200">
            Mes Propositions d'achat
          </h1>
        </div>

        {error ? (
          <p className="text-red-500">{error}</p>
        ) : sellOffers.length === 0 ? (
          <p className="text-gray-700 dark:text-gray-300">
            Aucune offre active.
          </p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
            {sellOffers.map((offer) => (
              <div
                key={offer.id}
                className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow"
              >
                <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200 mb-2">
                  {offer.nftoken_id}
                </h2>
                <p className="text-gray-600 dark:text-gray-400 mb-2">
                  Prix : {formatDrops(offer.amount)}
                </p>
                {offer.destination && (
                  <p className="text-gray-600 dark:text-gray-400 mb-2">
                    Destination : {offer.destination}
                  </p>
                )}
                <div className="flex space-x-2">
                  <button
                    onClick={() => handleAcceptOffer(offer.offer_index)}
                    className="mt-2 flex-1 bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
                  >
                    Accepter
                  </button>
                  <button
                    onClick={() => handleCancelOffer(offer.offer_index)}
                    className="mt-2 flex-1 bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
                  >
                    Annuler
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {message && (
          <p className="mt-4 text-green-600 dark:text-green-400">{message}</p>
        )}
      </div>
    </div>
  );
};

const ProtectedMySellOffers = withAuth(MySellOffers);
export default ProtectedMySellOffers;
