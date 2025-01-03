"use client";

import { useEffect, useState } from "react";

const Dashboard = () => {
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/dashboard")
      .then((res) => {
        if (!res.ok) {
          throw new Error(`Erreur HTTP: ${res.status}`);
        }
        return res.json();
      })
      .then((data) => {
        setDashboardData(data);
        setLoading(false);
      })
      .catch((error) => {
        console.error(
          "Erreur lors de la récupération des données du tableau de bord:",
          error
        );
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <p className="text-gray-700 dark:text-gray-300">
        Chargement du tableau de bord...
      </p>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
      <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-200 mb-4">
        Tableau de Bord
      </h2>
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

export default Dashboard;
