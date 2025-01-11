// src/app/dashboard/page.tsx

"use client";

import React, { useEffect, useState } from "react";
import withAuth from "../hoc/withAuth";
import { useSession } from "next-auth/react";
import Link from "next/link";
import CreateAssetModal from "../components/CreateAssetModal";
import Loader from "../components/Loader"; // Import du Loader

interface WalletInfo {
  address: string;
  public_key: string;
}

interface Asset {
  id: string;
  name: string;
  description: string;
  URI: string;
}

// ─── La fonction de décodage hex -> string ───────────
function hexToStr(hex: string): string {
  if (!hex) return "";
  let str = "";
  for (let i = 0; i < hex.length; i += 2) {
    const code = parseInt(hex.substring(i, i + 2), 16);
    if (!isNaN(code)) {
      str += String.fromCharCode(code);
    }
  }
  return str;
}

// ─── Fonction pour parser la réponse XRPL ────────────
function parseXrplNfts(xrplData: any): Asset[] {
  const accountNfts = xrplData?.result?.account_nfts ?? [];

  return accountNfts.map((nft: any) => {
    const nftId = nft.NFTokenID;
    const hexUri = nft.URI || "";
    const decodedUri = hexToStr(hexUri);

    let name = "NFT sans nom";
    let description = "";
    let imageUrl = "";
    try {
      const jsonUri = JSON.parse(decodedUri);
      if (jsonUri.name) name = jsonUri.name;
      if (jsonUri.description) description = jsonUri.description;
      if (jsonUri.image) imageUrl = jsonUri.image;
    } catch (err) {
      // pas un JSON ?
      name = decodedUri || name;
    }

    return {
      id: nftId,
      name,
      description,
      URI: imageUrl, // on stocke l'image dans URI
    };
  });
}

const DashboardContent = () => {
  const { data: session } = useSession();
  const [wallet, setWallet] = useState<WalletInfo | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [assets, setAssets] = useState<Asset[]>([]);
  const [loading, setLoading] = useState(true);
  const [walletError, setWalletError] = useState<string | null>(null);
  const [assetsError, setAssetsError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    const fetchWalletInfo = async () => {
      try {
        const res = await fetch(`/api/wallet/`, { method: "GET" });
        const data = await res.json();
        if (!res.ok) {
          setWalletError(
            data.error || "Erreur lors de la récupération du portefeuille."
          );
        } else {
          console.log("Wallet data:", data);
          setToken(data.tokens);
          setWallet(data);
        }
      } catch (error) {
        console.error("Erreur lors de la récupération du portefeuille:", error);
        setWalletError("Erreur lors de la récupération du portefeuille.");
      }
    };

    const fetchAssets = async () => {
      try {
        const res = await fetch(`/api/list_assets/`, { method: "GET" });
        const data = await res.json();

        if (!res.ok) {
          setAssetsError(
            data.error || "Erreur lors de la récupération des actifs."
          );
        } else {
          // ICI, on parse la structure XRPL
          const parsedAssets = parseXrplNfts(data);
          setAssets(parsedAssets);
        }
      } catch (error) {
        console.error("Erreur lors de la récupération des actifs:", error);
        setAssetsError("Erreur lors de la récupération des actifs.");
      }
    };

    const fetchData = async () => {
      setLoading(true);
      await Promise.all([fetchWalletInfo(), fetchAssets()]);
      setLoading(false);
    };

    if (session) {
      fetchData();
    }
  }, [session]);

  // Rafraîchir la liste des assets une fois le nouveau NFT créé
  const handleAssetCreated = () => {
    const reloadAssets = async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/list_assets/`, { method: "GET" });
        const data = await res.json();

        if (!res.ok) {
          setAssetsError(
            data.error || "Erreur lors de la récupération des actifs."
          );
        } else {
          const parsedAssets = parseXrplNfts(data);
          setAssets(parsedAssets);
        }
      } catch (error) {
        console.error("Erreur lors de la récupération des actifs:", error);
      } finally {
        setLoading(false);
      }
    };
    reloadAssets();
  };

  return (
    <div className="relative flex flex-col items-center justify-center w-full h-full bg-gray-100 dark:bg-gray-900">
      {loading && <Loader />} {/* Afficher le Loader si loading */}
      <div className="max-w-6xl w-full px-4 py-8">
        {/* Titre principal */}
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-bold text-gray-800 dark:text-gray-200">
            Tableau de Bord
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Gérez vos actifs et consultez les informations de votre
            portefeuille.
          </p>
        </div>

        {/* Bouton pour ouvrir la modal */}
        <div className="mb-6 flex justify-center">
          <button
            onClick={() => setIsModalOpen(true)}
            className="px-6 py-3 bg-blue-500 text-white font-semibold text-lg rounded-lg shadow-md hover:bg-blue-600
                  dark:bg-blue-600 dark:hover:bg-blue-700 transition-colors duration-200"
          >
            Créer un nouvel Asset (NFT)
          </button>
        </div>

        {/* Infos du Portefeuille */}
        <div className="mb-4">
          <h3 className="text-2xl font-semibold text-gray-800 dark:text-gray-200 mb-2">
            Informations du Portefeuille
          </h3>
          <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-lg">
            {walletError ? (
              <p className="text-red-500">{walletError}</p>
            ) : wallet ? (
              <div>
                <p className="mb-2">
                  <span className="font-semibold">Adresse :</span>{" "}
                  {wallet.address}
                </p>
                <p>
                  <span className="font-semibold">Clé Publique :</span>{" "}
                  {wallet.public_key}
                </p>
                <p className="mt-1">
                  <span className="font-semibold">XRP :</span> {token}
                </p>
              </div>
            ) : (
              <p>Aucune information de portefeuille disponible.</p>
            )}
          </div>
        </div>

        {/* Liste des Actifs (NFT) */}
        <div>
          <h3 className="text-2xl font-semibold text-gray-800 dark:text-gray-200 mb-2">
            Vos Actifs
          </h3>
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg">
            {assetsError ? (
              <p className="text-red-500">{assetsError}</p>
            ) : assets.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {assets.map((asset) => (
                  <div
                    key={asset.id}
                    className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg shadow-md hover:shadow-lg transition-shadow"
                  >
                    <h4 className="text-xl font-semibold text-gray-800 dark:text-gray-200 mb-2">
                      {asset.name}
                    </h4>
                    <p className="text-gray-600 dark:text-gray-400">
                      {asset.description || "Pas de description."}
                    </p>
                    {asset.URI && (
                      <img
                        src={asset.URI}
                        alt={asset.name}
                        className="mt-4 w-full h-48 object-cover rounded-md"
                      />
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-600 dark:text-gray-400">
                Aucun actif trouvé.
              </p>
            )}
          </div>
        </div>
      </div>
      <CreateAssetModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onAssetCreated={handleAssetCreated}
      />
    </div>
  );
};

const DashboardPage = withAuth(DashboardContent);
export default DashboardPage;
