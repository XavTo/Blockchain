// src/app/api/auth/[...nextauth]/route.ts

import NextAuth, { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";

// Définir les options de NextAuth
const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        username: { label: "Nom d'utilisateur", type: "text" },
        password: { label: "Mot de passe", type: "password" },
      },
      async authorize(credentials) {
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/api/login/`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              username: credentials?.username,
              password: credentials?.password,
            }),
          }
        );
        if (!res.ok) {
          return null;
        }

        const user = await res.json();
        // Vérifier que l'utilisateur contient les propriétés nécessaires
        if (user && user.username && user.jwt) {
          return user;
        }

        return null;
      },
    }),
  ],
  session: {
    strategy: "jwt",
  },
  callbacks: {
    async jwt({ token, user }) {
      // `user` est l'objet renvoyé par le backend (/api/login/ ou /api/register/)
      if (user) {
        token.id = typeof user.id === "string" ? parseInt(user.id) : user.id;
        token.username = user.username;
        token.jwt = user.jwt;

        // Ajouter les nouveaux champs
        if (user.address) {
          token.address = user.address;
        }
        if (user.public_key) {
          token.public_key = user.public_key;
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (token) {
        session.user = {
          id: token.id as number,
          username: token.username as string,
          jwt: token.jwt as string,

          // Ajouter dans la session
          address: token.address as string,
          public_key: token.public_key as string,
        };
      }
      return session;
    },
  },
  pages: {
    signIn: "/auth/login",
  },
  secret: process.env.NEXTAUTH_SECRET,
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
