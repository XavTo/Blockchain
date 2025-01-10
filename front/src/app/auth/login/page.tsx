"use client";

import { signIn } from "next-auth/react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { FiEye, FiEyeOff } from "react-icons/fi";

const LoginPage: React.FC = () => {
  const [username, setUsername] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const router = useRouter();
  const [error, setError] = useState<string>("");

  const toggleShowPassword = () => {
    setShowPassword((prev) => !prev);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    try {
      const res = await signIn("credentials", {
        redirect: false,
        username,
        password,
      });

      if (res?.error) {
        setError("Nom d'utilisateur ou mot de passe incorrect.");
      } else {
        router.push("/dashboard");
      }
    } catch (err) {
      setError("Une erreur est survenue. Veuillez réessayer.");
    }
  };

  return (
    <div className="flex flex-col justify-center items-center text-center flex-1 px-4 bg-gray-100 dark:bg-gray-900">
      <div className="w-full max-w-md p-8 space-y-6 bg-white dark:bg-gray-800 rounded-lg shadow-md">
        <h2 className="text-2xl font-bold text-center text-gray-800 dark:text-gray-200">
          Connexion
        </h2>
        {error && (
          <p className="px-4 py-2 text-red-500 bg-red-100 rounded">{error}</p>
        )}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label
              htmlFor="username"
              className="block text-gray-700 dark:text-gray-300"
            >
              Nom d'utilisateur
            </label>
            <input
              type="text"
              id="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              className="w-full px-3 py-2 mt-1 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400"
            />
          </div>
          <div className="relative">
            <label
              htmlFor="password"
              className="block text-gray-700 dark:text-gray-300"
            >
              Mot de passe
            </label>
            <input
              type={showPassword ? "text" : "password"}
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full px-3 py-2 mt-1 pr-10 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400"
            />
            <button
              type="button"
              onClick={toggleShowPassword}
              className="absolute inset-y-8 right-3 flex items-center justify-center w-8 h-8 text-gray-600 dark:text-gray-300 focus:outline-none"
              aria-label={
                showPassword
                  ? "Cacher le mot de passe"
                  : "Afficher le mot de passe"
              }
            >
              {showPassword ? <FiEyeOff size={20} /> : <FiEye size={20} />}
            </button>
          </div>
          <button
            type="submit"
            className="w-full px-4 py-2 text-white bg-blue-600 rounded-md hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 transition-colors duration-200"
          >
            Se Connecter
          </button>
        </form>
        <p className="text-center text-gray-600 dark:text-gray-400">
          Pas encore de compte ?{" "}
          <Link
            href="/auth/register"
            className="text-blue-600 dark:text-blue-400 hover:underline"
          >
            Inscrivez-vous
          </Link>
        </p>
      </div>
    </div>
  );
};

export default LoginPage;
