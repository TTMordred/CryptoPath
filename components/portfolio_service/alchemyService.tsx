"use client";
import { ethers } from "ethers";

const ALCHEMY_API_KEY = "vHX215j9gH01Qc94rX2eEAsLeYohIu9X";
const API_BASE_URL = `https://eth-mainnet.g.alchemy.com/v2/${ALCHEMY_API_KEY}`;

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

const fetchAlchemyApi = async (endpoint: string, params: Record<string, any>) => {
  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        jsonrpc: "2.0",
        id: 1,
        method: params.method,
        params: params.params,
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error: ${response.status} - ${response.statusText}`);
    }

    const data = await response.json();
    if (data.error) {
      console.error("Alchemy API error:", data.error);
      throw new Error(`API error: ${data.error.message || "Unknown error"}`);
    }

    return data.result;
  } catch (error) {
    console.error("Fetch Alchemy API failed:", error);
    throw error; // Ném lỗi để hàm gọi xử lý
  }
};

export const getWalletBalance = async (address: string): Promise<string> => {
  if (!ethers.utils.isAddress(address)) {
    console.warn("Invalid Ethereum address:", address);
    return "0";
  }
  try {
    const result = await fetchAlchemyApi("", {
      method: "eth_getBalance",
      params: [address, "latest"],
    });
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
    const tokenBalances = await fetchAlchemyApi("", {
      method: "alchemy_getTokenBalances",
      params: [address, "DEFAULT_TOKENS"], // Lấy danh sách token mặc định
    });

    if (!tokenBalances?.tokenBalances) return [];

    const tokens = await Promise.all(
      tokenBalances.tokenBalances
        .filter((token: any) => token.tokenBalance && token.tokenBalance !== "0x0")
        .map(async (token: any) => {
          const metadata = await fetchAlchemyApi("", {
            method: "alchemy_getTokenMetadata",
            params: [token.contractAddress],
          });

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
            value: parseFloat(balance) * 0.001, // Giá trị giả lập
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
    const nfts = await fetchAlchemyApi("", {
      method: "alchemy_getNFTs",
      params: [{ owner: address, withMetadata: true }], // Đúng cú pháp cho alchemy_getNFTs
    });

    if (!nfts?.ownedNfts) return [];

    const nftList = nfts.ownedNfts.map((nft: any) => ({
      name: nft.metadata?.name || nft.title || `NFT #${nft.id.tokenId}`,
      collectionName: nft.contract?.name || "Unknown Collection",
      description: nft.metadata?.description || nft.description || "",
      tokenId: nft.id.tokenId,
      contract: nft.contract.address,
      imageUrl: nft.metadata?.image || nft.media?.[0]?.gateway || nft.image?.thumbnailUrl,
    }));
    console.log(`NFTs for ${address}:`, nftList);
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
    const transfersFrom = await fetchAlchemyApi("", {
      method: "alchemy_getAssetTransfers",
      params: [
        {
          fromBlock: "0x0",
          toBlock: "latest",
          fromAddress: address,
          category: ["external"], // Chỉ lấy giao dịch ETH
          withMetadata: true,
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
          category: ["external"],
          withMetadata: true,
        },
      ],
    });

    const allTransfers = [...(transfersFrom?.transfers || []), ...(transfersTo?.transfers || [])];
    if (!allTransfers.length) {
      console.log(`No transactions found for ${address}`);
      return [];
    }

    const txs = allTransfers.map((tx: any) => ({
      hash: tx.hash || "",
      timeStamp:
        tx.metadata?.blockTimestamp 
          ? Math.floor(new Date(tx.metadata.blockTimestamp).getTime() / 1000).toString()
          : "0",
      from: tx.from || "",
      to: tx.to || "",
      value: tx.value ? ethers.utils.parseEther(tx.value.toString()).toString() : "0",
      isError: "0", // Alchemy không cung cấp thông tin lỗi, mặc định là 0
    }));
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