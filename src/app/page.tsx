// src/app/page.tsx
import Link from "next/link";
import Image from "next/image";

const HomePage = () => {
  return (
    <div className="flex flex-col items-center text-center">
      <div className="mb-8">
        <Image
          src="/images/tokenization.svg"
          alt="Tokenisation"
          width={300}
          height={300}
          priority
        />
      </div>
      <h1 className="text-4xl font-bold text-gray-800 dark:text-gray-200 mb-4">
        Bienvenue sur TokenAsset
      </h1>
      <p className="text-lg text-gray-600 dark:text-gray-400 mb-6 max-w-2xl">
        Tokenisez, gérez et échangez vos pièces de monnaie en toute sécurité sur
        le XRP Ledger.
      </p>
      <Link
        href="/dashboard"
        className="inline-block bg-blue-600 text-white px-6 py-3 rounded-full shadow-lg hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 transition"
      >
        Commencer
      </Link>
    </div>
  );
};

export default HomePage;
