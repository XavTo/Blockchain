"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import withAuth from "../hoc/withAuth";
import Loader from "../components/Loader";
import { SellOffer } from "@/types/SellOffer";

const Marketplace = () => {
  const { data: session } = useSession();
  const [sellOffers, setSellOffers] = useState<SellOffer[]>([]);
  const [images, setImages] = useState<{
    [key: string]: { uri: string; name: string; description: string };
  }>({});
  const [loading, setLoading] = useState<boolean>(true); // Si nécessaire pour le chargement initial
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string>("");
  const [loadingOffers, setLoadingOffers] = useState<{
    [key: string]: boolean;
  }>({});

  // Récupère le nom d'utilisateur actuel et l'adresse XRPL
  const currentUserName = session?.user?.username || "";
  const currentUserAddress = session?.user?.address || "";

  // Fonction pour récupérer toutes les offres de vente
  const fetchSellOffers = async () => {
    setLoading(true);
    setError(null);
    setMessage("");

    try {
      const res = await fetch("/api/all_sell_offers/", { method: "GET" });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Erreur lors de la récupération des offres.");
        return;
      }

      setSellOffers(data.sell_offers);

      if (data.sell_offers.length === 0) {
        setSellOffers([]);
        return;
      }

      // Extraire les ID des tokens NFT et les vendeurs
      const nftokenIds = data.sell_offers.map(
        (offer: SellOffer) => offer.nftoken_id
      );
      const sellers = data.sell_offers.map((offer: SellOffer) => offer.seller);

      // Récupérer les détails des NFT (images, noms, descriptions)
      await fetchNFTDetails(nftokenIds, sellers);
    } catch (err) {
      console.error("Erreur lors de la récupération des offres:", err);
      setError("Erreur lors de la récupération des offres.");
    } finally {
      setLoading(false);
    }
  };

  // Fonction pour récupérer les détails des NFT
  const fetchNFTDetails = async (nftokenIds: string[], sellers: number[]) => {
    try {
      const res = await fetch("/api/get_nfts/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nftoken_ids: nftokenIds, sellers: sellers }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Erreur lors de la récupération des images.");
        return;
      }

      // Mettre à jour l'état des images avec URI, nom et description
      const nftDetails = data.nfts.reduce(
        (
          acc: {
            [key: string]: { uri: string; name: string; description: string };
          },
          nft: any
        ) => {
          acc[nft.id] = {
            uri: nft.URI,
            name: nft.name,
            description: nft.description,
          };
          return acc;
        },
        {}
      );

      setImages(nftDetails);
    } catch (err) {
      console.error("Erreur lors de la récupération des images:", err);
      setError("Erreur lors de la récupération des images.");
    }
  };

  useEffect(() => {
    if (session) {
      fetchSellOffers();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session]);

  // Fonction pour accepter une offre
  const handleAcceptOffer = async (offerIndex: string) => {
    if (!offerIndex) return;
    setLoadingOffers((prev) => ({ ...prev, [offerIndex]: true }));
    setError(null);
    setMessage("");

    try {
      const res = await fetch("/api/accept_sell_offer/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ offer_index: offerIndex }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Erreur lors de l'acceptation de l'offre.");
      } else {
        setMessage("Offre acceptée avec succès !");
        // Supprimer l'offre acceptée de l'état
        setSellOffers((prevOffers) =>
          prevOffers.filter((offer) => offer.offer_index !== offerIndex)
        );
      }
    } catch (err) {
      console.error("Erreur lors de l'acceptation de l'offre:", err);
      setError("Erreur lors de l'acceptation de l'offre.");
    } finally {
      setLoadingOffers((prev) => ({ ...prev, [offerIndex]: false }));
    }
  };

  // Fonction pour annuler une offre
  const handleCancelOffer = async (offerIndex: string) => {
    if (!offerIndex) return;
    setLoadingOffers((prev) => ({ ...prev, [offerIndex]: true }));
    setError(null);
    setMessage("");

    try {
      const res = await fetch("/api/cancel_sell_offer/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ offer_index: offerIndex }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Erreur lors de l'annulation de l'offre.");
      } else {
        setMessage("Offre annulée avec succès !");
        // Supprimer l'offre annulée de l'état
        setSellOffers((prevOffers) =>
          prevOffers.filter((offer) => offer.offer_index !== offerIndex)
        );
      }
    } catch (err) {
      console.error("Erreur lors de l'annulation de l'offre:", err);
      setError("Erreur lors de l'annulation de l'offre.");
    } finally {
      setLoadingOffers((prev) => ({ ...prev, [offerIndex]: false }));
    }
  };

  // Fonction pour formater les drops en XRP
  const formatDrops = (drops: string) => {
    const xrp = parseInt(drops, 10) / 1_000_000;
    return `${xrp} XRP`;
  };

  // Fonction pour tronquer le texte
  const truncateText = (text: string, maxLength: number) => {
    if (text.length <= maxLength) {
      return text;
    }
    const start = text.slice(0, Math.ceil(maxLength / 2));
    const end = text.slice(-Math.floor(maxLength / 2));
    return `${start}...${end}`;
  };

  // Filtre A : Mes Offres Actives (Vendeur OU Destination)
  const myActiveOffers = sellOffers.filter((offer) => {
    const isMeSeller = offer.seller_username === currentUserName;
    const isMeDestination = offer.destination === currentUserAddress;
    return (isMeSeller || isMeDestination) && offer.status === "active";
  });

  // Filtre B : Toutes les Offres Actives sauf les miennes
  const otherActiveOffers = sellOffers.filter((offer) => {
    const isMeSeller = offer.seller_username === currentUserName;
    const isMeDestination = offer.destination === currentUserAddress;
    return !isMeSeller && !isMeDestination && offer.status === "active";
  });

  return (
    <div className="relative flex flex-col items-center justify-center w-full h-full bg-gray-100 dark:bg-gray-900">
      {loading && <Loader />} {/* Affiche le Loader si en chargement initial */}
      <div className="max-w-6xl w-full px-4 py-8 mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-4xl font-extrabold text-gray-800 dark:text-gray-200">
            Marketplace
          </h1>
        </div>

        {message && <p className="text-green-500 mb-3">{message}</p>}
        {error && <p className="text-red-500 mb-3">{error}</p>}

        {/* Mes Offres de Vente */}
        <div className="mb-12">
          <h2 className="text-3xl font-semibold text-gray-800 dark:text-gray-200 mb-6">
            Mes Offres de Vente
          </h2>
          {myActiveOffers.length === 0 ? (
            <p className="text-gray-700 dark:text-gray-300">
              Aucune offre de vente active.
            </p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
              {myActiveOffers.map((offer) => (
                <div
                  key={offer.id}
                  className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-xl hover:shadow-2xl transition-shadow duration-300"
                >
                  {/* Afficher l'image du NFT */}
                  {images[offer.nftoken_id]?.uri ? (
                    <img
                      src={images[offer.nftoken_id].uri}
                      alt={`NFT ${offer.nftoken_id}`}
                      className="w-full h-64 object-cover rounded-md mb-4"
                    />
                  ) : (
                    <div className="w-full h-64 bg-gray-200 dark:bg-gray-700 rounded-md mb-4 flex items-center justify-center">
                      <span className="text-gray-500 dark:text-gray-400">
                        Image non disponible
                      </span>
                    </div>
                  )}

                  {/* Nom du NFT */}
                  {images[offer.nftoken_id]?.name && (
                    <h3 className="text-2xl font-bold text-gray-800 dark:text-gray-200 mb-2">
                      {truncateText(images[offer.nftoken_id].name, 30)}
                    </h3>
                  )}

                  {/* Description du NFT */}
                  {images[offer.nftoken_id]?.description && (
                    <p className="text-gray-600 dark:text-gray-400 mb-4">
                      {truncateText(images[offer.nftoken_id].description, 100)}
                    </p>
                  )}

                  <p className="text-lg text-gray-700 dark:text-gray-300 mb-2">
                    Prix : {formatDrops(offer.amount)}
                  </p>
                  {offer.destination && (
                    <p className="text-lg text-gray-700 dark:text-gray-300 mb-4">
                      Destination : {truncateText(offer.destination, 20)}
                    </p>
                  )}
                  <div className="flex space-x-4">
                    <button
                      onClick={() => handleAcceptOffer(offer.offer_index)}
                      disabled={
                        loadingOffers[offer.offer_index] ||
                        offer.seller_username?.toLowerCase() ===
                          currentUserName.toLowerCase()
                      }
                      className={`flex-1 ${
                        loadingOffers[offer.offer_index]
                          ? "bg-gray-400 cursor-not-allowed"
                          : offer.seller_username?.toLowerCase() ===
                            currentUserName.toLowerCase()
                          ? "bg-gray-400 cursor-not-allowed"
                          : "bg-green-600 hover:bg-green-700"
                      } text-white px-4 py-2 rounded transition-colors flex items-center justify-center`}
                    >
                      {loadingOffers[offer.offer_index] ? (
                        <Loader /> // Affiche le Loader pendant l'acceptation
                      ) : (
                        "Accepter"
                      )}
                    </button>

                    <button
                      onClick={() => handleCancelOffer(offer.offer_index)}
                      disabled={loadingOffers[offer.offer_index]}
                      className={`flex-1 ${
                        loadingOffers[offer.offer_index]
                          ? "bg-gray-400 cursor-not-allowed"
                          : "bg-red-600 hover:bg-red-700"
                      } text-white px-4 py-2 rounded transition-colors flex items-center justify-center`}
                    >
                      {loadingOffers[offer.offer_index] ? (
                        <Loader /> // Affiche le Loader pendant l'annulation
                      ) : (
                        "Annuler"
                      )}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Toutes les Offres de Vente */}
        <div>
          <h2 className="text-3xl font-semibold text-gray-800 dark:text-gray-200 mb-6">
            Toutes les Offres de Vente
          </h2>
          {otherActiveOffers.length === 0 ? (
            <p className="text-gray-700 dark:text-gray-300">
              Aucune offre disponible.
            </p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
              {otherActiveOffers.map((offer) => (
                <div
                  key={offer.id}
                  className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-xl hover:shadow-2xl transition-shadow duration-300"
                >
                  {/* Afficher l'image du NFT */}
                  {images[offer.nftoken_id]?.uri ? (
                    <img
                      src={images[offer.nftoken_id].uri}
                      alt={`NFT ${offer.nftoken_id}`}
                      className="w-full h-64 object-cover rounded-md mb-4"
                    />
                  ) : (
                    <div className="w-full h-64 bg-gray-200 dark:bg-gray-700 rounded-md mb-4 flex items-center justify-center">
                      <span className="text-gray-500 dark:text-gray-400">
                        Image non disponible
                      </span>
                    </div>
                  )}

                  {/* Nom du NFT */}
                  {images[offer.nftoken_id]?.name && (
                    <h3 className="text-2xl font-bold text-gray-800 dark:text-gray-200 mb-2">
                      {truncateText(images[offer.nftoken_id].name, 30)}
                    </h3>
                  )}

                  {/* Description du NFT */}
                  {images[offer.nftoken_id]?.description && (
                    <p className="text-gray-600 dark:text-gray-400 mb-4">
                      {truncateText(images[offer.nftoken_id].description, 100)}
                    </p>
                  )}

                  <p className="text-lg text-gray-700 dark:text-gray-300 mb-2">
                    Vendeur : {offer.seller_username}
                  </p>
                  <p className="text-lg text-gray-700 dark:text-gray-300 mb-2">
                    Prix : {formatDrops(offer.amount)}
                  </p>
                  {offer.destination && (
                    <p className="text-lg text-gray-700 dark:text-gray-300 mb-4">
                      Destination : {truncateText(offer.destination, 20)}
                    </p>
                  )}
                  <button
                    onClick={() => handleAcceptOffer(offer.offer_index)}
                    disabled={
                      loadingOffers[offer.offer_index] ||
                      offer.seller_username === currentUserName
                    }
                    className={`mt-2 w-full ${
                      loadingOffers[offer.offer_index] ||
                      offer.seller_username === currentUserName
                        ? "bg-gray-400 cursor-not-allowed"
                        : "bg-blue-600 hover:bg-blue-700"
                    } text-white px-4 py-2 rounded transition-colors flex items-center justify-center`}
                  >
                    {loadingOffers[offer.offer_index] ? (
                      <Loader /> // Affiche le Loader pendant l'acceptation
                    ) : offer.seller_username === currentUserName ? (
                      "Votre offre"
                    ) : (
                      "Accepter l'Offre"
                    )}
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
