"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/legacy/image";
import { motion } from "framer-motion";
import { ArrowUp, ChevronRight, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

const Footer = () => {
  const [showBackToTop, setShowBackToTop] = useState(false);
  
  // Email subscription states (matching page.tsx approach)
  const [email, setEmail] = useState('');
  const [emailError, setEmailError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  
  // Toggle back-to-top button visibility based on scroll position
  useEffect(() => {
    const handleScroll = () => {
      setShowBackToTop(window.scrollY > 500);
    };
    
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Email change handler
  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEmail(e.target.value);
    setEmailError('');
    setIsSuccess(false);
  };

  // Subscribe handler (matches page.tsx approach)
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Email validation
    if (!email) {
      setEmailError("Email is required");
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setEmailError("Please enter a valid email address");
      return;
    }

    try {
      setIsSubmitting(true);
      
      // Call API to register email
      const response = await fetch('/api/subscribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, source: 'footer' }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to subscribe");
      }

      // Handle success
      setEmail('');
      setIsSuccess(true);
      toast.success("Thanks for subscribing! You'll receive our updates soon.");
      
    } catch (error) {
      console.error('Subscription error:', error);
      toast.error(error instanceof Error ? error.message : "Subscription failed. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Scroll to top handler
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <footer className="relative bg-gradient-to-b from-black to-red-900/80 text-white pt-12 pb-6 border-t border-gray-800/40">
      <div className="container mx-auto px-4">
        {/* Top Section: Featured Content + Newsletter */}
        <div className="flex flex-col lg:flex-row justify-between items-center gap-10 mb-10">
          {/* Branding Side */}
          <div className="w-full lg:w-1/2 space-y-6">
            <div className="flex items-center">
              <Image
                src="/Img/logo/logo2.png"
                alt="CryptoPath Logo"
                width={50}
                height={50}
                className="mr-2"
              />
              <Link href="/" className="text-3xl font-bold">
                Crypto<span className="text-[#F5B056]">Path<sub>&copy;</sub></span>
              </Link>
            </div>
            
            <p className="text-gray-300 max-w-md">
              Your gateway to blockchain insights. Track transactions, explore markets, and discover NFTs with our comprehensive crypto explorer.
            </p>
            
            <div className="flex space-x-4">
              <Link href="https://facebook.com" passHref>
                <Button variant="outline" size="icon" className="rounded-full">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M22.675 0h-21.35C.6 0 0 .6 0 1.337v21.326C0 23.4.6 24 1.325 24H12.82v-9.294H9.692V11.41h3.127V8.805c0-3.1 1.893-4.788 4.659-4.788 1.325 0 2.463.099 2.795.143v3.24l-1.918.001c-1.504 0-1.794.715-1.794 1.763v2.313h3.587l-.467 3.297h-3.12V24h6.116c.725 0 1.325-.6 1.325-1.337V1.337C24 .6 23.4 0 22.675 0z"/>
                  </svg>
                </Button>
              </Link>
              <Link href="https://twitter.com" passHref>
                <Button variant="outline" size="icon" className="rounded-full">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M24 4.557a9.83 9.83 0 0 1-2.828.775A4.932 4.932 0 0 0 23.337 3.1a9.865 9.865 0 0 1-3.127 1.195A4.92 4.92 0 0 0 16.616 3c-2.728 0-4.942 2.208-4.942 4.927 0 .386.045.762.127 1.124C7.728 8.86 4.1 6.81 1.671 3.885a4.93 4.93 0 0 0-.666 2.475c0 1.706.87 3.213 2.19 4.096a4.904 4.904 0 0 1-2.236-.616v.062c0 2.385 1.693 4.374 3.946 4.827a4.935 4.935 0 0 1-2.224.085c.626 1.956 2.444 3.379 4.6 3.418A9.868 9.868 0 0 1 0 19.54a13.944 13.944 0 0 0 7.548 2.212c9.058 0 14.01-7.513 14.01-14.01 0-.213-.005-.426-.014-.637A10.012 10.012 0 0 0 24 4.557z"/>
                  </svg>
                </Button>
              </Link>
              <Link href="https://github.com/TTMordred/COS30049-CryptoPath" passHref>
                <Button variant="outline" size="icon" className="rounded-full">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                  </svg>
                </Button>
              </Link>
              <Link href="https://discord.com" passHref>
                <Button variant="outline" size="icon" className="rounded-full">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M20.317 4.3698a19.7913 19.7913 0 00-4.8851-1.5152.0741.0741 0 00-.0785.0371c-.211.3753-.4447.8648-.6083 1.2495-1.8447-.2762-3.68-.2762-5.4868 0-.1636-.3933-.4058-.8742-.6177-1.2495a.077.077 0 00-.0785-.037 19.7363 19.7363 0 00-4.8852 1.515.0699.0699 0 00-.0321.0277C.5334 9.0458-.319 13.5799.0992 18.0578a.0824.0824 0 00.0312.0561c2.0528 1.5076 4.0413 2.4228 5.9929 3.0294a.0777.0777 0 00.0842-.0276c.4616-.6304.8731-1.2952 1.2262-1.9942a.076.076 0 00-.0416-.1057c-.6528-.2476-1.2743-.5495-1.8722-.8923a.077.077 0 01-.0076-.1277c.1258-.0943.2517-.1923.3718-.2914a.0743.0743 0 01.0776-.0105c3.9278 1.7933 8.18 1.7933 12.0614 0a.0739.0739 0 01.0785.0095c.1202.099.246.1981.3728.2924a.077.077 0 01-.0066.1276 12.2986 12.2986 0 01-1.873.8914.0766.0766 0 00-.0407.1067c.3604.698.7719 1.3628 1.225 1.9932a.076.076 0 00.0842.0286c1.961-.6067 3.9495-1.5219 6.0023-3.0294a.077.077 0 00.0313-.0552c.5004-5.177-.8382-9.6739-3.5485-13.6604a.061.061 0 00-.0312-.0286zM8.02 15.3312c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9555-2.4189 2.157-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.9555 2.4189-2.1569 2.4189zm7.9748 0c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9554-2.4189 2.1569-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.946 2.4189-2.1568 2.4189Z"/>
                  </svg>
                </Button>
              </Link>
            </div>
          </div>
          
          {/* Newsletter Side */}
          <div className="w-full lg:w-1/2">
            <div className="bg-gradient-to-r from-black/70 to-red-950/40 p-6 rounded-xl border border-gray-800/50">
              <h3 className="text-xl font-bold text-[#F5B056] mb-2">Stay Updated</h3>
              <p className="text-gray-300 mb-4">
                Get the latest news, updates and crypto insights delivered straight to your inbox.
              </p>
              <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3">
                <div className="flex-grow">
                  <div className="relative">
                    <Input
                      type="email"
                      placeholder="Your email address"
                      value={email}
                      onChange={handleEmailChange}
                      disabled={isSubmitting}
                      className={`bg-black/50 border ${
                        emailError ? 'border-red-500' : isSuccess ? 'border-green-500' : 'border-gray-700'
                      } text-white`}
                    />
                    {emailError && (
                      <p className="text-red-500 text-xs mt-1 absolute">{emailError}</p>
                    )}
                    {isSuccess && (
                      <p className="text-green-500 text-xs mt-1 absolute">Subscribed successfully!</p>
                    )}
                  </div>
                </div>
                <Button 
                  type="submit" 
                  disabled={isSubmitting}
                  className="bg-[#F5B056] hover:bg-[#ff6500] text-black whitespace-nowrap"
                >
                  {isSubmitting ? "Subscribing..." : "Subscribe"}
                </Button>
              </form>
            </div>
          </div>
        </div>
        
        {/* Main Navigation Links */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-12">
          {/* Platform Links */}
          <div>
            <h3 className="text-[#F5B056] font-bold text-lg mb-4">Platform</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/market-overview" className="flex items-center text-gray-300 hover:text-[#F5B056] transition">
                  <ChevronRight size={16} className="mr-1" />
                  <span>Market Overview</span>
                </Link>
              </li>
              <li>
                <Link href="/pricetable" className="flex items-center text-gray-300 hover:text-[#F5B056] transition">
                  <ChevronRight size={16} className="mr-1" />
                  <span>Price Table</span>
                </Link>
              </li>
              <li>
                <Link href="/transactions" className="flex items-center text-gray-300 hover:text-[#F5B056] transition">
                  <ChevronRight size={16} className="mr-1" />
                  <span>Transactions</span>
                </Link>
              </li>
              <li>
                <Link href="/NFT" className="flex items-center text-gray-300 hover:text-[#F5B056] transition">
                  <ChevronRight size={16} className="mr-1" />
                  <span>NFT Explorer</span>
                </Link>
              </li>
              <li>
                <Link href="/search" className="flex items-center text-gray-300 hover:text-[#F5B056] transition">
                  <ChevronRight size={16} className="mr-1" />
                  <span>Blockchain Search</span>
                </Link>
              </li>
            </ul>
          </div>
          
          {/* Resources */}
          <div>
            <h3 className="text-[#F5B056] font-bold text-lg mb-4">Resources</h3>
            <ul className="space-y-2">
              <li>
                <Link href="#" className="flex items-center text-gray-300 hover:text-[#F5B056] transition">
                  <ChevronRight size={16} className="mr-1" />
                  <span>Documentation</span>
                </Link>
              </li>
              <li>
                <Link href="#" className="flex items-center text-gray-300 hover:text-[#F5B056] transition">
                  <ChevronRight size={16} className="mr-1" />
                  <span>API Reference</span>
                </Link>
              </li>
              <li>
                <Link href="#" className="flex items-center text-gray-300 hover:text-[#F5B056] transition">
                  <ChevronRight size={16} className="mr-1" />
                  <span>Blog</span>
                </Link>
              </li>
              <li>
                <Link href="#" className="flex items-center text-gray-300 hover:text-[#F5B056] transition">
                  <ChevronRight size={16} className="mr-1" />
                  <span>Learning Hub</span>
                </Link>
              </li>
              <li>
                <Link href="mailto:cryptopath@gmail.com" className="flex items-center text-gray-300 hover:text-[#F5B056] transition">
                  <ChevronRight size={16} className="mr-1" />
                  <span>Support</span>
                </Link>
              </li>
            </ul>
          </div>
          
          {/* Company */}
          <div>
            <h3 className="text-[#F5B056] font-bold text-lg mb-4">Company</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/aboutus" className="flex items-center text-gray-300 hover:text-[#F5B056] transition">
                  <ChevronRight size={16} className="mr-1" />
                  <span>About Us</span>
                </Link>
              </li>
              <li>
                <Link href="#" className="flex items-center text-gray-300 hover:text-[#F5B056] transition">
                  <ChevronRight size={16} className="mr-1" />
                  <span>Team</span>
                </Link>
              </li>
              <li>
                <Link href="#" className="flex items-center text-gray-300 hover:text-[#F5B056] transition">
                  <ChevronRight size={16} className="mr-1" />
                  <span>Careers</span>
                </Link>
              </li>
              <li>
                <Link href="#" className="flex items-center text-gray-300 hover:text-[#F5B056] transition">
                  <ChevronRight size={16} className="mr-1" />
                  <span>Press</span>
                </Link>
              </li>
              <li>
                <Link href="#" className="flex items-center text-gray-300 hover:text-[#F5B056] transition">
                  <ChevronRight size={16} className="mr-1" />
                  <span>Contact</span>
                </Link>
              </li>
            </ul>
          </div>
          
          {/* Legal */}
          <div>
            <h3 className="text-[#F5B056] font-bold text-lg mb-4">Legal</h3>
            <ul className="space-y-2">
              <li>
                <Link href="#" className="flex items-center text-gray-300 hover:text-[#F5B056] transition">
                  <ChevronRight size={16} className="mr-1" />
                  <span>Terms of Service</span>
                </Link>
              </li>
              <li>
                <Link href="#" className="flex items-center text-gray-300 hover:text-[#F5B056] transition">
                  <ChevronRight size={16} className="mr-1" />
                  <span>Privacy Policy</span>
                </Link>
              </li>
              <li>
                <Link href="#" className="flex items-center text-gray-300 hover:text-[#F5B056] transition">
                  <ChevronRight size={16} className="mr-1" />
                  <span>Cookie Policy</span>
                </Link>
              </li>
              <li>
                <Link href="#" className="flex items-center text-gray-300 hover:text-[#F5B056] transition">
                  <ChevronRight size={16} className="mr-1" />
                  <span>Disclaimer</span>
                </Link>
              </li>
            </ul>
          </div>
        </div>
        
        {/* External Resources */}
        <div className="mb-12">
          <h3 className="text-[#F5B056] font-bold text-lg mb-4">Blockchain Resources</h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {[
              { name: "Ethereum", url: "https://ethereum.org" },
              { name: "CoinGecko", url: "https://coingecko.com" },
              { name: "Etherscan", url: "https://etherscan.io" },
              { name: "Binance", url: "https://binance.com" },
              { name: "CoinMarketCap", url: "https://coinmarketcap.com" },
              { name: "OpenSea", url: "https://opensea.io" },
            ].map((resource, i) => (
              <a 
                key={i} 
                href={resource.url} 
                target="_blank" 
                rel="noopener noreferrer" 
                className="flex items-center justify-center bg-black/30 border border-gray-800 rounded-lg p-3 text-gray-300 hover:text-[#F5B056] hover:border-[#F5B056]/50 transition group"
              >
                <span>{resource.name}</span>
                <ExternalLink size={14} className="ml-2 opacity-0 group-hover:opacity-100 transition" />
              </a>
            ))}
          </div>
        </div>
        
        {/* Bottom Section */}
        <div className="border-t border-gray-800/40 pt-6 flex flex-col md:flex-row justify-between items-center text-sm text-gray-400">
          <p>&copy; {new Date().getFullYear()} CryptoPath. All rights reserved.</p>
          <div className="flex flex-wrap justify-center gap-4 mt-4 md:mt-0">
            <Link href="#" className="hover:text-[#F5B056] transition">Privacy</Link>
            <Link href="#" className="hover:text-[#F5B056] transition">Terms</Link>
            <Link href="#" className="hover:text-[#F5B056] transition">Cookies</Link>
            <Link href="#" className="hover:text-[#F5B056] transition">FAQ</Link>
            <Link href="#" className="flex items-center hover:text-[#F5B056] transition">
              <span>Developers</span>
              <ExternalLink size={14} className="ml-1" />
            </Link>
          </div>
        </div>
      </div>
      
      {/* Back to top button */}
      <motion.button
        onClick={scrollToTop}
        className="fixed bottom-6 left-6 z-50 bg-[#F5B056] text-black p-3 rounded-full shadow-lg"
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ 
          opacity: showBackToTop ? 1 : 0,
          scale: showBackToTop ? 1 : 0.8,
          y: showBackToTop ? 0 : 20
        }}
        transition={{ duration: 0.3 }}
        aria-label="Back to top"
      >
        <ArrowUp size={20} />
      </motion.button>
    </footer>
  );
};

export default Footer;
