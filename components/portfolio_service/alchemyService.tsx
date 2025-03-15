"use client";
import { ethers } from "ethers";

// Define our API key
const ALCHEMY_API_KEY = "vHX215j9gH01Qc94rX2eEAsLeYohIu9X";
const API_BASE_URL = `https://eth-mainnet.g.alchemy.com/v2/${ALCHEMY_API_KEY}`;
const WS_URL = `wss://eth-mainnet.g.alchemy.com/v2/${ALCHEMY_API_KEY}`;

// Define types
export interface WalletData {
  balance: string;
  tokens: Token[];
  nfts: NFT[];
  transactions: Transaction[];
}

export interface Token {
  name: string;
  symbol: string;
  balance: string;
  tokenAddress: string;
  decimals: number;
  logo?: string;
  value: number;
}

export interface NFT {
  name: string;
  collectionName: string;
  description: string;
  tokenId: string;
  contract: string;
  imageUrl?: string;
}

export interface Transaction {
  hash: string;
  timeStamp: string;
  from: string;
  to: string;
  value: string;
  isError: string;
}

// Helper to make API requests
const fetchAlchemyApi = async (endpoint: string, params: Record<string, any>) => {
  try {
    const response = await fetch(`${API_BASE_URL}/${endpoint}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        jsonrpc: "2.0",
        id: 1,
        method: params.method,
        params: params.params,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Alchemy API error:", response.status, errorText);
      throw new Error(`API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    if (data.error) {
      console.error("Alchemy response error:", data.error);
      throw new Error(`API response error: ${data.error.message}`);
    }
    return data.result;
  } catch (error) {
    console.error("Error fetching Alchemy data:", error);
    throw error;
  }
};

// Function to fetch wallet NFTs
export const getWalletNFTs = async (address: string): Promise<NFT[]> => {
  if (!ethers.utils.isAddress(address)) {
    console.error("Invalid Ethereum address:", address);
    return [];
  }

  try {
    const nfts = await fetchAlchemyApi("", {
      method: "alchemy_getNFTs",
      params: [address], // Đảm bảo chỉ truyền address
    });

    if (!nfts || !nfts.ownedNfts) {
      console.warn("No NFTs found for address:", address);
      return [];
    }

    return nfts.ownedNfts.map((nft: any) => ({
      name: nft.metadata?.name || `NFT #${nft.id.tokenId}`,
      collectionName: nft.contract?.name || "Unknown Collection",
      description: nft.metadata?.description || "",
      tokenId: nft.id.tokenId,
      contract: nft.contract.address,
      imageUrl: nft.metadata?.image || nft.media?.[0]?.gateway || undefined,
    }));
  } catch (error) {
    console.error("Error fetching wallet NFTs:", error);
    return [];
  }
};

// Function to fetch wallet balance
export const getWalletBalance = async (address: string): Promise<string> => {
  try {
    const result = await fetchAlchemyApi("", {
      method: "eth_getBalance",
      params: [address, "latest"],
    });
    return ethers.utils.formatEther(result); // Convert from wei to ETH
  } catch (error) {
    console.error("Error fetching wallet balance:", error);
    return "0";
  }
};

// Function to fetch wallet tokens
export const getWalletTokens = async (address: string): Promise<Token[]> => {
  try {
    const tokenBalances = await fetchAlchemyApi("", {
      method: "alchemy_getTokenBalances",
      params: [address],
    });

    const tokens: Token[] = await Promise.all(
      tokenBalances.tokenBalances
        .filter((token: any) => token.tokenBalance !== "0x0") // Filter out zero balances
        .map(async (token: any) => {
          const metadata = await fetchAlchemyApi("", {
            method: "alchemy_getTokenMetadata",
            params: [token.contractAddress],
          });

          const balanceInWei = ethers.BigNumber.from(token.tokenBalance);
          const decimals = metadata.decimals || 18;
          const balance = ethers.utils.formatUnits(balanceInWei, decimals);
          const value = parseFloat(balance) * 0.001; // Mock ETH value; replace with real price API if needed

          return {
            name: metadata.name || "Unknown Token",
            symbol: metadata.symbol || "UNK",
            balance: balanceInWei.toString(),
            tokenAddress: token.contractAddress,
            decimals: decimals,
            logo: metadata.logo || undefined,
            value: value,
          };
        })
    );

    return tokens;
  } catch (error) {
    console.error("Error fetching wallet tokens:", error);
    return [];
  }
};

// Function to fetch wallet NFTs

// Function to fetch wallet transactions
export const getWalletTransactions = async (address: string): Promise<Transaction[]> => {
  try {
    const transfers = await fetchAlchemyApi("", {
      method: "alchemy_getAssetTransfers",
      params: [
        {
          fromBlock: "0x0",
          toBlock: "latest",
          fromAddress: address,
          category: ["external", "erc20", "erc721", "erc1155"],
        },
      ],
    });

    const transfersTo = await fetchAlchemyApi("", {
      method: "alchemy_getAssetTransfers",
      params: [
        {
          fromBlock: "0x0",
          toBlock: "latest",
          toAddress: address,
          category: ["external", "erc20", "erc721", "erc1155"],
        },
      ],
    });

    const allTransfers = [...transfers.transfers, ...transfersTo.transfers];

    return allTransfers.map((tx: any) => ({
      hash: tx.hash,
      timeStamp: tx.metadata.blockTimestamp
        ? Math.floor(new Date(tx.metadata.blockTimestamp).getTime() / 1000).toString()
        : "0",
      from: tx.from,
      to: tx.to,
      value: tx.value ? ethers.utils.parseEther(tx.value.toString()).toString() : "0",
      isError: "0", // Alchemy doesn't provide error status directly; assume success
    }));
  } catch (error) {
    console.error("Error fetching wallet transactions:", error);
    return [];
  }
};

// Main function to fetch all wallet data
export const getWalletData = async (address: string): Promise<WalletData> => {
  try {
    const [balance, tokens, nfts, transactions] = await Promise.all([
      getWalletBalance(address),
      getWalletTokens(address),
      getWalletNFTs(address),
      getWalletTransactions(address),
    ]);

    return {
      balance,
      tokens,
      nfts,
      transactions,
    };
  } catch (error) {
    console.error("Error fetching wallet data:", error);
    throw error;
  }
};

// Real-time polling function (optional, to be used in PortfolioPage)
export const subscribeToWalletUpdates = (
  address: string,
  callback: (data: WalletData) => void,
  interval: number = 10000 // Update every 10 seconds
) => {
  const fetchData = async () => {
    try {
      const data = await getWalletData(address);
      callback(data);
    } catch (error) {
      console.error("Error in real-time update:", error);
    }
  };

  fetchData(); // Initial fetch
  const intervalId = setInterval(fetchData, interval); // Poll every `interval` ms

  return () => clearInterval(intervalId); // Cleanup function
};

// WebSocket subscription (optional, for true real-time updates)
export const subscribeToWalletEvents = (
  address: string,
  callback: (data: WalletData) => void
) => {
  const provider = new ethers.providers.WebSocketProvider(WS_URL);

  // Listen for new transactions involving the address
  provider.on("block", async (blockNumber) => {
    try {
      const data = await getWalletData(address);
      callback(data);
    } catch (error) {
      console.error("Error in WebSocket update:", error);
    }
  });

  // Cleanup WebSocket connection
  return () => {
    provider.removeAllListeners();
    provider.destroy();
  };
};