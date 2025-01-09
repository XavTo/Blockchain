// src/app/utils/axiosInstance.tsx

import axios from "axios";
import { getSession } from "next-auth/react";

const axiosInstance = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL, // Définissez l'URL de base de votre backend
  headers: {
    "Content-Type": "application/json",
  },
});

// Ajouter un intercepteur pour inclure automatiquement le JWT
axiosInstance.interceptors.request.use(
  async (config) => {
    const session = await getSession();

    if (session?.user?.jwt) {
      config.headers.Authorization = `Bearer ${session.user.jwt}`;
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default axiosInstance;
