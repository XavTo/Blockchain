"use client";

import { useEffect, useState } from "react";

const Trade = () => {
  const [assets, setAssets] = useState<any[]>([]);
  const [selectedAsset, setSelectedAsset] = useState<string>("");
  const [quantity, setQuantity] = useState<number>(0);
  const [message, setMessage] = useState<string>("");

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
      })
      .catch((error) => {
        console.error("Erreur lors de la récupération des actifs:", error);
      });
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetch("/api/trade", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ asset: selectedAsset, quantity }),
    })
      .then((res) => res.json())
      .then((data) => {
        setMessage(data.message);
        setQuantity(0);
        setSelectedAsset("");
      })
      .catch((error) => {
        console.error("Erreur lors de l'échange:", error);
        setMessage("Erreur lors de l'échange. Veuillez réessayer.");
      });
  };

  return (
    <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
      <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-200 mb-4">
        Échanger des Tokens
      </h2>
      <form className="space-y-4" onSubmit={handleSubmit}>
        <div>
          <label
            htmlFor="asset"
            className="block text-gray-700 dark:text-gray-300"
          >
            Actif à Échanger
          </label>
          <select
            id="asset"
            name="asset"
            value={selectedAsset}
            onChange={(e) => setSelectedAsset(e.target.value)}
            required
            className="mt-1 block w-full border border-gray-300 dark:border-gray-700 rounded-md p-2 bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200"
          >
            <option value="">Sélectionner un actif</option>
            {assets.map((asset) => (
              <option key={asset.id} value={asset.name}>
                {asset.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label
            htmlFor="quantity"
            className="block text-gray-700 dark:text-gray-300"
          >
            Quantité
          </label>
          <input
            type="number"
            id="quantity"
            name="quantity"
            value={quantity}
            onChange={(e) => setQuantity(parseInt(e.target.value))}
            required
            min={1}
            className="mt-1 block w-full border border-gray-300 dark:border-gray-700 rounded-md p-2 bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200"
          />
        </div>
        <button
          type="submit"
          className="w-full bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 dark:bg-green-500 dark:hover:bg-green-600 transition"
        >
          Échanger
        </button>
      </form>
      {message && (
        <p className="mt-4 text-green-600 dark:text-green-400">{message}</p>
      )}
    </div>
  );
};

export default Trade;
