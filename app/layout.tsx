import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import ParticlesBackground from "@/components/ParticlesBackground";
import { SplashScreen } from '@/components/SplashScreen';
import QueryProvider from "./QueryProvider"; // ✅ Import Client Component
import "./globals.css";
import { Toaster } from 'react-hot-toast';
import { WalletProvider } from '@/components/Faucet/walletcontext'; // Thêm WalletProvider
import { SettingsProvider } from "@/components/context/SettingsContext";
const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = { 
  title: "CryptoPath",
  description: "Create by members of group 3 - Navigate the world of blockchain with CryptoPath",
  icons: {
    icon: "/favicon.ico",
  },
  openGraph: {
    title: "CryptoPath",
    description: "Create by members of group 3 - Navigate the world of blockchain with CryptoPath",
    images: [
      {
        url: '/og-image.jpg',
        width: 1200,
        height: 630,
        alt: 'CryptoPath - Blockchain Explorer',
      }
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: "CryptoPath",
    description: "Create by members of group 3 - Navigate the world of blockchain with CryptoPath",
    images: ['/og-image.jpg'],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <SettingsProvider> {/* ✅ Bọc bên trong Client Component */}
        <WalletProvider> {/* Bao bọc bằng WalletProvider */}
          <QueryProvider> {/* ✅ Bọc bên trong Client Component */}
            <SplashScreen />
            <Header />
            {children}
            <Toaster position="top-center" />
            <Footer />
          </QueryProvider>
        </WalletProvider>
        </SettingsProvider>
      </body>
    </html>
  );
}