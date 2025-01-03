// src/app/layout.tsx (Server Component)
import "./globals.css";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import { ThemeProvider } from "./components/ThemeContext";

export const metadata = {
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
      <body className="flex flex-col min-h-screen transition-colors duration-300 bg-gray-100 dark:bg-gray-900 text-gray-800 dark:text-gray-100">
        <ThemeProvider>
          <Navbar />
          <main className="flex-grow container mx-auto px-4 py-8">
            {children}
          </main>
          <Footer />
        </ThemeProvider>
      </body>
    </html>
  );
}
