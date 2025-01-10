"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { signIn } from "next-auth/react";
import { FiEye, FiEyeOff } from "react-icons/fi";

const RegisterPage = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const router = useRouter();
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  const toggleShowPassword = () => {
    setShowPassword((prev) => !prev);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/register/`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ username, password }),
        }
      );

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Erreur lors de l'inscription.");
        setLoading(false);
      } else {
        setSuccess("Inscription réussie ! Connexion automatique...");

        const signInResult = await signIn("credentials", {
          redirect: false,
          username,
          password,
        });

        if (signInResult?.error) {
          setError(
            "Inscription réussie, mais erreur lors de la connexion automatique."
          );
          setLoading(false);
        } else {
          router.push("/dashboard");
        }
      }
    } catch (err) {
      setError("Erreur de connexion au serveur.");
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col justify-center items-center text-center flex-1 px-4 bg-gray-100 dark:bg-gray-900">
      <div className="w-full max-w-md p-8 space-y-6 bg-white dark:bg-gray-800 rounded-lg shadow-md">
        <h2 className="text-2xl font-bold text-center text-gray-800 dark:text-gray-200">
          Inscription
        </h2>
        {error && (
          <p className="px-4 py-2 text-red-500 bg-red-100 rounded">{error}</p>
        )}
        {success && (
          <p className="px-4 py-2 text-green-500 bg-green-100 rounded">
            {success}
          </p>
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
            disabled={loading}
            className={`w-full px-4 py-2 text-white bg-blue-600 rounded-md hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 transition-colors duration-200 ${
              loading ? "opacity-50 cursor-not-allowed" : ""
            }`}
          >
            {loading ? "Inscription en cours..." : "S'inscrire"}
          </button>
        </form>
        <p className="text-center text-gray-600 dark:text-gray-400">
          Déjà un compte ?{" "}
          <Link
            href="/auth/login"
            className="text-blue-600 dark:text-blue-400 hover:underline"
          >
            Connectez-vous
          </Link>
        </p>
      </div>
    </div>
  );
};

export default RegisterPage;
