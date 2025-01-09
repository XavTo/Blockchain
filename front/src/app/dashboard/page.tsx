// src/app/dashboard/page.tsx

"use client";

import React, { useEffect, useState } from "react";
import withAuth from "../hoc/withAuth";
import { signOut, useSession } from "next-auth/react";
import axiosInstance from "../utils/axiosIntance";

const DashboardContent = () => {
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const { data: session } = useSession();

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const res = await axiosInstance.get("/api/dashboard");
        setDashboardData(res.data);
        setLoading(false);
      } catch (error) {
        console.error(
          "Erreur lors de la récupération des données du tableau de bord:",
          error
        );
        setLoading(false);
      }
    };

    if (session) {
      fetchDashboardData();
    }
  }, [session]);

  if (loading) {
    return (
      <p className="text-gray-700 dark:text-gray-300">
        Chargement du tableau de bord...
      </p>
    );
  }

  return (
    // On limite la largeur du contenu du Dashboard, et on ajoute un peu de marge
    <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6 max-w-4xl w-full mx-auto">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-200">
          Tableau de Bord
        </h2>
        <button
          onClick={() => signOut()}
          className="px-4 py-2 text-white bg-red-600 rounded hover:bg-red-700 dark:bg-red-500 dark:hover:bg-red-600"
        >
          Se Déconnecter
        </button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {dashboardData ? (
          <>
            <div className="bg-blue-100 dark:bg-blue-900 p-4 rounded-lg">
              <h3 className="text-xl font-semibold text-blue-700 dark:text-blue-300">
                Total Pièces Tokenisées
              </h3>
              <p className="text-3xl font-bold text-blue-900 dark:text-blue-100">
                {dashboardData.totalAssets}
              </p>
            </div>
            <div className="bg-green-100 dark:bg-green-900 p-4 rounded-lg">
              <h3 className="text-xl font-semibold text-green-700 dark:text-green-300">
                Pièces en Vente
              </h3>
              <p className="text-3xl font-bold text-green-900 dark:text-green-100">
                {dashboardData.assetsForSale}
              </p>
            </div>
            <div className="bg-yellow-100 dark:bg-yellow-900 p-4 rounded-lg">
              <h3 className="text-xl font-semibold text-yellow-700 dark:text-yellow-300">
                Pièces Échangées
              </h3>
              <p className="text-3xl font-bold text-yellow-900 dark:text-yellow-100">
                {dashboardData.assetsExchanged}
              </p>
            </div>
          </>
        ) : (
          <p className="text-gray-700 dark:text-gray-300">
            Aucune donnée disponible pour le tableau de bord.
          </p>
        )}
      </div>
    </div>
  );
};

const DashboardPage = withAuth(DashboardContent);

export default DashboardPage;
