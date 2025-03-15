import { NextResponse } from "next/server";
import { TOKEN_CONTRACTS } from "@/services/cryptoService";

const ETHERSCAN_API_URL = "https://api.etherscan.io/api";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const coinId = searchParams.get("coinId");
  const page = searchParams.get("page") || "1";
  const offset = searchParams.get("offset") || "50";

  if (!coinId) {
    return NextResponse.json({ error: "Coin ID is required" }, { status: 400 });
  }

  try {
    const contractAddress = TOKEN_CONTRACTS[coinId];
    if (!contractAddress) {
      return NextResponse.json({ error: "Unsupported token" }, { status: 400 });
    }

    let url: string;
    if (coinId === 'ethereum') {
      // For ETH, fetch normal transactions
      url = `${ETHERSCAN_API_URL}?module=account&action=txlist&address=0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D&startblock=0&endblock=99999999&page=${page}&offset=${offset}&sort=desc&apikey=${process.env.ETHERSCAN_API_KEY}`;
    } else {
      // For other tokens, fetch their specific ERC20 transactions
      url = `${ETHERSCAN_API_URL}?module=account&action=tokentx&contractaddress=${contractAddress}&page=${page}&offset=${offset}&sort=desc&apikey=${process.env.ETHERSCAN_API_KEY}`;
    }

    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    if (data.status !== "1") {
      if (data.message === "No transactions found") {
        return NextResponse.json([]);
      }
      throw new Error(data.message || "Etherscan API returned an error");
    }

    const transactions = data.result.map((tx: any) => ({
      hash: tx.hash,
      from: tx.from,
      to: tx.to,
      value: coinId === 'ethereum'
        ? `${(Number(tx.value) / 1e18).toFixed(6)} ETH`
        : `${(Number(tx.value) / Math.pow(10, Number(tx.tokenDecimal))).toFixed(6)} ${tx.tokenSymbol || coinId.toUpperCase()}`,
      timestamp: Number(tx.timeStamp) * 1000,
      gasPrice: tx.gasPrice,
      gasUsed: tx.gasUsed,
      method: tx.input && tx.input !== '0x' ? 'Contract Interaction' : 'Transfer'
    }));

    return NextResponse.json(transactions);
  } catch (error) {
    console.error("Error fetching token transactions:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "An unknown error occurred" },
      { status: 500 }
    );
  }
} 