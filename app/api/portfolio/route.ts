import { NextResponse } from "next/server";
import * as moralisApi from "@/lib/api/moralisApi";
import * as alchemyApi from "@/lib/api/alchemyApi";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const address = searchParams.get("address");
    const provider = searchParams.get("provider") || "moralis"; // Default to Moralis

    if (!address) {
      return NextResponse.json(
        { error: "Address is required" },
        { status: 400 }
      );
    }

    // Validate Ethereum address format
    if (!/^0x[a-fA-F0-9]{40}$/.test(address)) {
      return NextResponse.json(
        { error: "Invalid Ethereum address format" },
        { status: 400 }
      );
    }

    interface Token {
      contractAddress?: string;
      chain?: string;
      balanceFormatted?: string;
      usdPrice?: number;
      usdValue?: number;
      [key: string]: any; // Allow for other properties
    }
    
    let tokens: Token[] = [];
    let totalValue = 0;
    let apiError = null;

    // Fetch tokens based on provider
    try {
      if (provider === "moralis") {
        tokens = await moralisApi.getWalletTokens(address);
        
        // Check if we got tokens but Moralis API key isn't configured
        if (tokens.length === 0 && !process.env.MORALIS_API_KEY) {
          apiError = "Moralis API key is not configured. Please set MORALIS_API_KEY in your environment variables.";
        }
      } else if (provider === "alchemy") {
        tokens = await alchemyApi.getWalletTokens(address);
      
        // Enrich Alchemy tokens with price data
        const nativePrices = await alchemyApi.getNativePrices();
        
        tokens = tokens.map(token => {
          if (token.contractAddress === 'native') {
            const usdPrice = token.chain ? nativePrices[token.chain] || 0 : 0;
            const balance = parseFloat(token.balanceFormatted || '0');
            return {
              ...token,
              usdPrice,
              usdValue: balance * usdPrice
            };
          }
          return token;
        });
        
        // For ERC20 tokens, we would need to fetch prices from another source
        // This is a simplified version
      } else if (provider === "combined") {
        // Fetch from both providers and merge results
        const moralisTokens = await moralisApi.getWalletTokens(address);
        const alchemyTokens = await alchemyApi.getWalletTokens(address);
        
        // In a real implementation, you would deduplicate tokens here
        tokens = [...moralisTokens, ...alchemyTokens];
      } else {
        return NextResponse.json(
          { error: "Invalid provider. Use 'moralis', 'alchemy', or 'combined'" },
          { status: 400 }
        );
      }
    } catch (providerError) {
      console.error(`Error with ${provider} provider:`, providerError);
      apiError = `The ${provider} provider encountered an error: ${
        providerError instanceof Error ? providerError.message : String(providerError)
      }`;
    }

    // Calculate total USD value
    totalValue = tokens.reduce((acc, token) => acc + (token.usdValue || 0), 0);

    return NextResponse.json({
      address,
      tokens,
      totalValue,
      totalBalance: tokens.length,
      provider,
      apiError // Include any API-specific errors in the response
    });
  } catch (error) {
    console.error("Error fetching portfolio:", error);
    
    return NextResponse.json(
      { error: "Failed to fetch portfolio data", details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
