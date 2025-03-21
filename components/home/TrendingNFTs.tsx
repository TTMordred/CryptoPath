import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";

// Define the interface for the API response
interface TrendingNFTData {
  nfts: {
    success: boolean;
    range: string;
    sort: string;
    order: string;
    chain: string;
    results: any[];
    page: number;
    pageCount: number;
    resultCount: number;
    resultsPerPage: number;
  };
}

const TrendingNFTCollections: React.FC = () => {
  const [data, setData] = useState<TrendingNFTData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedCard, setSelectedCard] = useState<number | null>(null);

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const cardVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.5,
        ease: "easeOut"
      }
    },
    hover: {
      y: -10,
      transition: {
        duration: 0.3,
        ease: "easeInOut"
      }
    }
  };

  // Fetch NFT data on component mount
  useEffect(() => {
    let isMounted = true;
    fetch("/api/dappradar-trending-nft") // Update this to your actual endpoint
      .then((res) => {
        if (!res.ok) {
          throw new Error(`API request failed with status ${res.status}`);
        }
        return res.json();
      })
      .then((json: TrendingNFTData) => {
        if (isMounted) {
          setData(json);
          setIsLoading(false);
        }
      })
      .catch((err) => {
        if (isMounted) {
          setError(err.message);
          setIsLoading(false);
        }
      });
    return () => {
      isMounted = false;
    };
  }, []);

  // Loading state
  if (isLoading) {
    return (
      <div className="cp-section">
        <div className="cp-container text-center">
          <h2 className="cp-heading-2">Loading NFT Collections</h2>
          <div className="flex justify-center items-center space-x-2 mt-8">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className="w-3 h-3 rounded-full bg-[#F5B056]"
                style={{ 
                  animation: `pulse 1.5s ease-in-out ${i * 0.2}s infinite alternate` 
                }}
              ></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="cp-section bg-black/30 backdrop-blur-sm">
        <div className="cp-container text-center">
          <div className="max-w-2xl mx-auto p-8 rounded-xl border border-red-500/30 bg-black/50">
            <svg className="w-16 h-16 text-red-500 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <h2 className="cp-heading-2 text-red-500">Error Loading NFT Collections</h2>
            <p className="text-red-400">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  // Ensure that data and data.nfts.results exist
  const results = data?.nfts?.results || [];

  if (results.length === 0) {
    return (
      <div className="cp-section bg-black/30 backdrop-blur-sm">
        <div className="cp-container text-center">
          <h2 className="cp-heading-2">No NFT Collections Available</h2>
        </div>
      </div>
    );
  }

  return (
    <div className="cp-section relative overflow-hidden">
      {/* Decorative background elements */}
      <div className="absolute top-0 right-0 w-1/3 h-1/3 bg-[#F5B056]/10 rounded-full blur-[120px] -z-10"></div>
      <div className="absolute bottom-0 left-0 w-1/4 h-1/2 bg-purple-700/10 rounded-full blur-[100px] -z-10"></div>
      
      <div className="cp-container">
        <div className="text-center mb-12">
          <div className="inline-block px-4 py-1 rounded-full bg-[#F5B056]/10 text-[#F5B056] text-sm mb-4">
            Hot Collections
          </div>
          <h1 className="cp-heading-2 mb-4">Trending NFT Collections</h1>
          <p className="cp-body-sm max-w-2xl mx-auto text-white/70">
            Explore the latest trending NFT collections based on sales volume and activity.
            Stay updated with the hottest projects in the NFT space.
          </p>
        </div>
        
        <motion.div 
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8"
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
        >
          {results.map((item, index) => (
            <motion.div
              key={index}
              className={`cp-card cp-card--glass ${
                selectedCard === index ? "ring-2 ring-[#F5B056]" : ""
              }`}
              variants={cardVariants}
              whileHover="hover"
              onClick={() => setSelectedCard(index === selectedCard ? null : index)}
            >
              <div className="p-6 border-b border-white/10">
                <div className="flex items-center gap-4">
                  <div className="relative">
                    {/* Subtle glow effect around the image */}
                    <div className="absolute inset-0 bg-[#F5B056]/20 rounded-full blur-md -z-10"></div>
                    <img
                      src={item.logo || "https://placekitten.com/100/100"}
                      alt={item.name || "Unknown"}
                      className="w-14 h-14 rounded-full object-cover border-2 border-[#F5B056]/30"
                      onError={(e) => {
                        (e.currentTarget as HTMLImageElement).src = "https://placekitten.com/100/100";
                      }}
                    />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold">{item.name || "Unknown"}</h3>
                    <div className="flex items-center text-sm text-gray-400 mt-1">
                      <div className="w-2 h-2 rounded-full bg-green-400 mr-1.5"></div>
                      <span>{item.chains?.[0]?.[0] || "N/A"}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-400">Floor price</span>
                    <span className="text-sm font-medium bg-[#F5B056]/10 text-[#F5B056] px-2 py-1 rounded">
                      {item.floorPrice ? `$${item.floorPrice}` : "N/A"}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-400">Trading volume</span>
                    <span className="text-sm font-medium bg-[#F5B056]/10 text-[#F5B056] px-2 py-1 rounded">
                      {item.volume ? `$${item.volume}` : "N/A"}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-400">No. of traders</span>
                    <span className="text-sm font-medium bg-[#F5B056]/10 text-[#F5B056] px-2 py-1 rounded">
                      {item.traders ? item.traders.toLocaleString() : "N/A"}
                    </span>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </div>
  );
};

export default TrendingNFTCollections;
