import { NextResponse } from "next/server";

const ALCHEMY_API_KEY = process.env.ALCHEMY_API_KEY;
const ALCHEMY_API_URL = `https://eth-mainnet.g.alchemy.com/v2/${ALCHEMY_API_KEY}`;

interface Transaction {
  blockHash: string;
  blockNumber: string;
  from: string;
  gas: string;
  gasPrice: string;
  hash: string;
  input: string;
  nonce: string;
  to: string;
  transactionIndex: string;
  value: string;
  type: string;
  timestamp: number;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const blockNumber = searchParams.get("blockNumber");

  if (!blockNumber) {
    return NextResponse.json(
      { error: "Block number is required" },
      { status: 400 }
    );
  }

  try {
    // First, get block data to get timestamp
    const blockResponse = await fetch(ALCHEMY_API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 1,
        method: 'eth_getBlockByNumber',
        params: [
          `0x${Number(blockNumber).toString(16)}`,
          false
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

    const timestamp = parseInt(blockData.result.timestamp, 16);

    // Get all transactions from the block
    const txnsResponse = await fetch(ALCHEMY_API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 1,
        method: 'eth_getBlockByNumber',
        params: [
          `0x${Number(blockNumber).toString(16)}`,
          true
        ]
      })
    });

    const txnsData = await txnsResponse.json();

    if (!txnsData.result || !txnsData.result.transactions) {
      return NextResponse.json(
        { error: "Failed to fetch transactions" },
        { status: 500 }
      );
    }

    const transactions: Transaction[] = txnsData.result.transactions.map((tx: any) => ({
      blockHash: tx.blockHash,
      blockNumber: parseInt(tx.blockNumber, 16).toString(),
      from: tx.from,
      gas: parseInt(tx.gas, 16).toString(),
      gasPrice: parseInt(tx.gasPrice, 16).toString(),
      hash: tx.hash,
      input: tx.input,
      nonce: parseInt(tx.nonce, 16).toString(),
      to: tx.to || '0x0', // Contract creation if no 'to' address
      transactionIndex: parseInt(tx.transactionIndex, 16).toString(),
      value: (parseInt(tx.value, 16) / 1e18).toString(), // Convert from Wei to ETH
      type: parseInt(tx.type, 16).toString(),
      timestamp: timestamp
    }));

    return NextResponse.json({
      blockNumber,
      timestamp,
      transactions,
      total: transactions.length
    });

  } catch (error) {
    console.error("Error fetching block transactions:", error);
    return NextResponse.json(
      { error: "Failed to fetch block transactions" },
      { status: 500 }
    );
  }
}