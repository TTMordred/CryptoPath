import { NextResponse } from "next/server";

const ALCHEMY_API_KEY = process.env.ALCHEMY_API_KEY;
const ALCHEMY_API_URL = `https://eth-mainnet.g.alchemy.com/v2/${ALCHEMY_API_KEY}`;

interface BlockDetails {
  number: string;
  hash: string;
  parentHash: string;
  timestamp: string;
  nonce: string;
  difficulty: string;
  gasLimit: string;
  gasUsed: string;
  miner: string;
  baseFeePerGas: string;
  extraData: string;
  transactions: string[];
  size: string;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const blockNumber = searchParams.get("blockNumber");
  const blockHash = searchParams.get("blockHash");

  if (!blockNumber && !blockHash) {
    return NextResponse.json(
      { error: "Block number or hash is required" },
      { status: 400 }
    );
  }

  try {
    const blockResponse = await fetch(ALCHEMY_API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 1,
        method: 'eth_getBlockByNumber',
        params: [
          blockNumber ? `0x${Number(blockNumber).toString(16)}` : blockHash,
          true
        ]
      })
    });

    const blockData = await blockResponse.json();

    if (!blockData.result) {
      return NextResponse.json(
        { error: "Block not found" },
        { status: 404 }
      );
    }

    const block: BlockDetails = {
      number: parseInt(blockData.result.number, 16).toString(),
      hash: blockData.result.hash,
      parentHash: blockData.result.parentHash,
      timestamp: new Date(parseInt(blockData.result.timestamp, 16) * 1000).toISOString(),
      nonce: blockData.result.nonce,
      difficulty: parseInt(blockData.result.difficulty, 16).toString(),
      gasLimit: parseInt(blockData.result.gasLimit, 16).toString(),
      gasUsed: parseInt(blockData.result.gasUsed, 16).toString(),
      miner: blockData.result.miner,
      baseFeePerGas: blockData.result.baseFeePerGas 
        ? parseInt(blockData.result.baseFeePerGas, 16).toString()
        : "0",
      extraData: blockData.result.extraData,
      transactions: blockData.result.transactions.map((tx: any) => tx.hash),
      size: parseInt(blockData.result.size, 16).toString()
    };

    return NextResponse.json(block);
  } catch (error) {
    console.error("Error fetching block details:", error);
    return NextResponse.json(
      { error: "Failed to fetch block details" },
      { status: 500 }
    );
  }
}