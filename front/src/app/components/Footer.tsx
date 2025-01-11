// src/app/components/Footer.tsx
const Footer = () => {
  return (
    <footer className="bg-white dark:bg-gray-800 shadow mt-8">
      <div className="container mx-auto px-4 py-4 text-center text-gray-600 dark:text-gray-400">
        © {new Date().getFullYear()} NFTCoin. Tous droits réservés.
      </div>
    </footer>
  );
};

export default Footer;
