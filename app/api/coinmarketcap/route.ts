import { NextResponse } from 'next/server';

const CMC_API_KEY = process.env.COINMARKETCAP_API_KEY;
const CMC_API_URL = 'https://pro-api.coinmarketcap.com/v1';

export async function GET(request: Request) {
  const url = new URL(request.url);
  const endpoint = url.pathname.split('/coinmarketcap/')[1];
  
  try {
    if (!CMC_API_KEY) {
      console.warn('CoinMarketCap API key not configured, using fallback data');
      throw new Error('API key not configured');
    }

    // Select the appropriate endpoint
    let apiEndpoint = '';
    switch (endpoint) {
      case 'global-metrics':
        apiEndpoint = `${CMC_API_URL}/global-metrics/quotes/latest`;
        break;
      case 'listings':
        apiEndpoint = `${CMC_API_URL}/cryptocurrency/listings/latest`;
        break;
      default:
        throw new Error('Invalid endpoint');
    }

    // Forward query parameters
    const queryParams = new URLSearchParams();
    url.searchParams.forEach((value, key) => {
      queryParams.append(key, value);
    });

    // Add default parameters if not provided
    if (!queryParams.has('convert')) {
      queryParams.append('convert', 'USD');
    }

    const response = await fetch(`${apiEndpoint}?${queryParams}`, {
      headers: {
        'X-CMC_PRO_API_KEY': CMC_API_KEY,
        'Accept': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`CoinMarketCap API error: ${response.status}`);
    }

    const data = await response.json();
    
    return NextResponse.json(data);
  } catch (error: any) {
    console.error('CoinMarketCap API proxy error:', error);

    // Return fallback data based on the endpoint
    if (url.pathname.includes('global-metrics')) {
      return NextResponse.json({
        data: {
          quote: {
            USD: {
              total_market_cap: 2300000000000,
              total_volume_24h: 115000000000,
              total_market_cap_yesterday_percentage_change: 2.5
            }
          },
          total_cryptocurrencies: 10423,
          active_market_pairs: 814,
          btc_dominance: 48.5,
          eth_dominance: 17.3,
          last_updated: new Date().toISOString()
        }
      });
    } else {
      return NextResponse.json({
        data: [
          {
            id: 1,
            name: 'Bitcoin',
            symbol: 'BTC',
            cmc_rank: 1,
            quote: {
              USD: {
                price: 65000,
                market_cap: 1300000000000,
                volume_24h: 28000000000,
                percent_change_24h: 2.5
              }
            }
          },
          // Add more fallback tokens as needed
        ]
      });
    }
  }
}