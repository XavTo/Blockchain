// src/app/trade/page.tsx

"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import withAuth from "../hoc/withAuth";
import Loader from "../components/Loader"; // Import du Loader
import { SellOffer } from "@/types/SellOffer";

interface Nft {
  NFTokenID: string;
  URI: string; // hex
  [key: string]: any; // autres champs
}

const Trade = () => {
  const { data: session } = useSession();
  const [nfts, setNfts] = useState<Nft[]>([]);
  const [sellOffers, setSellOffers] = useState<SellOffer[]>([]);
  const [filteredNfts, setFilteredNfts] = useState<Nft[]>([]);
  const [selectedNft, setSelectedNft] = useState<string>("");
  const [amount, setAmount] = useState<string>("0"); // en drops
  const [destination, setDestination] = useState<string>("");
  const [message, setMessage] = useState<string>("");
  const [error, setError] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [creatingOffer, setCreatingOffer] = useState<boolean>(false); // Indicateur de création d'offre

  const fetchUserNfts = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/list_assets/`, { method: "GET" });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Erreur lors de la récupération de vos NFTs.");
        return;
      }
      const nftsData = data?.result?.account_nfts;
      if (Array.isArray(nftsData)) {
        setNfts(nftsData);
      } else {
        setError("Les données reçues ne sont pas valides.");
      }
    } catch (err) {
      console.error("Erreur lors de la récupération des NFTs:", err);
      setError("Erreur lors de la récupération de vos NFTs.");
    } finally {
      setLoading(false);
    }
  };

  const fetchSellOffers = async () => {
    setLoading(true);
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
      fetchUserNfts();
      fetchSellOffers();
    }
  }, [session]);

  useEffect(() => {
    // Filtrer les NFTs qui ne sont pas déjà en vente
    const activeSellOffers = sellOffers
      .filter((offer) => offer.status === "active")
      .map((offer) => offer.nftoken_id);

    const availableNfts = nfts.filter(
      (nft) => !activeSellOffers.includes(nft.NFTokenID)
    );

    setFilteredNfts(availableNfts);
  }, [nfts, sellOffers]);

  const handleCreateSellOffer = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage("");
    setError("");

    if (!selectedNft) {
      setError("Veuillez sélectionner un NFT.");
      return;
    }

    if (!amount) {
      setError("Veuillez spécifier un montant.");
      return;
    }

    setCreatingOffer(true); // Début de la création d'offre
    setLoading(true);

    try {
      const res = await fetch("/api/create_sell_offer/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nft_id: selectedNft,
          amount,
          destination: destination || null,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Erreur lors de la création de l'offre.");
      } else {
        setMessage("Offre créée avec succès !");
        // Rafraîchir les NFTs et les offres de vente
        await fetchUserNfts();
        await fetchSellOffers();
        setSelectedNft("");
        setAmount("0");
        setDestination("");
      }
    } catch (err) {
      console.error("Erreur lors de la création de l'offre:", err);
      setError("Erreur réseau. Réessayez plus tard.");
    } finally {
      setCreatingOffer(false); // Fin de la création d'offre
      setLoading(false);
    }
  };

  const hexToStr = (hex: string): string => {
    if (!hex) return "";
    let str = "";
    for (let i = 0; i < hex.length; i += 2) {
      const code = parseInt(hex.substring(i, i + 2), 16);
      if (!isNaN(code)) {
        str += String.fromCharCode(code);
      }
    }
    return str;
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
      {(loading || creatingOffer) && <Loader />}{" "}
      {/* Afficher le Loader si loading ou creatingOffer */}
      <div className="max-w-6xl w-full px-4">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-200">
            Créer une Offre de Vente
          </h1>
          <Link
            href="/marketplace"
            className="text-blue-600 dark:text-blue-400 hover:underline"
          >
            Voir le Marketplace
          </Link>
        </div>

        {error && <p className="text-red-500 mb-3">{error}</p>}
        {message && <p className="text-green-500 mb-3">{message}</p>}

        <form
          onSubmit={handleCreateSellOffer}
          className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow"
        >
          {/* Sélection du NFT */}
          <div className="mb-4">
            <label className="block text-gray-700 dark:text-gray-300 mb-1">
              Sélectionner un NFT
            </label>
            {loading ? (
              <p className="text-gray-700 dark:text-gray-300">
                Chargement des NFTs...
              </p>
            ) : (
              <select
                value={selectedNft}
                onChange={(e) => setSelectedNft(e.target.value)}
                required
                className="w-full p-2 border rounded dark:bg-gray-700 dark:text-gray-200"
              >
                <option value="">-- Choisir un NFT --</option>
                {filteredNfts.length > 0 ? (
                  filteredNfts.map((nft) => {
                    const decodedUri = hexToStr(nft.URI);
                    let name = nft.NFTokenID;
                    try {
                      const jsonUri = JSON.parse(decodedUri);
                      name = jsonUri.name || nft.NFTokenID;
                    } catch (err) {
                      // Pas du JSON, utiliser NFTokenID comme nom
                    }
                    return (
                      <option key={nft.NFTokenID} value={nft.NFTokenID}>
                        {truncateText(name, 20)}
                      </option>
                    );
                  })
                ) : (
                  <option disabled>Aucun NFT disponible</option>
                )}
              </select>
            )}
          </div>

          {/* Montant en drops */}
          <div className="mb-4">
            <label className="block text-gray-700 dark:text-gray-300 mb-1">
              Prix en drops (1 XRP = 1_000_000 drops)
            </label>
            <input
              type="number"
              min="0"
              step="1"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              required
              className="w-full p-2 border rounded dark:bg-gray-700 dark:text-gray-200"
            />
          </div>

          {/* Adresse de destination (optionnel) */}
          <div className="mb-4">
            <label className="block text-gray-700 dark:text-gray-300 mb-1">
              Adresse destinataire (optionnel)
            </label>
            <input
              type="text"
              value={destination}
              onChange={(e) => setDestination(e.target.value)}
              placeholder="rEXAMPLE123..."
              className="w-full p-2 border rounded dark:bg-gray-700 dark:text-gray-200"
            />
          </div>

          <button
            type="submit"
            disabled={creatingOffer || loading}
            className={`w-full ${
              creatingOffer || loading
                ? "bg-blue-400 cursor-not-allowed"
                : "bg-blue-600 hover:bg-blue-700"
            } text-white px-4 py-2 rounded transition-colors`}
          >
            {creatingOffer ? "Création de l'offre..." : "Créer l'Offre"}
          </button>
        </form>
      </div>
    </div>
  );
};

const ProtectedTrade = withAuth(Trade);
export default ProtectedTrade;
