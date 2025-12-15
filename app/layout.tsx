import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Åre Sessions - Rider Builder",
  description: "Skapa din perfekta festival rider och matcha med produkter",
  keywords: ["åre sessions", "rider", "festival", "mat", "dryck"],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="sv">
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}

