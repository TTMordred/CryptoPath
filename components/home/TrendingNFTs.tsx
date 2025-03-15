import React, { useEffect, useState } from "react";

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
        // Debug: log the JSON response
        console.log("Fetched NFT Data:", json);
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
      <div className="container mx-auto py-12 text-center">
        <h2 className="text-3xl font-bold">Loading NFT collections...</h2>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="container mx-auto py-12 text-center">
        <h2 className="text-3xl font-bold">Error loading NFT collections</h2>
        <p className="text-red-500 mt-4">{error}</p>
      </div>
    );
  }

  // Ensure that data and data.nfts.results exist
  const results = data?.nfts?.results || [];

  if (results.length === 0) {
    return (
      <div className="container mx-auto py-12 text-center">
        <h2 className="text-3xl font-bold">No NFT collections available</h2>
      </div>
    );
  }

  // Render the NFT collection cards by mapping over data.nfts.results
  return (
    <div className="container mx-auto px-4 py-12">
      <h1 className="text-4xl font-bold text-center mb-8">Trending NFT Collections</h1>
      <p className="text-lg text-center mb-8">
        Explore the latest trending NFT collections based on sales volume and activity.
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
        {results.map((item, index) => (
          <div
            key={index}
            className="bg-white/5 rounded-[10px] p-4 border backdrop-blur-[4px] duration-300 hover:shadow-[0_0_40px_rgba(245,176,86,0.4)] hover:border-orange-500/80 hover:-translate-y-2"
          >
            <div className="flex items-center gap-4 mb-4">
              <img
                src={item.logo || "https://placekitten.com/100/100"}
                alt={item.name || "Unknown"}
                className="w-12 h-12 rounded-full"
                onError={(e) => {
                  (e.currentTarget as HTMLImageElement).src = "https://placekitten.com/100/100";
                }}
              />
              <div>
                <h2 className="text-lg font-bold">{item.name || "Unknown"}</h2>
                <p className="text-sm text-gray-400">
                  {item.chains?.[0]?.[0] || "N/A"}
                </p>
              </div>
            </div>

            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-300">Floor price</span>
              <span className="text-sm">
                {item.floorPrice ? `$${item.floorPrice}` : "N/A"}
              </span>
            </div>

            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-300">Trading volume</span>
              <span className="text-sm">
                {item.volume ? `$${item.volume}` : "N/A"}
              </span>
            </div>

            <div className="flex items-center justify-between mt-2">
              <span className="text-sm text-gray-300">No. of traders</span>
              <span className="text-sm">
                {item.traders ? item.traders.toLocaleString() : "N/A"}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default TrendingNFTCollections;
