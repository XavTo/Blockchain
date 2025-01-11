"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import withAuth from "../hoc/withAuth";
import Loader from "../components/Loader";
import { SellOffer } from "@/types/SellOffer";

const Marketplace = () => {
  const { data: session } = useSession();
  const [sellOffers, setSellOffers] = useState<SellOffer[]>([]);
  const [images, setImages] = useState<{ [key: string]: string }>({});
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string>("");
  const [loadingOffers, setLoadingOffers] = useState<{
    [key: string]: boolean;
  }>({});

  // Retrieve the current user's username and XRPL address
  const currentUserName = session?.user?.username || "";
  const currentUserAddress = session?.user?.address || "";

  // Function to fetch all sell offers
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

      // Extract NFT token IDs and sellers
      const nftokenIds = data.sell_offers.map(
        (offer: SellOffer) => offer.nftoken_id
      );
      const sellers = data.sell_offers.map((offer: SellOffer) => offer.seller);

      // Fetch NFT images
      await fetchNFTImages(nftokenIds, sellers);
    } catch (err) {
      console.error("Erreur lors de la récupération des offres:", err);
      setError("Erreur lors de la récupération des offres.");
    } finally {
      setLoading(false);
    }
  };

  // Function to fetch NFT images
  const fetchNFTImages = async (nftokenIds: string[], sellers: number[]) => {
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

      // Update images state
      const nftImages = data.nfts.reduce(
        (acc: { [key: string]: string }, nft: any) => {
          acc[nft.id] = nft.URI;
          return acc;
        },
        {}
      );

      setImages(nftImages);
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

  // Function to handle accepting an offer
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
        // Remove the accepted offer from the state
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

  // Function to handle canceling an offer
  const handleCancelOffer = async (offerIndex: string) => {
    if (!offerIndex) return;
    setLoading(true);
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
        // Remove the canceled offer from the state
        setSellOffers((prevOffers) =>
          prevOffers.filter((offer) => offer.offer_index !== offerIndex)
        );
      }
    } catch (err) {
      console.error("Erreur lors de l'annulation de l'offre:", err);
      setError("Erreur lors de l'annulation de l'offre.");
    } finally {
      setLoading(false);
    }
  };

  // Function to format drops into XRP
  const formatDrops = (drops: string) => {
    const xrp = parseInt(drops, 10) / 1_000_000;
    return `${xrp} XRP`;
  };

  // Function to truncate long text for better UI
  const truncateText = (text: string, maxLength: number) => {
    if (text.length <= maxLength) {
      return text;
    }
    const start = text.slice(0, Math.ceil(maxLength / 2));
    const end = text.slice(-Math.floor(maxLength / 2));
    return `${start}...${end}`;
  };

  // Filter A: My Active Offers (Seller OR Destination)
  const myActiveOffers = sellOffers.filter((offer) => {
    const isMeSeller = offer.seller_username === currentUserName;
    const isMeDestination = offer.destination === currentUserAddress;
    return (isMeSeller || isMeDestination) && offer.status === "active";
  });

  // Filter B: All Active Offers Except Mine
  const otherActiveOffers = sellOffers.filter((offer) => {
    const isMeSeller = offer.seller_username === currentUserName;
    const isMeDestination = offer.destination === currentUserAddress;
    return !isMeSeller && !isMeDestination && offer.status === "active";
  });

  return (
    <div className="relative flex flex-col items-center justify-center w-full flex-1 bg-gray-100 dark:bg-gray-900">
      {loading && <Loader />} {/* Display Loader if loading */}
      <div className="max-w-6xl w-full px-4 py-8 mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-200">
            Marketplace
          </h1>
        </div>

        {message && <p className="text-green-500 mb-3">{message}</p>}

        {/* My Sell Offers */}
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
                  className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow hover:shadow-lg transition-shadow"
                >
                  {/* Display NFT Image */}
                  {images[offer.nftoken_id] ? (
                    <img
                      src={images[offer.nftoken_id]}
                      alt={`NFT ${offer.nftoken_id}`}
                      className="w-full h-48 object-cover rounded-md mb-4"
                    />
                  ) : (
                    <div className="w-full h-48 bg-gray-200 dark:bg-gray-700 rounded-md mb-4 flex items-center justify-center">
                      <span className="text-gray-500 dark:text-gray-400">
                        Image non disponible
                      </span>
                    </div>
                  )}

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
                  <div className="flex space-x-2 mt-4">
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
                        <Loader /> // Utilisez le composant Loader ici
                      ) : (
                        "Accepter"
                      )}
                    </button>

                    <button
                      onClick={() => handleCancelOffer(offer.offer_index)}
                      className="flex-1 bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 transition-colors"
                    >
                      Annuler
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* All Sell Offers */}
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
                  className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow hover:shadow-lg transition-shadow"
                >
                  {/* Display NFT Image */}
                  {images[offer.nftoken_id] ? (
                    <img
                      src={images[offer.nftoken_id]}
                      alt={`NFT ${offer.nftoken_id}`}
                      className="w-full h-48 object-cover rounded-md mb-4"
                    />
                  ) : (
                    <div className="w-full h-48 bg-gray-200 dark:bg-gray-700 rounded-md mb-4 flex items-center justify-center">
                      <span className="text-gray-500 dark:text-gray-400">
                        Image non disponible
                      </span>
                    </div>
                  )}

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
