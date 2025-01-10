// src/app/dashboard/page.tsx

"use client";

import React, { useEffect, useState } from "react";
import withAuth from "../hoc/withAuth";
import { useSession } from "next-auth/react";
import Link from "next/link";
import CreateAssetModal from "../components/CreateAssetModal";

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

  if (loading) {
    return (
      <div className="flex items-center justify-center px-4 py-8 bg-gray-100 dark:bg-gray-900">
        <p className="text-gray-700 dark:text-gray-300">
          Chargement du tableau de bord...
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center px-4 py-8 bg-gray-100 dark:bg-gray-900 flex-grow">
      <div className="w-full max-w-6xl bg-white dark:bg-gray-800 shadow rounded-lg p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-3xl font-bold text-gray-800 dark:text-gray-200">
            Tableau de Bord
          </h2>
          <Link
            href="/"
            className="text-blue-600 dark:text-blue-400 hover:underline"
          >
            Retour à l'accueil
          </Link>
        </div>

        {/* Bouton pour ouvrir la modal */}
        <div className="mb-4">
          <button
            onClick={() => setIsModalOpen(true)}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600
                     dark:bg-blue-600 dark:hover:bg-blue-700 transition-colors duration-200"
          >
            Créer un nouvel Asset (NFT)
          </button>
        </div>

        {/* Infos du Portefeuille */}
        <div className="mb-8">
          <h3 className="text-2xl font-semibold text-gray-700 dark:text-gray-300 mb-4">
            Informations du Portefeuille
          </h3>
          {walletError ? (
            <p className="text-red-500">{walletError}</p>
          ) : wallet ? (
            <div className="bg-gray-100 dark:bg-gray-700 p-4 rounded-lg">
              <p>
                <span className="font-semibold">Adresse :</span>{" "}
                {wallet.address}
              </p>
              <p>
                <span className="font-semibold">Clé Publique :</span>{" "}
                {wallet.public_key}
              </p>
            </div>
          ) : (
            <p>Aucune information de portefeuille disponible.</p>
          )}
        </div>

        {/* Liste des Actifs (NFT) */}
        <div>
          <h3 className="text-2xl font-semibold text-gray-700 dark:text-gray-300 mb-4">
            Vos Actifs
          </h3>
          {assetsError ? (
            <p className="text-red-500">{assetsError}</p>
          ) : assets.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
              {assets.map((asset) => (
                <div
                  key={asset.id}
                  className="bg-gray-100 dark:bg-gray-700 p-4 rounded-lg shadow"
                >
                  <h4 className="text-xl font-semibold text-gray-800 dark:text-gray-200">
                    {asset.name}
                  </h4>
                  <p className="text-gray-600 dark:text-gray-400">
                    {asset.description || "Pas de description."}
                  </p>
                  {asset.URI && (
                    <img
                      src={asset.URI}
                      alt={asset.name}
                      className="mt-2 w-full h-48 object-cover rounded"
                    />
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p>Aucun actif trouvé.</p>
          )}
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
