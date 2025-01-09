"use client";

import Link from "next/link";
import { useSession } from "next-auth/react";

const HomePage = () => {
  const { data: session } = useSession();

  const buttonHref = session ? "/dashboard" : "/auth/login";

  return (
    <div className="flex flex-col justify-center items-center text-center flex-1 px-4">
      <h1 className="text-4xl font-bold text-gray-800 dark:text-gray-200 mb-4">
        Bienvenue sur TokenAsset
      </h1>
      <p className="text-lg text-gray-600 dark:text-gray-400 mb-6 max-w-2xl">
        Tokenisez, gérez et échangez vos pièces de monnaie en toute sécurité sur
        le XRP Ledger.
      </p>
      <Link
        href={buttonHref}
        className="inline-block bg-blue-600 text-white px-6 py-3 rounded-full shadow-lg hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 transition"
      >
        Commencer
      </Link>
    </div>
  );
};

export default HomePage;
