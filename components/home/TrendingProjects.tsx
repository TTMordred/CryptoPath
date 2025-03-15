// TrendingProjects.tsx
import React, { useEffect, useState } from 'react';

interface TrendingData {
  dapps: { results: any[] };
  games: { results: any[] };
  marketplaces: { results: any[] };
}

const TrendingProjects = () => {
  const [data, setData] = useState<TrendingData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    fetch(`/api/dappradar-trending-project?chain=ethereum`)
      .then((res) => {
        if (!res.ok) {
          throw new Error(`API request failed with status ${res.status}`);
        }
        return res.json();
      })
      .then((json: TrendingData) => {
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

  if (isLoading) {
    return (
      <div className="container mx-auto py-12 text-center">
        <h2 className="text-3xl font-bold">Loading trending projects...</h2>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="container mx-auto py-12 text-center">
        <h2 className="text-3xl font-bold">No data available</h2>
        {error && <p className="text-red-500 mt-4">{error}</p>}
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-12">
      <h1 className="text-4xl font-bold text-center mb-8">Trending Projects</h1>
      <p className='text-lg text-center mb-8'>Explore the leading decentralized applications, innovative crypto games, and bustling marketplaces. Stay updated with key performance metrics and uncover the next big opportunity in the blockchain ecosystem.</p>
      {error && (
        <p className="text-yellow-500 text-center mb-4">
          Note: Displaying sample data. {error}
        </p>
      )}

      {/* 
        Use a 3-column grid for the layout. 
        Each column has a title, subtitle, and a list of 3 items.
      */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* COLUMN 1: Top UAW */}
        <div className="bg-white/5 rounded-[10px] p-4 border border-gray-800 backdrop-blur-[4px]">
          {/* Header Row: Title + Subtitle */}
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold">Top UAW</h2>
            <span className="text-sm text-gray-300">% UAW (24h)</span>
          </div>

          {/* List of Items */}
          <ul className="flex flex-col gap-3">
            {data.dapps.results.slice(0, 3).map((item, index) => {
              const changeValue = item.metrics?.uawPercentageChange;
              const uawValue = item.metrics?.uaw;

              return (
                <li
                  key={`dapp-${index}`}
                  className="flex items-center justify-between rounded-[5px] p-3 duration-300 hover:shadow-[0_0_40px_rgba(245,176,86,0.4)] hover:border-orange-500/80 hover:-translate-y-2"
                >
                  {/* Left side: Icon + Name */}
                  <div className="flex items-center gap-3">
                    <img
                      src={item.logo || 'https://placekitten.com/100/100'}
                      alt={item.name}
                      className="w-8 h-8 rounded-full"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.onerror = null;
                        target.src = 'https://placekitten.com/100/100';
                      }}
                    />
                    <div className="flex flex-col">
                      <span className="text-sm font-semibold">
                        {item.name || 'Unknown'}
                      </span>
                      <span className="text-xs text-gray-400">+{item.chains?.length || 1}</span>
                    </div>
                  </div>

                  {/* Right side: Percentage + UAW */}
                  <div className="text-right">
                    <p
                      className={
                        changeValue > 0 ? 'text-green-400' : 'text-red-400'
                      }
                    >
                      {changeValue !== undefined
                        ? `${changeValue > 0 ? '+' : ''}${changeValue.toFixed(
                            1
                          )}%`
                        : 'N/A'}
                    </p>
                    <p className="text-gray-400 text-sm">
                      {uawValue
                        ? `${Number(uawValue).toLocaleString()} UAW`
                        : 'N/A'}
                    </p>
                  </div>
                </li>
              );
            })}
          </ul>
        </div>

        {/* COLUMN 2: Top Games */}
        <div className="bg-white/5 rounded-[10px] p-4 border border-gray-800 backdrop-blur-[4px]">
          {/* Header Row: Title + Subtitle */}
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold">Top Games</h2>
            <span className="text-sm text-gray-300">% Balance (24h)</span>
          </div>

          {/* List of Items */}
          <ul className="flex flex-col gap-3">
            {data.games.results.slice(0, 3).map((item, index) => {
              const changeValue = item.metrics?.balancePercentageChange;
              const balanceValue = item.metrics?.balance;

              return (
                <li
                  key={`game-${index}`}
                  className="flex items-center justify-between rounded-[5px] p-3 duration-300 hover:shadow-[0_0_40px_rgba(245,176,86,0.4)] hover:border-orange-500/80 hover:-translate-y-2"
                >
                  {/* Left side: Icon + Name */}
                  <div className="flex items-center gap-3">
                    <img
                      src={item.logo || 'https://placekitten.com/100/100'}
                      alt={item.name}
                      className="w-8 h-8 rounded-full"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.onerror = null;
                        target.src = 'https://placekitten.com/100/100';
                      }}
                    />
                    <div className="flex flex-col">
                      <span className="text-sm font-semibold">
                        {item.name || 'Unknown'}
                      </span>
                      <span className="text-xs text-gray-400">+{item.chains?.length || 1}</span>
                    </div>
                  </div>

                  {/* Right side: Percentage + Balance */}
                  <div className="text-right">
                    <p
                      className={
                        changeValue > 0 ? 'text-green-400' : 'text-red-400'
                      }
                    >
                      {changeValue !== undefined
                        ? `${changeValue > 0 ? '+' : ''}${changeValue.toFixed(
                            1
                          )}%`
                        : 'N/A'}
                    </p>
                    <p className="text-gray-400 text-sm">
                      {balanceValue
                        ? `$${Number(balanceValue).toLocaleString()}`
                        : 'N/A'}
                    </p>
                  </div>
                </li>
              );
            })}
          </ul>
        </div>

        {/* COLUMN 3: Top Marketplaces */}
        <div className="bg-white/5 rounded-[10px] p-4 border border-gray-800 backdrop-blur-[4px]">
          {/* Header Row: Title + Subtitle */}
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold">Top Marketplaces</h2>
            <span className="text-sm text-gray-300">Txns (24h)</span>
          </div>

          {/* List of Items */}
          <ul className="flex flex-col gap-3">
            {data.marketplaces.results.slice(0, 3).map((item, index) => {
              const changeValue = item.metrics?.transactionsPercentageChange;
              const txnsValue = item.metrics?.transactions;

              return (
                <li
                  key={`marketplace-${index}`}
                  className="flex items-center justify-between rounded-[5px] p-3 duration-300 hover:shadow-[0_0_40px_rgba(245,176,86,0.4)] hover:border-orange-500/80 hover:-translate-y-2"
                >
                  {/* Left side: Icon + Name */}
                  <div className="flex items-center gap-3">
                    <img
                      src={item.logo || 'https://placekitten.com/100/100'}
                      alt={item.name}
                      className="w-8 h-8 rounded-full"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.onerror = null;
                        target.src = 'https://placekitten.com/100/100';
                      }}
                    />
                    <div className="flex flex-col">
                      <span className="text-sm font-semibold">
                        {item.name || 'Unknown'}
                      </span>
                      <span className="text-xs text-gray-400">+{item.chains?.length || 1}</span>
                    </div>
                  </div>

                  {/* Right side: Percentage + Txns */}
                  <div className="text-right">
                    <p
                      className={
                        changeValue > 0 ? 'text-green-400' : 'text-red-400'
                      }
                    >
                      {changeValue !== undefined
                        ? `${changeValue > 0 ? '+' : ''}${changeValue.toFixed(
                            1
                          )}%`
                        : 'N/A'}
                    </p>
                    <p className="text-gray-400 text-sm">
                      {txnsValue
                        ? `${Number(txnsValue).toLocaleString()} Transactions`
                        : 'N/A'}
                    </p>
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      </div>
    </div>
  );
};

export default TrendingProjects;
