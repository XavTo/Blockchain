"use client";

import React, { useState } from "react";

interface CreateAssetModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAssetCreated: () => void;
}

const CreateAssetModal: React.FC<CreateAssetModalProps> = ({
  isOpen,
  onClose,
  onAssetCreated,
}) => {
  // Champs de formulaire
  const [assetName, setAssetName] = useState("");
  const [assetDescription, setAssetDescription] = useState("");
  const [imageUrl, setImageUrl] = useState("");

  // Gestion du chargement et des erreurs
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleCreateAsset = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // Construire la payload
      const payload = {
        name: assetName,
        description: assetDescription,
        image: imageUrl, // URL de l'image fournie par l'utilisateur
      };

      // Envoyer la requête POST vers la route Next.js /api/create_asset/
      const res = await fetch("/api/create_asset/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          // On transmet le JSON en tant que string dans "URI"
          // Le backend fera xrpl.utils.str_to_hex(URI) pour minter le NFT
          URI: JSON.stringify(payload),
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Une erreur est survenue lors de la création.");
      } else {
        // Notifier le parent que l'asset a été créé (pour rafraîchir la liste)
        onAssetCreated();
        // Fermer la modal
        onClose();
      }
    } catch (err) {
      console.error("Erreur lors de la création d'asset:", err);
      setError("Erreur réseau. Veuillez réessayer.");
    } finally {
      setLoading(false);
    }
  };

  // Si la modal n’est pas ouverte, on ne rend rien
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg w-full max-w-md">
        <h2 className="text-2xl font-semibold mb-4">
          Créer un nouvel Asset (NFT)
        </h2>
        {error && <p className="text-red-500 mb-4">{error}</p>}

        <form onSubmit={handleCreateAsset} className="space-y-4">
          {/* Champ : Nom de l'Asset */}
          <div>
            <label
              htmlFor="assetName"
              className="block text-gray-700 dark:text-gray-300 mb-1"
            >
              Nom de l'Asset
            </label>
            <input
              id="assetName"
              type="text"
              value={assetName}
              onChange={(e) => setAssetName(e.target.value)}
              placeholder="Mon NFT"
              required
              className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400"
            />
          </div>

          {/* Champ : Description de l'Asset */}
          <div>
            <label
              htmlFor="assetDescription"
              className="block text-gray-700 dark:text-gray-300 mb-1"
            >
              Description
            </label>
            <textarea
              id="assetDescription"
              value={assetDescription}
              onChange={(e) => setAssetDescription(e.target.value)}
              placeholder="Décrivez votre NFT..."
              required
              rows={3}
              className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400"
            />
          </div>

          {/* Champ : URL de l'Image */}
          <div>
            <label
              htmlFor="assetImageUrl"
              className="block text-gray-700 dark:text-gray-300 mb-1"
            >
              URL de l'Image
            </label>
            <input
              id="assetImageUrl"
              type="url"
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              placeholder="https://example.com/image.jpg"
              required
              className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400"
            />
          </div>

          {/* Boutons */}
          <div className="flex justify-end space-x-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-gray-300 dark:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-400 dark:hover:bg-gray-500"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={loading}
              className={`px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 transition-colors duration-200 ${
                loading ? "opacity-50 cursor-not-allowed" : ""
              }`}
            >
              {loading ? "Création..." : "Créer"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateAssetModal;
