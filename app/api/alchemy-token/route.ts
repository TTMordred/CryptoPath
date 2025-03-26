import { NextResponse } from "next/server";

const ALCHEMY_API_KEY = process.env.ALCHEMY_API_KEY;
const ALCHEMY_API_URL = `https://eth-mainnet.g.alchemy.com/v2/${ALCHEMY_API_KEY}`;

interface TokenMetadata {
  name: string;
  symbol: string;
  decimals: number;
  logo: string | null;
  totalSupply?: string;
}

interface TokenTransfer {
  hash: string;
  from: string;
  to: string;
  value: string;
  blockNumber: string;
  timestamp: string;
}

interface TokenDetails {
  name: string;
  symbol: string;
  decimals: number;
  address: string;
  totalSupply: string;
  logo: string;
  holders: number;
  transfers: number;
  lastUpdated: string;
  contractDeployed: string;
  implementation?: string;
  isProxy: boolean;
  recentTransfers: TokenTransfer[];
  priceUSD?: string;
  volume24h?: string;
  marketCap?: string;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const address = searchParams.get("address");
  
  if (!address) {
    return NextResponse.json({ error: "Token address is required" }, { status: 400 });
  }

  try {
    // Get token metadata
    const metadataResponse = await fetch(ALCHEMY_API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 1,
        method: 'alchemy_getTokenMetadata',
        params: [address]
      })
    });
    const metadataData = await metadataResponse.json();

    // Get token total supply
    const supplyResponse = await fetch(ALCHEMY_API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 2,
        method: 'eth_call',
        params: [{
          to: address,
          data: '0x18160ddd' // totalSupply()
        }, 'latest']
      })
    });
    const supplyData = await supplyResponse.json();

    // Get recent token transfers
    const transfersResponse = await fetch(ALCHEMY_API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 3,
        method: 'alchemy_getAssetTransfers',
        params: [{
          fromBlock: "0x0",
          toBlock: "latest",
          contractAddresses: [address],
          category: ["erc20"],
          withMetadata: true,
          maxCount: "0x14", // Fetch last 20 transfers
          order: "desc"
        }]
      })
    });
    const transfersData = await transfersResponse.json();

    // Format recent transfers
    const recentTransfers = transfersData.result?.transfers?.map((transfer: any) => ({
      hash: transfer.hash,
      from: transfer.from,
      to: transfer.to,
      value: transfer.value,
      blockNumber: transfer.blockNum,
      timestamp: transfer.metadata.blockTimestamp
    })) || [];

    // Get price data from CoinGecko
    let priceData = null;
    try {
      const priceResponse = await fetch(
        `https://api.coingecko.com/api/v3/simple/token_price/ethereum?contract_addresses=${address}&vs_currencies=usd&include_24hr_vol=true&include_market_cap=true`
      );
      priceData = await priceResponse.json();
    } catch (e) {
      console.error("Error fetching price data:", e);
    }

    // Get contract creation info
    const deploymentResponse = await fetch(ALCHEMY_API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 4,
        method: 'eth_getCode',
        params: [address, 'latest']
      })
    });
    const deploymentData = await deploymentResponse.json();
    const isProxy = deploymentData.result?.length > 2; // Simple check for proxy contract

    if (!metadataData.result || !supplyData.result) {
      return NextResponse.json({ error: "Token not found" }, { status: 404 });
    }

    const metadata: TokenMetadata = metadataData.result;
    const totalSupply = parseInt(supplyData.result, 16).toString();
    const transfers = recentTransfers.length;

    const tokenDetails: TokenDetails = {
      name: metadata.name || 'Unknown Token',
      symbol: metadata.symbol || 'UNKNOWN',
      decimals: metadata.decimals || 18,
      address: address,
      totalSupply,
      logo: metadata.logo || '/placeholder-token.png',
      holders: 0, // Would need separate API call
      transfers,
      lastUpdated: new Date().toISOString(),
      contractDeployed: new Date().toISOString(),
      isProxy,
      recentTransfers,
      priceUSD: priceData?.[address.toLowerCase()]?.usd?.toString(),
      volume24h: priceData?.[address.toLowerCase()]?.usd_24h_vol?.toString(),
      marketCap: priceData?.[address.toLowerCase()]?.usd_market_cap?.toString()
    };

    return NextResponse.json(tokenDetails);
  } catch (error) {
    console.error("Error fetching token details:", error);
    return NextResponse.json(
      { error: "Failed to fetch token details" },
      { status: 500 }
    );
  }
}