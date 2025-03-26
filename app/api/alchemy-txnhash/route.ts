import { NextResponse } from "next/server";

const ALCHEMY_API_KEY = process.env.ALCHEMY_API_KEY;
const ALCHEMY_API_URL = `https://eth-mainnet.g.alchemy.com/v2/${ALCHEMY_API_KEY}`;

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const hash = searchParams.get("hash");
  
  if (!hash) {
    return NextResponse.json({ error: "Transaction hash is required" }, { status: 400 });
  }

  try {
    // Get transaction details
    const txResponse = await fetch(ALCHEMY_API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 1,
        method: 'eth_getTransactionByHash',
        params: [hash]
      })
    });
    const txData = await txResponse.json();

    // Get transaction receipt
    const receiptResponse = await fetch(ALCHEMY_API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 2,
        method: 'eth_getTransactionReceipt',
        params: [hash]
      })
    });
    const receiptData = await receiptResponse.json();

    if (!txData.result || !receiptData.result) {
      return NextResponse.json({ error: "Transaction not found" }, { status: 404 });
    }

    // Get block information
    const blockResponse = await fetch(ALCHEMY_API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 3,
        method: 'eth_getBlockByHash',
        params: [txData.result.blockHash, false]
      })
    });
    const blockData = await blockResponse.json();

    // Convert hex values to decimal
    const value = parseInt(txData.result.value, 16);
    const gasPrice = parseInt(txData.result.gasPrice, 16);
    const gasUsed = parseInt(receiptData.result.gasUsed, 16);
    const gasLimit = parseInt(txData.result.gas, 16);
    const timestamp = parseInt(blockData.result.timestamp, 16);

    // Format the transaction data
    const transaction = {
      hash: txData.result.hash,
      from: txData.result.from,
      to: txData.result.to,
      value: value.toString(),
      valueInEth: (value / 1e18).toFixed(6),
      gasPrice: gasPrice.toString(),
      gasLimit: gasLimit.toString(),
      gasUsed: gasUsed.toString(),
      nonce: parseInt(txData.result.nonce, 16),
      status: receiptData.result.status === '0x1' ? "Success" : "Failed",
      timestamp: timestamp,
      blockNumber: parseInt(txData.result.blockNumber, 16),
      blockHash: txData.result.blockHash,
      confirmations: parseInt(receiptData.result.confirmations || '0', 16),
      effectiveGasPrice: parseInt(receiptData.result.effectiveGasPrice, 16).toString(),
      type: parseInt(txData.result.type, 16),
      data: txData.result.input,
      txFee: ((gasUsed * parseInt(receiptData.result.effectiveGasPrice, 16)) / 1e18).toFixed(6),
    };

    return NextResponse.json(transaction);
  } catch (error) {
    console.error("Error fetching transaction:", error);
    return NextResponse.json(
      { error: "Failed to fetch transaction details" },
      { status: 500 }
    );
  }
}