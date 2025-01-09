// src/app/clientLayout.tsx

"use client";

import { SessionProvider } from "next-auth/react";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import { ThemeProvider } from "./components/ThemeContext";

const ClientLayout = ({ children }: { children: React.ReactNode }) => {
  return (
    <SessionProvider>
      <ThemeProvider>
        <Navbar />
        <main className="flex flex-1 flex-col items-center justify-center w-full">
          {children}
        </main>
        <Footer />
      </ThemeProvider>
    </SessionProvider>
  );
};

export default ClientLayout;
