// src/app/components/Navbar.tsx

"use client";

import Link from "next/link";
import { useTheme } from "./ThemeContext";
import { useSession, signOut } from "next-auth/react";

const Navbar = () => {
  const { theme, toggleTheme } = useTheme();
  const { data: session } = useSession();

  return (
    <nav className="bg-white dark:bg-gray-800 shadow">
      <div className="container mx-auto px-4 py-4 flex justify-between items-center">
        <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
          <Link href="/">TokenAsset</Link>
        </div>
        <div className="hidden md:flex space-x-6 items-center">
          {session && (
            <>
              <Link
                href="/dashboard"
                className="text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 transition"
              >
                Tableau de Bord
              </Link>
              <Link
                href="/assets"
                className="text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 transition"
              >
                Pièces
              </Link>
              <Link
                href="/trade"
                className="text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 transition"
              >
                Échanger
              </Link>
            </>
          )}
          <button
            onClick={toggleTheme}
            className="ml-4 p-2 rounded-full bg-gray-200 dark:bg-gray-600 text-gray-800 dark:text-gray-200 focus:outline-none"
            aria-label="Toggle Theme"
          >
            {theme === "light" ? "🌙" : "☀️"}
          </button>
          {session ? (
            <div className="flex items-center space-x-4">
              <span className="text-gray-800 dark:text-gray-200">
                Bonjour, {session.user.username}
              </span>
              <button
                onClick={() => signOut()}
                className="px-4 py-2 text-white bg-red-600 rounded hover:bg-red-700 dark:bg-red-500 dark:hover:bg-red-600"
              >
                Se Déconnecter
              </button>
            </div>
          ) : null}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
