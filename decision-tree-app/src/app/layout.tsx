import '../../styles/globals.css';
import { ReactNode } from 'react';

interface RootLayoutProps {
  children: ReactNode;
}

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html lang="pl">
      <head>
        <meta charSet="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      </head>
      <body className="min-h-screen bg-gray-100">
        <header className="p-4 bg-blue-600 text-white text-center">
          <h1 className="text-2xl font-bold">Konstruktor drzewa decyzyjnego</h1>
          <p className="text-sm">Narzędzie do diagnostyki cukrzycy</p>
        </header>
        <main className="container mx-auto px-4 py-8">
          {children}
        </main>
        <footer className="bg-gray-800 text-white py-4 text-center">
          © {new Date().getFullYear()} Diagnostyka Cukrzycy
        </footer>
      </body>
    </html>
  );
}