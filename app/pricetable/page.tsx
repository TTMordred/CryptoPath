"use client";

import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import {
  TrendingUp,
  TrendingDown,
  CircleDollarSign,
  BarChart4,
  Clock,
  Search,
  Menu,
  X,
  ChevronUp,
  ChevronDown,
  ArrowUpDown,
} from "lucide-react";
// Import từ các file trong lib/ thay vì app/api/service/route
import { getCoins, getCoinDetail } from "@/lib/api/coinApi"; // Chỉ import các hàm liên quan đến coin
import { getGlobalData } from "@/lib/api/globalApi"; // Import getGlobalData từ globalApi
import {
  formatCurrency,
  formatNumber,
  formatPercentage,
  getColorForPercentChange,
} from "@/lib/format";  // Giả sử các hàm API được tách vào đây
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

// ----------------- Header Component -----------------
export const HeaderTable = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    setIsMenuOpen(false);
  }, [pathname]);

  
};

// ----------------- Landing Page Component -----------------


// ----------------- Particles Background Component -----------------
export const ParticlesBackground = () => {
  useEffect(() => {
    if (typeof window.particlesJS !== "undefined") {
      window.particlesJS("particles-js", {
        particles: {
          number: {
            value: 100,
            density: {
              enable: true,
              value_area: 800,
            },
          },
          color: {
            value: "#f5b056",
          },
          shape: {
            type: "circle",
          },
          opacity: {
            value: 0.5,
            random: false,
          },
          size: {
            value: 3,
            random: true,
          },
          line_linked: {
            enable: true,
            distance: 150,
            color: "#f5b056",
            opacity: 0.4,
            width: 1,
          },
          move: {
            enable: true,
            speed: 2,
            direction: "none",
            random: false,
            straight: false,
            out_mode: "out",
          },
        },
        interactivity: {
          detect_on: "canvas",
          events: {
            onhover: {
              enable: true,
              mode: "grab",
            },
            onclick: {
              enable: true,
              mode: "push",
            },
          },
          modes: {
            grab: {
              distance: 200,
              line_linked: {
                opacity: 0.5,
              },
            },
            push: {
              particles_nb: 4,
            },
          },
        },
        retina_detect: true,
      });
    }
  }, []);

  return <div id="particles-js" className="fixed inset-0 z-0" />;
};

// ----------------- Navigation Component -----------------
export const Navigation = () => (
  <nav className="container py-4 flex justify-center gap-8 relative z-10">
    <Link
      href="/dashboard"
      className="text-sm font-medium hover:text-primary transition-colors"
    >
      Cryptocurrencies
    </Link>
    <a
      href="#marketcap"
      className="text-sm font-medium hover:text-primary transition-colors"
    >
      Market Cap
    </a>
    <a
      href="#gainers"
      className="text-sm font-medium hover:text-primary transition-colors"
    >
      Gainers
    </a>
    <a
      href="#circulation"
      className="text-sm font-medium hover:text-primary transition-colors"
    >
      Circulation
    </a>
  </nav>
);

// ----------------- Stat Card Component -----------------
export const StatCard = ({
  title,
  value,
  icon: Icon,
  change,
  isLoading,
}: {
  title: string;
  value: string;
  icon: React.ElementType;
  change?: { value: string; color: string };
  isLoading: boolean;
}) => (
  <div className="glass rounded-xl p-5 flex flex-col justify-between h-full border border-border/50 transition-all duration-300 hover:shadow-md hover:translate-y-[-2px]">
    <div className="flex justify-between items-start mb-3">
      <h3 className="text-sm font-medium text-muted-foreground">{title}</h3>
      <Icon className="h-4 w-4 text-primary opacity-70" />
    </div>

    <div>
      {isLoading ? (
        <Skeleton className="h-7 w-[100px] mb-1" />
      ) : (
        <p className="text-2xl font-semibold mb-1">{value}</p>
      )}

      {change && !isLoading && (
        <p className={`text-xs ${change.color}`}>{change.value}</p>
      )}
    </div>
  </div>
);

