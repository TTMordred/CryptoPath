// lib/types.ts
export type Coin = {
    id: string;
    symbol: string;
    name: string;
    image: string;
    current_price: number;
    market_cap: number;
    market_cap_rank: number;
    fully_diluted_valuation: number;
    total_volume: number;
    high_24h: number;
    low_24h: number;
    price_change_24h: number;
    price_change_percentage_24h: number;
    market_cap_change_24h: number;
    market_cap_change_percentage_24h: number;
    circulating_supply: number;
    total_supply: number;
    max_supply: number;
    ath: number;
    ath_change_percentage: number;
    ath_date: string;
    atlDance: number;
    atl_change_percentage: number;
    atl_date: string;
    roi: {
      times: number;
      currency: string;
      percentage: number;
    } | null;
    last_updated: string;
    sparkline_in_7d: {
      price: number[];
    };
    price_change_percentage_1h_in_currency: number;
    price_change_percentage_24h_in_currency: number;
    price_change_percentage_7d_in_currency: number;
  };
  
  export type CoinDetail = {
    id: string;
    symbol: string;
    name: string;
    description: {
      en: string;
    };
    image: {
      thumb: string;
      small: string;
      large: string;
    };
    market_cap_rank: number;
    links: {
      homepage: string[];
      blockchain_site: string[];
      official_forum_url: string[];
      chat_url: string[];
      announcement_url: string[];
      twitter_screen_name: string;
      facebook_username: string;
      bitcointalk_thread_identifier: number | null;
      telegram_channel_identifier: string;
      subreddit_url: string;
      repos_url: {
        github: string[];
        bitbucket: string[];
      };
    };
    market_data: {
      current_price: {
        usd: number;
      };
      market_cap: {
        usd: number;
      };
      market_cap_rank: number;
      fully_diluted_valuation: {
        usd: number;
      };
      total_volume: {
        usd: number;
      };
      high_24h: {
        usd: number;
      };
      low_24h: {
        usd: number;
      };
      price_change_24h: number;
      price_change_percentage_24h: number;
      price_change_percentage_7d: number;
      price_change_percentage_14d: number;
      price_change_percentage_30d: number;
      price_change_percentage_60d: number;
      price_change_percentage_200d: number;
      price_change_percentage_1y: number;
      market_cap_change_24h: number;
      market_cap_change_percentage_24h: number;
      price_change_24h_in_currency: {
        usd: number;
      };
      price_change_percentage_1h_in_currency: {
        usd: number;
      };
      price_change_percentage_24h_in_currency: {
        usd: number;
      };
      price_change_percentage_7d_in_currency: {
        usd: number;
      };
      price_change_percentage_14d_in_currency: {
        usd: number;
      };
      price_change_percentage_30d_in_currency: {
        usd: number;
      };
      price_change_percentage_60d_in_currency: {
        usd: number;
      };
      price_change_percentage_200d_in_currency: {
        usd: number;
      };
      price_change_percentage_1y_in_currency: {
        usd: number;
      };
      max_supply: number;
      circulating_supply: number;
      total_supply: number;
      sparkline_7d: {
        price: number[];
      };
      ath: {
        usd: number;
      };
      ath_change_percentage: {
        usd: number;
      };
      ath_date: {
        usd: string;
      };
      atl: {
        usd: number;
      };
      atl_change_percentage: {
        usd: number;
      };
      atl_date: {
        usd: string;
      };
    };
};


  
  export type GlobalData = {
    active_cryptocurrencies: number;
    upcoming_icos: number;
    ongoing_icos: number;
    ended_icos: number;
    markets: number;
    total_market_cap: {
      [key: string]: number;
    };
    total_volume: {
      [key: string]: number;
    };
    market_cap_percentage: {
      [key: string]: number;
    };
    market_cap_change_percentage_24h_usd: number;
    updated_at: number;
  };
  
  export type CoinHistory = {
    prices: [number, number][];
    market_caps: [number, number][];
    total_volumes: [number, number][];
  };