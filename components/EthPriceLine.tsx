import React, { useEffect, useState, useRef } from 'react';

const EthPriceLine = () => {
  const [prices, setPrices] = useState({
    eth: { price: 0, change: 0 },
    btc: { price: 0, change: 0 },
    ltc: { price: 0, change: 0 },
    xrp: { price: 0, change: 0 },
    ada: { price: 0, change: 0 },
    doge: { price: 0, change: 0 },
    sol: { price: 0, change: 0 },
    dot: { price: 0, change: 0 },
    bnb: { price: 0, change: 0 },
    // Add more coins as needed
  });
  
  const scrollRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchPrices = async () => {
      try {
        const response = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=ethereum,bitcoin,litecoin,ripple,cardano,dogecoin,solana,polkadot,binancecoin&vs_currencies=usd&include_24hr_change=true');
        const data = await response.json();
        setPrices({
          eth: { price: data.ethereum.usd, change: data.ethereum.usd_24h_change },
          btc: { price: data.bitcoin.usd, change: data.bitcoin.usd_24h_change },
          ltc: { price: data.litecoin.usd, change: data.litecoin.usd_24h_change },
          xrp: { price: data.ripple.usd, change: data.ripple.usd_24h_change },
          ada: { price: data.cardano.usd, change: data.cardano.usd_24h_change },
          doge: { price: data.dogecoin.usd, change: data.dogecoin.usd_24h_change },
          sol: { price: data.solana.usd, change: data.solana.usd_24h_change },
          dot: { price: data.polkadot.usd, change: data.polkadot.usd_24h_change },
          bnb: { price: data.binancecoin.usd, change: data.binancecoin.usd_24h_change },
          // Add more coins as needed
        });
      } catch (error) {
        console.error('Error fetching prices:', error);
      }
    };

    // Initial fetch
    fetchPrices();
    
    // Set up interval to fetch prices continuously - every 60 seconds
    const intervalId = setInterval(fetchPrices, 60000);
    
    // Clean up the interval when the component unmounts
    return () => clearInterval(intervalId);
  }, []);

  // Set up the scrolling animation
  useEffect(() => {
    if (!scrollRef.current || !contentRef.current) return;
    
    const scrollContainer = scrollRef.current;
    const content = contentRef.current;
    const scrollWidth = content.offsetWidth;
    let scrollPosition = 0;
    const scrollSpeed = 1; // Adjust for faster/slower scrolling
    
    const scroll = () => {
      scrollPosition += scrollSpeed;
      
      // When the first item is completely scrolled out, move it to the end
      if (scrollPosition >= scrollWidth) {
        scrollPosition = 0;
      }
      
      scrollContainer.scrollLeft = scrollPosition;
      requestAnimationFrame(scroll);
    };
    
    const animation = requestAnimationFrame(scroll);
    
    return () => cancelAnimationFrame(animation);
  }, []);

  const formatChange = (change: number) => {
    const isPositive = change >= 0;
    return (
      <span className={isPositive ? 'text-green-400' : 'text-red-400'}>
        {isPositive ? '+' : ''}{change.toFixed(2)}%
      </span>
    );
  };

  const priceItem = (symbol: string, name: string, price: number, change: number) => (
    <span className="inline-block whitespace-nowrap">
      {symbol} Price: <span className="text-[#F5B056]">${price.toFixed(2)} ({formatChange(change)})</span>
      <span className="mx-4">|</span>
    </span>
  );

  return (
    <div className="w-full overflow-hidden py-2 bg-transparent text-white">
      <div 
        ref={scrollRef} 
        className="w-full overflow-hidden"
        style={{ 
          WebkitOverflowScrolling: 'touch',
          scrollbarWidth: 'none',
          msOverflowStyle: 'none'
        }}
      >
        <div 
          ref={contentRef}
          className="inline-block whitespace-nowrap"
          style={{ 
            display: 'inline-flex',
            width: 'max-content'
          }}
        >
          {/* First set of items */}
          {priceItem('ETH', 'Ethereum', prices.eth.price, prices.eth.change)}
          {priceItem('BTC', 'Bitcoin', prices.btc.price, prices.btc.change)}
          {priceItem('LTC', 'Litecoin', prices.ltc.price, prices.ltc.change)}
          {priceItem('XRP', 'Ripple', prices.xrp.price, prices.xrp.change)}
          {priceItem('ADA', 'Cardano', prices.ada.price, prices.ada.change)}
          {priceItem('DOGE', 'Dogecoin', prices.doge.price, prices.doge.change)}
          {priceItem('SOL', 'Solana', prices.sol.price, prices.sol.change)}
          {priceItem('DOT', 'Polkadot', prices.dot.price, prices.dot.change)}
          {priceItem('BNB', 'Binance Coin', prices.bnb.price, prices.bnb.change)}
          
          {/* Duplicate for seamless scrolling */}
          {priceItem('ETH', 'Ethereum', prices.eth.price, prices.eth.change)}
          {priceItem('BTC', 'Bitcoin', prices.btc.price, prices.btc.change)}
          {priceItem('LTC', 'Litecoin', prices.ltc.price, prices.ltc.change)}
          {priceItem('XRP', 'Ripple', prices.xrp.price, prices.xrp.change)}
          {priceItem('ADA', 'Cardano', prices.ada.price, prices.ada.change)}
          {priceItem('DOGE', 'Dogecoin', prices.doge.price, prices.doge.change)}
          {priceItem('SOL', 'Solana', prices.sol.price, prices.sol.change)}
          {priceItem('DOT', 'Polkadot', prices.dot.price, prices.dot.change)}
          {priceItem('BNB', 'Binance Coin', prices.bnb.price, prices.bnb.change)}
        </div>
      </div>
    </div>
  );
};

export default EthPriceLine;