import type { Metadata } from "next";
import { Outfit } from "next/font/google";
import "./globals.css";

const outfit = Outfit({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Used Car Price Predictor",
  description: "Premium ML model for predicting Indian used car prices",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className={`${outfit.className} bg-slate-950 text-slate-100 antialiased selection:bg-cyan-500/30`}>
        {children}
      </body>
    </html>
  );
}
