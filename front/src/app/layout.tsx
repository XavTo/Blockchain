// src/app/layout.tsx

import "./globals.css";
import { Metadata } from "next";
import ClientLayout from "./clientLayout";

export const metadata: Metadata = {
  title: "Plateforme de Gestion d'Actifs Tokenisés",
  description: "Tokenisez et échangez vos actifs sur le XRP Ledger",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr">
      <body className="h-screen flex flex-col transition-colors duration-300 bg-gray-100 dark:bg-gray-900 text-gray-800 dark:text-gray-100">
        <ClientLayout>{children}</ClientLayout>
      </body>
    </html>
  );
}