// ----------------- Hero Section Component -----------------
export const HeroSection = () => {
  const { data: globalData, isLoading } = useQuery({
    queryKey: ["globalData"],
    queryFn: getGlobalData,
    staleTime: 60 * 1000,
  });

  const getMarketCapUSD = () => {
    if (!globalData) return 0;
    return globalData.total_market_cap.usd || 0;
  };

  const getVolumeUSD = () => {
    if (!globalData) return 0;
    return globalData.total_volume.usd || 0;
  };

  const getFormattedDate = () => {
    if (!globalData) return "";
    const date = new Date(globalData.updated_at * 1000);
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  return (
    <section className="pt-8 pb-12 relative overflow-hidden" id="marketcap">
      <div className="absolute -top-[300px] -right-[300px] w-[600px] h-[600px] bg-primary/5 rounded-full filter blur-3xl opacity-50" />
      <div className="absolute -bottom-[200px] -left-[200px] w-[400px] h-[400px] bg-primary/5 rounded-full filter blur-3xl opacity-50" />

      <div className="container relative">
        <div className="text-center max-w-3xl mx-auto mb-12 animate-fade-in">
          <div className="inline-flex items-center px-3 py-1 rounded-full bg-primary/10 text-primary mb-4 text-xs font-medium">
            <span>Live Circulation Data</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mb-4 tracking-tight text-balance">
            Track Cryptocurrency Circulation in Real-Time
          </h1>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Get detailed insights into market circulation, supply metrics, and
            trading volumes for top cryptocurrencies.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <StatCard
            title="Total Market Cap"
            value={formatCurrency(getMarketCapUSD())}
            icon={CircleDollarSign}
            change={{
              value: formatPercentage(
                globalData?.market_cap_change_percentage_24h_usd || 0
              ),
              color: getColorForPercentChange(
                globalData?.market_cap_change_percentage_24h_usd || 0
              ),
            }}
            isLoading={isLoading}
          />
          <StatCard
            title="24h Volume"
            value={formatCurrency(getVolumeUSD())}
            icon={BarChart4}
            isLoading={isLoading}
          />
          <StatCard
            title="BTC Dominance"
            value={
              globalData
                ? `${globalData.market_cap_percentage.btc.toFixed(1)}%`
                : "0%"
            }
            icon={TrendingUp}
            isLoading={isLoading}
          />
          <StatCard
            title="Last Updated"
            value={getFormattedDate()}
            icon={Clock}
            isLoading={isLoading}
          />
        </div>

        <div
          className="flex justify-center animate-fade-in"
          style={{ animationDelay: "0.2s" }}
        >
          <a
            href="#market-table"
            className="glass rounded-full p-2 hover:shadow-md transition-all duration-300"
          >
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              className="animate-float"
            >
              <path
                d="M12 5L12 19M12 19L18 13M12 19L6 13"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </a>
        </div>
      </div>
    </section>
  );
};

// ----------------- Coin Card Component -----------------
export const CoinCard = ({
  coin,
}: {
  coin: {
    id: string;
    name: string;
    symbol: string;
    image: string;
    current_price: number;
    price_change_percentage_24h: number;
    market_cap: number;
    market_cap_rank: number;
  };
}) => {
  const isPositive = coin.price_change_percentage_24h > 0;

  return (
    <Link
      href={`/coin/${coin.id}`}
      className="crypto-card p-5 flex flex-col h-full pulse-glow"
    >
      <div className="flex justify-between items-start mb-4">
        <div className="flex items-center gap-3">
          <img
            src={coin.image}
            alt={coin.name}
            className="w-10 h-10 rounded-full neon-border"
            loading="lazy"
          />
          <div>
            <h3 className="font-semibold gradient-text">{coin.name}</h3>
            <p className="text-xs text-muted-foreground">
              {coin.symbol.toUpperCase()}
            </p>
          </div>
        </div>
        <div className="text-xs px-2 py-1 rounded-full bg-secondary">
          Rank #{coin.market_cap_rank}
        </div>
      </div>

      <div className="mt-auto pt-3">
        <div className="text-xl font-bold mb-2 flex justify-between items-center">
          <span>{formatCurrency(coin.current_price)}</span>
          <span
            className={`flex items-center gap-1 text-sm ${
              isPositive ? "text-green-500" : "text-red-500"
            }`}
          >
            {isPositive ? (
              <TrendingUp className="h-4 w-4" />
            ) : (
              <TrendingDown className="h-4 w-4" />
            )}
            <span>{formatPercentage(coin.price_change_percentage_24h)}</span>
          </span>
        </div>

        <div className="text-sm text-muted-foreground mt-2">
          Market Cap: {formatCurrency(coin.market_cap)}
        </div>
      </div>
    </Link>
  );
};

// ----------------- Top Movers Section Component -----------------
export const TopMoversSection = () => {
  const [topGainers, setTopGainers] = useState<any[]>([]);
  const [topLosers, setTopLosers] = useState<any[]>([]);
  const { isLoading, isError } = useQuery({
    queryKey: ["topMovers"],
    queryFn: async () => {
      try {
        const coins = await getCoins(1, 100);

        const sorted = [...coins].sort(
          (a, b) => b.price_change_percentage_24h - a.price_change_percentage_24h
        );

        setTopGainers(sorted.slice(0, 4));
        setTopLosers(sorted.slice(-4).reverse());

        return coins;
      } catch (error) {
        console.error("Error fetching top movers:", error);

        const mockCoins = Array.from({ length: 8 }, (_, i) => ({
          id: `mock-${i}`,
          name: `Coin ${i + 1}`,
          symbol: `CN${i + 1}`,
          image: "https://assets.coingecko.com/coins/images/1/small/bitcoin.png",
          current_price: 50000 - i * 5000,
          price_change_percentage_24h: i < 4 ? 5 + i * 2 : -5 - (i % 4) * 2,
          market_cap: 1000000000000 - i * 50000000000,
          market_cap_rank: i + 1,
        }));

        setTopGainers(mockCoins.slice(0, 4));
        setTopLosers(mockCoins.slice(4, 8));

        return mockCoins;
      }
    },
    staleTime: 60 * 1000,
    retry: 3,
  });

  const renderPlaceholder = () => {
    if (isLoading) {
      return Array(4)
        .fill(0)
        .map((_, index) => (
          <div
            key={`loading-${index}`}
            className="glass rounded-xl p-5 animate-pulse"
          >
            <div className="flex justify-between items-start mb-4">
              <div className="flex items-center gap-3">
                <div className="bg-gray-300 w-10 h-10 rounded-full"></div>
                <div>
                  <div className="h-4 bg-gray-300 rounded w-24 mb-2"></div>
                  <div className="h-3 bg-gray-300 rounded w-12"></div>
                </div>
              </div>
              <div className="h-6 bg-gray-300 rounded w-14"></div>
            </div>
            <div className="mt-auto">
              <div className="h-6 bg-gray-300 rounded w-20 mb-2"></div>
              <div className="h-4 bg-gray-300 rounded w-16"></div>
            </div>
          </div>
        ));
    }

    if (isError) {
      return (
        <div className="col-span-full p-8 text-center">
          <p className="text-muted-foreground mb-2">Failed to load market data</p>
          <Button variant="outline" onClick={() => window.location.reload()}>
            Try Again
          </Button>
        </div>
      );
    }

    return null;
  };

  return (
    <section id="gainers" className="py-16 bg-secondary/50">
      <div className="container">
        <div className="mb-8">
          <h2 className="text-2xl font-bold mb-3 gradient-text">
            Top Movers (24h)
          </h2>
          <p className="text-muted-foreground">
            The biggest gainers and losers in the cryptocurrency market over the
            last 24 hours.
          </p>
        </div>

        <div className="grid gap-8 md:grid-cols-2">
          <div>
            <h3 className="text-lg font-medium mb-4 flex items-center gap-2">
              <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-green-100 text-green-500">
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M12 19L12 5M12 5L18 11M12 5L6 11"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </span>
              Top Gainers
            </h3>

            <div className="grid gap-4 sm:grid-cols-2">
              {topGainers.length > 0
                ? topGainers.map((coin) => (
                    <CoinCard key={coin.id} coin={coin} />
                  ))
                : renderPlaceholder()}
            </div>
          </div>

          <div>
            <h3 className="text-lg font-medium mb-4 flex items-center gap-2">
              <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-red-100 text-red-500">
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M12 5L12 19M12 19L18 13M12 19L6 13"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </span>
              Top Losers
            </h3>

            <div className="grid gap-4 sm:grid-cols-2">
              {topLosers.length > 0
                ? topLosers.map((coin) => (
                    <CoinCard key={coin.id} coin={coin} />
                  ))
                : renderPlaceholder()}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

// ----------------- Loader Component -----------------
export const Loader = () => {
  return (
    <div className="flex justify-center items-center py-8">
      <div className="relative">
        <div className="h-12 w-12 rounded-full border-2 border-primary border-t-transparent animate-spin"></div>
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="h-6 w-6 rounded-full bg-primary/20"></div>
        </div>
      </div>
    </div>
  );
};

// ----------------- Coin Table Component -----------------
export const CoinTable = () => {
  const [page, setPage] = useState(1);
  const [sortKey, setSortKey] = useState<string>("market_cap");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");
  const perPage = 20;

  const { data: coins, isLoading, isFetching } = useQuery({
    queryKey: ["coins", page, perPage],
    queryFn: () => getCoins(page, perPage),
    staleTime: 60 * 1000,
    placeholderData: (previousData) => previousData,
  });

  const handleSort = (key: string) => {
    if (sortKey === key) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortKey(key);
      setSortDirection("desc");
    }
  };

  const sortedCoins = () => {
    if (!coins) return [];

    return [...coins].sort((a, b) => {
      const aValue = a[sortKey as keyof typeof a];
      const bValue = b[sortKey as keyof typeof b];

      if (aValue === null && bValue === null) return 0;
      if (aValue === null) return sortDirection === "asc" ? -1 : 1;
      if (bValue === null) return sortDirection === "asc" ? 1 : -1;

      const comparison = aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
      return sortDirection === "asc" ? comparison : -comparison;
    });
  };

  useEffect(() => {
    setPage(1);
  }, [sortKey, sortDirection]);

  const handlePrevPage = () => {
    if (page > 1) setPage(page - 1);
  };

  const handleNextPage = () => {
    setPage(page + 1);
  };

  const renderSortIndicator = (key: string) => {
    if (sortKey !== key)
      return <ArrowUpDown className="h-4 w-4 ml-1 opacity-50" />;
    return sortDirection === "asc" ? (
      <ChevronUp className="h-4 w-4 ml-1" />
    ) : (
      <ChevronDown className="h-4 w-4 ml-1" />
    );
  };

  return (
    <section id="market-table" className="py-16">
      <div className="container">
        <div className="mb-8">
          <h2 className="text-2xl font-bold mb-3 bg-gradient-to-r from-blue-500 to-indigo-600 bg-clip-text text-transparent">
            Cryptocurrency Market Data
          </h2>
          <p className="text-muted-foreground">
            Comprehensive view of circulation, market cap, and price data for
            top cryptocurrencies.
          </p>
        </div>

        <div className="glass-dark rounded-xl border border-blue-900/30 shadow-lg shadow-blue-500/5 overflow-hidden animate-scale-up">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-blue-950/40 border-blue-900/50">
                  <TableHead className="w-12 text-center">Rank</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead
                    className="cursor-pointer hover:text-primary transition-colors"
                    onClick={() => handleSort("current_price")}
                  >
                    <div className="flex items-center">
                      Price {renderSortIndicator("current_price")}
                    </div>
                  </TableHead>
                  <TableHead
                    className="cursor-pointer hover:text-primary transition-colors"
                    onClick={() => handleSort("price_change_percentage_24h")}
                  >
                    <div className="flex items-center">
                      24h % {renderSortIndicator("price_change_percentage_24h")}
                    </div>
                  </TableHead>
                  <TableHead
                    className="cursor-pointer hover:text-primary transition-colors"
                    onClick={() => handleSort("market_cap")}
                  >
                    <div className="flex items-center">
                      Market Cap {renderSortIndicator("market_cap")}
                    </div>
                  </TableHead>
                  <TableHead
                    className="cursor-pointer hover:text-primary transition-colors"
                    onClick={() => handleSort("total_volume")}
                  >
                    <div className="flex items-center">
                      Volume (24h) {renderSortIndicator("total_volume")}
                    </div>
                  </TableHead>
                  <TableHead
                    className="cursor-pointer hover:text-primary transition-colors"
                    onClick={() => handleSort("circulating_supply")}
                  >
                    <div className="flex items-center">
                      Circulating Supply{" "}
                      {renderSortIndicator("circulating_supply")}
                    </div>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={7} className="h-24 text-center">
                      <Loader />
                    </TableCell>
                  </TableRow>
                ) : sortedCoins().length > 0 ? (
                  sortedCoins().map((coin) => (
                    <TableRow
                      key={coin.id}
                      className="transition-colors hover:bg-blue-900/10 border-blue-900/20"
                    >
                      <TableCell className="font-medium text-center">
                        {coin.market_cap_rank}
                      </TableCell>
                      <TableCell>
                        <Link
                          href={`/coin/${coin.id}`}
                          className="flex items-center gap-3 hover:text-primary transition-colors"
                        >
                          <img
                            src={coin.image}
                            alt={coin.name}
                            className="w-6 h-6"
                            loading="lazy"
                          />
                          <div>
                            <span className="font-medium">{coin.name}</span>
                            <span className="text-xs text-muted-foreground ml-2">
                              {coin.symbol.toUpperCase()}
                            </span>
                          </div>
                        </Link>
                      </TableCell>
                      <TableCell>{formatCurrency(coin.current_price)}</TableCell>
                      <TableCell
                        className={getColorForPercentChange(
                          coin.price_change_percentage_24h
                        )}
                      >
                        {formatPercentage(coin.price_change_percentage_24h)}
                      </TableCell>
                      <TableCell>{formatCurrency(coin.market_cap)}</TableCell>
                      <TableCell>{formatCurrency(coin.total_volume)}</TableCell>
                      <TableCell className="whitespace-nowrap">
                        <div className="flex flex-col">
                          <span>
                            {formatNumber(coin.circulating_supply)}{" "}
                            {coin.symbol.toUpperCase()}
                          </span>
                          {coin.max_supply && (
                            <span className="text-xs text-muted-foreground">
                              {Math.round(
                                (coin.circulating_supply / coin.max_supply) * 100
                              )}
                              % of max supply
                            </span>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={7} className="h-24 text-center">
                      No coins found
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>

          <div className="flex items-center justify-between px-4 py-4 border-t border-blue-900/20 bg-blue-950/20">
            <Button
              variant="outline"
              onClick={handlePrevPage}
              disabled={page === 1 || isFetching}
              className="gap-1 border-blue-800/50 hover:bg-blue-900/20 hover:text-blue-400"
            >
              <ChevronUp className="h-4 w-4 rotate-90" />
              Previous
            </Button>
            <span className="text-sm">Page {page}</span>
            <Button
              variant="outline"
              onClick={handleNextPage}
              disabled={isFetching}
              className="gap-1 border-blue-800/50 hover:bg-blue-900/20 hover:text-blue-400"
            >
              Next
              <ChevronDown className="h-4 w-4 -rotate-90" />
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
};

// ----------------- Main Page Component -----------------
const Page = () => {
  return (
    <>
    <HeroSection></HeroSection>
    <CoinTable ></CoinTable>
    </>
  );
};
export default Page;