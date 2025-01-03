"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type Asset = {
  id: number;
  name: string;
  image: string;
  price: string;
};

const Assets = () => {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/assets")
      .then((res) => {
        if (!res.ok) {
          throw new Error(`Erreur HTTP: ${res.status}`);
        }
        return res.json();
      })
      .then((data) => {
        setAssets(data.assets);
        setLoading(false);
      })
      .catch((error) => {
        console.error("Erreur lors de la récupération des actifs:", error);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <p className="text-gray-700 dark:text-gray-300">
        Chargement des actifs...
      </p>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
      <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-200 mb-4">
        Mes Pièces Tokenisées
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {assets.length > 0 ? (
          assets.map((asset) => (
            <div
              key={asset.id}
              className="border dark:border-gray-700 rounded-lg overflow-hidden shadow-sm hover:shadow-md transition"
            >
              <img
                src={asset.image}
                alt={asset.name}
                className="w-full h-48 object-cover"
              />
              <div className="p-4">
                <h3 className="text-xl font-semibold text-gray-700 dark:text-gray-300">
                  {asset.name}
                </h3>
                <p className="mt-2 text-gray-600 dark:text-gray-400">
                  Prix : {asset.price}
                </p>
                <Link
                  href={`/assets/${asset.id}`}
                  className="mt-4 inline-block bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 transition"
                >
                  Voir Détails
                </Link>
              </div>
            </div>
          ))
        ) : (
          <p className="text-gray-700 dark:text-gray-300">
            Aucune pièce tokenisée disponible.
          </p>
        )}
      </div>
    </div>
  );
};

export default Assets;
