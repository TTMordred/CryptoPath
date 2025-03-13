/**
 * Main layout configuration for the CryptoPath application
 * This file defines the root structure and global providers used across the app
 */
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
// Core layout components
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import ParticlesBackground from "@/components/ParticlesBackground";
import { SplashScreen } from '@/components/SplashScreen';
// State management and context providers
import QueryProvider from "./QueryProvider"; // Data fetching provider
import "./globals.css";
import { Toaster } from 'react-hot-toast'; // Toast notification system
import { WalletProvider } from '@/components/Faucet/walletcontext'; // Blockchain wallet context
import { AuthProvider } from '@/lib/context/AuthContext'; // Authentication context

/**
 * Geist Sans font configuration
 * A modern, minimalist sans-serif typeface for primary text content
 */
const geistSans = Geist({
  variable: "--font-geist-sans", // CSS variable name for font-family access
  subsets: ["latin"],           // Character subset for optimization
});

/**
 * Geist Mono font configuration
 * A monospace variant for code blocks and technical content
 */
const geistMono = Geist_Mono({
  variable: "--font-geist-mono", // CSS variable name for font-family access
  subsets: ["latin"],            // Character subset for optimization
});

/**
 * Metadata configuration for the CryptoPath application.
 * [existing comment preserved]
 */
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

/**
 * Root layout component that wraps the entire application
 * Establishes the provider hierarchy for global state and context
 * 
 * @param children - The page content to render within the layout
 */
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        {/* AuthProvider - Manages user authentication state */}
        <AuthProvider>
          {/* WalletProvider - Manages blockchain wallet connections and state */}
          <WalletProvider>
            {/* QueryProvider - Handles data fetching and caching */}
            <QueryProvider>
              {/* Application UI components */}
              <SplashScreen /> {/* Initial loading screen */}
              <Header /> {/* Global navigation */}
              {children} {/* Page-specific content */}
              <Toaster position="top-center" /> {/* Toast notification container */}
              <Footer /> {/* Global footer */}
            </QueryProvider>
          </WalletProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
