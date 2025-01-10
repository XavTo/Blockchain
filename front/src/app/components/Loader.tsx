"use client";

import React from "react";

const Loader: React.FC = () => {
  return (
    <div className="absolute inset-0 flex items-center justify-center bg-white dark:bg-gray-900 bg-opacity-75 z-50">
      <div className="loader ease-linear rounded-full border-8 border-t-8 border-gray-200 dark:border-gray-700 h-16 w-16"></div>
      <style jsx>{`
        .loader {
          border-top-color: #3498db;
          animation: spin 1s infinite linear;
        }

        @keyframes spin {
          0% {
            transform: rotate(0deg);
          }
          100% {
            transform: rotate(360deg);
          }
        }
      `}</style>
    </div>
  );
};

export default Loader;
