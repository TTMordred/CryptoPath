"use client";
import { ethers } from "ethers";

const ALCHEMY_API_KEY = process.env.NEXT_PUBLIC_ALCHEMY_API_KEY || "vHX215j9gH01Qc94rX2eEAsLeYohIu9X";
const CORE_API_BASE_URL = `https://eth-mainnet.g.alchemy.com/v2/${ALCHEMY_API_KEY}`;
const NFT_API_BASE_URL = `https://eth-mainnet.g.alchemy.com/nft/v2/${ALCHEMY_API_KEY}`;

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

const fetchAlchemyApi = async (
  baseUrl: string,
  endpoint: string,
  params: Record<string, any>,
  method: "POST" | "GET" = "POST"
) => {
  try {
    let url = `${baseUrl}${endpoint}`;
    const options: RequestInit = {
      method,
      headers: { "Content-Type": "application/json" },
    };

    if (method === "GET") {
      const queryParams = new URLSearchParams(params.params).toString();
      url += `?${queryParams}`;
    } else {
      options.body = JSON.stringify({
        jsonrpc: "2.0",
        id: 1,
        method: params.method,
        params: params.params,
      });
    }

    const response = await fetch(url, options);

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HTTP error: ${response.status} - ${response.statusText} - ${errorText}`);
    }

    const data = await response.json();
    if (data.error) {
      console.error("Alchemy API error:", data.error);
      throw new Error(`API error: ${data.error.message || "Unknown error"}`);
    }

    return method === "POST" ? data.result : data; // GET trả về dữ liệu trực tiếp, POST trả về result
  } catch (error) {
    console.error("Fetch Alchemy API failed:", error);
    throw error;
  }
};

export const getWalletBalance = async (address: string): Promise<string> => {
  if (!ethers.utils.isAddress(address)) {
    console.warn("Invalid Ethereum address:", address);
    return "0";
  }
  try {
    const result = await fetchAlchemyApi(CORE_API_BASE_URL, "", {
      method: "eth_getBalance",
      params: [address, "latest"],
    }, "POST");
    const balance = ethers.utils.formatEther(result || "0");
    console.log(`Balance for ${address}: ${balance} ETH`);
    return balance;
  } catch (error) {
    console.error("Error fetching balance:", error);
    return "0";
  }
};

export const getWalletTokens = async (address: string): Promise<Token[]> => {
  if (!ethers.utils.isAddress(address)) {
    console.warn("Invalid Ethereum address:", address);
    return [];
  }
  try {
    const tokenBalances = await fetchAlchemyApi(CORE_API_BASE_URL, "", {
      method: "alchemy_getTokenBalances",
      params: [address, "DEFAULT_TOKENS"],
    }, "POST");

    if (!tokenBalances?.tokenBalances) return [];

    const tokens = await Promise.all(
      tokenBalances.tokenBalances
        .filter((token: any) => token.tokenBalance && token.tokenBalance !== "0x0")
        .map(async (token: any) => {
          const metadata = await fetchAlchemyApi(CORE_API_BASE_URL, "", {
            method: "alchemy_getTokenMetadata",
            params: [token.contractAddress],
          }, "POST");

          const balanceInWei = ethers.BigNumber.from(token.tokenBalance);
          const decimals = metadata.decimals || 18;
          const balance = ethers.utils.formatUnits(balanceInWei, decimals);

          return {
            name: metadata.name || "Unknown Token",
            symbol: metadata.symbol || "UNK",
            balance,
            tokenAddress: token.contractAddress,
            decimals,
            logo: metadata.logo || undefined,
            value: parseFloat(balance) * 0.01,
          };
        })
    );
    console.log(`Tokens for ${address}:`, tokens);
    return tokens;
  } catch (error) {
    console.error("Error fetching tokens:", error);
    return [];
  }
};

export const getWalletNFTs = async (address: string): Promise<NFT[]> => {
  if (!ethers.utils.isAddress(address)) {
    console.warn("Invalid Ethereum address:", address);
    return [];
  }
  try {
    const result = await fetchAlchemyApi(NFT_API_BASE_URL, "/getNFTs", {
      params: {
        owner: address,
        withMetadata: "true", // Chuỗi "true" vì query string yêu cầu
        pageSize: "100",
      },
    }, "GET");

    console.log("Raw NFT response from Alchemy:", result);

    if (!result || !result.ownedNfts || !Array.isArray(result.ownedNfts)) {
      console.log(`No NFTs found for ${address} or unexpected response format`);
      return [];
    }

    const nftList = result.ownedNfts.map((nft: any) => ({
      name: nft.title || nft.metadata?.name || `NFT #${nft.id?.tokenId || "Unknown"}`,
      collectionName: nft.contractMetadata?.name || "Unknown Collection",
      description: nft.description || nft.metadata?.description || "",
      tokenId: nft.id?.tokenId || "",
      contract: nft.contract?.address || "",
      imageUrl: nft.media?.[0]?.gateway || nft.metadata?.image || "",
    }));

    console.log(`Processed NFTs for ${address}:`, nftList);
    return nftList;
  } catch (error) {
    console.error("Error fetching NFTs:", error);
    return [];
  }
};

export const getWalletTransactions = async (address: string): Promise<Transaction[]> => {
  if (!ethers.utils.isAddress(address)) {
    console.warn("Invalid Ethereum address:", address);
    return [];
  }
  try {
    const transfersFrom = await fetchAlchemyApi(CORE_API_BASE_URL, "", {
      method: "alchemy_getAssetTransfers",
      params: [{
        fromBlock: "0x0",
        toBlock: "latest",
        fromAddress: address,
        category: ["external"],
        withMetadata: true,
      }],
    }, "POST");

    const transfersTo = await fetchAlchemyApi(CORE_API_BASE_URL, "", {
      method: "alchemy_getAssetTransfers",
      params: [{
        fromBlock: "0x0",
        toBlock: "latest",
        toAddress: address,
        category: ["external"],
        withMetadata: true,
      }],
    }, "POST");

    const allTransfers = [...(transfersFrom?.transfers || []), ...(transfersTo?.transfers || [])];
    if (!allTransfers.length) {
      console.log(`No transactions found for ${address}`);
      return [];
    }

    const txs = allTransfers.map((tx: any) => {
      let valueInWei = "0";
      if (tx.value) {
        const valueStr = typeof tx.value === "number" ? tx.value.toString() : tx.value;
        try {
          valueInWei = ethers.utils.parseEther(valueStr).toString();
        } catch (e) {
          console.warn(`Invalid value for tx ${tx.hash}: ${valueStr}`, e);
          valueInWei = "0";
        }
      }

      return {
        hash: tx.hash || "",
        timeStamp: tx.metadata?.blockTimestamp
          ? Math.floor(new Date(tx.metadata.blockTimestamp).getTime() / 1000).toString()
          : "0",
        from: tx.from || "",
        to: tx.to || "",
        value: valueInWei,
        isError: "0",
      };
    });
    console.log(`Transactions for ${address}:`, txs);
    return txs;
  } catch (error) {
    console.error("Error fetching transactions:", error);
    return [];
  }
};

export const getWalletData = async (address: string): Promise<WalletData> => {
  try {
    const [balance, tokens, nfts, transactions] = await Promise.all([
      getWalletBalance(address),
      getWalletTokens(address),
      getWalletNFTs(address),
      getWalletTransactions(address),
    ]);
    return { balance, tokens, nfts, transactions };
  } catch (error) {
    console.error("Error fetching wallet data:", error);
    return { balance: "0", tokens: [], nfts: [], transactions: [] };
  }
};