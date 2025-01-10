"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
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

const MySellOffers = () => {
  const { data: session } = useSession();
  const [sellOffers, setSellOffers] = useState<SellOffer[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string>("");

  // Récupération du username et de l'adresse XRPL
  const currentUserName = session?.user?.username || "";
  const currentUserAddress = session?.user?.address || "";

  const fetchMySellOffers = async () => {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/sell_offers_for_me/", { method: "GET" });
      const data = await res.json();

      console.log("DEBUG: /api/sell_offers_for_me response =", data);

      if (!res.ok) {
        setError(data.error || "Erreur lors de la récupération de vos offres.");
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

  useEffect(() => {
    if (session) {
      fetchMySellOffers();
    }
  }, [session]);

  const handleAcceptOffer = async (offerIndex: string) => {
    if (!offerIndex) return;
    setLoading(true);

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
        // Retirer l'offre du state
        setSellOffers(
          sellOffers.filter((offer) => offer.offer_index !== offerIndex)
        );
      }
    } catch (err) {
      console.error("Erreur lors de l'acceptation de l'offre:", err);
      setMessage("Erreur lors de l'acceptation de l'offre.");
    } finally {
      setLoading(false);
    }
  };

  const handleCancelOffer = async (offerIndex: string) => {
    if (!offerIndex) return;
    setLoading(true);

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
        // Retirer l'offre du state
        setSellOffers(
          sellOffers.filter((offer) => offer.offer_index !== offerIndex)
        );
      }
    } catch (err) {
      console.error("Erreur lors de l'annulation de l'offre:", err);
      setMessage("Erreur lors de l'annulation de l'offre.");
    } finally {
      setLoading(false);
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

  return (
    <div className="relative flex flex-col items-center justify-center w-full h-full">
      {loading && <Loader />}
      <div className="max-w-6xl w-full px-4">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-200">
            Mes Propositions d'achat
          </h1>
        </div>

        {message && <p className="text-green-500 mb-3">{message}</p>}

        <div className="mb-8">
          <h2 className="text-2xl font-semibold text-gray-800 dark:text-gray-200 mb-4">
            Mes Offres de Vente
          </h2>

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
                    {truncateText(offer.nftoken_id, 20)}
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
                      disabled={
                        offer.seller_username?.toLowerCase() ===
                        currentUserName.toLowerCase()
                      }
                      className={`mt-2 flex-1 ${
                        offer.seller_username?.toLowerCase() ===
                        currentUserName.toLowerCase()
                          ? "bg-gray-400 cursor-not-allowed"
                          : "bg-green-600 hover:bg-green-700"
                      } text-white px-4 py-2 rounded transition-colors`}
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
        </div>

        {message && (
          <p className="mt-4 text-green-600 dark:text-green-400">{message}</p>
        )}
      </div>
    </div>
  );
};

export default withAuth(MySellOffers);
